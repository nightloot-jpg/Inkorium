import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";
import { MessageSquare, X, Minus } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/session";
import {
  getAllMessages,
  getConversation,
  getFriendshipsFor,
  getProfilesByIds,
  markConversationRead,
  sendMessage,
} from "@/lib/api";
import { UserAvatar } from "@/components/UserAvatar";

export function ChatBar() {
  const { user } = useSession();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const queryClient = useQueryClient();
  const [listOpen, setListOpen] = useState(false);
  const [openWith, setOpenWith] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const friendships = useQuery({
    queryKey: ["friendships", user?.id],
    queryFn: () => getFriendshipsFor(user!.id),
    enabled: Boolean(user),
  });

  const friendIds = (friendships.data ?? [])
    .filter((f) => f.status === "accepted")
    .map((f) => (f.requester_id === user?.id ? f.addressee_id : f.requester_id));

  const friends = useQuery({
    queryKey: ["profiles-by-ids", friendIds],
    queryFn: () => getProfilesByIds(friendIds),
    enabled: friendIds.length > 0,
  });

  const messages = useQuery({
    queryKey: ["messages", user?.id],
    queryFn: () => getAllMessages(user!.id),
    enabled: Boolean(user),
  });

  const conversation = useQuery({
    queryKey: ["conversation", user?.id, openWith],
    queryFn: () => getConversation(user!.id, openWith!),
    enabled: Boolean(user && openWith),
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("chatbar-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["messages"] });
        void queryClient.invalidateQueries({ queryKey: ["conversation"] });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  useEffect(() => {
    if (!user || !openWith) return;
    void markConversationRead(user.id, openWith).then(() =>
      queryClient.invalidateQueries({ queryKey: ["messages"] }),
    );
  }, [user, openWith, conversation.data, queryClient]);

  const send = useMutation({
    mutationFn: async () => {
      const body = draft.trim();
      if (!body || !user || !openWith) return;
      await sendMessage(user.id, openWith, body.slice(0, 500));
    },
    onSuccess: () => {
      setDraft("");
      void queryClient.invalidateQueries({ queryKey: ["conversation"] });
      void queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });

  if (!user || pathname === "/auth" || pathname === "/reset-password") return null;

  const all = messages.data ?? [];
  const unreadFrom = (id: string) =>
    all.filter((m) => m.sender_id === id && m.recipient_id === user.id && !m.read_at).length;
  const totalUnread = all.filter((m) => m.recipient_id === user.id && !m.read_at).length;
  const list = friends.data ?? [];
  const active = list.find((p) => p.id === openWith);

  return (
    <div className="t-chat-dock">
      {openWith && active ? (
        <div className="t-chat-win">
          <div className="t-chat-win-head">
            <span className="truncate">{active.display_name}</span>
            <div className="ml-auto flex items-center gap-1">
              <button type="button" aria-label="Minimizar" onClick={() => setOpenWith(null)}>
                <Minus size={12} />
              </button>
              <button type="button" aria-label="Cerrar" onClick={() => setOpenWith(null)}>
                <X size={12} />
              </button>
            </div>
          </div>
          <div className="t-chat-log">
            {(conversation.data ?? []).slice(-40).map((m) => (
              <p key={m.id} className="mb-1 leading-snug">
                <span
                  className={
                    m.sender_id === user.id
                      ? "font-bold text-[var(--t-blue)]"
                      : "font-bold text-[var(--t-green)]"
                  }
                >
                  {m.sender_id === user.id ? "Tú" : active.display_name}:{" "}
                </span>
                {m.body}
              </p>
            ))}
            {(conversation.data ?? []).length === 0 ? (
              <p className="text-[11px] text-[var(--t-ink-soft)]">Aún no hay mensajes.</p>
            ) : null}
          </div>
          <form
            className="flex gap-1 border-t border-[var(--t-line)] p-1.5"
            onSubmit={(e) => {
              e.preventDefault();
              send.mutate();
            }}
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Escribe un mensaje…"
              maxLength={500}
              aria-label="Mensaje"
              className="t-input h-6 flex-1"
            />
            <button type="submit" className="t-btn px-2 py-0 text-[11px]" disabled={send.isPending}>
              Enviar
            </button>
          </form>
        </div>
      ) : null}

      {listOpen ? (
        <div className="t-chat-win">
          <div className="t-chat-win-head">
            Amigos conectados
            <button
              type="button"
              aria-label="Cerrar lista"
              className="ml-auto"
              onClick={() => setListOpen(false)}
            >
              <X size={12} />
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {list.length === 0 ? (
              <p className="p-3 text-[11px] text-[var(--t-ink-soft)]">
                Todavía no tienes amigos añadidos.
              </p>
            ) : (
              list.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="t-chat-friend"
                  onClick={() => {
                    setOpenWith(p.id);
                    setListOpen(false);
                  }}
                >
                  <UserAvatar
                    username={p.username}
                    displayName={p.display_name}
                    avatarPath={p.avatar_url ?? undefined}
                    accent={p.accent_color ?? undefined}
                    size={20}
                  />
                  <span className="truncate">{p.display_name}</span>
                  {unreadFrom(p.id) ? <span className="t-badge ml-auto">{unreadFrom(p.id)}</span> : null}
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}

      <button type="button" className="t-chat-tab" onClick={() => setListOpen((v) => !v)}>
        <MessageSquare size={13} />
        Chat
        <span className="text-[var(--t-ink-soft)]">({list.length})</span>
        {totalUnread ? <span className="t-badge">{totalUnread > 9 ? "9+" : totalUnread}</span> : null}
      </button>
    </div>
  );
}
