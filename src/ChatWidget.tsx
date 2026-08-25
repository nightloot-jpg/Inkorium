import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  Camera,
  Maximize2,
  MessageCircle,
  Minimize2,
  Music2,
  Paperclip,
  Play,
  Search,
  Send,
  Smile,
  UserPlus,
  X,
} from "lucide-react";
import { supabase } from "./lib/supabase";
import { getR2SignedUrl, uploadToPresignedUrl } from "./lib/r2";
import "./chat-realtime.css";

type UserStatus = "conectado" | "ausente" | "desconectado";

type ChatContact = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  user_status: UserStatus | null;
};

type MusicTrack = {
  id: string;
  title: string;
  artist: string | null;
  audio_url: string | null;
  cover_url: string | null;
};

type ChatMessage = {
  id: string;
  channel_id: string;
  sender_id: string;
  type: "text" | "image" | "audio" | "video" | "document" | "location" | "sticker";
  content: string;
  created_at: string;
  pending?: boolean;
};

type ChatWindowState = {
  id: string;
  channelId: string;
  contact: ChatContact;
  messages: ChatMessage[];
  draft: string;
  loading: boolean;
  error?: string;
  minimized: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
};

const DEFAULT_WIDTH = 340;
const DEFAULT_HEIGHT = 440;
const START_Y_OFFSET = 16;
const WINDOW_GAP = 8;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const EMOJIS = ["😀", "😂", "😍", "🥰", "😎", "🤩", "😅", "😭", "😡", "🤔", "👍", "❤️", "🔥", "🎉", "✨", "👏", "🙌", "💜", "🎵", "📷", "🐱", "🐶", "☀️", "🌙"];

const contactName = (contact: ChatContact) => contact.username || contact.full_name || "Usuario";
const themeColor = (theme: string) =>
  ({ blue: "#1e6fdf", violet: "#7c3aed", green: "#059669", sunset: "#ea580c", rose: "#e11d48", teal: "#0d9488" }[theme] || "#1e6fdf");
const formatTime = (value: string) => new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const avatar = (contact: ChatContact) => contactName(contact).slice(0, 1).toUpperCase();
const normalizeStatus = (value: string | null | undefined): UserStatus => value === "ausente" || value === "desconectado" ? value : "conectado";
const statusColor = (value: string | null | undefined) => ({ conectado: "#16a34a", ausente: "#f59e0b", desconectado: "#9ca3af" }[normalizeStatus(value)]);
const statusLabel = (value: string | null | undefined) => ({ conectado: "Conectado", ausente: "Ausente", desconectado: "Desconectado" }[normalizeStatus(value)]);

function parseMessageContent(message: ChatMessage) {
  if (message.type !== "audio") return { kind: message.type, value: message.content };
  try {
    return { kind: "music", value: JSON.parse(message.content) as { trackId?: string; title?: string; artist?: string; coverUrl?: string; audioUrl?: string } };
  } catch {
    return { kind: "audio", value: message.content };
  }
}

function ChatImage({ value }: { value: string }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (/^https?:\/\//i.test(value)) {
      setSrc(value);
      return () => { active = false; };
    }

    setSrc(null);
    void getR2SignedUrl(value)
      .then((url) => { if (active) setSrc(url); })
      .catch((error) => console.error("[Chat] signed image url", error));

    return () => { active = false; };
  }, [value]);

  if (!src) return <span className="tuenti-loading">Cargando foto...</span>;
  return <img className="tuenti-chat-image" src={src} alt="Foto enviada" loading="lazy" />;
}

function MessageBody({ message }: { message: ChatMessage }) {
  const parsed = parseMessageContent(message);
  if (parsed.kind === "image") {
    return <ChatImage value={String(parsed.value)} />;
  }
  if (parsed.kind === "music") {
    const track = parsed.value as { title?: string; artist?: string; coverUrl?: string; audioUrl?: string };
    return (
      <div className="tuenti-chat-music-card">
        {track.coverUrl ? <img src={track.coverUrl} alt="" className="tuenti-chat-music-cover" /> : <div className="tuenti-chat-music-cover tuenti-chat-music-placeholder"><Music2 size={20} /></div>}
        <div className="tuenti-chat-music-meta">
          <strong>{track.title || "Canción"}</strong>
          <span>{track.artist || "Artista desconocido"}</span>
          {track.audioUrl ? <audio controls preload="none" src={track.audioUrl} /> : null}
        </div>
      </div>
    );
  }
  return <span>{String(parsed.value)}</span>;
}

