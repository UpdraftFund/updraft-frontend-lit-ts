# Phase 1.4: User State Implementation Plan

## Overview

This document outlines the implementation plan for Phase 1.4 of our state management architecture, focusing on the User State module. Building on the lessons learned from our successful implementation of the Idea State module, we'll apply similar patterns while addressing the unique requirements of user-related data.

## Objectives

1. Create a centralized user state module that manages user profile, authentication, and wallet connection
2. Migrate existing user-related components to consume from this state
3. Implement proper state initialization and cleanup during navigation
4. Ensure wallet connection status is properly synchronized across the application

## Implementation Details

### 1. User State Module Structure

```typescript
// src/state/user-state.ts
import { signal, computed } from '@lit-labs/signals';
import { createContext } from '@lit/context';
import type { Address } from 'viem';

// Import user profile type
import type { CurrentUser } from '@/types/current-user';

// Import the wallet connection modal
import { modal } from '@/web3';

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
const dispatchUserEvent = (eventName: string, detail?: any) => {
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
  dispatchUserEvent(USER_DISCONNECTED_EVENT);
};

// Connect wallet function
export const connectWallet = async (): Promise<void> => {
  try {
    setIsConnecting(true);
    setConnectionError(null);
    
    // Open the wallet connection modal
    await modal.open({ view: 'Connect' });
    
    // The modal will automatically close on successful connection
    // because the AppKit handles this internally
  } catch (err) {
    setConnectionError(err instanceof Error ? err.message : 'Unknown error');
  } finally {
    setIsConnecting(false);
  }
};

// Disconnect wallet function
export const disconnectWallet = async (): Promise<void> => {
  try {
    // Disconnect the wallet using the modal
    await modal.disconnect();
    resetState();
  } catch (err) {
    console.error('Error disconnecting wallet:', err);
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
export const getUserState = (): UserState => ({
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
});
```

### 2. Context Provider Setup

Update `my-app.ts` to provide the user state context:

```typescript
// In my-app.ts
import { userContext, getUserState, setUserAddress, setUserProfile, setNetworkName } from '@/state/user-state';

// Add to class
@provide({ context: userContext })
get userState() {
  return getUserState();
}

// Initialize user state from wallet connection
constructor() {
  super();
  
  // Subscribe to wallet connection events
  modal.subscribeAccount(async ({ isConnected, address }) => {
    if (address) {
      // Update user state with address
      setUserAddress(address as `0x${string}`);
      
      // Fetch and update profile
      const result = await urqlClient.query(ProfileDocument, {
        userId: address,
      });
      if (result.data?.user?.profile) {
        const profile = JSON.parse(
          fromHex(result.data.user.profile as `0x${string}`, 'string')
        );
        
        // Update user state with profile
        setUserProfile({
          name: profile.name || profile.team || address,
          image: profile.image,
          avatar: profile.image || makeBlockie(address),
        });
      }
    }
  });
  
  // Subscribe to network changes
  modal.subscribeNetwork(({ caipNetwork }) => {
    // Update user state with network name
    setNetworkName(caipNetwork?.name || null);
  });
}
```

### 3. User Profile Component Implementation

Create a new user-profile component that consumes the user state:

```typescript
// In user-profile.ts
import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { when } from 'lit/directives/when.js';
import '@shoelace-style/shoelace/dist/components/avatar/avatar.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';

import { modal } from '@/web3';

import {
  userContext,
  UserState,
  USER_CONNECTED_EVENT,
  USER_DISCONNECTED_EVENT,
  USER_PROFILE_UPDATED_EVENT,
  NETWORK_CHANGED_EVENT
} from '@/state/user-state';

@customElement('user-profile')
export class UserProfile extends LitElement {
  static styles = css`
    /* Styles omitted for brevity */
  `;

  // Consume the user state context
  @consume({ context: userContext, subscribe: true })
  userState!: UserState;

  // Event handlers for user state changes
  private userConnectedHandler = () => this.requestUpdate();
  private userDisconnectedHandler = () => this.requestUpdate();
  private userProfileUpdatedHandler = () => this.requestUpdate();
  private networkChangedHandler = () => this.requestUpdate();

  connectedCallback() {
    super.connectedCallback();
    
    // Add event listeners for user state changes
    document.addEventListener(USER_CONNECTED_EVENT, this.userConnectedHandler);
    document.addEventListener(USER_DISCONNECTED_EVENT, this.userDisconnectedHandler);
    document.addEventListener(USER_PROFILE_UPDATED_EVENT, this.userProfileUpdatedHandler);
    document.addEventListener(NETWORK_CHANGED_EVENT, this.networkChangedHandler);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    
    // Remove event listeners to prevent memory leaks
    document.removeEventListener(USER_CONNECTED_EVENT, this.userConnectedHandler);
    document.removeEventListener(USER_DISCONNECTED_EVENT, this.userDisconnectedHandler);
    document.removeEventListener(USER_PROFILE_UPDATED_EVENT, this.userProfileUpdatedHandler);
    document.removeEventListener(NETWORK_CHANGED_EVENT, this.networkChangedHandler);
  }

  /**
   * Handle connect button click
   */
  private async handleConnect() {
    try {
      // Use the connect method from the user state
      if (this.userState) {
        await this.userState.connect();
      } else {
        // Fallback to direct modal open if userState is not available
        await modal.open({ view: 'Connect' });
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  }

  /**
   * Formats an address for display
   */
  private formatAddress(address: string): string {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }

  render() {
    // Check if the user state is available
    if (!this.userState) {
      // Instead of just showing "Please connect your wallet", show a button to connect
      return html`
        <sl-button @click=${this.handleConnect}>Connect Wallet</sl-button>
      `;
    }
    
    // Rest of the render method remains the same
  }
}
```

## Testing Strategy

1. **Unit Tests**:
   - Test state operations (setters, getters, reset)
   - Verify computed values update correctly
   - Test context creation and access

2. **Component Tests**:
   - Test wallet connection component with mocked state
   - Verify profile components render correctly based on state
   - Test error handling and loading states

3. **Integration Tests**:
   - Verify wallet connection updates profile components
   - Test navigation between pages maintains correct state
   - Verify error states propagate correctly

## Implementation Timeline

1. **Day 1-2**: Create user state module and update my-app.ts
2. **Day 3-4**: Update wallet connection component and test
3. **Day 5-6**: Update profile components and test
4. **Day 7**: Integration testing and documentation

## Success Criteria

1. User state is properly centralized and accessible throughout the application
2. Wallet connection status is synchronized across all components
3. Profile information is loaded once and shared efficiently
4. Components react appropriately to state changes
5. All tests pass with good coverage
6. Documentation is updated with any new patterns or lessons learned

## Potential Challenges

1. **Wallet Connection Timing**: Ensure wallet connection events are properly synchronized with state updates
2. **Profile Data Caching**: Determine appropriate caching strategy for profile data
3. **Error Handling**: Implement consistent error handling across all user-related operations
4. **State Persistence**: Decide if/how user state should persist across page reloads

## Conclusion

This implementation plan provides a structured approach to centralizing user state management in the Updraft frontend. By building on the lessons learned from our idea state implementation, we can create a robust and efficient user state module that improves the overall architecture of the application.
