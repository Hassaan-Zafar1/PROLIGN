//vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // or your framework plugin
import tailwindcss from '@tailwindcss/vite'


export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})
