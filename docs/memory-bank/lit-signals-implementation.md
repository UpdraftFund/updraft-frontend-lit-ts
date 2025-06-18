# Lit Signals Implementation

This document provides detailed information on how Lit Signals are implemented in the Updraft frontend application.

## Overview

Lit Signals provide a reactive state management solution that allows for fine-grained updates to the UI when data changes. They are particularly useful for:

- Managing UI state
- Sharing state between components
- Computing derived values
- Handling form state
- Coordinating async operations

## Signal Types and Usage

### Basic Signals

```typescript
import { signal } from '@lit-labs/signals';

// Primitive values
const count = signal(0);
const isLoading = signal(false);

// Objects
const user = signal<User | null>(null);

// Arrays
const items = signal<Item[]>([]);

// Sets and Maps
const selectedIds = signal(new Set<string>());
const cache = signal(new Map<string, any>());
```

### Computed Signals

```typescript
import { signal, computed } from '@lit-labs/signals';

const items = signal<Item[]>([]);
const searchQuery = signal('');
const sortOrder = signal<'asc' | 'desc'>('asc');

// Computed signal with multiple dependencies
const filteredAndSortedItems = computed(() => {
  const query = searchQuery.get().toLowerCase();
  const order = sortOrder.get();

  return items
    .get()
    .filter((item) => item.name.toLowerCase().includes(query))
    .sort((a, b) => {
      const comparison = a.name.localeCompare(b.name);
      return order === 'asc' ? comparison : -comparison;
    });
});
```

## Component Integration

### Using SignalWatcher

```typescript
import { SignalWatcher, html } from '@lit-labs/signals';
import { LitElement, css } from 'lit';

export class ItemList extends SignalWatcher(LitElement) {
  static styles = css`
    .item {
      /* ... */
    }
    .selected {
      /* ... */
    }
  `;

  render() {
    return html`
      <div class="controls">
        <input
          type="text"
          .value=${searchQuery}
          @input=${(e: Event) =>
            searchQuery.set((e.target as HTMLInputElement).value)}
        />
        <select
          .value=${sortOrder}
          @change=${(e: Event) =>
            sortOrder.set(
              (e.target as HTMLSelectElement).value as 'asc' | 'desc'
            )}
        >
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </div>

      <ul>
        ${filteredAndSortedItems.map(
          (item) => html`
            <li
              class="item ${selectedIds.has(item.id) ? 'selected' : ''}"
              @click=${() => this.toggleSelection(item.id)}
            >
              ${item.name}
            </li>
          `
        )}
      </ul>
    `;
  }

  private toggleSelection(id: string) {
    const selected = new Set(selectedIds.get());
    if (selected.has(id)) {
      selected.delete(id);
    } else {
      selected.add(id);
    }
    selectedIds.set(selected);
  }
}
```

### Using watch() for Fine-grained Updates

```typescript
import { html } from 'lit';
import { watch } from '@lit-labs/signals';
import { SignalWatcher } from '@lit-labs/signals';
import { LitElement } from 'lit';

export class PerformantList extends SignalWatcher(LitElement) {
  render() {
    return html`
      <div>
        <!-- Only updates when searchQuery changes -->
        <div class="search-info">
          ${watch(() => {
            const query = searchQuery.get();
            return query
              ? html`Showing results for: ${query}`
              : html`Showing all items`;
          })}
        </div>

        <!-- Only updates when filteredAndSortedItems changes -->
        <ul>
          ${watch(() =>
            filteredAndSortedItems
              .get()
              .map((item) => html` <li>${item.name}</li> `)
          )}
        </ul>

        <!-- Static content -->
        <div class="footer">
          <p>Select items to continue</p>
        </div>
      </div>
    `;
  }
}
```

## State Management Patterns

### Feature-based Organization

```typescript
// state/items/signals.ts
import { signal, computed } from '@lit-labs/signals';

export const items = signal<Item[]>([]);
export const selectedIds = signal(new Set<string>());
export const searchQuery = signal('');
export const sortOrder = signal<'asc' | 'desc'>('asc');

export const filteredItems = computed(() => {
  const query = searchQuery.get().toLowerCase();
  return items.get().filter((item) => item.name.toLowerCase().includes(query));
});

// state/items/actions.ts
export const addItem = (item: Item) => {
  items.set([...items.get(), item]);
};

export const removeItem = (id: string) => {
  items.set(items.get().filter((item) => item.id !== id));
};

export const toggleSelection = (id: string) => {
  const selected = new Set(selectedIds.get());
  if (selected.has(id)) {
    selected.delete(id);
  } else {
    selected.add(id);
  }
  selectedIds.set(selected);
};
```

