/**
 * Maestro Platform - Firebase Cloud Functions
 *
 * NEXUS-PRIME EDGE-RUNNER Agent
 * Serverless backend functions for user management, progress tracking,
 * streak calculations, and certificate notifications.
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK
admin.initializeApp();

const db = admin.firestore();

// ============================================================================
// INTERFACES
// ============================================================================

interface UserDocument {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: "learner" | "instructor" | "admin";
  tier: "student" | "pro" | "enterprise";
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
}

interface LearnerProfile {
  uid: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityAt: admin.firestore.Timestamp | null;
  totalXp: number;
  completedModules: number;
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
}

interface AkuProgress {
  uid: string;
  akuId: string;
  status: "not_started" | "in_progress" | "completed";
  xpEarned: number;
  completedAt: admin.firestore.Timestamp | null;
  updatedAt: admin.firestore.Timestamp;
}

interface Certificate {
  uid: string;
  courseId: string;
  courseName: string;
  issuedAt: admin.firestore.Timestamp;
  certificateUrl: string;
}

interface Notification {
  uid: string;
  type: "certificate" | "achievement" | "streak" | "system";
  title: string;
  body: string;
  data: Record<string, unknown>;
  read: boolean;
  createdAt: admin.firestore.Timestamp;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate if the streak should be incremented based on last activity
 */
function shouldIncrementStreak(
  lastActivityAt: admin.firestore.Timestamp | null
): boolean {
  if (!lastActivityAt) {
    return true; // First activity, start streak
  }

  const now = new Date();
  const lastActivity = lastActivityAt.toDate();
  const hoursSinceLastActivity =
    (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);

  // Streak continues if last activity was within 24-48 hours
  // (more than 24 hours ago but less than 48 hours = new day, increment)
  // If same day, don't increment again
  const lastActivityDate = lastActivity.toISOString().split("T")[0];
  const todayDate = now.toISOString().split("T")[0];

  return lastActivityDate !== todayDate && hoursSinceLastActivity < 48;
}

/**
 * Check if streak should be reset (more than 48 hours since last activity)
 */
function shouldResetStreak(
  lastActivityAt: admin.firestore.Timestamp | null
): boolean {
  if (!lastActivityAt) {
    return false;
  }

  const now = new Date();
  const lastActivity = lastActivityAt.toDate();
  const hoursSinceLastActivity =
    (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);

  return hoursSinceLastActivity > 48;
}

// ============================================================================
// AUTH TRIGGERS
// ============================================================================

/**
 * onUserCreate - Auth Trigger
 *
 * When a user signs up via Firebase Auth, automatically:
 * 1. Create their user document in Firestore with default fields
 * 2. Create their learnerProfile document with initial values
 */
export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  const { uid, email, displayName, photoURL } = user;

  functions.logger.info(`Creating user documents for: ${uid}`, {
    email,
    displayName,
  });

  const now = admin.firestore.Timestamp.now();

  try {
    // Create user document with default fields
    const userDoc: UserDocument = {
      uid,
      email: email || null,
      displayName: displayName || null,
      photoURL: photoURL || null,
      role: "learner",
      tier: "student",
      createdAt: now,
      updatedAt: now,
    };

    // Create learner profile with initial values
    const learnerProfile: LearnerProfile = {
      uid,
      currentStreak: 0,
      longestStreak: 0,
      lastActivityAt: null,
      totalXp: 0,
      completedModules: 0,
      createdAt: now,
      updatedAt: now,
    };

    // Use batch write for atomicity
    const batch = db.batch();

    const userRef = db.collection("users").doc(uid);
    const learnerProfileRef = db.collection("learnerProfiles").doc(uid);

    batch.set(userRef, userDoc);
    batch.set(learnerProfileRef, learnerProfile);

    await batch.commit();

    functions.logger.info(`Successfully created documents for user: ${uid}`);

    return { success: true, uid };
  } catch (error) {
    functions.logger.error(`Error creating user documents for: ${uid}`, error);
    throw new functions.https.HttpsError(
      "internal",
      `Failed to create user documents: ${error}`
    );
  }
});

/**
 * onUserDelete - Auth Trigger (Optional cleanup)
 *
 * Clean up user data when account is deleted
 */
export const onUserDelete = functions.auth.user().onDelete(async (user) => {
  const { uid } = user;

  functions.logger.info(`Cleaning up data for deleted user: ${uid}`);

  try {
    const batch = db.batch();

    // Delete user document
    batch.delete(db.collection("users").doc(uid));

    // Delete learner profile
    batch.delete(db.collection("learnerProfiles").doc(uid));

    // Note: You may want to keep progress data for analytics
    // or implement a soft delete strategy

    await batch.commit();

    functions.logger.info(`Successfully cleaned up data for user: ${uid}`);

    return { success: true, uid };
  } catch (error) {
    functions.logger.error(`Error cleaning up user data for: ${uid}`, error);
    throw new functions.https.HttpsError(
      "internal",
      `Failed to clean up user data: ${error}`
    );
  }
});

