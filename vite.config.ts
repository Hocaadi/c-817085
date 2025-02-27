import path from "path"
import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    base: '/c-817085/',
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: undefined
        }
      },
      define: {
        'process.env.VITE_CLERK_PUBLISHABLE_KEY': JSON.stringify(env.VITE_CLERK_PUBLISHABLE_KEY)
      }
    },
    server: {
      port: 8080,
      proxy: {
        '/api/coingecko': {
          target: 'https://api.coingecko.com/api/v3',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/coingecko/, ''),
        },
      },
      historyApiFallback: true,
    },
    envPrefix: 'VITE_',
  }
})
