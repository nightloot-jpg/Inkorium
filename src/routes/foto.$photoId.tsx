import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";

import { useSession } from "@/lib/session";
import {
  addPhotoComment,
  addPhotoTag,
  deletePhoto,
  deletePhotoComment,
  getFriendshipsFor,
  getPhoto,
  getPhotoComments,
  getPhotoLikes,
  getPhotoTags,
  getProfilesByIds,
  removePhotoTag,
  togglePhotoLike,
} from "@/lib/api";
import { textPostSchema } from "@/lib/validation";
import { timeAgo } from "@/lib/format";
import { MediaImage } from "@/components/MediaImage";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/foto/$photoId")({
  head: () => ({
    meta: [
      { title: "Foto — nocturno" },
      { name: "description", content: "Una foto del fotolog de nocturno, con likes y comentarios." },
      { property: "og:title", content: "Foto — nocturno" },
      { property: "og:description", content: "Una foto del fotolog de nocturno." },
    ],
  }),
  component: PhotoPage,
  notFoundComponent: () => (
    <main className="mx-auto max-w-md px-4 py-20 text-center">
      <h1 className="font-display text-2xl font-bold">Esta foto ya no está</h1>
      <Button asChild className="mt-6">
        <Link to="/">Volver al inicio</Link>
      </Button>
    </main>
  ),
});

