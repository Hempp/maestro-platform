/**
 * VERIFICATION ENGINE
 * Validates project completion and calculates Struggle Score
 * Triggers SBT minting upon successful verification
 */

import type {
  VerificationResult,
  VerificationCriteria,
  AtomicKnowledgeUnit,
  SandboxState,
  ExecutionLogEntry,
  SBTMetadata,
} from '@/types';
import { learnerModel } from '@/lib/models';

// ═══════════════════════════════════════════════════════════════════════════
// VERIFICATION ENGINE
// ═══════════════════════════════════════════════════════════════════════════

export class VerificationEngine {
  /**
   * Verify a project submission
   */
  async verify(
    learnerId: string,
    aku: AtomicKnowledgeUnit,
    sandboxState: SandboxState,
    sessionData: {
      hintsUsed: number;
      startTime: Date;
      endTime: Date;
    }
  ): Promise<VerificationResult> {
    const timeToComplete = Math.round(
      (sessionData.endTime.getTime() - sessionData.startTime.getTime()) / 1000
    );

    // Run output validations
    const outputValidations = await this.validateOutputs(
      sandboxState,
      aku.verificationCriteria
    );

    // Run execution requirement checks
    const executionResults = await this.checkExecutionRequirements(
      sandboxState.executionLog,
      aku.verificationCriteria
    );

    // Calculate if passed
    const outputsPassed = outputValidations.every(v => v.passed);
    const executionPassed = executionResults.every(r => r.passed);
    const passed = outputsPassed && executionPassed;

    // Calculate struggle score
    const struggleScore = this.calculateStruggleScore(
      sessionData.hintsUsed,
      aku.sandboxChallenge.maxHints,
      timeToComplete,
      aku.duration,
      executionResults.filter(r => !r.passed).length
    );

    // Create workflow snapshot
    const workflowSnapshot = await this.createWorkflowSnapshot(sandboxState);

    const result: VerificationResult = {
      passed,
      akuId: aku.id,
      learnerId,
      timestamp: new Date(),
      outputValidations,
      executionResults,
      struggleScore,
      hintsUsed: sessionData.hintsUsed,
      timeToComplete,
      workflowSnapshot,
    };

    // Update learner model if passed
    if (passed) {
      await learnerModel.completeAKU(learnerId, aku.id);

      // Update struggle areas based on performance
      if (struggleScore > 70) {
        // High struggle - mark as struggle area
        await learnerModel.addStruggleArea(learnerId, aku.category);
      } else if (struggleScore < 30) {
        // Low struggle - mark as mastered
        await learnerModel.addMasteredConcept(learnerId, aku.category);
      }
    }

    return result;
  }

  /**
   * Validate outputs against expected schema
   */
  private async validateOutputs(
    sandboxState: SandboxState,
    criteria: VerificationCriteria
  ): Promise<{ field: string; passed: boolean; actual: unknown }[]> {
    const results: { field: string; passed: boolean; actual: unknown }[] = [];

    // Extract final output from sandbox
    const output = this.extractFinalOutput(sandboxState);

    for (const validation of criteria.outputValidation) {
      const actual = this.getNestedValue(output, validation.field);
      let passed = false;

      switch (validation.type) {
        case 'exists':
          passed = actual !== undefined && actual !== null;
          break;
        case 'matches':
          passed = actual === validation.expected;
          break;
        case 'contains':
          passed = typeof actual === 'string' &&
            actual.includes(String(validation.expected));
          break;
        case 'type_check':
          passed = typeof actual === validation.expected;
          break;
      }

      results.push({ field: validation.field, passed, actual });
    }

    return results;
  }

  /**
   * Check execution requirements
   */
  private async checkExecutionRequirements(
    executionLog: ExecutionLogEntry[],
    criteria: VerificationCriteria
  ): Promise<{ requirement: string; passed: boolean }[]> {
    const results: { requirement: string; passed: boolean }[] = [];

    for (const req of criteria.executionRequirements) {
      let passed = false;

      switch (req.type) {
        case 'api_called':
          passed = executionLog.some(
            e => e.event === 'success' && e.nodeId.includes(req.target)
          );
          break;

        case 'workflow_deployed':
          passed = executionLog.some(
            e => e.event === 'success' && e.nodeId === 'deploy'
          );
          break;

        case 'response_received':
          passed = executionLog.some(
            e => e.event === 'success' && e.data !== undefined
          );
          break;

        case 'latency_under':
          const successEvents = executionLog.filter(e => e.event === 'success');
          if (successEvents.length > 0) {
            // Calculate average latency
            // This would need actual timing data
            passed = true; // Placeholder
          }
          break;
      }

      results.push({
        requirement: `${req.type}:${req.target}`,
        passed,
      });
    }

    return results;
  }

