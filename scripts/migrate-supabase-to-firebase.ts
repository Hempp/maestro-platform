/**
 * DATA MIGRATION SCRIPT: Supabase -> Firebase
 *
 * Migrates data from Supabase (PostgreSQL) to Firebase (Firestore) with:
 * - Batch writes for efficiency (500 docs per batch)
 * - Retry logic with exponential backoff
 * - Dry-run mode for preview
 * - Progress logging
 * - snake_case to camelCase conversion
 * - Proper timestamp handling
 *
 * Run with: npx tsx scripts/migrate-supabase-to-firebase.ts
 * Dry run:  npx tsx scripts/migrate-supabase-to-firebase.ts --dry-run
 *
 * Prerequisites:
 * - SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_KEY or SUPABASE_SERVICE_ROLE_KEY
 * - Firebase Admin credentials (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as admin from 'firebase-admin';
import { Timestamp, Firestore, WriteBatch } from 'firebase-admin/firestore';

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;

const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL;
const FIREBASE_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

// Migration settings
const BATCH_SIZE = 500;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// Parse command line arguments
const DRY_RUN = process.argv.includes('--dry-run');

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface MigrationResult {
  table: string;
  collection: string;
  recordsProcessed: number;
  success: boolean;
  error?: string;
  duration: number;
}

interface TableMapping {
  supabaseTable: string;
  firestoreCollection: string;
  idField?: string; // Field to use as document ID, defaults to 'id'
  transform?: (record: Record<string, unknown>) => Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Convert snake_case to camelCase
 */
function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Convert all object keys from snake_case to camelCase recursively
 */
function convertKeysToCamelCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const camelKey = toCamelCase(key);

    if (value === null || value === undefined) {
      result[camelKey] = value;
    } else if (Array.isArray(value)) {
      result[camelKey] = value.map(item =>
        typeof item === 'object' && item !== null
          ? convertKeysToCamelCase(item as Record<string, unknown>)
          : item
      );
    } else if (typeof value === 'object' && !(value instanceof Date)) {
      result[camelKey] = convertKeysToCamelCase(value as Record<string, unknown>);
    } else {
      result[camelKey] = value;
    }
  }

  return result;
}

/**
 * Convert ISO date string or Date object to Firestore Timestamp
 */
function toTimestamp(value: string | Date | null | undefined): Timestamp | null {
  if (!value) return null;

  try {
    const date = typeof value === 'string' ? new Date(value) : value;
    if (isNaN(date.getTime())) return null;
    return Timestamp.fromDate(date);
  } catch {
    return null;
  }
}

/**
 * Convert timestamp fields in an object
 */
function convertTimestamps(obj: Record<string, unknown>, timestampFields: string[]): Record<string, unknown> {
  const result = { ...obj };

  for (const field of timestampFields) {
    if (field in result) {
      result[field] = toTimestamp(result[field] as string | Date | null);
    }
  }

  return result;
}

/**
 * Logging utility with timestamp
 */
function log(message: string, data?: unknown): void {
  const timestamp = new Date().toISOString();
  const prefix = DRY_RUN ? '[DRY-RUN]' : '[MIGRATE]';

  if (data !== undefined) {
    console.log(`${timestamp} ${prefix} ${message}:`, data);
  } else {
    console.log(`${timestamp} ${prefix} ${message}`);
  }
}

/**
 * Error logging utility
 */
