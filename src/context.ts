import { createContext } from '@lit/context'

import updAddresses from './contracts/updAddresses.json';

export type User = {
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

export type Balances = Record<string, { symbol: string; balance: string }>;

export const userContext = createContext<User>('updraft-user');
export const balanceContext = createContext<Balances>('balances');

export class RequestBalanceRefresh extends Event {
  static readonly type = 'request-balance-refresh';
  constructor() {
    super(RequestBalanceRefresh.type, { bubbles: true, composed: true });
  }
}