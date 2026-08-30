import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  User, Photo, Album, FeedItem, WallComment, PrivateMessage,
  FriendRequest, Friendship, ChatMessage, InkoriumNotification, AccessLog,
  PhotoTag, UserActivity, UserPresence
} from '../types';
import { playSuccessSound, playClickSound, playNotificationChime } from '../utils/sound';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import confetti from 'canvas-confetti';

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

const EMPTY_USER: User = {
  id: '', nombre: '', apellidos: '', email: '', sexo: 'otro', fnac: '', provincia: '', ciudad: undefined,
  estado: '', estadoFecha: '', situacionSentimental: 'Soltero/a', avatar: '', fechaReg: '', online: false,
  ultimoAcceso: '', chatEstado: '0'
};

export const InkoriumProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserId, setCurrentUserId] = useState('');
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
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [isRealtimeSimulationEnabled, setIsRealtimeSimulationEnabledState] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTabState] = useState<InkoriumContextType['activeTab']>('inicio');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [activeChatWindows, setActiveChatWindows] = useState<ChatWindow[]>([]);

  const mapProfileToUser = useCallback((p: any): User => {
    const username = String(p.username ?? '').trim();
    const fullName = String(p.full_name ?? p.fullname ?? '').trim();
    const parts = fullName ? fullName.split(/\s+/) : [];
    const nombre = String(p.nombre ?? parts[0] ?? username ?? `Usuario_${String(p.id).slice(0, 6)}`).trim();
    const apellidos = String(p.apellidos ?? parts.slice(1).join(' ')).trim();
    const city = String(p.city ?? p.ciudad ?? '').trim();
    const province = String(p.province ?? p.provincia ?? city).trim();
    const rawPresence = String(p.presence ?? p.presencia ?? '').trim().toLowerCase();
    const rawStatus = String(p.user_status ?? p.estado ?? '').trim().toLowerCase();
    const presenceSource = rawPresence || (['conectado', 'ausente', 'ocupado', 'invisible'].includes(rawStatus) ? rawStatus : 'conectado');
    const presencia = ['conectado', 'ausente', 'ocupado', 'invisible'].includes(presenceSource)
      ? presenceSource as UserPresence
      : (presenceSource === 'desconectado' ? 'invisible' : 'conectado');
    const gender = String(p.gender ?? p.sexo ?? '').trim().toLowerCase();
    const avatar = String(p.avatar_url ?? p.avatar ?? '').trim();
    const interests = Array.isArray(p.profile_interests)
      ? p.profile_interests.join(', ')
      : String(p.profile_interests ?? p.intereses ?? '').trim();
    return {
      id: String(p.id),
      username: username || undefined,
      full_name: fullName || undefined,
      nombre: nombre || username || 'Usuario',
      apellidos,
      email: String(p.email ?? '').trim(),
      sexo: gender === 'female' || gender === 'mujer' || gender === 'm' ? 'm' : (gender === 'male' || gender === 'hombre' || gender === 'h' ? 'h' : 'otro'),
      fnac: String(p.birth_date ?? p.fnac ?? '').trim(),
      provincia: province,
      ciudad: city || undefined,
      estado: String(p.user_status ?? p.estado ?? '').trim(),
      estadoFecha: p.updated_at ? 'Reciente' : '',
      presencia,
      situacionSentimental: p.relationship_status ?? p.situacion_sentimental ?? 'Soltero/a',
      ocupacion: p.occupation ?? p.ocupacion ?? '',
      intereses,
      musica: p.music ?? p.musica ?? '',
      avatar,
      fechaReg: p.updated_at ? new Date(p.updated_at).toLocaleDateString('es-ES') : 'Reciente',
      online: presencia !== 'invisible' && presenceSource !== 'desconectado',
      ultimoAcceso: p.updated_at ? new Date(p.updated_at).toLocaleString('es-ES') : 'Recientemente',
      chatEstado: presencia === 'invisible' || presenceSource === 'desconectado' ? '0' : '1'
    };
  }, []);

  const fetchSupabaseProfiles = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      console.warn('Supabase profiles: client not configured');
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, city, birth_date, user_status, visibility, profile_interests, updated_at')
      .order('updated_at', { ascending: false, nullsFirst: false });

    if (error) {
      console.warn('Supabase profiles:', error.message);
      return;
    }

    const mapped = Array.isArray(data) ? data.map(mapProfileToUser).filter(user => Boolean(user.id)) : [];
    setUsers(mapped);
  }, [mapProfileToUser]);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    let mounted = true;
    (async () => {
      const { data: { session } } = await supabase!.auth.getSession();
      if (!mounted) return;
      setCurrentUserId(session?.user?.id || '');
      setIsLoggedIn(Boolean(session?.user));
      await fetchSupabaseProfiles();
    })();
    const { data: { subscription } } = supabase!.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      setCurrentUserId(session?.user?.id || '');
      setIsLoggedIn(Boolean(session?.user));
      await fetchSupabaseProfiles();
    });
    const channel = supabase!.channel('profiles-sync').on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
      void fetchSupabaseProfiles();
    }).subscribe();
    return () => { mounted = false; subscription.unsubscribe(); supabase!.removeChannel(channel); };
  }, [fetchSupabaseProfiles]);

  const currentUser = users.find(u => u.id === currentUserId) || EMPTY_USER;
  const noop = useCallback((..._args: any[]) => {}, []);
  const isFriend = useCallback(() => false, []);
  const hasPendingRequest = useCallback(() => false, []);
  const getFriendsOf = useCallback(() => [], []);
  const pushNotification = useCallback((notif: InkoriumNotification) => {
    setNotifications(prev => [notif, ...prev]);
    if (notif.userId === currentUserId) { playNotificationChime(); setToasts(prev => [notif, ...prev].slice(0, 4)); }
  }, [currentUserId]);
  const setActiveTab = useCallback((tab: InkoriumContextType['activeTab']) => setActiveTabState(tab), []);
  const viewUserProfile = useCallback((id: string) => { setSelectedUserId(id); setActiveTabState('perfil'); }, []);
  const viewPhoto = useCallback((id: string | null) => setSelectedPhotoId(id), []);
  const viewAlbum = useCallback((id: string | null) => setSelectedAlbumId(id), []);
  const login = useCallback((_email: string, _password?: string) => ({ success: isLoggedIn }), [isLoggedIn]);
  const loginAsUser = useCallback((id: string) => { setCurrentUserId(id); setIsLoggedIn(true); }, []);
  const logout = useCallback(() => { if (supabase) void supabase.auth.signOut(); setCurrentUserId(''); setIsLoggedIn(false); }, []);
  const setCurrentUser = useCallback((id: string) => setCurrentUserId(id), []);
  const setIsRealtime = useCallback((enabled: boolean) => { setIsRealtimeSimulationEnabledState(enabled); playClickSound(); }, []);

  return (
    <InkoriumContext.Provider value={{
      currentUser, users, photos, albums, feed, wallComments, messages, friendRequests, friendships, chatMessages,
      notifications, toasts, accessLogs, activities, activeChatWindows, activeTab, selectedUserId, selectedPhotoId,
      selectedAlbumId, unreadMessagesCount: 0, unreadNotificationsCount: 0, pendingRequestsCount: 0,
      isRealtimeSimulationEnabled, isLoggedIn, setActiveTab, viewUserProfile, viewPhoto, viewAlbum,
      setCurrentUserById: setCurrentUser, login, loginAsUser, logout,
      publishStatus: noop, updateStatusText: noop, updateUserPresence: noop, likeFeedItem: noop, commentFeedItem: noop,
      postWallComment: noop, deleteWallComment: noop, uploadPhoto: noop, addPhotoTag: noop, removePhotoTag: noop,
      addPhotoComment: noop, likePhoto: noop, setPhotoAsAvatar: noop, deletePhoto: noop, createAlbum: noop,
      renameAlbum: noop, deleteAlbum: noop, sendFriendRequest: noop, acceptFriendRequest: noop, ignoreFriendRequest: noop,
      isFriend, hasPendingRequest, getFriendsOf, sendPrivateMessage: noop, markMessageAsRead: noop, deleteMessage: noop,
      openChatWith: noop, closeChat: noop, toggleMinimizeChat: noop, sendChatMessage: noop, setChatEstado: noop,
      logUserActivity: noop, deleteUserActivity: noop, getUserActivities: getFriendsOf, pushNotification,
      dismissToast: noop, markNotificationAsRead: noop, markAllNotificationsAsRead: noop, deleteNotification: noop,
      setIsRealtimeSimulationEnabled: setIsRealtime, simulateIncomingMessage: noop, simulateWallComment: noop,
      simulateFriendRequest: noop, simulatePhotoInteraction: noop, updateUserData: noop, resetToDefaultData: noop,
      registerNewUser: noop
    }}>
      {children}
    </InkoriumContext.Provider>
  );
};

export const useInkorium = () => {
  const ctx = useContext(InkoriumContext);
  if (!ctx) throw new Error('useInkorium debe usarse dentro de InkoriumProvider');
  return ctx;
};
