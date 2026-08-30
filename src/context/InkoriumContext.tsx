import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { User, Photo, Album, FeedItem, WallComment, PrivateMessage, FriendRequest, Friendship, ChatMessage, InkoriumNotification, AccessLog, PhotoTag, UserActivity, UserPresence } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface ChatWindow { targetUserId: string; minimized: boolean; }
interface InkoriumContextType {
  currentUser: User; users: User[]; photos: Photo[]; albums: Album[]; feed: FeedItem[]; wallComments: WallComment[];
  messages: PrivateMessage[]; friendRequests: FriendRequest[]; friendships: Friendship[]; chatMessages: ChatMessage[];
  notifications: InkoriumNotification[]; toasts: InkoriumNotification[]; accessLogs: AccessLog[]; activities: UserActivity[];
  activeChatWindows: ChatWindow[]; activeTab: 'inicio' | 'perfil' | 'gente' | 'fotos' | 'mensajes' | 'ajustes';
  selectedUserId: string; selectedPhotoId: string | null; selectedAlbumId: string | null;
  unreadMessagesCount: number; unreadNotificationsCount: number; pendingRequestsCount: number;
  isRealtimeSimulationEnabled: boolean; isLoggedIn: boolean;
  setActiveTab: (tab: InkoriumContextType['activeTab']) => void; viewUserProfile: (userId: string) => void; viewPhoto: (photoId: string | null) => void; viewAlbum: (albumId: string | null) => void; setCurrentUserById: (userId: string) => void;
  login: (email: string, password?: string) => { success: boolean; error?: string }; loginAsUser: (userId: string) => void; logout: () => void;
  publishStatus: (statusText: string, attachedPhotoUrl?: string) => void; updateStatusText: (statusText: string) => void; updateUserPresence: (presencia: UserPresence) => void; likeFeedItem: (feedId: string) => void; commentFeedItem: (feedId: string, text: string) => void;
  postWallComment: (receptorId: string, text: string) => void; deleteWallComment: (commentId: string) => void; uploadPhoto: (titulo: string, albumId: string | null, archivoUrl: string) => void;
  addPhotoTag: (photoId: string, targetUserId: string, x: number, y: number) => void; removePhotoTag: (photoId: string, tagId: string) => void; addPhotoComment: (photoId: string, comentario: string) => void; likePhoto: (photoId: string) => void;
  setPhotoAsAvatar: (photoId: string) => void; deletePhoto: (photoId: string) => void; createAlbum: (nombre: string, descripcion?: string) => void; renameAlbum: (albumId: string, nuevoNombre: string) => void; deleteAlbum: (albumId: string) => void;
  sendFriendRequest: (targetUserId: string) => void; acceptFriendRequest: (requestId: string) => void; ignoreFriendRequest: (requestId: string) => void; isFriend: (userId1: string, userId2: string) => boolean; hasPendingRequest: (fromId: string, toId: string) => boolean; getFriendsOf: (userId: string) => User[];
  sendPrivateMessage: (receptorId: string, asunto: string, mensaje: string) => void; markMessageAsRead: (messageId: string) => void; deleteMessage: (messageId: string) => void; openChatWith: (targetUserId: string) => void; closeChat: (targetUserId: string) => void; toggleMinimizeChat: (targetUserId: string) => void; sendChatMessage: (targetUserId: string, text: string) => void; setChatEstado: (estado: '1' | '0') => void;
  logUserActivity: (activity: Omit<UserActivity, 'id' | 'timestamp'>) => void; deleteUserActivity: (activityId: string) => void; getUserActivities: (userId: string) => UserActivity[];
  pushNotification: (notif: InkoriumNotification) => void; dismissToast: (toastId: string) => void; markNotificationAsRead: (notifId: string) => void; markAllNotificationsAsRead: () => void; deleteNotification: (notifId: string) => void;
  setIsRealtimeSimulationEnabled: (enabled: boolean) => void; simulateIncomingMessage: () => void; simulateWallComment: () => void; simulateFriendRequest: () => void; simulatePhotoInteraction: () => void; updateUserData: (data: Partial<User>) => void; resetToDefaultData: () => void; registerNewUser: (nombre: string, apellidos: string, email: string, sexo: 'h' | 'm', provincia: string, fnac: string) => void;
}

