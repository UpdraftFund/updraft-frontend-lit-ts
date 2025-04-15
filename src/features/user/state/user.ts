import { signal, computed } from '@lit-labs/signals';
import { createContext } from '@lit/context';
import { Task } from '@lit/task';
import type { ReactiveControllerHost } from 'lit';
import type { Address } from 'viem';
import { fromHex } from 'viem';

// Import user profile type
import type { CurrentUser } from '@/features/user/types/current-user';

// Import the wallet connection modal
import { modal } from '@utils/web3.ts';

// Define custom events for user state changes
export const USER_CONNECTED_EVENT = 'user-connected';
export const USER_DISCONNECTED_EVENT = 'user-disconnected';
export const USER_PROFILE_UPDATED_EVENT = 'user-profile-updated';
export const NETWORK_CHANGED_EVENT = 'network-changed';
export const PROFILE_LOADING_EVENT = 'profile-loading';
export const PROFILE_LOADED_EVENT = 'profile-loaded';
export const PROFILE_ERROR_EVENT = 'profile-error';

// Initialize signals with default values
export const userAddress = signal<Address | null>(null);
export const userProfile = signal<CurrentUser | null>(null);
export const isConnecting = signal<boolean>(false);
export const isLoadingProfile = signal<boolean>(false);
export const connectionError = signal<string | null>(null);
export const profileError = signal<string | null>(null);
export const networkName = signal<string | null>(null);

// Computed values
export const isConnected = computed(() => Boolean(userAddress.get()));
export const hasProfile = computed(() => userProfile.get() !== null);

// Task to fetch user profile - this will be attached to a controller element
let profileTask: Task<[string | null], CurrentUser | null> | null = null;

// Helper function to dispatch custom events
export const dispatchUserEvent = (
  eventName: string,
  detail?:
    | {
        address?: `0x${string}`;
        profile?: CurrentUser;
        networkName?: string;
        error?: string;
      }
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
    // Fetch profile for this address
    fetchUserProfile(address);
  } else {
    dispatchUserEvent(USER_DISCONNECTED_EVENT);
    setUserProfile(null);
  }
};

