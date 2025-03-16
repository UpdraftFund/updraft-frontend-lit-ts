import { playwrightLauncher } from '@web/test-runner-playwright';
import { esbuildPlugin } from '@web/dev-server-esbuild';
import { fromRollup } from '@web/dev-server-rollup';
import alias from '@rollup/plugin-alias';
import path from 'path';

// Create the alias plugin
const aliasPlugin = fromRollup(alias);

export default {
  files: 'src/**/*.test.(js|ts)',
  nodeResolve: true,
  browsers: [playwrightLauncher({ product: 'chromium' })],
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
            'src/components/shared/__tests__/mocks/urql-client.mock.ts'
          ),
        },
        {
          find: '@/state/idea-state',
          replacement: path.resolve(
            process.cwd(),
            'src/components/shared/__tests__/mocks/idea-state.mock.ts'
          ),
        },
        {
          find: '@gql',
          replacement: path.resolve(
            process.cwd(),
            'src/components/shared/__tests__/mocks/gql.mock.ts'
          ),
        },
        {
          find: '@/components/shared/idea-card-small',
          replacement: path.resolve(
            process.cwd(),
            'src/components/shared/__tests__/mocks/idea-card-small.mock.ts'
          ),
        },

        // Standard path aliases for other imports
        { find: '@/', replacement: path.resolve(process.cwd(), 'src/') },
        {
          find: '@icons',
          replacement: path.resolve(process.cwd(), 'src/assets/icons/'),
        },
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
