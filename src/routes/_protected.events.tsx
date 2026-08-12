import { createFileRoute, Link } from '@tanstack/react-router';
import { CalendarDays, Clock3, MapPin, Plus, Users } from 'lucide-react';

export const Route = createFileRoute('/_protected/events')({
  component: EventsPage,
});

const events = [
  { day: '24', month: 'MAY', title: 'Concierto Indie en Madrid', date: 'Viernes, 24 de mayo · 21:00', place: 'Sala La Riviera · Madrid', attendees: 128, description: 'Una noche de música indie con bandas locales y artistas invitados.' },
  { day: '25', month: 'MAY', title: 'Fiesta Universitaria', date: 'Sábado, 25 de mayo · 23:00', place: 'Sala Ink · Madrid', attendees: 86, description: 'Música, amigos y una noche para encontrarnos en Inkorium.' },
  { day: '26', month: 'MAY', title: 'Fotografía Urbana', date: 'Domingo, 26 de mayo · 17:00', place: 'Plaza de España · Madrid', attendees: 42, description: 'Paseo fotográfico abierto para descubrir rincones de la ciudad.' },
];

function EventsPage() {
  return (
    <div className="w-full space-y-4">
      <section className="border border-[#dfe5ec] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#6b778c]">Inkorium</p>
            <h1 className="mt-1 text-2xl font-bold text-[#17233a]">Eventos</h1>
            <p className="mt-1 text-sm text-[#6b778c]">Descubre qué está pasando y encuentra planes con tus amigos.</p>
          </div>
          <button type="button" className="inline-flex items-center gap-2 bg-[#0750a0] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#06458f]"><Plus size={17} /> Crear evento</button>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#dfe5ec] pb-2">
            <h2 className="text-sm font-bold uppercase tracking-wide text-[#526078]">Próximos eventos</h2>
            <span className="text-xs text-[#6b778c]">{events.length} eventos</span>
          </div>
          {events.map((event) => (
            <article key={event.title} className="border border-[#dfe5ec] bg-white shadow-sm">
              <div className="flex gap-4 p-4 sm:p-5">
                <div className="grid h-16 w-16 shrink-0 place-items-center border border-[#dfe5ec] bg-[#f4f7fa] text-center leading-none"><strong className="text-xl text-[#0750a0]">{event.day}</strong><span className="mt-1 text-[10px] font-bold text-[#6b778c]">{event.month}</span></div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-bold text-[#17233a]">{event.title}</h3>
                  <div className="mt-2 grid gap-1 text-xs text-[#6b778c] sm:grid-cols-2"><span className="inline-flex items-center gap-1.5"><Clock3 size={14} />{event.date}</span><span className="inline-flex items-center gap-1.5"><MapPin size={14} />{event.place}</span></div>
                  <p className="mt-3 text-sm leading-5 text-[#526078]">{event.description}</p>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6b778c]"><Users size={14} />{event.attendees} personas asistirán</span><button type="button" className="border border-[#4b82d2] px-3 py-1.5 text-xs font-bold text-[#0750a0] hover:bg-[#f2f6fb]">Me interesa</button></div>
                </div>
              </div>
            </article>
          ))}
        </div>

        <aside className="space-y-4">
          <section className="border border-[#dfe5ec] bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-2"><CalendarDays size={18} className="text-[#0750a0]" /><h2 className="text-sm font-bold uppercase tracking-wide text-[#526078]">Calendario</h2></div>
            <div className="flex items-center justify-between text-sm font-bold text-[#17233a]"><button type="button" aria-label="Mes anterior">‹</button><span>Mayo 2024</span><button type="button" aria-label="Mes siguiente">›</button></div>
            <div className="mt-4 grid grid-cols-7 gap-y-3 text-center text-[11px] text-[#6b778c]">
              {['Lu','Ma','Mi','Ju','Vi','Sa','Do'].map((day) => <span key={day} className="font-bold">{day}</span>)}
              {['29','30','1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','1','2'].map((day, index) => <span key={`${day}-${index}`} className={['24','25','26'].includes(day) && index >= 20 ? 'mx-auto grid h-6 w-6 place-items-center rounded-full bg-[#0750a0] font-bold text-white' : 'leading-6'}>{day}</span>)}
            </div>
          </section>

          <section className="border border-[#dfe5ec] bg-white p-4 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wide text-[#526078]">Mis eventos</h2>
            <div className="mt-3 space-y-2 text-sm"><Link to="/events" className="block border-l-2 border-[#0750a0] px-3 py-2 font-semibold text-[#0750a0]">A los que asistiré</Link><button type="button" className="block w-full px-3 py-2 text-left text-[#526078] hover:bg-[#f6f8fa]">Mis eventos creados</button><button type="button" className="block w-full px-3 py-2 text-left text-[#526078] hover:bg-[#f6f8fa]">Eventos pasados</button></div>
          </section>
        </aside>
      </section>
    </div>
  );
}
