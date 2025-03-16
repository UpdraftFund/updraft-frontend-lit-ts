# State Module Specification

## Overview

This document defines the specifications for state modules in the Updraft frontend application. Each state module follows a consistent pattern to ensure maintainability, testability, and proper reactivity.

## Idea State Module Specification

### Purpose

The Idea State Module manages state related to ideas, including:
- Current active idea ID
- Idea tags
- Idea sharing status
- Related ideas

### Interface

```typescript
// IdeaState interface - what components will consume
export interface IdeaState {
  // Core data
  ideaId: string | null;
  tags: string[];
  
  // Computed values
  hasTags: boolean;
  isLoading: boolean;
  
  // Actions
  setIdeaId: (id: string | null) => void;
  setTags: (tags: string[]) => void;
  resetState: () => void;
}
```

### Signals

```typescript
// Internal signals - not directly exposed to components
export const ideaId = signal<string | null>(null);
export const tags = signal<string[]>([]);
export const isLoading = signal<boolean>(false);

// Computed values
export const hasTags = computed(() => tags.get().length > 0);
```

### Actions

```typescript
// Actions for updating state
export const setIdeaId = (id: string | null): void => {
  ideaId.set(id);
};

export const setTags = (newTags: string[]): void => {
  tags.set([...newTags]);
};

export const resetState = (): void => {
  ideaId.set(null);
  tags.set([]);
  isLoading.set(false);
};
```

### Context

```typescript
// Context for consumption by components
export const ideaContext = createContext<IdeaState>('idea-state');
```

### Provider Implementation

In `my-app.ts` or other top-level component:

```typescript
import { ideaContext, ideaId, tags, hasTags, isLoading, setIdeaId, setTags, resetState } from './state/idea-state';

// ...

@provide({ context: ideaContext })
get ideaState(): IdeaState {
  return {
    ideaId: ideaId.get(),
    tags: tags.get(),
    hasTags: hasTags.get(),
    isLoading: isLoading.get(),
    setIdeaId,
    setTags,
    resetState
  };
}
```

### Consumer Implementation

In a component that needs idea state:

```typescript
import { ideaContext, IdeaState } from './state/idea-state';

// ...

@consume({ context: ideaContext, subscribe: true })
ideaState!: IdeaState;

// Use in render method
render() {
  return html`
    <div>
      ${this.ideaState.hasTags
        ? html`<div>Tags: ${this.ideaState.tags.join(', ')}</div>`
        : html`<div>No tags available</div>`
      }
    </div>
  `;
}
```

## User State Module Specification

### Purpose

The User State Module manages state related to the user, including:
- User profile information
- Wallet connection status
- User preferences

### Interface

```typescript
export interface UserState {
  // Core data
  profile: UserProfile | null;
  isConnected: boolean;
  walletAddress: string | null;
  
  // Computed values
  hasProfile: boolean;
  
  // Actions
  setProfile: (profile: UserProfile | null) => void;
  setWalletAddress: (address: string | null) => void;
  setConnected: (connected: boolean) => void;
  resetState: () => void;
}
```

## App State Module Specification

### Purpose

The App State Module manages application-wide state, including:
- Theme preferences
- Layout configuration
- Global UI state (modals, notifications)

### Interface

```typescript
export interface AppState {
  // Core data
  theme: 'light' | 'dark' | 'system';
  sidebarExpanded: boolean;
  activeModals: string[];
  
  // Actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleSidebar: () => void;
  openModal: (modalId: string) => void;
  closeModal: (modalId: string) => void;
}
```

## State Module Implementation Guidelines

1. **Signal Creation**:
   - Use descriptive names for signals
   - Initialize with sensible default values
   - Consider using TypeScript generics for type safety

2. **Computed Values**:
   - Create computed values for derived state
   - Keep computations pure and simple
   - Avoid expensive operations in computed values

3. **Actions**:
   - Create functions for all state updates
   - Never modify signal values directly from components
   - Implement validation in actions where appropriate

4. **Context**:
   - Use descriptive names for contexts
   - Create a clear interface for what components will consume
   - Include both state values and actions in the interface

5. **Providers**:
   - Implement providers in top-level components
   - Use getter methods to ensure latest values
   - Consider memoization for complex state objects

6. **Consumers**:
   - Always use `subscribe: true` when reactivity is needed
   - Handle potential undefined state gracefully
   - Include consumed state in task dependencies

## Migration Guidelines

1. **Identify State Requirements**:
   - Analyze component's current state usage
   - Determine which state should be local vs. global
   - Map out component dependencies

2. **Create State Module**:
   - Implement according to specifications
   - Add necessary actions and computed values

3. **Update Component**:
   - Replace local state with consumed context
   - Update event handlers to use actions
   - Ensure proper reactivity with task dependencies

4. **Test**:
   - Verify component behavior with new state management
   - Test navigation scenarios
   - Validate proper state reset
