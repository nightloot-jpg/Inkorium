import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useSession } from "@/lib/session";
import { getMyProfile, updateProfile, type Profile } from "@/lib/api";
import { profileSchema } from "@/lib/validation";
import { uploadMedia } from "@/lib/media";
import { MediaImage } from "@/components/MediaImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_authenticated/ajustes")({
  head: () => ({
    meta: [
      { title: "Editar mi perfil — nocturno" },
      { name: "description", content: "Personaliza tu nombre, tu bio, tus colores y tu foto." },
      { property: "og:title", content: "Editar mi perfil — nocturno" },
      { property: "og:description", content: "Personaliza tu nombre, tu bio, tus colores y tu foto." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [form, setForm] = useState<Partial<Profile>>({});
  const [uploading, setUploading] = useState(false);

  const profile = useQuery({
    queryKey: ["my-profile", user?.id],
    queryFn: () => getMyProfile(user!.id),
    enabled: Boolean(user),
  });

  useEffect(() => {
    if (profile.data) setForm(profile.data);
  }, [profile.data]);

  const save = useMutation({
    mutationFn: async () => {
      const parsed = profileSchema.safeParse({
        username: form.username ?? "",
        display_name: form.display_name ?? "",
        bio: form.bio ?? "",
        mood: form.mood ?? "",
        favorite_quote: form.favorite_quote ?? "",
        accent_color: form.accent_color ?? "#4f46e5",
        bg_color: form.bg_color ?? "#0a0a1a",
        is_private: form.is_private ?? false,
      });
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Datos no válidos");
      await updateProfile(user!.id, parsed.data);
      return parsed.data.username;
    },
    onSuccess: (username) => {
      void queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Perfil actualizado");
      void navigate({ to: "/perfil/$username", params: { username } });
    },
    onError: (e: Error) =>
      toast.error(
        e.message.includes("duplicate") ? "Ese nombre de usuario ya existe." : e.message,
      ),
  });

  async function handleUpload(field: "avatar_url" | "cover_url", file: File | undefined) {
    if (!file || !user) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("La imagen no puede pesar más de 8 MB");
      return;
    }
    setUploading(true);
    try {
      const path = await uploadMedia(user.id, file, field === "avatar_url" ? "avatars" : "covers");
      await updateProfile(user.id, { [field]: path } as Partial<Profile>);
      void queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      toast.success("Imagen actualizada");
    } catch {
      toast.error("No hemos podido subir la imagen");
    } finally {
      setUploading(false);
    }
  }

  if (!profile.data) return <div className="p-10 text-center text-muted-foreground">Cargando…</div>;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-display text-2xl font-bold">Editar mi perfil</h1>

      <div className="panel mt-6 space-y-5 p-5">
        <div className="flex items-center gap-4">
          <MediaImage
            path={form.avatar_url}
            alt="Tu foto de perfil"
            className="h-20 w-20 rounded-md border border-border object-cover"
            fallback={<div className="h-20 w-20 rounded-md bg-secondary" />}
          />
          <div className="space-y-2">
            <Label htmlFor="avatar">Foto de perfil</Label>
            <Input
              id="avatar"
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={(e) => void handleUpload("avatar_url", e.target.files?.[0])}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cover">Portada</Label>
          <Input
            id="cover"
            type="file"
            accept="image/*"
            disabled={uploading}
            onChange={(e) => void handleUpload("cover_url", e.target.files?.[0])}
          />
        </div>

        <Field label="Usuario" id="username">
          <Input
            id="username"
            value={form.username ?? ""}
            maxLength={20}
            onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase() })}
          />
        </Field>

        <Field label="Nombre" id="display_name">
          <Input
            id="display_name"
            value={form.display_name ?? ""}
            maxLength={60}
            onChange={(e) => setForm({ ...form, display_name: e.target.value })}
          />
        </Field>

        <Field label="Estado de ánimo" id="mood">
          <Input
            id="mood"
            value={form.mood ?? ""}
            maxLength={40}
            placeholder="escuchando música ★"
            onChange={(e) => setForm({ ...form, mood: e.target.value })}
          />
        </Field>

        <Field label="Sobre mí" id="bio">
          <Textarea
            id="bio"
            rows={4}
            value={form.bio ?? ""}
            maxLength={600}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
          />
        </Field>

        <Field label="Frase favorita" id="quote">
          <Input
            id="quote"
            value={form.favorite_quote ?? ""}
            maxLength={120}
            onChange={(e) => setForm({ ...form, favorite_quote: e.target.value })}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Color principal" id="accent">
            <Input
              id="accent"
              type="color"
              value={form.accent_color ?? "#4f46e5"}
              className="h-10 p-1"
              onChange={(e) => setForm({ ...form, accent_color: e.target.value })}
            />
          </Field>
          <Field label="Color de fondo" id="bg">
            <Input
              id="bg"
              type="color"
              value={form.bg_color ?? "#0a0a1a"}
              className="h-10 p-1"
              onChange={(e) => setForm({ ...form, bg_color: e.target.value })}
            />
          </Field>
        </div>

        <div className="flex items-center justify-between rounded-md bg-secondary p-3">
          <div>
            <p className="text-sm font-medium">Perfil privado</p>
            <p className="text-xs text-muted-foreground">
              Solo tus amigos podrán ver tu muro y tus fotos.
            </p>
          </div>
          <Switch
            checked={form.is_private ?? false}
            onCheckedChange={(v) => setForm({ ...form, is_private: v })}
          />
        </div>

        <Button className="w-full" disabled={save.isPending} onClick={() => save.mutate()}>
          Guardar cambios
        </Button>
      </div>
    </main>
  );
}

function Field({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}