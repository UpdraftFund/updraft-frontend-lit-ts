import updAddresses from '@contracts/updAddresses.json';

export type CurrentUser = {
  name: string,
  image?: string,
  avatar: string
};

export type Connection = {
  connected: boolean;
  address?: `0x${string}`;
  network?: {
    name?: string;
    id?: keyof typeof updAddresses;
  }
}

export type Balances = Record<string, { symbol: string; balance: string }>;