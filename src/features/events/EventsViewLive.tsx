import React, { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Filter, Grid2X2, List, MapPin, Plus, Search, X, Clock3, Users } from "lucide-react";
import { supabase } from "../../lib/supabase";

const purple = "#5b2db5";
const border = "#e4e7ee";
const muted = "#718096";

type DatabaseEvent = {
  id: string;
  creator_id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  category: string;
  location_name: string | null;
  city: string | null;
  start_time: string;
  end_time: string | null;
  attendee_limit: number | null;
  privacy_level: "public" | "friends_only" | "private" | "group_only";
};

type EventRow = DatabaseEvent & { attendee_count: number; my_status: "going" | "maybe" | "declined" | "invited" | null };

function formatDay(value: string) {
  return new Date(value).getDate().toString().padStart(2, "0");
}
function formatMonth(value: string) {
  return new Date(value).toLocaleDateString("es-ES", { month: "short" }).replace(".", "").toUpperCase();
}
function formatLongDate(value: string) {
  return new Date(value).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function EventsViewLive({ session, username, onExit }: { session: any; username?: string; onExit?: () => void }) {
  const [tab, setTab] = useState<"descubrir" | "mis">("descubrir");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todos los eventos");
  const [grid, setGrid] = useState(true);
  const [monthOffset, setMonthOffset] = useState(0);
  const [modal, setModal] = useState(false);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [selected, setSelected] = useState<EventRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const categories = ["Todos los eventos", "Música", "Fiestas", "Deportes", "Arte y Cultura", "Tecnología", "Otros"];

  const loadEvents = async () => {
    setLoading(true);
    setError("");
    const { data, error: eventsError } = await supabase
      .from("events")
      .select("id, creator_id, name, description, cover_url, category, location_name, city, start_time, end_time, attendee_limit, privacy_level")
      .order("start_time", { ascending: true });
    if (eventsError) {
      setError("No se pudieron cargar los eventos.");
      setLoading(false);
      return;
    }

    const rows = (data ?? []) as DatabaseEvent[];
    if (!rows.length) {
      setEvents([]);
      setLoading(false);
      return;
    }

    const ids = rows.map((row) => row.id);
    const { data: attendees } = await supabase
      .from("event_attendees")
      .select("event_id, user_id, status")
      .in("event_id", ids);

    const attendeeRows = (attendees ?? []) as Array<{ event_id: string; user_id: string; status: EventRow["my_status"] }>;
    const grouped = new Map<string, { count: number; mine: EventRow["my_status"] }>();
    attendeeRows.forEach((row) => {
      const item = grouped.get(row.event_id) ?? { count: 0, mine: null };
      if (row.status === "going") item.count += 1;
      if (row.user_id === session?.user?.id) item.mine = row.status;
      grouped.set(row.event_id, item);
    });

    setEvents(rows.map((row) => ({
      ...row,
      attendee_count: grouped.get(row.id)?.count ?? 0,
      my_status: grouped.get(row.id)?.mine ?? null,
    })));
    setLoading(false);
  };

  useEffect(() => {
    void loadEvents();
  }, [session?.user?.id]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter((event) => {
      const matchesQuery = !q || `${event.name} ${event.location_name ?? ""} ${event.city ?? ""} ${event.category}`.toLowerCase().includes(q);
      const matchesCategory = category === "Todos los eventos" || event.category === category;
      if (tab === "mis") return matchesQuery && matchesCategory && ["going", "maybe", "invited"].includes(event.my_status ?? "");
      return matchesQuery && matchesCategory;
    });
  }, [events, query, category, tab]);

  const monthDate = new Date(new Date().getFullYear(), new Date().getMonth() + monthOffset, 1);
  const monthName = monthDate.toLocaleDateString("es-ES", { month: "long", year: "numeric" });

  async function createEvent(formEvent: React.FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    const form = new FormData(formEvent.currentTarget);
    const title = String(form.get("title") || "Nuevo evento").trim();
    const date = String(form.get("date") || "");
    const time = String(form.get("time") || "20:00");
    const location = String(form.get("location") || "Por confirmar").trim();
    const city = String(form.get("city") || "España").trim();
    const categoryValue = String(form.get("category") || "Otros");
    const privacy = String(form.get("privacy") || "public") as DatabaseEvent["privacy_level"];

    if (!title || !date) return;
    const start = new Date(`${date}T${time}`);
    if (Number.isNaN(start.getTime())) return;

    const { error: insertError } = await supabase.from("events").insert({
      creator_id: session.user.id,
      name: title,
      description: String(form.get("description") || "").trim() || null,
      category: categoryValue,
      location_name: location || null,
      city: city || null,
      start_time: start.toISOString(),
      type: "physical",
      privacy_level: privacy,
    });

    if (insertError) {
      setNotice("No se pudo crear el evento.");
      return;
    }

    setModal(false);
    setNotice("Evento creado correctamente.");
    formEvent.currentTarget.reset();
    await loadEvents();
    window.setTimeout(() => setNotice(""), 2500);
  }

  async function updateRsvp(event: EventRow, status: "going" | "maybe" | "declined") {
    if (!session?.user?.id) return;
    const existing = event.my_status;
    if (existing) {
      const { error: updateError } = await supabase.from("event_attendees").update({ status }).eq("event_id", event.id).eq("user_id", session.user.id);
      if (updateError) {
        setNotice("No se pudo actualizar tu respuesta.");
        return;
      }
    } else {
      const { error: insertError } = await supabase.from("event_attendees").insert({ event_id: event.id, user_id: session.user.id, status });
      if (insertError) {
        setNotice("No se pudo guardar tu respuesta.");
        return;
      }
    }
    setNotice(status === "going" ? "Te has apuntado al evento." : status === "maybe" ? "Marcado como quizá." : "Has rechazado el evento.");
    await loadEvents();
    setSelected((current) => current?.id === event.id ? ({ ...current, my_status: status, attendee_count: status === "going" && current.my_status !== "going" ? current.attendee_count + 1 : status !== "going" && current.my_status === "going" ? Math.max(0, current.attendee_count - 1) : current.attendee_count }) : current);
    window.setTimeout(() => setNotice(""), 2500);
  }

  return (
    <div className="events-app">
      <style>{`
      .events-app{min-height:100vh;background:#f4f6fa;color:#17243a;font-family:Arial,Helvetica,sans-serif}
      .events-topbar{height:58px;background:linear-gradient(90deg,#48209b,#5e2db5 58%,#32166f);display:flex;align-items:center;padding:0 30px;gap:22px;color:#fff;box-sizing:border-box;position:sticky;top:0;z-index:50}
      .events-brand{display:flex;align-items:center;gap:8px;font-weight:800;font-size:23px;white-space:nowrap}.events-brand img{width:30px;height:30px}.events-nav{display:flex;height:100%}.events-nav button{border:0;background:transparent;color:#fff;font-weight:700;padding:0 14px;cursor:pointer}.events-nav button.active{background:rgba(255,255,255,.12);box-shadow:inset 0 -3px #fff}.events-search{flex:1;max-width:490px;margin-left:auto}.events-search input{width:100%;height:38px;border:0;border-radius:22px;background:#321477;color:#fff;padding:0 18px;outline:0}.events-search input::placeholder{color:#d5cbe9}.events-user{display:flex;align-items:center;gap:8px;font-weight:700}.events-avatar{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:#f4f7fb;color:#1f5ca8;font-weight:800}
      .events-layout{display:grid;grid-template-columns:258px minmax(0,1fr) 300px;gap:22px;max-width:1470px;margin:0 auto;padding:20px 32px 40px;box-sizing:border-box}.events-panel{background:#fff;border:1px solid ${border};border-radius:5px;box-shadow:0 1px 2px rgba(23,55,90,.035)}.events-profile{padding:25px 18px;display:flex;align-items:center;gap:14px}.events-profile-avatar{width:60px;height:60px;border-radius:6px;background:#eef5fb;color:#0861ac;display:grid;place-items:center;font-size:27px;font-weight:700}.events-profile strong{display:block;font-size:17px}.events-profile span{display:block;color:#58708a;margin-top:5px}.events-menu{margin-top:18px;padding:12px 0}.events-menu button{width:100%;display:flex;align-items:center;gap:14px;border:0;background:transparent;color:#25364d;text-align:left;padding:13px 18px;font-size:16px;cursor:pointer}.events-menu button.active{background:#f1edfb;color:${purple}}
      .events-main-head{padding:14px 20px 0}.events-title-row{display:flex;align-items:center;justify-content:space-between;gap:12px}.events-title{display:flex;align-items:center;gap:12px}.events-title h1{margin:0;font-size:26px}.events-create{border:0;border-radius:5px;background:linear-gradient(135deg,#6737c5,#4e20a4);color:#fff;font-weight:700;padding:10px 16px;display:flex;align-items:center;gap:7px;cursor:pointer}.events-tabs{display:flex;gap:22px;border-bottom:1px solid ${border};margin-top:14px}.events-tabs button{border:0;background:none;padding:12px 2px 11px;color:#51657b;font-weight:600;border-bottom:2px solid transparent;cursor:pointer}.events-tabs button.active{color:${purple};border-color:#6837ca}.events-toolbar{display:flex;gap:10px;padding:18px 20px}.events-toolbar .searchbox{position:relative;flex:1}.events-toolbar input{width:100%;height:38px;border:1px solid #d6dce5;border-radius:5px;padding:0 12px 0 38px;box-sizing:border-box;outline:0}.events-filter{height:38px;padding:0 13px;border:1px solid #d6dce5;background:#fff;border-radius:5px;color:#42556b;display:flex;align-items:center;gap:7px}.events-view-toggle{display:flex;border:1px solid #d6dce5;border-radius:5px;overflow:hidden}.events-view-toggle button{width:42px;border:0;background:#fff;color:#718096;cursor:pointer}.events-view-toggle button.active{background:#eef0f8;color:${purple}}
      .events-section{padding:0 20px 20px}.events-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.event-card{overflow:hidden}.event-image{height:126px;position:relative;background:#ddd}.event-image img{width:100%;height:100%;object-fit:cover;display:block}.event-date-badge{position:absolute;left:10px;top:10px;background:#fff;border-radius:5px;padding:6px 8px;text-align:center;box-shadow:0 2px 6px rgba(0,0,0,.12);color:${purple};font-weight:800;line-height:1}.event-date-badge small{display:block;font-size:10px;margin-top:3px}.event-body{padding:10px 11px 12px}.event-body h3{font-size:14px;margin:0 0 7px}.event-meta{font-size:11px;color:#66788b;display:flex;gap:6px;align-items:center;margin-top:5px}.event-actions{display:flex;gap:6px;margin-top:11px}.event-actions button{border:1px solid #d3d9e2;background:#fff;border-radius:4px;padding:6px 8px;font-size:11px;cursor:pointer}.event-actions button.primary{background:${purple};border-color:${purple};color:#fff}.events-empty{padding:50px 15px;text-align:center;color:${muted}}
      .right-panel{padding:18px}.right-panel h3{margin:0 0 14px;font-size:16px}.calendar-head{display:flex;justify-content:space-between;align-items:center}.calendar-head button{border:0;background:#f1edfb;color:${purple};width:30px;height:30px;border-radius:4px;cursor:pointer}.calendar-month{text-align:center;font-weight:700;text-transform:capitalize}.calendar-note{font-size:12px;color:${muted};line-height:1.5;margin-top:10px}
      .events-list .event-card{display:grid;grid-template-columns:140px 1fr}.events-list .event-image{height:105px}
      .events-modal{position:fixed;inset:0;background:rgba(18,24,38,.45);display:grid;place-items:center;z-index:100}.events-modal-card{width:min(600px,calc(100vw - 32px));background:#fff;border-radius:8px;padding:20px;box-shadow:0 18px 50px rgba(0,0,0,.22)}.events-modal-head{display:flex;align-items:center;justify-content:space-between}.events-modal-head button{border:0;background:#f2f4f7;border-radius:5px;width:32px;height:32px;cursor:pointer}.events-form{display:grid;gap:12px;margin-top:15px}.events-form input,.events-form textarea,.events-form select{width:100%;box-sizing:border-box;border:1px solid #d6dce5;border-radius:5px;padding:10px;font:inherit}.events-form textarea{min-height:90px;resize:vertical}.events-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.events-form button[type=submit]{border:0;background:${purple};color:#fff;padding:11px;border-radius:5px;font-weight:700;cursor:pointer}
      @media(max-width:1050px){.events-layout{grid-template-columns:1fr}.events-right,.events-side{display:none}.events-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:650px){.events-topbar{padding:0 12px}.events-search{display:none}.events-layout{padding:10px}.events-grid{grid-template-columns:1fr}.events-form-grid{grid-template-columns:1fr}}
      `}</style>

      <div className="events-topbar">
        <div className="events-brand"><span>Eventos</span></div>
        <div className="events-nav"><button className="active" onClick={() => setTab("descubrir")}>Descubrir</button><button onClick={() => setTab("mis")}>Mis eventos</button><button onClick={onExit}>Salir</button></div>
        <div className="events-search"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar eventos..." /></div>
        <div className="events-user"><div className="events-avatar">{(username || "U").slice(0, 1).toUpperCase()}</div>{username || "Usuario"}</div>
      </div>

      <div className="events-layout">
        <aside>
          <div className="events-panel events-profile"><div className="events-profile-avatar">{(username || "U").slice(0, 1).toUpperCase()}</div><div><strong>{username || "Usuario"}</strong><span>Eventos de Inkorium</span></div></div>
          <div className="events-panel events-menu">
            <button className={tab === "descubrir" ? "active" : ""} onClick={() => setTab("descubrir")}><CalendarDays size={18}/>Descubrir</button>
            <button className={tab === "mis" ? "active" : ""} onClick={() => setTab("mis")}><Users size={18}/>Mis eventos</button>
            <button onClick={() => setModal(true)}><Plus size={18}/>Crear evento</button>
          </div>
        </aside>

        <main className="events-main">
          <div className="events-panel events-main-head">
            <div className="events-title-row"><div className="events-title"><CalendarDays size={24}/><h1>Eventos</h1></div><button className="events-create" onClick={() => setModal(true)}><Plus size={16}/>Crear evento</button></div>
            <div className="events-tabs"><button className={tab === "descubrir" ? "active" : ""} onClick={() => setTab("descubrir")}>Descubrir</button><button className={tab === "mis" ? "active" : ""} onClick={() => setTab("mis")}>Mis eventos</button></div>
          </div>
          <div className="events-panel" style={{ marginTop: 14 }}>
            <div className="events-toolbar">
              <div className="searchbox"><Search size={15} style={{ position: "absolute", left: 12, top: 11, color: "#8292a4" }} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre, lugar o ciudad..." /></div>
              <select className="events-filter" value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select>
              <div className="events-view-toggle"><button className={grid ? "active" : ""} onClick={() => setGrid(true)}><Grid2X2 size={16}/></button><button className={!grid ? "active" : ""} onClick={() => setGrid(false)}><List size={16}/></button></div>
            </div>
            <section className={grid ? "events-section" : "events-section events-list"}>
              {loading ? <div className="events-empty">Cargando eventos...</div> : error ? <div className="events-empty">{error}</div> : visible.length === 0 ? <div className="events-empty">No hay eventos para estos filtros.</div> : (
                <div className={grid ? "events-grid" : "events-upcoming"}>
                  {visible.map((event) => (
                    <article className="events-panel event-card" key={event.id}>
                      <div className="event-image"><img src={event.cover_url || "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80"} alt="" /><div className="event-date-badge">{formatDay(event.start_time)}<small>{formatMonth(event.start_time)}</small></div></div>
                      <div className="event-body"><h3>{event.name}</h3><div className="event-meta"><Clock3 size={12}/>{formatLongDate(event.start_time)}</div><div className="event-meta"><MapPin size={12}/>{event.location_name || "Ubicación por confirmar"}{event.city ? ` · ${event.city}` : ""}</div><div className="event-meta"><Users size={12}/>{event.attendee_count} apuntados{event.attendee_limit ? ` / ${event.attendee_limit}` : ""}</div><div className="event-actions"><button onClick={() => setSelected(event)}>Ver</button>{event.my_status === "going" ? <button className="primary" onClick={() => updateRsvp(event, "declined")}>Apuntado</button> : <button className="primary" onClick={() => updateRsvp(event, "going")}>Me apunto</button>}</div></div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        </main>

        <aside>
          <div className="events-panel right-panel">
            <div className="calendar-head"><button onClick={() => setMonthOffset((value) => value - 1)}><ChevronLeft size={16}/></button><div className="calendar-month">{monthName}</div><button onClick={() => setMonthOffset((value) => value + 1)}><ChevronRight size={16}/></button></div>
            <p className="calendar-note">Los eventos se cargan desde Supabase y respetan las reglas de privacidad de Inkorium.</p>
          </div>
          {notice ? <div className="events-panel right-panel" style={{ marginTop: 14, color: "#24613b", background: "#effaf2" }}>{notice}</div> : null}
        </aside>
      </div>

      {selected ? <div className="events-modal" onMouseDown={() => setSelected(null)}><div className="events-modal-card" onMouseDown={(event) => event.stopPropagation()}><div className="events-modal-head"><strong>{selected.name}</strong><button onClick={() => setSelected(null)}><X size={16}/></button></div><p style={{ color: muted, lineHeight: 1.5 }}>{selected.description || "Sin descripción."}</p><p className="event-meta"><Clock3 size={13}/>{formatLongDate(selected.start_time)}</p><p className="event-meta"><MapPin size={13}/>{selected.location_name || "Ubicación por confirmar"}{selected.city ? ` · ${selected.city}` : ""}</p><div className="event-actions"><button onClick={() => updateRsvp(selected, "maybe")}>Quizá</button>{selected.my_status === "going" ? <button className="primary" onClick={() => updateRsvp(selected, "declined")}>Cancelar</button> : <button className="primary" onClick={() => updateRsvp(selected, "going")}>Me apunto</button>}</div></div></div> : null}

      {modal ? <div className="events-modal" onMouseDown={() => setModal(false)}><form className="events-modal-card events-form" onMouseDown={(event) => event.stopPropagation()} onSubmit={createEvent}><div className="events-modal-head"><strong>Crear evento</strong><button type="button" onClick={() => setModal(false)}><X size={16}/></button></div><input name="title" placeholder="Nombre del evento" required /><textarea name="description" placeholder="Descripción" /><div className="events-form-grid"><input name="date" type="date" required /><input name="time" type="time" defaultValue="20:00" required /></div><div className="events-form-grid"><input name="location" placeholder="Lugar" /><input name="city" placeholder="Ciudad" /></div><div className="events-form-grid"><select name="category" defaultValue="Otros">{categories.slice(1).map((item) => <option key={item}>{item}</option>)}</select><select name="privacy" defaultValue="public"><option value="public">Público</option><option value="friends_only">Solo amigos</option><option value="private">Privado</option></select></div><button type="submit">Crear evento</button></form></div> : null}
    </div>
  );
}

export default EventsViewLive;
