import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { Camera, Maximize2, MessageCircle, Minimize, Paperclip, Search, Send, Smile, UserPlus, X } from "lucide-react";
import { supabase } from "./lib/supabase";

type ChatContact = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
};

type ChatMessage = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  pending?: boolean;
};

type ChatWindowState = {
  id: string;
  contact: ChatContact;
  channelId: string;
  messages: ChatMessage[];
  draft: string;
  loading: boolean;
  minimized: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  unreadCount: number;
  zIndex: number;
};

const DEFAULT_WIDTH = 320;
const DEFAULT_HEIGHT = 400;
const START_Y_OFFSET = 16;
const WINDOW_GAP = 8;

const contactName = (contact: ChatContact) => contact.username || contact.full_name || "Usuario";

const themeColor = (theme: string) => {
  const colors: Record<string, string> = {
    blue: "#1e6fdf",
    violet: "#7c3aed",
    green: "#059669",
    sunset: "#ea580c",
    rose: "#e11d48",
    teal: "#0d9488",
  };
  return colors[theme] || colors.blue;
};

const formatTime = (value: string) =>
  new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

interface ChatWindowProps {
  window: ChatWindowState;
  myId: string;
  onlineIds: Set<string>;
  color: string;
  onClose: (id: string) => void;
  onMinimize: (id: string) => void;
  onMaximize: (id: string) => void;
  onSend: (id: string, text: string) => void;
  onDraft: (id: string, text: string) => void;
  onPosition: (id: string, position: { x: number; y: number }) => void;
  onFocus: (id: string) => void;
}

function ChatWindow({
  window: chatWindow,
  myId,
  onlineIds,
  color,
  onClose,
  onMinimize,
  onMaximize,
  onSend,
  onDraft,
  onPosition,
  onFocus,
}: ChatWindowProps) {
  const { contact, messages, draft, loading, minimized, position, size, unreadCount } = chatWindow;
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ x: 0, y: 0, px: 0, py: 0 });
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!dragging) return;

    const move = (event: MouseEvent) => {
      const nextX = dragRef.current.px + event.clientX - dragRef.current.x;
      const nextY = dragRef.current.py + event.clientY - dragRef.current.y;
      const x = Math.max(16, Math.min(nextX, globalThis.window.innerWidth - size.width - 16));
      const y = Math.max(16, Math.min(nextY, globalThis.window.innerHeight - size.height - 16));
      onPosition(chatWindow.id, { x, y });
    };

    const stop = () => setDragging(false);

    globalThis.window.addEventListener("mousemove", move);
    globalThis.window.addEventListener("mouseup", stop);
    return () => {
      globalThis.window.removeEventListener("mousemove", move);
      globalThis.window.removeEventListener("mouseup", stop);
    };
  }, [chatWindow.id, dragging, onPosition, size.height, size.width]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (text) onSend(chatWindow.id, text);
  };

  if (minimized) {
    return (
      <div
        className="tuenti-chat-minimized"
        style={{ left: position.x, bottom: START_Y_OFFSET, zIndex: chatWindow.zIndex, width: size.width, background: color }}
        onClick={() => onMaximize(chatWindow.id)}
      >
        <div className="tuenti-minimized-content">
          <div className="tuenti-minimized-avatar">
            {contact.avatar_url ? <img src={contact.avatar_url} alt="" /> : contactName(contact).slice(0, 1)}
          </div>
          <span className="tuenti-minimized-name">{contactName(contact)}</span>
          {unreadCount > 0 && <span className="tuenti-minimized-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>}
          <button className="tuenti-minimized-close" onClick={(event) => { event.stopPropagation(); onClose(chatWindow.id); }}>
            <X size={12} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="tuenti-chat-window"
      style={{ left: position.x, bottom: position.y, width: size.width, height: size.height, zIndex: chatWindow.zIndex }}
      onMouseDown={() => onFocus(chatWindow.id)}
    >
      <div
        className="tuenti-chat-header"
        style={{ background: color }}
        onMouseDown={(event) => {
          if ((event.target as HTMLElement).closest("button")) return;
          dragRef.current = { x: event.clientX, y: event.clientY, px: position.x, py: position.y };
          setDragging(true);
        }}
      >
        <div className="tuenti-header-left">
          <div className="tuenti-header-avatar">
            {contact.avatar_url ? <img src={contact.avatar_url} alt="" /> : contactName(contact).slice(0, 1)}
            <span className={`tuenti-status-dot ${onlineIds.has(contact.id) ? "online" : "offline"}`} />
          </div>
          <span className="tuenti-header-name">{contactName(contact)}</span>
        </div>
        <div className="tuenti-header-right">
          <button className="tuenti-header-btn" onClick={() => onMinimize(chatWindow.id)}><Minimize size={12} /></button>
          <button className="tuenti-header-btn" onClick={() => onMaximize(chatWindow.id)}><Maximize2 size={12} /></button>
          <button className="tuenti-header-btn tuenti-close-btn" onClick={() => onClose(chatWindow.id)}><X size={12} /></button>
        </div>
      </div>

      <div ref={scrollRef} className="tuenti-chat-messages" style={{ height: size.height - 140 }}>
        {loading ? (
          <div className="tuenti-loading">Cargando...</div>
        ) : messages.length === 0 ? (
          <div className="tuenti-empty">Sin mensajes aún</div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`tuenti-message ${message.sender_id === myId ? "mine" : "theirs"}`}>
              <div className={`tuenti-bubble${message.pending ? " pending" : ""}`}>{message.content}</div>
              <span className="tuenti-time">{formatTime(message.created_at)}</span>
            </div>
          ))
        )}
      </div>

      <div className="tuenti-chat-input" style={{ borderTopColor: color }}>
        <div className="tuenti-input-toolbar">
          <button type="button" className="tuenti-toolbar-btn"><Paperclip size={14} /></button>
          <button type="button" className="tuenti-toolbar-btn"><Smile size={14} /></button>
          <button type="button" className="tuenti-toolbar-btn"><Camera size={14} /></button>
        </div>
        <form className="tuenti-input-form" onSubmit={submit}>
          <input
            value={draft}
            onChange={(event) => onDraft(chatWindow.id, event.target.value)}
            placeholder="Escribe un mensaje..."
            className="tuenti-input"
            style={{ borderColor: color }}
          />
          <button type="submit" disabled={!draft.trim()} className="tuenti-send-btn" style={{ background: color }}>
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}

