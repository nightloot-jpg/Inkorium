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

function enhanceUpcomingEvents() {
  const page = document.querySelector<HTMLElement>(".profile-view-page");
  if (!page) return;

  const heading = Array.from(page.querySelectorAll<HTMLElement>("h2,h3,h4,strong"))
    .find((node) => normalizeText(node.textContent).toLowerCase().includes("próximos eventos"));
  if (!heading) return;

  let container: HTMLElement | null = heading.parentElement;
  let target: HTMLElement | null = null;
  while (container && container !== page) {
    target = Array.from(container.querySelectorAll<HTMLElement>("a,button"))
      .find((node) => normalizeText(node.textContent).toLowerCase() === "ver todos") || null;
    if (target) break;
    container = container.parentElement;
  }
  if (!target || target.dataset.inkoriumEventsMore === "1") return;

  installStyles();
  target.dataset.inkoriumEventsMore = "1";
  target.classList.add("profile-view-events-more");
  target.setAttribute("aria-label", "Ver todos los eventos");
  target.setAttribute("title", "Ver todos los eventos");
  target.textContent = "+";
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
