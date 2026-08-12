import { createFileRoute, Link } from '@tanstack/react-router';
import { CalendarDays, MapPin, Music2, Users } from 'lucide-react';

const events = [
  { title: 'Concierto Indie en Madrid', date: 'Viernes, 24 de Mayo · 21:00', place: 'Sala La Riviera', attendees: 128 },
  { title: 'Noche Inkorium', date: 'Sábado, 31 de Mayo · 20:30', place: 'Madrid', attendees: 74 },
  { title: 'Festival de Música', date: 'Domingo, 8 de Junio · 18:00', place: 'Matadero Madrid', attendees: 256 },
];

export const Route = createFileRoute('/_protected/events')({
  component: EventsPage,
});

function EventsPage() {
  return (
    <div className="space-y-4">
      <section className="border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-700">
            <CalendarDays size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Eventos</h1>
            <p className="mt-1 text-sm text-slate-500">Descubre eventos y actividades que pueden interesarte.</p>
          </div>
        </div>
      </section>

      <section className="border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
          <Music2 size={18} className="text-blue-700" />
          <h2 className="font-bold text-slate-800">Próximos eventos</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {events.map((event) => (
            <article key={event.title} className="flex items-center gap-4 px-5 py-4">
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded bg-slate-100 text-center text-xs font-semibold text-slate-500">EVENTO</div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-blue-700">{event.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{event.date}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><MapPin size={13} />{event.place}</p>
              </div>
              <div className="hidden items-center gap-1 text-xs text-slate-500 sm:flex"><Users size={14} /> {event.attendees}</div>
              <button type="button" className="rounded-full border border-blue-600 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50">Me interesa</button>
            </article>
          ))}
        </div>
      </section>

      <Link to="/feed" className="inline-block text-sm font-semibold text-blue-700 hover:underline">← Volver a Novedades</Link>
    </div>
  );
}
