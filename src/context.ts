import { createContext } from '@lit/context'

export type User = {
  connected: boolean;
  address?: `0x${string}`;
  name?: string;
  avatar?: string;
}

export type Balances = Record<string, string>;

export const userContext = createContext<User>('updraft-user');
export const balanceContext = createContext<Balances>('balances');

export class RequestBalanceRefresh extends Event {
  static type = 'request-balance-refresh';
  constructor() {
    super(RequestBalanceRefresh.type, { bubbles: true, composed: true });
  }
}