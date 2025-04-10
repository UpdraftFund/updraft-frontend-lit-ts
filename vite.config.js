import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
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
      '@styles/idea': resolve(__dirname, 'src/features/idea/styles'),
      '@styles/solution': resolve(__dirname, 'src/features/solution/styles'),
      '@styles/common': resolve(__dirname, 'src/features/common/styles'),
      '@styles/layout': resolve(__dirname, 'src/features/layout/styles'),
      '@styles/navigation': resolve(
        __dirname,
        'src/features/navigation/styles'
      ),
      '@state/idea': resolve(__dirname, 'src/features/idea/state'),
      '@state/solution': resolve(__dirname, 'src/features/solution/state'),
      '@state/common': resolve(__dirname, 'src/features/common/state'),
      '@state/layout': resolve(__dirname, 'src/features/layout/state'),
      '@state/navigation': resolve(__dirname, 'src/features/navigation/state'),
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
      '@images': resolve(__dirname, 'src/features/common/assets/images'),
      '@pages': resolve(__dirname, 'src/features/pages'),
      '@layout': resolve(__dirname, 'src/features/layout/components'),
      '@utils': resolve(__dirname, 'src/features/common/utils'),
      '@styles': resolve(__dirname, 'src/features/common/styles'),
      '@contracts': resolve(__dirname, 'src/lib/contracts'),
      '@schemas': resolve(__dirname, 'updraft-schemas/json-schemas'),
      '@gql': resolve(__dirname, '.graphclient'),
    },
  },
  define: {
    'process.env': {},
  },
  build: {
    target: 'es2022', // Should match tsconfig.json target
  },
});
