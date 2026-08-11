import { useRef, useState } from 'react';
import { BarChart3, Camera, FileText, Loader2, MoreHorizontal, Music2, Video, X } from 'lucide-react';
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
    <section className="overflow-hidden rounded-[3px] border border-[#dfe4ea] bg-white shadow-[0_1px_5px_rgba(0,0,0,.05)]">
      <div className="flex items-center gap-4 px-5 py-5">
        <img src={avatar} alt={name} className="h-14 w-14 shrink-0 rounded-full object-cover" />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={2}
          placeholder={`¿Qué estás pensando, ${name}?`}
          className="h-[60px] flex-1 resize-none rounded-[2px] border border-[#d5dce4] px-4 py-4 text-[15px] text-[#24354b] outline-none placeholder:text-[#8997a9] focus:border-[#7aa4d8]"
        />
      </div>

      {photos.length > 0 && (
        <div className="grid grid-cols-4 gap-2 px-5 pb-4">
          {photos.map((photo, index) => (
            <div key={`${photo.name}-${index}`} className="relative aspect-square overflow-hidden bg-[#edf1f5]">
              <img src={URL.createObjectURL(photo)} alt="" className="h-full w-full object-cover" />
              <button type="button" onClick={() => setPhotos((items) => items.filter((_, i) => i !== index))} className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"><X size={13} /></button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center border-t border-[#e7ebef] px-3">
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files && setPhotos((items) => [...items, ...Array.from(e.target.files!)].slice(0, 4))} />
        <Action icon={<FileText size={19} />} label="Estado" />
        <Action icon={<Camera size={19} />} label="Foto" onClick={() => inputRef.current?.click()} />
        <Action icon={<Video size={19} />} label="Vídeo" />
        <Action icon={<Music2 size={19} />} label="Música" />
        <Action icon={<BarChart3 size={19} />} label="Encuesta" />
        <Action icon={<MoreHorizontal size={19} />} label="Más" />
      </div>

      <div className="flex items-center justify-end border-t border-[#edf0f3] px-5 py-3">
        <button type="button" onClick={submit} disabled={isLoading || (!content.trim() && photos.length === 0)} className="rounded-[3px] bg-[#6c9fe3] px-8 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#5d91d6] disabled:cursor-not-allowed disabled:opacity-45">
          {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Publicar'}
        </button>
      </div>
    </section>
  );
}

function Action({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return <button type="button" onClick={onClick} className="flex items-center gap-2 px-4 py-3.5 text-sm font-medium text-[#34445a] hover:bg-[#f5f7fa]">{icon}{label}</button>;
}
