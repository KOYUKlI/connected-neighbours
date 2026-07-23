import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        ws: true,
      },
    },
    watch: {
      // WSL2 doesn't reliably propagate inotify events for /mnt/* (drvfs) mounts.
      usePolling: true,
      interval: 300,
    },
  },
})
