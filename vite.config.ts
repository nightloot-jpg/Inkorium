import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function inkoriumRouteBridge() {
  return {
    name: "inkorium-route-content-bridge",
    enforce: "post" as const,
    transform(code: string, id: string) {
      if (!id.endsWith("/src/main.tsx")) return null;
      return {
        code: `${code}\nimport "./features/RouteContentBridge";\n`,
        map: null,
      };
    },
  };
}

export default defineConfig({
  plugins: [react(), inkoriumRouteBridge()],
  server: { host: "0.0.0.0", port: 5173 },
  preview: { host: "0.0.0.0", port: 5173 },
});
