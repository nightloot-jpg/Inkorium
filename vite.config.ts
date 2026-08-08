import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [devtools(), tailwindcss(), tanstackStart(), viteReact()],
  server: {
    allowedHosts: ['.inkorium.es', 'inkorium.es', 'www.inkorium.es']
  },
  preview: {
    allowedHosts: ['.inkorium.es', 'inkorium.es', 'www.inkorium.es']
  }
})

export default config
