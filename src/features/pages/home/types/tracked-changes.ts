import { Idea, SolutionFieldsFragment } from '@gql';

export interface NewSupporters {
  type: 'newSupporter';
  idea: Pick<Idea, 'name' | 'id'>;
  supporters: Array<{
    id: `0x${string}`;
    name?: string;
    profile?: `0x${string}`;
  }>;
  additionalCount?: number;
  time: number;
}

export interface NewSolution {
  type: 'newSolution';
  idea: Pick<Idea, 'name' | 'id'>;
  solution: SolutionFieldsFragment;
  time: number;
}

export interface NewFunders {
  type: 'newFunder';
  solution: SolutionFieldsFragment;
  funders: Array<{
    id: `0x${string}`;
    name?: string;
    profile?: `0x${string}`;
  }>;
  additionalCount?: number;
  time: number;
}

export interface GoalReached {
  type: 'goalReached';
  solution: SolutionFieldsFragment;
  time: number;
}

export interface GoalFailed {
  type: 'goalFailed';
  solution: SolutionFieldsFragment;
  time: number;
}

export interface SolutionUpdated {
  type: 'solutionUpdated';
  solution: SolutionFieldsFragment;
  time: number;
}

export type Change =
  | NewSupporters
  | NewSolution
  | NewFunders
  | GoalReached
  | GoalFailed
  | SolutionUpdated;
