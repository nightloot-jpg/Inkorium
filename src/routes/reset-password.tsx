import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Cambiar contraseña — nocturno" },
      { name: "description", content: "Elige una contraseña nueva para tu cuenta de nocturno." },
      { property: "og:title", content: "Cambiar contraseña — nocturno" },
      {
        property: "og:description",
        content: "Elige una contraseña nueva para tu cuenta de nocturno.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error("No hemos podido cambiar la contraseña. Pide otro enlace.");
      return;
    }
    toast.success("Contraseña cambiada.");
    void navigate({ to: "/", replace: true });
  }

  return (
    <main className="tuenti-screen flex min-h-screen flex-col items-center px-4 py-10">
      <h1 className="text-[32px] font-bold leading-none text-white">nocturno</h1>
      <section className="tuenti-card mt-6 w-full max-w-[380px] px-6 py-6">
        <h2 className="mb-4 text-center text-[13px] font-bold">Elige una contraseña nueva</h2>
        <form className="space-y-3" onSubmit={(e) => void handleSubmit(e)}>
          <div className="grid grid-cols-[100px_minmax(0,1fr)] items-center gap-3">
            <label htmlFor="new-password" className="tuenti-label text-right">
              Contraseña:
            </label>
            <input
              id="new-password"
              type="password"
              className="tuenti-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              maxLength={72}
              required
            />
          </div>
          <div className="pt-1 text-center">
            <button type="submit" className="tuenti-btn" disabled={busy}>
              Guardar
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
