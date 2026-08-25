import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, UserPlus } from 'lucide-react';
import { loadFeedRightRail, sendFriendRequest, type FeedRailEvent, type FeedRailFriend, type FeedRailProfile } from './feed-right-rail.service';
import './feed-right-rail.css';

type Props = { userId: string; onNavigate?: (page: string) => void };

const statusMeta = (value?: string | null) => value === 'ausente' ? { label: 'Ausente', className: 'away' } : value === 'desconectado' ? { label: 'Desconectado', className: 'offline' } : { label: 'Conectado', className: 'online' };
const displayName = (profile?: FeedRailProfile | null) => profile?.full_name || profile?.username || 'Usuario';

function Avatar({ profile }: { profile?: FeedRailProfile | null }) {
  const name = displayName(profile);
  return profile?.avatar_url ? <img className="feed-rail-avatar" src={profile.avatar_url} alt="" /> : <span className="feed-rail-avatar feed-rail-avatar-fallback">{name.slice(0, 1).toUpperCase()}</span>;
}

function Calendar({ events }: { events: FeedRailEvent[] }) {
  const [cursor, setCursor] = useState(() => new Date());
  const eventDates = useMemo(() => new Set(events.map(event => new Date(event.start_time).toISOString().slice(0, 10))), [events]);
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  const total = new Date(year, month + 1, 0).getDate();
  const previousTotal = new Date(year, month, 0).getDate();
  const cells = Array.from({ length: 42 }, (_, index) => {
    const dayIndex = index - offset + 1;
    const date = dayIndex < 1 ? new Date(year, month - 1, previousTotal + dayIndex) : dayIndex > total ? new Date(year, month + 1, dayIndex - total) : new Date(year, month, dayIndex);
    return { date, muted: dayIndex < 1 || dayIndex > total };
  });
  const today = new Date().toISOString().slice(0, 10);
  return <section className="feed-rail-card">
    <div className="feed-rail-card-head"><strong>Calendario</strong><button type="button" onClick={() => {}} className="feed-rail-link" aria-label="Ver eventos">Ver todos</button></div>
    <div className="feed-rail-calendar-nav"><button type="button" onClick={() => setCursor(new Date(year, month - 1, 1))}><ChevronLeft size={14}/></button><strong>{cursor.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</strong><button type="button" onClick={() => setCursor(new Date(year, month + 1, 1))}><ChevronRight size={14}/></button></div>
    <div className="feed-rail-calendar-grid">{['L','M','X','J','V','S','D'].map(day => <span className="weekday" key={day}>{day}</span>)}{cells.map(({ date, muted }) => { const iso = date.toISOString().slice(0, 10); return <span key={iso} className={`day${muted ? ' muted' : ''}${iso === today ? ' today' : ''}${eventDates.has(iso) ? ' event' : ''}`}>{date.getDate()}</span>; })}</div>
    <p className="feed-rail-help">Los días con eventos aparecen marcados.</p>
  </section>;
}

export function FeedRightRail({ userId, onNavigate }: Props) {
  const [friends, setFriends] = useState<FeedRailFriend[]>([]);
  const [suggestions, setSuggestions] = useState<FeedRailProfile[]>([]);
  const [events, setEvents] = useState<FeedRailEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [sent, setSent] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let active = true;
    setLoading(true);
    void loadFeedRightRail(userId).then(result => { if (!active) return; setFriends(result.friends); setSuggestions(result.suggestions); setEvents(result.events); }).catch(() => {}).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [userId]);

  const addFriend = async (friendId: string) => {
    if (sent[friendId]) return;
    setSent(current => ({ ...current, [friendId]: true }));
    try { await sendFriendRequest(userId, friendId); } catch { setSent(current => ({ ...current, [friendId]: false })); }
  };

  return <aside className="feed-right-rail" aria-label="Información del feed">
    <section className="feed-rail-card">
      <div className="feed-rail-card-head"><strong>Personas que quizá conozcas</strong><button type="button" className="feed-rail-link" onClick={() => onNavigate?.('personas')}>Ver todas</button></div>
      {loading ? <p className="feed-rail-empty">Cargando…</p> : suggestions.length ? suggestions.map(profile => <div className="feed-rail-person" key={profile.id}><Avatar profile={profile}/><div className="feed-rail-person-copy"><strong>{displayName(profile)}</strong><span>Quizá conozcas a esta persona</span></div><button type="button" className="feed-rail-add" onClick={() => void addFriend(profile.id)} disabled={sent[profile.id]}>{sent[profile.id] ? 'Enviada' : <><UserPlus size={13}/> Añadir</>}</button></div>) : <p className="feed-rail-empty">No hay sugerencias nuevas.</p>}
    </section>

    <section className="feed-rail-card">
      <div className="feed-rail-card-head"><strong>Personas conectadas ({friends.length})</strong><button type="button" className="feed-rail-link" onClick={() => onNavigate?.('personas')}>Ver todas</button></div>
      {loading ? <p className="feed-rail-empty">Cargando…</p> : friends.length ? friends.slice(0, 6).map(friend => { const profile = friend.profile; const status = statusMeta(profile?.user_status); return <div className="feed-rail-person" key={friend.id}><Avatar profile={profile}/><div className="feed-rail-person-copy"><strong>{displayName(profile)}</strong><span className={`feed-rail-status ${status.className}`}><i/> {status.label}</span></div></div>; }) : <p className="feed-rail-empty">Todavía no tienes amigos conectados.</p>}
    </section>

    <Calendar events={events}/>

    <section className="feed-rail-footer"><div><button type="button">Español</button><button type="button">Privacidad</button><button type="button">Condiciones</button><button type="button">Ayuda</button></div><small>Inkorium © 2026</small></section>
  </aside>;
}
