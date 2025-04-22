export * from './updraft-settings';

import { createContext } from '@lit/context';
import { Connection } from '@/types';

// DEPRECATED: Legacy connection context - use userContext from features/user/state/user instead
export const connectionContext = createContext<Connection>('connection');
