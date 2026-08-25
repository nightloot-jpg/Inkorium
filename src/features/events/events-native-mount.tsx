import { createRoot, type Root } from "react-dom/client";
import { EventsNativeView } from "./EventsNativeView";
import "./events-native-mount-2026.css";

const HOST_ID = "inkorium-events-native-host";
let root: Root | null = null;
let mounted = false;

function isEventsRoute() {
  return sessionStorage.getItem("inkorium-page") === "eventos";
}

function mount() {
  if (mounted || !isEventsRoute()) return;
  const app = document.querySelector<HTMLElement>("#root .feed-app");
  if (!app) return;
  const host = document.createElement("div");
  host.id = HOST_ID;
  app.appendChild(host);
  root = createRoot(host);
  root.render(<EventsNativeView />);
  document.body.classList.add("inkorium-events-native-active");
  mounted = true;
}

function unmount() {
  if (!mounted) return;
  root?.unmount();
  document.getElementById(HOST_ID)?.remove();
  document.body.classList.remove("inkorium-events-native-active");
  mounted = false;
  root = null;
}

function sync() {
  if (isEventsRoute()) mount();
  else unmount();
}

window.addEventListener("inkorium-route-change", sync);
window.addEventListener("hashchange", sync);
window.addEventListener("storage", sync);
window.setTimeout(sync, 0);
