/**
 * BLOCKCHAIN-VERIFIED CREDENTIAL API
 * Tamper-proof verification for employers - no middleman
 *
 * Features:
 * - On-chain SBT verification on Polygon
 * - Competency breakdown with proficiency levels
 * - Anti-gaming Struggle Score
 * - Instant verification via API or QR code
 */

import { NextRequest, NextResponse } from 'next/server';
import type { BlockchainCertificate, EmployerVerificationResult, CertificationLevel } from '@/types';

// Simulated blockchain data (in production: query Polygon)
const CERTIFICATES: Record<string, BlockchainCertificate> = {
  'demo': {
    tokenId: 'demo-001',
    contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
    chain: 'polygon',
    holderAddress: '0xdemo1234567890abcdef1234567890abcdef1234',

    certificationName: 'AI Workflow Professional',
    level: 'professional',
    issueDate: new Date('2024-12-15'),

    competencies: [
      { name: 'Prompt Engineering', level: 4, verifiedAt: new Date('2024-12-10') },
      { name: 'API Integration', level: 4, verifiedAt: new Date('2024-12-12') },
      { name: 'RAG Pipeline', level: 3, verifiedAt: new Date('2024-12-14') },
      { name: 'Custom GPT Development', level: 4, verifiedAt: new Date('2024-12-15') },
    ],

    struggleScore: 28,
    totalLearningTime: 42.5,
    akusCompleted: 12,

    ipfsMetadataHash: 'QmDemo1234567890abcdefghijklmnopqrstuvwxyz',
    transactionHash: '0x' + 'a'.repeat(64),
    maestroSignature: '0xsig' + 'b'.repeat(128),

    verificationUrl: 'https://maestro.ai/verify/demo',
    qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...',
  },
  'elite': {
    tokenId: 'elite-001',
    contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
    chain: 'polygon',
    holderAddress: '0xelite234567890abcdef1234567890abcdef1234',

    certificationName: 'AI Workflow Expert',
    level: 'expert',
    issueDate: new Date('2024-11-20'),

    competencies: [
      { name: 'Prompt Engineering', level: 5, verifiedAt: new Date('2024-11-01') },
      { name: 'API Integration', level: 5, verifiedAt: new Date('2024-11-05') },
      { name: 'RAG Pipeline', level: 5, verifiedAt: new Date('2024-11-10') },
      { name: 'Agent Orchestration', level: 4, verifiedAt: new Date('2024-11-15') },
      { name: 'AI Operations Chain', level: 4, verifiedAt: new Date('2024-11-20') },
    ],

    struggleScore: 15,
    totalLearningTime: 86.2,
    akusCompleted: 24,

    ipfsMetadataHash: 'QmElite234567890abcdefghijklmnopqrstuvwxyz',
    transactionHash: '0x' + 'c'.repeat(64),
    maestroSignature: '0xsig' + 'd'.repeat(128),

    verificationUrl: 'https://maestro.ai/verify/elite',
    qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...',
  },
};

// Struggle Score interpretation for employers
function interpretStruggleScore(score: number): { rating: string; description: string } {
  if (score <= 20) {
    return {
      rating: 'Elite Performer',
      description: 'Completed challenges with minimal assistance. Demonstrates exceptional problem-solving ability.',
    };
  }
  if (score <= 40) {
    return {
      rating: 'Strong Performer',
      description: 'Completed challenges efficiently with occasional hints. Shows solid understanding and persistence.',
    };
  }
  if (score <= 60) {
    return {
      rating: 'Solid Learner',
      description: 'Completed challenges with moderate assistance. Demonstrates growth mindset and willingness to learn.',
    };
  }
  return {
    rating: 'Persistent Learner',
    description: 'Completed challenges with significant support. Shows determination and ability to overcome obstacles.',
  };
}

// Level description for employers
function describeCertificationLevel(level: CertificationLevel): string {
  switch (level) {
    case 'associate':
      return 'Entry-level proficiency. Can execute AI workflows with guidance.';
    case 'professional':
      return 'Independent proficiency. Can design and implement AI solutions autonomously.';
    case 'expert':
      return 'Advanced proficiency. Can architect complex AI systems and mentor others.';
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tokenId, walletAddress, verificationMethod } = await request.json();

    if (!tokenId && !walletAddress) {
      return NextResponse.json(
        { valid: false, error: 'Token ID or wallet address required' },
        { status: 400 }
      );
    }

    // Look up certificate
    const certificate = tokenId
      ? CERTIFICATES[tokenId]
      : Object.values(CERTIFICATES).find(c =>
          c.holderAddress.toLowerCase() === walletAddress?.toLowerCase()
        );

    if (!certificate) {
      return NextResponse.json({
        valid: false,
        error: 'Certificate not found on blockchain. Try tokenId "demo" or "elite" for samples.',
        verifiedAt: new Date(),
        verificationMethod: verificationMethod || 'api',
      } as EmployerVerificationResult);
    }

    // Check expiry if applicable
    const isExpired = certificate.expiryDate && new Date() > certificate.expiryDate;

    // Build comprehensive verification response
    const result: EmployerVerificationResult & {
      certificate: BlockchainCertificate;
      interpretation: {
        struggleScore: { rating: string; description: string };
        certificationLevel: string;
        competencySummary: string;
      };
      blockchainProof: {
        chain: string;
        contractAddress: string;
        transactionHash: string;
        ipfsMetadata: string;
        verifyOnExplorer: string;
      };
    } = {
      valid: !isExpired,
      certificate,
      verifiedAt: new Date(),
      verificationMethod: verificationMethod || 'api',
      warning: isExpired ? 'Certificate has expired' : undefined,

      // Employer-friendly interpretation
      interpretation: {
        struggleScore: interpretStruggleScore(certificate.struggleScore),
        certificationLevel: describeCertificationLevel(certificate.level),
        competencySummary: `Verified ${certificate.competencies.length} competencies with average level ${
          (certificate.competencies.reduce((sum, c) => sum + c.level, 0) / certificate.competencies.length).toFixed(1)
        }/5`,
      },

      // Blockchain proof for technical verification
      blockchainProof: {
        chain: certificate.chain,
        contractAddress: certificate.contractAddress,
        transactionHash: certificate.transactionHash,
        ipfsMetadata: `https://ipfs.io/ipfs/${certificate.ipfsMetadataHash}`,
        verifyOnExplorer: `https://polygonscan.com/tx/${certificate.transactionHash}`,
      },
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { valid: false, error: 'Verification failed' },
      { status: 500 }
    );
  }
}

// GET endpoint for simple verification (e.g., from QR code scan)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenId = searchParams.get('id');

  if (!tokenId) {
    return NextResponse.json(
      { valid: false, error: 'Token ID required' },
      { status: 400 }
    );
  }

  // Redirect to POST handler logic
  const certificate = CERTIFICATES[tokenId];

  if (!certificate) {
    return NextResponse.json({
      valid: false,
      error: 'Certificate not found',
    });
  }

  return NextResponse.json({
    valid: true,
    holder: certificate.holderAddress,
    certification: certificate.certificationName,
    level: certificate.level,
    issueDate: certificate.issueDate,
    struggleScore: certificate.struggleScore,
    competencyCount: certificate.competencies.length,
    verifyFull: `/api/verify-credential?id=${tokenId}`,
  });
}
