import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Loader2, Upload, Video, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const MAX_SIZE = 200 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']);

type Props = { session: any; onUploaded?: () => void };

export function VideoUploader({ session, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  function selectFile(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    if (!selected) return;
    setError('');
    setSuccess('');
    if (!ALLOWED_TYPES.has(selected.type)) {
      setError('Formato no compatible. Usa MP4, WebM, OGG o MOV.');
      return;
    }
    if (selected.size > MAX_SIZE) {
      setError('El vídeo es demasiado grande. El máximo permitido es 200 MB.');
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    if (!title.trim()) setTitle(selected.name.replace(/\.[^.]+$/, ''));
  }

  function clearFile() {
    if (uploading) return;
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setFile(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  async function upload() {
    if (!file || uploading) return;
    const userId = session?.user?.id;
    if (!userId) { setError('Tu sesión ha caducado. Vuelve a iniciar sesión.'); return; }
    if (!title.trim()) { setError('Pon un título al vídeo.'); return; }
    setUploading(true); setError(''); setSuccess('');
    let path = '';
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'mp4';
      path = `${userId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('videos').upload(path, file, {
        cacheControl: '3600', upsert: false, contentType: file.type,
      });
      if (uploadError) throw new Error(uploadError.message || 'No se pudo subir el vídeo.');

      const { data: publicData } = supabase.storage.from('videos').getPublicUrl(path);
      const url = publicData.publicUrl;
      const { error: dbError } = await supabase.from('user_videos').insert({
        user_id: userId,
        youtube_video_id: null,
        title: title.trim(),
        thumbnail: null,
        channel: null,
        url,
        source: 'upload',
      });
      if (dbError) {
        await supabase.storage.from('videos').remove([path]);
        throw new Error(dbError.message || 'No se pudo guardar el vídeo.');
      }
      setSuccess('Vídeo subido correctamente.');
      clearFile();
      setTitle(''); setDescription('');
      onUploaded?.();
    } catch (caught) {
      console.error('[VIDEO_UPLOAD]', caught);
      setError(caught instanceof Error ? caught.message : 'No se pudo subir el vídeo.');
    } finally { setUploading(false); }
  }

  return <div className="ink-video-panel" style={{ padding: 18 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
      <Upload size={20} color="#0750A7" />
      <h2 style={{ margin: 0, color: '#1f2e40', fontSize: 21 }}>Subir vídeo</h2>
    </div>
    <p style={{ margin: '0 0 16px', color: '#718096', fontSize: 13 }}>Sube un vídeo desde tu dispositivo y guárdalo en tu colección de Inkorium.</p>

    {error && <div style={{ padding: 11, marginBottom: 12, borderRadius: 6, color: '#a52828', background: '#fff1f1', border: '1px solid #f0caca', fontSize: 13 }}>{error}</div>}
    {success && <div style={{ padding: 11, marginBottom: 12, borderRadius: 6, color: '#24613b', background: '#effaf2', border: '1px solid #ccebd5', fontSize: 13, display: 'flex', gap: 7, alignItems: 'center' }}><CheckCircle2 size={16} />{success}</div>}

    {!file ? <button type="button" onClick={() => inputRef.current?.click()} style={{ width: '100%', minHeight: 220, display: 'grid', placeItems: 'center', alignContent: 'center', gap: 9, border: '2px dashed #cbd7e4', borderRadius: 8, background: '#f8fbff', color: '#45617d', cursor: 'pointer' }}>
      <Video size={38} color="#0750A7" />
      <strong>Selecciona un vídeo</strong>
      <span style={{ fontSize: 13, color: '#7c8d9f' }}>MP4, WebM, OGG o MOV · máximo 200 MB</span>
    </button> : <>
      <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 8, background: '#0f1720', marginBottom: 14 }}>
        <video src={preview ?? ''} controls style={{ display: 'block', width: '100%', maxHeight: 430 }} />
        <button type="button" onClick={clearFile} disabled={uploading} aria-label="Quitar vídeo" style={{ position: 'absolute', top: 10, right: 10, width: 34, height: 34, border: 0, borderRadius: '50%', color: '#fff', background: 'rgba(0,0,0,.6)', cursor: 'pointer' }}><X size={18} /></button>
      </div>
      <label style={{ display: 'grid', gap: 6, color: '#1f2e40', fontSize: 13, fontWeight: 700 }}>Título<input value={title} onChange={e => setTitle(e.target.value)} maxLength={150} placeholder="Título del vídeo" style={{ height: 42, padding: '0 12px', border: '1px solid #d3dce6', borderRadius: 5, font: 'inherit', fontWeight: 400 }} /></label>
      <label style={{ display: 'grid', gap: 6, marginTop: 12, color: '#1f2e40', fontSize: 13, fontWeight: 700 }}>Descripción <span style={{ fontWeight: 400, color: '#718096' }}>(opcional)</span><textarea value={description} onChange={e => setDescription(e.target.value)} maxLength={1000} rows={3} placeholder="Cuéntanos algo sobre este vídeo..." style={{ padding: 10, border: '1px solid #d3dce6', borderRadius: 5, font: 'inherit', resize: 'vertical' }} /></label>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 9, marginTop: 14 }}><button type="button" onClick={clearFile} disabled={uploading} style={{ padding: '9px 14px', border: '1px solid #d3dce6', borderRadius: 5, background: '#fff', color: '#536b84', cursor: 'pointer' }}>Cancelar</button><button type="button" onClick={() => void upload()} disabled={uploading} style={{ minWidth: 120, padding: '9px 16px', border: 0, borderRadius: 5, background: '#0750A7', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>{uploading ? <Loader2 size={17} /> : 'Publicar vídeo'}</button></div>
    </>}
    <input ref={inputRef} type="file" accept="video/mp4,video/webm,video/ogg,video/quicktime" onChange={selectFile} style={{ display: 'none' }} />
  </div>;
}
