import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/layout/',
  build: {
    outDir: 'src/main/resources/public/layout',
    emptyOutDir: true
  }
})
