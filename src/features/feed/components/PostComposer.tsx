import { useRef, useState } from 'react';
import { BarChart3, Camera, FileText, Globe2, Link2, Loader2, MoreHorizontal, Music2, Video, X } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';

export function PostComposer({
  onSubmit,
  isLoading,
}: {
  onSubmit: (content: string, type: string, photos: File[]) => void;
  isLoading: boolean;
}) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const name = user?.user_metadata?.full_name?.split(' ')[0] || 'Usuario';
  const avatar = user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.user_metadata?.full_name || 'User')}`;

  const submit = () => {
    if (!content.trim() && photos.length === 0) return;
    onSubmit(content.trim(), 'text', photos);
    setContent('');
    setPhotos([]);
  };

  return (
    <section className="overflow-hidden rounded-[3px] border border-[#d9e1ea] bg-white shadow-[0_1px_4px_rgba(27,48,76,.06)]">
      <div className="flex items-start gap-4 p-5">
        <img src={avatar} alt={name} className="h-12 w-12 shrink-0 rounded-full object-cover" />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={2}
          placeholder={`¿Qué estás pensando, ${name}?`}
          className="min-h-[60px] flex-1 resize-none rounded-[2px] border border-[#d7dfe8] px-4 py-3 text-[15px] text-[#26364d] outline-none placeholder:text-[#8795a8] focus:border-[#77a2d5]"
        />
      </div>

      {photos.length > 0 && (
        <div className="grid grid-cols-4 gap-2 px-5 pb-4">
          {photos.map((photo, index) => (
            <div key={`${photo.name}-${index}`} className="relative aspect-square overflow-hidden bg-[#eef2f6]">
              <img src={URL.createObjectURL(photo)} alt="" className="h-full w-full object-cover" />
              <button type="button" onClick={() => setPhotos((items) => items.filter((_, i) => i !== index))} className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"><X size={13} /></button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center border-t border-[#edf0f4] px-3">
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files && setPhotos((items) => [...items, ...Array.from(e.target.files!)].slice(0, 4))} />
        <Action icon={<FileText size={18} />} label="Estado" />
        <Action icon={<Camera size={18} />} label="Foto" onClick={() => inputRef.current?.click()} />
        <Action icon={<Video size={18} />} label="Vídeo" />
        <Action icon={<Music2 size={18} />} label="Música" />
        <Action icon={<BarChart3 size={18} />} label="Encuesta" />
        <Action icon={<FileText size={18} />} label="Noticia" />
        <Action icon={<MoreHorizontal size={18} />} label="Más" />
      </div>

      <div className="flex items-center justify-end gap-4 border-t border-[#edf0f4] px-5 py-3">
        <button type="button" className="flex items-center gap-2 text-sm font-medium text-[#64758b] hover:text-[#285b98]"><Globe2 size={17} />Público<MoreHorizontal size={14} /></button>
        <button type="button" onClick={submit} disabled={isLoading || (!content.trim() && photos.length === 0)} className="min-w-[112px] rounded-[3px] bg-[#6c9fe3] px-7 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#5e91d5] disabled:cursor-not-allowed disabled:opacity-45">
          {isLoading ? <Loader2 size={18} className="mx-auto animate-spin" /> : 'Publicar'}
        </button>
      </div>
    </section>
  );
}

function Action({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return <button type="button" onClick={onClick} className="flex items-center gap-2 px-3.5 py-3.5 text-sm font-medium text-[#33445b] hover:bg-[#f5f7fa]">{icon}{label}</button>;
}
