/**
 * ADAPTATION MODEL
 * The "Brain" that makes real-time decisions about learning path
 * Uses learner signals to adapt content delivery
 */

import OpenAI from 'openai';
import type {
  LearnerModel,
  AtomicKnowledgeUnit,
  AdaptationDecision,
  AdaptationAction,
  PausePattern,
} from '@/types';
import { learnerModel } from './learner-model';
import { contentModel } from './content-model';

// ═══════════════════════════════════════════════════════════════════════════
// ADAPTATION MODEL SERVICE
// ═══════════════════════════════════════════════════════════════════════════

export class AdaptationModelService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Make an adaptation decision based on current learner state
   */
  async makeDecision(
    learnerId: string,
    currentAKU: AtomicKnowledgeUnit,
    signals: {
      hintsUsed: number;
      timeOnTask: number;
      currentPausePattern?: PausePattern;
      lastError?: string;
    }
  ): Promise<AdaptationDecision> {
    const learner = await learnerModel.getLearner(learnerId);
    if (!learner) {
      throw new Error('Learner not found');
    }

    // Analyze signals and determine action
    const action = await this.determineAction(learner, currentAKU, signals);

    const decision: AdaptationDecision = {
      learnerId,
      akuId: currentAKU.id,
      timestamp: new Date(),
      signals: {
        recentStruggleAreas: learner.interactionDNA.struggleAreas.slice(-5),
        currentPausePattern: signals.currentPausePattern,
        hintsUsed: signals.hintsUsed,
        timeOnTask: signals.timeOnTask,
      },
      action,
      reasoning: await this.generateReasoning(learner, currentAKU, action),
    };

    return decision;
  }

  /**
   * Determine what action to take based on signals
   */
  private async determineAction(
    learner: LearnerModel,
    currentAKU: AtomicKnowledgeUnit,
    signals: {
      hintsUsed: number;
      timeOnTask: number;
      currentPausePattern?: PausePattern;
      lastError?: string;
    }
  ): Promise<AdaptationAction> {
    // Decision tree based on signals

    // 1. If too many hints used, consider simplifying
    if (signals.hintsUsed >= currentAKU.sandboxChallenge.maxHints) {
      const preferredStyle = learner.interactionDNA.preferredLearningStyle;
      if (preferredStyle !== 'hands-on') {
        return {
          type: 'simplify',
          alternativeFormat: preferredStyle,
        };
      }
      // If already hands-on, provide tutor intervention
      return {
        type: 'tutor_intervention',
        message: await this.generateTutorIntervention(learner, currentAKU, signals),
      };
    }

    // 2. If spending too long (>5 min on 2-min content), check for struggle
    if (signals.timeOnTask > 300) {
      // Check if this is a known struggle area
      const struggleAreas = learner.interactionDNA.struggleAreas;
      const isKnownStruggle = struggleAreas.some(
        area => currentAKU.concept.toLowerCase().includes(area.toLowerCase())
      );

      if (isKnownStruggle) {
        // Find prerequisite that might need reinforcement
        const prereq = currentAKU.prerequisiteAKUs.find(
          prereqId => !learner.completedAKUs.includes(prereqId)
        );
        if (prereq) {
          return {
            type: 'reinforce',
            prerequisiteAKU: prereq,
          };
        }
      }

      // Offer a hint
      if (signals.hintsUsed < currentAKU.sandboxChallenge.maxHints) {
        return {
          type: 'hint',
          hintIndex: signals.hintsUsed,
        };
      }
    }

    // 3. Check pause patterns for specific struggles
    if (signals.currentPausePattern) {
      const { location, averageDuration } = signals.currentPausePattern;

      if (averageDuration > 30) {
        // Long pause = confusion
        return {
          type: 'tutor_intervention',
          message: await this.generateContextualHelp(location, currentAKU),
        };
      }
    }

    // 4. Default: Continue to next AKU
    const nextAKU = contentModel.getNextAKU(
      [...learner.completedAKUs, currentAKU.id],
      learner.tier
    );

    if (nextAKU) {
      return {
        type: 'continue',
        nextAKU: nextAKU.id,
      };
    }

    // Path complete
    return {
      type: 'continue',
      nextAKU: 'capstone',
    };
  }

  /**
   * Generate Socratic tutor intervention message
   */
  private async generateTutorIntervention(
    learner: LearnerModel,
    currentAKU: AtomicKnowledgeUnit,
    signals: { lastError?: string }
  ): Promise<string> {
    const prompt = `You are a Socratic AI tutor for the Maestro platform.

The learner is struggling with: "${currentAKU.title}"
Their learning style preference: ${learner.interactionDNA.preferredLearningStyle}
Their recent struggle areas: ${learner.interactionDNA.struggleAreas.join(', ')}
${signals.lastError ? `Last error they encountered: ${signals.lastError}` : ''}

Generate a SHORT (2-3 sentences) Socratic question that:
1. Does NOT give the answer
2. Guides them to discover the solution
3. References something they might already know

Speak directly to the learner. Be encouraging but don't be patronizing.`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 150,
      temperature: 0.7,
    });

    return response.choices[0].message.content ||
      "Let's step back. What's the first thing that happens when this runs?";
  }

  /**
   * Generate contextual help based on pause location
   */
  private async generateContextualHelp(
    pauseLocation: PausePattern['location'],
    currentAKU: AtomicKnowledgeUnit
  ): Promise<string> {
    const contextualHints: Record<PausePattern['location'], string> = {
      before_api_config:
        "I see you're looking at the API configuration. What information do you think the API needs to know about your request?",
      during_data_mapping:
        "Data mapping can be tricky. Let's think about this: what format is the data coming in, and what format does the next step expect?",
      at_deployment:
        "Before we deploy, let's verify: what would success look like? How would you know this is working?",
      other:
        "I notice you've paused. What part feels unclear right now?",
    };

    return contextualHints[pauseLocation];
  }

  /**
   * Generate reasoning for the decision (for logging/transparency)
   */
  private async generateReasoning(
    learner: LearnerModel,
    currentAKU: AtomicKnowledgeUnit,
    action: AdaptationAction
  ): Promise<string> {
    switch (action.type) {
      case 'continue':
        return `Learner completed ${currentAKU.title}. Proceeding to ${action.nextAKU}.`;
      case 'simplify':
        return `Learner used max hints. Switching to ${action.alternativeFormat} format based on preference.`;
      case 'reinforce':
        return `Learner struggling with known area. Reinforcing prerequisite ${action.prerequisiteAKU}.`;
      case 'hint':
        return `Learner taking longer than expected. Providing hint ${action.hintIndex + 1}.`;
      case 'tutor_intervention':
        return `Significant struggle detected. Providing Socratic guidance.`;
      default:
        return 'Continuing with current path.';
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // REAL-TIME OBSERVATION (Sandbox Watching)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Analyze sandbox state and provide real-time guidance
   * This is called periodically while the learner is in the sandbox
   */
  async observeSandbox(
    learnerId: string,
    sandboxState: {
      workflow: unknown[];
      executionLog: unknown[];
      currentError?: string;
    }
  ): Promise<string | null> {
    const learner = await learnerModel.getLearner(learnerId);
    if (!learner) return null;

    // Only intervene if there's a clear issue
    if (!sandboxState.currentError && sandboxState.workflow.length > 0) {
      return null; // Let them work
    }

    if (sandboxState.currentError) {
      return this.generateErrorGuidance(sandboxState.currentError, learner);
    }

    if (sandboxState.workflow.length === 0) {
      // Empty sandbox - gentle nudge
      return "What's the first step you want to take? Start by adding a block to the canvas.";
    }

    return null;
  }

  /**
   * Generate guidance for specific errors
   */
  private async generateErrorGuidance(
    error: string,
    learner: LearnerModel
  ): Promise<string> {
    // Common error patterns and Socratic responses
    const errorPatterns: Record<string, string> = {
      'api_key': "I see an authentication error. Where do API keys typically need to be configured?",
      'undefined': "Something is undefined. What data were you expecting at this point, and where should it come from?",
      'connection': "There's a connection issue. What needs to connect to what in your workflow?",
      'timeout': "The request timed out. What might cause an API call to take too long?",
      'invalid': "The input seems invalid. What format does this block expect?",
    };

    for (const [pattern, response] of Object.entries(errorPatterns)) {
      if (error.toLowerCase().includes(pattern)) {
        return response;
      }
    }

    // Generic error guidance
    return `I see an error: "${error.slice(0, 50)}...". Let's debug this together. What was the last thing you changed before this happened?`;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LEARNING STYLE DETECTION
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Detect preferred learning style from behavior
   * Called periodically to update learner profile
   */
  async detectLearningStyle(
    learnerId: string,
    behaviors: {
      visualDiagramViews: number;
      codeExampleViews: number;
      sandboxInteractions: number;
      documentationReads: number;
    }
  ): Promise<'visual' | 'textual' | 'hands-on'> {
    const { visualDiagramViews, codeExampleViews, sandboxInteractions, documentationReads } = behaviors;

    const total = visualDiagramViews + codeExampleViews + sandboxInteractions + documentationReads;
    if (total === 0) return 'hands-on'; // Default

    const visualScore = visualDiagramViews / total;
    const textualScore = (codeExampleViews + documentationReads) / total;
    const handsOnScore = sandboxInteractions / total;

    if (handsOnScore > visualScore && handsOnScore > textualScore) {
      return 'hands-on';
    } else if (visualScore > textualScore) {
      return 'visual';
    } else {
      return 'textual';
    }
  }
}

export const adaptationModel = new AdaptationModelService();
