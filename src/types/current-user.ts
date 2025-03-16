export type CurrentUser = {
  name: string;
  image?: string;
  avatar: string;
  team?: string;
  about?: string;
  news?: string;
  links?: string[];
};

export type Connection = {
  connected: boolean;
  address?: `0x${string}`;
  network?: {
    name?: string;
  };
};

export type Balances = Record<string, { symbol: string; balance: string }>;
