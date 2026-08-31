import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Photo, Album, FeedItem, WallComment, PrivateMessage, FriendRequest, Friendship, ChatMessage, InkoriumNotification, AccessLog, UserActivity, UserPresence } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { fetchPosts, createPost } from '../lib/postsApi';
import { fetchPhotos, insertPhoto } from '../lib/photosApi';
import { INITIAL_USERS, INITIAL_ALBUMS, INITIAL_PHOTOS, INITIAL_FEED, INITIAL_WALL_COMMENTS, INITIAL_FRIENDSHIPS, INITIAL_FRIEND_REQUESTS, INITIAL_MESSAGES, INITIAL_NOTIFICATIONS, INITIAL_ACCESS_LOGS, INITIAL_ACTIVITIES } from '../data/mockData';

interface ChatWindow { targetUserId: string; minimized: boolean; }
interface InkoriumContextType {
  currentUser: User; users: User[]; photos: Photo[]; albums: Album[]; feed: FeedItem[]; wallComments: WallComment[];
  messages: PrivateMessage[]; friendRequests: FriendRequest[]; friendships: Friendship[]; chatMessages: ChatMessage[];
  notifications: InkoriumNotification[]; toasts: InkoriumNotification[]; accessLogs: AccessLog[]; activities: UserActivity[];
  activeChatWindows: ChatWindow[]; activeTab: 'inicio' | 'perfil' | 'gente' | 'fotos' | 'mensajes' | 'ajustes';
  selectedUserId: string; selectedPhotoId: string | null; selectedAlbumId: string | null;
  unreadMessagesCount: number; unreadNotificationsCount: number; pendingRequestsCount: number;
  isRealtimeSimulationEnabled: boolean; isLoggedIn: boolean;
  setActiveTab: (tab: InkoriumContextType['activeTab']) => void; viewUserProfile: (userId: string) => void;
  viewPhoto: (photoId: string | null) => void; viewAlbum: (albumId: string | null) => void; setCurrentUserById: (userId: string) => void;
  login: (email: string, password?: string) => { success: boolean; error?: string }; loginAsUser: (userId: string) => void; logout: () => void;
  publishStatus: (statusText: string, attachedPhotoUrl?: string) => void; updateStatusText: (statusText: string) => void;
  updateUserPresence: (presencia: UserPresence) => void; likeFeedItem: (feedId: string) => void; commentFeedItem: (feedId: string, text: string) => void;
  postWallComment: (receptorId: string, text: string) => void; deleteWallComment: (commentId: string) => void;
  uploadPhoto: (titulo: string, albumId: string | null, archivoUrl: string) => void; addPhotoTag: (photoId: string, targetUserId: string, x: number, y: number) => void;
  removePhotoTag: (photoId: string, tagId: string) => void; addPhotoComment: (photoId: string, comentario: string) => void; likePhoto: (photoId: string) => void;
  setPhotoAsAvatar: (photoId: string) => void; deletePhoto: (photoId: string) => void; createAlbum: (nombre: string, descripcion?: string) => void;
  renameAlbum: (albumId: string, nuevoNombre: string) => void; deleteAlbum: (albumId: string) => void;
  sendFriendRequest: (targetUserId: string) => void; acceptFriendRequest: (requestId: string) => void; ignoreFriendRequest: (requestId: string) => void;
  isFriend: (userId1: string, userId2: string) => boolean; hasPendingRequest: (fromId: string, toId: string) => boolean; getFriendsOf: (userId: string) => User[];
  sendPrivateMessage: (receptorId: string, asunto: string, mensaje: string) => void; markMessageAsRead: (messageId: string) => void; deleteMessage: (messageId: string) => void;
  openChatWith: (targetUserId: string) => void; closeChat: (targetUserId: string) => void; toggleMinimizeChat: (targetUserId: string) => void;
  sendChatMessage: (targetUserId: string, text: string) => void; setChatEstado: (estado: '1' | '0') => void;
  logUserActivity: (activity: Omit<UserActivity, 'id' | 'timestamp'>) => void; deleteUserActivity: (activityId: string) => void; getUserActivities: (userId: string) => UserActivity[];
  pushNotification: (notif: InkoriumNotification) => void; dismissToast: (toastId: string) => void; markNotificationAsRead: (notifId: string) => void;
  markAllNotificationsAsRead: () => void; deleteNotification: (notifId: string) => void; setIsRealtimeSimulationEnabled: (enabled: boolean) => void;
  simulateIncomingMessage: () => void; simulateWallComment: () => void; simulateFriendRequest: () => void; simulatePhotoInteraction: () => void;
  updateUserData: (data: Partial<User>) => void; resetToDefaultData: () => void; registerNewUser: (nombre: string, apellidos: string, email: string, sexo: 'h' | 'm', provincia: string, fnac: string) => void;
}

