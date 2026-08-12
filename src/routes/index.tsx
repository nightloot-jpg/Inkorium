import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useSession } from "@/lib/session";
import {
  getFriendshipsFor,
  getMyProfile,
  getPhotosByUser,
  getProfilesByIds,
  getStatuses,
  postStatus,
  searchProfiles,
  type MiniProfile,
} from "@/lib/api";
import { getAllMessages, getNotifications } from "@/lib/api";
import { textPostSchema } from "@/lib/validation";
import { timeAgo } from "@/lib/format";
import { UserAvatar } from "@/components/UserAvatar";
import { MediaImage } from "@/components/MediaImage";
import { SideMenu } from "@/components/SideMenu";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const sponsoredEvents = [
  {
    title: "Consigue tu entrada para el Smackdown Arena y no te pierdas el mayor espectáculo del mundo!",
    date: "2 de Dic",
    count: 955,
    color: "oklch(0.72 0.14 25)",
  },
  {
    title: "Acierta y gana un ordenador portátil",
    date: "2 de Dic",
    count: 4299,
    color: "oklch(0.55 0.18 20)",
  },
  {
    title: "Participa en el festival Background Music",
    date: "2 de Dic",
    count: 420,
    color: "oklch(0.6 0.12 250)",
  },
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "nocturno — perfiles, fotolog y muro entre amigos" },
      {
        name: "description",
        content:
          "Tu inicio en nocturno: estados de tus amigos, fotolog, muro y notificaciones en tiempo real.",
      },
      { property: "og:title", content: "nocturno — perfiles, fotolog y muro entre amigos" },
      {
        property: "og:description",
        content: "Estados de tus amigos, fotolog, muro y notificaciones en tiempo real.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { user, loading } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth", search: { next: "" }, replace: true });
  }, [loading, user, navigate]);

  if (loading) return <div className="p-10 text-center text-muted-foreground">Cargando…</div>;
  if (!user) return null;
  return <Dashboard userId={user.id} />;
}

