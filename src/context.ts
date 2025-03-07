import { createContext } from '@lit/context';
import { signal } from '@lit-labs/signals';

import { CurrentUser, Connection, Balances, UpdraftSettings } from '@/types';

export const defaultFunderReward = 250000; // 25% assuming the percent scale set on the Updraft contract is 1,000,000

export const user = signal({} as CurrentUser);

const storedTags = JSON.parse(localStorage.getItem('watchedTags') || '[]');
export const watchedTags = signal<string[]>(storedTags);

export const connectionContext = createContext<Connection>('connection');
export const balanceContext = createContext<Balances>('balances');
export const updraftSettings =
  createContext<UpdraftSettings>('updraftSettings');

export class RequestBalanceRefresh extends Event {
  static readonly type = 'request-balance-refresh';
  constructor() {
    super(RequestBalanceRefresh.type, { bubbles: true, composed: true });
  }
}

export const watchTag = (tag: string) => {
  const currentTags = watchedTags.get();
  if (!currentTags.includes(tag)) {
    const updatedTags = [...currentTags, tag];
    watchedTags.set(updatedTags);
    localStorage.setItem('watchedTags', JSON.stringify(updatedTags));
  }
};

export const unwatchTag = (tag: string) => {
  const currentTags = watchedTags.get();
  const updatedTags = currentTags.filter((t) => t !== tag);
  watchedTags.set(updatedTags);
  localStorage.setItem('watchedTags', JSON.stringify(updatedTags));
};
