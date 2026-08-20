import { supabase } from "./lib/supabase";
import "./features/RouteContentBridge";

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

  const BLUE_BG = "#78afd1";
  const BLUE_HEADER = "#d7ebf6";
  const BLUE_BORDER = "#a9c8da";
  const BLUE_BUTTON = "#67a4cd";
  const TEXT = "#5d6f7d";
  const LINK = "#4e7d9d";

  const page = document.createElement("main");
  page.style.cssText = `min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding:18px 16px 30px;background:${BLUE_BG};font-family:Arial,Helvetica,sans-serif;box-sizing:border-box;color:${TEXT}`;
  const brand = document.createElement("div");
  brand.style.cssText = "display:flex;align-items:center;justify-content:center;gap:9px;margin:0 0 12px;height:46px";
  const logoImg = document.createElement("img");
  logoImg.src = "/inkorium-logo-white.svg";
  logoImg.alt = "Inkorium";
  logoImg.style.cssText = "width:38px;height:38px;display:block";
  const wordmark = document.createElement("span");
  wordmark.textContent = "inkorium";
  wordmark.style.cssText = "font-size:32px;line-height:1;font-weight:800;color:#fff;letter-spacing:-1.1px";
  brand.append(logoImg, wordmark);

  const card = document.createElement("section");
  card.style.cssText = `width:min(100%,360px);background:#fff;border:1px solid rgba(66,105,129,.18);box-shadow:0 2px 7px rgba(35,67,87,.18);box-sizing:border-box`;
  const cardHeader = document.createElement("div");
  cardHeader.style.cssText = `height:24px;display:flex;align-items:center;padding:0 9px;background:${BLUE_HEADER};border-bottom:1px solid ${BLUE_BORDER};box-sizing:border-box;font-size:12px;font-weight:700;color:#516875`;
  const heading = document.createElement("span");
  heading.textContent = "Entrar";
  cardHeader.appendChild(heading);
  const form = document.createElement("form");
  form.style.cssText = "padding:15px 16px 13px;box-sizing:border-box";
  const fieldRowStyle = "display:grid;grid-template-columns:82px minmax(0,1fr);align-items:center;gap:8px;margin-bottom:9px";
  const labelStyle = "font-size:12px;font-weight:700;text-align:right;color:#7a858d";
  const inputStyle = "height:26px;padding:4px 7px;border:1px solid #c8cdd1;border-radius:2px;background:#fff;box-shadow:inset 0 1px 2px rgba(0,0,0,.06);font:12px Arial,Helvetica,sans-serif;color:#45545e;outline:none;box-sizing:border-box;width:100%";
  const emailField = document.createElement("div"); emailField.style.cssText = fieldRowStyle;
  const emailLabel = document.createElement("label"); emailLabel.textContent = "E-mail"; emailLabel.style.cssText = labelStyle;
  const emailInput = document.createElement("input"); emailInput.type = "email"; emailInput.name = "email"; emailInput.required = true; emailInput.autocomplete = "email"; emailInput.style.cssText = inputStyle; emailField.append(emailLabel, emailInput);
  const passwordField = document.createElement("div"); passwordField.style.cssText = fieldRowStyle;
  const passwordLabel = document.createElement("label"); passwordLabel.textContent = "Contraseña"; passwordLabel.style.cssText = labelStyle;
  const passwordInput = document.createElement("input"); passwordInput.type = "password"; passwordInput.name = "password"; passwordInput.required = true; passwordInput.autocomplete = "current-password"; passwordInput.style.cssText = inputStyle; passwordField.append(passwordLabel, passwordInput);
  const rememberRow = document.createElement("div"); rememberRow.style.cssText = "display:flex;align-items:center;justify-content:center;margin:1px 0 9px;font-size:11px";
  const rememberLabel = document.createElement("label"); rememberLabel.style.cssText = "display:flex;align-items:center;gap:5px;color:#7a858d;cursor:pointer";
  const rememberCheckbox = document.createElement("input"); rememberCheckbox.type = "checkbox"; rememberCheckbox.checked = true; rememberCheckbox.style.cssText = "width:12px;height:12px;margin:0;accent-color:#4f8fbe;cursor:pointer";
  const rememberText = document.createElement("span"); rememberText.textContent = "Recordarme en este equipo"; rememberLabel.append(rememberCheckbox, rememberText); rememberRow.appendChild(rememberLabel);
  const errorText = document.createElement("p"); errorText.style.cssText = "margin:0 0 7px;color:#c0392b;font-size:11px;line-height:1.35;text-align:center;display:none";
  const submitButton = document.createElement("button"); submitButton.type = "submit"; submitButton.textContent = "Entrar"; submitButton.style.cssText = `display:block;margin:0 auto;padding:5px 22px;border:1px solid rgba(63,111,143,.35);border-radius:2px;background:${BLUE_BUTTON};box-shadow:inset 0 1px rgba(255,255,255,.35);color:#fff;font:700 12px Arial,Helvetica,sans-serif;cursor:pointer;text-shadow:0 1px rgba(40,80,105,.25)`;
  form.append(emailField, passwordField, rememberRow, errorText, submitButton);
  const footer = document.createElement("div"); footer.style.cssText = "padding:7px 9px;background:#f3f3f3;border-top:1px solid #dfe3e6;text-align:center;font-size:11px";
  const forgotLink = document.createElement("a"); forgotLink.href = "#"; forgotLink.textContent = "¿Has olvidado tu contraseña?"; forgotLink.style.cssText = `color:${LINK};text-decoration:none`; footer.appendChild(forgotLink); card.append(cardHeader, form, footer);
  const signupLink = document.createElement("a"); signupLink.href = "#"; signupLink.textContent = "¿Todavía no tienes cuenta? Regístrate"; signupLink.style.cssText = `margin-top:13px;color:#fff;text-decoration:none;font-size:11px;text-shadow:0 1px rgba(55,85,100,.18)`;
  page.append(brand, card, signupLink); root.appendChild(page);
  const setBusy = (busy: boolean, label: string) => { submitButton.disabled = busy; submitButton.textContent = label; submitButton.style.opacity = busy ? "0.7" : "1"; submitButton.style.cursor = busy ? "wait" : "pointer"; };
  const showMessage = (message: string, success = false) => { errorText.style.display = "block"; errorText.style.color = success ? "#267b4b" : "#c0392b"; errorText.textContent = message; };
  let mode: "login" | "signup" = "login";
  form.addEventListener("submit", (event) => {
    event.preventDefault(); errorText.style.display = "none"; setBusy(true, mode === "login" ? "Entrando…" : "Creando…");
    const email = emailInput.value.trim(); const password = passwordInput.value;
    const request = mode === "login" ? supabase.auth.signInWithPassword({ email, password }) : supabase.auth.signUp({ email, password });
    void request.then(({ error }) => { if (error) { showMessage(mode === "login" && error.message === "Invalid login credentials" ? "Correo o contraseña incorrectos." : mode === "signup" ? "No se ha podido crear la cuenta. Inténtalo de nuevo." : "No se ha podido iniciar sesión. Inténtalo de nuevo."); setBusy(false, mode === "login" ? "Entrar" : "Registrarme"); return; } if (mode === "signup") { showMessage("Cuenta creada. Revisa tu correo para confirmar el registro.", true); setBusy(false, "Registrarme"); } });
  });
  const handleForgotPassword = (event: Event) => { event.preventDefault(); const email = emailInput.value.trim() || window.prompt("Introduce tu correo electrónico:") || ""; if (!email) return; errorText.style.display = "none"; void supabase.auth.resetPasswordForEmail(email).then(({ error }) => { if (error) showMessage("No se ha podido enviar el correo de recuperación."); else showMessage("Te hemos enviado un correo para restablecer tu contraseña.", true); }); };
  forgotLink.addEventListener("click", handleForgotPassword);
  signupLink.addEventListener("click", (event) => { event.preventDefault(); mode = mode === "login" ? "signup" : "login"; heading.textContent = mode === "login" ? "Entrar" : "Crear cuenta"; submitButton.textContent = mode === "login" ? "Entrar" : "Registrarme"; signupLink.textContent = mode === "login" ? "¿Todavía no tienes cuenta? Regístrate" : "¿Ya tienes una cuenta? Entrar"; errorText.style.display = "none"; passwordInput.autocomplete = mode === "login" ? "current-password" : "new-password"; });
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

void mountApp();
