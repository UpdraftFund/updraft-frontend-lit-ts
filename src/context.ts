import { createContext } from '@lit/context'
import { signal } from '@lit-labs/signals';

import updAddresses from './contracts/updAddresses.json';

export type Connection = {
  connected: boolean;
  address?: `0x${string}`;
  name?: string;
  image?: string;
  avatar?: string;
  network?: {
    name?: string;
    id?: keyof typeof updAddresses;
  }
}
export type User = { name: string, image?: string, avatar: string };
export type Balances = Record<string, { symbol: string; balance: string }>;

export const user = signal({} as User);
export const connectionContext = createContext<Connection>('connection');
export const balanceContext = createContext<Balances>('balances');

export class RequestBalanceRefresh extends Event {
  static readonly type = 'request-balance-refresh';
  constructor() {
    super(RequestBalanceRefresh.type, { bubbles: true, composed: true });
  }
}