  /**
   * Calculate Struggle Score (0-100)
   * Lower = less help needed = better performance
   */
  private calculateStruggleScore(
    hintsUsed: number,
    maxHints: number,
    timeToComplete: number,
    expectedDuration: number,
    failedRequirements: number
  ): number {
    // Hint penalty: 0-40 points
    const hintPenalty = (hintsUsed / maxHints) * 40;

    // Time penalty: 0-40 points
    // Expected duration is in seconds
    const timeRatio = timeToComplete / expectedDuration;
    const timePenalty = Math.min(40, (timeRatio - 1) * 20);

    // Failure penalty: 0-20 points
    const failurePenalty = failedRequirements * 10;

    // Calculate final score
    const score = Math.min(100, Math.max(0,
      hintPenalty + Math.max(0, timePenalty) + failurePenalty
    ));

    return Math.round(score);
  }

  /**
   * Create a snapshot of the workflow for SBT metadata
   */
  private async createWorkflowSnapshot(sandboxState: SandboxState): Promise<string> {
    // In production, this would upload to IPFS and return the hash
    const snapshot = {
      workflow: sandboxState.workflow,
      executionLog: sandboxState.executionLog,
      timestamp: new Date().toISOString(),
    };

    // For now, return base64 encoded JSON
    // TODO: Replace with IPFS upload
    return Buffer.from(JSON.stringify(snapshot)).toString('base64');
  }

  /**
   * Extract final output from sandbox state
   */
  private extractFinalOutput(sandboxState: SandboxState): Record<string, unknown> {
    // Find the output node and its data
    const outputNode = sandboxState.workflow.find(n => n.type === 'output');
    if (!outputNode) return {};

    // Find the last successful execution for the output node
    const outputExecution = [...sandboxState.executionLog]
      .reverse()
      .find(e => e.nodeId === outputNode.id && e.event === 'success');

    return (outputExecution?.data as Record<string, unknown>) || {};
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce((current, key) => {
      if (current && typeof current === 'object') {
        return (current as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj as unknown);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SBT METADATA GENERATION
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Generate SBT metadata for minting
   */
  generateSBTMetadata(
    result: VerificationResult,
    masteryPath: string,
    allCompletedAKUs: string[]
  ): SBTMetadata {
    // Determine certificate tier based on struggle score
    const tier = this.getCertificateTier(result.struggleScore);

    return {
      name: `Phazur Mastery: ${masteryPath}`,
      description: `Verified completion of the ${masteryPath} mastery path on Phazur AI Academy. This Soulbound Token certifies hands-on competency in AI workflow deployment.`,
      image: `ipfs://phazur-certificates/${tier.toLowerCase()}-badge.png`,
      attributes: [
        { trait_type: 'Mastery Path', value: masteryPath },
        { trait_type: 'Completion Tier', value: tier },
        { trait_type: 'Struggle Score', value: result.struggleScore },
        { trait_type: 'Hints Used', value: result.hintsUsed },
        { trait_type: 'Time to Complete', value: `${result.timeToComplete}s` },
        { trait_type: 'AKUs Completed', value: allCompletedAKUs.length },
        { trait_type: 'Verification Date', value: result.timestamp.toISOString() },
      ],
      phazur: {
        masteryPath,
        akusCompleted: allCompletedAKUs,
        struggleScore: result.struggleScore,
        deploymentTimestamp: result.timestamp.getTime(),
        workflowHash: result.workflowSnapshot,
        verificationSignature: '', // Will be added during signing
      },
    };
  }

  /**
   * Determine certificate tier based on performance
   */
  private getCertificateTier(struggleScore: number): string {
    if (struggleScore <= 20) return 'ELITE';
    if (struggleScore <= 40) return 'ADVANCED';
    if (struggleScore <= 60) return 'PROFICIENT';
    if (struggleScore <= 80) return 'COMPETENT';
    return 'FOUNDATIONAL';
  }

  /**
   * Validate that a mastery path is complete
   */
  async isPathComplete(
    learnerId: string,
    pathAKUs: string[]
  ): Promise<boolean> {
    const learner = await learnerModel.getLearner(learnerId);
    if (!learner) return false;

    return pathAKUs.every(akuId =>
      learner.completedAKUs.includes(akuId)
    );
  }
}

export const verificationEngine = new VerificationEngine();
