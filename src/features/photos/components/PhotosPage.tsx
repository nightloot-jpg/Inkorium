import { useMemo, useRef, useState } from 'react';
import { Camera, ChevronLeft, ChevronRight, Heart, ImagePlus, Loader2, MessageCircle, X } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '../../../hooks/useAuth';
import { usePhotos } from '../hooks/usePhotos';

type Photo = {
  id: string;
  url: string;
  caption: string | null;
  created_at: string;
  user_id: string;
  post_id: string;
  profiles?: { full_name?: string | null; username?: string | null; avatar_url?: string | null } | null;
};

export function PhotosPage() {
  const { user } = useAuth();
  const { data, isPending, isError, upload } = usePhotos();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [caption, setCaption] = useState('');

  const photos = useMemo(() => (data ?? []) as Photo[], [data]);
  const selectedPhoto = selected === null ? null : photos[selected];
  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.username || 'Usuario';
  const avatar = user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}`;

  const submitPhoto = async (file: File) => {
    const formData = new FormData();
    formData.set('photo', file);
    formData.set('caption', caption);
    await upload.mutateAsync(formData);
    setCaption('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const move = (direction: -1 | 1) => {
    if (selected === null || photos.length === 0) return;
    setSelected((selected + direction + photos.length) % photos.length);
  };

  return (
    <div className="space-y-4">
      <section className="overflow-hidden border border-[#dfe5ec] bg-white shadow-sm">
        <div className="border-b border-[#e7ebf0] bg-[#f7f9fb] px-5 py-4">
          <div className="flex items-center gap-3">
            <Camera size={20} className="text-[#0057a8]" />
            <div>
              <h1 className="text-xl font-bold text-[#17233a]">Fotos</h1>
              <p className="text-xs text-[#6b778c]">Tus recuerdos, como un fotolog de los de antes.</p>
            </div>
          </div>
        </div>

        <div className="px-5 py-4">
          <div className="flex flex-col gap-3 rounded border border-[#dfe5ec] bg-[#fbfcfd] p-4 sm:flex-row sm:items-center">
            <img src={avatar} alt="" className="h-11 w-11 rounded-full object-cover" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-[#17233a]">{displayName}</p>
              <p className="text-xs text-[#6b778c]">Sube una foto y añade una pequeña historia.</p>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void submitPhoto(file);
              }}
            />
            <div className="flex gap-2">
              <input value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="Pie de foto..." className="h-9 min-w-0 border border-[#cfd7e2] bg-white px-3 text-xs outline-none focus:border-[#0057a8]" />
              <button type="button" onClick={() => inputRef.current?.click()} disabled={upload.isPending} className="inline-flex h-9 items-center gap-2 bg-[#0750a0] px-4 text-xs font-bold text-white hover:bg-[#06458f] disabled:opacity-60">
                {upload.isPending ? <Loader2 size={15} className="animate-spin" /> : <ImagePlus size={15} />}
                Subir foto
              </button>
            </div>
          </div>
          {upload.isError && <p className="mt-2 text-xs text-red-600">No se ha podido subir la foto. Inténtalo de nuevo.</p>}
        </div>
      </section>

      <section className="border border-[#dfe5ec] bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-[#e7ebf0] px-5 py-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wide text-[#52627a]">Álbum público</h2>
            <p className="mt-0.5 text-xs text-[#8a95a5]">{photos.length} fotos</p>
          </div>
          <span className="text-xs text-[#8a95a5]">Más recientes primero</span>
        </div>

        {isPending ? (
          <div className="flex min-h-64 items-center justify-center"><Loader2 className="animate-spin text-[#0057a8]" /></div>
        ) : isError ? (
          <div className="flex min-h-64 items-center justify-center px-5 text-center text-sm text-red-600">No se han podido cargar las fotos.</div>
        ) : photos.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
            <Camera size={36} className="text-[#aeb8c5]" />
            <p className="mt-3 text-sm font-bold text-[#52627a]">Todavía no hay fotos</p>
            <p className="mt-1 text-xs text-[#8a95a5]">Sube la primera y empieza tu fotolog.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-px bg-[#e1e6ec] sm:grid-cols-3 md:grid-cols-4">
            {photos.map((photo, index) => {
              const author = photo.profiles?.full_name || photo.profiles?.username || 'Usuario';
              return (
                <button key={photo.id} type="button" onClick={() => setSelected(index)} className="group relative aspect-square overflow-hidden bg-[#edf1f5] text-left">
                  <img src={photo.url} alt={photo.caption || 'Foto'} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-3 pt-8 opacity-0 transition group-hover:opacity-100">
                    <p className="truncate text-xs font-bold text-white">{author}</p>
                    {photo.caption && <p className="truncate text-[11px] text-white/85">{photo.caption}</p>}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {selectedPhoto && selected !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" role="dialog" aria-modal="true">
          <button type="button" onClick={() => setSelected(null)} className="absolute right-5 top-5 rounded-full bg-black/50 p-2 text-white hover:bg-black/70" aria-label="Cerrar"><X size={22} /></button>
          <button type="button" onClick={() => move(-1)} className="absolute left-3 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 sm:left-6" aria-label="Foto anterior"><ChevronLeft size={24} /></button>
          <div className="max-h-[92vh] w-full max-w-4xl overflow-hidden bg-white shadow-2xl">
            <div className="grid max-h-[92vh] md:grid-cols-[minmax(0,1fr)_280px]">
              <div className="flex min-h-[55vh] items-center justify-center bg-[#111] p-3">
                <img src={selectedPhoto.url} alt={selectedPhoto.caption || 'Foto ampliada'} className="max-h-[82vh] max-w-full object-contain" />
              </div>
              <aside className="flex flex-col bg-white p-5">
                <div className="flex items-center gap-3">
                  <img src={selectedPhoto.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedPhoto.profiles?.full_name || 'Usuario')}`} alt="" className="h-10 w-10 rounded-full object-cover" />
                  <div><p className="text-sm font-bold text-[#17233a]">{selectedPhoto.profiles?.full_name || selectedPhoto.profiles?.username || 'Usuario'}</p><p className="text-[11px] text-[#8a95a5]">{format(new Date(selectedPhoto.created_at), "d 'de' MMMM 'de' yyyy", { locale: es })}</p></div>
                </div>
                <div className="mt-5 flex-1">
                  <p className="whitespace-pre-wrap text-sm leading-6 text-[#334158]">{selectedPhoto.caption || 'Sin pie de foto.'}</p>
                </div>
                <div className="flex items-center gap-5 border-t border-[#edf0f4] pt-4 text-xs text-[#6b778c]"><span className="inline-flex items-center gap-1"><Heart size={15} /> Me gusta</span><span className="inline-flex items-center gap-1"><MessageCircle size={15} /> Comentar</span></div>
              </aside>
            </div>
          </div>
          <button type="button" onClick={() => move(1)} className="absolute right-3 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 sm:right-6" aria-label="Foto siguiente"><ChevronRight size={24} /></button>
        </div>
      )}
    </div>
  );
}
