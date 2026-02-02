/**
 * CERTIFICATES API
 * Manage SBT certificates and verification
 */

import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import type { Insertable } from '@/lib/supabase/types';

// GET: Fetch user's certificates
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { data: certificates, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('user_id', user.id)
      .order('issued_at', { ascending: false });

    if (error) {
      console.error('Certificates fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch certificates' },
        { status: 500 }
      );
    }

    return NextResponse.json({ certificates: certificates || [] });
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
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

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
    interface ProgressRecord {
      time_spent: number | null;
      hints_used: number | null;
      struggle_score: number | null;
    }

    const { data: progressData } = await supabase
      .from('aku_progress')
      .select('time_spent, hints_used, struggle_score')
      .eq('user_id', user.id)
      .eq('status', 'verified');

    const progress = (progressData || []) as ProgressRecord[];
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
    const totalTimeSpent = progress.reduce((sum, p) => sum + (p.time_spent || 0), 0);
    const totalHintsUsed = progress.reduce((sum, p) => sum + (p.hints_used || 0), 0);
    const averageStruggleScore = progress.length > 0
      ? Math.round(progress.reduce((sum, p) => sum + (p.struggle_score || 50), 0) / progress.length)
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
    const { data: existing } = await supabase
      .from('certificates')
      .select('id')
      .eq('user_id', user.id)
      .eq('certificate_type', certificateType)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Certificate already issued' },
        { status: 400 }
      );
    }

    // Create certificate record
    const insertData: Insertable<'certificates'> = {
      user_id: user.id,
      certificate_type: certificateType,
      metadata,
      issued_at: new Date().toISOString(),
    };

    const { data: certificate, error } = await supabase
      .from('certificates')
      .insert(insertData as never)
      .select()
      .single();

    if (error) {
      console.error('Certificate creation error:', error);
      return NextResponse.json(
        { error: 'Failed to create certificate' },
        { status: 500 }
      );
    }

    // TODO: Mint SBT on blockchain if wallet address provided
    // This would integrate with the blockchain/sbt-minter.ts

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
