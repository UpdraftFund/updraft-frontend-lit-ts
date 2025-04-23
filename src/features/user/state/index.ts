import { signal, computed } from '@lit-labs/signals';
import type { Address } from 'viem';
import { fromHex } from 'viem';

// Import user profile type
import type { CurrentUser } from '@/features/user/types/current-user';

// Import the wallet connection modal
import { modal, config } from '@utils/web3';
import { disconnect, watchAccount, reconnect } from '@wagmi/core';

// Import urqlClient for GraphQL queries
import urqlClient from '@utils/urql-client';
import { ProfileDocument } from '@gql';

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
  const profile = userProfile.get();
  if (profile) {
    userProfile.set({
      ...profile,
      image,
      avatar: image,
    });
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
        profile.avatar = blockieImage;
        console.log('Generated blockie for profile:', profile);
        userProfile.set(profile);
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
};

export const resetState = (): void => {
  userAddress.set(null);
  userProfile.set(null);
  isConnecting.set(false);
  isLoadingProfile.set(false);
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
    } else {
      // User exists but has no profile - create minimal profile with blockies avatar and image
      const { default: makeBlockie } = await import('ethereum-blockies-base64');
      const blockieImage = makeBlockie(userId);
      const minimalProfile = {
        avatar: blockieImage,
        image: blockieImage,
      };

      setUserProfile(minimalProfile);
    }
  } catch (err) {
    console.error('Error fetching user profile:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    profileError.set(errorMessage);
  } finally {
    isLoadingProfile.set(false);
  }
};

// Subscribe to profile updates when address changes
export const subscribeToProfileUpdates = (address: string | null): void => {
  // Clean up any existing subscription
  if (profileSubscription) {
    profileSubscription.unsubscribe();
    profileSubscription = null;
  }

  // If no address, nothing to do
  if (!address) return;

  // Set loading state
  isLoadingProfile.set(true);
  profileError.set(null);

  // Create subscription
  profileSubscription = urqlClient
    .query(ProfileDocument, { userId: address })
    .subscribe(async (result) => {
      try {
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
              'Updated profile with blockies image in subscription:',
              profileData
            );
          }

          setUserProfile(profileData);
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
        }
      } catch (err) {
        console.error('Error processing profile data:', err);
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error';
        profileError.set(errorMessage);
      } finally {
        isLoadingProfile.set(false);
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
