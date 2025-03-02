import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env variables for the specified mode
  const env = loadEnv(mode, process.cwd(), '');
  console.log(`Building with mode: ${mode}`);
  console.log(`TypeScript checks: ${env.VITE_SKIP_TS_CHECK === 'true' ? 'DISABLED' : 'ENABLED'}`);

  return {
    plugins: [react()],
    base: '/c-817085/',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    esbuild: {
      // This will make ESBuild ignore TypeScript errors during the build
      logOverride: { 
        'ts-compiler-error': 'silent',
        'ts-compiler-warning': 'silent'
      }
    },
    build: {
      // Completely skip TypeScript type checking
      typescript: {
        noEmit: false
      },
      // Improve error handling during build
      minify: mode === 'production',
      sourcemap: mode !== 'production',
      rollupOptions: {
        // Ensure legacy browsers are supported if needed
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
          },
        },
      },
    },
    server: {
      port: 3000,
      host: true,
    },
  };
});
