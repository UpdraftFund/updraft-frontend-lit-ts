import { Profile } from './profile';

export type CurrentUser = Profile & {
  avatar?: string;
};

export type Balances = {
  [key: string]: {
    symbol: string;
    balance: string;
  };
};
