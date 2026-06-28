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
  build: {
    target: 'es2022',
    cssCodeSplit: true,
    modulePreload: false,
    sourcemap: false,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('mermaid')) return 'mermaid'
          if (id.includes('@tiptap') || id.includes('@prosemirror') || id.includes('prosemirror-')) {
            return 'editor'
          }
          if (id.includes('highlight.js') || id.includes('lowlight')) return 'syntax'
          if (id.includes('radix-ui') || id.includes('@radix-ui') || id.includes('cmdk')) return 'ui'
          if (id.includes('react') || id.includes('scheduler')) return 'react'
          if (id.includes('fuse.js') || id.includes('nspell')) return 'tools'
        },
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
  ],
})
