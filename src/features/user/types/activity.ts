import { Idea, IdeaContribution, Solution, SolutionContribution } from '@/types';

export type Activity = IdeaCreatedActivity | IdeaFundedActivity | SolutionFundedActivity | SolutionDraftedActivity;

export interface IdeaCreatedActivity extends Idea {
  type: 'ideaCreated';
  timestamp: number;
}

export interface IdeaFundedActivity extends IdeaContribution {
  type: 'ideaFunded';
  timestamp: number;
}

export interface SolutionFundedActivity extends SolutionContribution {
  type: 'solutionFunded';
  timestamp: number;
}

export interface SolutionDraftedActivity extends Solution {
  type: 'solutionDrafted';
  timestamp: number;
}
