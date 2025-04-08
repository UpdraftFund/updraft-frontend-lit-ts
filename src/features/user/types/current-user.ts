export type CurrentUser = {
  name: string;
  image?: string;
  avatar: string;
  team?: string;
  about?: string;
  news?: string;
  links?: string[];
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
