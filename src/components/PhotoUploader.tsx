import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { supabase } from "../lib/supabase";
import type { Session } from "@supabase/supabase-js";

type Props = {
  session: Session;
  onClose: () => void;
  onSuccess: () => void;
};

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export function PhotoUploader({ session, onClose, onSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    
    if (!ALLOWED_TYPES.includes(selected.type)) {
      setError("Formato no soportado. Usa JPG, PNG, WEBP o GIF.");
      return;
    }
    if (selected.size > MAX_SIZE) {
      setError("La imagen es demasiado grande. Máximo 10MB.");
      return;
    }

    setFile(selected);
    setError("");
    setPreview(URL.createObjectURL(selected));
  }


  async function handleUpload() {
    if (!file) return;

    // Auth Check
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      setError("Debes iniciar sesión para subir fotos.");
      return;
    }

    setUploading(true);
    setError("");
    let uploadedPath = "";

    try {
      const ext = file.name.split('.').pop();
      // Use user.id as requested to ensure ownership matches storage structure
      const path = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
      uploadedPath = path;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('photos')
        .upload(path, file);

      if (uploadError) {
        console.error("[PHOTO_UPLOAD] STORAGE", uploadError);
        throw new Error("No se ha podido subir la imagen.");
      }

      const { data: publicUrlData } = supabase.storage
        .from('photos')
        .getPublicUrl(path);

      const { error: dbError } = await supabase
        .from('photos')
        .insert({
          user_id: user.id, // specifically use user.id
          storage_path: path,
          url: publicUrlData.publicUrl,
          caption: caption.trim(),
          visibility: visibility
        });

      if (dbError) {
        console.error("[PHOTO_UPLOAD] PHOTOS_INSERT", dbError);
        // Avoid throwing raw RLS errors
        throw new Error("No se ha podido guardar la fotografía.");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al publicar la foto.");

      // Cleanup orphaned file if DB insert failed but storage succeeded
      if (uploadedPath && err.message === "No se ha podido guardar la fotografía.") {
        try {
           await supabase.storage.from('photos').remove([uploadedPath]);
           console.log("[PHOTO_UPLOAD] Limpieza de archivo huérfano completada.");
        } catch (cleanupErr) {
           console.error("[PHOTO_UPLOAD] Error al limpiar archivo huérfano:", cleanupErr);
        }
      }
    } finally {
      setUploading(false);
    }
  }
  return (
    <div className="photos-uploader-modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="photos-uploader-content">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: "1.2em" }}>Subir nueva foto</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={24} /></button>
        </div>

        {error && <p style={{ color: "red", margin: 0, fontSize: "0.9em" }}>{error}</p>}

        {!file ? (
          <div className="photos-uploader-dropzone" onClick={() => inputRef.current?.click()}>
            <ImageIcon size={48} style={{ opacity: 0.5, marginBottom: 16 }} />
            <p>Haz clic para seleccionar una foto</p>
            <small>JPG, PNG, WEBP, GIF (Max. 10MB)</small>
            <input 
              type="file" 
              ref={inputRef} 
              style={{ display: "none" }} 
              accept="image/jpeg, image/png, image/webp, image/gif" 
              onChange={handleFileSelect} 
            />
          </div>
        ) : (
          <>
            <div className="photos-uploader-preview">
              <img src={preview!} alt="Preview" />
              <button 
                onClick={() => { setFile(null); setPreview(null); }}
                style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.5)", color: "white", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer" }}
              >
                <X size={16} />
              </button>
            </div>
            
            <textarea 
              placeholder="Escribe una descripción..." 
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid var(--border)", minHeight: 80, resize: "vertical", boxSizing: "border-box" }}
            />

            <select 
              value={visibility} 
              onChange={(e) => setVisibility(e.target.value)}
              style={{ padding: 8, borderRadius: 8, border: "1px solid var(--border)" }}
            >
              <option value="public">Público</option>
              <option value="friends">Solo amigos</option>
              <option value="private">Privado</option>
            </select>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 16 }}>
              <button className="text-button" onClick={onClose} disabled={uploading}>Cancelar</button>
              <button className="primary-button" onClick={handleUpload} disabled={uploading}>
                {uploading ? "Subiendo..." : "Publicar foto"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