function logError(message: string, error: unknown): void {
  const timestamp = new Date().toISOString();
  const prefix = DRY_RUN ? '[DRY-RUN]' : '[MIGRATE]';
  console.error(`${timestamp} ${prefix} ERROR: ${message}`, error instanceof Error ? error.message : error);
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry wrapper with exponential backoff
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  maxRetries: number = MAX_RETRIES
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
        log(`${operationName} failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TABLE MAPPINGS WITH TRANSFORMATIONS
// ═══════════════════════════════════════════════════════════════════════════════

const TIMESTAMP_FIELDS = [
  'createdAt', 'updatedAt', 'lastActivityAt', 'completedAt', 'verifiedAt',
  'issuedAt', 'currentPeriodStart', 'currentPeriodEnd', 'cancelledAt',
  'submittedAt', 'reviewedAt', 'paidAt', 'scheduledAt', 'startTime', 'endTime',
  'enrolledAt', 'startedAt', 'endedAt'
];

const TABLE_MAPPINGS: TableMapping[] = [
  {
    supabaseTable: 'users',
    firestoreCollection: 'users',
    idField: 'id',
    transform: (record) => ({
      email: record.email,
      fullName: record.full_name,
      avatarUrl: record.avatar_url,
      tier: record.tier,
      walletAddress: record.wallet_address,
      role: record.role || 'user',
      onboardingCompleted: record.onboarding_completed || false,
      stripeCustomerId: record.stripe_customer_id,
      createdAt: toTimestamp(record.created_at as string) || Timestamp.now(),
      updatedAt: toTimestamp(record.updated_at as string) || Timestamp.now(),
    })
  },
  {
    supabaseTable: 'learner_profiles',
    firestoreCollection: 'learnerProfiles',
    idField: 'user_id',
    transform: (record) => ({
      userId: record.user_id,
      tier: record.tier,
      currentPath: record.current_path || 'foundation',
      interactionDna: record.interaction_dna || {},
      struggleScore: record.struggle_score ?? 50,
      totalLearningTime: record.total_learning_time || 0,
      currentStreak: record.current_streak || 0,
      longestStreak: record.longest_streak || 0,
      lastActivityAt: toTimestamp(record.last_activity_at as string),
      createdAt: toTimestamp(record.created_at as string) || Timestamp.now(),
      updatedAt: toTimestamp(record.updated_at as string) || Timestamp.now(),
    })
  },
  {
    supabaseTable: 'aku_progress',
    firestoreCollection: 'akuProgress',
    idField: 'id',
    transform: (record) => ({
      userId: record.user_id,
      akuId: record.aku_id,
      status: record.status,
      hintsUsed: record.hints_used || 0,
      attempts: record.attempts || 1,
      timeSpent: record.time_spent || 0,
      struggleScore: record.struggle_score ?? 50,
      completedAt: toTimestamp(record.completed_at as string),
      verifiedAt: toTimestamp(record.verified_at as string),
      workflowSnapshot: record.workflow_snapshot || null,
      createdAt: toTimestamp(record.created_at as string) || Timestamp.now(),
      updatedAt: toTimestamp(record.updated_at as string) || Timestamp.now(),
    })
  },
  {
    supabaseTable: 'chat_sessions',
    firestoreCollection: 'chatSessions',
    idField: 'id',
    transform: (record) => ({
      userId: record.user_id,
      sessionId: record.session_id || record.id,
      title: record.title,
      messages: record.messages || [],
      context: record.context || {},
      path: record.path,
      akuId: record.aku_id,
      status: record.status || 'active',
      createdAt: toTimestamp(record.created_at as string) || Timestamp.now(),
      updatedAt: toTimestamp(record.updated_at as string) || Timestamp.now(),
    })
  },
  {
    supabaseTable: 'certificates',
    firestoreCollection: 'certificates',
    idField: 'id',
    transform: (record) => ({
      userId: record.user_id,
      courseId: record.course_id,
      certificateType: record.certificate_type,
      tokenId: record.token_id,
      contractAddress: record.contract_address,
      transactionHash: record.transaction_hash,
      ipfsHash: record.ipfs_hash,
      metadata: record.metadata || {},
      issuedAt: toTimestamp(record.issued_at as string),
      verifiedAt: toTimestamp(record.verified_at as string),
      createdAt: toTimestamp(record.created_at as string) || Timestamp.now(),
      updatedAt: toTimestamp(record.updated_at as string) || Timestamp.now(),
    })
  },
  {
    supabaseTable: 'subscriptions',
    firestoreCollection: 'subscriptions',
    idField: 'id',
    transform: (record) => ({
      userId: record.user_id,
      planId: record.plan_id,
      status: record.status,
      billingCycle: record.billing_cycle,
      stripeCustomerId: record.stripe_customer_id,
      stripeSubscriptionId: record.stripe_subscription_id,
      stripePriceId: record.stripe_price_id,
      stripeSessionId: record.stripe_session_id,
      amount: record.amount,
      currency: record.currency,
      currentPeriodStart: toTimestamp(record.current_period_start as string),
      currentPeriodEnd: toTimestamp(record.current_period_end as string),
      cancelAtPeriodEnd: record.cancel_at_period_end || false,
      cancelledAt: toTimestamp(record.cancelled_at as string),
      createdAt: toTimestamp(record.created_at as string) || Timestamp.now(),
      updatedAt: toTimestamp(record.updated_at as string) || Timestamp.now(),
    })
  },
  {
    supabaseTable: 'certification_submissions',
    firestoreCollection: 'certificationSubmissions',
    idField: 'id',
    transform: (record) => ({
      userId: record.user_id,
      path: record.path,
      projectTitle: record.project_title,
      projectDescription: record.project_description,
      githubRepoUrl: record.github_repo_url,
      architectureUrl: record.architecture_url,
      demoVideoUrl: record.demo_video_url,
      liveDemoUrl: record.live_demo_url,
      roiDocument: record.roi_document,
      documentationUrl: record.documentation_url,
      productionLogs: record.production_logs,
      scores: record.scores || {},
      totalScore: record.total_score,
      status: record.status,
      reviewedBy: record.reviewed_by,
      reviewerNotes: record.reviewer_notes,
      paidAt: toTimestamp(record.paid_at as string),
      submittedAt: toTimestamp(record.submitted_at as string),
      reviewedAt: toTimestamp(record.reviewed_at as string),
      createdAt: toTimestamp(record.created_at as string) || Timestamp.now(),
      updatedAt: toTimestamp(record.updated_at as string) || Timestamp.now(),
    })
  },
  {
    supabaseTable: 'live_courses',
    firestoreCollection: 'liveCourses',
    idField: 'id',
    transform: (record) => ({
      title: record.title,
      slug: record.slug,
      description: record.description,
      longDescription: record.long_description,
      instructorId: record.instructor_id,
      instructorName: record.instructor_name,
      instructorBio: record.instructor_bio,
      instructorAvatar: record.instructor_avatar,
      thumbnailUrl: record.thumbnail_url,
      category: record.category,
      level: record.level,
      duration: record.duration,
      maxStudents: record.max_students,
      currentStudents: record.current_students || 0,
      price: record.price,
      currency: record.currency || 'USD',
      status: record.status || 'draft',
      prerequisites: record.prerequisites || [],
      learningOutcomes: record.learning_outcomes || [],
      syllabus: record.syllabus || [],
      tags: record.tags || [],
      featured: record.featured || false,
      rating: record.rating,
      reviewCount: record.review_count || 0,
      createdAt: toTimestamp(record.created_at as string) || Timestamp.now(),
      updatedAt: toTimestamp(record.updated_at as string) || Timestamp.now(),
    })
  },
  {
    supabaseTable: 'live_sessions',
    firestoreCollection: 'liveSessions',
    idField: 'id',
    transform: (record) => ({
      courseId: record.course_id,
      title: record.title,
      description: record.description,
      sessionNumber: record.session_number,
      scheduledAt: toTimestamp(record.scheduled_at as string),
      startTime: toTimestamp(record.start_time as string),
      endTime: toTimestamp(record.end_time as string),
      duration: record.duration,
      meetingUrl: record.meeting_url,
      recordingUrl: record.recording_url,
      status: record.status || 'scheduled',
      maxAttendees: record.max_attendees,
      currentAttendees: record.current_attendees || 0,
      materials: record.materials || [],
      notes: record.notes,
      createdAt: toTimestamp(record.created_at as string) || Timestamp.now(),
      updatedAt: toTimestamp(record.updated_at as string) || Timestamp.now(),
    })
  },
  {
    supabaseTable: 'course_enrollments',
    firestoreCollection: 'courseEnrollments',
    idField: 'id',
    transform: (record) => ({
      userId: record.user_id,
      courseId: record.course_id,
      status: record.status || 'enrolled',
      enrolledAt: toTimestamp(record.enrolled_at as string) || Timestamp.now(),
      startedAt: toTimestamp(record.started_at as string),
      completedAt: toTimestamp(record.completed_at as string),
      progress: record.progress || 0,
      lastAccessedAt: toTimestamp(record.last_accessed_at as string),
      paymentId: record.payment_id,
      paymentStatus: record.payment_status,
      certificateId: record.certificate_id,
      createdAt: toTimestamp(record.created_at as string) || Timestamp.now(),
      updatedAt: toTimestamp(record.updated_at as string) || Timestamp.now(),
    })
  },
  {
    supabaseTable: 'session_enrollments',
    firestoreCollection: 'sessionEnrollments',
    idField: 'id',
    transform: (record) => ({
      userId: record.user_id,
      sessionId: record.session_id,
      courseEnrollmentId: record.course_enrollment_id,
      status: record.status || 'registered',
      attendedAt: toTimestamp(record.attended_at as string),
      joinedAt: toTimestamp(record.joined_at as string),
      leftAt: toTimestamp(record.left_at as string),
      attendanceDuration: record.attendance_duration || 0,
      feedback: record.feedback,
      rating: record.rating,
      createdAt: toTimestamp(record.created_at as string) || Timestamp.now(),
      updatedAt: toTimestamp(record.updated_at as string) || Timestamp.now(),
    })
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// MIGRATION LOGIC
// ═══════════════════════════════════════════════════════════════════════════════

class DataMigrator {
  private supabase: SupabaseClient;
  private firestore: Firestore;
  private results: MigrationResult[] = [];

  constructor() {
    // Validate environment variables
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      throw new Error(
        'Supabase credentials not configured. Set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables.'
      );
    }

    if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
      throw new Error(
        'Firebase credentials not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables.'
      );
    }

    // Initialize Supabase client with service role (bypasses RLS)
    this.supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Initialize Firebase Admin
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: FIREBASE_PROJECT_ID,
          clientEmail: FIREBASE_CLIENT_EMAIL,
          privateKey: FIREBASE_PRIVATE_KEY,
        }),
      });
    }

    this.firestore = admin.firestore();
  }

  /**
   * Fetch all records from a Supabase table with pagination
   */
  private async fetchAllRecords(tableName: string): Promise<Record<string, unknown>[]> {
    const allRecords: Record<string, unknown>[] = [];
    const pageSize = 1000;
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await withRetry(
        () => this.supabase
          .from(tableName)
          .select('*')
          .range(offset, offset + pageSize - 1),
        `Fetch ${tableName} (offset ${offset})`
      );

      if (error) {
        throw new Error(`Failed to fetch from ${tableName}: ${error.message}`);
      }

      if (!data || data.length === 0) {
        hasMore = false;
      } else {
        allRecords.push(...data);
        offset += pageSize;
        hasMore = data.length === pageSize;
      }
    }

    return allRecords;
  }

  /**
   * Write records to Firestore in batches
   */
  private async writeToFirestore(
    collection: string,
    records: { id: string; data: Record<string, unknown> }[]
  ): Promise<void> {
    if (DRY_RUN) {
      log(`Would write ${records.length} documents to '${collection}'`);
      if (records.length > 0) {
        log(`Sample document:`, JSON.stringify(records[0], null, 2));
      }
      return;
    }

    let batch = this.firestore.batch();
    let batchCount = 0;
    let totalWritten = 0;

    for (const record of records) {
      const docRef = this.firestore.collection(collection).doc(record.id);
      batch.set(docRef, record.data);
      batchCount++;

      if (batchCount >= BATCH_SIZE) {
        await withRetry(
          () => batch.commit(),
          `Commit batch to ${collection}`
        );
        totalWritten += batchCount;
        log(`Committed batch to '${collection}'`, `${totalWritten}/${records.length}`);
        batch = this.firestore.batch();
        batchCount = 0;
      }
    }

    // Commit remaining records
    if (batchCount > 0) {
      await withRetry(
        () => batch.commit(),
        `Commit final batch to ${collection}`
      );
      totalWritten += batchCount;
      log(`Committed final batch to '${collection}'`, `${totalWritten}/${records.length}`);
    }
  }

  /**
   * Migrate a single table
   */
  private async migrateTable(mapping: TableMapping): Promise<MigrationResult> {
    const startTime = Date.now();
    const { supabaseTable, firestoreCollection, idField = 'id', transform } = mapping;

    log(`Starting migration: ${supabaseTable} -> ${firestoreCollection}`);

    try {
      // Fetch all records from Supabase
      const records = await this.fetchAllRecords(supabaseTable);

      if (records.length === 0) {
        log(`No records found in '${supabaseTable}'`);
        return {
          table: supabaseTable,
          collection: firestoreCollection,
          recordsProcessed: 0,
          success: true,
          duration: Date.now() - startTime,
        };
      }

      log(`Found ${records.length} records in '${supabaseTable}'`);

      // Transform records
      const transformedRecords = records.map(record => {
        const id = String(record[idField] || record.id || crypto.randomUUID());
        const data = transform
          ? transform(record)
          : convertKeysToCamelCase(record);

        return { id, data };
      });

      // Write to Firestore
      await this.writeToFirestore(firestoreCollection, transformedRecords);

      const duration = Date.now() - startTime;
      log(`Completed migration: ${supabaseTable} -> ${firestoreCollection} (${records.length} records, ${duration}ms)`);

      return {
        table: supabaseTable,
        collection: firestoreCollection,
        recordsProcessed: records.length,
        success: true,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      logError(`Failed to migrate ${supabaseTable}`, error);

      return {
        table: supabaseTable,
        collection: firestoreCollection,
        recordsProcessed: 0,
        success: false,
        error: errorMessage,
        duration,
      };
    }
  }

  /**
   * Run the full migration
   */
  async run(): Promise<void> {
    console.log('\n' + '='.repeat(70));
    console.log('  SUPABASE -> FIREBASE DATA MIGRATION');
    console.log('  ' + (DRY_RUN ? 'DRY RUN MODE - No data will be written' : 'LIVE MODE'));
    console.log('='.repeat(70) + '\n');

    const overallStart = Date.now();

    // Migrate tables in order (respecting dependencies)
    for (const mapping of TABLE_MAPPINGS) {
      const result = await this.migrateTable(mapping);
      this.results.push(result);
    }

    // Print summary
    this.printSummary(Date.now() - overallStart);
  }

  /**
   * Print migration summary
   */
  private printSummary(totalDuration: number): void {
    console.log('\n' + '='.repeat(70));
    console.log('  MIGRATION SUMMARY');
    console.log('='.repeat(70) + '\n');

    let totalRecords = 0;
    let successCount = 0;
    let failureCount = 0;

    console.log('Table'.padEnd(30) + 'Collection'.padEnd(25) + 'Records'.padEnd(10) + 'Status');
    console.log('-'.repeat(70));

    for (const result of this.results) {
      totalRecords += result.recordsProcessed;
      if (result.success) {
        successCount++;
      } else {
        failureCount++;
      }

      const status = result.success ? 'OK' : `FAILED: ${result.error}`;
      console.log(
        result.table.padEnd(30) +
        result.collection.padEnd(25) +
        String(result.recordsProcessed).padEnd(10) +
        status
      );
    }

    console.log('-'.repeat(70));
    console.log(`\nTotal: ${totalRecords} records processed`);
    console.log(`Success: ${successCount} tables`);
    if (failureCount > 0) {
      console.log(`Failed: ${failureCount} tables`);
    }
    console.log(`Duration: ${(totalDuration / 1000).toFixed(2)}s`);

    if (DRY_RUN) {
      console.log('\n[DRY-RUN] No data was written. Run without --dry-run to perform actual migration.');
    }

    console.log('\n' + '='.repeat(70) + '\n');

    // Exit with error code if any migrations failed
    if (failureCount > 0) {
      process.exit(1);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN ENTRY POINT
// ═══════════════════════════════════════════════════════════════════════════════

async function main(): Promise<void> {
  try {
    const migrator = new DataMigrator();
    await migrator.run();
  } catch (error) {
    console.error('\nMigration failed to start:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
