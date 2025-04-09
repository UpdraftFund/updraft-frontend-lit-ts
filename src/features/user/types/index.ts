export interface Profile {
  name?: string; // either name or team must be present
  team?: string; // either name or team must be present
  links?: string[];
  image?: string; // data URL
  about?: string;
  news?: string;
}

export type { User } from '@gql';
export * from './current-user';
