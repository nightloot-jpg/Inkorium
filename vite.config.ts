import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function inkoriumRouteBridge() {
  return {
    name: "inkorium-route-content-bridge",
    enforce: "post" as const,
    transform(code: string, id: string) {
      if (!id.endsWith("/src/main.tsx")) return null;

      const photoBranch = `if(media?.type==='photo')return <div style={{width:'100%',marginTop:10,maxHeight:460,overflow:'hidden',background:'#eef2f6'}}><img src={media.url} alt="Post media" style={{width:'100%',maxHeight:460,objectFit:'cover',display:'block'}}/></div>;`;
      const patchedCode = code.includes(photoBranch)
        ? code.replace(photoBranch, `if(media?.type==='photo')return React.createElement(PostMediaImage,{media});`)
        : code;

      const deleteHelper = `\nconst deletePostHelper = async (id, mediaData, supabase) => {\n  if (!window.confirm("¿Eliminar publicación?\\n\\nEsta acción no se puede deshacer.")) return false;\n\n  const { error } = await supabase.from("posts").delete().eq("id", id);\n  if (error) {\n    console.error("No se pudo eliminar la publicación", error);\n    window.alert("No se pudo eliminar la publicación: " + error.message);\n    return false;\n  }\n\n  if (mediaData?.url) {\n    try {\n      const url = new URL(mediaData.url);\n      const marker = "/storage/v1/object/public/";\n      const markerIndex = url.pathname.indexOf(marker);\n      if (markerIndex >= 0) {\n        const relative = url.pathname.slice(markerIndex + marker.length);\n        const [bucket, ...parts] = relative.split("/");\n        if (bucket && parts.length) {\n          await supabase.storage.from(bucket).remove([parts.join("/")]);\n        }\n      }\n    } catch (storageError) {\n      console.warn("La publicación se eliminó, pero no se pudo limpiar el archivo multimedia", storageError);\n    }\n  }\n\n  return true;\n};\n`;

      const postMediaHelper = `\nfunction resolvePostMediaPublicUrl(rawUrl, supabase) {\n  if (!rawUrl || typeof rawUrl !== "string") return rawUrl || "";\n  try {\n    const url = new URL(rawUrl);\n    const marker = "/storage/v1/object/public/";\n    const markerIndex = url.pathname.indexOf(marker);\n    if (markerIndex < 0) return rawUrl;\n    const relative = url.pathname.slice(markerIndex + marker.length);\n    const [bucket, ...parts] = relative.split("/");\n    if (!bucket || !parts.length) return rawUrl;\n    return supabase.storage.from(bucket).getPublicUrl(parts.join("/")).data.publicUrl || rawUrl;\n  } catch {\n    return rawUrl;\n  }\n}\n\nfunction PostMediaImage({ media }) {\n  const [src, setSrc] = React.useState(() => resolvePostMediaPublicUrl(media?.url, supabase));\n  const [failed, setFailed] = React.useState(false);\n\n  React.useEffect(() => {\n    setSrc(resolvePostMediaPublicUrl(media?.url, supabase));\n    setFailed(false);\n  }, [media?.url]);\n\n  const retryFromStorage = async () => {\n    if (!media?.url || failed) return;\n    setFailed(true);\n    try {\n      const url = new URL(media.url);\n      const marker = "/storage/v1/object/public/";\n      const markerIndex = url.pathname.indexOf(marker);\n      if (markerIndex < 0) return;\n      const relative = url.pathname.slice(markerIndex + marker.length);\n      const [bucket, ...parts] = relative.split("/");\n      if (!bucket || !parts.length) return;\n      const { data, error } = await supabase.storage.from(bucket).download(parts.join("/"));\n      if (error || !data) return;\n      const objectUrl = URL.createObjectURL(data);\n      setSrc(objectUrl);\n      setFailed(false);\n    } catch (error) {\n      console.warn("No se pudo recuperar el archivo multimedia", error);\n    }\n  };\n\n  if (failed) {\n    return React.createElement("div",{style:{width:'100%',marginTop:10,minHeight:180,display:'flex',alignItems:'center',justifyContent:'center',background:'#eef2f6',color:'#738397',fontSize:14}},"No se pudo cargar esta imagen.");\n  }\n\n  return React.createElement("img",{src,alt:"Post media",onError:retryFromStorage,style:{width:'100%',maxHeight:460,objectFit:'cover',display:'block'}});\n}\n`;

      return {
        code: `${patchedCode}${deleteHelper}${postMediaHelper}\nimport "./features/RouteContentBridge";\n`,
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