const InkoriumContext = createContext<InkoriumContextType | undefined>(undefined);
const EMPTY_USER: User = { id: '', nombre: '', apellidos: '', email: '', sexo: 'otro', fnac: '', provincia: '', ciudad: undefined, estado: '', estadoFecha: '', situacionSentimental: 'Soltero/a', avatar: '', fechaReg: '', online: false, ultimoAcceso: '', chatEstado: '0' };

const mapProfileToUser = (p: any): User => {
  const username = String(p?.username ?? '').trim();
  const fullName = String(p?.full_name ?? '').trim();
  const parts = fullName ? fullName.split(/\s+/) : [];
  const interests = Array.isArray(p?.profile_interests) ? p.profile_interests.join(', ') : String(p?.profile_interests ?? '').trim();
  const rawPresence = String(p?.presence ?? '').trim().toLowerCase();
  const rawStatus = String(p?.user_status ?? '').trim().toLowerCase();
  const presenceSource = rawPresence || (['conectado','ausente','ocupado','invisible'].includes(rawStatus) ? rawStatus : 'conectado');
  const presencia: UserPresence = ['conectado','ausente','ocupado','invisible'].includes(presenceSource) ? presenceSource as UserPresence : 'conectado';
  const gender = String(p?.gender ?? '').trim().toLowerCase();
  const avatar = String(p?.avatar_url ?? '').trim();
  return {
    id: String(p.id), username: username || undefined, full_name: fullName || undefined,
    nombre: String(parts[0] ?? username ?? `Usuario_${String(p.id).slice(0,6)}`).trim() || 'Usuario',
    apellidos: String(parts.slice(1).join(' ')).trim(), email: '',
    sexo: gender === 'female' || gender === 'mujer' || gender === 'm' ? 'm' : (gender === 'male' || gender === 'hombre' || gender === 'h' ? 'h' : 'otro'),
    fnac: String(p?.birth_date ?? '').trim(), provincia: String(p?.city ?? '').trim(), ciudad: String(p?.city ?? '').trim() || undefined,
    estado: String(p?.user_status ?? '').trim(), estadoFecha: p?.updated_at ? 'Reciente' : '', presencia,
    situacionSentimental: 'Soltero/a', ocupacion: '', intereses, musica: '', avatar,
    fechaReg: p?.updated_at ? new Date(p.updated_at).toLocaleDateString('es-ES') : 'Reciente',
    online: presencia !== 'invisible', ultimoAcceso: p?.updated_at ? new Date(p.updated_at).toLocaleString('es-ES') : 'Recientemente', chatEstado: presencia === 'invisible' ? '0' : '1'
  };
};

