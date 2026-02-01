/**
 * LEARNER MODEL
 * Tracks "Interaction DNA" - how users learn, where they struggle, their patterns
 * Stored in Pinecone for real-time retrieval and similarity matching
 */

import { Pinecone } from '@pinecone-database/pinecone';
import type {
  LearnerModel,
  InteractionDNA,
  PausePattern,
  PromptComplexityScore,
  BusinessTier,
} from '@/types';

// ═══════════════════════════════════════════════════════════════════════════
// LEARNER MODEL SERVICE
// ═══════════════════════════════════════════════════════════════════════════

export class LearnerModelService {
  private pinecone: Pinecone;
  private indexName = 'phazur-learners';

  constructor() {
    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });
  }

  /**
   * Create a new learner profile
   */
  async createLearner(
    tier: BusinessTier,
    walletAddress?: string
  ): Promise<LearnerModel> {
    const id = crypto.randomUUID();
    const now = new Date();

    const learner: LearnerModel = {
      id,
      walletAddress,
      tier,
      interactionDNA: this.initializeInteractionDNA(),
      currentPath: this.getDefaultPathForTier(tier),
      completedAKUs: [],
      struggleScore: 50, // Start neutral
      createdAt: now,
      updatedAt: now,
    };

    await this.saveLearner(learner);
    return learner;
  }

  /**
   * Initialize default Interaction DNA
   */
  private initializeInteractionDNA(): InteractionDNA {
    return {
      typingSpeed: 0,
      pausePatterns: [],
      promptComplexity: {
        averageTokenCount: 0,
        variableUsage: 0,
        conditionalLogic: 0,
        chainOfThought: 0,
      },
      preferredLearningStyle: 'hands-on', // Default for Phazur
      struggleAreas: [],
      masteredConcepts: [],
    };
  }

  /**
   * Get default learning path based on business tier
   */
  private getDefaultPathForTier(tier: BusinessTier): string {
    const paths: Record<BusinessTier, string> = {
      student: 'portfolio-builder',
      employee: 'efficiency-automator',
      owner: 'operations-scaler',
    };
    return paths[tier];
  }

  /**
   * Save learner to Pinecone (vectorized for similarity matching)
   */
  async saveLearner(learner: LearnerModel): Promise<void> {
    const index = this.pinecone.index(this.indexName);

    // Create embedding from learner profile
    const embedding = await this.createLearnerEmbedding(learner);

    await index.upsert({
      records: [
        {
          id: learner.id,
          values: embedding,
          metadata: {
            tier: learner.tier,
            currentPath: learner.currentPath,
            struggleScore: learner.struggleScore,
            completedAKUs: JSON.stringify(learner.completedAKUs),
            struggleAreas: JSON.stringify(learner.interactionDNA.struggleAreas),
            masteredConcepts: JSON.stringify(learner.interactionDNA.masteredConcepts),
            preferredStyle: learner.interactionDNA.preferredLearningStyle,
            walletAddress: learner.walletAddress || '',
            updatedAt: learner.updatedAt.toISOString(),
          },
        },
      ],
    });
  }

  /**
   * Create embedding vector from learner profile
   * This enables finding similar learners for recommendations
   */
  private async createLearnerEmbedding(learner: LearnerModel): Promise<number[]> {
    // TODO: Use OpenAI embeddings for richer semantic matching
    // For now, create a simple feature vector
    const features = [
      learner.struggleScore / 100,
      learner.completedAKUs.length / 50, // Normalize
      learner.interactionDNA.typingSpeed / 100,
      learner.interactionDNA.promptComplexity.averageTokenCount / 500,
      learner.interactionDNA.promptComplexity.variableUsage,
      learner.interactionDNA.promptComplexity.conditionalLogic,
      learner.interactionDNA.promptComplexity.chainOfThought,
      learner.tier === 'student' ? 1 : 0,
      learner.tier === 'employee' ? 1 : 0,
      learner.tier === 'owner' ? 1 : 0,
    ];

    // Pad to 1536 dimensions (OpenAI embedding size)
    return [...features, ...new Array(1526).fill(0)];
  }

  /**
   * Get learner by ID
   */
  async getLearner(id: string): Promise<LearnerModel | null> {
    const index = this.pinecone.index(this.indexName);
    const result = await index.fetch({ ids: [id] });

    const record = result.records[id];
    if (!record) return null;

    return this.reconstructLearner(id, record.metadata as Record<string, unknown>);
  }

  /**
   * Reconstruct learner from Pinecone metadata
   */
  private reconstructLearner(
    id: string,
    metadata: Record<string, unknown>
  ): LearnerModel {
    return {
      id,
      walletAddress: metadata.walletAddress as string || undefined,
      tier: metadata.tier as BusinessTier,
      interactionDNA: {
        typingSpeed: 0, // Retrieved separately
        pausePatterns: [],
        promptComplexity: {
          averageTokenCount: 0,
          variableUsage: 0,
          conditionalLogic: 0,
          chainOfThought: 0,
        },
        preferredLearningStyle: metadata.preferredStyle as 'visual' | 'textual' | 'hands-on',
        struggleAreas: JSON.parse(metadata.struggleAreas as string || '[]'),
        masteredConcepts: JSON.parse(metadata.masteredConcepts as string || '[]'),
      },
      currentPath: metadata.currentPath as string,
      completedAKUs: JSON.parse(metadata.completedAKUs as string || '[]'),
      struggleScore: metadata.struggleScore as number,
      createdAt: new Date(), // Not stored in metadata
      updatedAt: new Date(metadata.updatedAt as string),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // INTERACTION DNA TRACKING
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Record a typing speed sample
   */
  async recordTypingSpeed(learnerId: string, wpm: number): Promise<void> {
    const learner = await this.getLearner(learnerId);
    if (!learner) return;

    // Rolling average
    const currentSpeed = learner.interactionDNA.typingSpeed;
    learner.interactionDNA.typingSpeed = currentSpeed === 0
      ? wpm
      : (currentSpeed * 0.8) + (wpm * 0.2);

    learner.updatedAt = new Date();
    await this.saveLearner(learner);
  }

  /**
   * Record a pause pattern (where user hesitates)
   */
  async recordPausePattern(
    learnerId: string,
    pattern: PausePattern
  ): Promise<void> {
    const learner = await this.getLearner(learnerId);
    if (!learner) return;

    // Find existing pattern for this location
    const existing = learner.interactionDNA.pausePatterns.find(
      p => p.location === pattern.location
    );

    if (existing) {
      // Update rolling average
      existing.averageDuration = (existing.averageDuration * 0.7) + (pattern.averageDuration * 0.3);
      existing.frequency += 1;
    } else {
      learner.interactionDNA.pausePatterns.push(pattern);
    }

    learner.updatedAt = new Date();
    await this.saveLearner(learner);
  }

  /**
   * Update prompt complexity metrics
   */
  async updatePromptComplexity(
    learnerId: string,
    complexity: PromptComplexityScore
  ): Promise<void> {
    const learner = await this.getLearner(learnerId);
    if (!learner) return;

    const current = learner.interactionDNA.promptComplexity;

    // Rolling average for all metrics
    learner.interactionDNA.promptComplexity = {
      averageTokenCount: (current.averageTokenCount * 0.8) + (complexity.averageTokenCount * 0.2),
      variableUsage: (current.variableUsage * 0.8) + (complexity.variableUsage * 0.2),
      conditionalLogic: (current.conditionalLogic * 0.8) + (complexity.conditionalLogic * 0.2),
      chainOfThought: (current.chainOfThought * 0.8) + (complexity.chainOfThought * 0.2),
    };

    learner.updatedAt = new Date();
    await this.saveLearner(learner);
  }

  /**
   * Mark a concept as struggled
   */
  async addStruggleArea(learnerId: string, concept: string): Promise<void> {
    const learner = await this.getLearner(learnerId);
    if (!learner) return;

    if (!learner.interactionDNA.struggleAreas.includes(concept)) {
      learner.interactionDNA.struggleAreas.push(concept);
      // Increase struggle score
      learner.struggleScore = Math.min(100, learner.struggleScore + 5);
    }

    learner.updatedAt = new Date();
    await this.saveLearner(learner);
  }

  /**
   * Mark a concept as mastered
   */
  async addMasteredConcept(learnerId: string, concept: string): Promise<void> {
    const learner = await this.getLearner(learnerId);
    if (!learner) return;

    // Remove from struggle areas if present
    learner.interactionDNA.struggleAreas =
      learner.interactionDNA.struggleAreas.filter(c => c !== concept);

    if (!learner.interactionDNA.masteredConcepts.includes(concept)) {
      learner.interactionDNA.masteredConcepts.push(concept);
      // Decrease struggle score
      learner.struggleScore = Math.max(0, learner.struggleScore - 3);
    }

    learner.updatedAt = new Date();
    await this.saveLearner(learner);
  }

  /**
   * Complete an AKU
   */
  async completeAKU(learnerId: string, akuId: string): Promise<void> {
    const learner = await this.getLearner(learnerId);
    if (!learner) return;

    if (!learner.completedAKUs.includes(akuId)) {
      learner.completedAKUs.push(akuId);
    }

    learner.updatedAt = new Date();
    await this.saveLearner(learner);
  }

  /**
   * Find similar learners (for cohort analysis and recommendations)
   */
  async findSimilarLearners(learnerId: string, topK = 5): Promise<string[]> {
    const learner = await this.getLearner(learnerId);
    if (!learner) return [];

    const index = this.pinecone.index(this.indexName);
    const embedding = await this.createLearnerEmbedding(learner);

    const results = await index.query({
      vector: embedding,
      topK: topK + 1, // Include self
      includeMetadata: false,
    });

    return results.matches
      .filter(m => m.id !== learnerId)
      .map(m => m.id);
  }
}

export const learnerModel = new LearnerModelService();