function Dashboard({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [body, setBody] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");

  const profile = useQuery({
    queryKey: ["my-profile", userId],
    queryFn: () => getMyProfile(userId),
  });

  const friendships = useQuery({
    queryKey: ["friendships", userId],
    queryFn: () => getFriendshipsFor(userId),
  });

  const friendIds = (friendships.data ?? [])
    .filter((f) => f.status === "accepted")
    .map((f) => (f.requester_id === userId ? f.addressee_id : f.requester_id));
  const pending = (friendships.data ?? []).filter(
    (f) => f.status === "pending" && f.addressee_id === userId,
  );

  const feedIds = [userId, ...friendIds];
  const statuses = useQuery({
    queryKey: ["feed-statuses", feedIds],
    queryFn: () => getStatuses(feedIds),
    enabled: feedIds.length > 0,
  });

  const authorIds = Array.from(new Set((statuses.data ?? []).map((s) => s.user_id)));
  const authors = useQuery({
    queryKey: ["profiles-by-ids", authorIds],
    queryFn: () => getProfilesByIds(authorIds),
    enabled: authorIds.length > 0,
  });
  const authorMap = new Map((authors.data ?? []).map((p) => [p.id, p]));

  const myPhotos = useQuery({
    queryKey: ["photos", userId],
    queryFn: () => getPhotosByUser(userId),
  });

  const suggestions = useQuery({
    queryKey: ["suggestions"],
    queryFn: () => searchProfiles(""),
  });

  const notifications = useQuery({
    queryKey: ["notifications", userId],
    queryFn: () => getNotifications(userId),
  });
  const messages = useQuery({
    queryKey: ["messages", userId],
    queryFn: () => getAllMessages(userId),
  });
  const unreadNotifs = (notifications.data ?? []).filter((n) => !n.read).length;
  const unreadMsgs = (messages.data ?? []).filter(
    (m) => m.recipient_id === userId && !m.read_at,
  ).length;

  const publish = useMutation({
    mutationFn: async () => {
      const parsed = textPostSchema.safeParse(body);
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Texto no válido");
      await postStatus(userId, parsed.data);
    },
    onSuccess: () => {
      setBody("");
      void queryClient.invalidateQueries({ queryKey: ["feed-statuses"] });
      toast.success("Estado publicado");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const excluded = new Set([userId, ...friendIds]);
  const people = (suggestions.data ?? []).filter((p) => !excluded.has(p.id)).slice(0, 6);

  return (
    <div className="t-shell min-h-screen">
    <main className="mx-auto grid max-w-6xl gap-3 px-3 py-4 lg:grid-cols-[230px_1fr_240px]">
      {/* Columna izquierda */}
      <aside className="space-y-3">
        <SideMenu active="novedades" />

        {/* Mini perfil y contadores */}
        <div className="t-panel p-3">
          <p className="flex items-center gap-1.5 border-b border-[var(--t-line)] pb-2 text-[11px] text-[var(--t-ink-soft)]">
            <span className="text-[var(--t-blue)]">▮▮</span>
            <span className="font-bold text-[var(--t-ink)]">{profile.data?.view_count ?? 0}</span>
            visitas a tu perfil
          </p>

          <ul className="mt-2 space-y-1.5">
            {unreadMsgs ? (
              <li>
                <Link to="/mensajes" search={{ con: "" }} className="t-stat">
                  <span className="t-stat-ico">✉</span>
                  {unreadMsgs} mensaje{unreadMsgs === 1 ? "" : "s"} privado
                  {unreadMsgs === 1 ? "" : "s"}
                </Link>
              </li>
            ) : null}
            {pending.length ? (
              <li>
                <Link to="/amigos" className="t-stat">
                  <span className="t-stat-ico">☺</span>
                  {pending.length} solicitud{pending.length === 1 ? "" : "es"} de amistad
                </Link>
              </li>
            ) : null}
            {unreadNotifs ? (
              <li>
                <Link to="/notificaciones" className="t-stat">
                  <span className="t-stat-ico">◆</span>
                  {unreadNotifs} notificaci{unreadNotifs === 1 ? "ón" : "ones"}
                </Link>
              </li>
            ) : null}
            {friendIds.length ? (
              <li>
                <Link to="/amigos" className="t-stat">
                  <span className="t-stat-ico">☻</span>
                  {friendIds.length} amigo{friendIds.length === 1 ? "" : "s"}
                </Link>
              </li>
            ) : null}
          </ul>

          {(myPhotos.data ?? []).length > 0 ? (
            <div className="mt-2 border-t border-[var(--t-line)] pt-2">
              <div className="flex gap-1">
                {(myPhotos.data ?? []).slice(0, 3).map((photo) => (
                  <Link key={photo.id} to="/foto/$photoId" params={{ photoId: photo.id }}>
                    <MediaImage
                      path={photo.image_url}
                      alt={photo.title || "Foto"}
                      className="h-10 w-10 border border-[var(--t-line)] object-cover"
                    />
                  </Link>
                ))}
              </div>
              <p className="mt-2 text-[11px] font-bold text-[var(--t-green)]">
                {myPhotos.data?.length} foto{(myPhotos.data?.length ?? 0) === 1 ? "" : "s"} subidas
              </p>
            </div>
          ) : null}

          <Link to="/ajustes" className="t-link mt-3 inline-block text-[11px]">
            Editar mi perfil
          </Link>
        </div>

        {/* Invitar a tus amigos */}
        <div className="t-panel p-3">
          <h2 className="mb-2 border-b border-[var(--t-line)] pb-1.5 text-[13px] font-bold">
            Invitar a tus amigos
          </h2>
          <div>
            <p className="mb-2 text-[11px] text-[var(--t-ink-soft)]">
              <span className="font-bold text-[var(--t-ink)]">26</span> invitaciones disponibles
            </p>
            <div className="flex gap-1.5">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="email"
                className="t-input"
              />
              <button
                type="button"
                className="t-btn shrink-0"
                onClick={() => {
                  if (!inviteEmail.includes("@")) {
                    toast.error("Escribe un email válido");
                    return;
                  }
                  setInviteEmail("");
                  toast.success("Invitación enviada");
                }}
              >
                Invitar
              </button>
            </div>
          </div>
        </div>

        {/* Eventos patrocinados */}
        <div className="t-panel p-3">
          <h2 className="mb-2 border-b border-[var(--t-line)] pb-1.5 text-[13px] font-bold">
            Eventos patrocinados
          </h2>
          <ul className="space-y-2.5">
            {sponsoredEvents.map((event) => (
              <li key={event.title} className="flex gap-2">
                <span
                  className="mt-0.5 h-7 w-7 shrink-0 rounded-sm border border-[var(--t-line)]"
                  style={{ background: event.color }}
                  aria-hidden
                />
                <p className="text-[11px] leading-[1.35] text-[var(--t-ink-soft)]">
                  <span className="t-link font-bold">{event.title}</span>{" "}
                  <span>{event.date}</span>{" "}
                  <span className="text-[var(--t-ink-soft)]">({event.count})</span>
                </p>
              </li>
            ))}
          </ul>
        </div>

        {/* Calendario */}
        <div className="t-panel p-3">
          <h2 className="mb-2 flex items-center justify-between border-b border-[var(--t-line)] pb-1.5 text-[13px] font-bold">
            <span>Calendario</span>
            <span className="t-link text-[11px] font-normal">Crear evento</span>
          </h2>
          <div className="space-y-2 text-[11px]">
            <p className="font-bold text-[var(--t-ink)]">Hoy</p>
            <p className="text-[var(--t-ink-soft)]">
              <span className="t-link">Contesta una pregunta y gana 10.000 euros</span> 1 de Dic
            </p>
            <p className="font-bold text-[var(--t-ink)]">Mañana</p>
            <p className="text-[var(--t-ink-soft)]">No tienes ningún evento.</p>
            <p className="font-bold text-[var(--t-ink)]">Esta semana</p>
            <p className="text-[var(--t-ink-soft)]">No tienes ningún evento.</p>
          </div>
        </div>
      </aside>

      {/* Columna central */}
      <section className="space-y-3">
        <div className="t-panel p-3">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Actualiza tu estado"
            maxLength={500}
            rows={2}
            className="resize-none border-[var(--t-line)] bg-white text-[13px] text-[var(--t-ink)] placeholder:text-[var(--t-ink-soft)]"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[11px] text-[var(--t-ink-soft)]">{body.length}/500</span>
            <button
              type="button"
              className="t-btn"
              disabled={publish.isPending}
              onClick={() => publish.mutate()}
            >
              Guardar
            </button>
          </div>
        </div>

        <div className="t-panel">
          <div className="t-panel-head flex items-center justify-between">
            <h2 className="text-[15px] font-normal">Novedades</h2>
            <span className="rounded-t bg-[oklch(0.96_0.01_240)] px-3 py-1 text-[11px] font-bold">
              Amigos
            </span>
          </div>

          {statuses.isLoading ? (
            <p className="p-6 text-center text-[12px] text-[var(--t-ink-soft)]">Cargando…</p>
          ) : (statuses.data ?? []).length === 0 ? (
            <p className="p-6 text-center text-[12px] text-[var(--t-ink-soft)]">
              Aún no hay nada por aquí. Publica tu primer estado o busca amigos.
            </p>
          ) : (
            <ul>
              {(statuses.data ?? []).map((status) => {
                const author = authorMap.get(status.user_id);
                return (
                  <li
                    key={status.id}
                    className="flex gap-3 border-b border-[var(--t-line)] p-3 last:border-b-0"
                  >
                    {author ? (
                      <UserAvatar
                        username={author.username}
                        displayName={author.display_name}
                        avatarPath={author.avatar_url}
                        accent={author.accent_color}
                        size={44}
                      />
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px]">
                        {author ? (
                          <Link
                            to="/perfil/$username"
                            params={{ username: author.username }}
                            className="t-link font-bold"
                          >
                            {author.display_name}
                          </Link>
                        ) : (
                          "Alguien"
                        )}
                        <span className="ml-2 text-[11px] text-[var(--t-ink-soft)]">
                          {timeAgo(status.created_at)}
                        </span>
                      </p>
                      <p className="mt-1 whitespace-pre-wrap break-words text-[12px]">
                        {status.body}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* Columna derecha */}
      <aside className="space-y-3">
        <div className="t-panel p-3">
          <h2 className="mb-2 border-b border-[var(--t-line)] pb-1.5 text-[13px] font-bold">
            Añadir amigos
          </h2>
          <ul className="space-y-2">
            {people.length === 0 ? (
              <li className="text-[11px] text-[var(--t-ink-soft)]">Nadie nuevo por ahora.</li>
            ) : (
              people.map((p: MiniProfile) => (
                <li key={p.id} className="flex items-center gap-2">
                  <UserAvatar
                    username={p.username}
                    displayName={p.display_name}
                    avatarPath={p.avatar_url}
                    accent={p.accent_color}
                    size={32}
                  />
                  <Link
                    to="/perfil/$username"
                    params={{ username: p.username }}
                    className="t-link min-w-0 truncate text-[12px]"
                  >
                    {p.display_name}
                  </Link>
                </li>
              ))
            )}
          </ul>
          <button
            type="button"
            className="t-btn mt-3 w-full"
            onClick={() => void navigate({ to: "/gente", search: { q: "" } })}
          >
            Buscar amigos
          </button>
        </div>

        <div className="t-panel p-3">
          <h2 className="mb-2 border-b border-[var(--t-line)] pb-1.5 text-[13px] font-bold">
            Mi fotolog
          </h2>
          <div className="grid grid-cols-3 gap-1.5">
            {(myPhotos.data ?? []).slice(0, 6).map((photo) => (
              <Link key={photo.id} to="/foto/$photoId" params={{ photoId: photo.id }}>
                <MediaImage
                  path={photo.image_url}
                  alt={photo.title || "Foto"}
                  className="aspect-square w-full border border-[var(--t-line)] object-cover"
                />
              </Link>
            ))}
          </div>
          {(myPhotos.data ?? []).length === 0 ? (
            <p className="text-[11px] text-[var(--t-ink-soft)]">
              Sube tu primera foto desde tu perfil.
            </p>
          ) : null}
        </div>
      </aside>
    </main>
    </div>
  );
}
