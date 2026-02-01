/**
 * VERIFICATION API
 * Verifies workflow completion and calculates Struggle Score
 */

import { NextRequest, NextResponse } from 'next/server';
import type { SandboxState, VerificationResult } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      akuId,
      sandboxState,
      hintsUsed,
      startTime,
      endTime,
    }: {
      akuId: string;
      sandboxState: SandboxState;
      hintsUsed: number;
      startTime: string;
      endTime: string;
    } = body;

    // Calculate time to complete
    const start = new Date(startTime);
    const end = new Date(endTime);
    const timeToComplete = Math.round((end.getTime() - start.getTime()) / 1000);

    // Basic validation checks
    const outputValidations = validateOutputs(sandboxState);
    const executionResults = checkExecution(sandboxState);

    // Determine if passed
    const outputsPassed = outputValidations.every(v => v.passed);
    const executionPassed = executionResults.every(r => r.passed);
    const passed = outputsPassed && executionPassed;

    // Calculate struggle score
    const struggleScore = calculateStruggleScore(
      hintsUsed,
      3, // maxHints
      timeToComplete,
      120, // expected duration (2 min)
      executionResults.filter(r => !r.passed).length
    );

    // Create workflow snapshot (simplified)
    const workflowSnapshot = Buffer.from(
      JSON.stringify({
        workflow: sandboxState.workflow,
        timestamp: new Date().toISOString(),
      })
    ).toString('base64');

    const result: VerificationResult = {
      passed,
      akuId,
      learnerId: sandboxState.learnerId,
      timestamp: new Date(),
      outputValidations,
      executionResults,
      struggleScore,
      hintsUsed,
      timeToComplete,
      workflowSnapshot,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}

function validateOutputs(sandboxState: SandboxState) {
  const validations: { field: string; passed: boolean; actual: unknown }[] = [];

  // Check if workflow has nodes
  validations.push({
    field: 'workflow_nodes',
    passed: sandboxState.workflow.length >= 2,
    actual: sandboxState.workflow.length,
  });

  // Check if workflow executed successfully
  const hasSuccess = sandboxState.executionLog.some(e => e.event === 'success');
  validations.push({
    field: 'execution_success',
    passed: hasSuccess,
    actual: hasSuccess,
  });

  // Check if output node exists
  const hasOutput = sandboxState.workflow.some(n => n.type === 'output');
  validations.push({
    field: 'output_node',
    passed: hasOutput,
    actual: hasOutput,
  });

  return validations;
}

function checkExecution(sandboxState: SandboxState) {
  const results: { requirement: string; passed: boolean }[] = [];

  // Check if workflow was run
  results.push({
    requirement: 'workflow_executed',
    passed: sandboxState.executionLog.length > 0,
  });

  // Check for no errors
  const hasErrors = sandboxState.executionLog.some(e => e.event === 'error');
  results.push({
    requirement: 'no_errors',
    passed: !hasErrors,
  });

  // Check completion status
  results.push({
    requirement: 'status_complete',
    passed: sandboxState.status === 'complete',
  });

  return results;
}

function calculateStruggleScore(
  hintsUsed: number,
  maxHints: number,
  timeToComplete: number,
  expectedDuration: number,
  failedRequirements: number
): number {
  // Hint penalty: 0-40 points
  const hintPenalty = (hintsUsed / maxHints) * 40;

  // Time penalty: 0-40 points (only if over expected time)
  const timeRatio = timeToComplete / expectedDuration;
  const timePenalty = timeRatio > 1 ? Math.min(40, (timeRatio - 1) * 20) : 0;

  // Failure penalty: 0-20 points
  const failurePenalty = failedRequirements * 10;

  // Calculate final score (0-100, lower is better)
  const score = Math.min(100, Math.max(0,
    hintPenalty + timePenalty + failurePenalty
  ));

  return Math.round(score);
}
