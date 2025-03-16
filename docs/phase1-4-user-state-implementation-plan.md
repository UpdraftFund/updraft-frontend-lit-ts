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

// State signals
export const userAddress = signal<Address | null>(null);
export const userProfile = signal<UserProfile | null>(null);
export const isConnecting = signal<boolean>(false);
export const connectionError = signal<string | null>(null);

// Computed values
export const isConnected = computed(() => userAddress.get() !== null);
export const hasProfile = computed(() => userProfile.get() !== null);

// State operations
export const setUserAddress = (address: Address | null): void => {
  userAddress.set(address);
};

export const setUserProfile = (profile: UserProfile | null): void => {
  userProfile.set(profile);
};

export const setIsConnecting = (connecting: boolean): void => {
  isConnecting.set(connecting);
};

export const setConnectionError = (error: string | null): void => {
  connectionError.set(error);
};

export const resetState = (): void => {
  userAddress.set(null);
  userProfile.set(null);
  isConnecting.set(false);
  connectionError.set(null);
};

// Define interface for the context
export interface UserState {
  address: Address | null;
  profile: UserProfile | null;
  isConnected: boolean;
  isConnecting: boolean;
  hasProfile: boolean;
  connectionError: string | null;
  setAddress: (address: Address | null) => void;
  setProfile: (profile: UserProfile | null) => void;
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
  connectionError: connectionError.get(),
  setAddress: setUserAddress,
  setProfile: setUserProfile,
  setIsConnecting: setIsConnecting,
  setConnectionError: setConnectionError,
  reset: resetState,
});
```

### 2. Context Provider Setup

Update `my-app.ts` to provide the user state context:

```typescript
// In my-app.ts
import { userContext, getUserState, resetState as resetUserState } from '@/state/user-state';

// Add to class
@provide({ context: userContext })
get userState() {
  return getUserState();
}

// Update route handling to reset state when needed
handleNavigation() {
  // Reset user state when navigating away from profile pages if needed
  // ...
}
```

### 3. Wallet Connection Integration

Update the wallet connection component to use the user state:

```typescript
// In wallet-connection.ts
import { consume } from '@lit/context';
import { userContext, UserState } from '@/state/user-state';

@customElement('wallet-connection')
export class WalletConnection extends LitElement {
  @consume({ context: userContext, subscribe: true })
  userState!: UserState;
  
  // Connect wallet method
  async connectWallet() {
    try {
      this.userState.setIsConnecting(true);
      this.userState.setConnectionError(null);
      
      // Existing wallet connection logic
      const address = await connectWithWagmi();
      
      // Update state
      this.userState.setAddress(address);
      
      // Fetch profile if available
      await this.fetchUserProfile(address);
    } catch (err) {
      this.userState.setConnectionError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      this.userState.setIsConnecting(false);
    }
  }
  
  // Fetch user profile
  async fetchUserProfile(address: Address) {
    try {
      const result = await urqlClient.query(UserProfileDocument, { address });
      if (result.data?.user) {
        this.userState.setProfile(result.data.user);
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  }
  
  // Render method
  render() {
    return html`
      ${this.userState.isConnected
        ? html`<div>Connected: ${this.userState.address}</div>`
        : html`<sl-button @click=${this.connectWallet} ?loading=${this.userState.isConnecting}>
            Connect Wallet
          </sl-button>`
      }
      ${this.userState.connectionError
        ? html`<div class="error">${this.userState.connectionError}</div>`
        : nothing
      }
    `;
  }
}
```

### 4. Profile Component Updates

Update profile-related components to consume from the user state:

```typescript
// In profile-page.ts
import { consume } from '@lit/context';
import { userContext, UserState } from '@/state/user-state';

@customElement('profile-page')
export class ProfilePage extends LitElement {
  @consume({ context: userContext, subscribe: true })
  userState!: UserState;
  
  // Render method
  render() {
    if (!this.userState.isConnected) {
      return html`<div>Please connect your wallet to view your profile</div>`;
    }
    
    if (!this.userState.hasProfile) {
      return html`<div>Loading profile...</div>`;
    }
    
    return html`
      <div>
        <h1>Profile</h1>
        <div>Address: ${this.userState.address}</div>
        <div>Username: ${this.userState.profile?.username}</div>
        <!-- Other profile information -->
      </div>
    `;
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