interface ContactPanelProps {
  contacts: ChatContact[];
  onlineIds: Set<string>;
  unreadByContact: Record<string, number>;
  color: string;
  onOpen: (contact: ChatContact) => void;
  onClose: () => void;
  navigate: (page: string, params?: Record<string, unknown>) => void;
}

function ContactPanel({ contacts, onlineIds, unreadByContact, color, onOpen, onClose, navigate }: ContactPanelProps) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query ? contacts.filter((contact) => contactName(contact).toLowerCase().includes(query)) : contacts;
  }, [contacts, search]);

  return (
    <div className="tuenti-contact-panel" style={{ borderColor: color }}>
      <div className="tuenti-panel-header" style={{ background: color }}>
        <span>Mensajes</span>
        <button className="tuenti-panel-close" onClick={onClose}><X size={16} /></button>
      </div>
      <div className="tuenti-panel-search" style={{ borderColor: color }}>
        <Search size={16} />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar..." />
      </div>
      <div className="tuenti-contact-list">
        {filtered.map((contact) => (
          <button key={contact.id} className="tuenti-contact-row" onClick={() => { onOpen(contact); onClose(); }}>
            <div className="tuenti-contact-avatar">
              {contact.avatar_url ? <img src={contact.avatar_url} alt="" /> : contactName(contact).slice(0, 1)}
              <span className={`tuenti-status-dot ${onlineIds.has(contact.id) ? "online" : "offline"}`} />
            </div>
            <div className="tuenti-contact-info"><span className="tuenti-contact-name">{contactName(contact)}</span></div>
            {unreadByContact[contact.id] > 0 && <span className="tuenti-unread-badge" style={{ background: color }}>{unreadByContact[contact.id]}</span>}
          </button>
        ))}
      </div>
      <button className="tuenti-panel-add-contact" onClick={() => { onClose(); navigate("personas"); }}>
        <UserPlus size={16} /> Agregar contacto
      </button>
    </div>
  );
}

