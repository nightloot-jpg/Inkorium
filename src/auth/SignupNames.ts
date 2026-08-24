import { supabase } from "../lib/supabase";

const FIRST_ID = "inkorium-signup-first-name";
const LAST_ID = "inkorium-signup-last-name";

function row(label: string, id: string, autocomplete: string): HTMLDivElement {
  const div = document.createElement("div");
  div.dataset.inkoriumSignupField = "true";
  div.style.cssText = "display:grid;grid-template-columns:82px minmax(0,1fr);align-items:center;gap:8px;margin-bottom:9px";
  const labelEl = document.createElement("label"); labelEl.textContent = label; labelEl.htmlFor = id; labelEl.style.cssText = "font-size:12px;font-weight:700;text-align:right;color:#7a858d";
  const input = document.createElement("input"); input.id = id; input.name = id; input.type = "text"; input.required = true; input.autocomplete = autocomplete; input.style.cssText = "height:26px;padding:4px 7px;border:1px solid #c8cdd1;border-radius:2px;background:#fff;box-shadow:inset 0 1px 2px rgba(0,0,0,.06);font:12px Arial,Helvetica,sans-serif;color:#45545e;outline:none;box-sizing:border-box;width:100%";
  div.append(labelEl, input); return div;
}

function isSignup(form: HTMLFormElement): boolean {
  return (form.closest("section")?.querySelector("div")?.textContent?.trim() || "") === "Crear cuenta";
}

function ensureFields(form: HTMLFormElement) {
  let first = document.getElementById(FIRST_ID) as HTMLInputElement | null;
  let last = document.getElementById(LAST_ID) as HTMLInputElement | null;
  if (first && last) return { first, last };
  const emailInput = form.querySelector('input[type="email"]');
  const firstRow = row("Nombre", FIRST_ID, "given-name"); const lastRow = row("Apellidos", LAST_ID, "family-name");
  if (emailInput?.parentElement) { emailInput.parentElement.insertAdjacentElement("beforebegin", firstRow); firstRow.insertAdjacentElement("afterend", lastRow); } else form.prepend(firstRow, lastRow);
  first = firstRow.querySelector("input")!; last = lastRow.querySelector("input")!; return { first, last };
}

function removeFields() { document.querySelectorAll<HTMLElement>("[data-inkorium-signup-field='true']").forEach((node) => node.remove()); }

function patchForm(form: HTMLFormElement) {
  if (form.dataset.inkoriumSignupPatched !== "true") {
    form.dataset.inkoriumSignupPatched = "true";
    form.addEventListener("submit", async (event) => {
      if (!isSignup(form)) return;
      event.preventDefault(); event.stopImmediatePropagation();
      const { first, last } = ensureFields(form);
      const firstName = first.value.trim().replace(/\s+/g, " "); const lastName = last.value.trim().replace(/\s+/g, " ");
      const email = (form.querySelector('input[type="email"]') as HTMLInputElement | null)?.value.trim() || "";
      const password = (form.querySelector('input[type="password"]') as HTMLInputElement | null)?.value || "";
      const errorText = form.querySelector("p") as HTMLParagraphElement | null; const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement | null;
      if (!firstName || !lastName) { if (errorText) { errorText.textContent = "Introduce tu nombre y apellidos."; errorText.style.color = "#c0392b"; errorText.style.display = "block"; } return; }
      if (submitButton) { submitButton.disabled = true; submitButton.textContent = "Creando…"; }
      if (errorText) errorText.style.display = "none";
      const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: `${firstName} ${lastName}`.trim() } } });
      if (error) { if (errorText) { errorText.textContent = "No se ha podido crear la cuenta. Inténtalo de nuevo."; errorText.style.color = "#c0392b"; errorText.style.display = "block"; } if (submitButton) { submitButton.disabled = false; submitButton.textContent = "Registrarme"; } return; }
      if (errorText) { errorText.textContent = "Cuenta creada. Revisa tu correo para confirmar el registro."; errorText.style.color = "#267b4b"; errorText.style.display = "block"; }
      if (submitButton) { submitButton.disabled = false; submitButton.textContent = "Registrarme"; }
    }, true);
  }
  if (isSignup(form)) ensureFields(form); else removeFields();
}

const observer = new MutationObserver(() => document.querySelectorAll<HTMLFormElement>("#root form").forEach(patchForm));
observer.observe(document.documentElement, { subtree: true, childList: true, characterData: true });
