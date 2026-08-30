import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Photo, Album, FeedItem, WallComment, PrivateMessage, FriendRequest, Friendship, ChatMessage, InkoriumNotification, AccessLog, UserActivity, UserPresence } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { fetchPosts, createPost } from '../lib/postsApi';

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
const EMPTY_USER: User = { id: '', nombre: '', apellidos: '', email: '', sexo: 'otro', fnac: '', provincia: '', ciudad: undefined, estado: '', estadoFecha: '', situacionSentimental: 'Soltero/a', avatar: '', fechaReg: '', online: false, ultimoAcceso: '', chatEstado: '0' };

export const InkoriumProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]); const [currentUserId, setCurrentUserId] = useState('');
  const [photos, setPhotos] = useState<Photo[]>([]); const [albums, setAlbums] = useState<Album[]>([]); const [feed, setFeed] = useState<FeedItem[]>([]); const [wallComments, setWallComments] = useState<WallComment[]>([]);
  const [messages, setMessages] = useState<PrivateMessage[]>([]); const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]); const [friendships, setFriendships] = useState<Friendship[]>([]); const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [notifications, setNotifications] = useState<InkoriumNotification[]>([]); const [toasts, setToasts] = useState<InkoriumNotification[]>([]); const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]); const [activities, setActivities] = useState<UserActivity[]>([]);
  const [isRealtimeSimulationEnabled, setIsRealtimeSimulationEnabledState] = useState(false); const [isLoggedIn, setIsLoggedIn] = useState(false); const [activeTab, setActiveTabState] = useState<InkoriumContextType['activeTab']>('inicio');
  const [selectedUserId, setSelectedUserId] = useState(''); const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null); const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null); const [activeChatWindows, setActiveChatWindows] = useState<ChatWindow[]>([]);

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
        if (!response.ok) return; const data = await response.json(); if (!Array.isArray(data)) return;
        const mapped = data.map(mapProfileToUser); const storedPresence = localStorage.getItem('inkorium:presence') as UserPresence | null;
        setUsers(storedPresence && ['conectado','ausente','ocupado','invisible'].includes(storedPresence) ? mapped.map(user => user.id === currentUserId ? { ...user, presencia: storedPresence, online: storedPresence !== 'invisible', chatEstado: storedPresence === 'invisible' ? '0' : '1' } : user) : mapped);
      } catch (error) { console.error('Profiles load failed:', error); }
    }, 100);
  }, [mapProfileToUser, currentUserId]);

  const fetchAndMapPosts = useCallback(async () => {
    try {
      const rows = await fetchPosts(100);
      const mapped: FeedItem[] = rows.map(row => {
        const author = users.find(u => u.id === row.author_id);
        let photoUrl = '';
        if (row.media_data && typeof row.media_data === 'object' && 'url' in (row.media_data as any)) photoUrl = String((row.media_data as any).url || '');
        return { id: row.id, tipo: photoUrl ? 'foto' : 'estado', propietarioId: row.author_id, propietarioNombre: author ? `${author.nombre} ${author.apellidos}`.trim() : 'Usuario', propietarioAvatar: author?.avatar || '', datos: row.content, fotoUrl: photoUrl || undefined, fecha: row.created_at, likes: [], comentarios: [] };
      });
      setFeed(mapped);
    } catch (error) { console.error('Posts load failed:', error); }
  }, [users]);

  useEffect(() => {
    if (!supabase || !isSupabaseConfigured) return; let mounted = true;
    void supabase.auth.getSession().then(({ data }) => { if (!mounted) return; setCurrentUserId(data.session?.user?.id || ''); setIsLoggedIn(Boolean(data.session?.user)); void fetchProfiles(); });
    const { data: auth } = supabase.auth.onAuthStateChange((_event, session) => { setCurrentUserId(session?.user?.id || ''); setIsLoggedIn(Boolean(session?.user)); void fetchProfiles(); });
    const channel = supabase.channel('profiles-sync').on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => void fetchProfiles()).subscribe();
    return () => { mounted = false; if (profilesTimer.current) clearTimeout(profilesTimer.current); auth.subscription.unsubscribe(); void supabase.removeChannel(channel); };
  }, [fetchProfiles]);

  useEffect(() => { if (users.length > 0 || isSupabaseConfigured) void fetchAndMapPosts(); }, [users.length, fetchAndMapPosts]);

  const currentUser = users.find(user => user.id === currentUserId) || EMPTY_USER;
  const updateUserPresence = useCallback((presencia: UserPresence) => { if (!currentUserId) return; setUsers(prev => prev.map(user => user.id === currentUserId ? { ...user, presencia, online: presencia !== 'invisible', chatEstado: presencia === 'invisible' ? '0' : '1' } : user)); localStorage.setItem('inkorium:presence', presencia); }, [currentUserId]);
  const publishStatus = useCallback((statusText: string, attachedPhotoUrl?: string) => { if (!statusText.trim() && !attachedPhotoUrl) return; void createPost(statusText.trim(), attachedPhotoUrl).then(row => { const author = users.find(u => u.id === row.author_id) || currentUser; const photoUrl = row.media_data && typeof row.media_data === 'object' && 'url' in (row.media_data as any) ? String((row.media_data as any).url || '') : attachedPhotoUrl || ''; const item: FeedItem = { id: row.id, tipo: photoUrl ? 'foto' : 'estado', propietarioId: row.author_id, propietarioNombre: `${author.nombre} ${author.apellidos}`.trim() || 'Usuario', propietarioAvatar: author.avatar, datos: row.content, fotoUrl: photoUrl || undefined, fecha: row.created_at, likes: [], comentarios: [] }; setFeed(prev => [item, ...prev]); }).catch(error => { console.error('Post create failed:', error); alert('No se ha podido publicar. Revisa tu sesión e inténtalo de nuevo.'); }); }, [currentUser, users]);
  const updateUserData = useCallback((data: Partial<User>) => { if (!currentUserId) return; setUsers(prev => prev.map(user => user.id === currentUserId ? { ...user, ...data } : user)); }, [currentUserId]);
  const noop = useCallback((..._args: any[]) => {}, []);
  const setActiveTab = useCallback((tab: InkoriumContextType['activeTab']) => setActiveTabState(tab), []); const viewUserProfile = useCallback((id: string) => { setSelectedUserId(id); setActiveTabState('perfil'); }, []); const viewPhoto = useCallback((id: string | null) => setSelectedPhotoId(id), []); const viewAlbum = useCallback((id: string | null) => setSelectedAlbumId(id), []);
  const login = useCallback((_email: string, _password?: string) => ({ success: isLoggedIn }), [isLoggedIn]); const loginAsUser = useCallback((id: string) => { setCurrentUserId(id); setIsLoggedIn(true); }, []); const logout = useCallback(() => { if (supabase) void supabase.auth.signOut(); setCurrentUserId(''); setIsLoggedIn(false); }, []); const setCurrentUserById = useCallback((id: string) => setCurrentUserId(id), []);
  const setIsRealtime = useCallback((enabled: boolean) => setIsRealtimeSimulationEnabledState(enabled)); const pushNotification = useCallback((notif: InkoriumNotification) => setNotifications(prev => [notif, ...prev]), []);

  return <InkoriumContext.Provider value={{ currentUser, users, photos, albums, feed, wallComments, messages, friendRequests, friendships, chatMessages, notifications, toasts, accessLogs, activities, activeChatWindows, activeTab, selectedUserId, selectedPhotoId, selectedAlbumId, unreadMessagesCount: 0, unreadNotificationsCount: 0, pendingRequestsCount: 0, isRealtimeSimulationEnabled, isLoggedIn, setActiveTab, viewUserProfile, viewPhoto, viewAlbum, setCurrentUserById, login, loginAsUser, logout, publishStatus, updateStatusText: noop, updateUserPresence, likeFeedItem: noop, commentFeedItem: noop, postWallComment: noop, deleteWallComment: noop, uploadPhoto: noop, addPhotoTag: noop, removePhotoTag: noop, addPhotoComment: noop, likePhoto: noop, setPhotoAsAvatar: noop, deletePhoto: noop, createAlbum: noop, renameAlbum: noop, deleteAlbum: noop, sendFriendRequest: noop, acceptFriendRequest: noop, ignoreFriendRequest: noop, isFriend: () => false, hasPendingRequest: () => false, getFriendsOf: () => [], sendPrivateMessage: noop, markMessageAsRead: noop, deleteMessage: noop, openChatWith: noop, closeChat: noop, toggleMinimizeChat: noop, sendChatMessage: noop, setChatEstado: noop, logUserActivity: noop, deleteUserActivity: noop, getUserActivities: () => [], pushNotification, dismissToast: noop, markNotificationAsRead: noop, markAllNotificationsAsRead: noop, deleteNotification: noop, setIsRealtimeSimulationEnabled: setIsRealtime, simulateIncomingMessage: noop, simulateWallComment: noop, simulateFriendRequest: noop, simulatePhotoInteraction: noop, updateUserData, resetToDefaultData: noop, registerNewUser: noop }}>{children}</InkoriumContext.Provider>;
};

export const useInkorium = () => { const ctx = useContext(InkoriumContext); if (!ctx) throw new Error('useInkorium debe usarse dentro de InkoriumProvider'); return ctx; };
