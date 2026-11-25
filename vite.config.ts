import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // OneDrive folders can drop file-change events, so check for edits by polling instead.
  server: { watch: { usePolling: true, interval: 300 } },
});
