import { defineConfig } from 'vite';

// Relative base so the build works on GitHub Pages (project sub-path)
// and on Cloudflare Pages (root) without changes.
export default defineConfig({
  base: './',
  build: { outDir: 'dist' },
});
