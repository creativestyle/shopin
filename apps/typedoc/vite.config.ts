import { defineConfig } from 'vite';

export default defineConfig({
  base: '/', // Ensure the base path is set to root
  server: {
    open: '/index.html',
    port: 5000, // Set the server to run on port 5000
  },
  publicDir: 'docs/',
});