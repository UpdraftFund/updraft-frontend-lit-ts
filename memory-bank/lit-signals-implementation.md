# Lit Signals Implementation

This document provides detailed information on how Lit Signals are implemented in the Updraft frontend application, based on the best practices outlined in `docs/lit-signals-best-practices.md`.

## Overview

Lit Signals provide a reactive state management solution that allows for fine-grained updates to the UI when data changes. This implementation details how signals are used throughout the application.

## Signal Types

### Basic Signals

Basic signals are used for primitive values and objects:

```typescript
import { signal } from '@lit-labs/signals';

// Primitive signals
export const count = signal(0);
export const isLoading = signal(false);

// Object signals
export const user = signal({
  address: '',
  name: '',
  avatar: '',
});
```

### Computed Signals

Computed signals derive their value from other signals:

```typescript
import { signal, computed } from '@lit-labs/signals';

export const firstName = signal('John');
export const lastName = signal('Doe');

// Computed signal
export const fullName = computed(() => `${firstName.get()} ${lastName.get()}`);
```

## Component Integration

### SignalWatcher Mixin

All components that use signals should extend from `SignalWatcher(LitElement)`:

```typescript
import { SignalWatcher, html } from '@lit-labs/signals';
import { LitElement, css } from 'lit';

export class UserProfile extends SignalWatcher(LitElement) {
  static styles = css`
    /* styles */
  `;

  render() {
    // Use signals directly in templates
    return html`
      <div class="profile">
        <h2>${fullName}</h2>
        <p>${user.address}</p>
      </div>
    `;
  }
}
```

### Using Regular html with watch()

For more control over updates, use the `watch()` directive:

```typescript
import { html } from 'lit';
import { watch } from '@lit-labs/signals';
import { SignalWatcher } from '@lit-labs/signals';
import { LitElement } from 'lit';

export class PerformantComponent extends SignalWatcher(LitElement) {
  render() {
    return html`
      <div>
        <!-- Only this part updates when count changes -->
        <p>Count: ${watch(count)}</p>

        <!-- Static content, doesn't re-render on signal changes -->
        <p>This text is static</p>
      </div>
    `;
  }
}
```

## State Management Patterns

### Centralized State

The application uses a centralized state pattern with signals for shared state:

```typescript
// src/state/user-state.ts
import { signal, computed } from '@lit-labs/signals';

// State
export const userAddress = signal<string | null>(null);
export const userProfile = signal<UserProfile | null>(null);

// Computed state
export const isConnected = computed(() => userAddress.get() !== null);
export const displayName = computed(() => {
  const profile = userProfile.get();
  return profile?.name || 'Guest';
});

// Actions
export const setUserAddress = (address: string | null) => {
  userAddress.set(address);
};

export const setUserProfile = (profile: UserProfile | null) => {
  userProfile.set(profile);
};

export const logout = () => {
  userAddress.set(null);
  userProfile.set(null);
};
```

### Feature-specific State

For state specific to features, signals are organized by feature:

```typescript
// src/state/dashboard-state.ts
import { signal } from '@lit-labs/signals';

export const selectedTab = signal('overview');
export const timeframe = signal('week');
export const filters = signal({
  showCompleted: false,
  sortBy: 'date',
});

export const setTab = (tab: string) => {
  selectedTab.set(tab);
};

export const setTimeframe = (newTimeframe: string) => {
  timeframe.set(newTimeframe);
};

export const updateFilters = (newFilters: Partial<typeof filters.value>) => {
  filters.set({
    ...filters.get(),
    ...newFilters,
  });
};
```

## Data Fetching with Signals and Tasks

For data fetching that depends on signals:

```typescript
import { Task } from '@lit/task';
import { signal } from '@lit-labs/signals';
import { SignalWatcher, html } from '@lit-labs/signals';
import { LitElement } from 'lit';

// State affecting data fetching
export const projectId = signal<string | null>(null);

export class ProjectDetails extends SignalWatcher(LitElement) {
  private projectTask = new Task(
    this,
    async ([id]) => {
      if (!id) return null;
      const response = await fetch(`/api/projects/${id}`);
      return response.json();
    },
    // Dependencies array based on signals
    () => [projectId.get()]
  );

  render() {
    return html`
      ${this.projectTask.render({
        pending: () => html`<div>Loading project details...</div>`,
        complete: (project) => html`
          <div class="project">
            <h1>${project.title}</h1>
            <p>${project.description}</p>
          </div>
        `,
        error: (error) => html`<div>Error: ${error.message}</div>`,
      })}
    `;
  }
}
```

## Form Handling with Signals

For form state management:

```typescript
import { signal } from '@lit-labs/signals';
import { SignalWatcher, html } from '@lit-labs/signals';
import { LitElement } from 'lit';

// Form state signals
const formValues = signal({
  name: '',
  email: '',
  message: '',
});

// Validation state
const formErrors = signal({
  name: '',
  email: '',
  message: '',
});

// Form status
const isSubmitting = signal(false);
const isSubmitted = signal(false);

export class ContactForm extends SignalWatcher(LitElement) {
  updateField(field: string, value: string) {
    formValues.set({
      ...formValues.get(),
      [field]: value,
    });
  }

  validateForm() {
    // Validation logic
    // ...
  }

  async submitForm() {
    isSubmitting.set(true);

    try {
      // Submit form data
      // ...
      isSubmitted.set(true);
    } catch (error) {
      // Handle error
    } finally {
      isSubmitting.set(false);
    }
  }

  render() {
    return html`
      <form @submit=${this.submitForm}>
        <div>
          <label for="name">Name</label>
          <input
            id="name"
            value=${formValues.value.name}
            @input=${(e: Event) =>
              this.updateField('name', (e.target as HTMLInputElement).value)}
          />
          ${formErrors.value.name
            ? html`<div class="error">${formErrors.value.name}</div>`
            : ''}
        </div>

        <!-- Other form fields -->

        <button type="submit" ?disabled=${isSubmitting.value}>
          ${isSubmitting.value ? 'Submitting...' : 'Submit'}
        </button>
      </form>
    `;
  }
}
```

## Signal Update Best Practices

### Updating Primitive Signals

```typescript
// Get and set
count.set(count.get() + 1);

// Direct set
isLoading.set(true);
```

### Updating Object Signals

Always create a new object when updating object signals:

```typescript
// Correct: Create a new object
user.set({
  ...user.get(),
  name: 'New Name',
});

// Correct: Updating nested properties
filters.set({
  ...filters.get(),
  settings: {
    ...filters.get().settings,
    darkMode: true,
  },
});
```

## Migration Guidelines

For components currently not using signals correctly:

### From:

```typescript
// Incorrect
import { html } from 'lit';
import { signal } from '@lit-labs/signals';
import { LitElement } from 'lit';

const count = signal(0);

class CounterComponent extends LitElement {
  render() {
    return html`
      <div>
        <p>Count: ${count.get()}</p>
        <button @click=${() => count.set(count.get() + 1)}>Increment</button>
      </div>
    `;
  }
}
```

### To:

```typescript
// Correct
import { SignalWatcher, html } from '@lit-labs/signals';
import { LitElement } from 'lit';

const count = signal(0);

class CounterComponent extends SignalWatcher(LitElement) {
  render() {
    return html`
      <div>
        <p>Count: ${count}</p>
        <button @click=${() => count.set(count.get() + 1)}>Increment</button>
      </div>
    `;
  }
}
```

## Performance Considerations

- Use `watch()` for fine-grained updates in complex templates
- Avoid excessive Signal creation
- Keep signal updates focused and minimal
- Consider using computed signals for derived data
