import baseConfig from './vite.config';
import { defineConfig, mergeConfig } from 'vite';

const youtubeClientSafety = {
  name: 'inkorium-youtube-client-safety',
  enforce: 'pre' as const,
  transform(code: string, id: string) {
    if (!id.includes('/src/')) return null;
    return code.replaceAll('import.meta.env.VITE_YOUTUBE_API_KEY', JSON.stringify('server-proxy'));
  },
};

export default defineConfig(mergeConfig(baseConfig, {
  // Only the two public Supabase client values are allowed into browser code.
  envPrefix: ['VITE_SUPABASE_'],
  plugins: [youtubeClientSafety],
}));
