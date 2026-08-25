import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function youtubeProxyBridge() {
  return {
    name: "inkorium-youtube-proxy-bridge",
    enforce: "pre" as const,
    transform(code: string, id: string) {
      if (!/\.(tsx?|jsx?)$/.test(id) || id.includes("node_modules")) return null;

      let patched = code;
      // Keep the original YouTube URL so youtube-api-proxy.ts can intercept it
      // in the browser and forward the request to the authenticated Supabase
      // Edge Function. Never inject the real API key into the client bundle.
      patched = patched.replaceAll(
        "import.meta.env.VITE_YOUTUBE_API_KEY",
        '"server-proxy"',
      );

      return patched === code ? null : { code: patched, map: null };
    },
  };
}

export default defineConfig({
  plugins: [youtubeProxyBridge(), react()],
  define: {
    "import.meta.env.VITE_YOUTUBE_API_KEY": JSON.stringify("server-proxy"),
  },
  server: { host: "0.0.0.0", port: 5173 },
  preview: { host: "0.0.0.0", port: 5173 },
});
