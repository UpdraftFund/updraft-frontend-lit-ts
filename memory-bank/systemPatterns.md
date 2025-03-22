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
    page-specific/      # Page-specific components
  utils/                # Utility functions
  state/                # Shared state (using Signals)
```

## State Management with Lit Signals

The application uses Lit Signals as its primary state management solution. Here's a real-world example from our codebase:

```typescript
// src/state/beginner-tasks-state.ts
import { signal, computed } from '@lit-labs/signals';

// Define task constants with TypeScript const assertions
export const BEGINNER_TASKS = [
  'follow-someone',
  'watch-tag',
  'connect-wallet',
  'get-gas',
  'get-upd',
  'support-idea',
  'fund-solution',
  'create-profile',
] as const;

export type BeginnerTask = (typeof BEGINNER_TASKS)[number];

// Core state signal
export const completedTasks = signal<Set<BeginnerTask>>(new Set());

// Computed signal for derived state
export const allTasksCompleted = computed(
  () => completedTasks.get().size === BEGINNER_TASKS.length
);

// Action to update state with persistence
export const markComplete = (taskId: BeginnerTask): void => {
  const newCompletedTasks = new Set(completedTasks.get());
  newCompletedTasks.add(taskId);
  completedTasks.set(newCompletedTasks);

  try {
    localStorage.setItem(
      'completedBeginnerTasks',
      JSON.stringify(Array.from(newCompletedTasks))
    );
  } catch (error) {
    console.warn('Failed to save completed task:', error);
  }
};
```

### Component Integration with SignalWatcher

```typescript
import { SignalWatcher, html } from '@lit-labs/signals';
import { LitElement, css } from 'lit';

export class TaskList extends SignalWatcher(LitElement) {
  static styles = css`
    .completed {
      color: green;
    }
  `;

  render() {
    return html`
      <ul>
        ${BEGINNER_TASKS.map(
          (taskId) => html`
            <li class=${completedTasks.get().has(taskId) ? 'completed' : ''}>
              ${taskId}
              ${!completedTasks.get().has(taskId)
                ? html`
                    <button @click=${() => markComplete(taskId)}>
                      Complete
                    </button>
                  `
                : null}
            </li>
          `
        )}
      </ul>
      ${allTasksCompleted ? html` <p>🎉 All tasks completed!</p> ` : null}
    `;
  }
}
```

### Fine-grained Updates with watch()

Use `watch()` for performance optimization when you only want specific parts of the template to update:

```typescript
import { html } from 'lit';
import { watch } from '@lit-labs/signals';

export class PerformantList extends SignalWatcher(LitElement) {
  render() {
    return html`
      <div>
        <!-- Only this section updates when completedTasks changes -->
        ${watch(
          () => html`
            <p>
              Completed: ${completedTasks.get().size} / ${BEGINNER_TASKS.length}
            </p>
          `
        )}

        <!-- Static content -->
        <p>Complete all tasks to earn rewards!</p>
      </div>
    `;
  }
}
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

The application uses `@lit-labs/router` for client-side routing, with the layout defined in `my-app.ts`:

```typescript
// my-app.ts
import { Router } from '@lit-labs/router';
import { SignalWatcher, html } from '@lit-labs/signals';
import { LitElement } from 'lit';

export class MyApp extends SignalWatcher(LitElement) {
  private router = new Router(this, [
    {
      path: '/',
      render: () => html`
        <app-header></app-header>
        <home-page></home-page>
        <app-footer></app-footer>
      `,
    },
    {
      path: '/profile',
      render: () => html`
        <app-header></app-header>
        <profile-page></profile-page>
        <app-footer></app-footer>
      `,
    },
  ]);

  render() {
    return html`${this.router.outlet()}`;
  }
}
```

## Service Pattern

For shared functionality, we use plain TypeScript classes without Context:

```typescript
// web3.ts
export class Web3Service {
  async connect() {
    try {
      // Connection logic
      return { success: true };
    } catch (error) {
      console.error('Failed to connect:', error);
      return { success: false, error };
    }
  }
}

// Direct usage in components
class WalletComponent extends SignalWatcher(LitElement) {
  private web3Service = new Web3Service();

  async handleConnect() {
    const result = await this.web3Service.connect();
    if (!result.success) {
      // Handle error
    }
  }
}
```

## Design Patterns

### When to Use Signals vs. Context

- **Signals** are used for:

  - Any state that changes during the application lifecycle
  - UI state (form values, toggles, filters)
  - User preferences and settings
  - Feature flags and toggles
  - Task completion status
  - Async operation state
  - Derived/computed values

- **Context** is used for:
  - Static configuration values
  - Theme constants
  - Localization data
  - Environment variables

Note: We prefer Signals over Context for most state management needs. Context is reserved for truly static values that won't change during the application lifecycle.

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
