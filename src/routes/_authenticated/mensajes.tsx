import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/session";
import {
  getAllMessages,
  getConversation,
  getProfileByUsername,
  getProfilesByIds,
  markConversationRead,
  sendMessage,
} from "@/lib/api";
import { textPostSchema } from "@/lib/validation";
import { timeAgo } from "@/lib/format";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/mensajes")({
  validateSearch: (search: Record<string, unknown>) => ({
    con: typeof search["con"] === "string" ? search["con"].slice(0, 20) : "",
  }),
  head: () => ({
    meta: [
      { title: "Mensajes — nocturno" },
      { name: "description", content: "Chatea en privado con tus amigos en tiempo real." },
      { property: "og:title", content: "Mensajes — nocturno" },
      { property: "og:description", content: "Chatea en privado con tus amigos en tiempo real." },
    ],
  }),
  component: MessagesPage,
});

function MessagesPage() {
  const { con } = Route.useSearch();
  const { user } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const all = useQuery({
    queryKey: ["messages", user?.id],
    queryFn: () => getAllMessages(user!.id),
    enabled: Boolean(user),
  });

  const partnerIds = Array.from(
    new Set(
      (all.data ?? []).map((m) => (m.sender_id === user?.id ? m.recipient_id : m.sender_id)),
    ),
  );
  const partners = useQuery({
    queryKey: ["profiles-by-ids", partnerIds],
    queryFn: () => getProfilesByIds(partnerIds),
    enabled: partnerIds.length > 0,
  });

  const active = useQuery({
    queryKey: ["profile", con],
    queryFn: () => getProfileByUsername(con),
    enabled: con.length > 0,
  });

  const conversation = useQuery({
    queryKey: ["conversation", user?.id, active.data?.id],
    queryFn: () => getConversation(user!.id, active.data!.id),
    enabled: Boolean(user && active.data),
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("messages-page")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["messages"] });
        void queryClient.invalidateQueries({ queryKey: ["conversation"] });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  useEffect(() => {
    if (!user || !active.data) return;
    void markConversationRead(user.id, active.data.id).then(() =>
      queryClient.invalidateQueries({ queryKey: ["messages"] }),
    );
  }, [user, active.data, conversation.data, queryClient]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [conversation.data]);

  const send = useMutation({
    mutationFn: async () => {
      const parsed = textPostSchema.safeParse(draft);
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Mensaje no válido");
      if (!active.data) throw new Error("Elige una conversación");
      await sendMessage(user!.id, active.data.id, parsed.data);
    },
    onSuccess: () => {
      setDraft("");
      void queryClient.invalidateQueries({ queryKey: ["conversation"] });
      void queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const lastByPartner = new Map<string, string>();
  for (const m of all.data ?? []) {
    const other = m.sender_id === user?.id ? m.recipient_id : m.sender_id;
    if (!lastByPartner.has(other)) lastByPartner.set(other, m.body);
  }

  return (
    <main className="mx-auto grid max-w-5xl gap-4 px-3 py-6 md:grid-cols-[260px_1fr]">
      <aside className="panel h-fit p-3">
        <h1 className="px-1 font-display text-lg font-bold">Mensajes</h1>
        <ul className="mt-3 space-y-1">
          {(partners.data ?? []).length === 0 ? (
            <li className="px-1 text-xs text-muted-foreground">
              Escribe a un amigo desde{" "}
              <Link to="/amigos" className="underline">
                tus amigos
              </Link>
              .
            </li>
          ) : (
            (partners.data ?? []).map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => void navigate({ to: "/mensajes", search: { con: p.username } })}
                  className={`flex w-full items-center gap-2 rounded-md p-2 text-left transition-colors hover:bg-secondary ${
                    con === p.username ? "bg-secondary" : ""
                  }`}
                >
                  <UserAvatar
                    username={p.username}
                    displayName={p.display_name}
                    avatarPath={p.avatar_url}
                    accent={p.accent_color}
                    size={32}
                    link={false}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{p.display_name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {lastByPartner.get(p.id)}
                    </span>
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      </aside>

      <section className="panel flex min-h-[60vh] flex-col p-3">
        {!active.data ? (
          <p className="m-auto text-sm text-muted-foreground">
            Elige una conversación para empezar.
          </p>
        ) : (
          <>
            <header className="flex items-center gap-2 border-b border-border pb-3">
              <UserAvatar
                username={active.data.username}
                displayName={active.data.display_name}
                avatarPath={active.data.avatar_url}
                accent={active.data.accent_color}
                size={32}
              />
              <h2 className="font-display font-bold">{active.data.display_name}</h2>
            </header>

            <div className="flex-1 space-y-2 overflow-y-auto py-3">
              {(conversation.data ?? []).map((m) => {
                const mine = m.sender_id === user?.id;
                return (
                  <div
                    key={m.id}
                    className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                      mine
                        ? "ml-auto bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{m.body}</p>
                    <p className="mt-1 text-[10px] opacity-70">{timeAgo(m.created_at)}</p>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <form
              className="flex gap-2 border-t border-border pt-3"
              onSubmit={(e) => {
                e.preventDefault();
                send.mutate();
              }}
            >
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Escribe un mensaje…"
                maxLength={500}
                aria-label="Mensaje"
              />
              <Button type="submit" disabled={send.isPending}>
                Enviar
              </Button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}