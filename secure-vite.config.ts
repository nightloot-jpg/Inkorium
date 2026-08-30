import baseConfig from './vite.config.ts';
import { defineConfig, mergeConfig } from 'vite';

const secureConfig = defineConfig({
  define: {
    'import.meta.env.VITE_YOUTUBE_API_KEY': JSON.stringify('server-proxy'),
  },
});

export default mergeConfig(baseConfig, secureConfig);
