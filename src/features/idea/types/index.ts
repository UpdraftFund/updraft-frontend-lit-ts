export type { Idea, IdeaContribution } from '@gql';

export interface IdeaPosition {
  originalContribution: bigint;
  currentPosition: bigint;
  earnings: bigint;
  positionIndex: bigint;
}
