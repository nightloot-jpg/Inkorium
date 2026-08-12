import { createFileRoute, Link } from '@tanstack/react-router';
import { MessageCircle, Search, UserPlus, Users } from 'lucide-react';

const friends = [
  { name: 'Amigo 1', status: 'Escuchando Spotify', online: true, image: 21 },
  { name: 'Amigo 2', status: 'Escuchando Spotify', online: true, image: 22 },
  { name: 'Amigo 3', status: 'Disponible', online: true, image: 23 },
  { name: 'Amigo 4', status: 'Hace 20 min', online: false, image: 24 },
];

export const Route = createFileRoute('/_protected/friends')({
  component: FriendsPage,
});

function FriendsPage() {
  return (
    <div className="space-y-4">
      <section className="border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-700"><Users size={24} /></div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Grupos</h1>
              <p className="mt-1 text-sm text-slate-500">Conecta con tus amigos y descubre personas en Inkorium.</p>
            </div>
          </div>
          <button type="button" className="hidden items-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white sm:flex"><UserPlus size={17} />Añadir amigo</button>
        </div>
        <div className="mt-5 flex items-center gap-2 border border-slate-200 px-3 py-2">
          <Search size={17} className="text-slate-400" />
          <input aria-label="Buscar amigos" placeholder="Buscar personas..." className="min-w-0 flex-1 text-sm outline-none" />
        </div>
      </section>

      <section className="border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="font-bold text-slate-800">Personas</h2>
          <span className="text-xs text-slate-500">{friends.length} contactos</span>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-2">
          {friends.map((friend) => (
            <article key={friend.name} className="flex items-center gap-3 border border-slate-200 p-3">
              <div className="relative shrink-0">
                <img src={`https://i.pravatar.cc/150?img=${friend.image}`} alt="" className="h-12 w-12 rounded-full object-cover" />
                <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${friend.online ? 'bg-green-500' : 'bg-slate-300'}`} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-bold text-slate-800">{friend.name}</h3>
                <p className="truncate text-xs text-slate-500">{friend.status}</p>
              </div>
              <button type="button" className="rounded-full p-2 text-slate-500 hover:bg-slate-100" aria-label={`Enviar mensaje a ${friend.name}`}><MessageCircle size={18} /></button>
            </article>
          ))}
        </div>
      </section>

      <Link to="/feed" className="inline-block text-sm font-semibold text-blue-700 hover:underline">← Volver a Novedades</Link>
    </div>
  );
}