export const setUserProfile = (profile: CurrentUser | null): void => {
  // If we have a profile but it's missing both image and avatar, generate one from the address
  if (profile && !profile.image && !profile.avatar && userAddress.get()) {
    import('ethereum-blockies-base64').then(({ default: makeBlockie }) => {
      const addr = userAddress.get();
      if (addr) {
        // Use the same generated blockie for both image and avatar fields for consistency
        const blockieImage = makeBlockie(addr);
        profile.image = blockieImage;
        profile.avatar = blockieImage;

        console.log('Generated blockie for profile:', profile);
        userProfile.set(profile);
        dispatchUserEvent(USER_PROFILE_UPDATED_EVENT, { profile });
      }
    });
  } else {
    // If an upload happened through edit-profile, ensure both image and avatar are in sync
    if (profile && profile.image && !profile.avatar) {
      profile.avatar = profile.image;
    } else if (profile && profile.avatar && !profile.image) {
      profile.image = profile.avatar;
    }

    console.log('Setting user profile:', profile);
    userProfile.set(profile);
    if (profile) {
      dispatchUserEvent(USER_PROFILE_UPDATED_EVENT, { profile });
    }
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
  isLoadingProfile.set(false);
  connectionError.set(null);
  profileError.set(null);
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

// Fetch user profile using GraphQL
export const fetchUserProfile = async (userId: string): Promise<void> => {
  if (!userId) return;

  isLoadingProfile.set(true);
  profileError.set(null);
  dispatchUserEvent(PROFILE_LOADING_EVENT);

  try {
    console.log('Fetching profile for:', userId);
    const result = await urqlClient.query(ProfileDocument, { userId });

    if (result.error) {
      throw new Error(result.error.message);
    }

    if (result.data?.user?.profile) {
      const profileData = JSON.parse(
        fromHex(result.data.user.profile as `0x${string}`, 'string')
      );

      // Ensure we have both blockies image and avatar if none provided
      if (!profileData.image || !profileData.avatar) {
        const { default: makeBlockie } = await import(
          'ethereum-blockies-base64'
        );
        const blockieImage = makeBlockie(userId);

        if (!profileData.image) profileData.image = blockieImage;
        if (!profileData.avatar) profileData.avatar = blockieImage;

        console.log(
          'Updated profile with blockies in fetchUserProfile:',
          profileData
        );
      }

      setUserProfile(profileData);
      dispatchUserEvent(PROFILE_LOADED_EVENT, { profile: profileData });
    } else {
      // User exists but has no profile - create minimal profile with blockies avatar and image
      const { default: makeBlockie } = await import('ethereum-blockies-base64');
      const blockieImage = makeBlockie(userId);
      const minimalProfile = {
        avatar: blockieImage,
        image: blockieImage,
      };

      setUserProfile(minimalProfile);
      dispatchUserEvent(PROFILE_LOADED_EVENT, { profile: minimalProfile });
    }
  } catch (err) {
    console.error('Error fetching user profile:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    profileError.set(errorMessage);
    dispatchUserEvent(PROFILE_ERROR_EVENT, { error: errorMessage });
  } finally {
    isLoadingProfile.set(false);
  }
};

// Set up profile task (should be called from a controller component)
export const setupProfileTask = (
  host: ReactiveControllerHost
): Task<[string | null], CurrentUser | null> => {
  // Log the profile task setup
  console.log('Setting up profile task on host:', host);
  profileTask = new Task(host, {
    task: async ([address]) => {
      if (!address) return null;

      isLoadingProfile.set(true);
      profileError.set(null);
      dispatchUserEvent(PROFILE_LOADING_EVENT);

      try {
        const result = await urqlClient.query(ProfileDocument, {
          userId: address,
        });

        if (result.error) {
          throw new Error(result.error.message);
        }

        if (result.data?.user?.profile) {
          const profileData = JSON.parse(
            fromHex(result.data.user.profile as `0x${string}`, 'string')
          );

          // Ensure we have both blockies image and avatar if none provided
          if (!profileData.image || !profileData.avatar) {
            const { default: makeBlockie } = await import(
              'ethereum-blockies-base64'
            );
            const blockieImage = makeBlockie(address);

            if (!profileData.image) profileData.image = blockieImage;
            if (!profileData.avatar) profileData.avatar = blockieImage;

            console.log(
              'Updated profile with blockies image in task:',
              profileData
            );
          }

          setUserProfile(profileData);
          dispatchUserEvent(PROFILE_LOADED_EVENT, { profile: profileData });
          return profileData;
        } else {
          // User exists but has no profile - create minimal profile with blockies avatar and image
          const { default: makeBlockie } = await import(
            'ethereum-blockies-base64'
          );
          const blockieImage = makeBlockie(address);
          const minimalProfile = {
            avatar: blockieImage,
            image: blockieImage,
          };

          setUserProfile(minimalProfile);
          dispatchUserEvent(PROFILE_LOADED_EVENT, { profile: minimalProfile });
          return minimalProfile;
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error';
        profileError.set(errorMessage);
        dispatchUserEvent(PROFILE_ERROR_EVENT, { error: errorMessage });
        throw err;
      } finally {
        isLoadingProfile.set(false);
      }
    },
    args: () => [userAddress.get()] as const,
  });

  return profileTask;
};

// Get the current profile task
export const getProfileTask = (): Task<
  [string | null],
  CurrentUser | null
> | null => {
  return profileTask;
};

// --- Add Wagmi Watchers ---
// Initialize listeners for wagmi state changes right after config is available
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
      // Profile fetch is now handled within setUserAddress

      // When disconnecting (address becomes null), also clear the profile
      if (newAddress === null) {
        setUserProfile(null);
      }
    }

    // Update connection status flags
    setIsConnecting(account.isConnecting);
  },
});

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
    console.error('Error initializing user state:', error);
  } finally {
    setIsConnecting(false);
  }
};

// Define interface for the context
export interface UserState {
  address: Address | null; // Represents the current wallet address
  profile: CurrentUser | null; // Represents the fetched user profile
  isConnected: boolean; // Computed: is address non-null?
  isConnecting: boolean; // Reflects wagmi's connection/reconnection status
  isLoadingProfile: boolean; // Indicates profile is being fetched
  hasProfile: boolean; // Computed: is profile non-null?
  networkName: string | null; // Current network name from wagmi
  connectionError: string | null; // Error during connect process
  profileError: string | null; // Error during profile fetch
  connect: () => Promise<void>; // Function to initiate connection
  disconnect: () => Promise<void>; // Function to initiate disconnection
  fetchProfile: (userId: string) => Promise<void>; // Function to manually fetch profile
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
    isLoadingProfile: isLoadingProfile.get(),
    hasProfile: hasProfile.get(),
    networkName: networkName.get(),
    connectionError: connectionError.get(),
    profileError: profileError.get(),
    connect: connectWallet,
    disconnect: disconnectWallet,
    fetchProfile: fetchUserProfile,
    setAddress: setUserAddress,
    setProfile: setUserProfile,
    setNetworkName,
    setIsConnecting,
    setConnectionError,
    reset: resetState,
  };
  console.log('getUserState returning:', {
    address: state.address,
    isConnected: state.isConnected,
    profile: state.profile ? 'profile exists' : 'no profile',
    hasProfile: state.hasProfile,
  });
  return state;
};
