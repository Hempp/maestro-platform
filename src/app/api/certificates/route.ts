/**
 * CERTIFICATES API (Firebase)
 * Manage SBT certificates and verification
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import { sendCertificateEmail } from '@/lib/email/resend';

// GET: Fetch user's certificates
export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const auth = getAdminAuth();
    const db = getAdminDb();

    const decodedClaims = await auth.verifySessionCookie(session, true);
    const userId = decodedClaims.uid;

    const certificatesQuery = await db
      .collection('certificates')
      .where('userId', '==', userId)
      .orderBy('issuedAt', 'desc')
      .get();

    const certificates = certificatesQuery.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ certificates });
  } catch (error) {
    console.error('Certificates API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch certificates' },
      { status: 500 }
    );
  }
}

// POST: Issue a new certificate (after capstone completion)
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const auth = getAdminAuth();
    const db = getAdminDb();

    const decodedClaims = await auth.verifySessionCookie(session, true);
    const userId = decodedClaims.uid;

    const body = await request.json();
    const { certificateType: rawType, walletAddress } = body;

    if (!rawType || !['student', 'employee', 'owner'].includes(rawType)) {
      return NextResponse.json(
        { error: 'Invalid certificate type' },
        { status: 400 }
      );
    }

    const certificateType = rawType as 'student' | 'employee' | 'owner';

    // Verify user has completed required AKUs for this certificate
    const progressQuery = await db
      .collection('akuProgress')
      .where('userId', '==', userId)
      .where('status', '==', 'verified')
      .get();

    interface ProgressRecord {
      timeSpent: number | null;
      hintsUsed: number | null;
      struggleScore: number | null;
    }

    const progress: ProgressRecord[] = progressQuery.docs.map(doc => doc.data() as ProgressRecord);
    const verifiedCount = progress.length;
    const requiredAkus = {
      student: 10,
      employee: 15,
      owner: 20,
    };

    if (verifiedCount < requiredAkus[certificateType]) {
      return NextResponse.json(
        {
          error: 'Not enough verified AKUs',
          required: requiredAkus[certificateType],
          completed: verifiedCount,
        },
        { status: 400 }
      );
    }

    // Calculate certificate metadata
    const totalTimeSpent = progress.reduce((sum, p) => sum + (p.timeSpent || 0), 0);
    const totalHintsUsed = progress.reduce((sum, p) => sum + (p.hintsUsed || 0), 0);
    const averageStruggleScore = progress.length > 0
      ? Math.round(progress.reduce((sum, p) => sum + (p.struggleScore || 50), 0) / progress.length)
      : 50;

    const metadata = {
      certificationName: getCertificateName(certificateType),
      designation: getCertificateDesignation(certificateType),
      akusCompleted: verifiedCount,
      totalLearningTime: Math.round(totalTimeSpent / 60), // Convert to hours
      totalHintsUsed,
      struggleScore: averageStruggleScore,
      issuedBy: 'Phazur Platform',
      version: '2.0',
    };

    // Check if certificate already exists
    const existingQuery = await db
      .collection('certificates')
      .where('userId', '==', userId)
      .where('certificateType', '==', certificateType)
      .limit(1)
      .get();

    if (!existingQuery.empty) {
      return NextResponse.json(
        { error: 'Certificate already issued' },
        { status: 400 }
      );
    }

    // Create certificate record
    const certificateRef = await db.collection('certificates').add({
      userId,
      certificateType,
      metadata,
      issuedAt: Timestamp.now(),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // Get the certificate with its ID
    const certificateDoc = await certificateRef.get();
    const certificate = { id: certificateDoc.id, ...certificateDoc.data() };

    // Send certificate email (async, don't block response)
    const userEmail = decodedClaims.email;
    if (userEmail) {
      // Get user's full name
      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.data();

      sendCertificateEmail(
        userEmail,
        userData?.fullName,
        certificateType,
        certificateRef.id
      ).catch((err) => {
        console.error('Failed to send certificate email:', err);
      });
    }

    return NextResponse.json({
      message: 'Certificate issued',
      certificate,
      nextSteps: walletAddress
        ? ['SBT minting in progress...', 'Check your wallet for the token']
        : ['Connect your wallet to mint the SBT'],
    });
  } catch (error) {
    console.error('Certificate API error:', error);
    return NextResponse.json(
      { error: 'Failed to issue certificate' },
      { status: 500 }
    );
  }
}

function getCertificateName(type: string): string {
  const names: Record<string, string> = {
    student: 'Certified AI Associate',
    employee: 'Workflow Efficiency Lead',
    owner: 'AI Operations Master',
  };
  return names[type] || 'Phazur Certificate';
}

function getCertificateDesignation(type: string): string {
  const designations: Record<string, string> = {
    student: 'Proof of Readiness',
    employee: 'Proof of ROI',
    owner: 'Proof of Scalability',
  };
  return designations[type] || 'Verified';
}
