/**
 * CERTIFICATE VERIFICATION API (Firebase)
 * Public endpoint for employers to verify certificates
 */

import { getAdminDb } from '@/lib/firebase/admin';
import { NextRequest, NextResponse } from 'next/server';

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

    const db = getAdminDb();

    let certDoc;

    if (certificateId) {
      // Direct document lookup by ID
      certDoc = await db.collection('certificates').doc(certificateId).get();
    } else if (tokenId) {
      // Query by tokenId
      const querySnapshot = await db
        .collection('certificates')
        .where('tokenId', '==', tokenId)
        .limit(1)
        .get();

      certDoc = querySnapshot.empty ? null : querySnapshot.docs[0];
    }

    if (!certDoc || !certDoc.exists) {
      return NextResponse.json({
        valid: false,
        message: 'Certificate not found',
      });
    }

    const certificate = { id: certDoc.id, ...certDoc.data() } as any;

    // Fetch user details
    let userData: any = null;
    if (certificate.userId) {
      const userDoc = await db.collection('users').doc(certificate.userId).get();
      userData = userDoc.exists ? userDoc.data() : null;
    }

    // Build verification response
    const metadata = (certificate.metadata || {}) as Record<string, unknown>;

    return NextResponse.json({
      valid: true,
      certificate: {
        id: certificate.id,
        certificationType: certificate.certificateType,
        certificationName: metadata.certificationName,
        designation: metadata.designation,
        issuedAt: certificate.issuedAt?.toDate?.()?.toISOString() || null,
        verifiedAt: certificate.verifiedAt?.toDate?.()?.toISOString() || null,
        holderName: userData?.fullName || 'Anonymous',
        stats: {
          akusCompleted: metadata.akusCompleted,
          totalLearningTime: `${metadata.totalLearningTime} hours`,
          struggleScore: metadata.struggleScore,
        },
        blockchain: certificate.tokenId
          ? {
              tokenId: certificate.tokenId,
              contractAddress: certificate.contractAddress,
              transactionHash: certificate.transactionHash,
              network: 'Polygon',
            }
          : null,
      },
      verificationTimestamp: new Date().toISOString(),
      verifiedBy: 'Phazur Platform',
    });
  } catch (error) {
    console.error('Verification API error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