export const InkoriumProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserId, setCurrentUserId] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTabState] = useState<InkoriumContextType['activeTab']>('inicio');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [activeChatWindows, setActiveChatWindows] = useState<ChatWindow[]>([]);
  const [isRealtimeSimulationEnabled, setIsRealtimeSimulationEnabledState] = useState(false);
  const [notifications, setNotifications] = useState<InkoriumNotification[]>([]);
  const [toasts, setToasts] = useState<InkoriumNotification[]>([]);

  const loadProfiles = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    try {
      const params = new URLSearchParams({ select: 'id,username,full_name,avatar_url,city,birth_date,user_status,profile_interests,updated_at', limit: '1000' });
      const response = await fetch(`/api/profiles?${params.toString()}`, { method: 'GET', headers: { Accept: 'application/json' }, credentials: 'omit', cache: 'no-store' });
      if (!response.ok) throw new Error(`profiles:${response.status}`);
      const data = await response.json();
      if (Array.isArray(data)) setUsers(data.map(mapProfileToUser).filter((u: User) => Boolean(u.id)));
    } catch (error) {
      console.error('Supabase profiles request failed:', error);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    let mounted = true;
    void supabase.auth.getSession().then(({ data: { session } }) => { if (mounted) { setCurrentUserId(session?.user?.id || ''); setIsLoggedIn(Boolean(session?.user)); } });
    void loadProfiles();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { setCurrentUserId(session?.user?.id || ''); setIsLoggedIn(Boolean(session?.user)); void loadProfiles(); });
    const channel = supabase.channel('profiles-sync').on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => void loadProfiles()).subscribe();
    return () => { mounted = false; subscription.unsubscribe(); supabase.removeChannel(channel); };
  }, [loadProfiles]);

  const noop = useCallback((..._args: any[]) => {}, []);
  const currentUser = users.find(u => u.id === currentUserId) || EMPTY_USER;
  const setActiveTab = useCallback((tab: InkoriumContextType['activeTab']) => setActiveTabState(tab), []);
  const viewUserProfile = useCallback((id: string) => { setSelectedUserId(id); setActiveTabState('perfil'); }, []);
  const viewPhoto = useCallback((id: string | null) => setSelectedPhotoId(id), []);
  const viewAlbum = useCallback((id: string | null) => setSelectedAlbumId(id), []);
  const login = useCallback((_email: string, _password?: string) => ({ success: isLoggedIn }), [isLoggedIn]);
  const loginAsUser = useCallback((id: string) => { setCurrentUserId(id); setIsLoggedIn(true); }, []);
  const logout = useCallback(() => { void supabase?.auth.signOut(); setCurrentUserId(''); setIsLoggedIn(false); }, []);
  const setCurrentUser = useCallback((id: string) => setCurrentUserId(id), []);
  const setIsRealtime = useCallback((enabled: boolean) => { setIsRealtimeSimulationEnabledState(enabled); }, []);
  const pushNotification = useCallback((notif: InkoriumNotification) => { setNotifications(prev => [notif, ...prev]); setToasts(prev => [notif, ...prev].slice(0, 4)); }, []);
  const dismissToast = useCallback((id: string) => setToasts(prev => prev.filter(n => n.id !== id)), []);
  const noArray = useCallback(() => [], []);
  const noBool = useCallback(() => false, []);

  const value: InkoriumContextType = {
    currentUser, users, photos: [], albums: [], feed: [], wallComments: [], messages: [], friendRequests: [], friendships: [], chatMessages: [],
    notifications, toasts, accessLogs: [], activities: [], activeChatWindows, activeTab, selectedUserId, selectedPhotoId, selectedAlbumId,
    unreadMessagesCount: 0, unreadNotificationsCount: notifications.filter(n => !n.leido && n.userId === currentUserId).length, pendingRequestsCount: 0,
    isRealtimeSimulationEnabled, isLoggedIn, setActiveTab, viewUserProfile, viewPhoto, viewAlbum, setCurrentUserById: setCurrentUser, login, loginAsUser, logout,
    publishStatus: noop, updateStatusText: noop, updateUserPresence: noop, likeFeedItem: noop, commentFeedItem: noop, postWallComment: noop, deleteWallComment: noop,
    uploadPhoto: noop, addPhotoTag: noop, removePhotoTag: noop, addPhotoComment: noop, likePhoto: noop, setPhotoAsAvatar: noop, deletePhoto: noop, createAlbum: noop,
    renameAlbum: noop, deleteAlbum: noop, sendFriendRequest: noop, acceptFriendRequest: noop, ignoreFriendRequest: noop, isFriend: noBool, hasPendingRequest: noBool, getFriendsOf: noArray,
    sendPrivateMessage: noop, markMessageAsRead: noop, deleteMessage: noop, openChatWith: noop, closeChat: noop, toggleMinimizeChat: noop, sendChatMessage: noop, setChatEstado: noop,
    logUserActivity: noop, deleteUserActivity: noop, getUserActivities: noArray, pushNotification, dismissToast, markNotificationAsRead: noop, markAllNotificationsAsRead: noop, deleteNotification: noop,
    setIsRealtimeSimulationEnabled: setIsRealtime, simulateIncomingMessage: noop, simulateWallComment: noop, simulateFriendRequest: noop, simulatePhotoInteraction: noop, updateUserData: noop, resetToDefaultData: noop, registerNewUser: noop
  };

  return <InkoriumContext.Provider value={value}>{children}</InkoriumContext.Provider>;
};

export const useInkorium = () => {
  const ctx = useContext(InkoriumContext);
  if (!ctx) throw new Error('useInkorium debe usarse dentro de InkoriumProvider');
  return ctx;
};
