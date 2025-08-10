import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'node:path';

export default defineConfig({
  root: path.resolve(__dirname, 'app/renderer'),
  base: './',
  plugins: [
    svelte({
      configFile: path.resolve(__dirname, 'svelte.config.js'),
    }),
  ],
  optimizeDeps: {
    // Workaround for Node versions lacking crypto.hash used by Vite's dep optimizer
    disabled: true,
  },
  build: {
    outDir: path.resolve(__dirname, 'dist/renderer'),
    emptyOutDir: true,
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
  server: {
    port: 5173,
    strictPort: true,
  },
});


