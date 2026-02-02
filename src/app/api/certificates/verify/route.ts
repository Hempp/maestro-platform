/**
 * CERTIFICATE VERIFICATION API
 * Public endpoint for employers to verify certificates
 */

import { createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import type { Tables, Json } from '@/lib/supabase/types';

interface CertificateWithUser extends Tables<'certificates'> {
  users: { full_name: string | null; email: string } | null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const certificateId = searchParams.get('id');
    const tokenId = searchParams.get('tokenId');

    if (!certificateId && !tokenId) {
      return NextResponse.json(
        { error: 'Certificate ID or Token ID required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    let query = supabase
      .from('certificates')
      .select(`
        *,
        users (
          full_name,
          email
        )
      `);

    if (certificateId) {
      query = query.eq('id', certificateId);
    } else if (tokenId) {
      query = query.eq('token_id', tokenId);
    }

    const { data, error } = await query.single();

    if (error || !data) {
      return NextResponse.json({
        valid: false,
        message: 'Certificate not found',
      });
    }

    const certificate = data as unknown as CertificateWithUser;

    // Build verification response
    const metadata = certificate.metadata as Record<string, unknown>;

    return NextResponse.json({
      valid: true,
      certificate: {
        id: certificate.id,
        certificationType: certificate.certificate_type,
        certificationName: metadata.certificationName,
        designation: metadata.designation,
        issuedAt: certificate.issued_at,
        verifiedAt: certificate.verified_at,
        holderName: certificate.users?.full_name || 'Anonymous',
        stats: {
          akusCompleted: metadata.akusCompleted,
          totalLearningTime: `${metadata.totalLearningTime} hours`,
          struggleScore: metadata.struggleScore,
        },
        blockchain: certificate.token_id
          ? {
              tokenId: certificate.token_id,
              contractAddress: certificate.contract_address,
              transactionHash: certificate.transaction_hash,
              network: 'Polygon',
            }
          : null,
      },
      verificationTimestamp: new Date().toISOString(),
      verifiedBy: 'Phazur Platform',
    });
  } catch (error) {
    console.error('Verification API error:', error);
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}
