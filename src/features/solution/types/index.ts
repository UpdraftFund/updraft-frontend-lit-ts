export interface SolutionInfo {
  name: string;
  description: string;
  news?: string;
  repository?: string;
}

export interface SolutionPosition {
  contribution: bigint;
  refunded: boolean;
  feesEarned: bigint;
  positionIndex: bigint;
}

export type { Solution, SolutionContribution } from '@gql';