// ============================================================================
// FIRESTORE TRIGGERS
// ============================================================================

/**
 * onAkuProgressUpdate - Firestore Trigger
 *
 * When akuProgress document is updated to status 'completed':
 * 1. Update the learnerProfile to increment streak
 * 2. Update lastActivityAt
 * 3. Add XP to totalXp
 * 4. Update longest streak if current exceeds it
 */
export const onAkuProgressUpdate = functions.firestore
  .document("akuProgress/{progressId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data() as AkuProgress;
    const after = change.after.data() as AkuProgress;

    // Only process when status changes to 'completed'
    if (before.status === "completed" || after.status !== "completed") {
      functions.logger.info(
        `Skipping - status not changed to completed: ${context.params.progressId}`
      );
      return null;
    }

    const { uid, xpEarned } = after;

    functions.logger.info(`Processing completion for user: ${uid}`, {
      progressId: context.params.progressId,
      xpEarned,
    });

    try {
      const learnerProfileRef = db.collection("learnerProfiles").doc(uid);
      const learnerProfileDoc = await learnerProfileRef.get();

      if (!learnerProfileDoc.exists) {
        functions.logger.error(`Learner profile not found for user: ${uid}`);
        throw new functions.https.HttpsError(
          "not-found",
          `Learner profile not found for user: ${uid}`
        );
      }

      const learnerProfile = learnerProfileDoc.data() as LearnerProfile;
      const now = admin.firestore.Timestamp.now();

      // Determine streak updates
      let newStreak = learnerProfile.currentStreak;

      if (shouldResetStreak(learnerProfile.lastActivityAt)) {
        // Streak broken, start fresh
        newStreak = 1;
        functions.logger.info(`Streak reset for user: ${uid}`);
      } else if (shouldIncrementStreak(learnerProfile.lastActivityAt)) {
        // Continue streak
        newStreak = learnerProfile.currentStreak + 1;
        functions.logger.info(
          `Streak incremented for user: ${uid}, new streak: ${newStreak}`
        );
      }
      // else: Same day activity, don't increment

      // Update longest streak if exceeded
      const longestStreak = Math.max(learnerProfile.longestStreak, newStreak);

      // Calculate new XP
      const totalXp = learnerProfile.totalXp + (xpEarned || 0);

      // Update learner profile
      await learnerProfileRef.update({
        currentStreak: newStreak,
        longestStreak,
        lastActivityAt: now,
        totalXp,
        completedModules: admin.firestore.FieldValue.increment(1),
        updatedAt: now,
      });

      functions.logger.info(`Updated learner profile for user: ${uid}`, {
        newStreak,
        longestStreak,
        totalXp,
      });

      return { success: true, uid, newStreak, totalXp };
    } catch (error) {
      functions.logger.error(
        `Error processing aku progress update for: ${uid}`,
        error
      );
      throw new functions.https.HttpsError(
        "internal",
        `Failed to process progress update: ${error}`
      );
    }
  });

/**
 * onCertificateCreate - Firestore Trigger
 *
 * When a certificate is created, send a notification to the user
 */
export const onCertificateCreate = functions.firestore
  .document("certificates/{certificateId}")
  .onCreate(async (snapshot, context) => {
    const certificate = snapshot.data() as Certificate;
    const { uid, courseName, certificateUrl } = certificate;

    functions.logger.info(`Processing certificate creation for user: ${uid}`, {
      certificateId: context.params.certificateId,
      courseName,
    });

    try {
      const now = admin.firestore.Timestamp.now();

      // Create notification document
      const notification: Notification = {
        uid,
        type: "certificate",
        title: "Certificate Earned!",
        body: `Congratulations! You've earned a certificate for completing "${courseName}".`,
        data: {
          certificateId: context.params.certificateId,
          courseId: certificate.courseId,
          courseName,
          certificateUrl,
        },
        read: false,
        createdAt: now,
      };

      await db.collection("notifications").add(notification);

      functions.logger.info(`Notification created for user: ${uid}`);

      // Optional: Send push notification if user has FCM token
      const userDoc = await db.collection("users").doc(uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        if (userData?.fcmToken) {
          try {
            await admin.messaging().send({
              token: userData.fcmToken,
              notification: {
                title: notification.title,
                body: notification.body,
              },
              data: {
                type: "certificate",
                certificateId: context.params.certificateId,
              },
            });
            functions.logger.info(`Push notification sent to user: ${uid}`);
          } catch (pushError) {
            // Don't fail if push notification fails
            functions.logger.warn(
              `Failed to send push notification to user: ${uid}`,
              pushError
            );
          }
        }
      }

      return { success: true, uid, certificateId: context.params.certificateId };
    } catch (error) {
      functions.logger.error(
        `Error creating notification for certificate: ${context.params.certificateId}`,
        error
      );
      throw new functions.https.HttpsError(
        "internal",
        `Failed to create notification: ${error}`
      );
    }
  });

