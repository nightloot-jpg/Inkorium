import { supabase } from '../../lib/supabase';

const PROFILE_EVENTS_SCRIPT_ID = "inkorium-profile-events-more-script";
const PROFILE_EVENTS_STYLE_ID = "inkorium-profile-events-more-style";

function normalizeText(value: string | null | undefined): string {
  return (value || "").replace(/\s+/g, " ").trim();
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatEventDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function installStyles() {
  if (document.getElementById(PROFILE_EVENTS_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = PROFILE_EVENTS_STYLE_ID;
  style.textContent = `
    .profile-view-events-card {
      display: block !important;
      margin-top: 16px !important;
      padding: 16px !important;
      background: #fff !important;
      border: 1px solid #dfe6ee !important;
      border-radius: 9px !important;
      box-sizing: border-box !important;
    }
    .profile-view-events-card .profile-view-section-head {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      gap: 12px !important;
      margin-bottom: 10px !important;
    }
    .profile-view-events-card .profile-view-section-head h2 {
      margin: 0 !important;
      color: #17385c !important;
      font-size: 18px !important;
      line-height: 1.2 !important;
    }
    .profile-view-events-empty {
      color: #506b86 !important;
      font-size: 14px !important;
      line-height: 1.45 !important;
      padding-top: 2px !important;
    }
    .profile-view-events-list {
      display: grid !important;
      gap: 8px !important;
    }
    .profile-view-event-row {
      display: flex !important;
      align-items: center !important;
      gap: 10px !important;
      padding: 8px 0 !important;
      border-top: 1px solid #edf1f5 !important;
    }
    .profile-view-event-row:first-child { border-top: 0 !important; }
    .profile-view-event-date {
      min-width: 72px !important;
      color: #5b2db5 !important;
      font-size: 11px !important;
      font-weight: 700 !important;
      text-transform: capitalize !important;
    }
    .profile-view-event-copy { min-width: 0 !important; flex: 1 !important; }
    .profile-view-event-copy strong {
      display: block !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      white-space: nowrap !important;
      color: #1d3956 !important;
      font-size: 13px !important;
    }
    .profile-view-event-copy span {
      display: block !important;
      margin-top: 2px !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      white-space: nowrap !important;
      color: #718096 !important;
      font-size: 11px !important;
    }
    .profile-view-events-more {
      width: 32px !important;
      height: 32px !important;
      min-width: 32px !important;
      padding: 0 !important;
      display: inline-grid !important;
      place-items: center !important;
      border: 1px solid #d7e0e9 !important;
      border-radius: 7px !important;
      background: #fff !important;
      color: #315a80 !important;
      font-size: 24px !important;
      font-weight: 400 !important;
      line-height: 1 !important;
      text-decoration: none !important;
      cursor: pointer !important;
      box-sizing: border-box !important;
    }
    .profile-view-events-more:hover {
      background: #f7fafc !important;
      border-color: #bfd0df !important;
    }
  `;
  document.head.appendChild(style);
}

function navigateToEvents() {
  try {
    sessionStorage.setItem("inkorium-page", "eventos");
    sessionStorage.removeItem("inkorium-route-params");
  } catch {
    // Ignore storage failures and still dispatch the route event.
  }
  window.history.replaceState({}, "", `${window.location.pathname}#eventos`);
  window.dispatchEvent(new CustomEvent("inkorium-route-change", { detail: { page: "eventos" } }));
}

function findProfileSide(page: HTMLElement): { side: HTMLElement; listeningCard: HTMLElement | null } | null {
  const listening = page.querySelector<HTMLElement>(".profile-view-listening");
  const listeningCard = listening?.closest<HTMLElement>(".profile-view-card") || null;
  if (listeningCard?.parentElement) return { side: listeningCard.parentElement, listeningCard };
  const grid = page.querySelector<HTMLElement>(".profile-view-grid");
  const side = grid?.lastElementChild as HTMLElement | null;
  return side ? { side, listeningCard: null } : null;
}

async function getUpcomingEvents(page: HTMLElement) {
  const handle = normalizeText(page.querySelector(".profile-view-handle")?.textContent).replace(/^@/, "");
  if (!handle) return [];

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", handle)
    .maybeSingle();

  if (!profile?.id) return [];

  const { data } = await supabase
    .from("events")
    .select("id, name, location_name, start_time")
    .eq("creator_id", profile.id)
    .gte("start_time", new Date().toISOString())
    .order("start_time", { ascending: true })
    .limit(3);

  return data || [];
}

async function renderEvents(card: HTMLElement, page: HTMLElement) {
  const target = card.querySelector<HTMLElement>(".profile-view-events-content");
  if (!target) return;

  target.innerHTML = `<div class="profile-view-events-empty">Cargando próximos eventos…</div>`;
  const events = await getUpcomingEvents(page);

  if (!events.length) {
    target.innerHTML = `<div class="profile-view-events-empty">No hay próximos eventos.</div>`;
    return;
  }

  target.innerHTML = `<div class="profile-view-events-list">${events.map((event: any) => `
    <div class="profile-view-event-row">
      <div class="profile-view-event-date">${escapeHtml(formatEventDate(event.start_time))}</div>
      <div class="profile-view-event-copy">
        <strong>${escapeHtml(event.name)}</strong>
        <span>${escapeHtml(event.location_name || "Ubicación por confirmar")}</span>
      </div>
    </div>
  `).join("")}</div>`;
}

function ensureEventsCard(page: HTMLElement): HTMLElement | null {
  const existing = page.querySelector<HTMLElement>(".profile-view-events-card");
  if (existing) return existing;

  const target = findProfileSide(page);
  if (!target) return null;

  const card = document.createElement("div");
  card.className = "profile-view-card profile-view-events-card";
  card.innerHTML = `
    <div class="profile-view-section-head">
      <h2>Próximos eventos</h2>
      <button type="button" class="profile-view-events-more" aria-label="Ver todos los eventos" title="Ver todos los eventos">+</button>
    </div>
    <div class="profile-view-events-content"><div class="profile-view-events-empty">Cargando próximos eventos…</div></div>
  `;

  if (target.listeningCard?.parentElement === target.side) {
    target.listeningCard.insertAdjacentElement("afterend", card);
  } else {
    target.side.appendChild(card);
  }

  card.querySelector<HTMLButtonElement>(".profile-view-events-more")?.addEventListener("click", navigateToEvents);
  void renderEvents(card, page);
  return card;
}

function enhanceUpcomingEvents() {
  const page = document.querySelector<HTMLElement>(".profile-view-page");
  if (!page) return;

  installStyles();
  const card = ensureEventsCard(page);
  if (!card) return;

  const target = card.querySelector<HTMLButtonElement>(".profile-view-events-more");
  if (!target) return;
  target.dataset.inkoriumEventsMore = "1";
  target.setAttribute("aria-label", "Ver todos los eventos");
  target.setAttribute("title", "Ver todos los eventos");
}

function syncUpcomingEvents() {
  enhanceUpcomingEvents();
}

if (!document.getElementById(PROFILE_EVENTS_SCRIPT_ID)) {
  const marker = document.createElement("meta");
  marker.id = PROFILE_EVENTS_SCRIPT_ID;
  document.head.appendChild(marker);
  new MutationObserver(syncUpcomingEvents).observe(document.body, { childList: true, subtree: true });
  syncUpcomingEvents();
}
