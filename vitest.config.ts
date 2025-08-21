import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'node:path';

export default defineConfig({
  plugins: [
    svelte({ 
      hot: !process.env.VITEST,
      compilerOptions: {
        // Enable testing mode for Svelte components
        dev: true,
        // Enable compatibility mode for Svelte 5 testing
        compatibility: {
          componentApi: 4
        }
      },
      // Disable CSS injection during tests to avoid DOM issues
      emitCss: false,
    })
  ],
  test: {
    // Enable global test APIs (describe, test, expect, etc.)
    globals: true,
    
    // Test environment for DOM/browser APIs
    environment: 'jsdom',
    
    // Setup files to run before tests
    setupFiles: ['./test-setup.ts'],
    
    
    // Test file patterns
    include: [
      '**/__tests__/**/*.{test,spec}.{js,ts,jsx,tsx}',
      '**/*.{test,spec}.{js,ts,jsx,tsx}',
    ],
    
    // Files to exclude from tests
    exclude: [
      'node_modules',
      'dist',
      'release',
      '.git',
      '.cache',
      '*.config.{js,ts}',
      'packages/db/drizzle/**',
    ],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      
      // Coverage thresholds
      thresholds: {
        statements: 70,
        branches: 70,
        functions: 70,
        lines: 70,
      },
      
      // Files to exclude from coverage
      exclude: [
        'node_modules/',
        'test-setup.ts',
        '*.config.{js,ts,mts}',
        '**/*.d.ts',
        '**/__tests__/**',
        '**/__mocks__/**',
        '**/dist/**',
        '**/release/**',
        '**/*.spec.ts',
        '**/*.test.ts',
        'packages/db/drizzle/**',
        'app/preload/future-apis.ts', // Future implementation
        'docs/**',
        '.ah/**',
        '.ahhub/**',
      ],
      
      // Include specific directories for coverage - only areas with tests
      include: [
        'app/main/settings.ts',
        'app/main/screen-capture.ts',
        'app/main/db/handlers/**/*.ts',
        'app/main/db/services/**/*.ts', 
        'app/renderer/src/components/**/*.svelte',
        'app/renderer/src/ts/features/admin/**/*.ts',
        'app/renderer/src/ts/features/ai-communication/**/*.ts',
        'app/renderer/src/ts/features/computer-capture/**/*.ts',
        'app/renderer/src/ts/features/router/**/*.ts',
        'app/renderer/src/ts/i18n/**/*.ts',
      ],
    },
    
    // Test timeout (in milliseconds)
    testTimeout: 10000,
    
    // Hook timeout (in milliseconds)
    hookTimeout: 10000,
    
    // Number of threads
    threads: true,
    
    // Maximum number of threads
    maxThreads: 4,
    
    // Minimum number of threads
    minThreads: 1,
    
    // Reporter options
    reporters: ['default', 'html'],
    outputFile: {
      html: './test-results/index.html',
    },
    
    // Mock configuration
    mockReset: true,
    clearMocks: true,
    restoreMocks: true,
    
    // Benchmark options (for performance tests)
    benchmark: {
      include: ['**/*.bench.ts'],
      exclude: ['node_modules'],
    },
    
    // TypeScript configuration
    typecheck: {
      enabled: false,
    },
  },
  
  // Path resolution (same as main vite config)
  resolve: {
    alias: {
      '~': path.resolve(__dirname, 'app'),
      '@renderer': path.resolve(__dirname, 'app/renderer/src'),
      '@views': path.resolve(__dirname, 'app/renderer/src/views'),
      '@views-settings': path.resolve(__dirname, 'app/renderer/src/views/settings'),
      '@views-development': path.resolve(__dirname, 'app/renderer/src/views/development'),
      '@views-admin': path.resolve(__dirname, 'app/renderer/src/views/admin'),
      '@views-browse': path.resolve(__dirname, 'app/renderer/src/views/browse'),
      '@ts': path.resolve(__dirname, 'app/renderer/src/ts'),
      '@features': path.resolve(__dirname, 'app/renderer/src/ts/features'),
      '@components': path.resolve(__dirname, 'app/renderer/src/components'),
      // Force client-side Svelte modules
      'svelte/src/index-server.js': 'svelte/src/index.js',
      'svelte/src/internal/server': 'svelte/src/internal/client',
    },
  },
  
  // Define global constants
  define: {
    'import.meta.env.MODE': JSON.stringify(process.env.NODE_ENV || 'test'),
    'import.meta.env.VITE_DEV_SERVER_URL': JSON.stringify(''),
    global: 'globalThis',
  },
  
  // Force browser environment
  ssr: {
    noExternal: ['svelte'],
  },
  
  // Optimize deps configuration
  optimizeDeps: {
    // Include dependencies that need pre-bundling
    include: [
      '@testing-library/svelte',
      '@testing-library/user-event',
    ],
  },
  
  // ESBuild options
  esbuild: {
    target: 'es2020',
  },
});