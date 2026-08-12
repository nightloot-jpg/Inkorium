import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/session";
import { authSchema, signUpSchema } from "@/lib/validation";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    next: typeof search["next"] === "string" && search["next"].startsWith("/") ? search["next"] : "",
  }),
  head: () => ({
    meta: [
      { title: "Entrar o registrarte — nocturno" },
      {
        name: "description",
        content: "Crea tu cuenta en nocturno y personaliza tu perfil, tu fotolog y tu muro.",
      },
      { property: "og:title", content: "Entrar o registrarte — nocturno" },
      {
        property: "og:description",
        content: "Crea tu cuenta en nocturno y recupera la red social de siempre.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { user, loading } = useSession();
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [pendingEmail, setPendingEmail] = useState(false);

  function goNext() {
    if (next) {
      window.location.replace(next);
      return;
    }
    void navigate({ to: "/", replace: true });
  }

  useEffect(() => {
    if (loading || !user) return;
    if (next) window.location.replace(next);
    else void navigate({ to: "/", replace: true });
  }, [loading, user, navigate, next]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) {
          toast.error("No hemos podido enviar el correo.");
          return;
        }
        toast.success("Te hemos enviado un correo para cambiar la contraseña.");
        setMode("login");
        return;
      }

      if (mode === "login") {
        const parsed = authSchema.safeParse({ email, password });
        if (!parsed.success) {
          toast.error(parsed.error.issues[0]?.message ?? "Datos no válidos");
          return;
        }
        const { error } = await supabase.auth.signInWithPassword(parsed.data);
        if (error) {
          toast.error("No hemos podido entrar. Revisa tu correo y contraseña.");
          return;
        }
        goNext();
        return;
      }

      const parsed = signUpSchema.safeParse({ email, password, username, displayName });
      if (!parsed.success) {
        toast.error(parsed.error.issues[0]?.message ?? "Datos no válidos");
        return;
      }
      const { data, error } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
          emailRedirectTo: next ? `${window.location.origin}${next}` : window.location.origin,
          data: {
            username: parsed.data.username,
            display_name: parsed.data.displayName,
          },
        },
      });
      if (error) {
        const message = error.message.toLowerCase();
        toast.error(
          message.includes("already")
            ? "Ese correo ya está registrado."
            : message.includes("weak") || message.includes("pwned")
              ? "Esa contraseña es demasiado común. Prueba con una más difícil."
              : "No hemos podido crear la cuenta.",
        );
        return;
      }
      if (!data.session) {
        setPendingEmail(true);
        return;
      }
      goNext();
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="tuenti-screen flex min-h-screen flex-col items-center px-4 pt-24 pb-10">
      <header className="w-full max-w-[380px]">
        <p className="text-right text-[11px] text-white/85">Beta Privada</p>
        <div className="mt-1 flex items-center justify-center gap-2">
          <span
            aria-hidden
            className="rounded-md border border-white bg-white px-2 py-0.5 text-lg font-bold text-[oklch(0.45_0.09_250)]"
          >
            ;)
          </span>
          <h1 className="text-[40px] font-bold leading-none tracking-tight text-white">nocturno</h1>
        </div>
      </header>

      <section className="tuenti-card mt-10 w-full max-w-[380px] px-6 py-6">
        {pendingEmail ? (
          <div className="space-y-3 text-center">
            <h2 className="text-base font-bold">Revisa tu correo</h2>
            <p className="text-[12px]">
              Te hemos enviado un enlace para confirmar la cuenta de <b>{email}</b>. Cuando lo abras,
              podrás entrar.
            </p>
            <button type="button" className="tuenti-btn" onClick={() => setPendingEmail(false)}>
              Volver
            </button>
          </div>
        ) : (
          <form className="space-y-3" onSubmit={(e) => void handleSubmit(e)}>
            {mode === "signup" ? (
              <>
                <Field id="displayName" label="Nombre">
                  <input
                    id="displayName"
                    className="tuenti-input"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    maxLength={60}
                    required
                  />
                </Field>
                <Field id="username" label="Usuario">
                  <input
                    id="username"
                    className="tuenti-input"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                    maxLength={20}
                    required
                  />
                </Field>
              </>
            ) : null}

            <Field id="email" label="Email">
              <input
                id="email"
                type="email"
                className="tuenti-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={255}
                required
              />
            </Field>

            {mode === "reset" ? null : (
              <Field id="password" label="Contraseña">
                <input
                  id="password"
                  type="password"
                  className="tuenti-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  maxLength={72}
                  required
                />
              </Field>
            )}

            {mode === "login" ? (
              <div className="grid grid-cols-[100px_minmax(0,1fr)] items-center gap-3">
                <span aria-hidden />
                <label className="flex items-center gap-2 text-[12px]">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 accent-[oklch(0.55_0.11_245)]"
                  />
                  Recordarme en este equipo
                </label>
              </div>
            ) : null}

            <div className="pt-1 text-center">
              <button type="submit" className="tuenti-btn" disabled={busy}>
                {mode === "login" ? "Entrar" : mode === "signup" ? "Crear cuenta" : "Enviar"}
              </button>
            </div>
          </form>
        )}
      </section>

      <nav className="mt-4 flex items-center gap-2 text-white/90">
        <button
          type="button"
          className="tuenti-link"
          onClick={() => {
            setPendingEmail(false);
            setMode(mode === "signup" ? "login" : "signup");
          }}
        >
          {mode === "signup" ? "Ya tengo cuenta" : "¿Quieres entrar?"}
        </button>
        <span className="text-[12px] text-white/70">|</span>
        <button
          type="button"
          className="tuenti-link"
          onClick={() => {
            setPendingEmail(false);
            setMode("reset");
          }}
        >
          Recordar contraseña
        </button>
      </nav>

      <p className="mt-6">
        <Link to="/" className="tuenti-link">
          Volver al inicio
        </Link>
      </p>
    </main>
  );
}

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[100px_minmax(0,1fr)] items-center gap-3">
      <label htmlFor={id} className="tuenti-label text-right">
        {label}:
      </label>
      {children}
    </div>
  );
}