function ChatWindow({
  window: w,
  myId,
  color,
  tracks,
  onClose,
  onMinimize,
  onMaximize,
  onSend,
  onDraft,
  onPosition,
  onFocus,
  onUploadImage,
  onShareMusic,
}: {
  window: ChatWindowState;
  myId: string;
  color: string;
  tracks: MusicTrack[];
  onClose: (id: string) => void;
  onMinimize: (id: string) => void;
  onMaximize: (id: string) => void;
  onSend: (id: string, content: string) => void;
  onDraft: (id: string, draft: string) => void;
  onPosition: (id: string, position: { x: number; y: number }) => void;
  onFocus: (id: string) => void;
  onUploadImage: (id: string, file: File) => void;
  onShareMusic: (id: string, track: MusicTrack) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef({ x: 0, y: 0, px: 0, py: 0 });
  const [dragging, setDragging] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [musicOpen, setMusicOpen] = useState(false);
  const [musicSearch, setMusicSearch] = useState("");

  const filteredTracks = useMemo(() => {
    const query = musicSearch.trim().toLowerCase();
    if (!query) return tracks.slice(0, 20);
    return tracks.filter((track) => `${track.title} ${track.artist || ""}`.toLowerCase().includes(query)).slice(0, 20);
  }, [musicSearch, tracks]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [w.messages]);

  useEffect(() => {
    if (!dragging) return;
    const move = (event: MouseEvent) => {
      const nextX = dragRef.current.px + event.clientX - dragRef.current.x;
      const nextY = dragRef.current.py + event.clientY - dragRef.current.y;
      onPosition(w.id, {
        x: Math.max(8, Math.min(nextX, innerWidth - w.size.width - 8)),
        y: Math.max(8, Math.min(nextY, innerHeight - w.size.height - 8)),
      });
    };
    const stop = () => setDragging(false);
    addEventListener("mousemove", move);
    addEventListener("mouseup", stop);
    return () => {
      removeEventListener("mousemove", move);
      removeEventListener("mouseup", stop);
    };
  }, [dragging, onPosition, w.id, w.size.width, w.size.height]);

  if (w.minimized) {
    return (
      <div className="tuenti-chat-minimized" style={{ left: w.position.x, bottom: START_Y_OFFSET, zIndex: w.zIndex, width: w.size.width, background: color }} onClick={() => onMaximize(w.id)}>
        <div className="tuenti-minimized-content">
          <div className="tuenti-minimized-avatar">{w.contact.avatar_url ? <img src={w.contact.avatar_url} alt="" /> : avatar(w.contact)}</div>
          <span className="tuenti-minimized-name">{contactName(w.contact)}</span>
          <button type="button" className="tuenti-minimized-close" onClick={(event) => { event.stopPropagation(); onClose(w.id); }}><X size={12} /></button>
        </div>
      </div>
    );
  }

  return (
    <div className="tuenti-chat-window" style={{ left: w.position.x, bottom: w.position.y, width: w.size.width, height: w.size.height, zIndex: w.zIndex }} onMouseDown={() => onFocus(w.id)}>
      <div
        className="tuenti-chat-header"
        style={{ background: color }}
        onMouseDown={(event) => {
          if ((event.target as HTMLElement).closest("button")) return;
          dragRef.current = { x: event.clientX, y: event.clientY, px: w.position.x, py: w.position.y };
          setDragging(true);
        }}
      >
        <div className="tuenti-header-left">
          <div className="tuenti-header-avatar">
            {w.contact.avatar_url ? <img src={w.contact.avatar_url} alt="" /> : avatar(w.contact)}
            <span className="tuenti-status-dot" title={statusLabel(w.contact.user_status)} style={{ backgroundColor: statusColor(w.contact.user_status) }} />
          </div>
          <span className="tuenti-header-name">{contactName(w.contact)}</span>
        </div>
        <div className="tuenti-header-right">
          <button type="button" className="tuenti-header-btn" onClick={() => onMinimize(w.id)} title="Minimizar"><Minimize2 size={13} /></button>
          <button type="button" className="tuenti-header-btn" onClick={() => onMaximize(w.id)} title="Maximizar"><Maximize2 size={13} /></button>
          <button type="button" className="tuenti-header-btn tuenti-close-btn" onClick={() => onClose(w.id)} title="Cerrar"><X size={13} /></button>
        </div>
      </div>

      <div ref={scrollRef} className="tuenti-chat-messages" style={{ height: w.size.height - 145 }}>
        {w.loading ? <div className="tuenti-loading">Cargando conversación...</div> : null}
        {!w.loading && w.error ? <div className="tuenti-chat-error">{w.error}</div> : null}
        {!w.loading && !w.error && w.messages.length === 0 ? <div className="tuenti-empty">Sin mensajes aún</div> : null}
        {w.messages.map((message) => (
          <div key={message.id} className={`tuenti-message ${message.sender_id === myId ? "mine" : "theirs"}`}>
            <div className={`tuenti-bubble tuenti-bubble-${message.type}${message.pending ? " pending" : ""}`}>
              <MessageBody message={message} />
            </div>
            <span className="tuenti-time">{formatTime(message.created_at)}</span>
          </div>
        ))}
      </div>

      {emojiOpen ? (
        <div className="tuenti-emoji-picker">
          {EMOJIS.map((emoji) => <button key={emoji} type="button" onClick={() => { onDraft(w.id, `${w.draft}${emoji}`); setEmojiOpen(false); }}>{emoji}</button>)}
        </div>
      ) : null}

      {musicOpen ? (
        <div className="tuenti-music-picker">
          <div className="tuenti-picker-header"><strong>Compartir música</strong><button type="button" onClick={() => setMusicOpen(false)}><X size={14} /></button></div>
          <div className="tuenti-picker-search"><Search size={14} /><input value={musicSearch} onChange={(event) => setMusicSearch(event.target.value)} placeholder="Buscar canción..." /></div>
          <div className="tuenti-picker-list">
            {filteredTracks.length === 0 ? <div className="tuenti-picker-empty">No hay canciones</div> : filteredTracks.map((track) => (
              <button key={track.id} type="button" className="tuenti-picker-track" onClick={() => { onShareMusic(w.id, track); setMusicOpen(false); }}>
                {track.cover_url ? <img src={track.cover_url} alt="" /> : <div className="tuenti-picker-track-placeholder"><Music2 size={15} /></div>}
                <span><strong>{track.title}</strong><small>{track.artist || "Artista desconocido"}</small></span>
                <Play size={14} />
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="tuenti-chat-input" style={{ borderTopColor: color }}>
        <div className="tuenti-input-toolbar">
          <button type="button" className="tuenti-toolbar-btn" title="Adjuntar foto" onClick={() => fileRef.current?.click()}><Paperclip size={14} /></button>
          <button type="button" className="tuenti-toolbar-btn" title="Emoji" onClick={() => { setEmojiOpen((value) => !value); setMusicOpen(false); }}><Smile size={14} /></button>
          <button type="button" className="tuenti-toolbar-btn" title="Foto" onClick={() => fileRef.current?.click()}><Camera size={14} /></button>
          <button type="button" className="tuenti-toolbar-btn tuenti-music-btn" title="Compartir música" onClick={() => { setMusicOpen((value) => !value); setEmojiOpen(false); }}><Music2 size={15} /></button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) onUploadImage(w.id, file); event.currentTarget.value = ""; }} />
        </div>
        <form className="tuenti-input-form" onSubmit={(event) => { event.preventDefault(); const text = w.draft.trim(); if (text) onSend(w.id, text); }}>
          <input value={w.draft} onChange={(event) => onDraft(w.id, event.target.value)} placeholder="Escribe un mensaje..." className="tuenti-input" style={{ borderColor: color }} />
          <button type="submit" disabled={!w.draft.trim() || w.loading} className="tuenti-send-btn" style={{ background: color }} title="Enviar"><Send size={14} /></button>
        </form>
      </div>
    </div>
  );
}

function ContactPanel({ contacts, color, onOpen, onClose, navigate }: { contacts: ChatContact[]; color: string; onOpen: (contact: ChatContact) => void; onClose: () => void; navigate: (page: string, params?: Record<string, unknown>) => void }) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query ? contacts.filter((contact) => contactName(contact).toLowerCase().includes(query)) : contacts;
  }, [contacts, search]);

  return (
    <div className="tuenti-contact-panel" style={{ borderColor: color }}>
      <div className="tuenti-panel-header" style={{ background: color }}>
        <span>Mensajes</span>
        <button type="button" className="tuenti-panel-close" onClick={onClose}><X size={16} /></button>
      </div>
      <div className="tuenti-panel-search" style={{ borderColor: color }}><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar..." /></div>
      <div className="tuenti-contact-list">
        {filtered.length === 0 ? <div className="tuenti-contacts-empty">No tienes contactos disponibles.</div> : filtered.map((contact) => (
          <button type="button" key={contact.id} className="tuenti-contact-row" onClick={(event) => { event.preventDefault(); onOpen(contact); }}>
            <div className="tuenti-contact-avatar">
              {contact.avatar_url ? <img src={contact.avatar_url} alt="" /> : avatar(contact)}
              <span className="tuenti-status-dot" title={statusLabel(contact.user_status)} style={{ backgroundColor: statusColor(contact.user_status) }} />
            </div>
            <div className="tuenti-contact-info"><span className="tuenti-contact-name">{contactName(contact)}</span></div>
          </button>
        ))}
      </div>
      <button type="button" className="tuenti-panel-add-contact" onClick={() => { onClose(); navigate("personas"); }}><UserPlus size={16} /> Agregar contacto</button>
    </div>
  );
}

