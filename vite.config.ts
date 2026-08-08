import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [devtools(), tailwindcss(), tanstackStart(), viteReact()],
  server: {
    allowedHosts: ['.inkorium.es', 'inkorium.es', 'www.inkorium.es', 'https://inkorium.es/', 'https://www.inkorium.es/', 'localhost', '127.0.0.1']
  },
  preview: {
    allowedHosts: ['.inkorium.es', 'inkorium.es', 'www.inkorium.es', 'https://inkorium.es/', 'https://www.inkorium.es/', 'localhost', '127.0.0.1']
  }
})

export default config
