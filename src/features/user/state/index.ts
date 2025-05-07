import { signal, computed } from '@lit-labs/signals';
import type { Address } from 'viem';
import { fromHex } from 'viem';

import type { Profile, CurrentUser } from '@/features/user/types';

import { modal, config } from '@utils/web3';
import {
  disconnect,
  watchAccount,
  reconnect,
  watchChainId,
  getChainId,
} from '@wagmi/core';

import urqlClient from '@utils/urql-client';

import { ProfileDocument } from '@gql';

import { refreshUpdraftSettings } from '@state/common';
import { refreshBalances } from '@state/user/balances';
import { markComplete } from '@state/user/beginner-tasks';

export const userAddress = signal<Address | null>(null);
export const userProfile = signal<CurrentUser | null>(null);
export const isConnecting = signal<boolean>(false);
export const connectionError = signal<string | null>(null);
export const profileError = signal<string | null>(null);
export const networkName = signal<string | null>(null);
export const isConnected = computed(() => Boolean(userAddress.get()));
export const hasProfile = computed(() => userProfile.get() !== null);

// Variables to track urql subscription for profile data
let profileSubscription: { unsubscribe: () => void } | null = null;

// State operations
export const setUserAddress = (address: Address | null): void => {
  console.log('setUserAddress called with:', address);
  userAddress.set(address);
  if (address) {
    subscribeToProfileUpdates(address);
  } else {
    setUserProfile(null);
    cleanupProfileSubscription();
  }
};

export const setProfileImage = (image: string) => {
  setUserProfile({
    ...(userProfile.get() || {}),
    image,
  });
};

export const setUserProfile = (profile: Profile | null) => {
  if (!profile) {
    profile = {};
  }
  if (profile.image) {
    userProfile.set({
      ...profile,
      avatar: profile.image,
    });
  } else {
    const address = userAddress.get();
    if (address) {
      import('ethereum-blockies-base64').then(({ default: makeBlockie }) => {
        userProfile.set({
          ...profile,
          avatar: makeBlockie(address),
        });
      });
    } else {
      userProfile.set({
        ...profile,
      });
    }
  }
};

export const setIsConnecting = (connecting: boolean): void => {
  isConnecting.set(connecting);
};

/**
 * Type for error message arguments
 * Can be a string, Error, or any other value that can be converted to string
 */
type ErrorArg = string | Error | unknown;

/**
 * Helper function to extract error message from arguments and set it to a signal
 * @param args Arguments passed to the error handler
 * @returns The extracted error message or null if no arguments
 */
const extractErrorMessage = (...args: ErrorArg[]): string | null => {
  if (args.length > 0) {
    console.error(...args);

    // Extract error message for the signal
    const lastArg = args[args.length - 1];
    return lastArg instanceof Error
      ? lastArg.message
      : lastArg
        ? String(lastArg)
        : 'Unknown error';
  }
  return null;
};

export const setProfileError = (...args: ErrorArg[]): void => {
  profileError.set(extractErrorMessage(...args));
  // Clear the user profile when there's an error
  if (args.length > 0) {
    setUserProfile(null);
  }
};

export const setConnectionError = (...args: ErrorArg[]): void => {
  connectionError.set(extractErrorMessage(...args));
};

export const setNetwork = (chainId: number | undefined): void => {
  if (chainId) {
    const currentNetworkName = networkName.get();
    const newNetworkName = chainId
      ? (config.chains.find((chain) => chain.id === chainId)?.name ?? null)
      : null;
    if (currentNetworkName !== newNetworkName) {
      setNetworkName(newNetworkName);
      refreshUpdraftSettings();
      refreshBalances();
    }
  }
};

export const setNetworkName = (name: string | null): void => {
  networkName.set(name);
};

export const resetState = (): void => {
  userAddress.set(null);
  userProfile.set(null);
  isConnecting.set(false);
  connectionError.set(null);
  profileError.set(null);
  networkName.set(null);
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
    setConnectionError('Error connecting wallet', err);
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
    await disconnect(config);

    // Reset our internal application state
    resetState();
    console.log('Wallet disconnected and internal state reset.');
  } catch (err) {
    console.error('Error disconnecting wallet:', err);
    // Optionally set an error state here if needed
    // setConnectionError(err instanceof Error ? err.message : 'Unknown error');
  }
};

// Subscribe to profile updates when address changes
export const subscribeToProfileUpdates = (address: `0x${string}`): void => {
  cleanupProfileSubscription();
  profileSubscription = urqlClient
    .query(ProfileDocument, { userId: address })
    .subscribe(async (result) => {
      try {
        if (result.error) {
          setProfileError('Error fetching profile', result.error.message);
        }
        if (result.data?.user?.profile) {
          const profileData = JSON.parse(
            fromHex(result.data.user.profile as `0x${string}`, 'string')
          );
          setUserProfile(profileData);
        } else {
          setUserProfile(null);
        }
      } catch (err) {
        setProfileError('Error processing profile data', err);
      }
    });
};

// Clean up profile subscription (useful when component unmounts)
export const cleanupProfileSubscription = (): void => {
  if (profileSubscription) {
    profileSubscription.unsubscribe();
    profileSubscription = null;
  }
};

// --- Add Wagmi Watchers ---
// Initialize listeners for wagmi state changes right after config is available
watchAccount(config, {
  onChange(account) {
    setNetwork(account.chainId);

    const currentAddress = userAddress.get();
    const newAddress = account.address ?? null;

    // Only update user address if newAddress is not null
    if (newAddress) {
      if (currentAddress !== newAddress) {
        setUserAddress(newAddress);
        // Profile fetch is now handled within setUserAddress
      }
    }
    // Do NOT clear address/profile if newAddress is null (wallet locked)
    // Only clear on explicit disconnect (handled in disconnectWallet)

    // Update connection status flags
    setIsConnecting(account.isConnecting);
    refreshBalances();

    // Mark the 'connect-wallet' beginner task as complete
    markComplete('connect-wallet');
  },
});

watchChainId(config, {
  onChange(chainId) {
    setNetwork(chainId);
  },
});

setNetwork(getChainId(config));

// --- Application Initialization --- //
export const initializeUserState = async (): Promise<void> => {
  console.log('Initializing user state');
  setIsConnecting(true); // Set connecting flag initially
  try {
    await reconnect(config); // Trigger reconnect, watchAccount will handle updates
    // watchAccount will handle address updates which trigger profile fetching
    console.log('User state initialized, current state:', {
      address: userAddress.get(),
      isConnected: isConnected.get(),
      profile: userProfile.get() ? 'has profile' : 'no profile',
    });
  } catch (error) {
    setConnectionError('Error initializing user state', error);
  } finally {
    setIsConnecting(false);
  }
};
