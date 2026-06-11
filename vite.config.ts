import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { mockChatApiPlugin } from './vite.mock'

export default defineConfig({
  plugins: [react(), mockChatApiPlugin()],
})
