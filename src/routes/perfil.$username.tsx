import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useSession } from "@/lib/session";
import {
  createPhoto,
  deleteWallPost,
  getFriendshipsFor,
  getPhotosByUser,
  getProfileByUsername,
  getProfilesByIds,
  getTopFriends,
  getWallPosts,
  postWall,
  registerProfileView,
  removeFriendship,
  respondFriendRequest,
  sendFriendRequest,
  setTopFriends,
} from "@/lib/api";
import { photoSchema, textPostSchema } from "@/lib/validation";
import { uploadMedia } from "@/lib/media";
import { timeAgo } from "@/lib/format";
import { MediaImage } from "@/components/MediaImage";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/perfil/$username")({
  head: ({ params }) => ({
    meta: [
      { title: `@${params.username} — nocturno` },
      {
        name: "description",
        content: `Perfil de @${params.username} en nocturno: fotolog, muro y amigos.`,
      },
      { property: "og:title", content: `@${params.username} — nocturno` },
      {
        property: "og:description",
        content: `Perfil de @${params.username} en nocturno: fotolog, muro y amigos.`,
      },
    ],
  }),
  component: ProfilePage,
  notFoundComponent: () => (
    <main className="mx-auto max-w-md px-4 py-20 text-center">
      <h1 className="font-display text-2xl font-bold">Ese perfil no existe</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Puede que haya cambiado de nombre de usuario.
      </p>
      <Button asChild className="mt-6">
        <Link to="/gente" search={{ q: "" }}>
          Buscar gente
        </Link>
      </Button>
    </main>
  ),
});

