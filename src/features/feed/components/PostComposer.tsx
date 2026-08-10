import { useState, useEffect, useRef } from 'react';
import { Camera, Video, StickyNote, BarChart3, Link2, MoreHorizontal, X, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../../stores/authStore';

export function PostComposer({
 onSubmit, isLoading }: { onSubmit: (content: string, type: string, photos: File[]) => void, isLoading: boolean }) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);

  const user = useAuthStore(state => state.user);
  const [content, setContent] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (!content.trim() && photos.length === 0) return;
    onSubmit(content, 'text', photos);
    setContent('');
    setPhotos([]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newPhotos = Array.from(e.target.files);
      setPhotos(prev => [...prev, ...newPhotos].slice(0, 4)); // Limit to 4 for now in UI
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <section className="overflow-hidden rounded border border-slate-200 bg-white shadow-none mb-4">
      <div className="flex gap-3 p-4 pb-3">
        <img className="h-10 w-10 rounded-sm object-cover" src={(isMounted ? user?.user_metadata : null)?.avatar_url || `https://ui-avatars.com/api/?name=${(isMounted ? user?.user_metadata : null)?.full_name || 'User'}`} alt={(isMounted ? user?.user_metadata : null)?.full_name || 'User'} />
        <textarea
          className="flex-1 resize-none rounded-sm border border-slate-200 p-3 text-sm text-slate-700 shadow-none outline-none transition focus:border-[#233B5D] focus:ring-1 focus:ring-[#233B5D]"
          placeholder={`¿Qué estás pensando, ${(isMounted ? user?.user_metadata : null)?.full_name?.split(' ')[0] || ''}?`}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
        />
      </div>

      {photos.length > 0 && (
        <div className="px-5 pb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {photos.map((photo, i) => (
            <div key={i} className="relative aspect-square rounded-md overflow-hidden bg-slate-100">
              <img src={URL.createObjectURL(photo)} alt="" className="object-cover w-full h-full" />
              <button
                onClick={() => removePhoto(i)}
                className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-3 border-t border-slate-100 sm:grid-cols-6">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          multiple
          accept="image/*"
          onChange={handleFileChange}
        />
        <ComposerAction icon={Camera} label="Foto" onClick={() => fileInputRef.current?.click()} />
        <ComposerAction icon={Video} label="Vídeo" />
        <ComposerAction icon={StickyNote} label="Nota" />
        <ComposerAction icon={BarChart3} label="Encuesta" accent />
        <ComposerAction icon={Link2} label="Enlace" />
        <ComposerAction icon={MoreHorizontal} label="Más" />
      </div>
      <div className="border-t border-slate-100 px-5 py-3 text-right">
        <button
          onClick={handleSubmit}
          disabled={(!content.trim() && photos.length === 0) || isLoading}
          className="flex items-center justify-center ml-auto min-w-[100px] rounded-md bg-[#233B5D] px-6 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#1a2c45] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Publicar'}
        </button>
      </div>
    </section>
  );
}

function ComposerAction({ icon: Icon, label, accent = false, onClick }: { icon: typeof Camera; label: string; accent?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center justify-center gap-2 px-2 py-2.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100">
      <Icon size={18} className={accent ? 'text-green-600' : 'text-slate-700'} />
      {label}
    </button>
  );
}