### Async Operations with Tasks

```typescript
import { Task } from '@lit/task';
import { signal } from '@lit-labs/signals';

// Signals that affect data fetching
export const pageSize = signal(10);
export const currentPage = signal(1);

export class ItemListWithPagination extends SignalWatcher(LitElement) {
  private itemsTask = new Task(
    this,
    async ([page, size]) => {
      const response = await fetch(`/api/items?page=${page}&size=${size}`);
      if (!response.ok) {
        throw new Error('Failed to fetch items');
      }
      return response.json();
    },
    () => [currentPage.get(), pageSize.get()]
  );

  render() {
    return html`
      ${this.itemsTask.render({
        pending: () => html` <sl-spinner></sl-spinner> `,
        complete: (data) => html`
          <ul>
            ${data.items.map((item) => html` <li>${item.name}</li> `)}
          </ul>
          <sl-pagination
            .page=${currentPage}
            .total=${data.total}
            .pageSize=${pageSize}
            @sl-change=${(e: CustomEvent) => currentPage.set(e.detail.page)}
          ></sl-pagination>
        `,
        error: (error) => html`
          <sl-alert variant="danger"> ${error.message} </sl-alert>
        `,
      })}
    `;
  }
}
```

## Best Practices

1. **Signal Updates**

   - Always use `.set()` to update signals
   - Create new references for objects and arrays
   - Use computed signals for derived state

2. **Component Design**

   - Extend from `SignalWatcher(LitElement)`
   - Use `watch()` for granular updates
   - Keep signal dependencies minimal

3. **State Organization**

   - Group related signals by feature
   - Export actions for state updates
   - Use computed signals for complex derivations

4. **Performance**

   - Use `watch()` for expensive computations
   - Minimize signal dependencies
   - Split large components into smaller ones

5. **Error Handling**
   - Use Tasks for async operations
   - Provide proper loading and error states
   - Handle edge cases in computed signals

## Real-World Example: Beginner Tasks State

Here's how we manage beginner task completion state using signals:

```typescript
import { signal, computed } from '@lit-labs/signals';

// Define task constants
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

// Core state signal using a Set for efficient lookups
export const completedTasks = signal<Set<BeginnerTask>>(new Set());

// Computed signal for derived state
export const allTasksCompleted = computed(
  () => completedTasks.get().size === BEGINNER_TASKS.length
);

// Helper functions to update state
export const markComplete = (taskId: BeginnerTask): void => {
  const newCompletedTasks = new Set(completedTasks.get());
  newCompletedTasks.add(taskId);
  completedTasks.set(newCompletedTasks);

  // Persist to localStorage
  try {
    localStorage.setItem(
      'completedBeginnerTasks',
      JSON.stringify(Array.from(newCompletedTasks))
    );
  } catch (error) {
    console.warn('Failed to save completed task:', error);
  }
};

// Usage in a component
class TaskList extends SignalWatcher(LitElement) {
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

This example demonstrates several best practices:

- Using TypeScript const assertions for task IDs
- Using a Set for efficient task completion checks
- Computed signal for derived state
- Helper functions for state updates
- Persistence to localStorage
- Clean component integration

## Signals vs Context

While we previously used Context for many things, we've found Signals to be a simpler and more maintainable solution in most cases. Here's when to use each:

### Use Signals When:

- Managing UI state that changes over time
- Sharing state between components
- Handling user interactions
- Managing form state
- Coordinating async operations
- Storing feature flags or toggles
- Managing user preferences
- Handling task/progress state

### Use Context When:

- Injecting truly static configuration (API endpoints, constants)
- Providing theme variables
- Sharing localization data
- Other rarely-changing application constants

The key insight is that Context is best for truly static values that are unlikely to change during the application's lifecycle. For everything else, Signals provide a simpler, more predictable API with better TypeScript integration.
