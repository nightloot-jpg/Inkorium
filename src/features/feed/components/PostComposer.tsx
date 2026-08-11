import { useRef, useState } from 'react';
import { BarChart3, Camera, Link2, Loader2, MoreHorizontal, Music2, StickyNote, Video, X } from 'lucide-react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const name = user?.user_metadata?.full_name?.split(' ')[0] || 'Usuario';
  const avatar = user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.user_metadata?.full_name || 'User')}`;

  const handleSubmit = () => {
    if (!content.trim() && photos.length === 0) return;
    onSubmit(content, 'text', photos);
    setContent('');
    setPhotos([]);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setPhotos((current) => [...current, ...Array.from(event.target.files)].slice(0, 4));
    }
  };

  return (
    <section className="mb-4 overflow-hidden border border-[#d9e0e8] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      <div className="flex gap-4 p-5 pb-4">
        <img src={avatar} alt={name} className="h-14 w-14 shrink-0 rounded-full border border-[#dce2ea] object-cover" />
        <textarea
          rows={2}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder={`¿Qué estás pensando, ${name}?`}
          className="min-h-[60px] flex-1 resize-none rounded-sm border border-[#d4dce6] bg-white px-4 py-4 text-[15px] text-[#26364d] outline-none placeholder:text-[#8795a8] focus:border-[#5c91d0]"
        />
      </div>

      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-2 px-5 pb-4 sm:grid-cols-4">
          {photos.map((photo, index) => (
            <div key={`${photo.name}-${index}`} className="relative aspect-square overflow-hidden bg-slate-100">
              <img src={URL.createObjectURL(photo)} alt="" className="h-full w-full object-cover" />
              <button onClick={() => setPhotos((current) => current.filter((_, i) => i !== index))} className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center border-t border-[#e4e9ef] px-3 py-1">
        <input ref={fileInputRef} type="file" className="hidden" multiple accept="image/*" onChange={handleFileChange} />
        <ComposerAction icon={<StickyNote size={18} />} label="Estado" />
        <ComposerAction icon={<Camera size={18} />} label="Foto" onClick={() => fileInputRef.current?.click()} />
        <ComposerAction icon={<Video size={18} />} label="Vídeo" />
        <ComposerAction icon={<Music2 size={18} />} label="Música" />
        <ComposerAction icon={<BarChart3 size={18} />} label="Encuesta" />
        <ComposerAction icon={<MoreHorizontal size={18} />} label="Más" />
      </div>

      <div className="flex items-center justify-end border-t border-[#edf0f4] px-5 py-3">
        <button
          onClick={handleSubmit}
          disabled={(!content.trim() && photos.length === 0) || isLoading}
          className="min-w-[112px] rounded-sm bg-[#5b8fd4] px-7 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#4c80c5] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? <Loader2 size={18} className="mx-auto animate-spin" /> : 'Publicar'}
        </button>
      </div>
    </section>
  );
}

function ComposerAction({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-[#34445a] hover:bg-[#f5f7fa]">
      <span className="text-[#5f6f84]">{icon}</span>
      {label}
    </button>
  );
}
