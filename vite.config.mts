import { defineConfig, loadEnv } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'node:path';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
  root: path.resolve(__dirname, 'app/renderer'),
  base: './',
  plugins: [
    svelte({
      configFile: path.resolve(__dirname, 'svelte.config.js'),
    }),
  ],
  // Vite 5.1+: disable discovery to avoid unnecessary pre-bundling in this project
  optimizeDeps: {
    noDiscovery: true,
    include: [],
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
      '@views-settings': path.resolve(__dirname, 'app/renderer/src/views/settings'),
      '@views-development': path.resolve(__dirname, 'app/renderer/src/views/development'),
      '@views-admin': path.resolve(__dirname, 'app/renderer/src/views/admin'),
      '@views-browse': path.resolve(__dirname, 'app/renderer/src/views/browse'),
      '@views-discussion': path.resolve(__dirname, 'app/renderer/src/views/discussion'),
      '@ts': path.resolve(__dirname, 'app/renderer/src/ts'),
      '@features': path.resolve(__dirname, 'app/renderer/src/ts/features'),
      '@components': path.resolve(__dirname, 'app/renderer/src/components'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  define: {
    'import.meta.env.MODE': JSON.stringify(env.mode || 'production'),
  },
  };
});


