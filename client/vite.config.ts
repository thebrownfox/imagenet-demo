import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
    plugins: [react()],
    build: {
        outDir: '../public',
        emptyOutDir: true
    },
    root: __dirname,
    publicDir: 'public',
    // Add this to ensure proper asset paths when served by Nitro
    base: '/'
})