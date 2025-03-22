# System Patterns

## Architecture Overview

The Updraft frontend application is built on a component-based architecture using Lit and Web Components. The application uses a reactive state management approach with Lit Signals at its core.

## Component Architecture

### Web Components with Lit

The UI is composed of Lit components, which are:

- Custom elements extending from LitElement
- Encapsulated via Shadow DOM
- Rendered declaratively with Lit templates
- Reactive to property changes

### Component File Structure

```
src/
  components/
    my-component/
      my-component.ts    # Main component definition
      my-component.css   # Component styles
      my-component.test.ts # Unit tests
  pages/
    page-components/    # Page-specific components
    page-name.ts        # Page components
  utils/                # Utility functions
  services/             # Service classes
  state/                # Shared state (using Signals)
```

## State Management with Lit Signals

Based on the documentation in `docs/lit-signals-best-practices.md`, the application implements state management using the following patterns:

### Signal Creation and Usage

```typescript
// Creating signals
import { signal, computed } from '@lit-labs/signals';

const count = signal(0);
const user = signal({ name: '', avatar: '', isAdmin: false });

// Creating computed signals
const doubleCount = computed(() => count.get() * 2);
```

### Component Integration with SignalWatcher

```typescript
import { SignalWatcher, html as signalsHtml } from '@lit-labs/signals';
import { LitElement, css } from 'lit';

export class MyComponent extends SignalWatcher(LitElement) {
  static styles = css`
    /* ... */
  `;

  render() {
    // Using signalsHtml for auto-tracking of signals
    return signalsHtml`
      <div>
        <p>Count: ${count}</p>
        <button @click=${() => count.set(count.get() + 1)}>
          Increment
        </button>
      </div>
    `;
  }
}
```

### Fine-grained Updates with watch()

```typescript
import { html } from 'lit';
import { watch } from '@lit-labs/signals';

export class MyComponent extends SignalWatcher(LitElement) {
  render() {
    return html`
      <div>
        <p>This updates when count changes: ${watch(count)}</p>
        <p>This doesn't re-render when count changes</p>
      </div>
    `;
  }
}
```

### Centralized State Pattern

```typescript
// src/state/user-state.ts
import { signal, computed } from '@lit-labs/signals';

// Create signals
export const userAddress = signal<string | null>(null);
export const userProfile = signal<UserProfile | null>(null);

// Computed signals
export const isConnected = computed(() => userAddress.get() !== null);

// Actions to update state
export const setUserAddress = (address: string | null) => {
  userAddress.set(address);
};

export const resetUserState = () => {
  userAddress.set(null);
  userProfile.set(null);
};
```

## Data Fetching Patterns

### Task for Async Operations

The application uses `@lit/task` to handle asynchronous operations with automatic loading, error, and success states:

```typescript
import { Task } from '@lit/task';
import { signal } from '@lit-labs/signals';

// State that affects data fetching
const selectedTab = signal('hot');

class DataComponent extends SignalWatcher(LitElement) {
  private dataTask = new Task(
    this,
    async ([tab]) => {
      // Fetch data based on signal values
      const result = await fetchData(tab);
      return result.data;
    },
    // Signal-based dependency array
    () => [selectedTab.get()]
  );

  render() {
    return html`
      ${this.dataTask.render({
        pending: () => html`<div>Loading...</div>`,
        complete: (data) => html`<div class="results">...</div>`,
        error: (e) => html`<div>Error: ${e.message}</div>`,
      })}
    `;
  }
}
```

## Routing Pattern

The application uses `@lit-labs/router` for client-side routing:

```typescript
import { Router } from '@lit-labs/router';

class AppRoot extends LitElement {
  private router = new Router(this, [
    {
      path: '/',
      render: () => html`<home-page></home-page>`,
    },
    {
      path: '/profile',
      render: () => html`<profile-page></profile-page>`,
    },
  ]);

  render() {
    return html` <main>${this.router.outlet()}</main> `;
  }
}
```

## Service Pattern

For functionality that needs to be shared across components, services are used:

```typescript
// services/web3-service.ts
class Web3Service {
  async connect() {
    /* ... */
  }
  async disconnect() {
    /* ... */
  }
  async signMessage(message: string) {
    /* ... */
  }
}

// Make it available via context
import { createContext } from '@lit/context';
export const web3ServiceContext = createContext<Web3Service>('web3-service');
```

## Design Patterns

### When to Use Signals vs. Context

- **Signals** are used for:

  - UI state (form values, toggles, filters)
  - Shared values needed across components
  - Derived state (computed values)
  - Performance-critical updates

- **Context** is used for:
  - Service injection
  - Static configuration
  - Deep component tree access
  - Non-UI state (backend services, config)

### Common Patterns and Anti-patterns

Based on the best practices documentation, the following patterns are enforced:

#### Correct Signal Usage

- Always extending components with `SignalWatcher`
- Using `html` from `@lit-labs/signals` for auto-tracking
- Using `.set()` to update signals, never modifying directly

#### Avoiding Anti-patterns

- Not using Signals without SignalWatcher
- Not using regular Lit html instead of signals html
- Not manually calling .get() in templates with signalsHtml
- Not modifying signals directly
- Not treating signals as just global variables
