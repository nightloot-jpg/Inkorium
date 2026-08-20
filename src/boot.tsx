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

function showLogin() {
  if (!root) return;
  root.innerHTML = "";

  const page = document.createElement("main");
  page.style.cssText = "min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:#f3f6fa;font-family:Arial,Helvetica,sans-serif;color:#344457";

  const card = document.createElement("section");
  card.style.cssText = "width:min(100%,380px);padding:28px;border:1px solid #e6ebf1;border-radius:10px;background:#fff;box-shadow:0 8px 30px rgba(23,55,90,.08)";

  const heading = document.createElement("h1");
  heading.textContent = "Iniciar sesión";
  heading.style.cssText = "margin:0 0 6px;font-size:20px;color:#1f2e40;text-align:center";

  const subtext = document.createElement("p");
  subtext.textContent = "No hay ninguna sesión activa de Inkorium en este navegador. Inicia sesión para continuar.";
  subtext.style.cssText = "margin:0 0 20px;color:#68788c;line-height:1.5;text-align:center;font-size:14px";

  const form = document.createElement("form");
  form.style.cssText = "display:flex;flex-direction:column;gap:12px";

  const inputStyle = "padding:11px 12px;border:1px solid #d7dfe8;border-radius:6px;font-size:14px;font-family:inherit;color:#1f2e40;outline:none";

  const emailInput = document.createElement("input");
  emailInput.type = "email";
  emailInput.name = "email";
  emailInput.placeholder = "Correo electrónico";
  emailInput.required = true;
  emailInput.autocomplete = "email";
  emailInput.style.cssText = inputStyle;

  const passwordInput = document.createElement("input");
  passwordInput.type = "password";
  passwordInput.name = "password";
  passwordInput.placeholder = "Contraseña";
  passwordInput.required = true;
  passwordInput.autocomplete = "current-password";
  passwordInput.style.cssText = inputStyle;

  const errorText = document.createElement("p");
  errorText.style.cssText = "margin:0;color:#c0392b;font-size:13px;line-height:1.4;display:none";

  const submitButton = document.createElement("button");
  submitButton.type = "submit";
  submitButton.textContent = "Entrar";
  submitButton.style.cssText = "margin-top:6px;padding:11px 18px;border:0;border-radius:6px;background:#0754aa;color:#fff;font-weight:700;cursor:pointer;font-size:14px";

  form.append(emailInput, passwordInput, errorText, submitButton);
  card.append(heading, subtext, form);
  page.appendChild(card);
  root.appendChild(page);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    errorText.style.display = "none";
    submitButton.disabled = true;
    submitButton.textContent = "Entrando…";

    void supabase.auth
      .signInWithPassword({ email: emailInput.value.trim(), password: passwordInput.value })
      .then(({ error }) => {
        if (error) {
          errorText.textContent =
            error.message === "Invalid login credentials"
              ? "Correo o contraseña incorrectos."
              : "No se ha podido iniciar sesión. Inténtalo de nuevo.";
          errorText.style.display = "block";
          submitButton.disabled = false;
          submitButton.textContent = "Entrar";
          return;
        }
        // onAuthStateChange (SIGNED_IN) se encarga de cargar la app.
      });
  });
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

  showLogin();
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
