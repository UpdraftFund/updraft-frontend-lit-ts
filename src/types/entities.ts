export interface SolutionInfo {
  name: string;
  description: string;
  news?: string;
  repository?: string;
}

export interface Profile {
  name?: string;  // either name or team must be present
  team?: string;  // either name or team must be present
  links?: string[];
  image?: string;  // data URL
  about?: string;
  news?: string;
}

// See https://github.com/UpdraftFund/updraft-subgraph/blob/main/README.md for subgraph types and relations.

export type {
  Idea,
  Solution,
  User,
  IdeaContribution,
  SolutionContribution,
  TagCount,
} from '@gql'
