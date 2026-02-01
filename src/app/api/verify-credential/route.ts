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
import type { BlockchainCertificate, EmployerVerificationResult, CertificationLevel, CertificatePath } from '@/types';
import { OFFICIAL_CERTIFICATES, MICRO_CREDENTIALS } from '@/types';

// Extended certificate with path info
interface CertificateWithPath extends BlockchainCertificate {
  path: CertificatePath;
  designation: string;
  focus: string;
  outcome: string;
  microCredentials?: string[];
}

// Simulated blockchain data (in production: query Polygon)
const CERTIFICATES: Record<string, CertificateWithPath> = {
  // Student Path: Certified AI Associate
  'student-demo': {
    tokenId: 'student-demo-001',
    contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
    chain: 'polygon',
    holderAddress: '0xstudent1234567890abcdef1234567890abcdef',

    path: 'student',
    certificationName: OFFICIAL_CERTIFICATES.student.name, // "Certified AI Associate"
    designation: OFFICIAL_CERTIFICATES.student.designation, // "Proof of Readiness"
    focus: OFFICIAL_CERTIFICATES.student.focus,
    outcome: OFFICIAL_CERTIFICATES.student.outcome,
    level: 'associate',
    issueDate: new Date('2025-01-10'),

    competencies: [
      { name: 'Prompt Engineering', level: 4, verifiedAt: new Date('2025-01-05') },
      { name: 'Terminal Proficiency', level: 3, verifiedAt: new Date('2025-01-07') },
      { name: 'Front-end Implementation', level: 4, verifiedAt: new Date('2025-01-09') },
      { name: 'Claude Code Basics', level: 4, verifiedAt: new Date('2025-01-10') },
    ],

    struggleScore: 32,
    totalLearningTime: 28.5,
    akusCompleted: 8,

    microCredentials: ['claude_code_commander'],

    ipfsMetadataHash: 'QmStudent1234567890abcdefghijklmnopqrstuvw',
    transactionHash: '0x' + 'a'.repeat(64),
    phazurSignature: '0xsig' + 'b'.repeat(128),

    verificationUrl: 'https://phazur.ai/verify/student-demo',
    qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...',
  },

  // Employee Path: Workflow Efficiency Lead
  'demo': {
    tokenId: 'demo-001',
    contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
    chain: 'polygon',
    holderAddress: '0xdemo1234567890abcdef1234567890abcdef1234',

    path: 'employee',
    certificationName: OFFICIAL_CERTIFICATES.employee.name, // "Workflow Efficiency Lead"
    designation: OFFICIAL_CERTIFICATES.employee.designation, // "Proof of ROI"
    focus: OFFICIAL_CERTIFICATES.employee.focus,
    outcome: OFFICIAL_CERTIFICATES.employee.outcome,
    level: 'professional',
    issueDate: new Date('2024-12-15'),

    competencies: [
      { name: 'Prompt Engineering', level: 4, verifiedAt: new Date('2024-12-10') },
      { name: 'API Integration', level: 4, verifiedAt: new Date('2024-12-12') },
      { name: 'Custom GPT Development', level: 4, verifiedAt: new Date('2024-12-14') },
      { name: 'Workflow Automation', level: 5, verifiedAt: new Date('2024-12-15') },
    ],

    struggleScore: 28,
    totalLearningTime: 42.5,
    akusCompleted: 12,

    microCredentials: ['api_integrator_pro'],

    ipfsMetadataHash: 'QmDemo1234567890abcdefghijklmnopqrstuvwxyz',
    transactionHash: '0x' + 'a'.repeat(64),
    phazurSignature: '0xsig' + 'b'.repeat(128),

    verificationUrl: 'https://phazur.ai/verify/demo',
    qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...',
  },

  // Owner Path: AI Operations Master
  'elite': {
    tokenId: 'elite-001',
    contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
    chain: 'polygon',
    holderAddress: '0xelite234567890abcdef1234567890abcdef1234',

    path: 'owner',
    certificationName: OFFICIAL_CERTIFICATES.owner.name, // "AI Operations Master"
    designation: OFFICIAL_CERTIFICATES.owner.designation, // "Proof of Scalability"
    focus: OFFICIAL_CERTIFICATES.owner.focus,
    outcome: OFFICIAL_CERTIFICATES.owner.outcome,
    level: 'expert',
    issueDate: new Date('2024-11-20'),

    competencies: [
      { name: 'Prompt Engineering', level: 5, verifiedAt: new Date('2024-11-01') },
      { name: 'API Integration', level: 5, verifiedAt: new Date('2024-11-05') },
      { name: 'Agent Orchestration', level: 5, verifiedAt: new Date('2024-11-10') },
      { name: 'Autonomous Agent Chains', level: 4, verifiedAt: new Date('2024-11-15') },
      { name: 'AI-Driven Strategy', level: 4, verifiedAt: new Date('2024-11-20') },
    ],

    struggleScore: 15,
    totalLearningTime: 86.2,
    akusCompleted: 24,

    microCredentials: ['claude_code_commander', 'api_integrator_pro', 'agentic_orchestrator'],

    ipfsMetadataHash: 'QmElite234567890abcdefghijklmnopqrstuvwxyz',
    transactionHash: '0x' + 'c'.repeat(64),
    phazurSignature: '0xsig' + 'd'.repeat(128),

    verificationUrl: 'https://phazur.ai/verify/elite',
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

    // Cast to extended type
    const cert = certificate as CertificateWithPath;

    // Build comprehensive verification response
    const result = {
      valid: !isExpired,
      certificate: cert,
      verifiedAt: new Date(),
      verificationMethod: verificationMethod || 'api',
      warning: isExpired ? 'Certificate has expired' : undefined,

      // Official certificate info
      officialCertificate: {
        name: cert.certificationName,
        designation: cert.designation,
        path: cert.path,
        focus: cert.focus,
        outcome: cert.outcome,
      },

      // Micro-credentials earned
      microCredentials: cert.microCredentials?.map(id => {
        const mc = MICRO_CREDENTIALS[id as keyof typeof MICRO_CREDENTIALS];
        return mc ? { id, name: mc.name, description: mc.description, icon: mc.iconEmoji } : null;
      }).filter(Boolean) || [],

      // Employer-friendly interpretation
      interpretation: {
        struggleScore: interpretStruggleScore(cert.struggleScore),
        certificationLevel: describeCertificationLevel(cert.level),
        competencySummary: `Verified ${cert.competencies.length} competencies with average level ${
          (cert.competencies.reduce((sum, c) => sum + c.level, 0) / cert.competencies.length).toFixed(1)
        }/5`,
        employerValue: cert.outcome,
      },

      // Blockchain proof for technical verification
      blockchainProof: {
        chain: cert.chain,
        contractAddress: cert.contractAddress,
        transactionHash: cert.transactionHash,
        ipfsMetadata: `https://ipfs.io/ipfs/${cert.ipfsMetadataHash}`,
        verifyOnExplorer: `https://polygonscan.com/tx/${cert.transactionHash}`,
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

  const cert = certificate as CertificateWithPath;

  return NextResponse.json({
    valid: true,
    holder: cert.holderAddress,
    certification: cert.certificationName,
    designation: cert.designation,
    path: cert.path,
    level: cert.level,
    issueDate: cert.issueDate,
    struggleScore: cert.struggleScore,
    competencyCount: cert.competencies.length,
    microCredentials: cert.microCredentials?.length || 0,
    outcome: cert.outcome,
    verifyFull: `/api/verify-credential?id=${tokenId}`,
  });
}
