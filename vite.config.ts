import { defineConfig } from 'vite'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: [
      '@tiptap/extension-highlight',
      '@tiptap/extension-typography',
      '@tiptap/extension-code-block-lowlight',
      'lowlight',
    ],
  },
  plugins: [
    react(),
    tailwindcss(),
  ],
})
