/**
 * CREDENTIAL MINTING API
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
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { sbtMinter, type MintResult } from '@/lib/blockchain/sbt-minter';
import type { SBTMetadata, CertificatePath } from '@/types';

// Types for request body
interface MintCredentialRequest {
  // Option 1: Mint for current user
  certificateId?: string;

  // Option 2: Mint by submission ID (admin use)
  submissionId?: string;

  // Wallet address for minting (required if user hasn't connected wallet)
  walletAddress?: string;

  // Create claimable credential instead of direct mint (for users without wallet)
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

export async function POST(request: NextRequest) {
  try {
    const body: MintCredentialRequest = await request.json();
    const { certificateId, submissionId, walletAddress, createClaimable } = body;

    // Get authenticated user
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Use admin client for database operations
    const adminClient = createAdminClient();

    // Step 1: Get certificate record
    let certificate: CertificateRecord | null = null;
    let submission: SubmissionRecord | null = null;

    if (certificateId) {
      const { data, error } = await adminClient
        .from('certificates')
        .select('*')
        .eq('id', certificateId)
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        return NextResponse.json(
          { error: 'Certificate not found' },
          { status: 404 }
        );
      }
      certificate = data as unknown as CertificateRecord;
    } else if (submissionId) {
      // Get submission and find/create associated certificate
      const { data: subData, error: subError } = await adminClient
        .from('certification_submissions')
        .select('*')
        .eq('id', submissionId)
        .eq('user_id', user.id)
        .single();

      if (subError || !subData) {
        return NextResponse.json(
          { error: 'Certification submission not found' },
          { status: 404 }
        );
      }
      submission = subData as unknown as SubmissionRecord;

      // Check submission status
      if (submission.status !== 'passed') {
        return NextResponse.json(
          { error: `Certification not passed. Current status: ${submission.status}` },
          { status: 400 }
        );
      }

      // Find associated certificate
      const { data: certData } = await adminClient
        .from('certificates')
        .select('*')
        .eq('user_id', user.id)
        .eq('certificate_type', submission.path)
        .single();

      certificate = certData as CertificateRecord | null;
    } else {
      return NextResponse.json(
        { error: 'Either certificateId or submissionId is required' },
        { status: 400 }
      );
    }

    // Step 2: Verify payment completed
    if (!certificate?.verified_at) {
      return NextResponse.json(
        {
          error: 'Payment not completed',
          message: 'Please complete payment before minting your credential',
          paymentRequired: true,
          price: CERTIFICATE_PRICES[certificate?.certificate_type || 'student'],
        },
        { status: 402 }
      );
    }

    // Step 3: Check if already minted
    if (certificate.token_id) {
      return NextResponse.json({
        success: true,
        alreadyMinted: true,
        tokenId: certificate.token_id,
        transactionHash: certificate.transaction_hash,
        contractAddress: certificate.contract_address,
        verifyUrl: `/verify/${certificate.token_id}`,
        explorerUrl: `https://polygonscan.com/tx/${certificate.transaction_hash}`,
      });
    }

    // Step 4: Get wallet address
    let mintWalletAddress = walletAddress;

    if (!mintWalletAddress) {
      // Check user's stored wallet from profiles
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profileData } = await (adminClient as any)
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      // wallet_address may be in profile metadata or a separate field
      mintWalletAddress = profileData?.wallet_address;
    }

    // Step 5: Create claimable or mint directly
    if (!mintWalletAddress) {
      if (createClaimable) {
        // Create a claimable credential for later
        const claimable = await createClaimableCredential(
          adminClient,
          certificate,
          user.id
        );
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
    const verificationData = await getVerificationData(adminClient, user.id, certificate);

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
    const { error: updateError } = await adminClient
      .from('certificates')
      .update({
        token_id: mintResult.tokenId,
        transaction_hash: mintResult.transactionHash,
        contract_address: process.env.SBT_CONTRACT_ADDRESS,
        ipfs_hash: verificationData.ipfsHash,
      })
      .eq('id', certificate.id);

    if (updateError) {
      console.error('Failed to update certificate:', updateError);
      // Token was minted, but DB update failed - log for manual fix
    }

    // Step 9: Update user's wallet if not stored
    if (walletAddress) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (adminClient as any)
        .from('profiles')
        .update({ wallet_address: walletAddress })
        .eq('id', user.id);
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

interface CertificateRecord {
  id: string;
  user_id: string;
  certificate_type: CertificatePath;
  token_id: string | null;
  contract_address: string | null;
  transaction_hash: string | null;
  ipfs_hash: string | null;
  metadata: Record<string, unknown>;
  issued_at: string;
  verified_at: string | null;
}

interface SubmissionRecord {
  id: string;
  user_id: string;
  path: CertificatePath;
  status: 'submitted' | 'under_review' | 'passed' | 'failed' | 'needs_revision';
  total_score: number | null;
  submitted_at: string;
  reviewed_at: string | null;
}

function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

async function createClaimableCredential(
  adminClient: ReturnType<typeof createAdminClient>,
  certificate: CertificateRecord,
  userId: string
): Promise<ClaimableCredential> {
  // Generate unique claim code
  const claimCode = generateClaimCode();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

  // Store claimable credential
  await (adminClient as unknown as { from: (t: string) => { insert: (d: unknown) => Promise<unknown> } })
    .from('claimable_credentials')
    .insert({
      user_id: userId,
      certificate_id: certificate.id,
      claim_code: claimCode,
      expires_at: expiresAt,
      status: 'pending',
    });

  return {
    id: certificate.id,
    claimCode,
    expiresAt,
    certificateType: certificate.certificate_type,
    metadata: certificate.metadata as unknown as SBTMetadata,
  };
}

function generateClaimCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude similar-looking chars
  let code = 'PHZ-';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function getVerificationData(
  adminClient: ReturnType<typeof createAdminClient>,
  userId: string,
  certificate: CertificateRecord
) {
  // Get user's completed AKUs
  const { data: akuProgress } = await adminClient
    .from('aku_progress')
    .select('aku_id, struggle_score, time_spent, hints_used')
    .eq('user_id', userId)
    .eq('status', 'verified');

  const completedAKUs = (akuProgress || []).map(p => p.aku_id);

  // Calculate aggregate scores
  const avgStruggleScore = akuProgress?.length
    ? Math.round(akuProgress.reduce((sum, p) => sum + (p.struggle_score || 50), 0) / akuProgress.length)
    : 50;

  const totalTimeSpent = akuProgress?.reduce((sum, p) => sum + (p.time_spent || 0), 0) || 0;
  const totalHintsUsed = akuProgress?.reduce((sum, p) => sum + (p.hints_used || 0), 0) || 0;

  // Create verification result structure
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
    workflowSnapshot: certificate.ipfs_hash || '',
  };

  // Mastery path name
  const masteryPathNames: Record<CertificatePath, string> = {
    student: 'AI Associate Certification',
    employee: 'Workflow Efficiency Lead',
    owner: 'AI Operations Master',
  };

  return {
    verificationResult,
    masteryPath: masteryPathNames[certificate.certificate_type],
    completedAKUs,
    ipfsHash: certificate.ipfs_hash || '',
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

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const adminClient = createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: certificate, error } = await (adminClient as any)
      .from('certificates')
      .select('id, certificate_type, token_id, contract_address, transaction_hash, verified_at')
      .eq('id', certificateId)
      .eq('user_id', user.id)
      .single();

    if (error || !certificate) {
      return NextResponse.json(
        { error: 'Certificate not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      certificateId: certificate.id,
      certificateType: certificate.certificate_type,
      paymentCompleted: !!certificate.verified_at,
      minted: !!certificate.token_id,
      tokenId: certificate.token_id,
      contractAddress: certificate.contract_address,
      transactionHash: certificate.transaction_hash,
      verifyUrl: certificate.token_id ? `/verify/${certificate.token_id}` : null,
      explorerUrl: certificate.transaction_hash
        ? `https://polygonscan.com/tx/${certificate.transaction_hash}`
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
