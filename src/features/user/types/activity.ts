import { IdeaContribution, Solution, SolutionContribution } from '@/types';

export type Activity =
  | IdeaFundedActivity
  | SolutionFundedActivity
  | SolutionDraftedActivity;

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
