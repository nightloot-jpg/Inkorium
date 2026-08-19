// ============================================================
// ChatWidget estilo Tuenti 2009 - Ventanas rectangulares con franja superior
// ============================================================

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { supabase } from "./lib/supabase";
import type { Session } from "@supabase/supabase-js";
import { MessageCircle, X, ChevronUp, ChevronDown, Send, Paperclip, Smile, Mic, Camera, Search, Minimize, Maximize2, UserPlus } from "lucide-react";
import { UserLink } from "./utils";

// ============================================================
// TIPOS
// ============================================================
type ChatContact = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
};

type ChatMessage = {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
  pending?: boolean;
};

type ChatWindowState = {
  id: string; // contact.id
  contact: ChatContact;
  messages: ChatMessage[];
  draft: string;
  loading: boolean;
  minimized: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  unreadCount: number;
  hasMore: boolean;
  page: number;
  zIndex: number;
};

// ============================================================
// CONSTANTES
// ============================================================
const DEFAULT_WIDTH = 320;
const DEFAULT_HEIGHT = 400;
const MIN_WIDTH = 280;
const MIN_HEIGHT = 300;
const MAX_WIDTH = 450;
const MAX_HEIGHT = 600;
const WINDOW_GAP = 8; // gap between stacked windows
const START_X = 16;
const START_Y_OFFSET = 16; // from bottom

