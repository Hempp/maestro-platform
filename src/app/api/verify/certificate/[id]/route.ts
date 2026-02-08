/**
 * PUBLIC CERTIFICATE VERIFICATION API
 * GET /api/verify/certificate/[id]
 *
 * Public endpoint for employers to verify Phazur certificates by database ID.
 * No authentication required - designed for LinkedIn sharing and employer validation.
 *
 * For blockchain token verification, see /api/certificates/verify
 */

import { createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import type { Json } from '@/types/database.types';

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

interface CertificateWithUser {
  id: string;
  user_id: string;
  certificate_number: string;
  course_id: string;
  grade: string | null;
  issued_at: string | null;
  verified_at: string | null;
  expires_at: string | null;
  token_id: string | null;
  contract_address: string | null;
  transaction_hash: string | null;
  ipfs_hash: string | null;
  metadata: Json | null;
  pdf_url: string | null;
  verification_url: string | null;
  users: {
    full_name: string;
    avatar_url: string | null;
  } | null;
  courses: {
    title: string;
    description: string;
    level: string | null;
  } | null;
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
          error: 'Certificate ID is required'
        },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Fetch certificate with user and course details
    const { data, error } = await supabase
      .from('certificates')
      .select(`
        *,
        users (
          full_name,
          avatar_url
        ),
        courses (
          title,
          description,
          level
        )
      `)
      .eq('id', certificateId)
      .single();

    if (error || !data) {
      return NextResponse.json({
        valid: false,
        error: 'Certificate not found',
        message: 'This certificate ID does not exist in our system. It may have been revoked or the ID is incorrect.',
      });
    }

    const certificate = data as unknown as CertificateWithUser;
    const metadata = (certificate.metadata || {}) as CertificateMetadata;

    // Determine path type and certification details
    const courseTitle = certificate.courses?.title || '';
    const pathType = getPathType(courseTitle);
    const certificationName = metadata.certificationName || getCertificationDisplayName(courseTitle);
    const designation = metadata.designation || getDesignation(pathType);
    const pathDisplayName = getPathDisplayName(pathType);

    // Check if certificate has expired
    const isExpired = certificate.expires_at
      ? new Date(certificate.expires_at) < new Date()
      : false;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://phazur.com';

    // Build the verification response
    const verificationResponse = {
      valid: !isExpired,
      status: isExpired ? 'expired' : 'valid',
      certificate: {
        id: certificate.id,
        certificateNumber: certificate.certificate_number,
        verificationUrl: `${baseUrl}/verify/certificate/${certificate.id}`,

        // Holder information
        holder: {
          name: certificate.users?.full_name || 'Anonymous',
          avatarUrl: certificate.users?.avatar_url || null,
        },

        // Certification details
        certification: {
          name: certificationName,
          designation: designation,
          path: pathDisplayName,
          pathType: pathType,
          level: certificate.courses?.level || 'advanced',
        },

        // Dates
        dates: {
          issuedAt: certificate.issued_at,
          verifiedAt: certificate.verified_at,
          expiresAt: certificate.expires_at,
        },

        // Performance metrics (if available)
        stats: metadata.akusCompleted ? {
          akusCompleted: metadata.akusCompleted,
          totalLearningTime: metadata.totalLearningTime
            ? `${metadata.totalLearningTime} hours`
            : null,
          struggleScore: metadata.struggleScore,
          grade: certificate.grade,
        } : null,

        // Blockchain proof (if minted)
        blockchain: certificate.token_id ? {
          tokenId: certificate.token_id,
          contractAddress: certificate.contract_address,
          transactionHash: certificate.transaction_hash,
          ipfsHash: certificate.ipfs_hash,
          network: 'Polygon',
          explorerUrl: certificate.transaction_hash
            ? `https://polygonscan.com/tx/${certificate.transaction_hash}`
            : null,
        } : null,
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
        message: 'An error occurred while verifying this certificate. Please try again later.',
      },
      { status: 500 }
    );
  }
}
