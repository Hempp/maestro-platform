/**
 * CREDENTIAL MINTING API (Firebase)
 * POST /api/credentials/mint
 *
 * Mints a Soulbound Token (SBT) credential on Polygon blockchain
 * after verifying:
 * 1. User passed certification (certification_submissions.status = 'passed')
 * 2. Payment completed (certificates.verified_at is set)
 *
 * Can be called:
 * - Automatically via Stripe webhook after payment
 * - Manually by user to claim credential
 * - By admin to issue credentials
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import { sbtMinter, type MintResult } from '@/lib/blockchain/sbt-minter';
import type { SBTMetadata, CertificatePath } from '@/types';

// Types for request body
interface MintCredentialRequest {
  certificateId?: string;
  submissionId?: string;
  walletAddress?: string;
  createClaimable?: boolean;
}

interface ClaimableCredential {
  id: string;
  claimCode: string;
  expiresAt: string;
  certificateType: CertificatePath;
  metadata: SBTMetadata;
}

// Certificate type pricing map for verification
const CERTIFICATE_PRICES: Record<CertificatePath, number> = {
  student: 4900,
  employee: 19900,
  owner: 49900,
};

interface CertificateRecord {
  id: string;
  userId: string;
  certificateType: CertificatePath;
  tokenId: string | null;
  contractAddress: string | null;
  transactionHash: string | null;
  ipfsHash: string | null;
  metadata: Record<string, unknown>;
  issuedAt: FirebaseFirestore.Timestamp;
  verifiedAt: FirebaseFirestore.Timestamp | null;
}

interface SubmissionRecord {
  id: string;
  userId: string;
  path: CertificatePath;
  status: 'submitted' | 'under_review' | 'passed' | 'failed' | 'needs_revision';
  totalScore: number | null;
  submittedAt: FirebaseFirestore.Timestamp;
  reviewedAt: FirebaseFirestore.Timestamp | null;
}

export async function POST(request: NextRequest) {
  try {
    const body: MintCredentialRequest = await request.json();
    const { certificateId, submissionId, walletAddress, createClaimable } = body;

    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const auth = getAdminAuth();
    const db = getAdminDb();

    const decodedClaims = await auth.verifySessionCookie(session, true);
    const userId = decodedClaims.uid;

    // Step 1: Get certificate record
    let certificate: CertificateRecord | null = null;
    let submission: SubmissionRecord | null = null;

    if (certificateId) {
      const certDoc = await db.collection('certificates').doc(certificateId).get();

      if (!certDoc.exists || certDoc.data()?.userId !== userId) {
        return NextResponse.json(
          { error: 'Certificate not found' },
          { status: 404 }
        );
      }
      certificate = { id: certDoc.id, ...certDoc.data() } as CertificateRecord;
    } else if (submissionId) {
      const subDoc = await db.collection('certificationSubmissions').doc(submissionId).get();

      if (!subDoc.exists || subDoc.data()?.userId !== userId) {
        return NextResponse.json(
          { error: 'Certification submission not found' },
          { status: 404 }
        );
      }
      submission = { id: subDoc.id, ...subDoc.data() } as SubmissionRecord;

      // Check submission status
      if (submission.status !== 'passed') {
        return NextResponse.json(
          { error: `Certification not passed. Current status: ${submission.status}` },
          { status: 400 }
        );
      }

      // Find associated certificate
      const certQuery = await db
        .collection('certificates')
        .where('userId', '==', userId)
        .where('certificateType', '==', submission.path)
        .limit(1)
        .get();

      if (!certQuery.empty) {
        certificate = { id: certQuery.docs[0].id, ...certQuery.docs[0].data() } as CertificateRecord;
      }
    } else {
      return NextResponse.json(
        { error: 'Either certificateId or submissionId is required' },
        { status: 400 }
      );
    }

    // Step 2: Verify payment completed
    if (!certificate?.verifiedAt) {
      return NextResponse.json(
        {
          error: 'Payment not completed',
          message: 'Please complete payment before minting your credential',
          paymentRequired: true,
          price: CERTIFICATE_PRICES[certificate?.certificateType || 'student'],
        },
        { status: 402 }
      );
    }

    // Step 3: Check if already minted
    if (certificate.tokenId) {
      return NextResponse.json({
        success: true,
        alreadyMinted: true,
        tokenId: certificate.tokenId,
        transactionHash: certificate.transactionHash,
        contractAddress: certificate.contractAddress,
        verifyUrl: `/verify/${certificate.tokenId}`,
        explorerUrl: `https://polygonscan.com/tx/${certificate.transactionHash}`,
      });
    }

    // Step 4: Get wallet address
    let mintWalletAddress = walletAddress;

    if (!mintWalletAddress) {
      const userDoc = await db.collection('users').doc(userId).get();
      mintWalletAddress = userDoc.data()?.walletAddress;
    }

    // Step 5: Create claimable or mint directly
    if (!mintWalletAddress) {
      if (createClaimable) {
        const claimable = await createClaimableCredential(db, certificate, userId);
        return NextResponse.json({
          success: true,
          claimable: true,
          claimCode: claimable.claimCode,
          expiresAt: claimable.expiresAt,
          message: 'Connect your wallet to claim this credential',
          claimUrl: `/claim/${claimable.claimCode}`,
        });
      }

      return NextResponse.json(
        {
          error: 'Wallet address required',
          message: 'Please connect your wallet or provide a wallet address to mint your credential',
          walletRequired: true,
        },
        { status: 400 }
      );
    }

    // Validate wallet address format
    if (!isValidEthereumAddress(mintWalletAddress)) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    // Step 6: Get verification data for metadata
    const verificationData = await getVerificationData(db, userId, certificate);

    // Step 7: Mint the SBT
    const mintResult: MintResult = await sbtMinter.mintCertificate(
      mintWalletAddress,
      verificationData.verificationResult,
      verificationData.masteryPath,
      verificationData.completedAKUs
    );

    if (!mintResult.success) {
      console.error('Minting failed:', mintResult.error);
      return NextResponse.json(
        { error: 'Minting failed', details: mintResult.error },
        { status: 500 }
      );
    }

    // Step 8: Update certificate with blockchain data
    await db.collection('certificates').doc(certificate.id).update({
      tokenId: mintResult.tokenId,
      transactionHash: mintResult.transactionHash,
      contractAddress: process.env.SBT_CONTRACT_ADDRESS,
      ipfsHash: verificationData.ipfsHash,
      updatedAt: Timestamp.now(),
    });

    // Step 9: Update user's wallet if not stored
    if (walletAddress) {
      await db.collection('users').doc(userId).update({
        walletAddress,
        updatedAt: Timestamp.now(),
      });
    }

    return NextResponse.json({
      success: true,
      tokenId: mintResult.tokenId,
      transactionHash: mintResult.transactionHash,
      contractAddress: process.env.SBT_CONTRACT_ADDRESS,
      explorerUrl: mintResult.explorerUrl,
      verifyUrl: `/verify/${mintResult.tokenId}`,
      message: 'Credential successfully minted on Polygon blockchain',
    });
  } catch (error) {
    console.error('Credential minting error:', error);
    return NextResponse.json(
      { error: 'Failed to mint credential' },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

async function createClaimableCredential(
  db: FirebaseFirestore.Firestore,
  certificate: CertificateRecord,
  userId: string
): Promise<ClaimableCredential> {
  const claimCode = generateClaimCode();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

  await db.collection('claimableCredentials').add({
    userId,
    certificateId: certificate.id,
    claimCode,
    expiresAt,
    status: 'pending',
    createdAt: Timestamp.now(),
  });

  return {
    id: certificate.id,
    claimCode,
    expiresAt,
    certificateType: certificate.certificateType,
    metadata: certificate.metadata as unknown as SBTMetadata,
  };
}

function generateClaimCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'PHZ-';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function getVerificationData(
  db: FirebaseFirestore.Firestore,
  userId: string,
  certificate: CertificateRecord
) {
  // Get user's completed AKUs
  const akuProgressQuery = await db
    .collection('akuProgress')
    .where('userId', '==', userId)
    .where('status', '==', 'verified')
    .get();

  const akuProgress = akuProgressQuery.docs.map(doc => doc.data());
  const completedAKUs = akuProgress.map(p => p.akuId);

  // Calculate aggregate scores
  const avgStruggleScore = akuProgress.length
    ? Math.round(akuProgress.reduce((sum, p) => sum + (p.struggleScore || 50), 0) / akuProgress.length)
    : 50;

  const totalTimeSpent = akuProgress.reduce((sum, p) => sum + (p.timeSpent || 0), 0);
  const totalHintsUsed = akuProgress.reduce((sum, p) => sum + (p.hintsUsed || 0), 0);

  const verificationResult = {
    passed: true,
    akuId: 'certification',
    learnerId: userId,
    timestamp: new Date(),
    outputValidations: [],
    executionResults: [],
    struggleScore: avgStruggleScore,
    hintsUsed: totalHintsUsed,
    timeToComplete: totalTimeSpent,
    workflowSnapshot: certificate.ipfsHash || '',
  };

  const masteryPathNames: Record<CertificatePath, string> = {
    student: 'AI Associate Certification',
    employee: 'Workflow Efficiency Lead',
    owner: 'AI Operations Master',
  };

  return {
    verificationResult,
    masteryPath: masteryPathNames[certificate.certificateType],
    completedAKUs,
    ipfsHash: certificate.ipfsHash || '',
  };
}

/**
 * GET endpoint to check minting status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const certificateId = searchParams.get('certificateId');

    if (!certificateId) {
      return NextResponse.json(
        { error: 'certificateId parameter required' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const auth = getAdminAuth();
    const db = getAdminDb();

    const decodedClaims = await auth.verifySessionCookie(session, true);
    const userId = decodedClaims.uid;

    const certDoc = await db.collection('certificates').doc(certificateId).get();

    if (!certDoc.exists || certDoc.data()?.userId !== userId) {
      return NextResponse.json(
        { error: 'Certificate not found' },
        { status: 404 }
      );
    }

    const certificate = certDoc.data();

    return NextResponse.json({
      certificateId: certDoc.id,
      courseId: certificate?.courseId,
      paymentCompleted: !!certificate?.verifiedAt,
      minted: !!certificate?.tokenId,
      tokenId: certificate?.tokenId,
      contractAddress: certificate?.contractAddress,
      transactionHash: certificate?.transactionHash,
      verifyUrl: certificate?.tokenId ? `/verify/${certificate.tokenId}` : null,
      explorerUrl: certificate?.transactionHash
        ? `https://polygonscan.com/tx/${certificate.transactionHash}`
        : null,
    });
  } catch (error) {
    console.error('Minting status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check minting status' },
      { status: 500 }
    );
  }
}
