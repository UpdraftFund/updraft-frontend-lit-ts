/**
 * Interface for a contributor (supporter or funder)
 */
export interface Contributor {
  id: string;
  profile?: string;
  name?: string;
  avatar?: string;
  contribution: bigint;
}
