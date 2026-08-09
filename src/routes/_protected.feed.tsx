import { createFileRoute } from '@tanstack/react-router';
import { BarChart3, Camera, Heart, Link2, MessageCircle, MoreHorizontal, Share2, StickyNote, Video } from 'lucide-react';

export const Route = createFileRoute('/_protected/feed')({
  component: Feed,
});

const avatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=96&q=80';
const maria = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=96&q=80';

const activity = [
  ['📷', 'Andrés subió 6 fotos al álbum', 'Concierto en La Riviera', 'Hace 8 minutos'],
  ['👩🏻', 'Laura cambió su foto de perfil', '', 'Hace 20 minutos'],
  ['🗓️', 'Carlos asistirá al evento', 'Fiesta Universitaria 2024', 'Hace 27 minutos'],
  ['💬', 'María publicó una nota', '“A veces, las mejores cosas pasan…”', 'Hace 35 minutos'],
  ['👥', 'David ahora es amigo de Pablo', '', 'Hace 42 minutos'],
  ['🎵', 'Ana escuchó una canción', 'Arctic Monkeys – Do I Wanna Know?', 'Hace 1 hora'],
];

const inklogs = [
  ['Andrés', '10 min', 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=240&q=80'],
  ['Laura', '30 min', 'https://images.unsplash.com/photo-1520201163981-8cc95007dd2b?auto=format&fit=crop&w=240&q=80'],
  ['Carlos', '1 h', 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=240&q=80'],
  ['María', '2 h', 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=240&q=80'],
  ['David', '3 h', 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=240&q=80'],
  ['Ana', '4 h', 'https://images.unsplash.com/photo-1470214304380-aadaedcfff1b?auto=format&fit=crop&w=240&q=80'],
];

const postPhotos = [
  'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=640&q=80',
  'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=640&q=80',
  'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=640&q=80',
  'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&w=640&q=80',
];

function Feed() {
  return (
    <div className="mx-auto max-w-[770px] space-y-4">
      <section className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
        <div className="flex gap-3 p-5 pb-4">
          <img className="h-12 w-12 rounded-full object-cover" src={avatar} alt="Andrés García" />
          <button className="flex-1 rounded-lg border border-slate-100 px-4 text-left text-sm text-slate-500 shadow-inner transition hover:bg-slate-50">¿Qué estás pensando, Andrés?</button>
        </div>
        <div className="grid grid-cols-3 border-t border-slate-100 sm:grid-cols-6">
          <ComposerAction icon={Camera} label="Foto" />
          <ComposerAction icon={Video} label="Vídeo" />
          <ComposerAction icon={StickyNote} label="Nota" />
          <ComposerAction icon={BarChart3} label="Encuesta" accent />
          <ComposerAction icon={Link2} label="Enlace" />
          <ComposerAction icon={MoreHorizontal} label="Más" />
        </div>
        <div className="border-t border-slate-100 px-5 py-3 text-right"><button className="rounded-md bg-[#1263e9] px-6 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#0759d6]">Publicar</button></div>
      </section>

      <section className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between"><h2 className="text-sm font-extrabold uppercase">Actividad reciente</h2><button className="text-sm font-semibold text-[#0759d6]">Ver toda la actividad</button></div>
        <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
          {activity.map(([icon, action, detail, time]) => (
            <div key={action} className="flex min-w-0 gap-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#f0f5ff] text-base">{icon}</span>
              <div className="min-w-0 text-sm"><p className="font-semibold text-slate-800">{action}</p>{detail && <p className="truncate font-medium text-[#0759d6]">{detail}</p>}<p className="text-xs text-slate-500">{time}</p></div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between"><h2 className="text-sm font-extrabold uppercase">Inklog de tus amigos</h2><button className="text-sm font-semibold text-[#0759d6]">Ver todos los inklogs</button></div>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {inklogs.map(([name, time, photo]) => (
            <button key={name} className="min-w-0 text-left">
              <img className="aspect-square w-full rounded-md object-cover shadow-sm" src={photo} alt={'Inklog de ' + name} />
              <p className="mt-2 truncate text-sm font-bold">{name}</p><p className="text-xs text-slate-500">{time}</p>
            </button>
          ))}
        </div>
      </section>

      <article className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
        <header className="flex items-center gap-3 px-5 pt-5">
          <img className="h-11 w-11 rounded-full object-cover" src={maria} alt="María López" />
          <div className="flex-1"><p className="text-sm font-bold">María López</p><p className="text-xs text-slate-500">Ayer a las 22:45 · 🌐</p></div>
          <button className="rounded-lg p-2 text-slate-600 hover:bg-slate-100" aria-label="Más opciones"><MoreHorizontal size={20} /></button>
        </header>
        <div className="px-5 py-4 text-sm leading-6"><p>Noche increíble en el concierto de <span className="font-semibold text-[#0759d6]">@TheWaves</span> 🔥</p><p>La energía del público era brutal, ¡para repetir! ✨</p><p className="font-medium text-[#0759d6]">#TheWaves #Concierto #Madrid #Inkorium</p></div>
        <div className="grid grid-cols-2 gap-1 px-5 sm:grid-cols-4">
          {postPhotos.map((photo, index) => <div className="relative aspect-square overflow-hidden rounded-md" key={photo}><img className="h-full w-full object-cover" src={photo} alt="" />{index === 3 && <div className="absolute inset-0 grid place-items-center bg-slate-950/55 text-2xl font-bold text-white">+3</div>}</div>)}
        </div>
        <div className="mx-5 mt-4 flex items-center justify-between border-b border-slate-100 pb-3 text-xs text-slate-500"><span>👍 ♥ 134</span><span>12 comentarios · 4 compartidos</span></div>
        <div className="grid grid-cols-3 px-3 py-2"><PostAction icon={Heart} label="Me gusta" /><PostAction icon={MessageCircle} label="Comentar" /><PostAction icon={Share2} label="Compartir" /></div>
      </article>
    </div>
  );
}

function ComposerAction({ icon: Icon, label, accent = false }: { icon: typeof Camera; label: string; accent?: boolean }) {
  return <button className="flex items-center justify-center gap-2 px-2 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"><Icon size={18} className={accent ? 'text-green-600' : 'text-slate-700'} />{label}</button>;
}

function PostAction({ icon: Icon, label }: { icon: typeof Heart; label: string }) {
  return <button className="flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"><Icon size={18} />{label}</button>;
}