export function ChatWidget({ session, navigate }: { session: Session; navigate: (page: string, params?: Record<string, unknown>) => void }) {
  const myId = session.user.id;
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
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
    addEventListener("storage", onStorage);
    return () => removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    const open = () => setPanelOpen(true);
    addEventListener("open-chat-panel", open);
    return () => removeEventListener("open-chat-panel", open);
  }, []);

  const loadContacts = useCallback(async () => {
    const [outgoing, incoming] = await Promise.all([
      supabase.from("friendships").select("friend_id").eq("user_id", myId).eq("status", "accepted"),
      supabase.from("friendships").select("user_id").eq("friend_id", myId).eq("status", "accepted"),
    ]);
    if (outgoing.error || incoming.error) {
      console.error("[Chat] friendships", outgoing.error || incoming.error);
      return;
    }
    const ids = Array.from(new Set([...(outgoing.data ?? []).map((row: { friend_id: string }) => row.friend_id), ...(incoming.data ?? []).map((row: { user_id: string }) => row.user_id)]));
    if (!ids.length) {
      setContacts([]);
      return;
    }
    const { data, error } = await supabase.from("profiles").select("id, username, full_name, avatar_url, user_status").in("id", ids);
    if (error) console.error("[Chat] profiles", error);
    setContacts((data ?? []) as ChatContact[]);
  }, [myId]);

  useEffect(() => {
    let cancelled = false;
    void loadContacts().then(() => { if (cancelled) return; });
    const interval = window.setInterval(() => { void loadContacts(); }, 15000);
    return () => { cancelled = true; window.clearInterval(interval); };
  }, [loadContacts]);

  useEffect(() => {
    const channel = supabase
      .channel(`chat-profile-status:${myId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles" }, (payload) => {
        const changed = payload.new as Partial<ChatContact> & { id?: string };
        if (!changed.id) return;
        setContacts((current) => current.map((contact) => contact.id === changed.id ? {
          ...contact,
          username: changed.username ?? contact.username,
          full_name: changed.full_name ?? contact.full_name,
          avatar_url: changed.avatar_url ?? contact.avatar_url,
          user_status: normalizeStatus(changed.user_status),
        } : contact));
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [myId]);

  useEffect(() => {
    let cancelled = false;
    const loadTracks = async () => {
      const { data, error } = await supabase.from("music_tracks").select("id, title, artist, audio_url, cover_url").order("created_at", { ascending: false }).limit(50);
      if (error) console.error("[Chat] music tracks", error);
      if (!cancelled) setTracks((data ?? []) as MusicTrack[]);
    };
    void loadTracks();
    return () => { cancelled = true; };
  }, []);

  const loadMessages = useCallback(async (channelId: string) => {
    const { data, error } = await supabase.from("chat_messages").select("id, channel_id, sender_id, type, content, created_at").eq("channel_id", channelId).order("created_at", { ascending: true }).limit(100);
    if (error) {
      console.error("[Chat] load messages", error);
      throw error;
    }
    return (data ?? []) as ChatMessage[];
  }, []);

  const openConversation = useCallback(async (contact: ChatContact) => {
    const existing = windows[contact.id];
    const nextZ = zIndex + 1;
    if (existing) {
      setWindows((state) => ({ ...state, [contact.id]: { ...state[contact.id], minimized: false, zIndex: nextZ } }));
      setZIndex(nextZ);
      setPanelOpen(false);
      return;
    }

    const openCount = Object.values(windows).filter((window) => !window.minimized).length;
    const x = Math.max(16, innerWidth - DEFAULT_WIDTH - 16 - (openCount % 3) * (DEFAULT_WIDTH + WINDOW_GAP));
    const y = START_Y_OFFSET + (openCount % 3) * 44;
    const shell: ChatWindowState = {
      id: contact.id,
      channelId: "",
      contact,
      messages: [],
      draft: "",
      loading: true,
      minimized: false,
      position: { x, y },
      size: { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT },
      zIndex: nextZ,
    };
    setWindows((state) => ({ ...state, [contact.id]: shell }));
    setZIndex(nextZ);
    setPanelOpen(false);

    const { data: channelId, error } = await supabase.rpc("get_or_create_direct_chat", { p_other_user: contact.id });
    if (error || !channelId) {
      setWindows((state) => state[contact.id] ? { ...state, [contact.id]: { ...state[contact.id], loading: false, error: "No se pudo abrir esta conversación." } } : state);
      console.error("[Chat] direct channel", error);
      return;
    }

    try {
      const messages = await loadMessages(channelId as string);
      setWindows((state) => state[contact.id] ? { ...state, [contact.id]: { ...state[contact.id], channelId: channelId as string, messages, loading: false } } : state);
    } catch (loadError) {
      console.error("[Chat] conversation", loadError);
      setWindows((state) => state[contact.id] ? { ...state, [contact.id]: { ...state[contact.id], channelId: channelId as string, loading: false, error: "No se pudieron cargar los mensajes." } } : state);
    }
  }, [loadMessages, windows, zIndex]);

  useEffect(() => {
    const channels = Object.values(windows)
      .filter((window) => window.channelId)
      .map((window) => supabase
        .channel(`chat-messages:${window.channelId}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `channel_id=eq.${window.channelId}` }, (payload) => {
          const message = payload.new as ChatMessage;
          setWindows((state) => {
            const current = state[window.contact.id];
            if (!current || current.channelId !== message.channel_id || current.messages.some((item) => item.id === message.id)) return state;
            return { ...state, [window.contact.id]: { ...current, messages: [...current.messages, message] } };
          });
        })
        .subscribe());
    return () => { channels.forEach((channel) => void supabase.removeChannel(channel)); };
  }, [windows]);

  const insertMessage = useCallback(async (id: string, type: ChatMessage["type"], content: string) => {
    const current = windows[id];
    if (!current?.channelId) return;
    const tempId = `temp-${crypto.randomUUID()}`;
    const optimistic: ChatMessage = {
      id: tempId,
      channel_id: current.channelId,
      sender_id: myId,
      type,
      content,
      created_at: new Date().toISOString(),
      pending: true,
    };
    setWindows((state) => state[id] ? { ...state, [id]: { ...state[id], messages: [...state[id].messages, optimistic], draft: "" } } : state);

    const { data, error } = await supabase.from("chat_messages").insert({ channel_id: current.channelId, sender_id: myId, type, content }).select("id, channel_id, sender_id, type, content, created_at").single();
    setWindows((state) => {
      const item = state[id];
      if (!item) return state;
      if (error || !data) {
        console.error("[Chat] send", error);
        return { ...state, [id]: { ...item, messages: item.messages.filter((message) => message.id !== tempId) } };
      }
      const saved = data as ChatMessage;
      return { ...state, [id]: { ...item, messages: item.messages.map((message) => message.id === tempId ? saved : message) } };
    });
  }, [myId, windows]);

  const sendMessage = useCallback((id: string, content: string) => void insertMessage(id, "text", content), [insertMessage]);

  const uploadImage = useCallback(async (id: string, file: File) => {
    const current = windows[id];
    if (!current?.channelId || !file.type.startsWith("image/")) return;
    if (file.size > MAX_IMAGE_SIZE) {
      console.warn("[Chat] image too large");
      return;
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const { data, error } = await supabase.functions.invoke("r2-media", {
      body: {
        action: "upload",
        folder: "chat",
        channelId: current.channelId,
        fileName: safeName,
        contentType: file.type,
        size: file.size,
      },
    });

    if (error || !data?.uploadUrl || !data?.key) {
      console.error("[Chat] R2 upload ticket", error || data?.error);
      return;
    }

    try {
      await uploadToPresignedUrl(data.uploadUrl as string, file, file.type);
      await insertMessage(id, "image", data.key as string);
    } catch (uploadError) {
      console.error("[Chat] R2 image upload", uploadError);
    }
  }, [insertMessage, windows]);

  const shareMusic = useCallback((id: string, track: MusicTrack) => {
    const content = JSON.stringify({ kind: "music", trackId: track.id, title: track.title, artist: track.artist, coverUrl: track.cover_url, audioUrl: track.audio_url });
    void insertMessage(id, "audio", content);
  }, [insertMessage]);

  const color = themeColor(theme);
  const updateDraft = useCallback((id: string, draft: string) => setWindows((state) => state[id] ? { ...state, [id]: { ...state[id], draft } } : state), []);
  const updatePosition = useCallback((id: string, position: { x: number; y: number }) => setWindows((state) => state[id] ? { ...state, [id]: { ...state[id], position } } : state), []);
  const closeWindow = useCallback((id: string) => setWindows((state) => { const next = { ...state }; delete next[id]; return next; }), []);
  const minimizeWindow = useCallback((id: string) => setWindows((state) => state[id] ? { ...state, [id]: { ...state[id], minimized: true } } : state), []);
  const maximizeWindow = useCallback((id: string) => setWindows((state) => state[id] ? { ...state, [id]: { ...state[id], minimized: false } } : state), []);
  const focusWindow = useCallback((id: string) => {
    setZIndex((value) => {
      const next = value + 1;
      setWindows((state) => state[id] ? { ...state, [id]: { ...state[id], zIndex: next } } : state);
      return next;
    });
  }, []);

  return (
    <div className="tuenti-chat-root">
      {panelOpen ? <ContactPanel contacts={contacts} color={color} onOpen={openConversation} onClose={() => setPanelOpen(false)} navigate={navigate} /> : null}
      {Object.values(windows).map((window) => (
        <ChatWindow
          key={window.id}
          window={window}
          myId={myId}
          color={color}
          tracks={tracks}
          onClose={closeWindow}
          onMinimize={minimizeWindow}
          onMaximize={maximizeWindow}
          onSend={sendMessage}
          onDraft={updateDraft}
          onPosition={updatePosition}
          onFocus={focusWindow}
          onUploadImage={uploadImage}
          onShareMusic={shareMusic}
        />
      ))}
      <button type="button" className="tuenti-chat-toggle" onClick={() => setPanelOpen((value) => !value)} style={{ background: color }} title="Mensajes"><MessageCircle size={20} /></button>
    </div>
  );
}
