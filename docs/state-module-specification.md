# State Module Specification

## Overview

This document defines the specifications for state modules in the Updraft frontend application. Each state module follows a consistent pattern to ensure maintainability, testability, and proper reactivity using Lit Signals.

## Signal-Based State Module Pattern

### Core Principles

1. State is managed through reactive `@lit-labs/signals`
2. Components consume signals directly for UI state
3. Context is used only for service injection and configuration
4. Signals are accessed directly in templates when using the signals html tag

## Idea State Module Specification

### Purpose

The Idea State Module manages state related to ideas, including:
- Current active idea ID
- Idea tags
- Idea sharing status
- Related ideas

### Signal Definition

```typescript
// src/state/idea/signals.ts
import {signal, computed} from '@lit-labs/signals';

// Core signals - exported for direct consumption
export const ideaId = signal<string | null>(null);
export const tags = signal<string[]>([]);
export const isLoading = signal<boolean>(false);

// Computed signals
export const hasTags = computed(() => tags.get().length > 0);

// Action functions for updating state
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

### Component Consumption

```typescript
// In a component that needs idea state
import {SignalWatcher, html} from '@lit-labs/signals';
import {LitElement, css} from 'lit';
import {customElement} from 'lit/decorators.js';
import {ideaId, tags, hasTags, setTags} from '../state/idea/signals';

@customElement('idea-tags-display')
export class IdeaTagsDisplay extends SignalWatcher(LitElement) {
  static styles = css`/* ... */`;
  
  render() {
    // Signals are accessed directly without .get()
    return html`
      <div>
        ${hasTags
          ? html`<div>Tags: ${tags.map(tag => html`<span>${tag}</span>`)}</div>`
          : html`<div>No tags available</div>`
        }
        <button @click=${() => setTags([...tags.get(), 'new-tag'])}>Add Tag</button>
      </div>
    `;
  }
}
```

## User State Module Specification

### Purpose

The User State Module manages state related to the user, including:
- User profile information
- Wallet connection status
- User preferences

### Signal Definition

```typescript
// src/state/user/signals.ts
import {signal, computed} from '@lit-labs/signals';
import type {Address} from 'viem';
import type {UserProfile} from '@/types';

// Core signals
export const userAddress = signal<Address | null>(null);
export const userProfile = signal<UserProfile | null>(null);
export const isConnecting = signal<boolean>(false);
export const connectionError = signal<string | null>(null);

// Computed signals
export const isConnected = computed(() => userAddress.get() !== null);
export const hasProfile = computed(() => userProfile.get() !== null);
export const displayName = computed(() => {
  const profile = userProfile.get();
  return profile?.name || 'Anonymous';
});

// State operations
export const setUserAddress = (address: Address | null): void => {
  userAddress.set(address);
};

export const setUserProfile = (profile: UserProfile | null): void => {
  userProfile.set(profile);
};

export const resetUserState = (): void => {
  userAddress.set(null);
  userProfile.set(null);
  isConnecting.set(false);
  connectionError.set(null);
};
```

## App State Module Specification

### Purpose

The App State Module manages application-wide state, including:
- Theme preferences
- Layout configuration
- Global UI state (modals, notifications)

### Signal Definition

```typescript
// src/state/app/signals.ts
import {signal} from '@lit-labs/signals';

// Read from localStorage for persistence
const storedTheme = localStorage.getItem('theme') || 'system';
const storedSidebarState = localStorage.getItem('sidebarExpanded');

// Core signals
export const theme = signal<'light' | 'dark' | 'system'>(storedTheme as any);
export const sidebarExpanded = signal<boolean>(
  storedSidebarState ? JSON.parse(storedSidebarState) : true
);
export const activeModals = signal<string[]>([]);

// Actions
export const setTheme = (newTheme: 'light' | 'dark' | 'system'): void => {
  theme.set(newTheme);
  localStorage.setItem('theme', newTheme);
};

export const toggleSidebar = (): void => {
  const newState = !sidebarExpanded.get();
  sidebarExpanded.set(newState);
  localStorage.setItem('sidebarExpanded', JSON.stringify(newState));
};

export const openModal = (modalId: string): void => {
  const current = activeModals.get();
  if (!current.includes(modalId)) {
    activeModals.set([...current, modalId]);
  }
};

export const closeModal = (modalId: string): void => {
  const current = activeModals.get();
  activeModals.set(current.filter(id => id !== modalId));
};
```

## Integration with Tasks

When working with asynchronous operations, combine signals with `@lit/task`:

```typescript
import {Task} from '@lit/task';
import {SignalWatcher, html} from '@lit-labs/signals';
import {ideaId, isLoading} from '../state/idea/signals';

class IdeaDetails extends SignalWatcher(LitElement) {
  private ideaTask = new Task(
    this,
    async ([id]) => {
      if (!id) return null;
      isLoading.set(true);
      try {
        const result = await fetchIdea(id);
        return result;
      } finally {
        isLoading.set(false);
      }
    },
    // Signal-based dependency array
    () => [ideaId.get()]
  );
  
  render() {
    return html`
      ${this.ideaTask.render({
        pending: () => html`<div>Loading idea details...</div>`,
        complete: (idea) => idea 
          ? html`<div>Idea: ${idea.title}</div>` 
          : html`<div>No idea selected</div>`,
        error: (e) => html`<div>Error: ${e.message}</div>`
      })}
    `;
  }
}
```

## Service Injection with Context

For service injection, continue using context:

```typescript
import {createContext} from '@lit/context';
import {provide, consume} from '@lit/context';

// Create a context for a service
export interface ApiClient {
  query: (query: string, variables: any) => Promise<any>;
  // ... other methods
}

// Create the context
export const apiClientContext = createContext<ApiClient>('api-client');

// Provider implementation
@provide({context: apiClientContext})
get apiClient() {
  return this._apiClient;
}

// Consumer implementation
@consume({context: apiClientContext})
apiClient!: ApiClient;
```

## Implementation Guidelines

1. **Signal Creation**
   - Keep signals focused on specific pieces of state
   - Initialize with sensible default values
   - Use TypeScript generics for type safety

2. **Component Integration**
   - Use SignalWatcher mixin for components that consume signals
   - Import html from @lit-labs/signals for auto-tracking
   - Keep rendering logic clean by using computed signals for derived state

3. **State Updates**
   - Create functions for all state updates
   - Never modify signal values directly from components
   - Implement validation in update functions

4. **Performance Optimization**
   - Use computed signals for expensive derivations
   - Consider using watch() directive for fine-grained updates
   - Benchmark and optimize signal operations when dealing with large data sets
