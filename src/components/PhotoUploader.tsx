import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { supabase } from "../lib/supabase";
import type { Session } from "@supabase/supabase-js";

type Props = {
  session: Session;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
};

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_SIZE = 60 * 1024 * 1024;
const R2_MEDIA_FUNCTION = "r2-media";

export function PhotoUploader({ session, onClose, onSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape" && !uploading) onClose(); };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, uploading]);

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    if (!selected) return;
    if (!ALLOWED_TYPES.has(selected.type)) { setError("Formato no soportado. Usa JPG, PNG, WEBP o GIF."); return; }
    if (selected.size > MAX_SIZE) { setError("La imagen es demasiado grande. Máximo 60MB."); return; }
    setError(""); setFile(selected); setPreview(URL.createObjectURL(selected));
  }

  async function handleUpload() {
    if (!file || uploading) return;
    setUploading(true); setError("");
    try {
      const userId = session.user.id;
      if (!userId) throw new Error("No hay una sesión válida.");

      const { data: signed, error: signError } = await supabase.functions.invoke(R2_MEDIA_FUNCTION, {
        body: { action: "upload", folder: "photos", fileName: file.name, contentType: file.type, size: file.size },
      });
      if (signError) throw new Error(signError.message || "No se pudo preparar la subida a Cloudflare R2.");
      if (!signed?.uploadUrl || !signed?.key) throw new Error("Cloudflare R2 no devolvió una URL de subida válida.");
      if (!signed.url) throw new Error("Configura R2_PUBLIC_BASE_URL en los secrets de la función r2-media para poder mostrar las fotos.");

      const uploadResponse = await fetch(signed.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!uploadResponse.ok) throw new Error(`Cloudflare R2 rechazó la subida (${uploadResponse.status}).`);

      const { error: dbError } = await supabase.from("photos").insert({
        user_id: userId,
        storage_path: signed.key,
        url: signed.url,
        caption: caption.trim() || null,
        visibility,
      });
      if (dbError) throw new Error(dbError.message || "No se ha podido guardar la fotografía.");

      await onSuccess();
      onClose();
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "No se ha podido subir la fotografía.";
      console.error("[PHOTO_UPLOAD]", caught);
      setError(message);
    } finally { setUploading(false); }
  }

  return createPortal(
    <div role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !uploading) onClose(); }} style={{ position: "fixed", inset: 0, zIndex: 2147483647, display: "grid", placeItems: "center", padding: 20, background: "rgba(15, 28, 48, 0.58)" }}>
      <section role="dialog" aria-modal="true" aria-label="Subir nueva foto" style={{ width: "min(100%, 560px)", maxHeight: "calc(100vh - 40px)", overflowY: "auto", borderRadius: 12, background: "#fff", boxShadow: "0 24px 70px rgba(0,0,0,.28)" }}>
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "16px 18px", borderBottom: "1px solid #e8edf3" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}><ImageIcon size={22} color="#0750A7"/><strong style={{ color: "#1f2e40", fontSize: 18 }}>Subir nueva foto</strong></div>
          <button type="button" onClick={onClose} disabled={uploading} aria-label="Cerrar" style={{ width: 34, height: 34, display: "grid", placeItems: "center", border: 0, borderRadius: 8, background: "transparent", cursor: "pointer" }}><X size={20}/></button>
        </header>
        <div style={{ padding: 18, display: "grid", gap: 14 }}>
          {error && <div style={{ padding: 11, borderRadius: 8, background: "#fff2f2", color: "#bd2c2c", fontSize: 13 }}>{error}</div>}
          {!file ? (
            <button type="button" onClick={() => inputRef.current?.click()} style={{ minHeight: 250, display: "grid", placeItems: "center", alignContent: "center", gap: 10, border: "2px dashed #cbd7e4", borderRadius: 12, background: "#f8fbff", color: "#45617d", cursor: "pointer" }}><Upload size={34}/><strong>Selecciona una foto</strong><span style={{ fontSize: 13, color: "#7c8d9f" }}>JPG, PNG, WEBP o GIF · máximo 60MB</span></button>
          ) : (
            <>
              <div style={{ position: "relative", borderRadius: 10, overflow: "hidden", background: "#0f1720", textAlign: "center" }}><img src={preview ?? ""} alt="Vista previa" style={{ display: "block", width: "100%", maxHeight: 390, objectFit: "contain" }}/><button type="button" onClick={() => { setFile(null); setPreview(null); }} disabled={uploading} aria-label="Quitar foto" style={{ position: "absolute", top: 10, right: 10, width: 34, height: 34, border: 0, borderRadius: "50%", color: "#fff", background: "rgba(0,0,0,.55)", cursor: "pointer" }}><X size={18}/></button></div>
              <textarea value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="Escribe una descripción..." rows={3} style={{ width: "100%", resize: "vertical", padding: 12, border: "1px solid #d5dee8", borderRadius: 8, font: "inherit" }}/>
              <select value={visibility} onChange={(event) => setVisibility(event.target.value)} style={{ width: "100%", padding: 10, border: "1px solid #d5dee8", borderRadius: 8, background: "#fff" }}><option value="public">Público</option><option value="friends">Solo amigos</option><option value="private">Privado</option></select>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}><button type="button" onClick={onClose} disabled={uploading} style={{ padding: "10px 16px", border: "1px solid #d5dee8", borderRadius: 8, background: "#fff", cursor: "pointer" }}>Cancelar</button><button type="button" onClick={() => void handleUpload()} disabled={uploading} style={{ padding: "10px 18px", border: 0, borderRadius: 8, color: "#fff", background: "#0750A7", cursor: "pointer", fontWeight: 700 }}>{uploading ? "Subiendo…" : "Publicar foto"}</button></div>
            </>
          )}
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleFileSelect} style={{ display: "none" }}/>
        </div>
      </section>
    </div>,
    document.body,
  );
}
