import { createContext } from '@lit/context'
import { signal } from '@lit-labs/signals';

import { CurrentUser, Connection, Balances } from '@/types';

export const user = signal({} as CurrentUser);
export const connectionContext = createContext<Connection>('connection');
export const balanceContext = createContext<Balances>('balances');

export class RequestBalanceRefresh extends Event {
  static readonly type = 'request-balance-refresh';
  constructor() {
    super(RequestBalanceRefresh.type, { bubbles: true, composed: true });
  }
}