const InkoriumContext = createContext<InkoriumContextType | undefined>(undefined);
const EMPTY_USER: User = INITIAL_USERS[0] || { id: '', nombre: '', apellidos: '', email: '', sexo: 'otro', fnac: '', provincia: '', ciudad: undefined, estado: '', estadoFecha: '', situacionSentimental: 'Soltero/a', avatar: '', fechaReg: '', online: false, ultimoAcceso: '', chatEstado: '0' };

export const InkoriumProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(INITIAL_USERS); const [currentUserId, setCurrentUserId] = useState(INITIAL_USERS[0]?.id || '');
  const [photos, setPhotos] = useState<Photo[]>(INITIAL_PHOTOS); const [albums, setAlbums] = useState<Album[]>(INITIAL_ALBUMS); const [feed, setFeed] = useState<FeedItem[]>(INITIAL_FEED); const [wallComments, setWallComments] = useState<WallComment[]>(INITIAL_WALL_COMMENTS);
  const [messages, setMessages] = useState<PrivateMessage[]>(INITIAL_MESSAGES); const [friendRequests, setFriendRequests] = useState<FriendRequest[]>(INITIAL_FRIEND_REQUESTS); const [friendships, setFriendships] = useState<Friendship[]>(INITIAL_FRIENDSHIPS); const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [notifications, setNotifications] = useState<InkoriumNotification[]>(INITIAL_NOTIFICATIONS); const [toasts, setToasts] = useState<InkoriumNotification[]>([]); const [accessLogs, setAccessLogs] = useState<AccessLog[]>(INITIAL_ACCESS_LOGS); const [activities, setActivities] = useState<UserActivity[]>(INITIAL_ACTIVITIES);
  const [isRealtimeSimulationEnabled, setIsRealtimeSimulationEnabledState] = useState(false); const [isLoggedIn, setIsLoggedIn] = useState(false); const [activeTab, setActiveTabState] = useState<InkoriumContextType['activeTab']>('inicio');
  const [selectedUserId, setSelectedUserId] = useState(''); const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null); const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null); const [activeChatWindows, setActiveChatWindows] = useState<ChatWindow[]>([]);

  // Keep currentUser initialized before callbacks/effects that depend on it.
  const currentUser = users.find(user => user.id === currentUserId) || users[0] || EMPTY_USER;

  const mapProfileToUser = useCallback((p: any): User => {
    const username = String(p.username ?? '').trim(); const fullName = String(p.full_name ?? p.fullname ?? '').trim(); const parts = fullName ? fullName.split(/\s+/) : [];
    const nombre = String(p.nombre ?? parts[0] ?? username ?? `Usuario_${String(p.id).slice(0, 6)}`).trim(); const apellidos = String(p.apellidos ?? parts.slice(1).join(' ')).trim();
    const city = String(p.city ?? p.ciudad ?? '').trim(); const province = String(p.province ?? p.provincia ?? city).trim();
    const rawPresence = String(p.presence ?? p.presencia ?? p.user_status ?? p.estado ?? '').trim().toLowerCase(); const presencia: UserPresence = ['conectado','ausente','ocupado','invisible'].includes(rawPresence) ? rawPresence as UserPresence : 'conectado';
    const gender = String(p.gender ?? p.sexo ?? '').trim().toLowerCase(); const avatar = String(p.avatar_url ?? p.avatar ?? '').trim();
    const interests = Array.isArray(p.profile_interests) ? p.profile_interests.join(', ') : String(p.profile_interests ?? p.intereses ?? '').trim();
    return { id: String(p.id), username: username || undefined, full_name: fullName || undefined, nombre: nombre || username || 'Usuario', apellidos, email: String(p.email ?? '').trim(), sexo: gender === 'female' || gender === 'mujer' || gender === 'm' ? 'm' : (gender === 'male' || gender === 'hombre' || gender === 'h' ? 'h' : 'otro'), fnac: String(p.birth_date ?? p.fnac ?? '').trim(), provincia: province, ciudad: city || undefined, estado: String(p.user_status ?? p.estado ?? '').trim(), estadoFecha: p.updated_at ? 'Reciente' : '', presencia, situacionSentimental: p.relationship_status ?? p.situacion_sentimental ?? 'Soltero/a', ocupacion: p.occupation ?? p.ocupacion ?? '', intereses: interests, musica: p.music ?? p.musica ?? '', avatar, fechaReg: p.updated_at ? new Date(p.updated_at).toLocaleDateString('es-ES') : 'Reciente', online: presencia !== 'invisible', ultimoAcceso: p.updated_at ? new Date(p.updated_at).toLocaleString('es-ES') : 'Recientemente', chatEstado: presencia === 'invisible' ? '0' : '1' };
  }, []);

  const profilesTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchProfiles = useCallback(async () => {
    if (!isSupabaseConfigured) return; if (profilesTimer.current) clearTimeout(profilesTimer.current);
    profilesTimer.current = setTimeout(async () => {
      try {
        const response = await fetch('/api/profiles?select=id,username,full_name,avatar_url,city,birth_date,user_status,profile_interests,updated_at&limit=1000', { cache: 'no-store', headers: { Accept: 'application/json' } });
        if (!response.ok) return; const data = (await response.json()) as any[]; if (!Array.isArray(data)) return;
        const mapped: User[] = data.map(mapProfileToUser); const storedPresence = localStorage.getItem('inkorium:presence') as UserPresence | null;
        setUsers(storedPresence && ['conectado','ausente','ocupado','invisible'].includes(storedPresence) ? mapped.map((user: User) => user.id === currentUserId ? { ...user, presencia: storedPresence, online: storedPresence !== 'invisible', chatEstado: storedPresence === 'invisible' ? '0' : '1' } : user) : (mapped.length > 0 ? mapped : INITIAL_USERS));
      } catch (error) { console.error('Profiles load failed:', error); }
    }, 100);
  }, [mapProfileToUser, currentUserId]);

  const mapPhotoToPhoto = useCallback((row: any): Photo => {
    const uploader = users.find(u => u.id === String(row.user_id));
    return { id: String(row.id), uploaderId: String(row.user_id), uploaderName: uploader ? `${uploader.nombre} ${uploader.apellidos}`.trim() : 'Usuario', albumId: row.album_id ?? null, albumName: undefined, archivo: String(row.url || ''), titulo: String(row.caption || 'Sin título'), fecha: row.created_at ? new Date(row.created_at).toLocaleString('es-ES') : 'Recientemente', etiquetas: [], comentarios: [], likes: [] };
  }, [users]);

  const fetchAndMapPhotos = useCallback(async () => {
    try {
      const rows = await fetchPhotos();
      if (rows && rows.length > 0) {
        setPhotos(rows.map(mapPhotoToPhoto));
      } else {
        setPhotos(prev => (prev.length > 0 ? prev : INITIAL_PHOTOS));
      }
    } catch (error) {
      console.warn('Photos load failed, using local photos:', error);
      setPhotos(prev => (prev.length > 0 ? prev : INITIAL_PHOTOS));
    }
  }, [mapPhotoToPhoto]);

  const fetchAndMapPosts = useCallback(async () => {
    try {
      const rows = await fetchPosts(100);
      if (rows && rows.length > 0) {
        const mapped: FeedItem[] = rows.map(row => {
          const author = users.find(u => u.id === row.author_id);
          let photoUrl = '';
          if (row.media_data && typeof row.media_data === 'object' && 'url' in (row.media_data as any)) photoUrl = String((row.media_data as any).url || '');
          return { id: row.id, tipo: photoUrl ? 'foto' : 'estado', propietarioId: row.author_id, propietarioNombre: author ? `${author.nombre} ${author.apellidos}`.trim() : 'Usuario', propietarioAvatar: author?.avatar || '', datos: row.content, fotoUrl: photoUrl || undefined, fecha: row.created_at, likes: [], comentarios: [] };
        });
        setFeed(mapped);
      } else {
        setFeed(prev => (prev.length > 0 ? prev : INITIAL_FEED));
      }
    } catch (error) {
      console.warn('Posts load failed, using local feed:', error);
      setFeed(prev => (prev.length > 0 ? prev : INITIAL_FEED));
    }
  }, [users]);

  useEffect(() => {
    if (!supabase || !isSupabaseConfigured) return; let mounted = true;
    void supabase.auth.getSession().then(({ data }) => { if (!mounted) return; setCurrentUserId(data.session?.user?.id || ''); setIsLoggedIn(Boolean(data.session?.user)); void fetchProfiles(); });
    const { data: auth } = supabase.auth.onAuthStateChange((_event, session) => { setCurrentUserId(session?.user?.id || ''); setIsLoggedIn(Boolean(session?.user)); void fetchProfiles(); });
    const profilesChannel = supabase.channel('profiles-sync').on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => void fetchProfiles()).subscribe();
    const photosChannel = supabase.channel('photos-sync').on('postgres_changes', { event: '*', schema: 'public', table: 'photos' }, () => void fetchAndMapPhotos()).subscribe();
    return () => { mounted = false; if (profilesTimer.current) clearTimeout(profilesTimer.current); auth.subscription.unsubscribe(); void supabase.removeChannel(profilesChannel); void supabase.removeChannel(photosChannel); };
  }, [fetchProfiles, fetchAndMapPhotos]);

  useEffect(() => { if (users.length > 0 || isSupabaseConfigured) void fetchAndMapPosts(); }, [users.length, fetchAndMapPosts]);
  useEffect(() => { if (currentUserId && isSupabaseConfigured) void fetchAndMapPhotos(); }, [currentUserId, fetchAndMapPhotos]);

  const updateUserPresence = useCallback((presencia: UserPresence) => { if (!currentUserId) return; setUsers(prev => prev.map(user => user.id === currentUserId ? { ...user, presencia, online: presencia !== 'invisible', chatEstado: presencia === 'invisible' ? '0' : '1' } : user)); localStorage.setItem('inkorium:presence', presencia); }, [currentUserId]);
  const publishStatus = useCallback((statusText: string, attachedPhotoUrl?: string) => { if (!statusText.trim() && !attachedPhotoUrl) return; void createPost(statusText.trim(), attachedPhotoUrl).then(row => { const author = users.find(u => u.id === row.author_id) || currentUser; const photoUrl = row.media_data && typeof row.media_data === 'object' && 'url' in (row.media_data as any) ? String((row.media_data as any).url || '') : attachedPhotoUrl || ''; const item: FeedItem = { id: row.id, tipo: photoUrl ? 'foto' : 'estado', propietarioId: row.author_id, propietarioNombre: `${author.nombre} ${author.apellidos}`.trim() || 'Usuario', propietarioAvatar: author.avatar, datos: row.content, fotoUrl: photoUrl || undefined, fecha: row.created_at, likes: [], comentarios: [] }; setFeed(prev => [item, ...prev]); }).catch(error => { console.error('Post create failed:', error); const message = error instanceof Error ? error.message : String(error); alert(`No se ha podido publicar. ${message}`); }); }, [currentUser, users]);
  const uploadPhoto = useCallback((titulo: string, albumId: string | null, archivoUrl: string) => {
    if (!currentUserId || !archivoUrl) return;
    const optimisticId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const optimistic: Photo = { id: optimisticId, uploaderId: currentUserId, uploaderName: `${currentUser.nombre} ${currentUser.apellidos}`.trim() || 'Usuario', albumId, archivo: archivoUrl, titulo: titulo || 'Sin título', fecha: new Date().toLocaleString('es-ES'), etiquetas: [], comentarios: [], likes: [] };
    setPhotos(prev => [optimistic, ...prev]);
    void insertPhoto({ userId: currentUserId, albumId, url: archivoUrl, caption: titulo || 'Sin título' }).then(row => { setPhotos(prev => [mapPhotoToPhoto(row), ...prev.filter(photo => photo.id !== optimisticId)]); }).catch(error => { console.error('Photo persistence failed:', error); setPhotos(prev => prev.filter(photo => photo.id !== optimisticId)); alert('La foto se ha subido al almacenamiento, pero no se pudo registrar en la galería. Inténtalo de nuevo.'); });
  }, [currentUserId, currentUser, mapPhotoToPhoto]);
  const updateUserData = useCallback((data: Partial<User>) => { if (!currentUserId) return; setUsers(prev => prev.map(user => user.id === currentUserId ? { ...user, ...data } : user)); }, [currentUserId]);
  const updateStatusText = useCallback(async (statusText: string) => {
    if (!currentUserId || !supabase) return;
    const nextStatus = statusText.trim().slice(0, 140);
    try {
      const sessionResult = await supabase.auth.getSession();
      const accessToken = sessionResult.data.session?.access_token;
      if (!accessToken) throw new Error('AUTH_REQUIRED');
      const response = await fetch(`/api/profiles/${encodeURIComponent(currentUserId)}/status`, { method: 'PATCH', headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ status: nextStatus }) });
      if (!response.ok) { let detail = ''; try { const body = await response.json(); detail = body?.message || body?.error || ''; } catch { /* ignore malformed error response */ } throw new Error(detail || `STATUS_UPDATE_FAILED_${response.status}`); }
      const result = await response.json(); const savedStatus = String(result?.user_status ?? nextStatus).slice(0, 140);
      setUsers(prev => prev.map(user => user.id === currentUserId ? { ...user, estado: savedStatus, estadoFecha: 'Reciente' } : user)); void fetchProfiles();
    } catch (error) { console.error('Profile status update failed:', error); alert('No se ha podido guardar el estado. Inténtalo de nuevo.'); }
  }, [currentUserId, fetchProfiles]);
  const openChatWith = useCallback((targetUserId: string) => { if (!currentUserId || !targetUserId || targetUserId === currentUserId) return; setActiveChatWindows(prev => { const existing = prev.find(win => win.targetUserId === targetUserId); if (existing) return prev.map(win => win.targetUserId === targetUserId ? { ...win, minimized: false } : win); return [...prev, { targetUserId, minimized: false }]; }); }, [currentUserId]);
  const closeChat = useCallback((targetUserId: string) => { setActiveChatWindows(prev => prev.filter(win => win.targetUserId !== targetUserId)); }, []);
  const toggleMinimizeChat = useCallback((targetUserId: string) => { setActiveChatWindows(prev => prev.map(win => win.targetUserId === targetUserId ? { ...win, minimized: !win.minimized } : win)); }, []);
  const sendChatMessage = useCallback((targetUserId: string, text: string) => { const message = text.trim(); if (!currentUserId || !targetUserId || targetUserId === currentUserId || !message) return; setChatMessages(prev => [...prev, { id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`, emisorId: currentUserId, receptorId: targetUserId, mensaje: message, fecha: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }), leido: true }]); setActiveChatWindows(prev => { const existing = prev.find(win => win.targetUserId === targetUserId); if (existing) return prev.map(win => win.targetUserId === targetUserId ? { ...win, minimized: false } : win); return [...prev, { targetUserId, minimized: false }]; }); }, [currentUserId]);
  const noop = useCallback((..._args: any[]) => {}, []);
  const setActiveTab = useCallback((tab: InkoriumContextType['activeTab']) => setActiveTabState(tab), []); const viewUserProfile = useCallback((id: string) => { setSelectedUserId(id); setActiveTabState('perfil'); }, []); const viewPhoto = useCallback((id: string | null) => setSelectedPhotoId(id), []); const viewAlbum = useCallback((id: string | null) => setSelectedAlbumId(id), []);
  const login = useCallback((_email: string, _password?: string) => ({ success: isLoggedIn }), [isLoggedIn]); const loginAsUser = useCallback((id: string) => { setCurrentUserId(id); setIsLoggedIn(true); }, []); const logout = useCallback(() => { if (supabase) void supabase.auth.signOut(); setCurrentUserId(''); setIsLoggedIn(false); }, []); const setCurrentUserById = useCallback((id: string) => setCurrentUserId(id), []);
  const setIsRealtime = useCallback((enabled: boolean) => setIsRealtimeSimulationEnabledState(enabled), []); const pushNotification = useCallback((notif: InkoriumNotification) => setNotifications(prev => [notif, ...prev]), []);
  return <InkoriumContext.Provider value={{ currentUser, users, photos, albums, feed, wallComments, messages, friendRequests, friendships, chatMessages, notifications, toasts, accessLogs, activities, activeChatWindows, activeTab, selectedUserId, selectedPhotoId, selectedAlbumId, unreadMessagesCount: 0, unreadNotificationsCount: 0, pendingRequestsCount: 0, isRealtimeSimulationEnabled, isLoggedIn, setActiveTab, viewUserProfile, viewPhoto, viewAlbum, setCurrentUserById, login, loginAsUser, logout, publishStatus, updateStatusText, updateUserPresence, likeFeedItem: noop, commentFeedItem: noop, postWallComment: noop, deleteWallComment: noop, uploadPhoto, addPhotoTag: noop, removePhotoTag: noop, addPhotoComment: noop, likePhoto: noop, setPhotoAsAvatar: noop, deletePhoto: noop, createAlbum: noop, renameAlbum: noop, deleteAlbum: noop, sendFriendRequest: noop, acceptFriendRequest: noop, ignoreFriendRequest: noop, isFriend: () => false, hasPendingRequest: () => false, getFriendsOf: () => [], sendPrivateMessage: noop, markMessageAsRead: noop, deleteMessage: noop, sendChatMessage, openChatWith, closeChat, toggleMinimizeChat, setChatEstado: noop, logUserActivity: noop, deleteUserActivity: noop, getUserActivities: () => [], pushNotification, dismissToast: noop, markNotificationAsRead: noop, markAllNotificationsAsRead: noop, deleteNotification: noop, setIsRealtimeSimulationEnabled: setIsRealtime, simulateIncomingMessage: noop, simulateWallComment: noop, simulateFriendRequest: noop, simulatePhotoInteraction: noop, updateUserData, resetToDefaultData: noop, registerNewUser: noop }}>{children}</InkoriumContext.Provider>;
};

export const useInkorium = () => { const ctx = useContext(InkoriumContext); if (!ctx) throw new Error('useInkorium debe usarse dentro de InkoriumProvider'); return ctx; };
