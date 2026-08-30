import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { uploadFileDirectToStorage, deleteStorageObject } from '../lib/storage';
import { playClickSound, playMessageSound, playNotificationChime, playSuccessSound } from '../utils/sound';
import type { User, Photo, Album, FeedItem, WallComment, PrivateMessage, FriendRequest, Friendship, ChatMessage, InkoriumNotification, AccessLog, UserActivity, PhotoTag } from '../types';

interface ChatWindow { targetUserId: string; minimized: boolean; }
type Tab = 'inicio' | 'perfil' | 'gente' | 'fotos' | 'mensajes' | 'ajustes';

interface ContextValue {
  currentUser: User;
  users: User[]; photos: Photo[]; albums: Album[]; feed: FeedItem[]; wallComments: WallComment[];
  messages: PrivateMessage[]; friendRequests: FriendRequest[]; friendships: Friendship[]; chatMessages: ChatMessage[];
  notifications: InkoriumNotification[]; toasts: InkoriumNotification[]; accessLogs: AccessLog[]; activities: UserActivity[];
  activeChatWindows: ChatWindow[]; activeTab: Tab; selectedUserId: string; selectedPhotoId: string | null; selectedAlbumId: string | null;
  unreadMessagesCount: number; unreadNotificationsCount: number; pendingRequestsCount: number;
  isRealtimeSimulationEnabled: boolean;
  setActiveTab: (tab: Tab) => void; viewUserProfile: (id: string) => void; viewPhoto: (id: string | null) => void;
  viewAlbum: (id: string | null) => void; setCurrentUserById: (id: string) => void;
  publishStatus: (text: string, attachedPhotoUrl?: string) => void; likeFeedItem: (id: string) => void; commentFeedItem: (id: string, text: string) => void;
  postWallComment: (receptorId: string, text: string) => void; deleteWallComment: (commentId: string) => void;
  uploadPhoto: (titulo: string, albumId: string | null, archivoUrl: string) => void; addPhotoTag: (photoId: string, targetUserId: string, x: number, y: number) => void;
  removePhotoTag: (photoId: string, tagId: string) => void; addPhotoComment: (photoId: string, comentario: string) => void; likePhoto: (photoId: string) => void;
  setPhotoAsAvatar: (photoId: string) => void; deletePhoto: (photoId: string) => void; createAlbum: (nombre: string, descripcion?: string) => void;
  renameAlbum: (albumId: string, nuevoNombre: string) => void; deleteAlbum: (albumId: string) => void;
  sendFriendRequest: (targetUserId: string) => void; acceptFriendRequest: (requestId: string) => void; ignoreFriendRequest: (requestId: string) => void;
  isFriend: (a: string, b: string) => boolean; hasPendingRequest: (from: string, to: string) => boolean; getFriendsOf: (userId: string) => User[];
  sendPrivateMessage: (receptorId: string, asunto: string, mensaje: string) => void; markMessageAsRead: (messageId: string) => void; deleteMessage: (messageId: string) => void;
  openChatWith: (targetUserId: string) => void; closeChat: (targetUserId: string) => void; toggleMinimizeChat: (targetUserId: string) => void;
  sendChatMessage: (targetUserId: string, text: string) => void; setChatEstado: (estado: '1' | '0') => void;
  logUserActivity: (activity: Omit<UserActivity, 'id' | 'timestamp'>) => void; deleteUserActivity: (activityId: string) => void; getUserActivities: (userId: string) => UserActivity[];
  pushNotification: (notif: InkoriumNotification) => void; dismissToast: (id: string) => void; markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void; deleteNotification: (id: string) => void; setIsRealtimeSimulationEnabled: (enabled: boolean) => void;
  simulateIncomingMessage: () => void; simulateWallComment: () => void; simulateFriendRequest: () => void; simulatePhotoInteraction: () => void;
  updateUserData: (data: Partial<User>) => void; resetToDefaultData: () => void;
  registerNewUser: (nombre: string, apellidos: string, email: string, sexo: 'h' | 'm', provincia: string, fnac: string, password?: string) => void;
}

