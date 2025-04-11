import { signal, computed } from '@lit-labs/signals';
import { createContext } from '@lit/context';
import type { Address } from 'viem';

// Import user profile type
import type { CurrentUser } from '@/features/user/types/current-user';

// Import the wallet connection modal and wagmi config
import { modal, config } from '@/features/common/utils/web3';
import { disconnect, watchAccount, reconnect } from '@wagmi/core'; // Import the core disconnect function and watchers

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
export const dispatchUserEvent = (
  eventName: string,
  detail?:
    | { address?: `0x${string}`; profile?: CurrentUser; networkName?: string }
    | undefined
) => {
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
  console.log('setUserAddress called with:', address);
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
  dispatchUserEvent(USER_DISCONNECTED_EVENT);
};

// Connect wallet function
export const connectWallet = async (): Promise<void> => {
  try {
    setIsConnecting(true);
    setConnectionError(null);

    console.log('Connecting wallet...');
    // Open the wallet connection modal
    await modal.open({ view: 'Connect' });

    // The modal will automatically close on successful connection
    // because the AppKit handles this internally
  } catch (err) {
    console.error('Error connecting wallet:', err);
    setConnectionError(err instanceof Error ? err.message : 'Unknown error');
  } finally {
    console.log('Finished connecting wallet');
    setIsConnecting(false);
  }
};

// Disconnect wallet function
export const disconnectWallet = async (): Promise<void> => {
  try {
    console.log('Disconnecting wallet...');
    // Disconnect the wallet using the modal
    await modal.disconnect();

    // Explicitly call wagmi core disconnect to ensure persistence is cleared
    await disconnect(config); // Pass your wagmi config object

    // Reset our internal application state
    resetState();
    console.log('Wallet disconnected and internal state reset.');
  } catch (err) {
    console.error('Error disconnecting wallet:', err);
    // Optionally set an error state here if needed
    // setConnectionError(err instanceof Error ? err.message : 'Unknown error');
  }
};

// --- Add Wagmi Watchers ---
// Initialize listeners for wagmi state changes right after config is available
// Ensure config is initialized before these watchers are set up.
// This might require placing this logic after config export or using an init function.
// For now, placing it here assuming config is ready at module load.

watchAccount(config, {
  onChange(account) {
    const currentAddress = userAddress.get();
    const newAddress = account.address ?? null;

    // Update network name if changed
    const currentNetworkName = networkName.get();
    const chainId = account.chainId;
    // Find the network name from the config based on chainId
    const newNetworkName = chainId
      ? (config.chains.find((chain) => chain.id === chainId)?.name ?? null)
      : null;
    if (currentNetworkName !== newNetworkName) {
      setNetworkName(newNetworkName);
    }

    // Update user address if changed
    if (currentAddress !== newAddress) {
      setUserAddress(newAddress);
      // Reset profile if address changes or becomes null
      if (newAddress === null || currentAddress !== newAddress) {
        setUserProfile(null);
      }
      // TODO: Potentially fetch profile here if a new address connects
    }

    // Update connection status flags
    setIsConnecting(account.isConnecting);
  },
});

// --- Application Initialization --- //
export const initializeUserState = async (): Promise<void> => {
  setIsConnecting(true); // Set connecting flag initially
  await reconnect(config); // Trigger reconnect, watchAccount will handle updates
  // We don't explicitly set isConnecting to false here.
  // watchAccount will do that when the status changes to 'connected' or 'disconnected'.
};

// Define interface for the context
export interface UserState {
  address: Address | null; // Represents the current wallet address
  profile: CurrentUser | null; // Represents the fetched user profile
  isConnected: boolean; // Computed: is address non-null?
  isConnecting: boolean; // Reflects wagmi's connection/reconnection status
  hasProfile: boolean; // Computed: is profile non-null?
  networkName: string | null; // Current network name from wagmi
  connectionError: string | null; // Error during connect process
  connect: () => Promise<void>; // Function to initiate connection
  disconnect: () => Promise<void>; // Function to initiate disconnection
  // Internal setters exposed (consider if truly needed externally)
  setAddress: (address: Address | null) => void; // Manually set address (use with caution)
  setProfile: (profile: CurrentUser | null) => void; // Manually set profile
  setNetworkName: (name: string | null) => void; // Manually set network
  setIsConnecting: (connecting: boolean) => void; // Manually set connecting status
  setConnectionError: (error: string | null) => void; // Manually set error
  reset: () => void; // Function to reset all state
}

// Create the context
export const userContext = createContext<UserState>('user-state');

// Helper function to get the current state (for context provider)
export const getUserState = (): UserState => {
  const state = {
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
    setNetworkName,
    setIsConnecting,
    setConnectionError,
    reset: resetState,
  };
  console.log('getUserState returning:', state);
  return state;
};
