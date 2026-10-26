import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  build: {
    // The main chunk is ~1,036 kB (~313 kB gzipped), almost all MUI and the DataGrid: acceptable
    // for an internal tool. A manual vendor split (codeSplitting groups) was tried and broke at
    // runtime from chunk load order, so the limit sits just above the current size instead.
    chunkSizeWarningLimit: 1100,
  },
  test: {
    globals: false,
    environment: 'jsdom',
    setupFiles: './src/test-setup.ts',
  },
})