const Ctx = createContext<ContextValue | undefined>(undefined);
const emptyUser: User = { id: '', nombre: 'Invitado', apellidos: '', email: '', sexo: 'otro', fnac: '', provincia: '', estado: '', situacionSentimental: 'Soltero/a', avatar: '', fechaReg: '', online: false, ultimoAcceso: '', chatEstado: '0' };

function splitName(name: string) { const p = name.trim().split(/\s+/); return { nombre: p.shift() || '', apellidos: p.join(' ') }; }
function dateText(value?: string | null) { return value ? new Date(value).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }) : 'Ahora mismo'; }
function toDataUrlFile(dataUrl: string, name: string) { const [meta, b64] = dataUrl.split(','); const mime = meta?.match(/data:(.*?);/)?.[1] || 'image/jpeg'; const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0)); return new File([bytes], name, { type: mime }); }
function safeNotifType(type: string): InkoriumNotification['tipo'] { if (type === 'friend_request') return 'peticion'; if (type === 'message') return 'mp'; if (type === 'comment' || type === 'wall_post') return 'tablon'; if (type === 'tag') return 'etiqueta'; if (type === 'like') return 'like'; return 'foto'; }

export const InkoriumProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [wallComments, setWallComments] = useState<WallComment[]>([]);
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [notifications, setNotifications] = useState<InkoriumNotification[]>([]);
  const [toasts, setToasts] = useState<InkoriumNotification[]>([]);
  const [activeChatWindows, setActiveChatWindows] = useState<ChatWindow[]>([]);
  const [activeTab, setActiveTabState] = useState<Tab>('inicio');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState('');
  const [sessionEmail, setSessionEmail] = useState('');
  const [chatEstado, setChatEstadoState] = useState<'1' | '0'>('1');
  const [ready, setReady] = useState(false);

  const currentUser = useMemo(() => users.find(u => u.id === currentUserId) || users.find(u => u.email === sessionEmail) || users[0] || emptyUser, [users, currentUserId, sessionEmail]);

  const refresh = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const authId = sessionData.session?.user?.id || '';
    const email = sessionData.session?.user?.email || '';
    setSessionEmail(email);
    const [profilesR, photosR, albumsR, postsR, postLikesR, commentsR, photoLikesR, photoCommentsR, photoTagsR, friendsR, messagesR, chatChannelsR, chatParticipantsR, chatMessagesR, notifsR] = await Promise.all([
      supabase.from('profiles').select('*').order('full_name'),
      supabase.from('photos').select('*').order('created_at', { ascending: false }),
      supabase.from('photo_albums').select('*').order('created_at', { ascending: false }),
      supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('post_likes').select('*'),
      supabase.from('comments').select('*').order('created_at'),
      supabase.from('photo_likes').select('*'),
      supabase.from('photo_comments').select('*').order('created_at'),
      supabase.from('photo_tags').select('*'),
      supabase.from('friendships').select('*'),
      supabase.from('chat_messages').select('*').order('created_at'),
      supabase.from('chat_channels').select('*'),
      supabase.from('chat_participants').select('*'),
      supabase.from('chat_messages').select('*').order('created_at'),
      supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(100),
    ]);
    const profiles: any[] = profilesR.data || [];
    const profileById = new Map(profiles.map(p => [p.id, p]));
    const mappedUsers: User[] = profiles.map(p => { const { nombre, apellidos } = splitName(p.full_name || p.username || ''); return {
      id: p.id, nombre, apellidos, email: p.id === authId ? email : '', sexo: 'otro', fnac: p.birth_date || '', provincia: '', ciudad: p.city || '',
      estado: p.user_status || '', estadoFecha: dateText(p.updated_at), situacionSentimental: 'Soltero/a', ocupacion: '', intereses: (p.profile_interests || []).join(', '), musica: '',
      avatar: p.avatar_url || '', fechaReg: dateText(p.created_at), online: false, ultimoAcceso: dateText(p.updated_at), chatEstado: p.id === currentUserId ? chatEstado : '1',
    }; });
    setUsers(mappedUsers); if (!currentUserId && authId) setCurrentUserId(authId); if (!selectedUserId && authId) setSelectedUserId(authId);

    const postLikes = postLikesR.data || []; const comments = commentsR.data || [];
    const mappedFeed: FeedItem[] = (postsR.data || []).map((p: any) => { const author = profileById.get(p.author_id); const { nombre, apellidos } = splitName(author?.full_name || author?.username || 'Usuario');
      const md = p.media_data; const mediaUrl = md?.url || md?.public_url || md?.src || undefined;
      const itemComments = comments.filter(c => c.post_id === p.id).map(c => { const a = profileById.get(c.author_id); const n = splitName(a?.full_name || a?.username || 'Usuario'); return { id: c.id, userId: c.author_id, nombre: n.nombre + (n.apellidos ? ` ${n.apellidos}` : ''), avatar: a?.avatar_url || '', texto: c.content || '', fecha: dateText(c.created_at) }; });
      return { id: p.id, tipo: p.target_profile_id ? 'tablon' : (mediaUrl ? 'foto' : 'estado'), propietarioId: p.author_id, propietarioNombre: nombre + (apellidos ? ` ${apellidos}` : ''), propietarioAvatar: author?.avatar_url || '', datos: p.content || '', fotoUrl: mediaUrl, fecha: dateText(p.created_at), likes: postLikes.filter(l => l.post_id === p.id).map(l => l.user_id), comentarios: itemComments };
    }); setFeed(mappedFeed);
    setWallComments((postsR.data || []).filter((p: any) => p.target_profile_id).map((p: any) => { const a = profileById.get(p.author_id); const n = splitName(a?.full_name || a?.username || 'Usuario'); return { id: p.id, emisorId: p.author_id, emisorNombre: n.nombre + (n.apellidos ? ` ${n.apellidos}` : ''), emisorAvatar: a?.avatar_url || '', receptorId: p.target_profile_id, comentario: p.content || '', fecha: dateText(p.created_at) }; }));
    const albumById = new Map((albumsR.data || []).map((a: any) => [a.id, a]));
    setAlbums((albumsR.data || []).map((a: any) => ({ id: a.id, userId: a.user_id, nombre: a.name, descripcion: a.description || '', fecha: dateText(a.created_at) })));
    setPhotos((photosR.data || []).map((p: any) => { const a = profileById.get(p.user_id); const alb = albumById.get(p.album_id); const n = splitName(a?.full_name || a?.username || 'Usuario'); return {
      id: p.id, uploaderId: p.user_id, uploaderName: n.nombre + (n.apellidos ? ` ${n.apellidos}` : ''), albumId: p.album_id, albumName: alb?.name, archivo: p.url || p.storage_path || '', titulo: p.caption || '', fecha: dateText(p.created_at),
      etiquetas: (photoTagsR.data || []).filter(t => t.photo_id === p.id).map((t: any): PhotoTag => { const tagUser = profileById.get(t.user_id); const tn = splitName(tagUser?.full_name || tagUser?.username || 'Usuario'); return { id: t.id, photoId: t.photo_id, userId: t.user_id, userName: tn.nombre + (tn.apellidos ? ` ${tn.apellidos}` : ''), x: t.x, y: t.y }; }),
      comentarios: (photoCommentsR.data || []).filter(c => c.photo_id === p.id).map((c: any) => { const ca = profileById.get(c.author_id); const cn = splitName(ca?.full_name || ca?.username || 'Usuario'); return { id: c.id, photoId: c.photo_id, userId: c.author_id, nombre: cn.nombre + (cn.apellidos ? ` ${cn.apellidos}` : ''), avatar: ca?.avatar_url || '', comentario: c.content || '', fecha: dateText(c.created_at) }; }),
      likes: (photoLikesR.data || []).filter(l => l.photo_id === p.id).map(l => l.user_id),
    }; }));
    const frows: any[] = friendsR.data || [];
    setFriendships(frows.filter(f => f.status === 'accepted').map(f => ({ id: f.id, user1: f.user_id, user2: f.friend_id, fecha: dateText(f.created_at) })));
    setFriendRequests(frows.filter(f => f.status === 'pending' || f.status === 'rejected').map(f => { const u = profileById.get(f.user_id); const n = splitName(u?.full_name || u?.username || 'Usuario'); return { id: f.id, emisorId: f.user_id, emisorNombre: n.nombre + (n.apellidos ? ` ${n.apellidos}` : ''), emisorAvatar: u?.avatar_url || '', emisorProvincia: u?.city || '', receptorId: f.friend_id, fecha: dateText(f.created_at), estado: f.status === 'pending' ? 'pendiente' : 'ignorada' }; }));

    const channelRows: any[] = chatChannelsR.data || []; const participantRows: any[] = chatParticipantsR.data || []; const directChannels = channelRows.filter(c => c.type === 'direct' && participantRows.some(p => p.channel_id === c.id && p.user_id === authId));
    const directIds = new Set(directChannels.map(c => c.id));
    const participantsByChannel = new Map<string, any[]>(); participantRows.forEach(p => { if (!participantsByChannel.has(p.channel_id)) participantsByChannel.set(p.channel_id, []); participantsByChannel.get(p.channel_id)!.push(p); });
    const realChatRows: any[] = (chatMessagesR.data || []).filter(m => directIds.has(m.channel_id) && !m.is_deleted);
    setChatMessages(realChatRows.map(m => { const ps = participantsByChannel.get(m.channel_id) || []; const other = ps.find(p => p.user_id !== m.sender_id); return { id: m.id, emisorId: m.sender_id, receptorId: other?.user_id || authId, mensaje: m.content, fecha: dateText(m.created_at), leido: m.sender_id === authId || ps.find(p => p.user_id === authId)?.last_read_message_id === m.id }; }));
    const priv: PrivateMessage[] = []; realChatRows.forEach(m => { const ps = participantsByChannel.get(m.channel_id) || []; const receiver = ps.find(p => p.user_id !== m.sender_id); if (!receiver) return; const sender = profileById.get(m.sender_id); const rec = profileById.get(receiver.user_id); const sn = splitName(sender?.full_name || sender?.username || 'Usuario'); const rn = splitName(rec?.full_name || rec?.username || 'Usuario'); let parsed: any = {}; try { parsed = JSON.parse(m.content); } catch { parsed = { mensaje: m.content }; } priv.push({ id: m.id, emisorId: m.sender_id, emisorNombre: sn.nombre + (sn.apellidos ? ` ${sn.apellidos}` : ''), emisorAvatar: sender?.avatar_url || '', receptorId: receiver.user_id, receptorNombre: rn.nombre + (rn.apellidos ? ` ${rn.apellidos}` : ''), asunto: parsed.asunto || 'Mensaje privado', mensaje: parsed.mensaje || m.content, fecha: dateText(m.created_at), leido: m.sender_id === authId || receiver.user_id !== authId || ps.find(p => p.user_id === authId)?.last_read_message_id === m.id }); }); setMessages(priv);
    setNotifications((notifsR.data || []).filter((n: any) => n.user_id === authId).map((n: any) => { const a = profileById.get(n.actor_id); const nn = splitName(a?.full_name || a?.username || 'Usuario'); return { id: n.id, userId: n.user_id, fromUserId: n.actor_id || '', fromUserName: nn.nombre + (nn.apellidos ? ` ${nn.apellidos}` : ''), fromUserAvatar: a?.avatar_url || '', tipo: safeNotifType(n.type), mensaje: `${nn.nombre} ${n.type === 'friend_request' ? 'te ha enviado una petición de amistad' : 'ha interactuado contigo'}`, enlace: n.type === 'message' ? 'mensajes' : n.type === 'friend_request' ? 'ajustes' : 'inicio', leido: !!n.is_read, fecha: dateText(n.created_at), targetId: n.entity_id || undefined }; }));
    setReady(true);
  }, [currentUserId, selectedUserId, sessionEmail, chatEstado]);

  useEffect(() => { void refresh(); const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => { setSessionEmail(session?.user?.email || ''); setCurrentUserId(session?.user?.id || ''); void refresh(); }); return () => sub.subscription.unsubscribe(); }, []);
  useEffect(() => { if (!ready) return; const channel = supabase.channel('inkorium-live').on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, refresh).on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, refresh).on('postgres_changes', { event: '*', schema: 'public', table: 'post_likes' }, refresh).on('postgres_changes', { event: '*', schema: 'public', table: 'photos' }, refresh).on('postgres_changes', { event: '*', schema: 'public', table: 'photo_comments' }, refresh).on('postgres_changes', { event: '*', schema: 'public', table: 'photo_likes' }, refresh).on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, refresh).on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, refresh).on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, refresh).subscribe(); return () => { void supabase.removeChannel(channel); }; }, [ready, refresh]);

  const requireAuth = useCallback(async () => { const { data } = await supabase.auth.getSession(); if (!data.session?.user?.id) throw new Error('Debes iniciar sesión en Inkorium.'); return data.session.user.id; }, []);
  const setActiveTab = useCallback((tab: Tab) => { playClickSound(); setActiveTabState(tab); if (tab === 'perfil') setSelectedUserId(currentUser.id); }, [currentUser.id]);
  const viewUserProfile = useCallback((id: string) => { playClickSound(); setSelectedUserId(id); setActiveTabState('perfil'); window.scrollTo({ top: 0, behavior: 'smooth' }); }, []);
  const viewPhoto = useCallback((id: string | null) => setSelectedPhotoId(id), []);
  const viewAlbum = useCallback((id: string | null) => { setSelectedAlbumId(id); setActiveTabState('fotos'); }, []);
  const setCurrentUserById = useCallback((id: string) => { setCurrentUserId(id); setSelectedUserId(id); playSuccessSound(); }, []);

  const publishStatus = useCallback(async (text: string, attachedPhotoUrl?: string) => { try { const uid = await requireAuth(); if (!text.trim() && !attachedPhotoUrl) return; await supabase.from('posts').insert({ author_id: uid, content: text.trim(), visibility: 'friends_only', media_data: attachedPhotoUrl ? { url: attachedPhotoUrl, type: 'image' } : null }); if (text.trim()) await supabase.from('profiles').update({ user_status: text.trim() }).eq('id', uid); await refresh(); playSuccessSound(); } catch (e) { console.error(e); } }, [requireAuth, refresh]);
  const likeFeedItem = useCallback(async (id: string) => { try { const uid = await requireAuth(); const { data: existing } = await supabase.from('post_likes').select('user_id').eq('post_id', id).eq('user_id', uid).maybeSingle(); if (existing) await supabase.from('post_likes').delete().eq('post_id', id).eq('user_id', uid); else await supabase.from('post_likes').insert({ post_id: id, user_id: uid }); await refresh(); } catch (e) { console.error(e); } }, [requireAuth, refresh]);
  const commentFeedItem = useCallback(async (id: string, text: string) => { try { const uid = await requireAuth(); if (!text.trim()) return; await supabase.from('comments').insert({ post_id: id, author_id: uid, content: text.trim() }); await refresh(); } catch (e) { console.error(e); } }, [requireAuth, refresh]);
  const postWallComment = useCallback(async (receptorId: string, text: string) => { try { const uid = await requireAuth(); if (!text.trim()) return; await supabase.from('posts').insert({ author_id: uid, target_profile_id: receptorId, content: text.trim(), visibility: 'friends_only' }); await refresh(); } catch (e) { console.error(e); } }, [requireAuth, refresh]);
  const deleteWallComment = useCallback(async (id: string) => { try { await requireAuth(); await supabase.from('posts').delete().eq('id', id); await refresh(); } catch (e) { console.error(e); } }, [requireAuth, refresh]);

  const uploadPhoto = useCallback(async (titulo: string, albumId: string | null, archivoUrl: string) => { try { const uid = await requireAuth(); let url = archivoUrl; let key: string | null = null; if (archivoUrl.startsWith('data:')) { const file = toDataUrlFile(archivoUrl, `${Date.now()}.jpg`); const uploaded = await uploadFileDirectToStorage({ folder: 'photos', file }); url = String(uploaded.url || ''); key = uploaded.key || null; } const { data, error } = await supabase.from('photos').insert({ user_id: uid, album_id: albumId || null, storage_path: key, url, caption: titulo || '' }).select('id').single(); if (error) throw error; if (data?.id) await supabase.from('posts').insert({ author_id: uid, content: titulo || '', visibility: 'friends_only', media_data: { photo_id: data.id, url } }); await refresh(); playSuccessSound(); } catch (e) { console.error(e); } }, [requireAuth, refresh]);
  const addPhotoTag = useCallback(async (photoId: string, targetUserId: string, x: number, y: number) => { try { const uid = await requireAuth(); await supabase.from('photo_tags').insert({ photo_id: photoId, user_id: targetUserId, tagged_by: uid, x, y }); await refresh(); } catch (e) { console.error(e); } }, [requireAuth, refresh]);
  const removePhotoTag = useCallback(async (_photoId: string, tagId: string) => { try { await requireAuth(); await supabase.from('photo_tags').delete().eq('id', tagId); await refresh(); } catch (e) { console.error(e); } }, [requireAuth, refresh]);
  const addPhotoComment = useCallback(async (photoId: string, comentario: string) => { try { const uid = await requireAuth(); if (!comentario.trim()) return; await supabase.from('photo_comments').insert({ photo_id: photoId, author_id: uid, content: comentario.trim() }); await refresh(); } catch (e) { console.error(e); } }, [requireAuth, refresh]);
  const likePhoto = useCallback(async (photoId: string) => { try { const uid = await requireAuth(); const { data } = await supabase.from('photo_likes').select('id').eq('photo_id', photoId).eq('user_id', uid).maybeSingle(); if (data) await supabase.from('photo_likes').delete().eq('id', data.id); else await supabase.from('photo_likes').insert({ photo_id: photoId, user_id: uid }); await refresh(); } catch (e) { console.error(e); } }, [requireAuth, refresh]);
  const setPhotoAsAvatar = useCallback(async (photoId: string) => { try { const uid = await requireAuth(); const p = photos.find(x => x.id === photoId); if (!p) return; await supabase.from('profiles').update({ avatar_url: p.archivo }).eq('id', uid); await refresh(); } catch (e) { console.error(e); } }, [requireAuth, photos, refresh]);
  const deletePhoto = useCallback(async (photoId: string) => { try { const uid = await requireAuth(); const p = photos.find(x => x.id === photoId); if (p?.archivo?.startsWith('http')) { const key = p.archivo.includes('/photos/') ? p.archivo.split('/').slice(p.archivo.indexOf('photos/')).join('/') : ''; if (key) await deleteStorageObject(key).catch(() => undefined); } await supabase.from('photos').delete().eq('id', photoId).eq('user_id', uid); await refresh(); } catch (e) { console.error(e); } }, [requireAuth, photos, refresh]);
  const createAlbum = useCallback(async (nombre: string, descripcion?: string) => { try { const uid = await requireAuth(); await supabase.from('photo_albums').insert({ user_id: uid, name: nombre.trim(), description: descripcion || '' }); await refresh(); } catch (e) { console.error(e); } }, [requireAuth, refresh]);
  const renameAlbum = useCallback(async (id: string, nuevoNombre: string) => { try { const uid = await requireAuth(); await supabase.from('photo_albums').update({ name: nuevoNombre.trim() }).eq('id', id).eq('user_id', uid); await refresh(); } catch (e) { console.error(e); } }, [requireAuth, refresh]);
  const deleteAlbum = useCallback(async (id: string) => { try { const uid = await requireAuth(); await supabase.from('photo_albums').delete().eq('id', id).eq('user_id', uid); await refresh(); } catch (e) { console.error(e); } }, [requireAuth, refresh]);

  const sendFriendRequest = useCallback(async (target: string) => { try { const uid = await requireAuth(); if (uid === target || isFriend(uid, target) || hasPendingRequest(uid, target)) return; const reverse = friendRequests.find(r => r.emisorId === target && r.receptorId === uid && r.estado === 'pendiente'); if (reverse) { await supabase.from('friendships').update({ status: 'accepted' }).eq('id', reverse.id); } else { await supabase.from('friendships').insert({ user_id: uid, friend_id: target, status: 'pending' }); } await refresh(); } catch (e) { console.error(e); } }, [requireAuth, refresh, friendships, friendRequests]);
  const acceptFriendRequest = useCallback(async (id: string) => { try { await requireAuth(); await supabase.from('friendships').update({ status: 'accepted' }).eq('id', id); await refresh(); } catch (e) { console.error(e); } }, [requireAuth, refresh]);
  const ignoreFriendRequest = useCallback(async (id: string) => { try { await requireAuth(); await supabase.from('friendships').update({ status: 'rejected' }).eq('id', id); await refresh(); } catch (e) { console.error(e); } }, [requireAuth, refresh]);
  const isFriend = useCallback((a: string, b: string) => a === b || friendships.some(f => (f.user1 === a && f.user2 === b) || (f.user1 === b && f.user2 === a)), [friendships]);
  const hasPendingRequest = useCallback((from: string, to: string) => friendRequests.some(r => r.emisorId === from && r.receptorId === to && r.estado === 'pendiente'), [friendRequests]);
  const getFriendsOf = useCallback((uid: string) => { const ids = friendships.filter(f => f.user1 === uid || f.user2 === uid).map(f => f.user1 === uid ? f.user2 : f.user1); return users.filter(u => ids.includes(u.id)); }, [friendships, users]);

  const sendPrivateMessage = useCallback(async (receptorId: string, asunto: string, mensaje: string) => { try { const uid = await requireAuth(); const rpc = await supabase.rpc('get_or_create_direct_chat', { p_other_user: receptorId }); if (rpc.error) throw rpc.error; const channelId = String(rpc.data); await supabase.from('chat_messages').insert({ channel_id: channelId, sender_id: uid, type: 'text', content: JSON.stringify({ asunto: asunto || 'Sin asunto', mensaje }) }); await refresh(); playMessageSound(); } catch (e) { console.error(e); } }, [requireAuth, refresh]);
  const markMessageAsRead = useCallback(async (id: string) => { try { const uid = await requireAuth(); const { data: msg } = await supabase.from('chat_messages').select('channel_id').eq('id', id).maybeSingle(); if (!msg) return; await supabase.from('chat_participants').update({ last_read_message_id: id }).eq('channel_id', msg.channel_id).eq('user_id', uid); await refresh(); } catch (e) { console.error(e); } }, [requireAuth, refresh]);
  const deleteMessage = useCallback(async (id: string) => { try { await requireAuth(); await supabase.from('chat_messages').update({ is_deleted: true }).eq('id', id); await refresh(); } catch (e) { console.error(e); } }, [requireAuth, refresh]);
  const openChatWith = useCallback((id: string) => setActiveChatWindows(prev => prev.some(w => w.targetUserId === id) ? prev : [...prev, { targetUserId: id, minimized: false }]), []);
  const closeChat = useCallback((id: string) => setActiveChatWindows(prev => prev.filter(w => w.targetUserId !== id)), []);
  const toggleMinimizeChat = useCallback((id: string) => setActiveChatWindows(prev => prev.map(w => w.targetUserId === id ? { ...w, minimized: !w.minimized } : w)), []);
  const sendChatMessage = useCallback(async (targetUserId: string, text: string) => { try { const uid = await requireAuth(); const rpc = await supabase.rpc('get_or_create_direct_chat', { p_other_user: targetUserId }); if (rpc.error) throw rpc.error; await supabase.from('chat_messages').insert({ channel_id: String(rpc.data), sender_id: uid, type: 'text', content: text.trim() }); await refresh(); playMessageSound(); } catch (e) { console.error(e); } }, [requireAuth, refresh]);
  const setChatEstado = useCallback((estado: '1' | '0') => { setChatEstadoState(estado); playClickSound(); }, []);

  const logUserActivity = useCallback((_a: Omit<UserActivity, 'id' | 'timestamp'>) => {}, []);
  const deleteUserActivity = useCallback((_id: string) => {}, []);
  const getUserActivities = useCallback((_id: string) => [], []);
  const pushNotification = useCallback(async (notif: InkoriumNotification) => { try { await supabase.from('notifications').insert({ user_id: notif.userId, actor_id: notif.fromUserId || null, type: notif.tipo === 'peticion' ? 'friend_request' : notif.tipo === 'mp' ? 'message' : notif.tipo === 'like' ? 'like' : 'comment', entity_id: notif.targetId || null }); await refresh(); playNotificationChime(); } catch (e) { console.error(e); } }, [refresh]);
  const dismissToast = useCallback((id: string) => setToasts(prev => prev.filter(t => t.id !== id)), []);
  const markNotificationAsRead = useCallback(async (id: string) => { await supabase.from('notifications').update({ is_read: true }).eq('id', id); await refresh(); }, [refresh]);
  const markAllNotificationsAsRead = useCallback(async () => { if (!currentUser.id) return; await supabase.from('notifications').update({ is_read: true }).eq('user_id', currentUser.id).eq('is_read', false); await refresh(); }, [currentUser.id, refresh]);
  const deleteNotification = useCallback(async (id: string) => { await supabase.from('notifications').delete().eq('id', id); await refresh(); }, [refresh]);
  const setIsRealtimeSimulationEnabled = useCallback((_enabled: boolean) => {}, []);
  const simulateIncomingMessage = useCallback(() => {}, []); const simulateWallComment = useCallback(() => {}, []); const simulateFriendRequest = useCallback(() => {}, []); const simulatePhotoInteraction = useCallback(() => {}, []);
  const updateUserData = useCallback(async (data: Partial<User>) => { try { const uid = await requireAuth(); const update: Record<string, unknown> = {}; if (data.nombre !== undefined || data.apellidos !== undefined) update.full_name = `${data.nombre ?? currentUser.nombre} ${data.apellidos ?? currentUser.apellidos}`.trim(); if (data.avatar !== undefined) update.avatar_url = data.avatar; if (data.ciudad !== undefined) update.city = data.ciudad; if (data.fnac !== undefined) update.birth_date = data.fnac || null; if (data.estado !== undefined) update.user_status = data.estado; if (data.intereses !== undefined) update.profile_interests = data.intereses ? data.intereses.split(',').map(s => s.trim()).filter(Boolean) : []; await supabase.from('profiles').update(update).eq('id', uid); await refresh(); } catch (e) { console.error(e); } }, [requireAuth, currentUser, refresh]);
  const resetToDefaultData = useCallback(() => { void refresh(); }, [refresh]);
  const registerNewUser = useCallback(async (nombre: string, apellidos: string, email: string, _sexo: 'h' | 'm', provincia: string, fnac: string, password = '') => { try { const result = await supabase.auth.signUp({ email, password: password || crypto.randomUUID() }); if (result.error) throw result.error; if (!result.data.user) return; const uid = result.data.user.id; const profileInsert = await supabase.from('profiles').upsert({ id: uid, username: email.split('@')[0], full_name: `${nombre} ${apellidos}`.trim(), city: provincia, birth_date: fnac || null }).select('id').maybeSingle(); if (profileInsert.error) throw profileInsert.error; setCurrentUserId(uid); setSelectedUserId(uid); await refresh(); } catch (e) { console.error(e); } }, [refresh]);

  const value: ContextValue = { currentUser, users, photos, albums, feed, wallComments, messages, friendRequests, friendships, chatMessages, notifications, toasts, accessLogs: [] as AccessLog[], activities: [], activeChatWindows, activeTab, selectedUserId, selectedPhotoId, selectedAlbumId, unreadMessagesCount: messages.filter(m => m.receptorId === currentUser.id && !m.leido).length, unreadNotificationsCount: notifications.filter(n => n.userId === currentUser.id && !n.leido).length, pendingRequestsCount: friendRequests.filter(r => r.receptorId === currentUser.id && r.estado === 'pendiente').length, isRealtimeSimulationEnabled: false, setActiveTab, viewUserProfile, viewPhoto, viewAlbum, setCurrentUserById, publishStatus, likeFeedItem, commentFeedItem, postWallComment, deleteWallComment, uploadPhoto, addPhotoTag, removePhotoTag, addPhotoComment, likePhoto, setPhotoAsAvatar, deletePhoto, createAlbum, renameAlbum, deleteAlbum, sendFriendRequest, acceptFriendRequest, ignoreFriendRequest, isFriend, hasPendingRequest, getFriendsOf, sendPrivateMessage, markMessageAsRead, deleteMessage, openChatWith, closeChat, toggleMinimizeChat, sendChatMessage, setChatEstado, logUserActivity, deleteUserActivity, getUserActivities, pushNotification, dismissToast, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification, setIsRealtimeSimulationEnabled, simulateIncomingMessage, simulateWallComment, simulateFriendRequest, simulatePhotoInteraction, updateUserData, resetToDefaultData, registerNewUser };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export function useInkorium() { const ctx = useContext(Ctx); if (!ctx) throw new Error('useInkorium debe usarse dentro de InkoriumProvider'); return ctx; }
