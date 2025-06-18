# System Patterns

## Architecture Overview

The Updraft frontend application is now organized using a **vertical slice architecture**. Each feature is self-contained within the `src/features` directory, encapsulating its own state, components, queries, types, assets, and tests. This modular approach improves maintainability, scalability, and feature isolation.

### Vertical Slice Pattern

```
src/
  features/
    <feature>/
      components/   # UI components for the feature
      state/        # Signal-based state management for the feature
      queries/      # GraphQL queries/mutations for the feature
      types/        # TypeScript types for the feature
      assets/       # Icons, images, etc. for the feature
      __tests__/    # Unit and integration tests for the feature
```

#### Example (Idea Feature):

```
src/features/idea/
  components/
  state/
  queries/
  types/
  assets/
  __tests__/
```

### Pages as Feature Slices

The `pages` feature contains subfolders for each major page (e.g., `home`, `discover`), each following the same vertical slice structure:

```
src/features/pages/home/
  components/
  state/
  queries/
  __tests__/
```

## Vite and TypeScript Aliases

To support modular imports and maintain clear boundaries between features, the project uses extensive aliasing in both `vite.config.js` and `tsconfig.json`. Aliases are defined for each feature's components, state, styles, icons, and more. Example aliases:

- `@components/idea` → `src/features/idea/components`
- `@state/user` → `src/features/user/state`
- `@icons/solution` → `src/features/solution/assets/icons`
- `@pages` → `src/features/pages`
- `@utils` → `src/lib/utils`

This allows for clean, intention-revealing imports such as:

```typescript
import { IdeaCardLarge } from '@components/idea/idea-card-large';
import { userState } from '@state/user/user';
```

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

### urql Subscriptions for GraphQL Data

For GraphQL data fetching, prefer using urql's subscription/query observable pattern over @lit/task. This approach leverages urql's built-in caching and reactivity, and is more compatible with the subscription paradigm than Task, which is better suited for one-off async operations (such as smart contract reads).

**Pattern:**

```typescript
import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { urqlClient } from '@/state/urql';
import { IdeasBySharesDocument } from '@/graphql/generated';

@customElement('hot-ideas')
export class HotIdeas extends LitElement {
  @state() private hotIdeas?: Idea[];
  private unsubHotIdeas?: () => void;

  private subscribe() {
    this.unsubHotIdeas?.();
    const hotIdeasSub = urqlClient
      .query(IdeasBySharesDocument, {})
      .subscribe((result) => {
        if (result.data?.ideas) {
          this.hotIdeas = result.data.ideas as Idea[];
        } else {
          this.hotIdeas = [];
        }
      });
    this.unsubHotIdeas = hotIdeasSub.unsubscribe;
  }

  connectedCallback() {
    super.connectedCallback();
    this.subscribe();
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.unsubHotIdeas?.();
    document.removeEventListener(
      'visibilitychange',
      this.handleVisibilityChange
    );
  }

  private handleVisibilityChange = () => {
    if (document.hidden) {
      this.unsubHotIdeas?.();
    } else {
      this.subscribe();
    }
  };

  // ...render logic...
}
```

**Why this pattern?**

- urql subscriptions provide real-time updates and leverage urql's cache.
- Task is not reactive to urql's cache updates and is better for one-off async operations (e.g., smart contract reads).
- This pattern ensures the UI stays in sync with backend data and is more maintainable.

### Task for Async Operations (Smart Contracts)

Continue to use `@lit/task` for async operations that are not compatible with urql's subscription model, such as direct smart contract reads.

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

## Icon and SVG Usage Pattern

- **Do NOT use inline SVGs for icons in components.**
- All icons must be placed in the feature's `assets/icons` directory (e.g., `src/features/user/assets/icons`).
- Import SVGs as modules using the appropriate Vite/TypeScript alias (e.g., `import icon from '@user/icons/my-icon.svg'`).
- Reference icons in templates via the imported module, not as inline SVG or data URIs.
- This ensures consistency, reusability, and maintainability of icon assets across the codebase.
