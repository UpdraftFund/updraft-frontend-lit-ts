import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    target: 'esnext',
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components/idea': resolve(__dirname, 'src/features/idea/components'), // Point to idea components
      '@components/solution': resolve(
        __dirname,
        'src/features/solution/components'
      ), // Point to solution components
      '@components/common': resolve(
        __dirname,
        'src/features/common/components'
      ), // Point to common components
      '@components/navigation': resolve(
        __dirname,
        'src/features/navigation/components'
      ), // Point to navigation components
      '@styles/idea': resolve(__dirname, 'src/features/idea/styles'), // Point to idea styles
      '@styles/solution': resolve(__dirname, 'src/features/solution/styles'), // Point to solution styles
      '@styles/common': resolve(__dirname, 'src/features/common/styles'), // Point to common styles
      '@styles/layout': resolve(__dirname, 'src/features/layout/styles'), // Point to layout styles
      '@styles/navigation': resolve(
        __dirname,
        'src/features/navigation/styles'
      ), // Point to navigation styles
      '@layout': resolve(__dirname, 'src/features/layout/components'),
      '@assets': resolve(__dirname, 'src/assets'),
      '@icons': resolve(__dirname, 'src/assets/icons'),
      '@pages': resolve(__dirname, 'src/pages'),
      '@state/idea': resolve(__dirname, 'src/features/idea/state'),
      '@state/solution': resolve(__dirname, 'src/features/solution/state'),
      '@state/common': resolve(__dirname, 'src/features/common/state'),
      '@state/layout': resolve(__dirname, 'src/features/layout/state'),
      '@state/navigation': resolve(__dirname, 'src/features/navigation/state'),
      '@state/user': resolve(__dirname, 'src/features/user/state'),
      '@state/home': resolve(__dirname, 'src/features/home/state'),
      '@schemas': resolve(__dirname, 'updraft-schemas/json-schemas'),
      '@contracts': resolve(__dirname, 'src/contracts'),
      '@gql': resolve(__dirname, '.graphclient'),
    },
  },
  define: {
    'process.env': {},
  },
});
