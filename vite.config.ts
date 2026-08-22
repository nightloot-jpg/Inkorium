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

function profileCustomizationBridge() {
  return {
    name: "inkorium-profile-customization-bridge",
    enforce: "pre" as const,
    transform(code: string, id: string) {
      if (!id.endsWith("/src/features/profile/ProfileView.tsx")) return null;

      let patched = code;
      patched = patched.replace(
        "  user_status: string | null;\n};",
        "  user_status: string | null;\n  profile_hashtag: string | null;\n};",
      );
      patched = patched.replace(
        "  const [mediaPreview, setMediaPreview] = useState<string | null>(null);",
        "  const [mediaPreview, setMediaPreview] = useState<string | null>(null);\n  const [editingHashtag, setEditingHashtag] = useState(false);\n  const [hashtagDraft, setHashtagDraft] = useState(profile?.profile_hashtag || \"\");\n  const [savingHashtag, setSavingHashtag] = useState(false);\n  const [signatureDraft, setSignatureDraft] = useState(\"\");\n  const [signatures, setSignatures] = useState<Array<{ id: string; content: string; created_at: string; author_id: string }>>([]);\n  const [loadingSignatures, setLoadingSignatures] = useState(false);\n  const [savingSignature, setSavingSignature] = useState(false);",
      );
      patched = patched.replace(
        'select("id, username, full_name, bio, city, avatar_url, banner_url, user_status")',
        'select("id, username, full_name, bio, city, avatar_url, banner_url, user_status, profile_hashtag")',
      );
      patched = patched.replace(
        "  }, [displayProfile?.user_status, displayProfile?.bio, globalProfile?.user_status, globalProfile?.bio, isOwnProfile]);",
        "  }, [displayProfile?.user_status, displayProfile?.bio, globalProfile?.user_status, globalProfile?.bio, isOwnProfile]);\n\n  useEffect(() => {\n    setHashtagDraft(displayProfile?.profile_hashtag ?? \"\");\n  }, [displayProfile?.profile_hashtag]);\n\n  useEffect(() => {\n    if (isOwnProfile || !viewedProfileId) {\n      setSignatures([]);\n      return;\n    }\n    let cancelled = false;\n    setLoadingSignatures(true);\n    async function loadSignatures() {\n      const { data, error } = await supabase\n        .from(\"profile_signatures\")\n        .select(\"id, content, created_at, author_id\")\n        .eq(\"profile_id\", viewedProfileId)\n        .order(\"created_at\", { ascending: false })\n        .limit(20);\n      if (!cancelled) {\n        if (error) console.error(\"Error loading profile signatures:\", error);\n        setSignatures((data || []) as Array<{ id: string; content: string; created_at: string; author_id: string }>);\n        setLoadingSignatures(false);\n      }\n    }\n    void loadSignatures();\n    return () => { cancelled = true; };\n  }, [isOwnProfile, viewedProfileId]);",
      );
      patched = patched.replace(
        "  const togglePlayback = () => {",
        "  const saveHashtag = async () => {\n    if (!isOwnProfile) return;\n    setSavingHashtag(true);\n    const value = hashtagDraft.trim().replace(/^#+/, \"\").replace(/\\s+/g, \"\").slice(0, 50);\n    const { error } = await supabase.from(\"profiles\").update({ profile_hashtag: value || null, updated_at: new Date().toISOString() }).eq(\"id\", session.user.id);\n    setSavingHashtag(false);\n    if (error) {\n      window.alert(\"No se pudo guardar el hashtag: \" + error.message);\n      return;\n    }\n    setViewedProfile((current) => current ? { ...current, profile_hashtag: value || null } : current);\n    setHashtagDraft(value);\n    setEditingHashtag(false);\n  };\n\n  const saveSignature = async () => {\n    if (isOwnProfile) return;\n    const value = signatureDraft.trim().slice(0, 280);\n    if (!value) return;\n    setSavingSignature(true);\n    const { data, error } = await supabase\n      .from(\"profile_signatures\")\n      .insert({ profile_id: viewedProfileId, author_id: session.user.id, content: value })\n      .select(\"id, content, created_at, author_id\")\n      .single();\n    setSavingSignature(false);\n    if (error) {\n      window.alert(\"No se pudo dejar la firma: \" + error.message);\n      return;\n    }\n    if (data) setSignatures((current) => [data as { id: string; content: string; created_at: string; author_id: string }, ...current].slice(0, 20));\n    setSignatureDraft(\"\");\n  };\n\n  const togglePlayback = () => {",
      );
      patched = patched.replace(
        "          {editingBio && isOwnProfile ?",
        "          {isOwnProfile ? (\n            editingHashtag ? (\n              <div className=\"profile-view-hashtag-editor\">\n                <input\n                  autoFocus\n                  value={hashtagDraft ? \"#\" + hashtagDraft : \"\"}\n                  maxLength={51}\n                  placeholder=\"#MúsicasvgInkorium\"\n                  onChange={(e) => setHashtagDraft(e.target.value.replace(/^#+/, \"\").replace(/\\s+/g, \"\"))}\n                  onKeyDown={(e) => { if (e.key === \"Enter\") void saveHashtag(); if (e.key === \"Escape\") { setEditingHashtag(false); setHashtagDraft(displayProfile?.profile_hashtag || \"\"); } }}\n                />\n                <button type=\"button\" onClick={() => void saveHashtag()} disabled={savingHashtag}><Check size={14} /> Guardar</button>\n                <button type=\"button\" className=\"secondary\" onClick={() => { setEditingHashtag(false); setHashtagDraft(displayProfile?.profile_hashtag || \"\"); }}><X size={14} /></button>\n              </div>\n            ) : (\n              <button type=\"button\" className=\"profile-view-hashtag editable\" onClick={() => setEditingHashtag(true)}>#{displayProfile?.profile_hashtag || \"Añadir hashtag\"} <Pencil size={13} /></button>\n            )\n          ) : displayProfile?.profile_hashtag ? (\n            <span className=\"profile-view-hashtag\">#{displayProfile.profile_hashtag}</span>\n          ) : null}\n          {editingBio && isOwnProfile ?",
      );
      patched = patched.replace(
        '<div className="profile-view-meta">{displayProfile?.city && <span><MapPin size={15} /> {displayProfile.city}</span>}<span><Music2 size={15} /> Música</span><span><Users size={15} /> Inkorium</span></div>',
        '<div className="profile-view-meta">{displayProfile?.city && <span><MapPin size={15} /> {displayProfile.city}</span>}</div>',
      );
      patched = patched.replace(
        '          <div className="profile-view-card"><div className="profile-view-section-head"><h2>Publicaciones</h2>',
        `          {!isOwnProfile && <div className="profile-view-card profile-view-signature-card">
            <div className="profile-view-signature-head"><div><h2>Deja tu firma</h2><p>Escribe algo para dejar tu huella en este perfil.</p></div></div>
            <textarea className="profile-view-signature-input" value={signatureDraft} maxLength={280} onChange={(e) => setSignatureDraft(e.target.value)} placeholder="Escribe un mensaje..." />
            <div className="profile-view-signature-actions"><span>{signatureDraft.length}/280</span><button type="button" onClick={() => void saveSignature()} disabled={savingSignature || !signatureDraft.trim()}>{savingSignature ? "Guardando..." : "Firmar"}</button></div>
            {loadingSignatures ? <div className="profile-view-signature-empty">Cargando firmas...</div> : signatures.length > 0 ? <div className="profile-view-signatures">{signatures.map((signature) => <div key={signature.id} className="profile-view-signature"><div className="profile-view-signature-avatar">{initials(signature.author_id)}</div><div><div className="profile-view-signature-meta">@{signature.author_id.slice(0, 8)} · {new Date(signature.created_at).toLocaleDateString("es-ES")}</div><p>{signature.content}</p></div></div>)}</div> : <div className="profile-view-signature-empty">Todavía no hay firmas. Sé la primera persona en dejar una.</div>}
          </div>}
          <div className="profile-view-card"><div className="profile-view-section-head"><h2>Publicaciones</h2>`
      );

      return { code: patched, map: null };
    },
  };
}

