// ============================================================
// NUEVO: ChatWidget + ChatWindow (ventanas arrastrables estilo Messenger/Tuenti 2009)
// ============================================================
// Reemplaza la función ChatWidget completa en src/main.tsx
// y añade los estilos CSS al final de src/styles.css

import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./lib/supabase";
import type { Session } from "@supabase/supabase-js";
import { ChevronLeft, X, Minimize2, Maximize2, Send, MessageCircle, MoreVertical, Paperclip, Smile, Mic, Camera, Search, Users, Settings, Bell, Archive, Trash2, Block, Flag, LogOut, UserPlus, UserMinus, Shield, HelpCircle, Info, Moon, Sun, Palette, Layout, Grid, List, Home, Heart, Star, Flag as FlagIcon, Lock, Unlock, Eye, EyeOff, Copy, Link2, ExternalLink, Download, Upload, Edit, Delete, Share2, MoreHorizontal, ChevronDown, ChevronUp, Menu, X as XIcon, Check, AlertCircle, AlertTriangle, RefreshCw, RotateCcw, Settings as SettingsIcon, User, Users as UsersIcon, MessageSquare, Bot, Zap, Sparkles, Brain, Shield as ShieldIcon, Lock as LockIcon, Key, Hash, Terminal, Code, Database, Server, Globe, Wifi, WifiOff, Battery, BatteryCharging, Volume2, VolumeX, Mic as MicIcon, MicOff, Camera as CameraIcon, CameraOff, Image, Video, Music, File, FileText, Archive as ArchiveIcon, Trash2 as TrashIcon, Folder, FolderOpen, FolderPlus, FolderMinus, Search as SearchIcon, Filter, FilterX, SortAsc, SortDesc, ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon, ChevronUp as ChevronUpIcon, ChevronDown as ChevronDownIcon, Menu as MenuIcon, X as XIcon2, Check as CheckIcon, AlertCircle as AlertCircleIcon, AlertTriangle as AlertTriangleIcon, RefreshCw as RefreshCwIcon, RotateCcw as RotateCcwIcon } from "lucide-react";
import { UserLink } from "./utils"; // assuming UserLink is exported from utils

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
  id: string; // unique window id (contact.id)
  contact: ChatContact;
  messages: ChatMessage[];
  draft: string;
  loading: boolean;
  minimized: boolean;
  maximized: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  unreadCount: number;
  hasMore: boolean;
  page: number;
};

// ============================================================
// CONSTANTES
// ============================================================
const DEFAULT_WINDOW_SIZE = { width: 380, height: 520 };
const MIN_WINDOW_SIZE = { width: 320, height: 400 };
const MAX_WINDOW_SIZE = { width: 600, height: 800 };
const WINDOW_OFFSET = 30; // cascade offset for new windows
const SNAP_THRESHOLD = 20; // snap to edges

