import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { Camera, Maximize2, MessageCircle, Minimize, Paperclip, Search, Send, Smile, UserPlus, X } from "lucide-react";
import { supabase } from "./lib/supabase";

type ChatContact = { id: string; username: string | null; full_name: string | null; avatar_url: string | null };
type ChatMessage = { id: string; sender_id: string; content: string; created_at: string; pending?: boolean };
type ChatWindowState = { id: string; contact: ChatContact; messages: ChatMessage[]; draft: string; loading: boolean; minimized: boolean; position: { x: number; y: number }; size: { width: number; height: number }; unreadCount: number; zIndex: number };

const DEFAULT_WIDTH = 320;
const DEFAULT_HEIGHT = 400;
const START_Y_OFFSET = 16;
const WINDOW_GAP = 8;
const contactName = (c: ChatContact) => c.username || c.full_name || "Usuario";
const themeColor = (theme: string) => ({ blue: "#1e6fdf", violet: "#7c3aed", green: "#059669", sunset: "#ea580c", rose: "#e11d48", teal: "#0d9488" }[theme] || "#1e6fdf");
const formatTime = (value: string) => new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

function ChatWindow({ window: w, myId, onlineIds, color, onClose, onMinimize, onMaximize, onSend, onDraft, onPosition, onFocus }: any) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ x: 0, y: 0, px: 0, py: 0 });
  const [dragging, setDragging] = useState(false);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [w.messages]);
  useEffect(() => {
    if (!dragging) return;
    const move = (e: MouseEvent) => {
      const nextX = dragRef.current.px + e.clientX - dragRef.current.x;
      const nextY = dragRef.current.py + e.clientY - dragRef.current.y;
      onPosition(w.id, { x: Math.max(16, Math.min(nextX, innerWidth - w.size.width - 16)), y: Math.max(16, Math.min(nextY, innerHeight - w.size.height - 16)) });
    };
    const stop = () => setDragging(false);
    addEventListener("mousemove", move); addEventListener("mouseup", stop);
    return () => { removeEventListener("mousemove", move); removeEventListener("mouseup", stop); };
  }, [dragging, onPosition, w.id, w.size.width, w.size.height]);
  if (w.minimized) return <div className="tuenti-chat-minimized" style={{ left: w.position.x, bottom: START_Y_OFFSET, zIndex: w.zIndex, width: w.size.width, background: color }} onClick={() => onMaximize(w.id)}><div className="tuenti-minimized-content"><div className="tuenti-minimized-avatar">{w.contact.avatar_url ? <img src={w.contact.avatar_url} alt="" /> : contactName(w.contact).slice(0, 1)}</div><span className="tuenti-minimized-name">{contactName(w.contact)}</span><button type="button" className="tuenti-minimized-close" onClick={(e) => { e.stopPropagation(); onClose(w.id); }}><X size={12} /></button></div></div>;
  return <div className="tuenti-chat-window" style={{ left: w.position.x, bottom: w.position.y, width: w.size.width, height: w.size.height, zIndex: w.zIndex }} onMouseDown={() => onFocus(w.id)}>
    <div className="tuenti-chat-header" style={{ background: color }} onMouseDown={(e) => { if ((e.target as HTMLElement).closest("button")) return; dragRef.current = { x: e.clientX, y: e.clientY, px: w.position.x, py: w.position.y }; setDragging(true); }}>
      <div className="tuenti-header-left"><div className="tuenti-header-avatar">{w.contact.avatar_url ? <img src={w.contact.avatar_url} alt="" /> : contactName(w.contact).slice(0, 1)}<span className={`tuenti-status-dot ${onlineIds.has(w.contact.id) ? "online" : "offline"}`} /></div><span className="tuenti-header-name">{contactName(w.contact)}</span></div>
      <div className="tuenti-header-right"><button type="button" className="tuenti-header-btn" onClick={() => onMinimize(w.id)}><Minimize size={12} /></button><button type="button" className="tuenti-header-btn" onClick={() => onMaximize(w.id)}><Maximize2 size={12} /></button><button type="button" className="tuenti-header-btn tuenti-close-btn" onClick={() => onClose(w.id)}><X size={12} /></button></div>
    </div>
    <div ref={scrollRef} className="tuenti-chat-messages" style={{ height: w.size.height - 140 }}>{w.loading ? <div className="tuenti-loading">Cargando...</div> : w.messages.length === 0 ? <div className="tuenti-empty">Sin mensajes aún</div> : w.messages.map((m: ChatMessage) => <div key={m.id} className={`tuenti-message ${m.sender_id === myId ? "mine" : "theirs"}`}><div className={`tuenti-bubble${m.pending ? " pending" : ""}`}>{m.content}</div><span className="tuenti-time">{formatTime(m.created_at)}</span></div>)}</div>
    <div className="tuenti-chat-input" style={{ borderTopColor: color }}><div className="tuenti-input-toolbar"><button type="button" className="tuenti-toolbar-btn"><Paperclip size={14} /></button><button type="button" className="tuenti-toolbar-btn"><Smile size={14} /></button><button type="button" className="tuenti-toolbar-btn"><Camera size={14} /></button></div><form className="tuenti-input-form" onSubmit={(e) => { e.preventDefault(); const text = w.draft.trim(); if (text) onSend(w.id, text); }}><input value={w.draft} onChange={(e) => onDraft(w.id, e.target.value)} placeholder="Escribe un mensaje..." className="tuenti-input" style={{ borderColor: color }} /><button type="submit" disabled={!w.draft.trim()} className="tuenti-send-btn" style={{ background: color }}><Send size={14} /></button></form></div>
  </div>;
}

