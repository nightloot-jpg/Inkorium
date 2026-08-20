import { supabase } from "./lib/supabase";

const root = document.getElementById("root");

function showStatus(title: string, message: string, action?: { label: string; run: () => void }) {
  if (!root) return;
  root.innerHTML = "";
  const page = document.createElement("main");
  page.style.cssText = "min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:#f3f6fa;font-family:Arial,Helvetica,sans-serif;color:#344457";
  const card = document.createElement("section");
  card.style.cssText = "width:min(100%,420px);padding:28px;border:1px solid #e6ebf1;border-radius:10px;background:#fff;box-shadow:0 8px 30px rgba(23,55,90,.08);text-align:center";
  const heading = document.createElement("h1");
  heading.textContent = title;
  heading.style.cssText = "margin:0 0 10px;font-size:20px;color:#1f2e40";
  const text = document.createElement("p");
  text.textContent = message;
  text.style.cssText = "margin:0;color:#68788c;line-height:1.5";
  card.append(heading, text);
  if (action) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = action.label;
    button.style.cssText = "margin-top:18px;padding:10px 18px;border:0;border-radius:6px;background:#0754aa;color:#fff;font-weight:700;cursor:pointer";
    button.addEventListener("click", action.run);
    card.appendChild(button);
  }
  page.appendChild(card);
  root.appendChild(page);
}

async function mountApp() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    showStatus("No se pudo recuperar la sesión", "La aplicación no ha podido recuperar tu sesión de Inkorium. Puedes volver a intentarlo.", {
      label: "Reintentar",
      run: () => void mountApp(),
    });
    return;
  }

  if (data.session) {
    await import("./main.tsx");
    return;
  }

  showStatus("Sesión no encontrada", "Inkorium está cargado, pero no hay una sesión activa en este navegador. Inicia sesión de nuevo y vuelve a cargar la página.", {
    label: "Reintentar",
    run: () => void mountApp(),
  });
}

const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
  if (session && (event === "INITIAL_SESSION" || event === "SIGNED_IN" || event === "TOKEN_REFRESHED")) {
    void import("./main.tsx");
  }
});

void mountApp();

window.addEventListener("beforeunload", () => {
  authListener.subscription.unsubscribe();
});
