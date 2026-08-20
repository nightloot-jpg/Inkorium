import { supabase } from "./lib/supabase";

const root = document.getElementById("root");

function showStatus(title: string, message: string, action?: { label: string; run: () => void }) {
  if (!root) return;
  root.innerHTML = "";
  const page = document.createElement("main");
  page.style.cssText = "min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:#73AED1;font-family:Arial,Helvetica,sans-serif;color:#344457";
  const card = document.createElement("section");
  card.style.cssText = "width:min(100%,420px);padding:28px;border:1px solid rgba(255,255,255,.55);border-radius:4px;background:#fff;box-shadow:0 8px 24px rgba(23,55,90,.18);text-align:center";
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
    button.style.cssText = "margin-top:18px;padding:10px 18px;border:1px solid #5f98bf;border-radius:2px;background:#6FA0C9;color:#fff;font-weight:700;cursor:pointer";
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
  page.style.cssText = "min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:34px 20px 44px;background:#73AED1;font-family:Arial,Helvetica,sans-serif;box-sizing:border-box";

  const brand = document.createElement("div");
  brand.style.cssText = "display:flex;align-items:center;gap:10px;margin-bottom:10px";

  const logoImg = document.createElement("img");
  logoImg.src = "/inkorium-logo-white.svg";
  logoImg.alt = "Inkorium";
  logoImg.style.cssText = "width:52px;height:52px;display:block";

  const wordmark = document.createElement("span");
  wordmark.textContent = "inkorium";
  wordmark.style.cssText = "font-size:34px;font-weight:800;color:#fff;letter-spacing:-1.1px";

  brand.append(logoImg, wordmark);

  const card = document.createElement("section");
  card.style.cssText = "width:min(100%,500px);border:1px solid rgba(255,255,255,.45);border-radius:3px;background:#fff;box-shadow:0 10px 24px rgba(24,59,86,.16);overflow:hidden";

  const bar = document.createElement("div");
  bar.style.cssText = "padding:7px 10px;background:linear-gradient(#d9ecf6,#c7e1ee);border-bottom:1px solid #b9cbd6;color:#51616e;font-size:13px;font-weight:700";
  bar.textContent = "Entrar";

  const inner = document.createElement("div");
  inner.style.cssText = "padding:28px 40px 22px";

  const form = document.createElement("form");
  form.style.cssText = "display:flex;flex-direction:column;gap:15px";

  const row = (labelText: string, type: string, autocomplete: string) => {
    const wrap = document.createElement("div");
    wrap.style.cssText = "display:grid;grid-template-columns:125px minmax(0,1fr);align-items:center;gap:12px";
    const label = document.createElement("label");
    label.textContent = labelText;
    label.style.cssText = "font-size:13px;text-align:right;color:#6C7782;font-weight:700";
    const input = document.createElement("input");
    input.type = type;
    input.autocomplete = autocomplete;
    input.required = true;
    input.style.cssText = "height:34px;padding:0 9px;border:1px solid #C7D1D9;border-radius:2px;background:#fff;box-sizing:border-box;width:100%;font:13px Arial,sans-serif;color:#4A5968;outline:none;box-shadow:inset 0 1px 2px rgba(0,0,0,.04)";
    wrap.append(label, input);
    return { wrap, input };
  };

  const emailField = row("E-mail", "email", "email");
  const passwordField = row("Contraseña", "password", "current-password");

  const optionsRow = document.createElement("div");
  optionsRow.style.cssText = "display:flex;align-items:center;justify-content:flex-end;gap:10px;margin-left:137px;font-size:12px;color:#83919e";
  const rememberLabel = document.createElement("label");
  rememberLabel.style.cssText = "display:flex;align-items:center;gap:6px;cursor:pointer";
  const rememberCheckbox = document.createElement("input");
  rememberCheckbox.type = "checkbox";
  rememberCheckbox.checked = true;
  rememberCheckbox.style.cssText = "width:14px;height:14px;accent-color:#4c91ba;cursor:pointer";
  const rememberText = document.createElement("span");
  rememberText.textContent = "Recordarme en este equipo";
  rememberLabel.append(rememberCheckbox, rememberText);
  optionsRow.appendChild(rememberLabel);

  const errorText = document.createElement("p");
  errorText.style.cssText = "margin:0;color:#c0392b;font-size:12px;line-height:1.4;text-align:center;display:none";

  const submitWrap = document.createElement("div");
  submitWrap.style.cssText = "display:flex;justify-content:flex-start;margin-left:137px";
  const submitButton = document.createElement("button");
  submitButton.type = "submit";
  submitButton.textContent = "Entrar";
  submitButton.style.cssText = "min-width:92px;height:34px;padding:0 18px;border:1px solid #5e8eaf;border-radius:2px;background:#6EA4CB;color:#fff;font-weight:700;font-size:13px;cursor:pointer;box-shadow:inset 0 1px rgba(255,255,255,.25)";
  submitWrap.appendChild(submitButton);

  const footerBar = document.createElement("div");
  footerBar.style.cssText = "padding:7px 10px;border-top:1px solid #dde5ea;background:#f2f4f5;text-align:center;font-size:12px;color:#6f8392";
  const forgotLink = document.createElement("a");
  forgotLink.href = "#";
  forgotLink.textContent = "¿Tienes problemas para entrar?";
  forgotLink.style.cssText = "color:#5c96bd;text-decoration:none";
  footerBar.appendChild(forgotLink);

  const bottomLink = document.createElement("a");
  bottomLink.href = "#";
  bottomLink.textContent = "¿Has olvidado tu contraseña?";
  bottomLink.style.cssText = "display:block;margin-top:16px;color:#DDECF5;font-size:12px;text-decoration:none";

  form.append(emailField.wrap, passwordField.wrap, optionsRow, errorText, submitWrap);
  inner.appendChild(form);
  card.append(bar, inner, footerBar);
  page.append(brand, card, bottomLink);
  root.appendChild(page);

  const setBusy = (busy: boolean, label: string) => {
    submitButton.disabled = busy;
    submitButton.textContent = label;
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    errorText.style.display = "none";
    errorText.style.color = "#c0392b";
    setBusy(true, "Entrando…");
    void supabase.auth
      .signInWithPassword({ email: emailField.input.value.trim(), password: passwordField.input.value })
      .then(({ error }) => {
        if (error) {
          errorText.textContent = error.message === "Invalid login credentials" ? "Correo o contraseña incorrectos." : "No se ha podido iniciar sesión. Inténtalo de nuevo.";
          errorText.style.display = "block";
          setBusy(false, "Entrar");
          return;
        }
      });
  });

  const handleForgotPassword = (event: Event) => {
    event.preventDefault();
    const email = emailField.input.value.trim() || window.prompt("Introduce tu correo electrónico:") || "";
    if (!email) return;
    errorText.style.display = "none";
    void supabase.auth.resetPasswordForEmail(email).then(({ error }) => {
      errorText.style.display = "block";
      if (error) {
        errorText.style.color = "#c0392b";
        errorText.textContent = "No se ha podido enviar el correo de recuperación.";
      } else {
        errorText.style.color = "#1f8a4c";
        errorText.textContent = "Te hemos enviado un correo para restablecer tu contraseña.";
      }
    });
  };

  forgotLink.addEventListener("click", handleForgotPassword);
  bottomLink.addEventListener("click", handleForgotPassword);
}

async function mountApp() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    showStatus("No se pudo recuperar la sesión", "La aplicación no ha podido recuperar tu sesión de Inkorium. Puedes volver a intentarlo.", { label: "Reintentar", run: () => void mountApp() });
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
window.addEventListener("beforeunload", () => authListener.subscription.unsubscribe());
