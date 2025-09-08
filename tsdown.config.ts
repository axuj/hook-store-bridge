import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['./src/index.ts'],
  format: ['es'],
  clean: true,
  dts: true,
  external: ['react', 'react-dom', 'zustand', 'react/jsx-runtime'],
})
