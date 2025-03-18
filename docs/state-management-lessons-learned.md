# State Management Lessons Learned

## Introduction

This document captures key lessons learned during our implementation of centralized state management in the Updraft frontend application. As we've evolved our understanding of Lit and its companion libraries, particularly `lit-labs/signals`, we've refined our approach to state management and component reactivity.

## Core Lessons

### Proper Signal Usage

#### What we learned

Initially, we treated signals as simple global variables, but discovered they are far more powerful when properly integrated:

1. **SignalWatcher Mixin**: Components must use the `SignalWatcher` mixin to automatically track signal dependencies and respond to changes.

2. **Signals-Aware HTML Tag**: The `html` tag from `@lit-labs/signals` enables direct signal references in templates without `.get()` calls.

```typescript
// Incorrect approach - using signals as global variables
import {signal} from '@lit-labs/signals';
import {html, LitElement} from 'lit';

const count = signal(0);

class MyCounter extends LitElement {
  render() {
    return html`<div>${count.get()}</div>`; // Manually calling .get()
  }
}
```

```typescript
// Correct approach - using SignalWatcher
import {signal, SignalWatcher, html} from '@lit-labs/signals';
import {LitElement} from 'lit';

const count = signal(0);

class MyCounter extends SignalWatcher(LitElement) {
  render() {
    return html`<div>${count}</div>`; // Direct reference works
  }
}
```

### Signals vs. Context: When to Use Each

#### What we learned

Signals and context serve different purposes and should be used accordingly:

1. **Signals for UI State**: Use signals for reactive UI state, form values, and any frequently changing data that directly affects rendering.

2. **Context for Services**: Use context for service instances, configuration, and rarely changing application state.

```typescript
// Services in context
const apiServiceContext = createContext('api-service');

@provide({context: apiServiceContext})
get apiService() { return this._apiService; }

// UI state in signals
const isMenuOpen = signal(false);
const activeTabIndex = signal(0);
```

### Fine-grained Updates with watch()

#### What we learned

For performance-critical components, the `watch()` directive provides more control over which parts of the template update:

```typescript
// Using watch() for fine-grained updates
import {html} from 'lit'; // regular lit html
import {watch} from '@lit-labs/signals';

render() {
  return html`
    <div>Static content that rarely changes</div>
    <div>${watch(frequentlyChangingSignal)}</div>
  `;
}
```

### Task-Signal Integration

#### What we learned

Lit Tasks can be made reactive by including signals in their dependency arrays:

```typescript
// Task with signal dependencies
private _dataTask = new Task(
  this,
  async ([query, filter]) => {
    const result = await fetchData(query, filter);
    return result;
  },
  () => [searchQuerySignal.get(), filterSignal.get()]
);
```

### Shared Component State

#### What we learned

Signals enable shared state across components without prop drilling or complex event systems:

```typescript
// Shared signal state
import {signal} from '@lit-labs/signals';

// In a shared module
export const selectedItem = signal(null);
export const setSelectedItem = (item) => selectedItem.set(item);

// In component A
import {selectedItem, setSelectedItem} from '../state/selection';

handleSelection(item) {
  setSelectedItem(item);
}

// In component B - automatically reacts to changes
import {selectedItem} from '../state/selection';
import {SignalWatcher, html} from '@lit-labs/signals';

class DetailView extends SignalWatcher(LitElement) {
  render() {
    return html`
      ${selectedItem ? html`<detail-card .item=${selectedItem}></detail-card>` : html`<p>No selection</p>`}
    `;
  }
}
```

## Reactive Architecture Patterns

### Signal Module Pattern

We've standardized on a signal module pattern for organizing state:

```typescript
// Signal Module Pattern
import {signal, computed} from '@lit-labs/signals';

// Core state
export const items = signal([]);
export const selectedId = signal(null);

// Derived state
export const selectedItem = computed(() => {
  const id = selectedId.get();
  return id ? items.get().find(item => item.id === id) : null;
});

// Actions
export const selectItem = (id) => selectedId.set(id);
export const addItem = (item) => items.set([...items.get(), item]);
export const resetState = () => {
  items.set([]);
  selectedId.set(null);
};
```

### Component Lifecycle Integration

Careful integration with component lifecycle is important:

```typescript
// Proper component lifecycle integration
class DataView extends SignalWatcher(LitElement) {
  connectedCallback() {
    super.connectedCallback();
    // Initialize state when component connects
    loadInitialData();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    // Clean up state when component disconnects
    if (this.shouldResetOnDisconnect) {
      resetState();
    }
  }
}
```

## Resilient Component Design

### Defensive State Access

Components should handle potentially undefined state gracefully:

```typescript
// Defensive state access
render() {
  const data = dataSignal;
  
  if (!data) {
    return html`<loading-spinner></loading-spinner>`;
  }
  
  if (data.length === 0) {
    return html`<empty-state></empty-state>`;
  }
  
  return html`<data-list .items=${data}></data-list>`;
}
```

### Signal Reset

Well-defined state reset functions prevent state pollution:

```typescript
// Signal reset functions
export const resetUserState = () => {
  userProfile.set(null);
  userPreferences.set(defaultPreferences);
  authStatus.set('unauthenticated');
};

// Called during major state changes
function handleLogout() {
  resetUserState();
  navigateTo('/login');
}
```

## Performance Considerations

### Computed Signal Memoization

Computations with expensive operations benefit from memoization:

```typescript
// Memoized computed signal for expensive operations
const memoizedMap = new Map();

export const expensiveComputation = computed(() => {
  const key = dataSignal.get().id;
  
  if (memoizedMap.has(key)) {
    return memoizedMap.get(key);
  }
  
  const result = performExpensiveOperation(dataSignal.get());
  memoizedMap.set(key, result);
  return result;
});

// Clear cache when appropriate
export const clearComputationCache = () => memoizedMap.clear();
```

### Selective Updating with watch()

For large templates, use `watch()` to update only what needs to change:

```typescript
// Selective updates in large templates
render() {
  return html`
    <header-section></header-section>
    <nav-bar></nav-bar>
    <main>
      ${watch(() => {
        const currentData = dataSignal;
        return html`<data-view .data=${currentData}></data-view>`;
      })}
    </main>
    <footer-section></footer-section>
  `;
}
```

## Testing Strategies

### Testing Signal Modules

```typescript
// Signal module test
describe('userSignals', () => {
  beforeEach(() => {
    resetUserState(); // Start with clean state
  });
  
  it('should update isAuthenticated when profile is set', () => {
    expect(isAuthenticated.get()).to.be.false;
    userProfile.set({id: '123', name: 'Test User'});
    expect(isAuthenticated.get()).to.be.true;
  });
});
```

### Testing Components with Signals

```typescript
// Component test with signals
describe('UserProfileComponent', () => {
  let element;
  
  beforeEach(async () => {
    resetUserState(); // Reset signals
    element = await fixture(html`<user-profile></user-profile>`);
  });
  
  it('should display user name when profile signal is set', async () => {
    // Set the signal
    userProfile.set({id: '123', name: 'Test User'});
    
    // Wait for update
    await element.updateComplete;
    
    // Check the rendering
    expect(element.shadowRoot.textContent).to.include('Test User');
  });
});
```

## Conclusion

Properly implemented signals provide a powerful, efficient approach to state management in our Lit-based application. By following the patterns outlined in this document, we can build components that are reactive, maintainable, and performant.

The hybrid approach—using signals for UI state and context for services—gives us the best of both worlds. As we continue to refine our architecture, these lessons will guide our implementation decisions and help us build a more resilient application.
