import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { EventsView } from "./EventsView";

const HOST_ID = "inkorium-events-fallback";

class EventsFallbackBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[Inkorium Events] render error", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{ minHeight: "100vh", padding: 32, boxSizing: "border-box", background: "#f3f6fa", fontFamily: "Arial,Helvetica,sans-serif", color: "#26364d" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", background: "#fff", border: "1px solid #e4e7ee", borderRadius: 8, padding: 24 }}>
          <h2 style={{ margin: "0 0 8px" }}>No se ha podido cargar Eventos</h2>
          <p style={{ margin: 0, color: "#66788b" }}>{this.state.error.message}</p>
        </div>
      </div>
    );
  }
}

function isEventsRoute(): boolean {
  const hash = window.location.hash.replace(/^#/, "").replace(/\/+$/, "").toLowerCase();
  const path = window.location.pathname.replace(/\/+$/, "").split("/").pop()?.toLowerCase() || "";
  const stored = sessionStorage.getItem("inkorium-page")?.trim().toLowerCase() || "";
  return hash === "eventos" || path === "eventos" || stored === "eventos";
}

function findEventsTarget(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Element)) return null;
  const direct = target.closest("button, a, [role=\"button\"], [data-page], [data-route], [aria-label], [title]");
  if (!(direct instanceof HTMLElement)) return null;

  const values = [
    direct.textContent || "",
    direct.getAttribute("data-page") || "",
    direct.getAttribute("data-route") || "",
    direct.getAttribute("aria-label") || "",
    direct.getAttribute("title") || "",
    direct.getAttribute("href") || "",
  ].map((value) => value.replace(/\s+/g, " ").trim().toLowerCase());

  return values.some((value) => value === "eventos" || value === "eventos/" || value.endsWith("/eventos") || value.endsWith("#eventos")) ? direct : null;
}

export function mountEventsFallback() {
  let host = document.getElementById(HOST_ID);
  let root: Root | null = null;

  const hide = () => {
    host?.remove();
    host = null;
    root = null;
  };

  const show = () => {
    if (!host) {
      host = document.createElement("div");
      host.id = HOST_ID;
      host.style.cssText = "position:fixed;inset:0;z-index:20000;overflow:auto;background:#f3f6fa";
      document.body.appendChild(host);
    }
    if (!root) root = createRoot(host);
    root.render(
      <EventsFallbackBoundary>
        <EventsView
          username="Usuario"
          session={null}
          onExit={() => {
            sessionStorage.setItem("inkorium-page", "inicio");
            window.history.replaceState({}, "", window.location.pathname);
            hide();
            window.dispatchEvent(new Event("inkorium-route-change"));
          }}
        />
      </EventsFallbackBoundary>,
    );
  };

  const sync = () => {
    if (isEventsRoute()) show();
    else hide();
  };

  const onClick = (event: MouseEvent) => {
    const target = findEventsTarget(event.target);
    if (!target) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    sessionStorage.setItem("inkorium-page", "eventos");
    if (window.location.hash !== "#eventos") window.location.hash = "eventos";
    show();
  };

  document.addEventListener("click", onClick, true);
  window.addEventListener("hashchange", sync);
  window.addEventListener("popstate", sync);
  window.addEventListener("inkorium-route-change", sync);
  sync();
}

mountEventsFallback();