// ============================================================
// UTILIDADES
// ============================================================
const contactName = (c: ChatContact) => c.username || c.full_name || "Usuario";
const formatTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};
const generateId = () => `win-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

// ============================================================
// CHAT WINDOW - Ventana individual arrastrable
// ============================================================
interface ChatWindowProps {
  window: ChatWindowState;
  myId: string;
  onlineIds: Set<string>;
  onClose: (windowId: string) => void;
  onMinimize: (windowId: string) => void;
  onMaximize: (windowId: string) => void;
  onSendMessage: (windowId: string, content: string) => void;
  onDraftChange: (windowId: string, draft: string) => void;
  onLoadMore: (windowId: string) => void;
  onPositionChange: (windowId: string, position: { x: number; y: number }) => void;
  onSizeChange: (windowId: string, size: { width: number; height: number }) => void;
  onFocus: (windowId: string) => void;
  zIndex: number;
}

function ChatWindow({
  window,
  myId,
  onlineIds,
  onClose,
  onMinimize,
  onMaximize,
  onSendMessage,
  onDraftChange,
  onLoadMore,
  onPositionChange,
  onSizeChange,
  onFocus,
  zIndex,
}: ChatWindowProps) {
  const { contact, messages, draft, loading, minimized, maximized, position, size, unreadCount, hasMore } = window;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

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

  const isOnline = onlineIds.has(contact.id);

  // Focus management - bring to front on click
  const handleMouseDown = (e: React.MouseEvent) => {
    onFocus(window.id);
    // Don't start drag if clicking buttons or input
    if (
      e.target instanceof HTMLElement &&
      (e.target.closest("button") || e.target.closest("input") || e.target.closest("textarea"))
    ) {
      return;
    }
  };

  // Header drag
  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    if (maximized) return;
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

  // Resize from bottom-right corner
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    if (maximized) return;
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

        // Clamp to viewport with snap
        const maxX = window.innerWidth - size.width;
        const maxY = window.innerHeight - size.height - 60; // leave space for topbar

        // Snap to edges
        if (Math.abs(newX) < SNAP_THRESHOLD) newX = 0;
        if (Math.abs(newX - maxX) < SNAP_THRESHOLD) newX = maxX;
        if (Math.abs(newY) < SNAP_THRESHOLD) newY = 0;
        if (Math.abs(newY - maxY) < SNAP_THRESHOLD) newY = maxY;

        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));

        onPositionChange(window.id, { x: newX, y: newY });
      }

      if (resizing) {
        const dx = e.clientX - resizeStartRef.current.x;
        const dy = e.clientY - resizeStartRef.current.y;
        let newWidth = resizeStartRef.current.width + dx;
        let newHeight = resizeStartRef.current.height + dy;

        newWidth = Math.max(MIN_WINDOW_SIZE.width, Math.min(newWidth, MAX_WINDOW_SIZE.width));
        newHeight = Math.max(MIN_WINDOW_SIZE.height, Math.min(newHeight, MAX_WINDOW_SIZE.height));

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
  }, [dragging, resizing, position, size, window.id, onPositionChange, onSizeChange, maximized]);

  // Keyboard: Enter to send, Shift+Enter for newline
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (draft.trim()) onSendMessage(window.id, draft.trim());
    }
  };

  if (minimized) {
    // Minimized state - just a tab at bottom
    return (
      <div
        className="chat-window-minimized"
        style={{
          left: position.x,
          bottom: 0,
          zIndex,
          width: size.width,
        }}
        onMouseDown={handleMouseDown}
        onClick={() => onMaximize(window.id)}
      >
        <div className="minimized-header">
          <span className="avatar tiny">
            {contact.avatar_url ? <img src={contact.avatar_url} alt="" /> : contactName(contact)[0]?.toUpperCase()}
            <i className={`chat-status-dot inline ${isOnline ? "online" : "offline"}`} />
          </span>
          <span className="minimized-name">{contactName(contact)}</span>
          {unreadCount > 0 && <span className="chat-unread-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>}
          <button className="minimized-close" onClick={(e) => { e.stopPropagation(); onClose(window.id); }}><X size={14} /></button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="chat-window"
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        zIndex,
        transform: maximized ? "none" : undefined,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header - Drag handle */}
      <div
        ref={headerRef}
        className="chat-window-header"
        onMouseDown={handleHeaderMouseDown}
        style={{ cursor: maximized ? "default" : "move" }}
      >
        <div className="window-header-left">
          <span className="avatar small">
            {contact.avatar_url ? <img src={contact.avatar_url} alt="" /> : contactName(contact)[0]?.toUpperCase()}
            <i className={`chat-status-dot inline ${isOnline ? "online" : "offline"}`} />
          </span>
          <UserLink userId={contact.id} name={contactName(contact)} avatarUrl={contact.avatar_url} navigate={() => {}} />
        </div>
        <div className="window-header-center">
          <span className="online-status">{isOnline ? "En línea" : "Desconectado"}</span>
        </div>
        <div className="window-header-right">
          <button className="window-btn" onClick={() => onMinimize(window.id)} title="Minimizar"><Minimize2 size={14} /></button>
          <button className="window-btn" onClick={() => onMaximize(window.id)} title={maximized ? "Restaurar" : "Maximizar"}><Maximize2 size={14} /></button>
          <button className="window-btn close-btn" onClick={() => onClose(window.id)} title="Cerrar"><X size={14} /></button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="chat-window-messages"
        style={{ height: maximized ? `calc(100vh - 180px)` : size.height - 140 }}
      >
        {loading && <p className="chat-empty">Cargando conversación...</p>}
        {!loading && messages.length === 0 && <p className="chat-empty">Aún no hay mensajes. ¡Saluda!</p>}
        {messages.map((message) => (
          <div key={message.id} className={`chat-bubble-row ${message.sender_id === myId ? "mine" : "theirs"}`}>
            <span className={`chat-bubble${message.pending ? " pending" : ""}`}>{message.content}</span>
            <span className="chat-time">{formatTime(message.created_at)}</span>
          </div>
        ))}
        {hasMore && !loading && (
          <button className="load-more-btn" onClick={() => onLoadMore(window.id)}>Cargar más mensajes</button>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form className="chat-window-input" onSubmit={(e) => { e.preventDefault(); if (draft.trim()) onSendMessage(window.id, draft.trim()); }}>
        <div className="input-toolbar">
          <button type="button" className="toolbar-btn" title="Adjuntar"><Paperclip size={16} /></button>
          <button type="button" className="toolbar-btn" title="Emojis"><Smile size={16} /></button>
          <button type="button" className="toolbar-btn" title="Grabadora"><Mic size={16} /></button>
          <button type="button" className="toolbar-btn" title="Cámara"><Camera size={16} /></button>
        </div>
        <div className="input-wrapper">
          <input
            value={draft}
            onChange={(e) => onDraftChange(window.id, e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje..."
            autoComplete="off"
          />
          <button type="submit" disabled={!draft.trim()} className="send-btn"><Send size={16} /></button>
        </div>
      </form>

      {/* Resize handle */}
      {!maximized && (
        <div
          ref={resizeRef}
          className="resize-handle"
          onMouseDown={handleResizeMouseDown}
          style={{ cursor: "se-resize" }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M14 4L4 14M16 6L6 16M16 8L8 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
          </svg>
        </div>
      )}
    </div>
  );
}

// ============================================================
// CHAT WIDGET PRINCIPAL - Gestiona contactos y ventanas
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
  const [contactPanelOpen, setContactPanelOpen] = useState(false);
  const [zIndexCounter, setZIndexCounter] = useState(1000);
  const myId = session.user.id;

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

  // ---- Presence (who's online) ----
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
        // Update unread count if window not focused
        setWindows((prev) => {
          const win = prev[row.sender_id];
          if (win && !win.minimized && win.messages.some(m => m.id === row.id)) return prev; // already in window
          if (win && !win.minimized) {
            // Window open but message not in it yet (shouldn't happen with realtime)
            return prev;
          }
          // Not in open window or window closed/minimized
          setUnreadByContact((prevCounts) => ({ ...prevCounts, [row.sender_id]: (prevCounts[row.sender_id] || 0) + 1 }));
          // If window exists (minimized), update its unreadCount
          if (win) {
            return {
              ...prev,
              [row.sender_id]: { ...win, unreadCount: win.unreadCount + 1 },
            };
          }
          return prev;
        });
        // If window is open and active, mark as read
        const activeWin = windows[row.sender_id];
        if (activeWin && !activeWin.minimized) {
          setMessagesForWindow(row.sender_id, (prev) => [...prev, row]);
          void supabase.from("messages").update({ read_at: new Date().toISOString() }).eq("id", row.id);
        }
      })
      .subscribe();

    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [myId]);

  // Helper to update messages for a specific window
  const setMessagesForWindow = useCallback((windowId: string, updater: (prev: ChatMessage[]) => ChatMessage[]) => {
    setWindows((prev) => {
      const win = prev[windowId];
      if (!win) return prev;
      return { ...prev, [windowId]: { ...win, messages: updater(win.messages) } };
    });
  });

  // ---- Open conversation (create/get window) ----
  const openConversation = useCallback(async (contact: ChatContact) => {
    // Check if window already exists
    if (windows[contact.id]) {
      const win = windows[contact.id];
      if (win.minimized) {
        // Restore minimized window
        setWindows((prev) => ({ ...prev, [contact.id]: { ...win, minimized: false, unreadCount: 0 } }));
        setUnreadByContact((prev) => { const next = { ...prev }; delete next[contact.id]; return next; });
      }
      // Bring to front
      setZIndexCounter((c) => c + 1);
      return;
    }

    // Create new window
    setLoadingMessages(true);
    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(`and(sender_id.eq.${myId},recipient_id.eq.${contact.id}),and(sender_id.eq.${contact.id},recipient_id.eq.${myId})`)
      .order("created_at", { ascending: true })
      .limit(50);

    const newWindow: ChatWindowState = {
      id: contact.id,
      contact,
      messages: (data || []) as ChatMessage[],
      draft: "",
      loading: false,
      minimized: false,
      maximized: false,
      position: {
        x: window.innerWidth - DEFAULT_WINDOW_SIZE.width - WINDOW_OFFSET * (Object.keys(windows).length % 5),
        y: window.innerHeight - DEFAULT_WINDOW_SIZE.height - 80 - WINDOW_OFFSET * (Object.keys(windows).length % 5),
      },
      size: DEFAULT_WINDOW_SIZE,
      unreadCount: 0,
      hasMore: (data || []).length === 50,
      page: 1,
    };

    setWindows((prev) => ({ ...prev, [contact.id]: newWindow }));
    setZIndexCounter((c) => c + 1);
    setUnreadByContact((prev) => { const next = { ...prev }; delete next[contact.id]; return next; });

    // Mark as read
    void supabase.from("messages").update({ read_at: new Date().toISOString() }).eq("sender_id", contact.id).eq("recipient_id", myId).is("read_at", null);
  }, [myId, windows]);

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
  }, [myId, windows]);

  // ---- Draft change ----
  const handleDraftChange = useCallback((windowId: string, draft: string) => {
    setWindows((prev) => {
      const win = prev[windowId];
      if (!win) return prev;
      return { ...prev, [windowId]: { ...win, draft } };
    });
  }, []);

  // ---- Load more messages ----
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
          messages: [...newMessages, ...w.messages], // prepend older messages
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
      return { ...prev, [windowId]: { ...win, maximized: !win.maximized, minimized: false } };
    });
  }, []);

  const focusWindow = useCallback((windowId: string) => {
    setZIndexCounter((c) => c + 1);
    // Mark as read if unread
    const win = windows[windowId];
    if (win && win.unreadCount > 0) {
      setWindows((prev) => ({ ...prev, [windowId]: { ...win, unreadCount: 0 } }));
      setUnreadByContact((prev) => { const next = { ...prev }; delete next[windowId]; return next; });
      void supabase.from("messages").update({ read_at: new Date().toISOString() }).eq("sender_id", windowId).eq("recipient_id", myId).is("read_at", null);
    }
  }, [myId, windows]);

  // ---- Calculate z-indices for windows ----
  const windowEntries = Object.entries(windows).sort((a, b) => {
    // Minimized windows at bottom
    if (a[1].minimized && !b[1].minimized) return -1;
    if (!a[1].minimized && b[1].minimized) return 1;
    return 0;
  });

  // ---- Render ----
  return (
    <div className="chat-widget-new">
      {/* Contact Panel (bottom-left) */}
      {contactPanelOpen && (
        <div className="chat-contact-panel panel">
          <div className="chat-panel-header">
            <strong>Mensajes</strong>
            <div className="panel-actions">
              <button className="icon-btn" onClick={() => navigate("mensajes")} title="Ver todos los mensajes"><MessageSquare size={16} /></button>
              <button className="icon-btn" onClick={() => setContactPanelOpen(false)} title="Cerrar"><X size={16} /></button>
            </div>
          </div>
          <div className="chat-contact-search">
            <Search size={16} />
            <input type="text" placeholder="Buscar contactos..." />
          </div>
          <div className="chat-contact-list">
            {contacts.length === 0 && <p className="chat-empty">Todavía no tienes contactos. Agrega amigos para chatear.</p>}
            {contacts
              .slice()
              .sort((a, b) => Number(onlineIds.has(b.id)) - Number(onlineIds.has(a.id)))
              .map((contact) => (
                <button
                  key={contact.id}
                  className="chat-contact-row"
                  onClick={() => { openConversation(contact); setContactPanelOpen(false); }}
                >
                  <span className="avatar tiny chat-contact-avatar">
                    {contact.avatar_url ? <img src={contact.avatar_url} alt="" /> : contactName(contact)[0]?.toUpperCase()}
                    <i className={`chat-status-dot ${onlineIds.has(contact.id) ? "online" : "offline"}`} />
                  </span>
                  <span className="chat-contact-info">
                    <b>{contactName(contact)}</b>
                    <small>{onlineIds.has(contact.id) ? "En línea" : "Desconectado"}</small>
                  </span>
                  {unreadByContact[contact.id] ? <span className="chat-unread-badge">{unreadByContact[contact.id] > 99 ? "99+" : unreadByContact[contact.id]}</span> : null}
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Chat Windows */}
      {windowEntries.map(([windowId, win], index) => (
        <ChatWindow
          key={windowId}
          window={win}
          myId={myId}
          onlineIds={onlineIds}
          onClose={closeWindow}
          onMinimize={minimizeWindow}
          onMaximize={maximizeWindow}
          onSendMessage={sendMessage}
          onDraftChange={handleDraftChange}
          onLoadMore={loadMore}
          onPositionChange={(id, pos) => setWindows((prev) => ({ ...prev, [id]: { ...prev[id], position: pos } }))}
          onSizeChange={(id, size) => setWindows((prev) => ({ ...prev, [id]: { ...prev[id], size } }))}
          onFocus={focusWindow}
          zIndex={zIndexCounter + index}
        />
      ))}

      {/* Minimized tabs bar (bottom) */}
      <div className="chat-minimized-bar">
        {Object.values(windows)
          .filter((w) => w.minimized)
          .map((win) => (
            <div
              key={win.id}
              className="chat-window-minimized"
              style={{ width: win.size.width }}
              onClick={() => maximizeWindow(win.id)}
            >
              <div className="minimized-header">
                <span className="avatar tiny">
                  {win.contact.avatar_url ? <img src={win.contact.avatar_url} alt="" /> : contactName(win.contact)[0]?.toUpperCase()}
                  <i className={`chat-status-dot inline ${onlineIds.has(win.contact.id) ? "online" : "offline"}`} />
                </span>
                <span className="minimized-name">{contactName(win.contact)}</span>
                {win.unreadCount > 0 && <span className="chat-unread-badge">{win.unreadCount > 99 ? "99+" : win.unreadCount}</span>}
                <button className="minimized-close" onClick={(e) => { e.stopPropagation(); closeWindow(win.id); }}><X size={14} /></button>
              </div>
            </div>
          ))}
      </div>

      {/* Main Chat Button (bottom-left) */}
      <button className="chat-main-button" onClick={() => setContactPanelOpen((v) => !v)} aria-label="Chat">
        <MessageCircle size={22} />
        {totalUnread > 0 && <span className="chat-main-badge">{totalUnread > 99 ? "99+" : totalUnread}</span>}
      </button>
    </div>
  );
}

// ============================================================
// EXPORTS
// ============================================================
export type { ChatContact, ChatMessage, ChatWindowState };