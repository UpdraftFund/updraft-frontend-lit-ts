import { createContext } from '@lit/context';
import { signal } from '@lit-labs/signals';
import type { Client } from '@urql/core';

import { Connection, Balances, UpdraftSettings } from '@/types';

export const defaultFunderReward = 250000; // 25% assuming the percent scale set on the Updraft contract is 1,000,000

// DEPRECATED: Legacy user state - use userContext from features/user/state/user instead
// This is kept for backward compatibility while we transition
export const user = signal({} as any);

// Layout context for sidebar states
const storedLeftSidebarState = localStorage.getItem('leftSidebarCollapsed');
export const leftSidebarCollapsed = signal<boolean>(
  storedLeftSidebarState ? JSON.parse(storedLeftSidebarState) : false
);

export interface LayoutContextType {
  leftSidebarCollapsed: boolean;
  pageType: 'standard' | 'profile' | 'creation';
  toggleLeftSidebar: () => void;
}

export const layoutContext = createContext<LayoutContextType>('layout-context');

// DEPRECATED: Legacy connection context - use userContext from features/user/state/user instead
export const connectionContext = createContext<Connection>('connection');
export const balanceContext = createContext<Balances>('balances');
export const updraftSettings =
  createContext<UpdraftSettings>('updraftSettings');

export const urqlClientContext = createContext<Client>('urql-client');

export class RequestBalanceRefresh extends Event {
  static readonly type = 'request-balance-refresh';
  constructor() {
    super(RequestBalanceRefresh.type, { bubbles: true, composed: true });
  }
}

// Layout helper functions
export const toggleLeftSidebar = () => {
  const newState = !leftSidebarCollapsed.get();
  leftSidebarCollapsed.set(newState);
  localStorage.setItem('leftSidebarCollapsed', JSON.stringify(newState));
};

export const expandLeftSidebarOnNavigation = () => {
  // Only expand if we're on a larger screen
  if (window.innerWidth >= 768 && leftSidebarCollapsed.get()) {
    leftSidebarCollapsed.set(false);
    localStorage.setItem('leftSidebarCollapsed', 'false');
  }
};
