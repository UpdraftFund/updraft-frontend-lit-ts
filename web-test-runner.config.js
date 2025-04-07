import { esbuildPlugin } from '@web/dev-server-esbuild';
import { fromRollup } from '@web/dev-server-rollup';
import alias from '@rollup/plugin-alias';
import path from 'path';

// Create the alias plugin
const aliasPlugin = fromRollup(alias);

export default {
  files: 'src/**/*.test.(js|ts)',
  nodeResolve: true,
  plugins: [
    // Handle TypeScript with proper decorator support
    esbuildPlugin({
      ts: true,
      target: 'es2020',
      tsconfig: path.resolve(process.cwd(), 'tsconfig.json'),
      loaders: {
        '.svg': 'text', // Handle SVG imports directly
      },
    }),

    // Handle path aliases
    aliasPlugin({
      entries: [
        // Redirect imports to our mock files during testing
        {
          find: '@/urql-client',
          replacement: path.resolve(
            process.cwd(),
            'src/components/right-sidebar/__tests__/mocks/urql-client.mock.ts'
          ),
        },
        {
          find: '@/state/idea-state',
          replacement: path.resolve(
            process.cwd(),
            'src/components/right-sidebar/__tests__/mocks/idea-state.mock.ts'
          ),
        },
        {
          find: '@/state/user-state',
          replacement: path.resolve(
            process.cwd(),
            'src/components/right-sidebar/__tests__/mocks/user-state.mock.ts'
          ),
        },
        {
          find: '@/web3',
          replacement: path.resolve(
            process.cwd(),
            'src/components/right-sidebar/__tests__/mocks/web3.mock.ts'
          ),
        },
        {
          find: '@gql',
          replacement: path.resolve(
            process.cwd(),
            'src/components/right-sidebar/__tests__/mocks/gql.mock.ts'
          ),
        },
        {
          find: '@/components/right-sidebar/idea-card-small',
          replacement: path.resolve(
            process.cwd(),
            'src/components/right-sidebar/__tests__/mocks/idea-card-small.mock.ts'
          ),
        },
        // Mock crypto module to resolve the crypto import issue
        {
          find: 'crypto',
          replacement: path.resolve(
            process.cwd(),
            'src/components/right-sidebar/__tests__/mocks/crypto.mock.ts'
          ),
        },
        {
          find: '@icons/fire.svg',
          replacement: path.resolve(
            process.cwd(),
            'src/components/right-sidebar/__tests__/mocks/fire.svg'
          ),
        },
        // Standard path aliases for other imports
        { find: '@/', replacement: path.resolve(process.cwd(), 'src/') },
      ],
    }),
  ],
  testFramework: {
    config: {
      ui: 'bdd',
      timeout: '5000',
    },
  },
};
