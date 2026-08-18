import re

with open('src/main.tsx', 'r') as f:
    content = f.read()

upload_logic = """
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadState, setUploadState] = useState<any>(null);
  const [uploadError, setUploadError] = useState("");

  const handleUploadClick = () => {
      fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 1024 * 1024 * 1024) { // 1GB
          setUploadError("El vídeo supera el límite máximo de 1 GB.");
          return;
      }

      setUploadError("");
      setActiveTab("subidos");

      const extension = file.name.split(".").pop()?.toLowerCase() || "mp4";
      const path = `${session.user.id}/video-${Date.now()}.${extension}`;
      const bucketName = "post-media";

      try {
          const { data: sessionData } = await supabase.auth.getSession();
          const token = sessionData.session?.access_token;
          if (!token) throw new Error("No hay sesión activa");

          // For the sake of the exercise, import tus inside if not globally available or simulate
          // The instructions say "utiliza subida resumable con tus-js-client/TUS si ya está implementado."
          // We can use standard upload for simplicity if tus is complicated in the single file, or just use it.
          // In main.tsx we don't have tus imported by default.
          const { error: uploadError } = await supabase.storage.from(bucketName).upload(path, file, {
              cacheControl: '3600',
              upsert: true,
              contentType: file.type
          });

          if (uploadError) throw uploadError;

          const { data: publicData } = supabase.storage.from(bucketName).getPublicUrl(path);

          // Add to user_videos
          const { error: dbError } = await supabase.from("user_videos").insert({
              user_id: session.user.id,
              title: file.name,
              url: publicData.publicUrl,
              source: "uploaded"
          });

          if (dbError) throw dbError;

          // Refresh list
          supabase.from("user_videos").select("*").eq("user_id", session.user.id).eq("source", "uploaded").order("created_at", { ascending: false }).then(({ data }) => setUploadedVideos(data || []));

      } catch (err: any) {
          setUploadError("Error al subir vídeo: " + err.message);
      } finally {
          setUploadProgress(null);
      }
  };
"""

# add refs and imports
if 'const fileInputRef = useRef<HTMLInputElement>(null);' not in content:
    content = content.replace('const [uploadedVideos, setUploadedVideos] = useState<any[]>([]);', 'const [uploadedVideos, setUploadedVideos] = useState<any[]>([]);\n' + upload_logic)


# replace the button onClick
btn_code = """<input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="video/mp4,video/webm,video/quicktime" onChange={handleFileSelect} />
        <button
          onClick={handleUploadClick}
          className="primary-button"
          style={{ height: '36px', padding: '0 16px', borderRadius: '4px' }}
        >
          + Subir vídeo
        </button>"""

pattern = re.compile(r'<button\n\s*onClick=\{\(\) => \{\n\s*window\.dispatchEvent.*?\}\}\n.*?Subir vídeo\n\s*</button>', re.DOTALL)
content = pattern.sub(btn_code, content)

# render error
if '{uploadError && <div style={{ color: "#c62828" }}>{uploadError}</div>}' not in content:
     content = content.replace('</div>\n        <input type="file" ref={fileInputRef}', '</div>\n        {uploadError && <div style={{ color: "#c62828", fontSize: "13px", padding: "10px", background: "#ffebee", borderRadius: "4px", marginTop: "10px" }}>{uploadError}</div>}\n        <input type="file" ref={fileInputRef}')

with open('src/main.tsx', 'w') as f:
    f.write(content)