function ContactPanel({ contacts, onlineIds, color, onOpen, onClose, navigate }: any) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => { const q = search.trim().toLowerCase(); return q ? contacts.filter((c: ChatContact) => contactName(c).toLowerCase().includes(q)) : contacts; }, [contacts, search]);
  return <div className="tuenti-contact-panel" style={{ borderColor: color }}><div className="tuenti-panel-header" style={{ background: color }}><span>Mensajes</span><button type="button" className="tuenti-panel-close" onClick={onClose}><X size={16} /></button></div><div className="tuenti-panel-search" style={{ borderColor: color }}><Search size={16} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." /></div><div className="tuenti-contact-list">{filtered.map((c: ChatContact) => <button type="button" key={c.id} className="tuenti-contact-row" onClick={(e) => { e.preventDefault(); onOpen(c); }}><div className="tuenti-contact-avatar">{c.avatar_url ? <img src={c.avatar_url} alt="" /> : contactName(c).slice(0, 1)}<span className={`tuenti-status-dot ${onlineIds.has(c.id) ? "online" : "offline"}`} /></div><div className="tuenti-contact-info"><span className="tuenti-contact-name">{contactName(c)}</span></div></button>)}</div><button type="button" className="tuenti-panel-add-contact" onClick={() => { onClose(); navigate("personas"); }}><UserPlus size={16} /> Agregar contacto</button></div>;
}

