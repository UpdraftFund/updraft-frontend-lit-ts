export interface SolutionInfo {
  name: string;
  description: string;
  news?: string;
  repository?: string;
}

export interface SolutionPosition {
  contribution: bigint;
  contributionAfterFees: bigint;
  feesEarned: bigint;
  positionIndex: bigint;
  refundable: boolean;
}

export type { Solution, SolutionContribution } from '@gql';
