import React, { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Filter, Grid2X2, List, MapPin, Plus, Search, Star, Music2, PartyPopper, Trophy, Palette, Monitor, MoreHorizontal, X, Clock3, Users } from "lucide-react";

const purple = "#5b2db5";
const border = "#e4e7ee";
const muted = "#718096";
const today = new Date();

type EventItem = {
  id: string;
  title: string;
  category: string;
  date: string;
  time: string;
  location: string;
  city: string;
  attendees: number;
  image: string;
  featured?: boolean;
};

const seedEvents: EventItem[] = [
  { id: "streetwear", title: "Concierto Steetwear", category: "Música", date: "2026-08-24", time: "20:00", location: "Sala Riviera", city: "Madrid, España", attendees: 124, featured: true, image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=900&q=80" },
  { id: "ink-party", title: "Ink Party 2026", category: "Fiestas", date: "2026-08-31", time: "23:00", location: "Razzmatazz", city: "Barcelona, España", attendees: 89, featured: true, image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80" },
  { id: "skate-day", title: "Skate Day", category: "Deportes", date: "2026-09-07", time: "16:00", location: "Skatepark", city: "Valencia, España", attendees: 45, featured: true, image: "https://images.unsplash.com/photo-1520045892732-304bc3ac5d8e?auto=format&fit=crop&w=900&q=80" },
  { id: "urban-art", title: "Festival de Arte Urbano", category: "Arte y Cultura", date: "2026-09-15", time: "18:00", location: "Centro de Arte", city: "Sevilla, España", attendees: 32, image: "https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=900&q=80" },
  { id: "indie-night", title: "Noche de Indie", category: "Música", date: "2026-09-21", time: "21:30", location: "Sala BBK", city: "Bilbao, España", attendees: 78, image: "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=900&q=80" },
  { id: "ink-games", title: "Torneo Ink Games", category: "Deportes", date: "2026-09-28", time: "10:00", location: "Pabellón Norte", city: "Zaragoza, España", attendees: 64, image: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=900&q=80" },
  { id: "reggaeton", title: "Reggaeton Party", category: "Fiestas", date: "2026-10-14", time: "23:30", location: "Sala Apolo", city: "Barcelona, España", attendees: 156, image: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=900&q=80" },
  { id: "expo-ink", title: "Expo Ink 2026", category: "Arte y Cultura", date: "2026-10-22", time: "12:00", location: "Matadero", city: "Madrid, España", attendees: 98, image: "https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?auto=format&fit=crop&w=900&q=80" },
  { id: "freestyle", title: "Batalla de Freestyle", category: "Otros", date: "2026-10-30", time: "20:30", location: "Plaza Mayor", city: "Madrid, España", attendees: 74, image: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=900&q=80" },
];

const categories = [
  ["Todos los eventos", CalendarDays], ["Música", Music2], ["Fiestas", PartyPopper], ["Deportes", Trophy], ["Arte y Cultura", Palette], ["Tecnología", Monitor], ["Otros", MoreHorizontal],
] as const;

function formatDay(date: string) { return new Date(`${date}T12:00:00`).getDate().toString().padStart(2, "0"); }
function formatMonth(date: string) { return new Date(`${date}T12:00:00`).toLocaleDateString("es-ES", { month: "short" }).replace(".", "").toUpperCase(); }
function formatLongDate(date: string, time: string) { return `${new Date(`${date}T12:00:00`).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })} · ${time}`; }

export function EventsView({ session, username, onExit }: { session: any; username?: string; onExit?: () => void }) {
  const [tab, setTab] = useState<"descubrir" | "mis" | "invitaciones">("descubrir");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todos los eventos");
  const [grid, setGrid] = useState(true);
  const [monthOffset, setMonthOffset] = useState(0);
  const [modal, setModal] = useState(false);
  const [events, setEvents] = useState(seedEvents);
  const [notice, setNotice] = useState("");

  const visible = useMemo(() => events.filter((event) => {
    const q = query.trim().toLowerCase();
    const matchesQuery = !q || `${event.title} ${event.location} ${event.city} ${event.category}`.toLowerCase().includes(q);
    const matchesCategory = category === "Todos los eventos" || event.category === category;
    return matchesQuery && matchesCategory;
  }), [events, query, category]);

  const featured = visible.filter((event) => event.featured).slice(0, 3);
  const upcoming = visible.filter((event) => !event.featured).slice(0, 6);
  const monthDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const monthName = monthDate.toLocaleDateString("es-ES", { month: "long", year: "numeric" });

  function createEvent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") || "Nuevo evento").trim();
    const date = String(form.get("date") || "2026-09-15");
    const time = String(form.get("time") || "20:00");
    const location = String(form.get("location") || "Por confirmar");
    const city = String(form.get("city") || "España");
    const categoryValue = String(form.get("category") || "Otros");
    const item: EventItem = { id: `local-${Date.now()}`, title, category: categoryValue, date, time, location, city, attendees: 0, image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80" };
    setEvents((current) => [item, ...current]);
    setModal(false);
    setNotice("Evento creado correctamente.");
    window.setTimeout(() => setNotice(""), 2500);
  }

  return <div className="events-app">
    <style>{`
      .events-app{min-height:100vh;background:#f4f6fa;color:#17243a;font-family:Arial,Helvetica,sans-serif}
      .events-topbar{height:58px;background:linear-gradient(90deg,#48209b,#5e2db5 58%,#32166f);display:flex;align-items:center;padding:0 30px;gap:22px;color:#fff;box-sizing:border-box;position:sticky;top:0;z-index:50;box-shadow:0 1px 0 rgba(0,0,0,.12)}
      .events-brand{display:flex;align-items:center;gap:8px;font-weight:800;font-size:23px;letter-spacing:-.7px;white-space:nowrap}.events-brand img{width:30px;height:30px}.events-nav{display:flex;align-self:stretch;align-items:center;gap:2px}.events-nav button{border:0;background:transparent;color:#fff;font-weight:700;padding:0 14px;height:100%;cursor:pointer;font-size:14px}.events-nav button.active{background:rgba(255,255,255,.12);box-shadow:inset 0 -3px #fff}.events-search{flex:1;max-width:490px;margin-left:auto}.events-search input{width:100%;height:38px;border:0;border-radius:22px;background:#321477;color:#fff;padding:0 18px;outline:0;box-sizing:border-box}.events-search input::placeholder{color:#d5cbe9}.events-user{display:flex;align-items:center;gap:8px;font-weight:700;white-space:nowrap}.events-avatar{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:#f4f7fb;color:#1f5ca8;font-weight:800}
      .events-layout{display:grid;grid-template-columns:258px minmax(0,1fr) 300px;gap:22px;max-width:1470px;margin:0 auto;padding:20px 32px 40px;box-sizing:border-box}.events-side,.events-main,.events-right{min-width:0}.events-panel{background:#fff;border:1px solid ${border};border-radius:5px;box-shadow:0 1px 2px rgba(23,55,90,.035)}.events-profile{padding:25px 18px;display:flex;align-items:center;gap:14px}.events-profile-avatar{width:60px;height:60px;border-radius:6px;background:#eef5fb;color:#0861ac;display:grid;place-items:center;font-size:27px;font-weight:700}.events-profile strong{display:block;font-size:17px}.events-profile span{display:block;color:#58708a;margin-top:5px}.events-profile em{display:block;color:#16a765;font-style:normal;font-size:13px;margin-top:7px}.events-profile button{border:0;background:none;color:#0a55a8;padding:0;margin-top:8px;cursor:pointer}.events-menu{margin-top:18px;padding:12px 0}.events-menu button{width:100%;display:flex;align-items:center;gap:14px;border:0;background:transparent;color:#25364d;text-align:left;padding:13px 18px;font-size:16px;cursor:pointer}.events-menu button:hover,.events-menu button.active{background:#f1edfb;color:${purple}}.events-menu .icon{width:22px;text-align:center;color:#67829d}.events-menu button.active .icon{color:${purple}}
      .events-main-head{padding:14px 20px 0}.events-title-row{display:flex;align-items:center;justify-content:space-between;gap:12px}.events-title{display:flex;align-items:center;gap:12px}.events-title h1{margin:0;font-size:26px}.events-title svg{color:#22105f}.events-create{border:0;border-radius:5px;background:linear-gradient(135deg,#6737c5,#4e20a4);color:#fff;font-weight:700;padding:10px 16px;display:flex;align-items:center;gap:7px;cursor:pointer}.events-tabs{display:flex;gap:22px;border-bottom:1px solid ${border};margin-top:14px}.events-tabs button{border:0;background:none;padding:12px 2px 11px;color:#51657b;font-weight:600;border-bottom:2px solid transparent;cursor:pointer}.events-tabs button.active{color:${purple};border-color:#6837ca}.events-toolbar{display:flex;gap:10px;padding:18px 20px}.events-toolbar .searchbox{position:relative;flex:1}.events-toolbar input{width:100%;height:38px;border:1px solid #d6dce5;border-radius:5px;padding:0 12px 0 38px;box-sizing:border-box;outline:0}.events-toolbar .searchbox svg{position:absolute;left:12px;top:10px;color:#8292a4}.events-filter{height:38px;padding:0 13px;border:1px solid #d6dce5;background:#fff;border-radius:5px;color:#42556b;display:flex;align-items:center;gap:7px;cursor:pointer}.events-view-toggle{display:flex;border:1px solid #d6dce5;border-radius:5px;overflow:hidden}.events-view-toggle button{width:42px;border:0;background:#fff;color:#718096;cursor:pointer}.events-view-toggle button.active{background:#eef0f8;color:${purple}}
      .events-section{padding:0 20px 20px}.events-section h2{font-size:15px;margin:0 0 10px}.events-featured{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.event-card{overflow:hidden}.event-image{height:126px;position:relative;background:#ddd}.event-image img{width:100%;height:100%;object-fit:cover;display:block}.event-date-badge{position:absolute;left:10px;top:10px;background:#fff;border-radius:5px;padding:6px 8px;text-align:center;box-shadow:0 2px 6px rgba(0,0,0,.12);color:${purple};font-weight:800;line-height:1}.event-date-badge small{display:block;font-size:10px;margin-top:3px}.event-body{padding:10px 11px 12px}.event-body h3{font-size:14px;margin:0 0 7px}.event-meta{font-size:11px;color:#66788b;display:flex;gap:6px;align-items:center;margin-top:5px}.event-attendees{display:flex;align-items:center;justify-content:space-between;margin-top:11px;font-size:11px}.mini-avatars{display:flex}.mini-avatar{width:20px;height:20px;border-radius:50%;background:#dfe9f4;border:2px solid #fff;margin-left:-4px;display:grid;place-items:center;font-size:8px;color:#28609a}.mini-avatar:first-child{margin-left:0}.plus-attendees{background:#eef1f6;color:#586b80;border-radius:12px;padding:3px 6px;margin-left:4px}.events-upcoming{display:flex;flex-direction:column}.upcoming-row{display:grid;grid-template-columns:130px 58px minmax(0,1fr) 90px;gap:12px;align-items:center;padding:9px 0;border-top:1px solid #edf0f4}.upcoming-row:first-child{border-top:0}.upcoming-row img{width:130px;height:88px;object-fit:cover;border-radius:4px}.upcoming-date{border:1px solid #e1e6ed;border-radius:5px;text-align:center;padding:8px 3px;color:${purple};font-weight:800}.upcoming-date small{display:block;font-size:10px;margin-top:3px}.upcoming-info h3{font-size:14px;margin:0 0 6px}.upcoming-info p{margin:3px 0;color:#64758a;font-size:11px}.upcoming-actions{text-align:right}.upcoming-actions strong{display:block;font-size:13px}.upcoming-actions button{margin-top:9px;border:1px solid #cfc4eb;color:${purple};background:#fff;border-radius:4px;padding:6px 9px;font-size:11px;cursor:pointer}.events-list .event-card{display:grid;grid-template-columns:140px 1fr}.events-list .event-image{height:105px}.events-list .event-body{padding:12px}
      .right-panel{padding:18px}.right-panel h3{margin:0 0 14px;font-size:16px}.calendar-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:11px}.calendar-head button{border:0;background:none;cursor:pointer;color:#53657a}.calendar-head strong{text-transform:capitalize;font-size:13px}.calendar-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:7px;text-align:center;font-size:11px}.calendar-grid span{height:22px;display:grid;place-items:center}.calendar-grid .dow{font-weight:700;color:#68788d}.calendar-grid .day{color:#62748a}.calendar-grid .selected{width:24px;height:24px;margin:auto;border-radius:50%;background:${purple};color:#fff;font-weight:700}.category-list{display:flex;flex-direction:column;gap:2px}.category-list button{border:0;background:transparent;padding:9px 7px;display:flex;align-items:center;gap:10px;text-align:left;border-radius:4px;color:#34465c;cursor:pointer}.category-list button.active{background:#f0ecf9;color:${purple}}.popular-item{display:flex;gap:10px;padding:8px 0;border-bottom:1px solid #edf0f4}.popular-item:last-child{border-bottom:0}.popular-item img{width:74px;height:55px;object-fit:cover;border-radius:4px}.popular-item strong{display:block;font-size:12px}.popular-item span{display:block;color:#738398;font-size:10px;margin-top:5px}
      .events-notice{position:fixed;right:25px;bottom:25px;background:#1f7a4f;color:#fff;border-radius:6px;padding:11px 15px;z-index:100;box-shadow:0 8px 25px rgba(0,0,0,.18);font-size:13px}.events-modal-backdrop{position:fixed;inset:0;background:rgba(22,28,43,.45);display:grid;place-items:center;padding:20px;z-index:200}.events-modal{width:min(520px,100%);max-height:90vh;overflow:auto;background:#fff;border-radius:8px;border:1px solid ${border};box-shadow:0 20px 70px rgba(22,28,43,.28)}.events-modal-head{display:flex;justify-content:space-between;align-items:center;padding:17px 19px;border-bottom:1px solid ${border}}.events-modal-head h2{margin:0;font-size:19px}.events-modal-close{border:0;background:none;cursor:pointer;color:#68788b}.events-form{padding:18px;display:grid;grid-template-columns:1fr 1fr;gap:13px}.events-form label{display:flex;flex-direction:column;gap:6px;font-size:12px;color:#53667b;font-weight:700}.events-form label.full{grid-column:1/-1}.events-form input,.events-form select{height:38px;border:1px solid #d6dce5;border-radius:5px;padding:0 10px;outline:0}.events-form-actions{grid-column:1/-1;display:flex;justify-content:flex-end;gap:8px;padding-top:5px}.events-form-actions button{height:38px;border-radius:5px;padding:0 15px;border:1px solid #d6dce5;background:#fff;cursor:pointer}.events-form-actions .primary{border:0;background:${purple};color:#fff;font-weight:700}
      @media(max-width:1150px){.events-layout{grid-template-columns:220px minmax(0,1fr)}.events-right{display:none}.events-nav button{padding:0 8px}.events-search{max-width:330px}}@media(max-width:850px){.events-topbar{padding:0 14px;gap:10px}.events-nav{display:none}.events-layout{grid-template-columns:1fr;padding:12px}.events-side{display:none}.events-featured{grid-template-columns:1fr}.upcoming-row{grid-template-columns:90px 48px minmax(0,1fr)}.upcoming-row img{width:90px;height:70px}.upcoming-actions{display:none}.events-title h1{font-size:22px}}
    `}</style>

    <header className="events-topbar">
      <button onClick={onExit} style={{border:0,background:"none",color:"inherit",padding:0,cursor:"pointer"}} aria-label="Volver al inicio"><span className="events-brand"><img src="/inkorium-logo-white.svg" alt=""/>inkorium</span></button>
      <nav className="events-nav">{[["Inicio",onExit],["Perfil",onExit],["Mensajes",onExit],["Personas",onExit],["Musica",onExit],["Fotos",onExit],["Videos",onExit],["Eventos",undefined]].map(([label, action])=><button key={label as string} className={label === "Eventos" ? "active" : ""} onClick={action as any}>{label as string}</button>)}</nav>
      <div className="events-search"><input placeholder="Buscar personas, musica, videos..." value={query} onChange={(e)=>setQuery(e.target.value)} /></div>
      <div className="events-user"><span className="events-avatar">{(username || session?.user?.email || "N")[0].toUpperCase()}</span>{username || "nightloot"}</div>
    </header>

    <div className="events-layout">
      <aside className="events-side">
        <section className="events-panel events-profile"><div className="events-profile-avatar">{(username || "N")[0].toUpperCase()}</div><div><strong>{username || "nightloot"}</strong><span>Mas rapido</span><em>● En linea</em><button onClick={onExit}>Ver mi perfil »</button></div></section>
        <nav className="events-panel events-menu">{[["⌂","Novedades",onExit],["▧","Fotos",onExit],["▹","Videos",onExit],["♫","Musica",onExit],["□","Eventos",undefined],["♧","Grupos",onExit],["⚑","Paginas",onExit],["▥","Encuestas",onExit],["▱","Guardados",onExit],["⚙","Configuracion",onExit]].map(([icon,label,action])=><button key={label as string} className={label === "Eventos" ? "active" : ""} onClick={action as any}><span className="icon">{icon as string}</span>{label as string}</button>)}</nav>
      </aside>

      <main className="events-main">
        <section className="events-panel events-main-head">
          <div className="events-title-row"><div className="events-title"><CalendarDays size={26}/><h1>Eventos</h1></div><button className="events-create" onClick={()=>setModal(true)}><Plus size={17}/> Crear evento</button></div>
          <div className="events-tabs"><button className={tab === "descubrir" ? "active" : ""} onClick={()=>setTab("descubrir")}>Descubrir</button><button className={tab === "mis" ? "active" : ""} onClick={()=>setTab("mis")}>Mis eventos</button><button className={tab === "invitaciones" ? "active" : ""} onClick={()=>setTab("invitaciones")}>Invitaciones</button></div>
        </section>
        <section className="events-panel" style={{marginTop:12}}>
          <div className="events-toolbar"><div className="searchbox"><Search size={17}/><input placeholder="Buscar eventos..." value={query} onChange={(e)=>setQuery(e.target.value)}/></div><button className="events-filter" onClick={()=>setCategory(category === "Todos los eventos" ? "Música" : "Todos los eventos")}><Filter size={15}/> Filtros</button><div className="events-view-toggle"><button className={grid ? "active" : ""} onClick={()=>setGrid(true)}><Grid2X2 size={16}/></button><button className={!grid ? "active" : ""} onClick={()=>setGrid(false)}><List size={16}/></button></div></div>
          <div className="events-section">
            {tab === "descubrir" && <>
              <h2>Eventos destacados</h2>
              <div className={grid ? "events-featured" : "events-list"}>{featured.map((event)=><EventCard key={event.id} event={event}/>)}</div>
              <h2 style={{marginTop:25}}>Eventos próximos</h2>
              <div className="events-upcoming">{upcoming.map((event)=><UpcomingEvent key={event.id} event={event}/>)}</div>
              {upcoming.length === 0 && <Empty text="No encontramos eventos con esos filtros."/>}
            </>}
            {tab === "mis" && <div style={{padding:"35px 10px",textAlign:"center",color:muted}}><CalendarDays size={42} style={{opacity:.35}}/><h3>Mis eventos</h3><p>Los eventos que crees aparecerán aquí.</p></div>}
            {tab === "invitaciones" && <div style={{padding:"35px 10px",textAlign:"center",color:muted}}><Users size={42} style={{opacity:.35}}/><h3>Invitaciones</h3><p>Cuando recibas una invitación aparecerá aquí.</p></div>}
          </div>
        </section>
      </main>

      <aside className="events-right">
        <section className="events-panel right-panel"><div className="calendar-head"><button onClick={()=>setMonthOffset(monthOffset-1)}><ChevronLeft size={17}/></button><strong>{monthName}</strong><button onClick={()=>setMonthOffset(monthOffset+1)}><ChevronRight size={17}/></button></div><div className="calendar-grid">{["L","M","X","J","V","S","D"].map(d=><span className="dow" key={d}>{d}</span>)}{calendarDays(monthDate).map((day,i)=><span className={day === today.getDate() && monthOffset === 0 ? "selected" : "day"} key={i}>{day || ""}</span>)}</div></section>
        <section className="events-panel right-panel" style={{marginTop:14}}><h3>Categorías</h3><div className="category-list">{categories.map(([label,Icon])=><button key={label} className={category === label ? "active" : ""} onClick={()=>setCategory(label)}><Icon size={16}/>{label}</button>)}</div></section>
        <section className="events-panel right-panel" style={{marginTop:14}}><h3>Eventos populares</h3>{events.slice(6,9).map((event)=><div className="popular-item" key={event.id}><img src={event.image} alt=""/><div><strong>{event.title}</strong><span>{formatLongDate(event.date,event.time)}</span><span>{event.attendees} asistirán</span></div></div>)}</section>
      </aside>
    </div>
    {notice && <div className="events-notice">{notice}</div>}
    {modal && <div className="events-modal-backdrop" onMouseDown={(e)=>{if(e.target === e.currentTarget)setModal(false)}}><section className="events-modal"><div className="events-modal-head"><h2>Crear evento</h2><button className="events-modal-close" onClick={()=>setModal(false)}><X size={20}/></button></div><form className="events-form" onSubmit={createEvent}><label className="full">Nombre del evento<input name="title" required placeholder="Ej. Fiesta Inkorium"/></label><label>Fecha<input type="date" name="date" required defaultValue="2026-09-15"/></label><label>Hora<input type="time" name="time" required defaultValue="20:00"/></label><label className="full">Lugar<input name="location" required placeholder="Sala, plaza, local..."/></label><label>Ciudad<input name="city" required placeholder="Madrid, España"/></label><label>Categoría<select name="category" defaultValue="Música">{categories.slice(1).map(([label])=><option key={label}>{label}</option>)}</select></label><div className="events-form-actions"><button type="button" onClick={()=>setModal(false)}>Cancelar</button><button className="primary" type="submit">Crear evento</button></div></form></section></div>}
  </div>;
}

function EventCard({ event }: { event: EventItem }) { return <article className="events-panel event-card"><div className="event-image"><img src={event.image} alt=""/><div className="event-date-badge">{formatDay(event.date)}<small>{formatMonth(event.date)}</small></div></div><div className="event-body"><h3>{event.title}</h3><div className="event-meta"><Music2 size={12}/> {event.category}</div><div className="event-meta"><CalendarDays size={12}/> {formatLongDate(event.date,event.time)}</div><div className="event-meta"><MapPin size={12}/> {event.city}</div><div className="event-attendees"><span>{event.attendees} asistirán</span><span className="mini-avatars"><span className="mini-avatar">N</span><span className="mini-avatar">A</span><span className="mini-avatar">L</span><span className="plus-attendees">+{Math.max(0,event.attendees-3)}</span></span></div></div></article>; }
function UpcomingEvent({ event }: { event: EventItem }) { return <article className="upcoming-row"><img src={event.image} alt=""/><div className="upcoming-date">{formatDay(event.date)}<small>{formatMonth(event.date)}</small></div><div className="upcoming-info"><h3>{event.title}</h3><p><Music2 size={11}/> {event.category}</p><p><Clock3 size={11}/> {formatLongDate(event.date,event.time)}</p><p><MapPin size={11}/> {event.city}</p></div><div className="upcoming-actions"><strong>{event.attendees}</strong><span style={{color:muted,fontSize:11}}>asistirán</span><br/><button>Ver evento</button></div></article>; }
function Empty({ text }: { text: string }) { return <div style={{padding:"40px 10px",textAlign:"center",color:muted}}>{text}</div>; }
function calendarDays(month: Date) { const first = new Date(month.getFullYear(), month.getMonth(), 1); const last = new Date(month.getFullYear(), month.getMonth()+1, 0); const offset = (first.getDay()+6)%7; const days = Array.from({length: offset},()=>0); for(let d=1; d<=last.getDate(); d++) days.push(d); return days; }
