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

  const BLUE_BG = "#7EAACF";
  const HEADING_COLOR = "#33414C";
  const SUBTEXT_COLOR = "#71829C";
  const LABEL_COLOR = "#5C6B7A";
  const BORDER_COLOR = "#C9D3DC";
  const BUTTON_COLOR = "#6FA0C9";
  const CHECKBOX_COLOR = "#4F8FBE";

  const page = document.createElement("main");
  page.style.cssText = `min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 20px;background:${BLUE_BG};font-family:Arial,Helvetica,sans-serif;box-sizing:border-box`;

  // --- Brand lockup (hexagon mark + wordmark) ---
  const brand = document.createElement("div");
  brand.style.cssText = "display:flex;align-items:center;gap:14px;margin-bottom:28px";

  const logoImg = document.createElement("img");
  logoImg.src = "/inkorium-logo-white.svg";
  logoImg.alt = "Inkorium";
  logoImg.style.cssText = "width:56px;height:56px;display:block";

  const wordmark = document.createElement("span");
  wordmark.textContent = "inkorium";
  wordmark.style.cssText = "font-size:38px;font-weight:800;color:#fff;letter-spacing:-0.5px";

  brand.append(logoImg, wordmark);

  // --- Card ---
  const card = document.createElement("section");
  card.style.cssText = "width:min(100%,520px);padding:48px 56px;border-radius:16px;background:#fff;box-shadow:0 24px 50px rgba(20,40,65,.25);box-sizing:border-box";

  const heading = document.createElement("h1");
  heading.textContent = "Iniciar sesión";
  heading.style.cssText = `margin:0 0 10px;font-size:32px;font-weight:800;color:${HEADING_COLOR};text-align:center`;

  const subtext = document.createElement("p");
  subtext.textContent = "Entra en tu espacio creativo.";
  subtext.style.cssText = `margin:0 0 32px;color:${SUBTEXT_COLOR};font-size:18px;text-align:center`;

  const form = document.createElement("form");
  form.style.cssText = "display:flex;flex-direction:column;gap:20px";

  const inputStyle = `padding:14px 14px;border:1px solid ${BORDER_COLOR};border-radius:6px;font-size:15px;font-family:inherit;color:${HEADING_COLOR};outline:none;box-sizing:border-box;width:100%`;
  const labelStyle = `display:block;margin-bottom:8px;font-size:15px;font-weight:700;color:${LABEL_COLOR}`;

  const emailField = document.createElement("div");
  const emailLabel = document.createElement("label");
  emailLabel.textContent = "Email";
  emailLabel.style.cssText = labelStyle;
  const emailInput = document.createElement("input");
  emailInput.type = "email";
  emailInput.name = "email";
  emailInput.required = true;
  emailInput.autocomplete = "email";
  emailInput.style.cssText = inputStyle;
  emailField.append(emailLabel, emailInput);

  const passwordField = document.createElement("div");
  const passwordLabel = document.createElement("label");
  passwordLabel.textContent = "Contraseña";
  passwordLabel.style.cssText = labelStyle;
  const passwordInput = document.createElement("input");
  passwordInput.type = "password";
  passwordInput.name = "password";
  passwordInput.required = true;
  passwordInput.autocomplete = "current-password";
  passwordInput.style.cssText = inputStyle;
  passwordField.append(passwordLabel, passwordInput);

  const optionsRow = document.createElement("div");
  optionsRow.style.cssText = "display:flex;align-items:center;justify-content:space-between;font-size:14px";

  const rememberLabel = document.createElement("label");
  rememberLabel.style.cssText = `display:flex;align-items:center;gap:8px;color:${LABEL_COLOR};cursor:pointer`;
  const rememberCheckbox = document.createElement("input");
  rememberCheckbox.type = "checkbox";
  rememberCheckbox.checked = true;
  rememberCheckbox.style.cssText = `width:16px;height:16px;accent-color:${CHECKBOX_COLOR};cursor:pointer`;
  const rememberText = document.createElement("span");
  rememberText.textContent = "Recordarme en este equipo";
  rememberLabel.append(rememberCheckbox, rememberText);

  const forgotLink = document.createElement("a");
  forgotLink.href = "#";
  forgotLink.textContent = "¿Contraseña olvidada?";
  forgotLink.style.cssText = `color:${SUBTEXT_COLOR};text-decoration:none`;

  optionsRow.append(rememberLabel, forgotLink);

  const errorText = document.createElement("p");
  errorText.style.cssText = "margin:0;color:#c0392b;font-size:13px;line-height:1.4;text-align:center;display:none";

  const submitButton = document.createElement("button");
  submitButton.type = "submit";
  submitButton.textContent = "Entrar";
  submitButton.style.cssText = `margin:8px auto 0;padding:14px 40px;border:0;border-radius:8px;background:${BUTTON_COLOR};color:#fff;font-weight:800;font-size:16px;cursor:pointer;display:block`;

  form.append(emailField, passwordField, optionsRow, errorText, submitButton);
  card.append(heading, subtext, form);

  // --- Footer links ---
  const footer = document.createElement("div");
  footer.style.cssText = "display:flex;align-items:center;gap:16px;margin-top:24px;font-size:15px";

  const signupLink = document.createElement("a");
  signupLink.href = "#";
  signupLink.textContent = "¿Quieres crear una cuenta?";
  signupLink.style.cssText = "color:#fff;text-decoration:none";

  const divider = document.createElement("span");
  divider.style.cssText = "width:1px;height:16px;background:rgba(255,255,255,.55)";

  const rememberPwLink = document.createElement("a");
  rememberPwLink.href = "#";
  rememberPwLink.textContent = "Recordar contraseña";
  rememberPwLink.style.cssText = "color:#fff;text-decoration:none";

  footer.append(signupLink, divider, rememberPwLink);

  page.append(brand, card, footer);
  root.appendChild(page);

  const setBusy = (busy: boolean, label: string) => {
    submitButton.disabled = busy;
    submitButton.textContent = label;
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    errorText.style.display = "none";
    setBusy(true, "Entrando…");

    void supabase.auth
      .signInWithPassword({ email: emailInput.value.trim(), password: passwordInput.value })
      .then(({ error }) => {
        if (error) {
          errorText.textContent =
            error.message === "Invalid login credentials"
              ? "Correo o contraseña incorrectos."
              : "No se ha podido iniciar sesión. Inténtalo de nuevo.";
          errorText.style.display = "block";
          setBusy(false, "Entrar");
          return;
        }
        // onAuthStateChange (SIGNED_IN) se encarga de cargar la app.
      });
  });

  const handleForgotPassword = (event: Event) => {
    event.preventDefault();
    const email = emailInput.value.trim() || window.prompt("Introduce tu correo electrónico:") || "";
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
  rememberPwLink.addEventListener("click", handleForgotPassword);

  signupLink.addEventListener("click", (event) => {
    event.preventDefault();
    heading.textContent = "Crear cuenta";
    subtext.textContent = "Únete a tu espacio creativo.";
    submitButton.textContent = "Registrarme";
    signupLink.textContent = "¿Ya tienes una cuenta? Inicia sesión";

    form.onsubmit = (submitEvent) => {
      submitEvent.preventDefault();
      errorText.style.display = "none";
      setBusy(true, "Registrando…");
      void supabase.auth
        .signUp({ email: emailInput.value.trim(), password: passwordInput.value })
        .then(({ error }) => {
          errorText.style.display = "block";
          if (error) {
            errorText.style.color = "#c0392b";
            errorText.textContent = "No se ha podido crear la cuenta. Inténtalo de nuevo.";
            setBusy(false, "Registrarme");
          } else {
            errorText.style.color = "#1f8a4c";
            errorText.textContent = "Cuenta creada. Revisa tu correo para confirmar el registro.";
            setBusy(false, "Registrarme");
          }
        });
    };
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
