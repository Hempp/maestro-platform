/**
 * PHAZUR THREE-MODEL ARCHITECTURE
 *
 * The core intelligence of the platform:
 * 1. Learner Model - Tracks "Interaction DNA" for each user
 * 2. Content Model - Manages Atomic Knowledge Units (AKUs)
 * 3. Adaptation Model - The "Brain" that makes real-time decisions
 */

export { LearnerModelService, learnerModel } from './learner-model';
export { ContentModelService, contentModel } from './content-model';
export { AdaptationModelService, adaptationModel } from './adaptation-model';
