# Technical Context

## Development Environment

- **Language**: TypeScript
- **Framework**: Lit (v3.x) - A modern web components framework
- **Build Tool**: Vite (v6.1.0)
- **Package Manager**: Yarn
- **Testing**: Web Test Runner (@web/test-runner)
- **Code Quality**:
  - ESLint for linting
  - Prettier for code formatting
  - TypeScript for type checking
  - Husky for git hooks

## Key Dependencies

### Core Libraries

- **@lit-labs/signals**: Reactive state management for fine-grained updates
- **@lit-labs/router**: Client-side routing with Web Components
- **@lit/task**: Declarative async task management
- **@lit/context**: Context API for static configuration

### UI Components

- **@shoelace-style/shoelace**: Web component library

### Data Management

- **@graphprotocol/client-urql**: GraphQL client integration
- **urql**: GraphQL client (use subscription/query observable pattern for data fetching; prefer this over Task for GraphQL)
- **graphql**: GraphQL implementation

### Web3 Integration

- **@reown/appkit**: Web3 app toolkit
- **@reown/appkit-adapter-wagmi**: Wagmi adapter for appkit
- **@reown/appkit-siwe**: Sign-In with Ethereum integration
- **@wagmi/core**: Core Wagmi libraries
- **@wagmi/connectors**: Wallet connectors

### Utilities

- **dayjs**: Date manipulation library
- **ethereum-blockies-base64**: Ethereum address identicons

## Project Structure

```
/
├── src/
│   ├── components/
│   │   ├── my-component/        # Component-specific files
│   │   │   ├── my-component.ts
│   │   │   ├── my-component.css
│   │   │   └── my-component.test.ts
│   │   └── page-specific/       # Page-specific components
│   ├── state/                   # Signal-based state management
│   └── utils/                   # Utility functions
├── docs/                        # Documentation files
├── public/                      # Static assets
├── dist/                        # Build output
├── .graphclient/               # Generated GraphQL client code
└── updraft-schemas/            # GraphQL schemas (submodule)
```

## Development Workflow

1. Set up with `yarn install`
2. Build GraphQL client with `yarn build-graph`
3. Start development server with `yarn dev`
4. Run type checking with `yarn tsc`
5. Auto-formatting and linting happen via git hooks

## Key Technical Patterns

### Lit Components

- Components extend from `SignalWatcher(LitElement)`
- Use Shadow DOM for style encapsulation
- Declarative rendering with Lit templates
- Reactive properties and signals for state management

### State Management with Signals

Our primary state management solution uses Lit Signals for:

- Feature-specific state (e.g., beginner tasks completion)
- UI state and user preferences
- Form state and validation
- Async operation status
- Computed/derived values

Example from our beginner tasks implementation:

```typescript
// Clean, simple signal-based state
export const completedTasks = signal<Set<BeginnerTask>>(new Set());

// Computed values for derived state
export const allTasksCompleted = computed(
  () => completedTasks.get().size === BEGINNER_TASKS.length
);

// Helper functions for state updates
export const markComplete = (taskId: BeginnerTask): void => {
  const newCompletedTasks = new Set(completedTasks.get());
  newCompletedTasks.add(taskId);
  completedTasks.set(newCompletedTasks);
  // ... persistence logic
};
```

### Context Usage

Context is reserved for truly static application-wide values:

- API endpoints and constants
- Theme configuration
- Localization data
- Environment variables

We avoid using Context for:

- Mutable state (use Signals instead)
- Service instances (use direct instantiation)
- Feature flags (use Signals)
- User preferences (use Signals)

### Web Components Architecture

- Custom elements for component definition
- Shadow DOM for style encapsulation
- HTML templates for declarative rendering
- Properties and events for component communication

### Data Fetching

- GraphQL with urql client (prefer urql's subscription/query observable pattern for reactivity and cache integration)
- Task pattern for async operations (use for smart contract reads or non-urql async work)
- Signal-based data dependencies
- Error handling and loading states

### Web3 Integration

- Wagmi for wallet connectivity
- SIWE for authentication
- Appkit for Web3 functionality

## Deployment

The application is deployed through Vercel with preview deployments for pull requests to the `dev` branch.

- Development preview: [https://updraft-lit.vercel.app/](https://updraft-lit.vercel.app/)
