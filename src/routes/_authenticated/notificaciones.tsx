import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { useSession } from "@/lib/session";
import { getNotifications, getProfilesByIds, markNotificationsRead } from "@/lib/api";
import { timeAgo } from "@/lib/format";
import { UserAvatar } from "@/components/UserAvatar";

export const Route = createFileRoute("/_authenticated/notificaciones")({
  head: () => ({
    meta: [
      { title: "Notificaciones — nocturno" },
      { name: "description", content: "Todo lo que ha pasado en tu perfil, tu muro y tu fotolog." },
      { property: "og:title", content: "Notificaciones — nocturno" },
      { property: "og:description", content: "Todo lo que ha pasado en tu perfil y tu fotolog." },
    ],
  }),
  component: NotificationsPage,
});

const LABELS: Record<string, string> = {
  friend_request: "te ha enviado una solicitud de amistad",
  friend_accept: "ha aceptado tu solicitud de amistad",
  friend_accepted: "ha aceptado tu solicitud de amistad",
  photo_comment: "ha comentado tu foto",
  photo_like: "le ha gustado tu foto",
  photo_tag: "te ha etiquetado en una foto",
  photo_new: "ha subido una foto nueva",
  wall_post: "ha escrito en tu muro",
  message: "te ha enviado un mensaje",
};

const PHOTO_TYPES = new Set(["photo_comment", "photo_like", "photo_tag", "photo_new"]);

function NotificationsPage() {
  const { user } = useSession();
  const queryClient = useQueryClient();

  const notifications = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: () => getNotifications(user!.id),
    enabled: Boolean(user),
  });

  const actorIds = Array.from(
    new Set((notifications.data ?? []).map((n) => n.actor_id).filter((v): v is string => Boolean(v))),
  );
  const actors = useQuery({
    queryKey: ["profiles-by-ids", actorIds],
    queryFn: () => getProfilesByIds(actorIds),
    enabled: actorIds.length > 0,
  });
  const actorMap = new Map((actors.data ?? []).map((p) => [p.id, p]));

  useEffect(() => {
    if (!user || !notifications.data?.some((n) => !n.read)) return;
    void markNotificationsRead(user.id).then(() =>
      queryClient.invalidateQueries({ queryKey: ["notifications", user.id] }),
    );
  }, [user, notifications.data, queryClient]);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-display text-2xl font-bold">Notificaciones</h1>
      <ul className="mt-5 space-y-2">
        {(notifications.data ?? []).length === 0 ? (
          <li className="panel p-6 text-center text-sm text-muted-foreground">
            Todavía no tienes notificaciones.
          </li>
        ) : (
          (notifications.data ?? []).map((n) => {
            const actor = n.actor_id ? actorMap.get(n.actor_id) : undefined;
            return (
              <li
                key={n.id}
                className={`panel flex items-center gap-3 p-3 ${n.read ? "" : "glow-accent"}`}
              >
                {actor ? (
                  <UserAvatar
                    username={actor.username}
                    displayName={actor.display_name}
                    avatarPath={actor.avatar_url}
                    accent={actor.accent_color}
                    size={36}
                  />
                ) : null}
                <p className="min-w-0 flex-1 text-sm">
                  {actor ? (
                    <Link
                      to="/perfil/$username"
                      params={{ username: actor.username }}
                      className="font-semibold hover:text-accent"
                    >
                      {actor.display_name}
                    </Link>
                  ) : (
                    "Alguien"
                  )}{" "}
                  {LABELS[n.type] ?? "ha interactuado contigo"}
                  {PHOTO_TYPES.has(n.type) && n.entity_id ? (
                    <>
                      {" "}
                      <Link
                        to="/foto/$photoId"
                        params={{ photoId: n.entity_id }}
                        className="underline hover:text-accent"
                      >
                        Ver foto
                      </Link>
                    </>
                  ) : null}
                  {n.type === "message" && actor ? (
                    <>
                      {" "}
                      <Link
                        to="/mensajes"
                        search={{ con: actor.username }}
                        className="underline hover:text-accent"
                      >
                        Responder
                      </Link>
                    </>
                  ) : null}
                  {n.type === "friend_request" ? (
                    <>
                      {" "}
                      <Link to="/amigos" className="underline hover:text-accent">
                        Ver solicitudes
                      </Link>
                    </>
                  ) : null}
                  <span className="ml-2 text-xs text-muted-foreground">{timeAgo(n.created_at)}</span>
                </p>
              </li>
            );
          })
        )}
      </ul>
    </main>
  );
}