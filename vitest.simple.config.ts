import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'node:path';

export default defineConfig({
  plugins: [
    svelte({ 
      hot: false,
      compilerOptions: {
        dev: true,
      }
    })
  ],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./test-setup.ts'],
    include: [
      '**/__tests__/**/*.{test,spec}.{js,ts}',
      '**/*.{test,spec}.{js,ts}',
    ],
    exclude: [
      'node_modules',
      'dist',
      'release',
    ],
    typecheck: {
      enabled: false,
    },
  },
  resolve: {
    alias: {
      '~': path.resolve(__dirname, 'app'),
      '@renderer': path.resolve(__dirname, 'app/renderer/src'),
      '@views': path.resolve(__dirname, 'app/renderer/src/views'),
      '@ts': path.resolve(__dirname, 'app/renderer/src/ts'),
      '@features': path.resolve(__dirname, 'app/renderer/src/ts/features'),
      '@components': path.resolve(__dirname, 'app/renderer/src/components'),
    },
  },
});