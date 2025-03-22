# Technical Context

## Development Environment

- **Language**: TypeScript
- **Framework**: Lit (v3.2.1) - A modern web components framework
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

- **@lit-labs/signals**: Reactive state management (v0.1.1)
- **@lit-labs/router**: Routing for Lit applications (v0.1.3)
- **@lit/context**: Context API for Lit (v1.1.3)
- **@lit/task**: Task management for asynchronous operations (v1.0.2)

### UI Components

- **@shoelace-style/shoelace**: Web component library (v2.20.0)

### Data Management

- **@graphprotocol/client-urql**: GraphQL client integration (v2.0.7)
- **urql**: GraphQL client (v4.2.1)
- **graphql**: GraphQL implementation (v16.10.0)

### Web3 Integration

- **@reown/appkit**: Web3 app toolkit (v1.6.7)
- **@reown/appkit-adapter-wagmi**: Wagmi adapter for appkit (v1.6.7)
- **@reown/appkit-siwe**: Sign-In with Ethereum integration (v1.6.7)
- **@wagmi/core**: Core Wagmi libraries (v2.16.4)
- **@wagmi/connectors**: Wallet connectors (v5.7.7)

### Utilities

- **dayjs**: Date manipulation library (v1.11.13)
- **ethereum-blockies-base64**: Ethereum address identicons (v1.0.2)

## Project Structure

- **/src**: Main source code directory
- **/docs**: Documentation files (including Lit Signals best practices)
- **/public**: Static assets
- **/dist**: Build output
- **/.graphclient**: Generated GraphQL client code
- **/updraft-schemas**: GraphQL schemas (submodule)

## Development Workflow

1. Set up with `yarn install`
2. Build GraphQL client with `yarn build-graph`
3. Start development server with `yarn dev`
4. Run type checking with `yarn tsc`
5. Auto-formatting and linting happen via git hooks

## Key Technical Patterns

### Lit Signals for State Management

The project uses Lit Signals as its primary state management solution. Signals provide a reactive mechanism for UI updates when data changes.

### Web Components Architecture

The UI is built with Web Components using Lit, enabling a component-based architecture with shadow DOM encapsulation.

### GraphQL Data Fetching

Data is fetched from APIs using GraphQL through the urql client and The Graph Protocol.

### Web3 Integration

The application integrates with blockchain technologies through Wagmi and provides authentication via Sign-In with Ethereum (SIWE).

## Deployment

The application is deployed through Vercel with preview deployments for pull requests to the `dev` branch.

- Development preview: [https://updraft-lit.vercel.app/](https://updraft-lit.vercel.app/)
