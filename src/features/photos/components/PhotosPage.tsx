import { useMemo, useRef, useState } from 'react';
import { Camera, ChevronLeft, ChevronRight, Heart, ImagePlus, Loader2, MessageCircle, Upload, X } from 'lucide-react';
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
    if (!file.type.startsWith('image/')) return;
    if (file.size > 10 * 1024 * 1024) return;

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
    <div className="space-y-5">
      <section className="overflow-hidden rounded-sm border border-[#dfe5ec] bg-white shadow-sm">
        <div className="relative overflow-hidden bg-gradient-to-r from-[#082b57] via-[#0750a0] to-[#1674c9] px-6 py-8 text-white sm:px-8">
          <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-white/10" />
          <div className="absolute -bottom-24 right-28 h-64 w-64 rounded-full bg-white/5" />
          <div className="relative flex items-end justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white/15 ring-1 ring-white/25">
                <Camera size={28} />
              </div>
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-blue-100">Inkorium · Recuerdos</p>
                <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Fotos</h1>
                <p className="mt-1 text-sm text-blue-100">Momentos, personas y pequeñas historias en un solo lugar.</p>
              </div>
            </div>
            <div className="hidden text-right sm:block">
              <p className="text-3xl font-extrabold">{photos.length}</p>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-100">fotos públicas</p>
            </div>
          </div>
        </div>

        <div className="border-t border-[#e7ebf0] p-5 sm:p-6">
          <div className="flex flex-col gap-4 rounded-sm border border-[#dfe5ec] bg-[#f7f9fb] p-4 sm:flex-row sm:items-center">
            <img src={avatar} alt="" className="h-12 w-12 rounded-full object-cover ring-2 ring-white" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-[#17233a]">{displayName}</p>
              <p className="mt-1 text-xs text-[#6b778c]">Comparte una foto y deja una pequeña historia para acompañarla.</p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[330px]">
              <div className="flex gap-2">
                <input value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="Pie de foto..." className="h-10 min-w-0 flex-1 border border-[#cfd7e2] bg-white px-3 text-xs text-[#334158] outline-none focus:border-[#0750a0]" />
                <button type="button" onClick={() => inputRef.current?.click()} disabled={upload.isPending} className="inline-flex h-10 items-center gap-2 bg-[#0750a0] px-4 text-xs font-bold text-white transition hover:bg-[#06458f] disabled:cursor-not-allowed disabled:opacity-60">
                  {upload.isPending ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                  Subir foto
                </button>
              </div>
              <p className="text-[10px] text-[#8a95a5]">JPG, PNG, GIF o WebP · máximo 10 MB</p>
            </div>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void submitPhoto(file);
            }}
          />
          {upload.isError && <p className="mt-3 text-xs font-semibold text-red-600">No se ha podido subir la foto. Revisa el archivo e inténtalo de nuevo.</p>}
        </div>
      </section>

      <section className="border border-[#dfe5ec] bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-[#e7ebf0] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#0750a0]">Galería</p>
            <h2 className="mt-1 text-lg font-extrabold text-[#17233a]">Álbum público</h2>
            <p className="mt-1 text-xs text-[#6b778c]">Las fotografías más recientes aparecen primero.</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#6b778c]">
            <span className="rounded-full bg-[#eef3f8] px-3 py-1.5">{photos.length} recuerdos</span>
            <span className="rounded-full bg-[#eef3f8] px-3 py-1.5">Público</span>
          </div>
        </div>

        {isPending ? (
          <div className="flex min-h-72 items-center justify-center"><Loader2 className="animate-spin text-[#0750a0]" /></div>
        ) : isError ? (
          <div className="flex min-h-72 flex-col items-center justify-center px-5 text-center">
            <Camera size={32} className="text-[#aeb8c5]" />
            <p className="mt-3 text-sm font-bold text-red-600">No se han podido cargar las fotos.</p>
            <p className="mt-1 max-w-md text-xs text-[#8a95a5]">El álbum no ha podido recuperar las fotografías. Puedes volver a intentarlo recargando la página.</p>
          </div>
        ) : photos.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center px-5 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-[#eef3f8] text-[#0750a0]"><ImagePlus size={28} /></div>
            <p className="mt-4 text-sm font-bold text-[#52627a]">Todavía no hay fotos</p>
            <p className="mt-1 max-w-sm text-xs text-[#8a95a5]">Sube la primera fotografía y empieza a construir tu álbum.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1 bg-[#e1e6ec] sm:grid-cols-3 md:grid-cols-4">
            {photos.map((photo, index) => {
              const author = photo.profiles?.full_name || photo.profiles?.username || 'Usuario';
              const featured = index === 0;
              return (
                <button key={photo.id} type="button" onClick={() => setSelected(index)} className={`group relative overflow-hidden bg-[#edf1f5] text-left ${featured ? 'col-span-2 row-span-2 aspect-square' : 'aspect-square'}`}>
                  <img src={photo.url} alt={photo.caption || 'Foto'} loading={index < 6 ? 'eager' : 'lazy'} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.035]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/0 to-transparent opacity-0 transition group-hover:opacity-100" />
                  <div className="absolute inset-x-0 bottom-0 translate-y-2 px-4 pb-4 opacity-0 transition duration-200 group-hover:translate-y-0 group-hover:opacity-100">
                    <p className="truncate text-xs font-bold text-white">{author}</p>
                    {photo.caption && <p className="mt-1 truncate text-[11px] text-white/85">{photo.caption}</p>}
                  </div>
                  {featured && <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[#0750a0]">Más reciente</span>}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {selectedPhoto && selected !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#06111f]/90 p-3 sm:p-6" role="dialog" aria-modal="true">
          <button type="button" onClick={() => setSelected(null)} className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20" aria-label="Cerrar"><X size={22} /></button>
          <button type="button" onClick={() => move(-1)} className="absolute left-3 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 sm:left-6" aria-label="Foto anterior"><ChevronLeft size={26} /></button>
          <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-sm bg-white shadow-2xl">
            <div className="grid max-h-[92vh] md:grid-cols-[minmax(0,1fr)_300px]">
              <div className="flex min-h-[58vh] items-center justify-center bg-[#0c1622] p-4">
                <img src={selectedPhoto.url} alt={selectedPhoto.caption || 'Foto ampliada'} className="max-h-[84vh] max-w-full object-contain" />
              </div>
              <aside className="flex flex-col bg-white p-5 sm:p-6">
                <div className="flex items-center gap-3 border-b border-[#edf0f4] pb-4">
                  <img src={selectedPhoto.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedPhoto.profiles?.full_name || 'Usuario')}`} alt="" className="h-10 w-10 rounded-full object-cover" />
                  <div className="min-w-0"><p className="truncate text-sm font-bold text-[#17233a]">{selectedPhoto.profiles?.full_name || selectedPhoto.profiles?.username || 'Usuario'}</p><p className="text-[11px] text-[#8a95a5]">{format(new Date(selectedPhoto.created_at), "d 'de' MMMM 'de' yyyy", { locale: es })}</p></div>
                </div>
                <div className="mt-5 flex-1">
                  <p className="whitespace-pre-wrap text-sm leading-6 text-[#334158]">{selectedPhoto.caption || 'Sin pie de foto.'}</p>
                </div>
                <div className="flex items-center gap-5 border-t border-[#edf0f4] pt-4 text-xs font-semibold text-[#6b778c]"><span className="inline-flex items-center gap-1"><Heart size={15} /> Me gusta</span><span className="inline-flex items-center gap-1"><MessageCircle size={15} /> Comentar</span></div>
              </aside>
            </div>
          </div>
          <button type="button" onClick={() => move(1)} className="absolute right-3 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 sm:right-6" aria-label="Foto siguiente"><ChevronRight size={26} /></button>
        </div>
      )}
    </div>
  );
}
