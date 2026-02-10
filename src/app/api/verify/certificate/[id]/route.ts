/**
 * PUBLIC CERTIFICATE VERIFICATION API (Firebase)
 * GET /api/verify/certificate/[id]
 *
 * Public endpoint for employers to verify Phazur certificates by database ID.
 * No authentication required - designed for LinkedIn sharing and employer validation.
 *
 * For blockchain token verification, see /api/certificates/verify
 */

import { getAdminDb } from '@/lib/firebase/admin';
import { NextRequest, NextResponse } from 'next/server';

interface CertificateMetadata {
  certificationName?: string;
  designation?: string;
  akusCompleted?: number;
  totalLearningTime?: number;
  totalHintsUsed?: number;
  struggleScore?: number;
  issuedBy?: string;
  version?: string;
}

// Map course/path types to display names
function getCertificationDisplayName(courseTitle: string): string {
  const title = courseTitle.toLowerCase();
  if (title.includes('student') || title.includes('associate')) {
    return 'Certified AI Associate';
  }
  if (title.includes('employee') || title.includes('efficiency')) {
    return 'Workflow Efficiency Lead';
  }
  if (title.includes('owner') || title.includes('operations')) {
    return 'AI Operations Master';
  }
  return courseTitle;
}

function getPathType(courseTitle: string): 'student' | 'employee' | 'owner' {
  const title = courseTitle.toLowerCase();
  if (title.includes('student') || title.includes('associate')) {
    return 'student';
  }
  if (title.includes('employee') || title.includes('efficiency')) {
    return 'employee';
  }
  return 'owner';
}

function getPathDisplayName(pathType: 'student' | 'employee' | 'owner'): string {
  const names = {
    student: 'The Student Path',
    employee: 'The Employee Path',
    owner: 'The Owner Path',
  };
  return names[pathType];
}

function getDesignation(pathType: 'student' | 'employee' | 'owner'): string {
  const designations = {
    student: 'Proof of Readiness',
    employee: 'Proof of ROI',
    owner: 'Proof of Scalability',
  };
  return designations[pathType];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: certificateId } = await params;

    if (!certificateId) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Certificate ID is required',
        },
        { status: 400 }
      );
    }

    const db = getAdminDb();

    // Fetch certificate
    const certDoc = await db.collection('certificates').doc(certificateId).get();

    if (!certDoc.exists) {
      return NextResponse.json({
        valid: false,
        error: 'Certificate not found',
        message:
          'This certificate ID does not exist in our system. It may have been revoked or the ID is incorrect.',
      });
    }

    const certificate = { id: certDoc.id, ...certDoc.data() } as any;
    const metadata = (certificate.metadata || {}) as CertificateMetadata;

    // Fetch user details
    let userData: any = null;
    if (certificate.userId) {
      const userDoc = await db.collection('users').doc(certificate.userId).get();
      userData = userDoc.exists ? userDoc.data() : null;
    }

    // Fetch course details if courseId exists
    let courseData: any = null;
    if (certificate.courseId) {
      const courseDoc = await db.collection('courses').doc(certificate.courseId).get();
      courseData = courseDoc.exists ? courseDoc.data() : null;
    }

    // Determine path type and certification details
    const courseTitle = courseData?.title || certificate.certificateType || '';
    const pathType = getPathType(courseTitle);
    const certificationName =
      metadata.certificationName || getCertificationDisplayName(courseTitle);
    const designation = metadata.designation || getDesignation(pathType);
    const pathDisplayName = getPathDisplayName(pathType);

    // Check if certificate has expired
    const expiresAt = certificate.expiresAt?.toDate?.() || null;
    const isExpired = expiresAt ? expiresAt < new Date() : false;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://phazur.com';

    // Build the verification response
    const verificationResponse = {
      valid: !isExpired,
      status: isExpired ? 'expired' : 'valid',
      certificate: {
        id: certificate.id,
        certificateNumber: certificate.certificateNumber,
        verificationUrl: `${baseUrl}/verify/certificate/${certificate.id}`,

        // Holder information
        holder: {
          name: userData?.fullName || 'Anonymous',
          avatarUrl: userData?.avatarUrl || null,
        },

        // Certification details
        certification: {
          name: certificationName,
          designation: designation,
          path: pathDisplayName,
          pathType: pathType,
          level: courseData?.level || 'advanced',
        },

        // Dates
        dates: {
          issuedAt: certificate.issuedAt?.toDate?.()?.toISOString() || null,
          verifiedAt: certificate.verifiedAt?.toDate?.()?.toISOString() || null,
          expiresAt: expiresAt?.toISOString() || null,
        },

        // Performance metrics (if available)
        stats: metadata.akusCompleted
          ? {
              akusCompleted: metadata.akusCompleted,
              totalLearningTime: metadata.totalLearningTime
                ? `${metadata.totalLearningTime} hours`
                : null,
              struggleScore: metadata.struggleScore,
              grade: certificate.grade,
            }
          : null,

        // Blockchain proof (if minted)
        blockchain: certificate.tokenId
          ? {
              tokenId: certificate.tokenId,
              contractAddress: certificate.contractAddress,
              transactionHash: certificate.transactionHash,
              ipfsHash: certificate.ipfsHash,
              network: 'Polygon',
              explorerUrl: certificate.transactionHash
                ? `https://polygonscan.com/tx/${certificate.transactionHash}`
                : null,
            }
          : null,
      },

      // Verification metadata
      verification: {
        timestamp: new Date().toISOString(),
        verifiedBy: 'Phazur Platform',
        platform: baseUrl,
      },
    };

    return NextResponse.json(verificationResponse);
  } catch (error) {
    console.error('Certificate verification error:', error);
    return NextResponse.json(
      {
        valid: false,
        error: 'Verification failed',
        message:
          'An error occurred while verifying this certificate. Please try again later.',
      },
      { status: 500 }
    );
  }
}
