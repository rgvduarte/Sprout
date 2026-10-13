import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// base './' para que o build funcione no GitHub Pages em /Sprout/ e em qualquer subpasta.
// Modo 'artifact': um único ficheiro HTML (JS e CSS embutidos) em dist-artifact/,
// depois convertido em fragmento por scripts/make-artifact.mjs.
export default defineConfig(({ mode }) => {
  const artifact = mode === 'artifact';
  return {
    base: './',
    plugins: [react(), tailwindcss(), ...(artifact ? [viteSingleFile()] : [])],
    build: artifact
      ? { outDir: 'dist-artifact', emptyOutDir: true, assetsInlineLimit: 100_000_000, chunkSizeWarningLimit: 5000 }
      : { outDir: 'dist', emptyOutDir: true, chunkSizeWarningLimit: 900 },
    server: { port: 5173, strictPort: false },
  };
});
