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
    if (!text && !photos.length) return;
    onSubmit(text, photos.length ? 'photo' : 'text', photos);
    setContent('');
    setPhotos([]);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <section className="overflow-hidden border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start gap-4 p-5">
        <img src={avatar} alt="" className="h-12 w-12 shrink-0 rounded-full border border-slate-200 object-cover" />
        <textarea value={content} onChange={(event) => setContent(event.target.value)} rows={2} placeholder={`¿Qué estás pensando, ${name}?`} className="min-h-14 min-w-0 flex-1 resize-none border border-slate-300 px-4 py-3 text-base outline-none placeholder:text-slate-400 focus:border-blue-500" />
      </div>
      {photos.length > 0 && <div className="grid grid-cols-2 gap-2 px-5 pb-4 sm:grid-cols-4">{photos.map((photo, index) => <div key={`${photo.name}-${index}`} className="relative aspect-square overflow-hidden bg-slate-100"><img src={URL.createObjectURL(photo)} alt="" className="h-full w-full object-cover" /><button type="button" onClick={() => setPhotos((items) => items.filter((_, i) => i !== index))} className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-white"><X size={14} /></button></div>)}</div>}
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(event) => { const files = Array.from(event.target.files ?? []).filter((file) => file.type.startsWith('image/')).slice(0, 4 - photos.length); if (files.length) setPhotos((items) => [...items, ...files]); }} />
      <div className="flex flex-wrap border-t border-slate-100 px-2">
        <Action icon={<FileText size={18} />} label="Estado" />
        <Action icon={<Camera size={18} />} label="Foto" onClick={() => inputRef.current?.click()} />
        <Action icon={<Video size={18} />} label="Vídeo" />
        <Action icon={<Music2 size={18} />} label="Música" />
        <Action icon={<BarChart3 size={18} />} label="Encuesta" />
        <Action icon={<FileText size={18} />} label="Noticia" />
        <Action icon={<MoreHorizontal size={18} />} label="Más" />
      </div>
      <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
        <button type="button" className="flex items-center gap-2 text-sm text-slate-600"><Globe2 size={17} />Público <MoreHorizontal size={14} /></button>
        <button type="button" onClick={submit} disabled={isLoading || (!content.trim() && !photos.length)} className="min-w-28 bg-[#5b8ed9] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#477cc8] disabled:cursor-not-allowed disabled:opacity-50">{isLoading ? <Loader2 size={18} className="mx-auto animate-spin" /> : 'Publicar'}</button>
      </div>
    </section>
  );
}

function Action({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return <button type="button" onClick={onClick} className="flex items-center gap-2 px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">{icon}{label}</button>;
}
