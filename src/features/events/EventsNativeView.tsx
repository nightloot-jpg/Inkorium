import React, { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, MapPin, Plus, Search, Users, X } from "lucide-react";
import "./events-native-2026.css";

type EventItem = {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  city: string;
  attendees: number;
  category: string;
  image?: string;
};

const seedEvents: EventItem[] = [
  { id: "1", title: "Concierto Streetwear", date: "2026-08-31", time: "20:00", location: "Sala Riviera", city: "Madrid", attendees: 124, category: "Música", image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=800&q=80" },
  { id: "2", title: "Ink Party 2026", date: "2026-09-05", time: "23:00", location: "Razzmatazz", city: "Barcelona", attendees: 89, category: "Fiestas", image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80" },
  { id: "3", title: "Skate Day", date: "2026-09-12", time: "16:00", location: "Skatepark Norte", city: "Valencia", attendees: 45, category: "Deportes", image: "https://images.unsplash.com/photo-1520045892732-304bc3ac5d8e?auto=format&fit=crop&w=800&q=80" },
  { id: "4", title: "Festival de Arte Urbano", date: "2026-09-18", time: "18:00", location: "Centro de Arte", city: "Sevilla", attendees: 32, category: "Arte", image: "https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=800&q=80" },
  { id: "5", title: "Noche de Indie", date: "2026-09-24", time: "21:30", location: "Sala BBK", city: "Bilbao", attendees: 78, category: "Música", image: "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=800&q=80" },
];

const categories = ["Todos", "Música", "Fiestas", "Deportes", "Arte"];

function formatDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("es-ES", { day: "numeric", month: "long" });
}

function EventCard({ event, onOpen }: { event: EventItem; onOpen: (event: EventItem) => void }) {
  return <article className="events-native-card" onClick={() => onOpen(event)} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onOpen(event)}>
    <div className="events-native-card-image">
      {event.image ? <img src={event.image} alt="" /> : null}
      <div className="events-native-date"><strong>{new Date(`${event.date}T12:00:00`).getDate()}</strong><span>{new Date(`${event.date}T12:00:00`).toLocaleDateString("es-ES", { month: "short" }).replace(".", "").toUpperCase()}</span></div>
    </div>
    <div className="events-native-card-body">
      <span className="events-native-category">{event.category}</span>
      <h3>{event.title}</h3>
      <p><CalendarDays size={13} /> {formatDate(event.date)} · {event.time}</p>
      <p><MapPin size={13} /> {event.location}, {event.city}</p>
      <div className="events-native-card-footer"><span><Users size={13} /> {event.attendees} asistentes</span><button type="button" onClick={(e) => { e.stopPropagation(); onOpen(event); }}>Ver evento</button></div>
    </div>
  </article>;
}

