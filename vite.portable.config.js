import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  base: './',
  plugins: [react(), viteSingleFile()],
  build: {
    outDir: 'portable-temp',
    emptyOutDir: true,
    assetsInlineLimit: 100000000,
    cssCodeSplit: false,
    rollupOptions: {
      // jsPDF importa estes pacotes opcionais só para recursos que o app não usa
      external: ['html2canvas', 'dompurify', 'canvg'],
      output: { inlineDynamicImports: true }
    }
  }
})
