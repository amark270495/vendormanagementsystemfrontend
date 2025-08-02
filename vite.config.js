import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  // The 'base' property should be removed for Azure deployment
  plugins: [react()],
})