function inkoriumRouteBridge() {
  return {
    name: "inkorium-route-content-bridge",
    enforce: "post" as const,
    transform(code: string, id: string) {
      if (!id.endsWith("/src/main.tsx")) return null;

      const photoBranch = `if(media?.type==='photo')return <div style={{width:'100%',marginTop:10,maxHeight:460,overflow:'hidden',background:'#eef2f6'}}><img src={media.url} alt='Post media' style={{width:'100%',maxHeight:460,objectFit:'cover',display:'block'}}/></div>;`;
      const patchedCode = code.includes(photoBranch)
        ? code.replace(photoBranch, `if(media?.type==='photo')return React.createElement(PostMediaImage,{media});`)
        : code;

      const deleteHelper = `\nconst deletePostHelper = async (id, mediaData, supabase) => {\n  if (!window.confirm(\"¿Eliminar publicación?\\n\\nEsta acción no se puede deshacer.\")) return false;\n\n  const { error } = await supabase.from(\"posts\").delete().eq(\"id\", id);\n  if (error) {\n    console.error(\"No se pudo eliminar la publicación\", error);\n    window.alert(\"No se pudo eliminar la publicación: \" + error.message);\n    return false;\n  }\n\n  if (mediaData?.url) {\n    try {\n      const url = new URL(mediaData.url);\n      const marker = \"/storage/v1/object/public/\";\n      const markerIndex = url.pathname.indexOf(marker);\n      if (markerIndex >= 0) {\n        const relative = url.pathname.slice(markerIndex + marker.length);\n        const [bucket, ...parts] = relative.split(\"/\");\n        if (bucket && parts.length) {\n          await supabase.storage.from(bucket).remove([parts.join(\"/\")]);\n        }\n      }\n    } catch (storageError) {\n      console.warn(\"La publicación se eliminó, pero no se pudo limpiar el archivo multimedia\", storageError);\n    }\n  }\n\n  return true;\n};\n`;

      const postMediaHelper = `\nfunction resolvePostMediaPublicUrl(rawUrl, supabase) {\n  if (!rawUrl || typeof rawUrl !== \"string\") return rawUrl || \"\";\n  try {\n    const url = new URL(rawUrl);\n    const marker = \"/storage/v1/object/public/\";\n    const markerIndex = url.pathname.indexOf(marker);\n    if (markerIndex < 0) return rawUrl;\n    const relative = url.pathname.slice(markerIndex + marker.length);\n    const [bucket, ...parts] = relative.split(\"/\");\n    if (!bucket || !parts.length) return rawUrl;\n    return supabase.storage.from(bucket).getPublicUrl(parts.join(\"/\")).data.publicUrl || rawUrl;\n  } catch {\n    return rawUrl;\n  }\n}\n\nfunction PostMediaImage({ media }) {\n  const [src, setSrc] = React.useState(() => resolvePostMediaPublicUrl(media?.url, supabase));\n  const [failed, setFailed] = React.useState(false);\n\n  React.useEffect(() => {\n    setSrc(resolvePostMediaPublicUrl(media?.url, supabase));\n    setFailed(false);\n  }, [media?.url]);\n\n  const retryFromStorage = async () => {\n    if (!media?.url || failed) return;\n    setFailed(true);\n    try {\n      const url = new URL(media.url);\n      const marker = \"/storage/v1/object/public/\";\n      const markerIndex = url.pathname.indexOf(marker);\n      if (markerIndex < 0) return;\n      const relative = url.pathname.slice(markerIndex + marker.length);\n      const [bucket, ...parts] = relative.split(\"/\");\n      if (!bucket || !parts.length) return;\n      const { data, error } = await supabase.storage.from(bucket).download(parts.join(\"/\"));\n      if (error || !data) return;\n      const objectUrl = URL.createObjectURL(data);\n      setSrc(objectUrl);\n      setFailed(false);\n    } catch (error) {\n      console.warn(\"No se pudo recuperar el archivo multimedia\", error);\n    }\n  };\n\n  if (failed) {\n    return React.createElement(\"div\",{style:{width:'100%',marginTop:10,minHeight:180,display:'flex',alignItems:'center',justifyContent:'center',background:'#eef2f6',color:'#738397',fontSize:14}},\"No se pudo cargar esta imagen.\");\n  }\n\n  return React.createElement(\"img\",{src,alt:\"Post media\",onError:retryFromStorage,style:{width:'100%',maxHeight:460,objectFit:'cover',display:'block'}});\n}\n`;

      return {
        code: `${patchedCode}${deleteHelper}${postMediaHelper}\nimport \"./features/RouteContentBridge\";\n`,
        map: null,
      };
    },
  };
}

export default defineConfig({
  plugins: [youtubeProxyBridge(), profileCustomizationBridge(), react(), inkoriumRouteBridge()],
  define: {
    "import.meta.env.VITE_YOUTUBE_API_KEY": JSON.stringify("server-proxy"),
  },
  server: { host: "0.0.0.0", port: 5173 },
  preview: { host: "0.0.0.0", port: 5173 },
});
