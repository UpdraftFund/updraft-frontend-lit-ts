import { defineConfig } from 'vite';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components/idea': resolve(__dirname, 'src/features/idea/components'),
      '@components/solution': resolve(
        __dirname,
        'src/features/solution/components'
      ),
      '@components/common': resolve(
        __dirname,
        'src/features/common/components'
      ),
      '@components/layout': resolve(
        __dirname,
        'src/features/layout/components'
      ),
      '@components/navigation': resolve(
        __dirname,
        'src/features/navigation/components'
      ),
      '@components/home': resolve(
        __dirname,
        'src/features/pages/home/components'
      ),
      '@components/tags': resolve(__dirname, 'src/features/tags/components'),
      '@components/user': resolve(__dirname, 'src/features/user/components'),
      '@styles/idea': resolve(__dirname, 'src/features/idea/styles'),
      '@styles/solution': resolve(__dirname, 'src/features/solution/styles'),
      '@styles/common': resolve(__dirname, 'src/features/common/styles'),
      '@styles/layout': resolve(__dirname, 'src/features/layout/styles'),
      '@styles/navigation': resolve(
        __dirname,
        'src/features/navigation/styles'
      ),
      '@state/common': resolve(__dirname, 'src/features/common/state'),
      '@state/idea': resolve(__dirname, 'src/features/idea/state'),
      '@state/layout': resolve(__dirname, 'src/features/layout/state'),
      '@state/navigation': resolve(__dirname, 'src/features/navigation/state'),
      '@state/solution': resolve(__dirname, 'src/features/solution/state'),
      '@state/tags': resolve(__dirname, 'src/features/tags/state'),
      '@state/user': resolve(__dirname, 'src/features/user/state'),
      '@state/home': resolve(__dirname, 'src/features/pages/home/state'),
      '@icons/common': resolve(__dirname, 'src/features/common/assets/icons'),
      '@icons/idea': resolve(__dirname, 'src/features/idea/assets/icons'),
      '@icons/navigation': resolve(
        __dirname,
        'src/features/navigation/assets/icons'
      ),
      '@icons/solution': resolve(
        __dirname,
        'src/features/solution/assets/icons'
      ),
      '@icons/user': resolve(__dirname, 'src/features/user/assets/icons'),
      '@images/home': resolve(
        __dirname,
        'src/features/pages/home/assets/images'
      ),
      '@utils/common': resolve(__dirname, 'src/features/common/utils'),
      '@utils/create-solution': resolve(
        __dirname,
        'src/features/pages/create-solution/utils'
      ),
      '@utils/home': resolve(__dirname, 'src/features/pages/home/utils'),
      '@utils/idea': resolve(__dirname, 'src/features/idea/utils'),
      '@utils/solution': resolve(__dirname, 'src/features/solution/utils'),
      '@utils/user': resolve(__dirname, 'src/features/user/utils'),
      '@icons': resolve(__dirname, 'src/features/common/assets/icons'),
      '@images': resolve(__dirname, 'src/features/common/assets/images'),
      '@pages': resolve(__dirname, 'src/features/pages'),
      '@layout': resolve(__dirname, 'src/features/layout/components'),
      '@styles': resolve(__dirname, 'src/features/common/styles'),
      '@utils': resolve(__dirname, 'src/features/common/utils'),
      '@contracts': resolve(__dirname, 'src/lib/contracts'),
      '@schemas': resolve(__dirname, 'updraft-schemas/json-schemas'),
      '@gql': resolve(__dirname, '.graphclient'),
    },
  },
  define: {
    // Legacy compatibility for process.env
    'process.env': {},
  },
  build: {
    target: 'es2022', // Should match tsconfig.json target
    // Improve build performance and output size
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: mode === 'production',
      },
    },
    // Split chunks for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          'lit-core': ['lit'],
          shoelace: ['@shoelace-style/shoelace'],
          vendor: [
            '@lit-labs/router',
            '@lit-labs/signals',
            '@lit/context',
            '@lit/task',
            'urql',
            'graphql',
          ],
        },
      },
    },
    // Generate sourcemaps for debugging
    sourcemap: mode !== 'production',
  },
}));