// ============================================================================
// SCHEDULED FUNCTIONS
// ============================================================================

/**
 * dailyStreakReset - Scheduled Function
 *
 * Runs daily at midnight UTC to:
 * 1. Check all learnerProfiles where lastActivityAt is more than 48 hours ago
 * 2. Reset their currentStreak to 0
 *
 * Note: Using 48 hours to give users grace period across timezones
 */
export const dailyStreakReset = functions.pubsub
  .schedule("0 0 * * *") // Every day at midnight UTC
  .timeZone("UTC")
  .onRun(async (context) => {
    functions.logger.info("Starting daily streak reset job", {
      executionTime: context.timestamp,
    });

    try {
      const now = new Date();
      // 48 hours ago threshold for streak reset
      const thresholdTime = new Date(now.getTime() - 48 * 60 * 60 * 1000);
      const thresholdTimestamp = admin.firestore.Timestamp.fromDate(thresholdTime);

      // Query learner profiles with expired streaks
      const expiredProfilesQuery = await db
        .collection("learnerProfiles")
        .where("currentStreak", ">", 0)
        .where("lastActivityAt", "<", thresholdTimestamp)
        .get();

      if (expiredProfilesQuery.empty) {
        functions.logger.info("No expired streaks found");
        return null;
      }

      functions.logger.info(
        `Found ${expiredProfilesQuery.size} profiles with expired streaks`
      );

      // Process in batches of 500 (Firestore batch limit)
      const batchSize = 500;
      const profiles = expiredProfilesQuery.docs;
      let processedCount = 0;

      for (let i = 0; i < profiles.length; i += batchSize) {
        const batch = db.batch();
        const batchProfiles = profiles.slice(i, i + batchSize);

        for (const doc of batchProfiles) {
          batch.update(doc.ref, {
            currentStreak: 0,
            updatedAt: admin.firestore.Timestamp.now(),
          });
        }

        await batch.commit();
        processedCount += batchProfiles.length;

        functions.logger.info(
          `Processed batch: ${processedCount}/${profiles.length}`
        );
      }

      functions.logger.info(
        `Daily streak reset complete. Reset ${processedCount} profiles.`
      );

      return { success: true, resetCount: processedCount };
    } catch (error) {
      functions.logger.error("Error in daily streak reset job", error);
      throw new functions.https.HttpsError(
        "internal",
        `Failed to reset streaks: ${error}`
      );
    }
  });

/**
 * weeklyStreakReminder - Scheduled Function (Optional)
 *
 * Sends reminder notifications to users who haven't been active in 24 hours
 * but still have an active streak
 */
export const weeklyStreakReminder = functions.pubsub
  .schedule("0 18 * * *") // Every day at 6 PM UTC
  .timeZone("UTC")
  .onRun(async (context) => {
    functions.logger.info("Starting streak reminder job", {
      executionTime: context.timestamp,
    });

    try {
      const now = new Date();
      // 24 hours ago - users at risk of losing streak
      const warningThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      // 40 hours ago - don't warn if they're about to lose it anyway
      const maxThreshold = new Date(now.getTime() - 40 * 60 * 60 * 1000);

      const warningTimestamp = admin.firestore.Timestamp.fromDate(warningThreshold);
      const maxTimestamp = admin.firestore.Timestamp.fromDate(maxThreshold);

      // Query learner profiles at risk
      const atRiskQuery = await db
        .collection("learnerProfiles")
        .where("currentStreak", ">", 0)
        .where("lastActivityAt", "<", warningTimestamp)
        .where("lastActivityAt", ">", maxTimestamp)
        .get();

      if (atRiskQuery.empty) {
        functions.logger.info("No at-risk streaks found");
        return null;
      }

      functions.logger.info(
        `Found ${atRiskQuery.size} profiles at risk of losing streak`
      );

      const notificationTime = admin.firestore.Timestamp.now();
      const batch = db.batch();

      for (const doc of atRiskQuery.docs) {
        const profile = doc.data() as LearnerProfile;

        const notification: Notification = {
          uid: profile.uid,
          type: "streak",
          title: "Keep your streak alive!",
          body: `You have a ${profile.currentStreak}-day streak. Complete a lesson today to keep it going!`,
          data: {
            currentStreak: profile.currentStreak,
          },
          read: false,
          createdAt: notificationTime,
        };

        const notificationRef = db.collection("notifications").doc();
        batch.set(notificationRef, notification);
      }

      await batch.commit();

      functions.logger.info(
        `Streak reminder job complete. Sent ${atRiskQuery.size} reminders.`
      );

      return { success: true, remindersSent: atRiskQuery.size };
    } catch (error) {
      functions.logger.error("Error in streak reminder job", error);
      throw new functions.https.HttpsError(
        "internal",
        `Failed to send streak reminders: ${error}`
      );
    }
  });