// ============================================================
// UTILIDADES
// ============================================================
const contactName = (c: ChatContact) => c.username || c.full_name || "Usuario";
const formatTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};
const getThemeColor = (theme: string) => {
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

// ============================================================
// CHAT WINDOW - Ventana individual estilo Tuenti 2009
// ============================================================
interface ChatWindowProps {
  window: ChatWindowState;
  myId: string;
  onlineIds: Set<string>;
  theme: string;
  onClose: (windowId: string) => void;
  onMinimize: (windowId: string) => void;
  onMaximize: (windowId: string) => void;
  onSendMessage: (windowId: string, content: string) => void;
  onDraftChange: (windowId: string, draft: string) => void;
  onLoadMore: (windowId: string) => void;
  onPositionChange: (windowId: string, position: { x: number; y: number }) => void;
  onSizeChange: (windowId: string, size: { width: number; height: number }) => void;
  onFocus: (windowId: string) => void;
}

function ChatWindow({
  window,
  myId,
  onlineIds,
  theme,
  onClose,
  onMinimize,
  onMaximize,
  onSendMessage,
  onDraftChange,
  onLoadMore,
  onPositionChange,
  onSizeChange,
  onFocus,
}: ChatWindowProps) {
  const { contact, messages, draft, loading, minimized, position, size, unreadCount, hasMore } = window;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const themeColor = getThemeColor(theme);
  const isOnline = onlineIds.has(contact.id);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Drag state
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 });

  // Focus management
  const handleMouseDown = (e: React.MouseEvent) => {
    onFocus(window.id);
    if (e.target instanceof HTMLElement && (e.target.closest("button") || e.target.closest("input") || e.target.closest("textarea"))) {
      return;
    }
  };

  // Header drag
  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    if (minimized) return;
    if (e.target instanceof HTMLElement && e.target.closest("button")) return;

    setDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: position.x,
      posY: position.y,
    };
    e.preventDefault();
  };

  // Resize from bottom-right
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    if (minimized) return;
    setResizing(true);
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
    };
    e.preventDefault();
    e.stopPropagation();
  };

  useEffect(() => {
    if (!dragging && !resizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (dragging) {
        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;
        let newX = dragStartRef.current.posX + dx;
        let newY = dragStartRef.current.posY + dy;

        // Clamp to viewport
        const maxX = window.innerWidth - size.width - 16;
        const maxY = window.innerHeight - size.height - 16;
        newX = Math.max(16, Math.min(newX, maxX));
        newY = Math.max(16, Math.min(newY, maxY));

        onPositionChange(window.id, { x: newX, y: newY });
      }

      if (resizing) {
        const dx = e.clientX - resizeStartRef.current.x;
        const dy = e.clientY - resizeStartRef.current.y;
        let newWidth = resizeStartRef.current.width + dx;
        let newHeight = resizeStartRef.current.height + dy;

        newWidth = Math.max(MIN_WIDTH, Math.min(newWidth, MAX_WIDTH));
        newHeight = Math.max(MIN_HEIGHT, Math.min(newHeight, MAX_HEIGHT));

        onSizeChange(window.id, { width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      setDragging(false);
      setResizing(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, resizing, position, size, window.id, onPositionChange, onSizeChange, minimized]);

  // Keyboard: Enter to send, Shift+Enter for newline
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (draft.trim()) onSendMessage(window.id, draft.trim());
    }
  };

  if (minimized) {
    // Minimized tab at bottom-left
    return (
      <div
        className="tuenti-chat-minimized"
        style={{
          left: position.x,
          bottom: START_Y_OFFSET,
          zIndex: window.zIndex,
          width: size.width,
          background: themeColor,
        }}
        onMouseDown={handleMouseDown}
        onClick={() => onMaximize(window.id)}
        onDoubleClick={(e) => e.stopPropagation()}
      >
        <div className="tuenti-minimized-content">
          <div className="tuenti-minimized-avatar">
            {contact.avatar_url ? (
              <img src={contact.avatar_url} alt="" />
            ) : (
              contactName(contact).charAt(0).toUpperCase()
            )}
          </div>
          <span className="tuenti-minimized-name">{contactName(contact)}</span>
          {unreadCount > 0 && (
            <span className="tuenti-minimized-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
          )}
          <button className="tuenti-minimized-close" onClick={(e) => { e.stopPropagation(); onClose(window.id); }}><X size={12} /></button>
        </div>
      </div>
    );
  }

  const windowStyle: React.CSSProperties = {
    left: position.x,
    bottom: position.y,
    width: size.width,
    height: size.height,
    zIndex: window.zIndex,
  };

  return (
    <div
      className="tuenti-chat-window"
      style={windowStyle}
      onMouseDown={handleMouseDown}
    >
      {/* Header bar - thin strip with square avatar + name */}
      <div
        ref={headerRef}
        className="tuenti-chat-header"
        style={{ background: themeColor }}
        onMouseDown={handleHeaderMouseDown}
      >
        <div className="tuenti-header-left">
          <div className="tuenti-header-avatar">
            {contact.avatar_url ? (
              <img src={contact.avatar_url} alt="" />
            ) : (
              contactName(contact).charAt(0).toUpperCase()
            )}
            <span className={`tuenti-status-dot ${isOnline ? "online" : "offline"}`} />
          </div>
          <span className="tuenti-header-name">{contactName(contact)}</span>
          {isOnline && <span className="tuenti-online-text">En línea</span>}
        </div>
        <div className="tuenti-header-right">
          <button className="tuenti-header-btn" onClick={() => onMinimize(window.id)} title="Minimizar"><Minimize size={12} /></button>
          <button className="tuenti-header-btn" onClick={() => onMaximize(window.id)} title="Maximizar"><Maximize2 size={12} /></button>
          <button className="tuenti-header-btn tuenti-close-btn" onClick={() => onClose(window.id)} title="Cerrar"><X size={12} /></button>
        </div>
      </div>

      {/* Messages area */}
      <div
        ref={scrollRef}
        className="tuenti-chat-messages"
        style={{ height: size.height - 56 }}
      >
        {loading && <div className="tuenti-loading">Cargando...</div>}
        {!loading && messages.length === 0 && <div className="tuenti-empty">Sin mensajes aún</div>}
        {messages.map((message) => (
          <div key={message.id} className={`tuenti-message ${message.sender_id === myId ? "mine" : "theirs"}`}>
            <div className={`tuenti-bubble${message.pending ? " pending" : ""}`}>
              {message.content}
            </div>
            <span className="tuenti-time">{formatTime(message.created_at)}</span>
          </div>
        ))}
        {hasMore && !loading && (
          <button className="tuenti-load-more" onClick={() => onLoadMore(window.id)}>Cargar más</button>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="tuenti-chat-input" style={{ borderTopColor: themeColor }}>
        <div className="tuenti-input-toolbar">
          <button type="button" className="tuenti-toolbar-btn" title="Adjuntar"><Paperclip size={14} /></button>
          <button type="button" className="tuenti-toolbar-btn" title="Emojis"><Smile size={14} /></button>
          <button type="button" className="tuenti-toolbar-btn" title="Voz"><Mic size={14} /></button>
          <button type="button" className="tuenti-toolbar-btn" title="Cámara"><Camera size={14} /></button>
        </div>
        <form className="tuenti-input-form" onSubmit={(e) => { e.preventDefault(); if (draft.trim()) onSendMessage(window.id, draft.trim()); }}>
          <input
            value={draft}
            onChange={(e) => onDraftChange(window.id, e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje..."
            className="tuenti-input"
            style={{ borderColor: themeColor }}
          />
          <button type="submit" disabled={!draft.trim()} className="tuenti-send-btn" style={{ background: themeColor }}>
            <Send size={14} />
          </button>
        </form>
      </div>

      {/* Resize handle */}
      {!minimized && (
        <div
          ref={resizeRef}
          className="tuenti-resize-handle"
          onMouseDown={handleResizeMouseDown}
        />
      )}
    </div>
  );
}

// ============================================================
// CONTACT PANEL - Panel de contactos (bottom-left, slides up)
// ============================================================
interface ContactPanelProps {
  contacts: ChatContact[];
  onlineIds: Set<string>;
  unreadByContact: Record<string, number>;
  theme: string;
  onOpenConversation: (contact: ChatContact) => void;
  onClose: () => void;
}

function ContactPanel({ contacts, onlineIds, unreadByContact, theme, onOpenConversation, onClose }: ContactPanelProps) {
  const themeColor = getThemeColor(theme);
  const [search, setSearch] = useState("");

  const filteredContacts = useMemo(() => {
    if (!search.trim()) return contacts;
    const q = search.toLowerCase();
    return contacts.filter(c => contactName(c).toLowerCase().includes(q));
  }, [contacts, search]);

  return (
    <div className="tuenti-contact-panel" style={{ borderColor: themeColor }}>
      <div className="tuenti-panel-header" style={{ background: themeColor }}>
        <span>Mensajes</span>
        <button className="tuenti-panel-close" onClick={onClose}><X size={16} /></button>
      </div>
      <div className="tuenti-panel-search" style={{ borderColor: themeColor }}>
        <Search size={16} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar..."
          style={{ borderColor: themeColor }}
        />
      </div>
      <div className="tuenti-contact-list">
        {filteredContacts.length === 0 && <div className="tuenti-panel-empty">Sin contactos</div>}
        {filteredContacts
          .slice()
          .sort((a, b) => Number(onlineIds.has(b.id)) - Number(onlineIds.has(a.id)))
          .map((contact) => (
            <button
              key={contact.id}
              className="tuenti-contact-row"
              onClick={() => { onOpenConversation(contact); onClose(); }}
              style={{ borderColor: themeColor }}
            >
              <div className="tuenti-contact-avatar">
                {contact.avatar_url ? (
                  <img src={contact.avatar_url} alt="" />
                ) : (
                  contactName(contact).charAt(0).toUpperCase()
                )}
                <span className={`tuenti-status-dot ${onlineIds.has(contact.id) ? "online" : "offline"}`} />
              </div>
              <div className="tuenti-contact-info">
                <span className="tuenti-contact-name">{contactName(contact)}</span>
                <span className={`tuenti-contact-status ${onlineIds.has(contact.id) ? "online" : "offline"}`}>
                  {onlineIds.has(contact.id) ? "En línea" : "Desconectado"}
                </span>
              </div>
              {unreadByContact[contact.id] && (
                <span className="tuenti-unread-badge" style={{ background: themeColor }}>
                  {unreadByContact[contact.id] > 99 ? "99+" : unreadByContact[contact.id]}
                </span>
              )}
            </button>
          ))}
      </div>
      <button className="tuenti-panel-add-contact" onClick={() => { onClose(); navigate("personas"); }}>
        <UserPlus size={16} /> Agregar contacto
      </button>
    </div>
  );
}

// ============================================================
// MAIN CHAT WIDGET
// ============================================================
interface ChatWidgetProps {
  session: Session;
  navigate: (page: string, params?: Record<string, any>) => void;
}

export function ChatWidget({ session, navigate }: ChatWidgetProps) {
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());
  const [unreadByContact, setUnreadByContact] = useState<Record<string, number>>({});
  const [windows, setWindows] = useState<Record<string, ChatWindowState>>({});
  const [panelOpen, setPanelOpen] = useState(false);
  const [zIndexCounter, setZIndexCounter] = useState(1000);
  const [theme, setTheme] = useState("blue");
  const myId = session.user.id;

  // Load theme from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("inkorium-theme");
    if (saved) setTheme(saved);
  }, []);

  // Sync theme changes from other components
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "inkorium-theme" && e.newValue) setTheme(e.newValue);
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const totalUnread = Object.values(unreadByContact).reduce((sum, n) => sum + n, 0);

  // ---- Load contacts (friends) ----
  useEffect(() => {
    let cancelled = false;
    async function loadContacts() {
      const [{ data: f1 }, { data: f2 }] = await Promise.all([
        supabase.from("friendships").select("friend_id").eq("user_id", myId).eq("status", "accepted"),
        supabase.from("friendships").select("user_id").eq("friend_id", myId).eq("status", "accepted"),
      ]);
      if (cancelled) return;
      const ids = [...new Set([...(f1 || []).map((r: any) => r.friend_id), ...(f2 || []).map((r: any) => r.user_id)])];
      if (!ids.length) { setContacts([]); return; }
      const { data: profiles } = await supabase.from("profiles").select("id, username, full_name, avatar_url").in("id", ids);
      if (cancelled) return;
      setContacts((profiles || []) as ChatContact[]);
    }
    void loadContacts();
    return () => { cancelled = true; };
  }, [myId]);

  // ---- Presence ----
  useEffect(() => {
    const channel = supabase.channel("online-users", { config: { presence: { key: myId } } });
    channel.on("presence", { event: "sync" }, () => {
      setOnlineIds(new Set(Object.keys(channel.presenceState())));
    });
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") void channel.track({ user_id: myId, online_at: new Date().toISOString() });
    });
    return () => { supabase.removeChannel(channel); };
  }, [myId]);

  // ---- Unread counters + realtime incoming ----
  useEffect(() => {
    let cancelled = false;
    async function loadUnread() {
      const { data } = await supabase.from("messages").select("sender_id").eq("recipient_id", myId).is("read_at", null);
      if (cancelled || !data) return;
      const counts: Record<string, number> = {};
      data.forEach((row: any) => { counts[row.sender_id] = (counts[row.sender_id] || 0) + 1; });
      setUnreadByContact(counts);
    }
    void loadUnread();

    const channel = supabase
      .channel("chat_incoming_" + myId)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `recipient_id=eq.${myId}` }, (payload) => {
        const row = payload.new as ChatMessage;
        const senderId = row.sender_id;

        // Update window if open
        setWindows((prev) => {
          const win = prev[senderId];
          if (win && !win.minimized) {
            // Add message to open window
            return { ...prev, [senderId]: { ...win, messages: [...win.messages, row], unreadCount: 0 } };
          }
          // Increment unread
          setUnreadByContact((c) => ({ ...c, [senderId]: (c[senderId] || 0) + 1 }));
          if (win) {
            return { ...prev, [senderId]: { ...win, unreadCount: win.unreadCount + 1 } };
          }
          return prev;
        });

        // Mark as read if window focused
        const activeWin = windows[senderId];
        if (activeWin && !activeWin.minimized) {
          void supabase.from("messages").update({ read_at: new Date().toISOString() }).eq("id", row.id);
        }
      })
      .subscribe();

    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [myId, windows]);

  // Helper: update messages for a window
  const setMessagesForWindow = useCallback((windowId: string, updater: (prev: ChatMessage[]) => ChatMessage[]) => {
    setWindows((prev) => {
      const win = prev[windowId];
      if (!win) return prev;
      return { ...prev, [windowId]: { ...win, messages: updater(win.messages) } };
    });
  }, []);

  // ---- Open conversation ----
  const openConversation = useCallback(async (contact: ChatContact) => {
    if (windows[contact.id]) {
      const win = windows[contact.id];
      if (win.minimized) {
        setWindows((prev) => ({ ...prev, [contact.id]: { ...win, minimized: false, unreadCount: 0 } }));
        setUnreadByContact((c) => { const n = { ...c }; delete n[contact.id]; return n; });
      }
      setZIndexCounter((z) => z + 1);
      return;
    }

    // Load messages
    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(`and(sender_id.eq.${myId},recipient_id.eq.${contact.id}),and(sender_id.eq.${contact.id},recipient_id.eq.${myId})`)
      .order("created_at", { ascending: true })
      .limit(50);

    // Calculate cascading position
    const openCount = Object.values(windows).filter(w => !w.minimized).length;
    const newWindow: ChatWindowState = {
      id: contact.id,
      contact,
      messages: (data || []) as ChatMessage[],
      draft: "",
      loading: false,
      minimized: false,
      position: {
        x: START_X + (openCount % 5) * (DEFAULT_WIDTH + WINDOW_GAP),
        y: START_Y_OFFSET + (openCount % 5) * (DEFAULT_HEIGHT + WINDOW_GAP),
      },
      size: { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT },
      unreadCount: 0,
      hasMore: (data || []).length === 50,
      page: 1,
      zIndex: zIndexCounter + 1,
    };

    setWindows((prev) => ({ ...prev, [contact.id]: newWindow }));
    setZIndexCounter((z) => z + 1);
    setUnreadByContact((c) => { const n = { ...c }; delete n[contact.id]; return n; });

    // Mark as read
    void supabase.from("messages").update({ read_at: new Date().toISOString() }).eq("sender_id", contact.id).eq("recipient_id", myId).is("read_at", null);
  }, [myId, windows, zIndexCounter]);

  // ---- Send message ----
  const sendMessage = useCallback(async (windowId: string, content: string) => {
    const win = windows[windowId];
    if (!win) return;

    const tempId = "temp-" + Date.now();
    const optimistic: ChatMessage = { id: tempId, sender_id: myId, recipient_id: win.contact.id, content, created_at: new Date().toISOString(), read_at: null, pending: true };

    setMessagesForWindow(windowId, (prev) => [...prev, optimistic]);

    const { data, error } = await supabase.from("messages").insert({ sender_id: myId, recipient_id: win.contact.id, content }).select().single();

    setMessagesForWindow(windowId, (prev) => {
      if (error || !data) return prev.filter((m) => m.id !== tempId);
      return prev.map((m) => (m.id === tempId ? (data as ChatMessage) : m));
    });
  }, [myId, windows, setMessagesForWindow]);

  // ---- Draft change ----
  const handleDraftChange = useCallback((windowId: string, draft: string) => {
    setWindows((prev) => {
      const win = prev[windowId];
      if (!win) return prev;
      return { ...prev, [windowId]: { ...win, draft } };
    });
  }, []);

  // ---- Load more ----
  const loadMore = useCallback(async (windowId: string) => {
    const win = windows[windowId];
    if (!win || win.loading) return;

    setWindows((prev) => ({ ...prev, [windowId]: { ...win, loading: true } }));

    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(`and(sender_id.eq.${myId},recipient_id.eq.${win.contact.id}),and(sender_id.eq.${win.contact.id},recipient_id.eq.${myId})`)
      .order("created_at", { ascending: true })
      .limit(50)
      .range(win.page * 50, (win.page + 1) * 50 - 1);

    setWindows((prev) => {
      const w = prev[windowId];
      if (!w) return prev;
      const newMessages = (data || []) as ChatMessage[];
      return {
        ...prev,
        [windowId]: {
          ...w,
          messages: [...newMessages, ...w.messages],
          loading: false,
          hasMore: newMessages.length === 50,
          page: w.page + 1,
        },
      };
    });
  }, [myId, windows]);

  // ---- Window actions ----
  const closeWindow = useCallback((windowId: string) => {
    setWindows((prev) => {
      const next = { ...prev };
      delete next[windowId];
      return next;
    });
  }, []);

  const minimizeWindow = useCallback((windowId: string) => {
    setWindows((prev) => {
      const win = prev[windowId];
      if (!win) return prev;
      return { ...prev, [windowId]: { ...win, minimized: true } };
    });
  }, []);

  const maximizeWindow = useCallback((windowId: string) => {
    setWindows((prev) => {
      const win = prev[windowId];
      if (!win) return prev;
      return { ...prev, [windowId]: { ...win, minimized: false } };
    });
  }, []);

  const focusWindow = useCallback((windowId: string) => {
    setZIndexCounter((z) => z + 1);
    const win = windows[windowId];
    if (win && win.unreadCount > 0) {
      setWindows((prev) => ({ ...prev, [windowId]: { ...win, unreadCount: 0 } }));
      setUnreadByContact((c) => { const n = { ...c }; delete n[windowId]; return n; });
      void supabase.from("messages").update({ read_at: new Date().toISOString() }).eq("sender_id", windowId).eq("recipient_id", myId).is("read_at", null);
    }
  }, [myId, windows]);

  // ---- Render ----
  const openWindows = Object.values(windows).filter(w => !w.minimized).sort((a, b) => a.zIndex - b.zIndex);
  const minimizedWindows = Object.values(windows).filter(w => w.minimized);

  return (
    <div className="tuenti-chat-root">
      {/* Contact Panel */}
      {panelOpen && (
        <ContactPanel
          contacts={contacts}
          onlineIds={onlineIds}
          unreadByContact={unreadByContact}
          theme={theme}
          onOpenConversation={openConversation}
          onClose={() => setPanelOpen(false)}
        />
      )}

      {/* Chat Windows */}
      {openWindows.map((win) => (
        <ChatWindow
          key={win.id}
          window={win}
          myId={myId}
          onlineIds={onlineIds}
          theme={theme}
          onClose={closeWindow}
          onMinimize={minimizeWindow}
          onMaximize={maximizeWindow}
          onSendMessage={sendMessage}
          onDraftChange={handleDraftChange}
          onLoadMore={loadMore}
          onPositionChange={(id, pos) => setWindows((p) => ({ ...p, [id]: { ...p[id], position: pos } }))}
          onSizeChange={(id, size) => setWindows((p) => ({ ...p, [id]: { ...p[id], size } }))}
          onFocus={focusWindow}
        />
      ))}

      {/* Minimized tabs bar */}
      <div className="tuenti-minimized-bar">
        {minimizedWindows.map((win) => (
          <div
            key={win.id}
            className="tuenti-chat-minimized"
            style={{
              left: win.position.x,
              bottom: START_Y_OFFSET,
              zIndex: win.zIndex,
              width: win.size.width,
              background: getThemeColor(theme),
            }}
            onClick={() => maximizeWindow(win.id)}
          >
            <div className="tuenti-minimized-content">
              <div className="tuenti-minimized-avatar">
                {win.contact.avatar_url ? <img src={win.contact.avatar_url} alt="" /> : contactName(win.contact).charAt(0).toUpperCase()}
              </div>
              <span className="tuenti-minimized-name">{contactName(win.contact)}</span>
              {win.unreadCount > 0 && <span className="tuenti-minimized-badge">{win.unreadCount > 99 ? "99+" : win.unreadCount}</span>}
              <button className="tuenti-minimized-close" onClick={(e) => { e.stopPropagation(); closeWindow(win.id); }}><X size={12} /></button>
            </div>
          </div>
        ))}
      </div>

      {/* Main button - bottom left */}
      <button
        className="tuenti-main-btn"
        onClick={() => setPanelOpen((v) => !v)}
        style={{ background: getThemeColor(theme) }}
        aria-label="Chat"
      >
        <MessageCircle size={22} />
        {totalUnread > 0 && <span className="tuenti-main-badge">{totalUnread > 99 ? "99+" : totalUnread}</span>}
      </button>
    </div>
  );
}

export type { ChatContact, ChatMessage, ChatWindowState };