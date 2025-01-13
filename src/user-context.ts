import { createContext } from '@lit/context'

export type User = {
  connected: boolean;
  address?: `0x${string}`;
  name?: string;
  avatar?: string;
}

export const userContext = createContext<User>('updraft-user');