function PhotoPage() {
  const { photoId } = Route.useParams();
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");
  const [tagChoice, setTagChoice] = useState("");

  const photoQuery = useQuery({ queryKey: ["photo", photoId], queryFn: () => getPhoto(photoId) });
  const photo = photoQuery.data;

  const owner = useQuery({
    queryKey: ["profiles-by-ids", photo ? [photo.user_id] : []],
    queryFn: () => getProfilesByIds([photo!.user_id]),
    enabled: Boolean(photo),
  });

  const comments = useQuery({
    queryKey: ["photo-comments", photoId],
    queryFn: () => getPhotoComments(photoId),
  });

  const commenterIds = Array.from(new Set((comments.data ?? []).map((c) => c.author_id)));
  const commenters = useQuery({
    queryKey: ["profiles-by-ids", commenterIds],
    queryFn: () => getProfilesByIds(commenterIds),
    enabled: commenterIds.length > 0,
  });
  const commenterMap = new Map((commenters.data ?? []).map((p) => [p.id, p]));

  const likes = useQuery({ queryKey: ["photo-likes", photoId], queryFn: () => getPhotoLikes(photoId) });
  const liked = (likes.data ?? []).some((l) => l.user_id === user?.id);

  const tags = useQuery({ queryKey: ["photo-tags", photoId], queryFn: () => getPhotoTags(photoId) });

  const myFriendships = useQuery({
    queryKey: ["friendships", user?.id],
    queryFn: () => getFriendshipsFor(user!.id),
    enabled: Boolean(user),
  });
  const friendIds = (myFriendships.data ?? [])
    .filter((f) => f.status === "accepted")
    .map((f) => (f.requester_id === user?.id ? f.addressee_id : f.requester_id));

  const taggedIds = (tags.data ?? []).map((t) => t.tagged_id);
  const tagPeopleIds = Array.from(new Set([...taggedIds, ...friendIds]));
  const tagPeople = useQuery({
    queryKey: ["profiles-by-ids", tagPeopleIds],
    queryFn: () => getProfilesByIds(tagPeopleIds),
    enabled: tagPeopleIds.length > 0,
  });
  const tagPeopleMap = new Map((tagPeople.data ?? []).map((p) => [p.id, p]));

  const addTag = useMutation({
    mutationFn: async (taggedId: string) => {
      if (!user) throw new Error("Inicia sesión para etiquetar");
      await addPhotoTag(photoId, taggedId, user.id);
    },
    onSuccess: () => {
      setTagChoice("");
      toast.success("Persona etiquetada");
      void queryClient.invalidateQueries({ queryKey: ["photo-tags", photoId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeTag = useMutation({
    mutationFn: (taggedId: string) => removePhotoTag(photoId, taggedId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["photo-tags", photoId] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const like = useMutation({
    mutationFn: () => togglePhotoLike(photoId, user!.id, liked),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["photo-likes", photoId] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const addComment = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Inicia sesión para comentar");
      const parsed = textPostSchema.safeParse(comment);
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Texto no válido");
      await addPhotoComment(photoId, user.id, parsed.data);
    },
    onSuccess: () => {
      setComment("");
      void queryClient.invalidateQueries({ queryKey: ["photo-comments", photoId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeComment = useMutation({
    mutationFn: (id: string) => deletePhotoComment(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["photo-comments", photoId] }),
  });

  const removePhoto = useMutation({
    mutationFn: () => deletePhoto(photoId),
    onSuccess: () => {
      toast.success("Foto eliminada");
      window.history.back();
    },
  });

  if (photoQuery.isLoading) {
    return <div className="p-10 text-center text-muted-foreground">Cargando foto…</div>;
  }
  if (!photo) throw notFound();

  const author = owner.data?.[0];
  const isMine = user?.id === photo.user_id;

  return (
    <main className="mx-auto grid max-w-5xl gap-4 px-3 py-6 md:grid-cols-[1.4fr_1fr]">
      <div className="panel overflow-hidden">
        <MediaImage
          path={photo.image_url}
          alt={photo.title || "Foto del fotolog"}
          className="max-h-[70vh] w-full object-contain"
        />
      </div>

      <aside className="panel flex flex-col p-4">
        {author ? (
          <div className="flex items-center gap-2">
            <UserAvatar
              username={author.username}
              displayName={author.display_name}
              avatarPath={author.avatar_url}
              accent={author.accent_color}
              size={36}
            />
            <Link
              to="/perfil/$username"
              params={{ username: author.username }}
              className="font-semibold hover:text-accent"
            >
              {author.display_name}
            </Link>
          </div>
        ) : null}

        {photo.title ? <h1 className="mt-3 font-display text-xl font-bold">{photo.title}</h1> : null}
        {photo.description ? (
          <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/90">{photo.description}</p>
        ) : null}
        <p className="mt-1 text-xs text-muted-foreground">{timeAgo(photo.created_at)}</p>

        <div className="mt-4 flex items-center gap-2">
          <Button
            size="sm"
            variant={liked ? "default" : "secondary"}
            disabled={!user || like.isPending}
            onClick={() => like.mutate()}
          >
            <Heart className={`mr-1 h-4 w-4 ${liked ? "fill-current" : ""}`} />
            {(likes.data ?? []).length}
          </Button>
          {isMine ? (
            <Button size="sm" variant="ghost" onClick={() => removePhoto.mutate()}>
              Eliminar foto
            </Button>
          ) : null}
        </div>

        <section className="mt-4 border-t border-border/60 pt-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Etiquetas
          </h2>
          {taggedIds.length === 0 ? (
            <p className="mt-1 text-xs text-muted-foreground">Nadie etiquetado todavía.</p>
          ) : (
            <ul className="mt-2 flex flex-wrap gap-2">
              {taggedIds.map((id) => {
                const p = tagPeopleMap.get(id);
                const tag = (tags.data ?? []).find((t) => t.tagged_id === id);
                const canRemove =
                  user && (isMine || user.id === id || user.id === tag?.tagger_id);
                return (
                  <li
                    key={id}
                    className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs"
                  >
                    {p ? (
                      <Link
                        to="/perfil/$username"
                        params={{ username: p.username }}
                        className="hover:text-accent"
                      >
                        {p.display_name || p.username}
                      </Link>
                    ) : (
                      "Alguien"
                    )}
                    {canRemove ? (
                      <button
                        type="button"
                        aria-label="Quitar etiqueta"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => removeTag.mutate(id)}
                      >
                        ×
                      </button>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}

          {user && friendIds.some((id) => !taggedIds.includes(id)) ? (
            <form
              className="mt-2 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (tagChoice) addTag.mutate(tagChoice);
              }}
            >
              <select
                value={tagChoice}
                onChange={(e) => setTagChoice(e.target.value)}
                aria-label="Etiquetar a un amigo"
                className="h-8 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-xs"
              >
                <option value="">Etiquetar a un amigo…</option>
                {friendIds
                  .filter((id) => !taggedIds.includes(id))
                  .map((id) => {
                    const p = tagPeopleMap.get(id);
                    return (
                      <option key={id} value={id}>
                        {p?.display_name || p?.username || "Amigo"}
                      </option>
                    );
                  })}
              </select>
              <Button type="submit" size="sm" disabled={!tagChoice || addTag.isPending}>
                Etiquetar
              </Button>
            </form>
          ) : null}
        </section>

        <ul className="mt-4 flex-1 space-y-3 overflow-y-auto">
          {(comments.data ?? []).length === 0 ? (
            <li className="text-xs text-muted-foreground">Sé el primero en comentar.</li>
          ) : (
            (comments.data ?? []).map((c) => {
              const p = commenterMap.get(c.author_id);
              return (
                <li key={c.id} className="flex gap-2 text-sm">
                  {p ? (
                    <UserAvatar
                      username={p.username}
                      displayName={p.display_name}
                      avatarPath={p.avatar_url}
                      accent={p.accent_color}
                      size={28}
                    />
                  ) : null}
                  <p className="min-w-0 flex-1">
                    <span className="font-semibold">{p?.display_name ?? "Alguien"}</span>{" "}
                    <span className="break-words text-foreground/90">{c.body}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {timeAgo(c.created_at)}
                    </span>
                  </p>
                  {user && (c.author_id === user.id || isMine) ? (
                    <button
                      className="text-xs text-muted-foreground hover:text-destructive"
                      onClick={() => removeComment.mutate(c.id)}
                    >
                      ×
                    </button>
                  ) : null}
                </li>
              );
            })
          )}
        </ul>

        {user ? (
          <form
            className="mt-4 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              addComment.mutate();
            }}
          >
            <Input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Escribe un comentario…"
              maxLength={500}
              aria-label="Comentario"
            />
            <Button type="submit" size="sm" disabled={addComment.isPending}>
              Enviar
            </Button>
          </form>
        ) : (
          <p className="mt-4 text-xs text-muted-foreground">
            <Link to="/auth" search={{ next: "" }} className="underline">
              Entra
            </Link>{" "}
            para comentar.
          </p>
        )}
      </aside>
    </main>
  );
}