import tailwindcss from '@tailwindcss/vite'
import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  server:  {
    proxy: {
      '/api':     {
        target:       'http://localhost:3000',
        changeOrigin: true
      },
      '/avatars': {
        target:       'http://localhost:3000',
        changeOrigin: true
      },
      '/ws':      {
        target:       'http://localhost:3000',
        ws:           true,
        changeOrigin: true
      }
    }
  }
})
