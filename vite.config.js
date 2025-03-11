import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    target: "esnext",
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@layout': resolve(__dirname, 'src/components/layout'),
      '@styles': resolve(__dirname, 'src/styles'),
      '@assets': resolve(__dirname, 'src/assets'),
      '@icons': resolve(__dirname, 'src/assets/icons'),
      '@pages': resolve(__dirname, 'src/pages'),
      '@schemas': resolve(__dirname, 'updraft-schemas/json-schemas'),
      '@contracts': resolve(__dirname, 'src/contracts'),
      '@gql': resolve(__dirname, '.graphclient')
    }
  },
  define: {
    'process.env': {}
  }
});
