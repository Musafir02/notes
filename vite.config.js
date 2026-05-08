import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const nimKey = env.NVIDIA_NIM_KEY || env.VITE_NVIDIA_NIM_KEY

  return {
    plugins: [react()],
    publicDir: 'notes',
    preview: { allowedHosts: true },
    server: {
      proxy: {
        '/api/chat': {
          target: 'https://integrate.api.nvidia.com',
          changeOrigin: true,
          rewrite: () => '/v1/chat/completions',
          headers: { Authorization: `Bearer ${nimKey}` },
        },
      },
    },
  }
})
