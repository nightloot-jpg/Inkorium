import { CalendarDays, Clock3, MapPin, Sparkles, Ticket, Users } from 'lucide-react';
import './events-page.css';

type Props = {
  username: string;
};

type EventCard = {
  id: string;
  title: string;
  dateLabel: string;
  timeLabel: string;
  place: string;
  city: string;
  attendees: string;
  mood: string;
  accent: string;
  description: string;
  category: string;
  featured?: boolean;
};

const FEATURED_EVENT: EventCard = {
  id: 'ink-summer-night',
  title: 'Inkorium Summer Night',
  dateLabel: 'Sábado 12 de septiembre',
  timeLabel: '20:30',
  place: 'La Riviera Social Club',
  city: 'Madrid',
  attendees: '214 asistentes',
  mood: 'Música, fotos y gente nueva',
  accent: 'sunset',
  description: 'Una noche pensada para conocer gente, escuchar sesiones en directo y llenar el perfil de recuerdos bonitos.',
  category: 'Destacado',
  featured: true,
};

const UPCOMING_EVENTS: EventCard[] = [
  {
    id: 'acoustic-rooftop',
    title: 'Acoustic Rooftop Session',
    dateLabel: 'Viernes 18 de septiembre',
    timeLabel: '19:00',
    place: 'Terraza Prisma',
    city: 'Barcelona',
    attendees: '58 asistentes',
    mood: 'Atardecer + acústicos',
    accent: 'sky',
    description: 'Conciertos íntimos, mocktails y un ambiente suave para charlar sin prisa.',
    category: 'Música',
  },
  {
    id: 'photo-walk',
    title: 'Photo Walk Inkorium',
    dateLabel: 'Domingo 20 de septiembre',
    timeLabel: '11:30',
    place: 'Malasaña & Conde Duque',
    city: 'Madrid',
    attendees: '41 asistentes',
    mood: 'Cámara en mano',
    accent: 'mint',
    description: 'Ruta creativa para sacar fotos, descubrir rincones y luego compartirlas en la comunidad.',
    category: 'Fotos',
  },
  {
    id: 'retro-meetup',
    title: 'Retro Profile Meetup',
    dateLabel: 'Jueves 24 de septiembre',
    timeLabel: '18:45',
    place: 'Café Pixel',
    city: 'Valencia',
    attendees: '73 asistentes',
    mood: 'Nostalgia web 2000s',
    accent: 'violet',
    description: 'Quedada para fans del estilo clásico de redes sociales, con juegos, firmas y sorteos.',
    category: 'Comunidad',
  },
  {
    id: 'night-market',
    title: 'Night Market Creativo',
    dateLabel: 'Sábado 26 de septiembre',
    timeLabel: '21:15',
    place: 'Patio de las Artes',
    city: 'Sevilla',
    attendees: '126 asistentes',
    mood: 'Arte, food stalls y DJ',
    accent: 'gold',
    description: 'Una mezcla de mercado nocturno, mini showcases y puntos para conocer a otros perfiles afines.',
    category: 'Planes',
  },
];

const QUICK_FILTERS = ['Esta semana', 'Música', 'Fotos', 'Quedadas', 'Cerca de ti'];

export function EventsPage({ username }: Props) {
  return (
    <section className="events-page">
      <header className="events-hero panel">
        <div className="events-hero-copy">
          <span className="events-kicker"><Sparkles size={14} /> Agenda social</span>
          <h1>Eventos para salir de la pantalla y encontrarnos fuera</h1>
          <p>
            {username}, aquí puedes descubrir planes con la estética y la vibra de Inkorium: música,
            quedadas, fotos y comunidad.
          </p>
          <div className="events-filters" aria-label="Filtros rápidos">
            {QUICK_FILTERS.map(filter => (
              <button key={filter} type="button">{filter}</button>
            ))}
          </div>
        </div>
        <div className="events-hero-card events-accent-sunset">
          <div className="events-hero-badge">Evento recomendado</div>
          <strong>{FEATURED_EVENT.title}</strong>
          <span>{FEATURED_EVENT.mood}</span>
          <div>
            <CalendarDays size={15} /> {FEATURED_EVENT.dateLabel}
          </div>
          <div>
            <MapPin size={15} /> {FEATURED_EVENT.place}, {FEATURED_EVENT.city}
          </div>
        </div>
      </header>

      <section className="events-highlight panel events-accent-sunset">
        <div className="events-highlight-main">
          <span className="events-section-label">{FEATURED_EVENT.category}</span>
          <h2>{FEATURED_EVENT.title}</h2>
          <p>{FEATURED_EVENT.description}</p>
          <div className="events-highlight-meta">
            <span><CalendarDays size={15} /> {FEATURED_EVENT.dateLabel}</span>
            <span><Clock3 size={15} /> {FEATURED_EVENT.timeLabel}</span>
            <span><MapPin size={15} /> {FEATURED_EVENT.city}</span>
            <span><Users size={15} /> {FEATURED_EVENT.attendees}</span>
          </div>
        </div>
        <div className="events-highlight-side">
          <div className="events-stat-card">
            <small>Ambiente</small>
            <strong>{FEATURED_EVENT.mood}</strong>
          </div>
          <div className="events-stat-card">
            <small>Entrada</small>
            <strong>Reserva gratis</strong>
          </div>
          <button type="button" className="events-primary-action"><Ticket size={16} /> Ver evento</button>
        </div>
      </section>

      <section className="events-grid">
        <div className="events-list panel">
          <div className="events-section-head">
            <div>
              <span className="events-section-label">Próximos</span>
              <h3>Planes que ya están moviéndose</h3>
            </div>
            <button type="button">Ver calendario</button>
          </div>
          <div className="events-cards">
            {UPCOMING_EVENTS.map(event => (
              <article key={event.id} className={`events-card events-accent-${event.accent}`}>
                <div className="events-card-top">
                  <span>{event.category}</span>
                  <small>{event.attendees}</small>
                </div>
                <h4>{event.title}</h4>
                <p>{event.description}</p>
                <div className="events-card-meta">
                  <span><CalendarDays size={14} /> {event.dateLabel}</span>
                  <span><Clock3 size={14} /> {event.timeLabel}</span>
                  <span><MapPin size={14} /> {event.place}</span>
                </div>
                <button type="button">Me interesa</button>
              </article>
            ))}
          </div>
        </div>

        <aside className="events-sidebar">
          <section className="panel events-side-card">
            <span className="events-section-label">Tu actividad</span>
            <h3>Lo que mejor te encaja</h3>
            <ul>
              <li>Música en directo y acústicos</li>
              <li>Quedadas para sacar fotos</li>
              <li>Planes sociales con grupos pequeños</li>
            </ul>
          </section>
          <section className="panel events-side-card">
            <span className="events-section-label">Ciudades activas</span>
            <div className="events-city-list">
              <button type="button"><strong>Madrid</strong><span>18 eventos</span></button>
              <button type="button"><strong>Barcelona</strong><span>11 eventos</span></button>
              <button type="button"><strong>Valencia</strong><span>7 eventos</span></button>
              <button type="button"><strong>Sevilla</strong><span>6 eventos</span></button>
            </div>
          </section>
        </aside>
      </section>
    </section>
  );
}