export function EventsNativeView() {
  const [events, setEvents] = useState<EventItem[]>(seedEvents);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todos");
  const [monthOffset, setMonthOffset] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<EventItem | null>(null);
  const month = new Date(2026, 7 + monthOffset, 1);
  const visible = useMemo(() => events.filter((event) => {
    const q = query.trim().toLowerCase();
    return (!q || `${event.title} ${event.location} ${event.city}`.toLowerCase().includes(q)) && (category === "Todos" || event.category === category);
  }), [events, query, category]);

  function createEvent(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const event: EventItem = {
      id: crypto.randomUUID(),
      title: String(form.get("title") || "Nuevo evento"),
      date: String(form.get("date") || "2026-09-01"),
      time: String(form.get("time") || "20:00"),
      location: String(form.get("location") || "Por confirmar"),
      city: String(form.get("city") || "España"),
      attendees: 0,
      category: String(form.get("category") || "Otros"),
    };
    setEvents((current) => [event, ...current]);
    setCreateOpen(false);
  }

  return <div className="events-native-page">
    <div className="events-native-grid">
      <aside className="events-native-left">
        <section className="events-native-panel events-native-intro">
          <div className="events-native-icon"><CalendarDays size={22} /></div>
          <div><strong>Eventos</strong><span>Planifica y comparte planes con tus amigos.</span></div>
        </section>
        <nav className="events-native-panel events-native-menu">
          <button className="active"><CalendarDays size={17} /> Descubrir</button>
          <button><Users size={17} /> Mis eventos</button>
          <button onClick={() => setCreateOpen(true)}><Plus size={17} /> Crear evento</button>
        </nav>
      </aside>

      <main className="events-native-main">
        <section className="events-native-panel events-native-header">
          <div><span className="events-native-eyebrow">PLANES DE INKORIUM</span><h1>Eventos</h1><p>Descubre qué está pasando cerca de ti.</p></div>
          <button className="events-native-primary" onClick={() => setCreateOpen(true)}><Plus size={17} /> Crear evento</button>
        </section>
        <section className="events-native-panel events-native-toolbar">
          <div className="events-native-search"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar eventos, lugares o ciudades..." /></div>
          <div className="events-native-filters">{categories.map((item) => <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>)}</div>
        </section>
        <section className="events-native-results">
          {visible.length === 0 ? <div className="events-native-panel events-native-empty"><CalendarDays size={30} /><strong>No hay eventos para estos filtros</strong><span>Prueba otra búsqueda o crea el primero.</span></div> : <div className="events-native-cards">{visible.map((event) => <EventCard key={event.id} event={event} onOpen={setSelected} />)}</div>}
        </section>
      </main>

      <aside className="events-native-right">
        <section className="events-native-panel events-native-calendar">
          <div className="events-native-calendar-head"><button onClick={() => setMonthOffset((value) => value - 1)}><ChevronLeft size={17} /></button><strong>{month.toLocaleDateString("es-ES", { month: "long", year: "numeric" })}</strong><button onClick={() => setMonthOffset((value) => value + 1)}><ChevronRight size={17} /></button></div>
          <div className="events-native-week">{["L","M","X","J","V","S","D"].map((day) => <span key={day}>{day}</span>)}</div>
          <div className="events-native-days">{Array.from({ length: 35 }, (_, index) => <span key={index}>{index < 3 ? "" : ((index - 2) % 31) + 1}</span>)}</div>
        </section>
        <section className="events-native-panel events-native-note"><strong>Próximamente</strong><p>Usa los eventos para compartir conciertos, fiestas, viajes y planes con tus amigos.</p></section>
      </aside>
    </div>

    {createOpen ? <div className="events-native-overlay" onMouseDown={() => setCreateOpen(false)}><form className="events-native-modal" onSubmit={createEvent} onMouseDown={(e) => e.stopPropagation()}><div className="events-native-modal-head"><strong>Crear evento</strong><button type="button" onClick={() => setCreateOpen(false)}><X size={18} /></button></div><label>Título<input name="title" required placeholder="Nombre del evento" /></label><div className="events-native-form-row"><label>Fecha<input type="date" name="date" required /></label><label>Hora<input type="time" name="time" required /></label></div><div className="events-native-form-row"><label>Lugar<input name="location" required placeholder="Lugar" /></label><label>Ciudad<input name="city" required placeholder="Ciudad" /></label></div><label>Categoría<select name="category" defaultValue="Otros">{categories.filter((item) => item !== "Todos").map((item) => <option key={item}>{item}</option>)}</select></label><button className="events-native-primary" type="submit">Crear evento</button></form></div> : null}

    {selected ? <div className="events-native-overlay" onMouseDown={() => setSelected(null)}><article className="events-native-modal events-native-detail" onMouseDown={(e) => e.stopPropagation()}><div className="events-native-modal-head"><strong>{selected.title}</strong><button type="button" onClick={() => setSelected(null)}><X size={18} /></button></div>{selected.image ? <img src={selected.image} alt="" /> : null}<span className="events-native-category">{selected.category}</span><h2>{selected.title}</h2><p><CalendarDays size={15} /> {formatDate(selected.date)} · {selected.time}</p><p><MapPin size={15} /> {selected.location}, {selected.city}</p><p><Users size={15} /> {selected.attendees} personas están interesadas</p><button className="events-native-primary" onClick={() => setSelected(null)}>Me interesa</button></article></div> : null}
  </div>;
}
