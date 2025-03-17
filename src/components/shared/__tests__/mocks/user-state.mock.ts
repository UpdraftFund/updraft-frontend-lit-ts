import { signal, computed } from '@lit-labs/signals';
import { createContext } from '@lit/context';
import type { Address } from 'viem';
import type { CurrentUser } from '@/types/current-user';

// Define custom events for user state changes
export const USER_CONNECTED_EVENT = 'user-connected';
export const USER_DISCONNECTED_EVENT = 'user-disconnected';
export const USER_PROFILE_UPDATED_EVENT = 'user-profile-updated';
export const NETWORK_CHANGED_EVENT = 'network-changed';

// Initialize signals with default values
export const userAddress = signal<Address | null>(null);
export const userProfile = signal<CurrentUser | null>(null);
export const isConnecting = signal<boolean>(false);
export const connectionError = signal<string | null>(null);
export const networkName = signal<string | null>(null);

// Computed values
export const isConnected = computed(() => userAddress.get() !== null);
export const hasProfile = computed(() => userProfile.get() !== null);

// Helper function to dispatch custom events
export const dispatchUserEvent = (eventName: string, detail?: any) => {
  console.log(`Dispatching ${eventName} event with detail:`, detail);
  const event = new CustomEvent(eventName, {
    bubbles: true,
    composed: true,
    detail,
  });
  document.dispatchEvent(event);
};

// State operations
export const setUserAddress = (address: Address | null): void => {
  userAddress.set(address);
  if (address) {
    dispatchUserEvent(USER_CONNECTED_EVENT, { address });
  } else {
    dispatchUserEvent(USER_DISCONNECTED_EVENT);
  }
};

export const setUserProfile = (profile: CurrentUser | null): void => {
  userProfile.set(profile);
  if (profile) {
    dispatchUserEvent(USER_PROFILE_UPDATED_EVENT, { profile });
  }
};

export const setIsConnecting = (connecting: boolean): void => {
  isConnecting.set(connecting);
};

export const setConnectionError = (error: string | null): void => {
  connectionError.set(error);
};

export const setNetworkName = (name: string | null): void => {
  networkName.set(name);
  if (name) {
    dispatchUserEvent(NETWORK_CHANGED_EVENT, { networkName: name });
  }
};

export const resetState = (): void => {
  userAddress.set(null);
  userProfile.set(null);
  isConnecting.set(false);
  connectionError.set(null);
  networkName.set(null);
};

// Mock connect/disconnect functions
export const connectWallet = async (): Promise<void> => {
  setIsConnecting(true);
  try {
    // Mock successful connection
    setUserAddress('0x1234567890123456789012345678901234567890' as Address);
    setConnectionError(null);
  } catch (error) {
    setConnectionError(error instanceof Error ? error.message : 'Unknown error');
  } finally {
    setIsConnecting(false);
  }
};

export const disconnectWallet = async (): Promise<void> => {
  try {
    // Mock successful disconnection
    setUserAddress(null);
    setUserProfile(null);
  } catch (error) {
    console.error('Error disconnecting wallet:', error);
  }
};

// Define interface for the context
export interface UserState {
  address: Address | null;
  profile: CurrentUser | null;
  isConnected: boolean;
  isConnecting: boolean;
  hasProfile: boolean;
  networkName: string | null;
  connectionError: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  setAddress: (address: Address | null) => void;
  setProfile: (profile: CurrentUser | null) => void;
  setNetworkName: (name: string | null) => void;
  setIsConnecting: (connecting: boolean) => void;
  setConnectionError: (error: string | null) => void;
  reset: () => void;
}

// Create the context
export const userContext = createContext<UserState>('user-state');

// Helper function to get the current state (for context provider)
export const getUserState = (): UserState => {
  return {
    address: userAddress.get(),
    profile: userProfile.get(),
    isConnected: isConnected.get(),
    isConnecting: isConnecting.get(),
    hasProfile: hasProfile.get(),
    networkName: networkName.get(),
    connectionError: connectionError.get(),
    connect: connectWallet,
    disconnect: disconnectWallet,
    setAddress: setUserAddress,
    setProfile: setUserProfile,
    setNetworkName: setNetworkName,
    setIsConnecting: setIsConnecting,
    setConnectionError: setConnectionError,
    reset: resetState,
  };
};
