export type User = { name: string, image?: string, avatar: string };

export type Balances = Record<string, { symbol: string; balance: string }>;