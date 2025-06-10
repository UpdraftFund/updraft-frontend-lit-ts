# Updraft Frontend (Lit TypeScript)

This repository contains the frontend application for Updraft, built with Lit and TypeScript.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Development Workflow](#development-workflow)
- [Project Structure](#project-structure)
- [Deployment](#deployment)
- [Testing](#testing)
- [Useful Links](#useful-links)

## Overview

This frontend application provides the user interface for the Updraft platform, allowing users to browse, create, and
fund ideas and solutions.

## Prerequisites

- Node.js (v16 or later recommended)
- Yarn package manager
- Git

## Getting Started

1. Clone the repository with submodules:
   ```bash
   git clone --recurse-submodules https://github.com/UpdraftFund/updraft-frontend-lit-ts
   ```

2. Navigate to the project directory:
   ```bash
   cd updraft-frontend-lit-ts
   ```

3. Install dependencies:
   ```bash
   yarn install
   ```

4. Build the subgraph:
   ```bash
   yarn build-graph
   ```

5. Set up environment variables (see [Environment Variables](#environment-variables) section below)

6. Start the development server:
   ```bash
   yarn dev
   ```
   This will deploy the test site to your browser. Any changes you make will be hot-reloaded and immediately visible.

## Environment Variables

This project uses environment variables for API keys and other sensitive information. To set up your environment:

1. Copy the example environment file to create your local configuration:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` with your actual API keys and configuration values

### Required Environment Variables

- `VITE_GRAPH_API_KEY`: API key for The Graph (for GraphQL queries)
- `VITE_APP_ENV`: Environment setting that controls network and subgraph configuration
    - Leave empty for local development (uses Arbitrum Sepolia)
    - Set to 'preview' for preview deployments (uses Arbitrum Sepolia)
    - Set to 'production' for production deployments (uses Arbitrum One)

Note: All environment variables used in the frontend must be prefixed with `VITE_` to be accessible in the client-side
code.

For more details on environment configuration, see [Environment Configuration](src/features/common/utils/README.md).

## Development Workflow

1. Before pushing your changes, ensure they build successfully:
   ```bash
   yarn build
   ```

2. If there are no errors, pushing to the `dev` branch (or creating a PR that merges into `dev`) will automatically
   create a preview site through Vercel so others can review your changes.

3. Please read
   our [Git workflow and branching guide](https://github.com/UpdraftFund/.github?tab=readme-ov-file#git-workflow-and-branching-guide)
   for best practices.

## Project Structure

The Updraft frontend follows a **Vertical Slice Architecture** (feature-based organization) that groups code by feature
rather than by technical layer. This approach improves cohesion, encapsulation, and developer experience.

### Main Directories

```
src/
  features/           # Feature-based organization (vertical slices)
    common/           # Shared components, utilities, and styles
    idea/             # Everything related to ideas
    solution/         # Everything related to solutions
    user/             # User profiles and authentication
    tags/             # Tag-related functionality
    layout/           # Layout components and structure
    navigation/       # Navigation components and routing
    pages/            # Page components organized by route
  lib/                # Library code and external integrations
    contracts/        # Smart contract ABIs and interactions
  types/              # Global TypeScript type definitions
public/               # Static assets served as-is
docs/                 # Project documentation
  architecture/       # Architecture documentation
updraft-schemas/      # JSON schemas for data validation
```

### Feature Structure

Each feature folder follows a consistent structure:

```
feature/
  components/         # Lit components specific to the feature
  queries/            # GraphQL queries and mutations
  state/              # Signals, stores, and state management
  types/              # Feature-specific TypeScript types
  __tests__/          # Unit and integration tests
  assets/             # Feature-specific assets (if needed)
```

### Key Technologies

- **Lit**: Web components framework for UI
- **TypeScript**: Type-safe JavaScript
- **GraphQL**: API data fetching with urql client
- **Signals**: Reactive state management (@lit-labs/signals)
- **Vite**: Build tool and development server
- **Shoelace**: UI component library
- **Web3/Blockchain**: Integration with Ethereum via wagmi

## Deployment

The application is deployed using Vercel:

- [Development Preview Site](https://updraft-lit.vercel.app/)

## Testing

This project uses the Web Test Runner for unit and integration testing.

### Running Tests

To run all tests:

```bash
yarn test
```

To run tests in watch mode (tests will rerun when files change):

```bash
yarn test:watch
```

### Test Structure

Tests are located in `__tests__` directories within each feature folder. The project follows a component-based testing
approach where each component or feature has its own test files.

## Useful Links

- [Lit Documentation](https://lit.dev/docs/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Lit Signals Documentation](https://lit.dev/docs/libraries/signals/)
- [Shoelace Components](https://shoelace.style/components/button)
- [GraphQL Documentation](https://graphql.org/learn/)
- [Updraft Project Repository](https://github.com/UpdraftFund)