export function ChatWidget({ session, navigate }: { session: Session; navigate: (page: string, params?: Record<string, unknown>) => void }) {
  const myId = session.user.id;
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());
  const [unreadByContact] = useState<Record<string, number>>({});
  const [windows, setWindows] = useState<Record<string, ChatWindowState>>({});
  const [panelOpen, setPanelOpen] = useState(false);
  const [zIndex, setZIndex] = useState(1000);
  const [theme, setTheme] = useState("blue");

  useEffect(() => {
    const stored = localStorage.getItem("inkorium-theme");
    if (stored) setTheme(stored);
    const onStorage = (event: StorageEvent) => {
      if (event.key === "inkorium-theme" && event.newValue) setTheme(event.newValue);
    };
    globalThis.window.addEventListener("storage", onStorage);
    return () => globalThis.window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    const openPanel = () => setPanelOpen(true);
    globalThis.window.addEventListener("open-chat-panel", openPanel);
    return () => globalThis.window.removeEventListener("open-chat-panel", openPanel);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadContacts = async () => {
      const [outgoing, incoming] = await Promise.all([
        supabase.from("friendships").select("friend_id").eq("user_id", myId).eq("status", "accepted"),
        supabase.from("friendships").select("user_id").eq("friend_id", myId).eq("status", "accepted"),
      ]);
      const ids = Array.from(new Set([
        ...(outgoing.data ?? []).map((row) => row.friend_id),
        ...(incoming.data ?? []).map((row) => row.user_id),
      ]));
      if (!ids.length) { setContacts([]); return; }
      const { data } = await supabase.from("profiles").select("id, username, full_name, avatar_url").in("id", ids);
      if (!cancelled) setContacts((data ?? []) as ChatContact[]);
    };
    void loadContacts();
    return () => { cancelled = true; };
  }, [myId]);

  useEffect(() => {
    const channel = supabase.channel(`online-users:${myId}`, { config: { presence: { key: myId } } });
    channel.on("presence", { event: "sync" }, () => setOnlineIds(new Set(Object.keys(channel.presenceState()))));
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") void channel.track({ user_id: myId, online_at: new Date().toISOString() });
    });
    return () => { void supabase.removeChannel(channel); };
  }, [myId]);

  const findOrCreateChannel = useCallback(async (contactId: string) => {
    const { data: mine } = await supabase.from("chat_participants").select("channel_id").eq("user_id", myId);
    const channelIds = (mine ?? []).map((row) => row.channel_id);
    if (channelIds.length) {
      const { data: shared } = await supabase.from("chat_participants").select("channel_id").eq("user_id", contactId).in("channel_id", channelIds);
      if (shared?.[0]?.channel_id) return shared[0].channel_id as string;
    }

    const { data: channel, error } = await supabase.from("chat_channels").insert({ type: "direct" }).select("id").single();
    if (error || !channel) return null;
    const { error: participantError } = await supabase.from("chat_participants").insert([
      { channel_id: channel.id, user_id: myId, role: "member" },
      { channel_id: channel.id, user_id: contactId, role: "member" },
    ]);
    if (participantError) {
      await supabase.from("chat_channels").delete().eq("id", channel.id);
      return null;
    }
    return channel.id as string;
  }, [myId]);

  const loadMessages = useCallback(async (channelId: string) => {
    const { data } = await supabase
      .from("chat_messages")
      .select("id, sender_id, content, created_at")
      .eq("channel_id", channelId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: true })
      .limit(50);
    return (data ?? []) as ChatMessage[];
  }, []);

  const openConversation = useCallback(async (contact: ChatContact) => {
    if (windows[contact.id]) {
      setWindows((current) => ({ ...current, [contact.id]: { ...current[contact.id], minimized: false } }));
      return;
    }
    const channelId = await findOrCreateChannel(contact.id);
    if (!channelId) return;
    const messages = await loadMessages(channelId);
    const openCount = Object.values(windows).filter((item) => !item.minimized).length;
    const nextZ = zIndex + 1;
    const x = Math.max(16, globalThis.window.innerWidth - DEFAULT_WIDTH - 16 - (openCount % 4) * (DEFAULT_WIDTH + WINDOW_GAP));
    const y = START_Y_OFFSET + (openCount % 4) * (DEFAULT_HEIGHT + WINDOW_GAP);
    setWindows((current) => ({
      ...current,
      [contact.id]: {
        id: contact.id,
        contact,
        channelId,
        messages,
        draft: "",
        loading: false,
        minimized: false,
        position: { x, y },
        size: { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT },
        unreadCount: 0,
        zIndex: nextZ,
      },
    }));
    setZIndex(nextZ);
  }, [findOrCreateChannel, loadMessages, windows, zIndex]);

  const sendMessage = useCallback(async (id: string, content: string) => {
    const current = windows[id];
    if (!current) return;
    const tempId = `temp-${Date.now()}`;
    const optimistic: ChatMessage = { id: tempId, sender_id: myId, content, created_at: new Date().toISOString(), pending: true };
    setWindows((state) => ({ ...state, [id]: { ...state[id], messages: [...state[id].messages, optimistic], draft: "" } }));
    const { data, error } = await supabase
      .from("chat_messages")
      .insert({ channel_id: current.channelId, sender_id: myId, type: "text", content })
      .select("id, sender_id, content, created_at")
      .single();
    setWindows((state) => {
      const item = state[id];
      if (!item) return state;
      const messages = error || !data
        ? item.messages.filter((message) => message.id !== tempId)
        : item.messages.map((message) => message.id === tempId ? data as ChatMessage : message);
      return { ...state, [id]: { ...item, messages } };
    });
  }, [myId, windows]);

  const updateDraft = useCallback((id: string, draft: string) => {
    setWindows((state) => ({ ...state, [id]: { ...state[id], draft } }));
  }, []);

  const updatePosition = useCallback((id: string, position: { x: number; y: number }) => {
    setWindows((state) => ({ ...state, [id]: { ...state[id], position } }));
  }, []);

  const focusWindow = useCallback((id: string) => {
    setZIndex((value) => value + 1);
    setWindows((state) => ({ ...state, [id]: { ...state[id], unreadCount: 0 } }));
  }, []);

  const closeWindow = useCallback((id: string) => {
    setWindows((state) => {
      const next = { ...state };
      delete next[id];
      return next;
    });
  }, []);

  const minimizeWindow = useCallback((id: string) => {
    setWindows((state) => ({ ...state, [id]: { ...state[id], minimized: true } }));
  }, []);

  const maximizeWindow = useCallback((id: string) => {
    setWindows((state) => ({ ...state, [id]: { ...state[id], minimized: false } }));
  }, []);

  const color = themeColor(theme);
  const totalUnread = Object.values(unreadByContact).reduce((total, count) => total + count, 0);
  const visibleWindows = Object.values(windows).filter((item) => !item.minimized);
  const minimizedWindows = Object.values(windows).filter((item) => item.minimized);

  return (
    <div className="tuenti-chat-root">
      {panelOpen && (
        <ContactPanel
          contacts={contacts}
          onlineIds={onlineIds}
          unreadByContact={unreadByContact}
          color={color}
          onOpen={openConversation}
          onClose={() => setPanelOpen(false)}
          navigate={navigate}
        />
      )}
      {visibleWindows.map((item) => (
        <ChatWindow
          key={item.id}
          window={item}
          myId={myId}
          onlineIds={onlineIds}
          color={color}
          onClose={closeWindow}
          onMinimize={minimizeWindow}
          onMaximize={maximizeWindow}
          onSend={sendMessage}
          onDraft={updateDraft}
          onPosition={updatePosition}
          onFocus={focusWindow}
        />
      ))}
      {minimizedWindows.map((item) => (
        <ChatWindow
          key={item.id}
          window={item}
          myId={myId}
          onlineIds={onlineIds}
          color={color}
          onClose={closeWindow}
          onMinimize={minimizeWindow}
          onMaximize={maximizeWindow}
          onSend={sendMessage}
          onDraft={updateDraft}
          onPosition={updatePosition}
          onFocus={focusWindow}
        />
      ))}
      <button className="tuenti-chat-toggle" onClick={() => setPanelOpen((value) => !value)} style={{ background: color }}>
        <MessageCircle size={20} />
        {totalUnread > 0 && <span className="tuenti-chat-badge">{totalUnread}</span>}
      </button>
    </div>
  );
}
