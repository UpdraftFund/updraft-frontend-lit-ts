import { Profile } from './profile';

export type CurrentUser = Profile & {
  avatar?: string;
  balances?: Balances;
};

export type Connection = {
  connected: boolean;
  address?: `0x${string}`;
  network?: {
    name?: string;
  };
};

export type Balances = {
  [key: string]: {
    symbol: string;
    balance: string;
  };
};
