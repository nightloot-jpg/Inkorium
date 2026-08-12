import { useRef, useState } from 'react';
import { BarChart3, Camera, FileText, Globe2, Loader2, MoreHorizontal, Music2, Video, X } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';

interface Props {
  isLoading: boolean;
  onSubmit: (content: string, type: string, photos: File[]) => void;
}

export function PostComposer({ isLoading, onSubmit }: Props) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const name = user?.user_metadata?.full_name?.split(' ')[0] || 'Usuario';
  const avatar = user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.user_metadata?.full_name || 'User')}`;

  const submit = () => {
    const text = content.trim();
    if (!text && photos.length === 0) return;
    onSubmit(text, photos.length ? 'photo' : 'text', photos);
    setContent('');
    setPhotos([]);
    if (inputRef.current) inputRef.current.value = '';
  };

  const addPhotos = (files: FileList | null) => {
    if (!files) return;
    const images = Array.from(files).filter((file) => file.type.startsWith('image/')).slice(0, 4 - photos.length);
    if (images.length) setPhotos((current) => [...current, ...images]);
  };

  return (
    <section className="feed-card">
      <div className="feed-composer-top">
        <img src={avatar} alt="" className="feed-avatar" />
        <textarea value={content} onChange={(event) => setContent(event.target.value)} rows={2} placeholder={`¿Qué estás pensando, ${name}?`} className="feed-composer-input" />
      </div>

      {photos.length > 0 && (
        <div className="feed-photo-preview">
          {photos.map((photo, index) => (
            <div key={`${photo.name}-${index}`} className="relative aspect-square overflow-hidden">
              <img src={URL.createObjectURL(photo)} alt="" className="h-full w-full object-cover" />
              <button type="button" onClick={() => setPhotos((current) => current.filter((_, i) => i !== index))} className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-white" aria-label="Quitar foto"><X size={14} /></button>
            </div>
          ))}
        </div>
      )}

      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(event) => addPhotos(event.target.files)} />
      <div className="feed-composer-actions">
        <Action icon={<FileText size={18} />} label="Estado" />
        <Action icon={<Camera size={18} />} label="Foto" onClick={() => inputRef.current?.click()} />
        <Action icon={<Video size={18} />} label="Vídeo" />
        <Action icon={<Music2 size={18} />} label="Música" />
        <Action icon={<BarChart3 size={18} />} label="Encuesta" />
        <Action icon={<FileText size={18} />} label="Noticia" />
        <Action icon={<MoreHorizontal size={18} />} label="Más" />
      </div>
      <div className="feed-composer-bottom">
        <button type="button" className="flex items-center gap-2 text-sm text-[#667484]"><Globe2 size={17} />Público <MoreHorizontal size={14} /></button>
        <button type="button" onClick={submit} disabled={isLoading || (!content.trim() && photos.length === 0)} className="feed-publish">{isLoading ? <Loader2 size={18} className="mx-auto animate-spin" /> : 'Publicar'}</button>
      </div>
    </section>
  );
}

function Action({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return <button type="button" onClick={onClick} className="feed-action">{icon}{label}</button>;
}
