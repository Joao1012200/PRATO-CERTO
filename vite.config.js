import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// jsPDF importa estes pacotes opcionais só para recursos que o app não usa (HTML/SVG para PDF)
export default defineConfig({ plugins: [react()], build: { rollupOptions: { external: ['html2canvas', 'dompurify', 'canvg'] } } })
