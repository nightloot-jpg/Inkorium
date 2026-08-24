const PROFILE_EVENTS_SCRIPT_ID = "inkorium-profile-events-more-script";
const PROFILE_EVENTS_STYLE_ID = "inkorium-profile-events-more-style";

function normalizeText(value: string | null | undefined): string {
  return (value || "").replace(/\s+/g, " ").trim();
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
      margin-bottom: 8px !important;
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

function findProfileSide(page: HTMLElement): HTMLElement | null {
  const listening = page.querySelector<HTMLElement>(".profile-view-listening");
  const listeningCard = listening?.closest<HTMLElement>(".profile-view-card");
  if (listeningCard?.parentElement) return listeningCard.parentElement;
  const grid = page.querySelector<HTMLElement>(".profile-view-grid");
  return grid?.lastElementChild as HTMLElement | null;
}

function ensureEventsCard(page: HTMLElement): HTMLElement | null {
  const existing = page.querySelector<HTMLElement>(".profile-view-events-card");
  if (existing) return existing;

  const side = findProfileSide(page);
  if (!side) return null;

  const card = document.createElement("div");
  card.className = "profile-view-card profile-view-events-card";
  card.innerHTML = `
    <div class="profile-view-section-head">
      <h2>Próximos eventos</h2>
      <button type="button" class="profile-view-events-more" aria-label="Ver todos los eventos" title="Ver todos los eventos">+</button>
    </div>
    <div class="profile-view-events-empty">No hay próximos eventos.</div>
  `;
  side.appendChild(card);
  card.querySelector<HTMLButtonElement>(".profile-view-events-more")?.addEventListener("click", navigateToEvents);
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
