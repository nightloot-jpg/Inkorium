import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useSession } from "@/lib/session";
import {
  getFriendshipsFor,
  getProfilesByIds,
  removeFriendship,
  respondFriendRequest,
} from "@/lib/api";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/amigos")({
  head: () => ({
    meta: [
      { title: "Mis amigos — nocturno" },
      { name: "description", content: "Gestiona tus amigos y las solicitudes pendientes." },
      { property: "og:title", content: "Mis amigos — nocturno" },
      { property: "og:description", content: "Gestiona tus amigos y las solicitudes pendientes." },
    ],
  }),
  component: FriendsPage,
});

function FriendsPage() {
  const { user } = useSession();
  const queryClient = useQueryClient();

  const friendships = useQuery({
    queryKey: ["friendships", user?.id],
    queryFn: () => getFriendshipsFor(user!.id),
    enabled: Boolean(user),
  });

  const rows = friendships.data ?? [];
  const accepted = rows.filter((r) => r.status === "accepted");
  const incoming = rows.filter((r) => r.status === "pending" && r.addressee_id === user?.id);
  const outgoing = rows.filter((r) => r.status === "pending" && r.requester_id === user?.id);

  const ids = Array.from(
    new Set(
      rows.flatMap((r) => [r.requester_id, r.addressee_id]).filter((id) => id !== user?.id),
    ),
  );
  const profiles = useQuery({
    queryKey: ["profiles-by-ids", ids],
    queryFn: () => getProfilesByIds(ids),
    enabled: ids.length > 0,
  });
  const map = new Map((profiles.data ?? []).map((p) => [p.id, p]));

  const respond = useMutation({
    mutationFn: ({ id, accept }: { id: string; accept: boolean }) =>
      respondFriendRequest(id, accept),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["friendships"] });
      toast.success("Listo");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => removeFriendship(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["friendships"] });
      toast.success("Amistad eliminada");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const other = (r: { requester_id: string; addressee_id: string }) =>
    map.get(r.requester_id === user?.id ? r.addressee_id : r.requester_id);

  return (
    <main className="mx-auto max-w-2xl space-y-8 px-4 py-8">
      <section>
        <h1 className="font-display text-2xl font-bold">Solicitudes recibidas</h1>
        <ul className="mt-4 space-y-2">
          {incoming.length === 0 ? (
            <li className="panel p-5 text-sm text-muted-foreground">No tienes solicitudes.</li>
          ) : (
            incoming.map((r) => {
              const p = other(r);
              if (!p) return null;
              return (
                <li key={r.id} className="panel flex items-center gap-3 p-3">
                  <UserAvatar
                    username={p.username}
                    displayName={p.display_name}
                    avatarPath={p.avatar_url}
                    accent={p.accent_color}
                  />
                  <Link
                    to="/perfil/$username"
                    params={{ username: p.username }}
                    className="min-w-0 flex-1 truncate font-semibold hover:text-accent"
                  >
                    {p.display_name}
                  </Link>
                  <Button size="sm" onClick={() => respond.mutate({ id: r.id, accept: true })}>
                    Aceptar
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => respond.mutate({ id: r.id, accept: false })}
                  >
                    Rechazar
                  </Button>
                </li>
              );
            })
          )}
        </ul>
      </section>

      <section>
        <h2 className="font-display text-xl font-bold">Mis amigos ({accepted.length})</h2>
        <ul className="mt-4 space-y-2">
          {accepted.length === 0 ? (
            <li className="panel p-5 text-sm text-muted-foreground">
              Aún no tienes amigos.{" "}
              <Link to="/gente" search={{ q: "" }} className="underline hover:text-accent">
                Busca gente
              </Link>
              .
            </li>
          ) : (
            accepted.map((r) => {
              const p = other(r);
              if (!p) return null;
              return (
                <li key={r.id} className="panel flex items-center gap-3 p-3">
                  <UserAvatar
                    username={p.username}
                    displayName={p.display_name}
                    avatarPath={p.avatar_url}
                    accent={p.accent_color}
                  />
                  <Link
                    to="/perfil/$username"
                    params={{ username: p.username }}
                    className="min-w-0 flex-1 truncate font-semibold hover:text-accent"
                  >
                    {p.display_name}
                  </Link>
                  <Button asChild size="sm" variant="secondary">
                    <Link to="/mensajes" search={{ con: p.username }}>
                      Mensaje
                    </Link>
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove.mutate(r.id)}>
                    Eliminar
                  </Button>
                </li>
              );
            })
          )}
        </ul>
      </section>

      {outgoing.length > 0 ? (
        <section>
          <h2 className="font-display text-xl font-bold">Solicitudes enviadas</h2>
          <ul className="mt-4 space-y-2">
            {outgoing.map((r) => {
              const p = other(r);
              if (!p) return null;
              return (
                <li key={r.id} className="panel flex items-center gap-3 p-3 text-sm">
                  <UserAvatar
                    username={p.username}
                    displayName={p.display_name}
                    avatarPath={p.avatar_url}
                    accent={p.accent_color}
                    size={32}
                  />
                  <span className="flex-1 truncate">{p.display_name}</span>
                  <span className="text-xs text-muted-foreground">Pendiente</span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </main>
  );
}