# Lit Signals Best Practices

## Overview

This document outlines the proper usage of Lit Signals in the Updraft frontend application. Signals provide a powerful reactive state management solution that, when used correctly, offers significant advantages over context-based approaches for UI state management.

## What are Lit Signals?

Signals are reactive data structures for managing observable state that automatically trigger updates when their values change. They are part of the `@lit-labs/signals` package and provide a more granular update mechanism than Lit's default property-based reactivity.

## Key Concepts

### 1. Signal Creation

Create signals to hold reactive state:

```typescript
import { signal, computed } from '@lit-labs/signals';

// Create a simple signal
const count = signal(0);

// Create a signal with a more complex initial value
const user = signal({
  name: '',
  avatar: '',
  isAdmin: false,
});

// Create a computed signal that depends on other signals
const doubleCount = computed(() => count.get() * 2);
```

### 2. Signal Usage with SignalWatcher

The `SignalWatcher` mixin enables components to automatically track signal dependencies and update when signals change:

```typescript
import { SignalWatcher, html as signalsHtml } from '@lit-labs/signals';
import { LitElement, css } from 'lit';

export class MyComponent extends SignalWatcher(LitElement) {
  static styles = css`
    /* ... */
  `;

  render() {
    // Note: We're using html from @lit-labs/signals
    return signalsHtml`
      <div>
        <p>Count: ${count}</p>
        <p>Double: ${doubleCount}</p>
        <button @click=${() => count.set(count.get() + 1)}>Increment</button>
      </div>
    `;
  }
}
```

Key points:

- Import `html` from `@lit-labs/signals`, not from `lit`
- Use the `SignalWatcher` mixin with your component class
- Access signals directly in templates (no `.get()` needed)

### 3. Fine-grained Updates with watch()

For more control over which parts of your template update, use the `watch()` directive:

```typescript
import { html } from 'lit'; // Regular lit html
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

## Comparing Approaches

### 1. Auto-watching with SignalWatcher + html from @lit-labs/signals

```typescript
import { SignalWatcher, html } from '@lit-labs/signals';

export class MyComponent extends SignalWatcher(LitElement) {
  render() {
    return html`<p>Count: ${count}</p>`;
  }
}
```

Benefits:

- Minimal boilerplate
- Automatically tracks all signals used in template
- Entire component updates when any signal changes

### 2. Pinpoint Updates with watch() Directive

```typescript
import { html } from 'lit';
import { SignalWatcher, watch } from '@lit-labs/signals';

export class MyComponent extends SignalWatcher(LitElement) {
  render() {
    return html`<p>Count: ${watch(count)}</p>`;
  }
}
```

Benefits:

- More granular control over what updates
- Only updates the specific parts of the DOM that depend on changed signals
- Better performance for templates with lots of static content

## Signal Updates

Update signals using the `.set()` method:

```typescript
// Update a primitive signal
count.set(count.get() + 1);

// Update an object signal
user.set({
  ...user.get(),
  name: 'New Name',
});
```

Always use `.set()` to update signals, never modify them directly.

## Common Patterns

### 1. Centralized State with Signals

```typescript
// src/state/user-state.ts
import { signal, computed } from '@lit-labs/signals';

// Create signals
export const userAddress = signal<string | null>(null);
export const userProfile = signal<UserProfile | null>(null);

// Computed signals
export const isConnected = computed(() => userAddress.get() !== null);
export const displayName = computed(() => {
  const profile = userProfile.get();
  return profile ? profile.name : 'Guest';
});

// Actions
export const setUserAddress = (address: string | null) => {
  userAddress.set(address);
};

export const setUserProfile = (profile: UserProfile | null) => {
  userProfile.set(profile);
};

export const resetUserState = () => {
  userAddress.set(null);
  userProfile.set(null);
};
```

### 2. Using Signals with Tasks

```typescript
import { Task } from '@lit/task';
import { signal } from '@lit-labs/signals';

// State that affects data fetching
const selectedTab = signal('hot');
const searchQuery = signal('');

class DataComponent extends SignalWatcher(LitElement) {
  private dataTask = new Task(
    this,
    async ([tab, query]) => {
      // Fetch data based on signal values
      const result = await fetchData(tab, query);
      return result.data;
    },
    // Signal-based dependency array - task reruns when signals change
    () => [selectedTab.get(), searchQuery.get()]
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

## When to Use Signals vs. Context

### Use Signals For:

1. **UI State**: Frequently changing state that directly affects the UI

   - Form values and validation states
   - Toggle states (expanded/collapsed)
   - Filters and sorting options
   - Selection state
   - Pagination controls

2. **Shared Values**: Data that multiple components need to read from and write to

3. **Derived State**: Values computed from other pieces of state

4. **Performance-Critical Updates**: When you need fine-grained control over what rerenders

### Use Context For:

1. **Service Injection**: When components need access to service instances

   - Authentication services
   - API clients
   - Configuration providers

2. **Static Configuration**: Application-wide settings that rarely change

3. **Deep Component Trees**: When state needs to be accessed by deeply nested components

4. **Non-UI State**: Backend services and configuration that doesn't directly affect rendering

## Common Mistakes to Avoid

1. **Using Signals without SignalWatcher**: Components won't automatically update

2. **Using regular Lit html instead of signals html**: Prevents auto-tracking of signals

3. **Manually calling .get() everywhere in templates**: Unnecessary when using signals html

4. **Modifying signals directly**: Always use .set() to trigger proper updates

5. **Treating signals as global variables**: Signals are for reactive state, not just global access

## Migration Guidelines

### Migrating from Context to Signals

1. Identify which state is UI-related vs. service/configuration
2. Create signals for UI state
3. Update components to use SignalWatcher
4. Switch to the signals html tag or use watch() directive
5. Verify reactivity and update patterns

### Migrating Existing Signal-like Code

If you currently have code using signals incorrectly:

```typescript
// ❌ Incorrect approach
import { html } from 'lit';
import { signal } from '@lit-labs/signals';

const user = signal({ name: 'John' });

class MyComponent extends LitElement {
  render() {
    return html`<div>${user.get().name}</div>`;
  }
}
```

Correct it to:

```typescript
// ✅ Correct approach
import { html, signal, SignalWatcher } from '@lit-labs/signals';

const user = signal({ name: 'John' });

class MyComponent extends SignalWatcher(LitElement) {
  render() {
    return html`<div>${user.name}</div>`;
  }
}
```

## Conclusion

Properly used, Lit Signals provide a powerful and efficient way to manage reactive state in Lit applications. By following these best practices, we can create more maintainable, performant applications with clear data flow and optimal rendering.