export function ChatWidget({ session, navigate }: { session: Session; navigate: (page: string, params?: Record<string, unknown>) => void }) {
  const myId = session.user.id;
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());
  const [windows, setWindows] = useState<Record<string, ChatWindowState>>({});
  const [panelOpen, setPanelOpen] = useState(false);
  const [zIndex, setZIndex] = useState(1000);
  const [theme, setTheme] = useState("blue");

  useEffect(() => { const stored = localStorage.getItem("inkorium-theme"); if (stored) setTheme(stored); const onStorage = (e: StorageEvent) => { if (e.key === "inkorium-theme" && e.newValue) setTheme(e.newValue); }; addEventListener("storage", onStorage); return () => removeEventListener("storage", onStorage); }, []);
  useEffect(() => { const open = () => setPanelOpen(true); addEventListener("open-chat-panel", open); return () => removeEventListener("open-chat-panel", open); }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const [outgoing, incoming] = await Promise.all([supabase.from("friendships").select("friend_id").eq("user_id", myId).eq("status", "accepted"), supabase.from("friendships").select("user_id").eq("friend_id", myId).eq("status", "accepted")]);
      const ids = Array.from(new Set([...(outgoing.data ?? []).map((r: any) => r.friend_id), ...(incoming.data ?? []).map((r: any) => r.user_id)]));
      if (!ids.length) { if (!cancelled) setContacts([]); return; }
      const { data } = await supabase.from("profiles").select("id, username, full_name, avatar_url").in("id", ids);
      if (!cancelled) setContacts((data ?? []) as ChatContact[]);
    };
    void load(); return () => { cancelled = true; };
  }, [myId]);

  useEffect(() => {
    const channel = supabase.channel(`online-users:${myId}`, { config: { presence: { key: myId } } });
    channel.on("presence", { event: "sync" }, () => setOnlineIds(new Set(Object.keys(channel.presenceState()))));
    channel.subscribe((status) => { if (status === "SUBSCRIBED") void channel.track({ user_id: myId, online_at: new Date().toISOString() }); });
    return () => { void supabase.removeChannel(channel); };
  }, [myId]);

  const loadMessages = useCallback(async (contactId: string) => {
    const { data, error } = await supabase.from("messages").select("id, sender_id, recipient_id, content, created_at").or(`and(sender_id.eq.${myId},recipient_id.eq.${contactId}),and(sender_id.eq.${contactId},recipient_id.eq.${myId})`).order("created_at", { ascending: true }).limit(100);
    if (error) { console.error("[Chat] load messages", error); return []; }
    return (data ?? []) as ChatMessage[];
  }, [myId]);

  const openConversation = useCallback(async (contact: ChatContact) => {
    const existing = windows[contact.id];
    if (existing) { setWindows((state) => ({ ...state, [contact.id]: { ...state[contact.id], minimized: false, zIndex: zIndex + 1 } })); setZIndex((v) => v + 1); setPanelOpen(false); return; }
    const nextZ = zIndex + 1;
    const openCount = Object.values(windows).filter((w) => !w.minimized).length;
    const x = Math.max(16, innerWidth - DEFAULT_WIDTH - 16 - (openCount % 4) * (DEFAULT_WIDTH + WINDOW_GAP));
    const y = START_Y_OFFSET + (openCount % 4) * 44;
    const shell: ChatWindowState = { id: contact.id, contact, messages: [], draft: "", loading: true, minimized: false, position: { x, y }, size: { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT }, unreadCount: 0, zIndex: nextZ };
    setWindows((state) => ({ ...state, [contact.id]: shell }));
    setZIndex(nextZ); setPanelOpen(false);
    const messages = await loadMessages(contact.id);
    setWindows((state) => state[contact.id] ? { ...state, [contact.id]: { ...state[contact.id], messages, loading: false } } : state);
  }, [loadMessages, windows, zIndex]);

  useEffect(() => {
    const channels = Object.values(windows).map((w) => supabase.channel(`dm:${myId}:${w.contact.id}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `recipient_id=eq.${myId}` }, (payload: any) => {
      const m = payload.new as ChatMessage & { recipient_id: string };
      if (m.sender_id !== w.contact.id) return;
      setWindows((state) => state[w.contact.id] ? { ...state, [w.contact.id]: { ...state[w.contact.id], messages: [...state[w.contact.id].messages, m] } } : state);
    }).subscribe());
    return () => { channels.forEach((c) => void supabase.removeChannel(c)); };
  }, [myId, Object.keys(windows).join(",")]);

  const sendMessage = useCallback(async (id: string, content: string) => {
    const current = windows[id]; if (!current) return;
    const tempId = `temp-${Date.now()}`;
    const optimistic: ChatMessage = { id: tempId, sender_id: myId, content, created_at: new Date().toISOString(), pending: true };
    setWindows((state) => state[id] ? { ...state, [id]: { ...state[id], messages: [...state[id].messages, optimistic], draft: "" } } : state);
    const { data, error } = await supabase.from("messages").insert({ sender_id: myId, recipient_id: current.contact.id, content }).select("id, sender_id, recipient_id, content, created_at").single();
    setWindows((state) => { const item = state[id]; if (!item) return state; if (error || !data) return { ...state, [id]: { ...item, messages: item.messages.filter((m) => m.id !== tempId) } }; return { ...state, [id]: { ...item, messages: item.messages.map((m) => m.id === tempId ? data as ChatMessage : m) } }; });
  }, [myId, windows]);

  const color = themeColor(theme);
  const updateDraft = useCallback((id: string, draft: string) => setWindows((s) => s[id] ? { ...s, [id]: { ...s[id], draft } } : s), []);
  const updatePosition = useCallback((id: string, position: { x: number; y: number }) => setWindows((s) => s[id] ? { ...s, [id]: { ...s[id], position } } : s), []);
  const closeWindow = useCallback((id: string) => setWindows((s) => { const n = { ...s }; delete n[id]; return n; }), []);
  const minimizeWindow = useCallback((id: string) => setWindows((s) => s[id] ? { ...s, [id]: { ...s[id], minimized: true } } : s), []);
  const maximizeWindow = useCallback((id: string) => setWindows((s) => s[id] ? { ...s, [id]: { ...s[id], minimized: false } } : s), []);
  const focusWindow = useCallback((id: string) => { setZIndex((v) => v + 1); setWindows((s) => s[id] ? { ...s, [id]: { ...s[id], zIndex: zIndex + 1 } } : s); }, [zIndex]);

  return <div className="tuenti-chat-root">
    {panelOpen && <ContactPanel contacts={contacts} onlineIds={onlineIds} color={color} onOpen={openConversation} onClose={() => setPanelOpen(false)} navigate={navigate} />}
    {Object.values(windows).map((w) => <ChatWindow key={w.id} window={w} myId={myId} onlineIds={onlineIds} color={color} onClose={closeWindow} onMinimize={minimizeWindow} onMaximize={maximizeWindow} onSend={sendMessage} onDraft={updateDraft} onPosition={updatePosition} onFocus={focusWindow} />)}
    <button type="button" className="tuenti-chat-toggle" onClick={() => setPanelOpen((v) => !v)} style={{ background: color }}><MessageCircle size={20} /></button>
  </div>;
}
