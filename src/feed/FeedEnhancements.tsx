import { supabase } from "../lib/supabase";

const HOST_ID = "inkorium-feed-right-rail";
const STYLE_ID = "inkorium-feed-enhancements-style";

let calendarCursor = new Date();

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function initials(name: string): string {
  return name.trim().slice(0, 1).toUpperCase() || "U";
}

function avatar(name: string, url?: string | null): string {
  return url
    ? `<img src="${escapeHtml(url)}" alt="" />`
    : `<span class="inkorium-right-avatar-fallback">${escapeHtml(initials(name))}</span>`;
}

function statusMeta(value?: string | null) {
  if (value === "ausente") return { label: "Ausente", className: "away" };
  if (value === "desconectado") return { label: "Desconectado", className: "offline" };
  return { label: "Conectado", className: "online" };
}

function statusBadge(value?: string | null) {
  const meta = statusMeta(value);
  return `<span class="inkorium-user-status ${meta.className}"><span class="inkorium-user-status-dot"></span>${meta.label}</span>`;
}

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .feed-layout>.right-column.inkorium-right-column{display:block;min-width:0;width:auto}
    .inkorium-right-column .right-card{position:relative;padding:16px 14px;margin-bottom:12px;border:1px solid #d5dce3;border-radius:3px;background:#fff;box-shadow:0 1px 2px rgba(32,55,75,.06)}
    .inkorium-right-column .right-card>strong{display:block;margin:0 0 10px;color:#4e6376;font-size:12px;font-weight:700;text-transform:uppercase}
    .inkorium-right-column .inkorium-widget-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:9px}
    .inkorium-right-column .inkorium-widget-head strong{margin:0;color:#4e6376;font-size:12px;font-weight:700;text-transform:uppercase}
    .inkorium-right-column .inkorium-right-link{color:#1670b8;font-size:11px;text-decoration:none;white-space:nowrap}
    .inkorium-right-column .inkorium-right-link:hover{text-decoration:underline}
    .inkorium-right-column .inkorium-person-row{display:flex;align-items:center;gap:9px;padding:7px 0}
    .inkorium-right-column .inkorium-person-avatar{width:42px;height:42px;flex:0 0 42px;overflow:hidden;border-radius:3px;background:#e8eef5;display:grid;place-items:center;color:#1760b0;font-size:12px;font-weight:700}
    .inkorium-right-column .inkorium-person-avatar img{width:100%;height:100%;object-fit:cover}
    .inkorium-right-column .inkorium-person-copy{min-width:0;flex:1}
    .inkorium-right-column .inkorium-person-copy strong{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#1766ad;font-size:13px;font-weight:700}
    .inkorium-right-column .inkorium-person-copy span{display:block;color:#7b8a9b;font-size:11px;margin-top:3px;line-height:1.35}
    .inkorium-right-column .inkorium-user-status{display:inline-flex!important;align-items:center;gap:4px;color:#687b8e!important;font-weight:400}
    .inkorium-right-column .inkorium-user-status.online{color:#20aa5a!important}
    .inkorium-right-column .inkorium-user-status.away{color:#d49b20!important}
    .inkorium-right-column .inkorium-user-status.offline{color:#8794a0!important}
    .inkorium-right-column .inkorium-user-status-dot{width:7px;height:7px;border-radius:50%;display:inline-block;background:currentColor}
    .inkorium-right-column .inkorium-add-button{flex:0 0 auto;padding:7px 9px;border:1px solid #cfd8e0;border-radius:3px;background:#fff;color:#52677b;font:700 11px Arial,Helvetica,sans-serif;cursor:pointer}
    .inkorium-right-column .inkorium-add-button:hover{border-color:#8ca9bf;background:#f5f9fc;color:#1766ad}
    .inkorium-right-column .inkorium-add-button.sent{color:#6d7c89;background:#f5f7f9;cursor:default}
    .inkorium-right-column .inkorium-badge{flex:0 0 auto;padding:4px 7px;border-radius:3px;background:#edf3f8;color:#52708c;font-size:10px;font-weight:700}
    .inkorium-right-column .inkorium-widget-empty{margin:0;color:#7b8a9b;font-size:12px;line-height:1.45}
    .inkorium-right-column .inkorium-calendar-nav{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
    .inkorium-right-column .inkorium-calendar-month{color:#425a70;font-size:14px;font-weight:700;text-transform:capitalize}
    .inkorium-right-column .inkorium-calendar-nav button{width:24px;height:24px;border:1px solid #d5dce3;border-radius:2px;background:#fff;color:#60778c;font-size:14px;line-height:1;cursor:pointer}
    .inkorium-right-column .inkorium-calendar-nav button:hover{background:#edf3f8;color:#1766ad}
    .inkorium-right-column .inkorium-calendar{display:grid;grid-template-columns:repeat(7,1fr);gap:3px}
    .inkorium-right-column .inkorium-calendar .weekday{height:21px;color:#8a98a6;font-size:9px;font-weight:700;text-align:center;text-transform:uppercase}
    .inkorium-right-column .inkorium-calendar .day{position:relative;display:grid;place-items:center;height:27px;color:#52677b;font-size:11px;border:1px solid transparent;border-radius:2px}
    .inkorium-right-column .inkorium-calendar .day.muted{color:#bdc5cc}
    .inkorium-right-column .inkorium-calendar .day.today{background:#2f6fae;color:#fff;font-weight:700}
    .inkorium-right-column .inkorium-calendar .day.event-day:not(.today){border-color:#9bbbd4;color:#1766ad;font-weight:700}
    .inkorium-right-column .inkorium-calendar .day.event-day::after{content:"";position:absolute;bottom:2px;width:4px;height:4px;border-radius:50%;background:#2f6fae}
    .inkorium-right-column .inkorium-calendar .day.today::after{background:#fff}
    .inkorium-right-column .inkorium-calendar-help{margin:9px 0 0;color:#8a98a6;font-size:10px}
    .inkorium-right-column .inkorium-footer{padding:12px 14px;color:#788797;font-size:11px;line-height:1.8}
    .inkorium-right-column .inkorium-footer a{color:#6f8295;text-decoration:none;margin-right:8px}
    .inkorium-right-column .inkorium-footer a:hover{color:#1766ad}
    .post-menu-toggle{visibility:visible!important;opacity:1!important;position:relative;z-index:4}
    @media(max-width:1100px){.feed-layout>.right-column.inkorium-right-column{display:none!important}}
  `;
  document.head.appendChild(style);
}

function getMonthDays(cursor: Date) {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const mondayOffset = (firstDay + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();
  const cells: Array<{ day: number; muted: boolean; iso: string }> = [];

  for (let i = mondayOffset - 1; i >= 0; i--) {
    const day = prevDays - i;
    const date = new Date(year, month - 1, day);
    cells.push({ day, muted: true, iso: date.toISOString().slice(0, 10) });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    cells.push({ day, muted: false, iso: date.toISOString().slice(0, 10) });
  }

  let nextDay = 1;
  while (cells.length < 42) {
    const date = new Date(year, month + 1, nextDay);
    cells.push({ day: nextDay++, muted: true, iso: date.toISOString().slice(0, 10) });
  }

  return cells;
}

function renderCalendar(cursor: Date, eventDates: Set<string>) {
  const monthName = cursor.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
  const cells = getMonthDays(cursor);
  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10);
  const weekdays = ["L", "M", "X", "J", "V", "S", "D"];

  return `
    <section class="right-card calendar panel">
      <div class="inkorium-widget-head"><strong>Calendario</strong><a class="inkorium-right-link" href="#eventos">Ver todos</a></div>
      <div class="inkorium-calendar-nav">
        <button type="button" data-calendar-prev aria-label="Mes anterior">‹</button>
        <span class="inkorium-calendar-month">${escapeHtml(monthName)}</span>
        <button type="button" data-calendar-next aria-label="Mes siguiente">›</button>
      </div>
      <div class="inkorium-calendar">
        ${weekdays.map((day) => `<span class="weekday">${day}</span>`).join("")}
        ${cells.map((cell) => {
          const classes = ["day", cell.muted ? "muted" : "", cell.iso === todayIso ? "today" : "", eventDates.has(cell.iso) ? "event-day" : ""].filter(Boolean).join(" ");
          return `<span class="${classes}">${cell.day}</span>`;
        }).join("")}
      </div>
      <p class="inkorium-calendar-help">Los días con eventos aparecen marcados.</p>
    </section>
  `;
}

async function renderRightRail(host: HTMLElement, userId: string) {
  const friendsResult = await supabase
    .from("friendships")
    .select("id, friend_id, profiles:friend_id(id, username, full_name, avatar_url, user_status)")
    .eq("user_id", userId)
    .eq("status", "accepted")
    .limit(20);

  const friends = friendsResult.data ?? [];
  const friendIds = friends.map((row: any) => row.friend_id).filter(Boolean);

  const [profilesResult, eventsResult] = await Promise.all([
    supabase.from("profiles").select("id, username, full_name, avatar_url, user_status").limit(30),
    supabase.from("events").select("id, name, start_time").gte("start_time", new Date().toISOString()).order("start_time", { ascending: true }).limit(20),
  ]);

  const profiles = (profilesResult.data ?? []).filter((profile: any) => profile.id !== userId && !friendIds.includes(profile.id)).slice(0, 3);
  const events = eventsResult.data ?? [];
  const eventDates = new Set(events.map((event: any) => new Date(event.start_time).toISOString().slice(0, 10)));

  const renderSuggestions = () => profiles.length
    ? profiles.map((profile: any) => {
        const name = profile.full_name || profile.username || "Usuario";
        return `<div class="inkorium-person-row"><div class="inkorium-person-avatar">${avatar(name, profile.avatar_url)}</div><div class="inkorium-person-copy"><strong>${escapeHtml(name)}</strong><span>Quizá conozcas a esta persona</span></div><button type="button" class="inkorium-add-button" data-add-friend="${escapeHtml(profile.id)}">Añadir</button></div>`;
      }).join("")
    : `<p class="inkorium-widget-empty">No hay sugerencias nuevas.</p>`;

  const renderConnected = () => friends.length
    ? friends.slice(0, 6).map((row: any) => {
        const profile = row.profiles;
        const name = profile?.full_name || profile?.username || "Usuario";
        return `<div class="inkorium-person-row"><div class="inkorium-person-avatar">${avatar(name, profile?.avatar_url)}</div><div class="inkorium-person-copy"><strong>${escapeHtml(name)}</strong>${statusBadge(profile?.user_status)}</div></div>`;
      }).join("")
    : `<p class="inkorium-widget-empty">Todavía no tienes amigos conectados.</p>`;

  host.innerHTML = `
    <section class="right-card panel">
      <div class="inkorium-widget-head"><strong>Personas que quizá conozcas</strong><a class="inkorium-right-link" href="#personas">Ver todas</a></div>
      ${renderSuggestions()}
    </section>
    <section class="right-card panel">
      <div class="inkorium-widget-head"><strong>Personas conectadas (${friends.length})</strong><a class="inkorium-right-link" href="#personas">Ver todas</a></div>
      ${renderConnected()}
    </section>
    ${renderCalendar(calendarCursor, eventDates)}
    <section class="right-card panel inkorium-footer">
      <div><a href="#idioma">Español</a><a href="#privacidad">Privacidad</a><a href="#condiciones">Condiciones</a><a href="#ayuda">Ayuda</a></div>
      <div>Inkorium © 2026</div>
    </section>
  `;

  host.querySelector("[data-calendar-prev]")?.addEventListener("click", () => {
    calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() - 1, 1);
    void renderRightRail(host, userId);
  });

  host.querySelector("[data-calendar-next]")?.addEventListener("click", () => {
    calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() + 1, 1);
    void renderRightRail(host, userId);
  });

  host.querySelectorAll<HTMLButtonElement>("[data-add-friend]").forEach((button) => {
    button.addEventListener("click", async () => {
      const friendId = button.dataset.addFriend;
      if (!friendId || button.disabled) return;
      button.disabled = true;
      const { error } = await supabase.from("friendships").insert({ user_id: userId, friend_id: friendId, status: "pending" });
      if (error) {
        button.disabled = false;
        return;
      }
      button.textContent = "Enviada";
      button.classList.add("sent");
    });
  });
}

function sync() {
  const shell = document.querySelector(".feed-app");
  const layout = document.querySelector(".feed-layout");
  if (!shell || !layout || !document.querySelector(".stream")) {
    document.getElementById(HOST_ID)?.remove();
    return;
  }

  ensureStyles();
  let host = document.getElementById(HOST_ID) as HTMLElement | null;
  if (!host) {
    host = document.createElement("aside");
    host.id = HOST_ID;
    host.className = "right-column inkorium-right-column";
    layout.appendChild(host);
  }

  void supabase.auth.getSession().then(({ data }) => {
    if (data.session && document.getElementById(HOST_ID)) {
      void renderRightRail(host!, data.session.user.id);
    }
  });
}

new MutationObserver(sync).observe(document.body, { childList: true, subtree: true });
sync();