function ProfilePage() {
  const { username } = Route.useParams();
  const { user } = useSession();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [wallText, setWallText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [editingTop, setEditingTop] = useState(false);

  const profileQuery = useQuery({
    queryKey: ["profile", username],
    queryFn: () => getProfileByUsername(username),
  });
  const profile = profileQuery.data;
  const isMe = Boolean(user && profile && user.id === profile.id);

  useEffect(() => {
    if (profile && user && !isMe) void registerProfileView(profile.id);
  }, [profile, user, isMe]);

  const myFriendships = useQuery({
    queryKey: ["friendships", user?.id],
    queryFn: () => getFriendshipsFor(user!.id),
    enabled: Boolean(user),
  });
  const relation = (myFriendships.data ?? []).find(
    (f) => f.requester_id === profile?.id || f.addressee_id === profile?.id,
  );
  const myFriendIds = (myFriendships.data ?? [])
    .filter((f) => f.status === "accepted")
    .map((f) => (f.requester_id === user?.id ? f.addressee_id : f.requester_id));

  const photos = useQuery({
    queryKey: ["photos", profile?.id],
    queryFn: () => getPhotosByUser(profile!.id),
    enabled: Boolean(profile),
  });

  const wall = useQuery({
    queryKey: ["wall", profile?.id],
    queryFn: () => getWallPosts(profile!.id),
    enabled: Boolean(profile),
  });

  const wallAuthorIds = Array.from(new Set((wall.data ?? []).map((p) => p.author_id)));
  const wallAuthors = useQuery({
    queryKey: ["profiles-by-ids", wallAuthorIds],
    queryFn: () => getProfilesByIds(wallAuthorIds),
    enabled: wallAuthorIds.length > 0,
  });
  const wallAuthorMap = new Map((wallAuthors.data ?? []).map((p) => [p.id, p]));

  const topFriends = useQuery({
    queryKey: ["top-friends", profile?.id],
    queryFn: () => getTopFriends(profile!.id),
    enabled: Boolean(profile),
  });
  const topIds = (topFriends.data ?? []).map((t) => t.friend_id);
  const topProfiles = useQuery({
    queryKey: ["profiles-by-ids", topIds],
    queryFn: () => getProfilesByIds(topIds),
    enabled: topIds.length > 0,
  });
  const myFriendProfiles = useQuery({
    queryKey: ["profiles-by-ids", myFriendIds],
    queryFn: () => getProfilesByIds(myFriendIds),
    enabled: isMe && myFriendIds.length > 0,
  });

  const friendAction = useMutation({
    mutationFn: async (action: "add" | "cancel" | "accept") => {
      if (!user || !profile) throw new Error("Inicia sesión para hacer amigos");
      if (action === "add") await sendFriendRequest(user.id, profile.id);
      else if (action === "accept" && relation) await respondFriendRequest(relation.id, true);
      else if (relation) await removeFriendship(relation.id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["friendships"] });
      void queryClient.invalidateQueries({ queryKey: ["profile", username] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const publishWall = useMutation({
    mutationFn: async () => {
      if (!user || !profile) throw new Error("Inicia sesión para escribir");
      const parsed = textPostSchema.safeParse(wallText);
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Texto no válido");
      await postWall(profile.id, user.id, parsed.data);
    },
    onSuccess: () => {
      setWallText("");
      void queryClient.invalidateQueries({ queryKey: ["wall", profile?.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeWall = useMutation({
    mutationFn: (id: string) => deleteWallPost(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["wall", profile?.id] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const saveTop = useMutation({
    mutationFn: (ids: string[]) => setTopFriends(user!.id, ids),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["top-friends", profile?.id] });
      toast.success("Top 8 actualizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function handlePhotoUpload(file: File | undefined, title: string) {
    if (!file || !user) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("La imagen no puede pesar más de 8 MB");
      return;
    }
    const parsed = photoSchema.safeParse({ title, description: "", is_private: false });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Datos no válidos");
      return;
    }
    setUploading(true);
    try {
      const path = await uploadMedia(user.id, file, "photos");
      const id = await createPhoto({ user_id: user.id, image_url: path, ...parsed.data });
      void queryClient.invalidateQueries({ queryKey: ["photos", user.id] });
      toast.success("Foto subida");
      void navigate({ to: "/foto/$photoId", params: { photoId: id } });
    } catch {
      toast.error("No hemos podido subir la foto");
    } finally {
      setUploading(false);
    }
  }

  if (profileQuery.isLoading) {
    return <div className="p-10 text-center text-muted-foreground">Cargando perfil…</div>;
  }
  if (!profile) throw notFound();

  const accent = profile.accent_color;

  return (
    <main className="mx-auto max-w-5xl px-3 py-5">
      <header className="panel overflow-hidden" style={{ backgroundColor: profile.bg_color }}>
        <MediaImage
          path={profile.cover_url}
          alt={`Portada de ${profile.display_name}`}
          className="h-40 w-full object-cover md:h-56"
          fallback={
            <div
              className="h-40 w-full md:h-56"
              style={{ background: `linear-gradient(120deg, ${accent}55, transparent)` }}
            />
          }
        />
        <div className="flex flex-wrap items-end gap-4 p-4">
          <UserAvatar
            username={profile.username}
            displayName={profile.display_name}
            avatarPath={profile.avatar_url}
            accent={accent}
            size={88}
            link={false}
            className="-mt-14 border-2"
          />
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl font-bold" style={{ color: accent }}>
              {profile.display_name}
            </h1>
            <p className="text-sm text-muted-foreground">@{profile.username}</p>
            {profile.mood ? <p className="mt-1 text-sm">★ {profile.mood}</p> : null}
          </div>
          <div className="flex gap-2">
            {isMe ? (
              <Button asChild variant="secondary" size="sm">
                <Link to="/ajustes">Editar perfil</Link>
              </Button>
            ) : user ? (
              <>
                {!relation ? (
                  <Button size="sm" onClick={() => friendAction.mutate("add")}>
                    Añadir a amigos
                  </Button>
                ) : relation.status === "accepted" ? (
                  <>
                    <Button asChild size="sm" variant="secondary">
                      <Link to="/mensajes" search={{ con: profile.username }}>
                        Mensaje
                      </Link>
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => friendAction.mutate("cancel")}>
                      Quitar amistad
                    </Button>
                  </>
                ) : relation.addressee_id === user.id ? (
                  <Button size="sm" onClick={() => friendAction.mutate("accept")}>
                    Aceptar solicitud
                  </Button>
                ) : (
                  <Button size="sm" variant="secondary" onClick={() => friendAction.mutate("cancel")}>
                    Cancelar solicitud
                  </Button>
                )}
              </>
            ) : (
              <Button asChild size="sm">
                <Link to="/auth" search={{ next: "" }}>Entra para interactuar</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="mt-4 grid gap-4 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-4">
          <section className="panel p-4">
            <h2 className="font-display text-sm font-bold uppercase tracking-wide text-muted-foreground">
              Sobre mí
            </h2>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm">
              {profile.bio || "Todavía no ha escrito nada."}
            </p>
            {profile.favorite_quote ? (
              <p className="mt-3 border-l-2 pl-3 text-sm italic" style={{ borderColor: accent }}>
                “{profile.favorite_quote}”
              </p>
            ) : null}
            <p className="mt-3 text-xs text-muted-foreground">
              {profile.view_count} visitas · en nocturno desde{" "}
              {new Date(profile.created_at).getFullYear()}
            </p>
          </section>

          <section className="panel p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-sm font-bold uppercase tracking-wide text-muted-foreground">
                Top 8
              </h2>
              {isMe ? (
                <button
                  className="text-xs underline hover:text-accent"
                  onClick={() => setEditingTop((v) => !v)}
                >
                  {editingTop ? "Cerrar" : "Editar"}
                </button>
              ) : null}
            </div>

            {editingTop && isMe ? (
              <TopEditor
                friends={myFriendProfiles.data ?? []}
                selected={topIds}
                onSave={(ids) => {
                  saveTop.mutate(ids);
                  setEditingTop(false);
                }}
              />
            ) : (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {(topProfiles.data ?? []).length === 0 ? (
                  <p className="col-span-4 text-xs text-muted-foreground">
                    Sin Top 8 todavía.
                  </p>
                ) : (
                  (topProfiles.data ?? []).map((f) => (
                    <div key={f.id} className="text-center">
                      <UserAvatar
                        username={f.username}
                        displayName={f.display_name}
                        avatarPath={f.avatar_url}
                        accent={f.accent_color}
                        size={52}
                      />
                      <p className="mt-1 truncate text-[11px]">{f.display_name}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </section>
        </aside>

        <div className="space-y-4">
          <section className="panel p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-sm font-bold uppercase tracking-wide text-muted-foreground">
                Fotolog
              </h2>
              {isMe ? <PhotoUploader disabled={uploading} onUpload={handlePhotoUpload} /> : null}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {(photos.data ?? []).length === 0 ? (
                <p className="col-span-4 text-xs text-muted-foreground">Sin fotos todavía.</p>
              ) : (
                (photos.data ?? []).map((photo) => (
                  <Link key={photo.id} to="/foto/$photoId" params={{ photoId: photo.id }}>
                    <MediaImage
                      path={photo.image_url}
                      alt={photo.title || "Foto del fotolog"}
                      className="aspect-square w-full rounded-md object-cover transition-opacity hover:opacity-80"
                    />
                  </Link>
                ))
              )}
            </div>
          </section>

          <section className="panel p-4">
            <h2 className="font-display text-sm font-bold uppercase tracking-wide text-muted-foreground">
              Muro
            </h2>
            {user ? (
              <div className="mt-3">
                <Textarea
                  value={wallText}
                  onChange={(e) => setWallText(e.target.value)}
                  placeholder={isMe ? "Escribe en tu muro…" : `Escribe a ${profile.display_name}…`}
                  rows={2}
                  maxLength={500}
                />
                <div className="mt-2 flex justify-end">
                  <Button size="sm" disabled={publishWall.isPending} onClick={() => publishWall.mutate()}>
                    Publicar
                  </Button>
                </div>
              </div>
            ) : null}

            <ul className="mt-4 space-y-3">
              {(wall.data ?? []).length === 0 ? (
                <li className="text-xs text-muted-foreground">El muro está vacío.</li>
              ) : (
                (wall.data ?? []).map((post) => {
                  const author = wallAuthorMap.get(post.author_id);
                  return (
                    <li key={post.id} className="flex gap-3 border-b border-border pb-3 last:border-0">
                      {author ? (
                        <UserAvatar
                          username={author.username}
                          displayName={author.display_name}
                          avatarPath={author.avatar_url}
                          accent={author.accent_color}
                          size={36}
                        />
                      ) : null}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">
                          {author?.display_name ?? "Alguien"}
                          <span className="ml-2 text-xs font-normal text-muted-foreground">
                            {timeAgo(post.created_at)}
                          </span>
                        </p>
                        <p className="whitespace-pre-wrap break-words text-sm text-foreground/90">
                          {post.body}
                        </p>
                      </div>
                      {user && (post.author_id === user.id || isMe) ? (
                        <button
                          className="self-start text-xs text-muted-foreground hover:text-destructive"
                          onClick={() => removeWall.mutate(post.id)}
                        >
                          Borrar
                        </button>
                      ) : null}
                    </li>
                  );
                })
              )}
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}

function PhotoUploader({
  disabled,
  onUpload,
}: {
  disabled: boolean;
  onUpload: (file: File | undefined, title: string) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  return (
    <div className="flex items-center gap-2">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Título"
        maxLength={80}
        className="h-8 w-28"
        aria-label="Título de la foto"
      />
      <Input
        type="file"
        accept="image/*"
        disabled={disabled}
        className="h-8 w-40 text-xs"
        aria-label="Subir foto"
        onChange={(e) => void onUpload(e.target.files?.[0], title)}
      />
    </div>
  );
}

function TopEditor({
  friends,
  selected,
  onSave,
}: {
  friends: { id: string; display_name: string }[];
  selected: string[];
  onSave: (ids: string[]) => void;
}) {
  const [ids, setIds] = useState<string[]>(selected);

  function toggle(id: string) {
    setIds((current) =>
      current.includes(id)
        ? current.filter((x) => x !== id)
        : current.length >= 8
          ? current
          : [...current, id],
    );
  }

  return (
    <div className="mt-3 space-y-2">
      {friends.length === 0 ? (
        <p className="text-xs text-muted-foreground">Añade amigos para crear tu Top 8.</p>
      ) : (
        <ul className="max-h-52 space-y-1 overflow-y-auto">
          {friends.map((f) => (
            <li key={f.id}>
              <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-secondary">
                <input
                  type="checkbox"
                  checked={ids.includes(f.id)}
                  onChange={() => toggle(f.id)}
                  className="accent-[var(--color-primary)]"
                />
                <span className="truncate">{f.display_name}</span>
              </label>
            </li>
          ))}
        </ul>
      )}
      <Button size="sm" className="w-full" onClick={() => onSave(ids)}>
        Guardar Top 8
      </Button>
    </div>
  );
}