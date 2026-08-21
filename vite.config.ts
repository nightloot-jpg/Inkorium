import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function inkoriumRouteBridge() {
  return {
    name: "inkorium-route-content-bridge",
    enforce: "post" as const,
    transform(code: string, id: string) {
      if (!id.endsWith("/src/main.tsx")) return null;
      const deleteHelper = `\nconst deletePostHelper = async (id, mediaData, supabase) => {\n  if (!window.confirm("¿Eliminar publicación?\\n\\nEsta acción no se puede deshacer.")) return false;\n\n  const { error } = await supabase.from("posts").delete().eq("id", id);\n  if (error) {\n    console.error("No se pudo eliminar la publicación", error);\n    window.alert("No se pudo eliminar la publicación: " + error.message);\n    return false;\n  }\n\n  if (mediaData?.url) {\n    try {\n      const url = new URL(mediaData.url);\n      const marker = "/storage/v1/object/public/";\n      const markerIndex = url.pathname.indexOf(marker);\n      if (markerIndex >= 0) {\n        const relative = url.pathname.slice(markerIndex + marker.length);\n        const [bucket, ...parts] = relative.split("/");\n        if (bucket && parts.length) {\n          await supabase.storage.from(bucket).remove([parts.join("/")]);\n        }\n      }\n    } catch (storageError) {\n      console.warn("La publicación se eliminó, pero no se pudo limpiar el archivo multimedia", storageError);\n    }\n  }\n\n  return true;\n};\n`;
      return {
        code: `${code}${deleteHelper}\nimport "./features/RouteContentBridge";\n`,
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