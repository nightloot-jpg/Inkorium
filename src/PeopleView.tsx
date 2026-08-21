// ============================================================
// PeopleView - Gestión completa de amigos (Amigos / Solicitudes / Buscar)
// ============================================================

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "./lib/supabase";
import type { Session } from "@supabase/supabase-js";
import { UserPlus, UserMinus, UserCheck, UserX, Search, MoreHorizontal, MessageCircle, Send, Check, X, Loader2, Users, User, Plus } from "lucide-react";
import { UserLink } from "./utils";

type ProfileData = {
  id: string;
  username: string | null;
  full_name: string | null;
  bio: string | null;
  city: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  user_status: string | null;
};

type Friendship = { id: string; user_id: string; friend_id: string; status: 'pending' | 'accepted' | 'blocked'; created_at: string; };
type Tab = "friends" | "requests" | "search";

function statusMeta(value: string | null | undefined) {
  if (value === "ausente") return { label: "Ausente", className: "away" };
  if (value === "desconectado") return { label: "Desconectado", className: "offline" };
  return { label: "Conectado", className: "online" };
}

export function PeopleView({ session, navigate }: { session: Session; navigate: (page: string, params?: Record<string, any>) => void }) {
  const [activeTab, setActiveTab] = useState<Tab>("friends");
  const [friends, setFriends] = useState<ProfileData[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<(Friendship & { requester: ProfileData })[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<(Friendship & { addressee: ProfileData })[]>([]);
  const [searchResults, setSearchResults] = useState<ProfileData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const myId = session.user.id;

  const loadFriends = useCallback(async () => {
    const [{ data: f1 }, { data: f2 }] = await Promise.all([
      supabase.from("friendships").select("friend_id").eq("user_id", myId).eq("status", "accepted"),
      supabase.from("friendships").select("user_id").eq("friend_id", myId).eq("status", "accepted"),
    ]);
    const ids = [...new Set([...(f1 || []).map((r: any) => r.friend_id), ...(f2 || []).map((r: any) => r.user_id)])];
    if (!ids.length) { setFriends([]); return; }
    const { data: profiles } = await supabase.from("profiles").select("id, username, full_name, avatar_url, bio, city, user_status").in("id", ids);
    setFriends((profiles || []) as ProfileData[]);
  }, [myId]);

  const loadRequests = useCallback(async () => {
    const { data: inc } = await supabase.from("friendships").select("id, user_id, friend_id, status, created_at, requester:profiles!user_id(id, username, full_name, avatar_url, bio, city, user_status)").eq("friend_id", myId).eq("status", "pending").order("created_at", { ascending: false });
    const { data: out } = await supabase.from("friendships").select("id, user_id, friend_id, status, created_at, addressee:profiles!friend_id(id, username, full_name, avatar_url, bio, city, user_status)").eq("user_id", myId).eq("status", "pending").order("created_at", { ascending: false });
    setIncomingRequests((inc || []) as any);
    setOutgoingRequests((out || []) as any);
  }, [myId]);

  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) { setSearchResults([]); return; }
    const { data } = await supabase.from("profiles").select("id, username, full_name, avatar_url, bio, city, user_status").or(`username.ilike.%${query}%,full_name.ilike.%${query}%`).neq("id", myId).limit(20);
    setSearchResults((data || []) as ProfileData[]);
  }, [myId]);

  useEffect(() => {
    let cancelled = false;
    async function init() { setLoading(true); await Promise.all([loadFriends(), loadRequests()]); if (!cancelled) setLoading(false); }
    init();
    return () => { cancelled = true; };
  }, [loadFriends, loadRequests]);

  const sendRequest = async (targetId: string) => { setActionLoading(prev => ({ ...prev, [targetId]: true })); const { error } = await supabase.from("friendships").insert({ user_id: myId, friend_id: targetId, status: "pending" }); setActionLoading(prev => ({ ...prev, [targetId]: false })); if (!error) { await loadRequests(); searchUsers(searchQuery); } };
  const acceptRequest = async (requestId: string, requesterId: string) => { setActionLoading(prev => ({ ...prev, [requestId]: true })); const { error } = await supabase.from("friendships").update({ status: "accepted" }).eq("id", requestId); setActionLoading(prev => ({ ...prev, [requestId]: false })); if (!error) await Promise.all([loadFriends(), loadRequests()]); };
  const rejectRequest = async (requestId: string) => { setActionLoading(prev => ({ ...prev, [requestId]: true })); const { error } = await supabase.from("friendships").delete().eq("id", requestId); setActionLoading(prev => ({ ...prev, [requestId]: false })); if (!error) await loadRequests(); };
  const cancelRequest = async (requestId: string) => { setActionLoading(prev => ({ ...prev, [requestId]: true })); const { error } = await supabase.from("friendships").delete().eq("id", requestId); setActionLoading(prev => ({ ...prev, [requestId]: false })); if (!error) await loadRequests(); };
  const removeFriend = async (friendId: string) => { if (!window.confirm("¿Eliminar a este amigo?")) return; setActionLoading(prev => ({ ...prev, [friendId]: true })); const { error } = await supabase.from("friendships").delete().or(`and(user_id.eq.${myId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${myId})`); setActionLoading(prev => ({ ...prev, [friendId]: false })); if (!error) await loadFriends(); };
  const openChat = () => navigate("mensajes");
  const displayName = (p: ProfileData) => p.username || p.full_name || "Usuario";

  if (loading) return <section className="content-view"><div className="people-loading">Cargando...</div></section>;

  const renderStatus = (value: string | null | undefined) => { const meta = statusMeta(value); return <span className={`people-user-status ${meta.className}`}><span className="people-user-status-dot" />{meta.label}</span>; };

  return (
    <section className="content-view people-view">
      <header className="people-header"><h1>Personas</h1><p className="view-subtitle">Tus amigos y solicitudes</p></header>
      <nav className="people-tabs">
        <button className={activeTab === "friends" ? "active" : ""} onClick={() => setActiveTab("friends")}><Users size={16} /> Amigos ({friends.length})</button>
        <button className={activeTab === "requests" ? "active" : ""} onClick={() => setActiveTab("requests")}><UserPlus size={16} /> Solicitudes ({incomingRequests.length + outgoingRequests.length})</button>
        <button className={activeTab === "search" ? "active" : ""} onClick={() => setActiveTab("search")}><Search size={16} /> Buscar</button>
      </nav>

      {activeTab === "friends" && <div className="people-list">{friends.length === 0 ? <div className="people-empty"><Users size={48} /><p>No tienes amigos aún</p><button className="primary-btn" onClick={() => setActiveTab("search")}><UserPlus size={16} /> Buscar gente</button></div> : <ul className="friends-grid">{friends.map((friend) => <li key={friend.id} className="friend-card"><div className="friend-main"><UserLink userId={friend.id} name={displayName(friend)} avatarUrl={friend.avatar_url} navigate={navigate} /><div className="friend-meta">{renderStatus(friend.user_status)}{friend.city && <span>📍 {friend.city}</span>}{friend.bio && <span>{friend.bio.slice(0, 80)}...</span>}</div></div><div className="friend-actions"><button className="icon-btn" onClick={() => openChat()} title="Chatear"><MessageCircle size={16} /></button><button className="icon-btn danger" onClick={() => removeFriend(friend.id)} title="Eliminar amigo" disabled={actionLoading[friend.id]}><UserMinus size={16} /></button></div></li>)}</ul>}</div>}

      {activeTab === "requests" && <div className="people-list">{incomingRequests.length === 0 && outgoingRequests.length === 0 ? <div className="people-empty"><UserPlus size={48} /><p>No hay solicitudes pendientes</p></div> : <>{incomingRequests.length > 0 && <div className="requests-section"><h3>Solicitudes recibidas ({incomingRequests.length})</h3><ul className="requests-list">{incomingRequests.map((req) => { const requester = req.requester; return <li key={req.id} className="request-card"><div><UserLink userId={requester.id} name={displayName(requester)} avatarUrl={requester.avatar_url} navigate={navigate} />{renderStatus(requester.user_status)}</div><div className="request-actions"><button className="btn accept" onClick={() => acceptRequest(req.id, requester.id)} disabled={actionLoading[req.id]}><Check size={14} /> Aceptar</button><button className="btn reject" onClick={() => rejectRequest(req.id)} disabled={actionLoading[req.id]}><X size={14} /> Rechazar</button></div></li>; })}</ul></div>}{outgoingRequests.length > 0 && <div className="requests-section"><h3>Solicitudes enviadas ({outgoingRequests.length})</h3><ul className="requests-list">{outgoingRequests.map((req) => { const addressee = req.addressee; return <li key={req.id} className="request-card"><div><UserLink userId={addressee.id} name={displayName(addressee)} avatarUrl={addressee.avatar_url} navigate={navigate} />{renderStatus(addressee.user_status)}</div><span className="request-status">Pendiente</span><button className="icon-btn danger" onClick={() => cancelRequest(req.id)} title="Cancelar solicitud" disabled={actionLoading[req.id]}><X size={16} /></button></li>; })}</ul></div>}</>}</div>}

      {activeTab === "search" && <div className="people-list search-tab"><div className="search-bar"><Search size={18} /><input value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); searchUsers(e.target.value); }} placeholder="Buscar por nombre o usuario..." /></div>{searchQuery.length < 2 ? <div className="people-empty"><Search size={48} /><p>Escribe al menos 2 caracteres para buscar</p></div> : searchResults.length === 0 ? <div className="people-empty"><User size={48} /><p>No se encontraron usuarios</p></div> : <ul className="search-results">{searchResults.map((user) => { const isFriend = friends.some(f => f.id === user.id); const hasOutgoing = outgoingRequests.some(r => r.friend_id === user.id); const hasIncoming = incomingRequests.some(r => r.user_id === user.id); const loadingAction = actionLoading[user.id]; return <li key={user.id} className="search-result-card"><div><UserLink userId={user.id} name={displayName(user)} avatarUrl={user.avatar_url} navigate={navigate} /><div className="search-meta">{renderStatus(user.user_status)}{user.city && <span>📍 {user.city}</span>}{user.bio && <span>{user.bio.slice(0, 60)}...</span>}</div></div><div className="search-actions">{isFriend ? <button className="btn friend" disabled>✓ Amigos</button> : hasOutgoing ? <button className="btn pending" disabled={loadingAction} onClick={() => cancelRequest(outgoingRequests.find(r => r.friend_id === user.id)!.id)}><Send size={14} /> Solicitud enviada</button> : hasIncoming ? <div className="incoming-actions"><button className="btn accept" onClick={() => acceptRequest(incomingRequests.find(r => r.user_id === user.id)!.id, user.id)} disabled={loadingAction}><Check size={14} /> Aceptar</button><button className="btn reject" onClick={() => rejectRequest(incomingRequests.find(r => r.user_id === user.id)!.id)} disabled={loadingAction}><X size={14} /></button></div> : <button className="btn primary" onClick={() => sendRequest(user.id)} disabled={loadingAction}><UserPlus size={14} /> Agregar</button>}</div></li>; })}</ul>}</div>}
    </section>
  );
}
