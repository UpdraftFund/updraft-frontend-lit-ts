export type { Idea, IdeaContribution } from '@gql';

export interface Position {
  originalContribution: bigint;
  currentPosition: bigint;
  earnings: bigint;
  positionIndex: bigint;
}
