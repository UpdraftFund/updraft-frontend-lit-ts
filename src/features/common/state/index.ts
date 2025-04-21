import { createContext } from '@lit/context';

import { Connection, UpdraftSettings } from '@/types';

export const defaultFunderReward = 250000; // 25% assuming the percent scale set on the Updraft contract is 1,000,000

// DEPRECATED: Legacy connection context - use userContext from features/user/state/user instead
export const connectionContext = createContext<Connection>('connection');
export const updraftSettings =
  createContext<UpdraftSettings>('updraftSettings');
