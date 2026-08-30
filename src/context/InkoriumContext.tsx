import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { 
  User, Photo, Album, FeedItem, WallComment, PrivateMessage, 
  FriendRequest, Friendship, ChatMessage, InkoriumNotification, AccessLog,
  PhotoTag, UserActivity
} from '../types';
import { 
  INITIAL_USERS, INITIAL_ALBUMS, INITIAL_PHOTOS, INITIAL_FEED, 
  INITIAL_WALL_COMMENTS, INITIAL_FRIENDSHIPS, INITIAL_FRIEND_REQUESTS, 
  INITIAL_MESSAGES, INITIAL_NOTIFICATIONS, INITIAL_ACCESS_LOGS, INITIAL_ACTIVITIES
} from '../data/mockData';
import { playMessageSound, playSuccessSound, playClickSound, playNotificationChime } from '../utils/sound';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import confetti from 'canvas-confetti';

interface ChatWindow {
  targetUserId: string;
  minimized: boolean;
}

interface InkoriumContextType {
  currentUser: User;
  users: User[];
  photos: Photo[];
  albums: Album[];
  feed: FeedItem[];
  wallComments: WallComment[];
  messages: PrivateMessage[];
  friendRequests: FriendRequest[];
  friendships: Friendship[];
  chatMessages: ChatMessage[];
  notifications: InkoriumNotification[];
  toasts: InkoriumNotification[];
  accessLogs: AccessLog[];
  activities: UserActivity[];
  activeChatWindows: ChatWindow[];
  activeTab: 'inicio' | 'perfil' | 'gente' | 'fotos' | 'mensajes' | 'ajustes';
  selectedUserId: string; // for viewing other user's profiles
  selectedPhotoId: string | null; // for modal photo viewer
  selectedAlbumId: string | null;
  unreadMessagesCount: number;
  unreadNotificationsCount: number;
  pendingRequestsCount: number;
  isRealtimeSimulationEnabled: boolean;
  isLoggedIn: boolean;
  
  // Actions
  setActiveTab: (tab: 'inicio' | 'perfil' | 'gente' | 'fotos' | 'mensajes' | 'ajustes') => void;
  viewUserProfile: (userId: string) => void;
  viewPhoto: (photoId: string | null) => void;
  viewAlbum: (albumId: string | null) => void;
  setCurrentUserById: (userId: string) => void;
  login: (email: string, password?: string) => { success: boolean; error?: string };
  loginAsUser: (userId: string) => void;
  logout: () => void;
  
  // Feed & Status
  publishStatus: (statusText: string, attachedPhotoUrl?: string) => void;
  likeFeedItem: (feedId: string) => void;
  commentFeedItem: (feedId: string, text: string) => void;
  
  // Wall
  postWallComment: (receptorId: string, text: string) => void;
  deleteWallComment: (commentId: string) => void;
  
  // Photos & Albums
  uploadPhoto: (titulo: string, albumId: string | null, archivoUrl: string) => void;
  addPhotoTag: (photoId: string, targetUserId: string, x: number, y: number) => void;
  removePhotoTag: (photoId: string, tagId: string) => void;
  addPhotoComment: (photoId: string, comentario: string) => void;
  likePhoto: (photoId: string) => void;
  setPhotoAsAvatar: (photoId: string) => void;
  deletePhoto: (photoId: string) => void;
  createAlbum: (nombre: string, descripcion?: string) => void;
  renameAlbum: (albumId: string, nuevoNombre: string) => void;
  deleteAlbum: (albumId: string) => void;
  
  // Friends & Requests
  sendFriendRequest: (targetUserId: string) => void;
  acceptFriendRequest: (requestId: string) => void;
  ignoreFriendRequest: (requestId: string) => void;
  isFriend: (userId1: string, userId2: string) => boolean;
  hasPendingRequest: (fromId: string, toId: string) => boolean;
  getFriendsOf: (userId: string) => User[];
  
  // Messages
  sendPrivateMessage: (receptorId: string, asunto: string, mensaje: string) => void;
  markMessageAsRead: (messageId: string) => void;
  deleteMessage: (messageId: string) => void;
  
  // Chat
  openChatWith: (targetUserId: string) => void;
  closeChat: (targetUserId: string) => void;
  toggleMinimizeChat: (targetUserId: string) => void;
  sendChatMessage: (targetUserId: string, text: string) => void;
  setChatEstado: (estado: '1' | '0') => void;
  
  // Activity Log
  logUserActivity: (activity: Omit<UserActivity, 'id' | 'timestamp'>) => void;
  deleteUserActivity: (activityId: string) => void;
  getUserActivities: (userId: string) => UserActivity[];
  
  // Notifications & Settings
  pushNotification: (notif: InkoriumNotification) => void;
  dismissToast: (toastId: string) => void;
  markNotificationAsRead: (notifId: string) => void;
  markAllNotificationsAsRead: () => void;
  deleteNotification: (notifId: string) => void;
  setIsRealtimeSimulationEnabled: (enabled: boolean) => void;
  simulateIncomingMessage: () => void;
  simulateWallComment: () => void;
  simulateFriendRequest: () => void;
  simulatePhotoInteraction: () => void;
  updateUserData: (data: Partial<User>) => void;
  resetToDefaultData: () => void;
  registerNewUser: (nombre: string, apellidos: string, email: string, sexo: 'h' | 'm', provincia: string, fnac: string) => void;
}

const InkoriumContext = createContext<InkoriumContextType | undefined>(undefined);

const STORAGE_PREFIX = 'inkorium_clean_v2_';

const DEFAULT_EMPTY_USER: User = {
  id: '',
  nombre: '',
  apellidos: '',
  email: '',
  sexo: 'h',
  fnac: '2000-01-01',
  provincia: 'Madrid',
  ciudad: 'Madrid',
  estado: '',
  estadoFecha: '',
  situacionSentimental: 'Soltero/a',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
  fechaReg: new Date().toLocaleDateString('es-ES'),
  online: true,
  ultimoAcceso: 'Ahora mismo',
  chatEstado: '1'
};

export const InkoriumProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // LocalStorage loader
  const load = <T,>(key: string, fallback: T): T => {
    if (typeof window === 'undefined') return fallback;
    try {
      const item = localStorage.getItem(STORAGE_PREFIX + key);
      return item ? JSON.parse(item) : fallback;
    } catch {
      return fallback;
    }
  };

  const save = (key: string, value: unknown) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
      } catch {
        // quota exceeded or storage error
      }
    }
  };

  const [users, setUsers] = useState<User[]>(() => {
    const cached = load<User[]>('users', []);
    return Array.isArray(cached) ? cached : [];
  });
  const [currentUserId, setCurrentUserId] = useState<string>(() => load('currentUserId', ''));
  const [photos, setPhotos] = useState<Photo[]>(() => load('photos', []));
  const [albums, setAlbums] = useState<Album[]>(() => load('albums', []));
  const [feed, setFeed] = useState<FeedItem[]>(() => load('feed', []));
  const [wallComments, setWallComments] = useState<WallComment[]>(() => load('wallComments', []));
  const [messages, setMessages] = useState<PrivateMessage[]>(() => load('messages', []));
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>(() => load('friendRequests', []));
  const [friendships, setFriendships] = useState<Friendship[]>(() => load('friendships', []));
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => load('chatMessages', []));
  const [notifications, setNotifications] = useState<InkoriumNotification[]>(() => load('notifications', []));
  const [toasts, setToasts] = useState<InkoriumNotification[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>(() => load('accessLogs', []));
  const [activities, setActivities] = useState<UserActivity[]>(() => load('activities', []));
  const [isRealtimeSimulationEnabled, setIsRealtimeSimulationEnabledState] = useState<boolean>(() => false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => load('isLoggedIn', false));

  const [activeTab, setActiveTabState] = useState<'inicio' | 'perfil' | 'gente' | 'fotos' | 'mensajes' | 'ajustes'>('inicio');
  const [selectedUserId, setSelectedUserId] = useState<string>(currentUserId);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [activeChatWindows, setActiveChatWindows] = useState<ChatWindow[]>([]);

  // Helper to map Supabase profiles row to Inkorium User
  const mapProfileToUser = useCallback((p: any): User => {
    const username = (p.username || '').trim();
    const fullName = (p.full_name || p.nombre || p.name || '').trim();
    
    let nombre = '';
    let apellidos = '';
    
    if (fullName) {
      const parts = fullName.split(/\s+/);
      nombre = parts[0] || '';
      apellidos = parts.slice(1).join(' ') || '';
    } else if (username) {
      nombre = username;
      apellidos = '';
    } else {
      const shortId = p.id ? p.id.substring(0, 6) : 'anon';
      nombre = `Usuario_${shortId}`;
      apellidos = '';
    }

    const avatar = p.avatar_url || p.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80';
    const rawCity = (p.city || p.ciudad || p.provincia || '').trim();
    const provincia = rawCity || 'España';
    const ciudad = rawCity || undefined;
    const estado = (p.user_status || p.status || p.estado || '').trim();
    const fnac = p.birth_date || p.fnac || '2000-01-01';
    const fechaReg = p.created_at 
      ? new Date(p.created_at).toLocaleDateString('es-ES') 
      : (p.updated_at ? new Date(p.updated_at).toLocaleDateString('es-ES') : 'Reciente');

    return {
      id: p.id,
      username: username || undefined,
      full_name: fullName || undefined,
      nombre,
      apellidos,
      email: p.email || (username ? `${username}@inkorium.es` : ''),
      sexo: p.sexo === 'm' || p.gender === 'm' || p.gender === 'female' ? 'm' : (p.sexo === 'otro' ? 'otro' : 'h'),
      fnac,
      provincia,
      ciudad,
      estado,
      estadoFecha: p.updated_at ? 'Reciente' : '',
      situacionSentimental: p.relationship_status || p.situacion_sentimental || 'Soltero/a',
      ocupacion: p.occupation || p.ocupacion || '',
      intereses: p.profile_interests || p.intereses || '',
      musica: p.music || p.musica || '',
      avatar,
      fechaReg,
      online: Boolean(p.online !== false),
      ultimoAcceso: p.ultimo_acceso || 'Recientemente',
      chatEstado: p.chat_estado || '1'
    };
  }, []);

  // Function to refresh users from Supabase profiles
  const fetchSupabaseProfiles = useCallback(async (currentAuthUser?: User) => {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) {
        console.warn('Error fetching Supabase profiles:', error.message);
        return;
      }
      if (data && Array.isArray(data)) {
        const mappedUsers: User[] = data.map(p => mapProfileToUser(p));

        setUsers(prev => {
          const list = [...mappedUsers];
          // Ensure current user is in list if not yet returned by profiles
          if (currentAuthUser && !list.find(u => u.id === currentAuthUser.id || (currentAuthUser.email && u.email === currentAuthUser.email))) {
            list.unshift(currentAuthUser);
          }
          return list;
        });
      }
    } catch (err) {
      console.warn('Error connecting to Supabase profiles:', err);
    }
  }, [mapProfileToUser]);

  // Listen to Supabase auth session changes & sync user profiles
  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      // 1. Fetch current session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const userMeta = session.user.user_metadata || {};
          const supaUser: User = {
            id: session.user.id,
            nombre: userMeta.nombre || session.user.email?.split('@')[0] || 'Usuario',
            apellidos: userMeta.apellidos || '',
            email: session.user.email || '',
            sexo: userMeta.sexo || 'h',
            fnac: userMeta.fnac || '2000-01-01',
            provincia: userMeta.provincia || 'Madrid',
            ciudad: userMeta.ciudad || userMeta.provincia || 'Madrid',
            estado: userMeta.estado || '¡Hola a todos en Inkorium!',
            estadoFecha: 'Ahora mismo',
            situacionSentimental: userMeta.situacionSentimental || 'Soltero/a',
            avatar: userMeta.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
            fechaReg: new Date(session.user.created_at || Date.now()).toLocaleDateString('es-ES'),
            online: true,
            ultimoAcceso: 'Ahora mismo',
            chatEstado: '1'
          };

          setUsers(prev => {
            const exists = prev.find(u => u.id === supaUser.id || u.email === supaUser.email);
            if (exists) {
              return prev.map(u => (u.id === supaUser.id || u.email === supaUser.email) ? { ...u, ...supaUser } : u);
            }
            return [supaUser, ...prev];
          });

          setCurrentUserId(supaUser.id);
          setSelectedUserId(supaUser.id);
          setIsLoggedIn(true);

          // Fetch all profiles
          fetchSupabaseProfiles(supaUser);
        } else {
          // If no active session in Supabase, ensure logged in state respects it
          if (!load('isLoggedIn', false)) {
            setIsLoggedIn(false);
          }
          fetchSupabaseProfiles();
        }
      });

      // 2. Real-time profiles subscription
      const profilesChannel = supabase
        .channel('public:profiles')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
          fetchSupabaseProfiles();
        })
        .subscribe();

      // 3. Auth State Change Listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const userMeta = session.user.user_metadata || {};
          const supaUser: User = {
            id: session.user.id,
            nombre: userMeta.nombre || session.user.email?.split('@')[0] || 'Usuario',
            apellidos: userMeta.apellidos || '',
            email: session.user.email || '',
            sexo: userMeta.sexo || 'h',
            fnac: userMeta.fnac || '2000-01-01',
            provincia: userMeta.provincia || 'Madrid',
            ciudad: userMeta.ciudad || userMeta.provincia || 'Madrid',
            estado: userMeta.estado || '¡Hola a todos en Inkorium!',
            estadoFecha: 'Ahora mismo',
            situacionSentimental: userMeta.situacionSentimental || 'Soltero/a',
            avatar: userMeta.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
            fechaReg: new Date(session.user.created_at || Date.now()).toLocaleDateString('es-ES'),
            online: true,
            ultimoAcceso: 'Ahora mismo',
            chatEstado: '1'
          };

          setUsers(prev => {
            const exists = prev.find(u => u.id === supaUser.id || u.email === supaUser.email);
            if (exists) {
              return prev.map(u => (u.id === supaUser.id || u.email === supaUser.email) ? { ...u, ...supaUser } : u);
            }
            return [supaUser, ...prev];
          });

          setCurrentUserId(supaUser.id);
          setSelectedUserId(supaUser.id);
          setIsLoggedIn(true);
          fetchSupabaseProfiles(supaUser);
        } else {
          setIsLoggedIn(false);
          setCurrentUserId('');
        }
      });

      return () => {
        subscription.unsubscribe();
        supabase?.removeChannel(profilesChannel);
      };
    }
  }, [fetchSupabaseProfiles]);

  // Sync to local storage
  useEffect(() => save('users', users), [users]);
  useEffect(() => save('currentUserId', currentUserId), [currentUserId]);
  useEffect(() => save('photos', photos), [photos]);
  useEffect(() => save('albums', albums), [albums]);
  useEffect(() => save('feed', feed), [feed]);
  useEffect(() => save('wallComments', wallComments), [wallComments]);
  useEffect(() => save('messages', messages), [messages]);
  useEffect(() => save('friendRequests', friendRequests), [friendRequests]);
  useEffect(() => save('friendships', friendships), [friendships]);
  useEffect(() => save('chatMessages', chatMessages), [chatMessages]);
  useEffect(() => save('notifications', notifications), [notifications]);
  useEffect(() => save('accessLogs', accessLogs), [accessLogs]);
  useEffect(() => save('activities', activities), [activities]);
  useEffect(() => save('isLoggedIn', isLoggedIn), [isLoggedIn]);

  const currentUser = users.find(u => u.id === currentUserId) || users[0] || DEFAULT_EMPTY_USER;

  const unreadMessagesCount = messages.filter(m => m.receptorId === currentUser.id && !m.leido).length;
  const unreadNotificationsCount = notifications.filter(n => n.userId === currentUser.id && !n.leido).length;
  const pendingRequestsCount = friendRequests.filter(r => r.receptorId === currentUser.id && r.estado === 'pendiente').length;

  // Real-time title update with unread badges
  useEffect(() => {
    const total = unreadMessagesCount + unreadNotificationsCount + pendingRequestsCount;
    if (typeof document !== 'undefined') {
      if (total > 0) {
        document.title = `(${total}) Inkorium - Tu Red Social Retro`;
      } else {
        document.title = 'Inkorium - Tu Red Social Retro';
      }
    }
  }, [unreadMessagesCount, unreadNotificationsCount, pendingRequestsCount]);

  const setIsRealtimeSimulationEnabled = useCallback((enabled: boolean) => {
    setIsRealtimeSimulationEnabledState(enabled);
    playClickSound();
  }, []);

  const pushNotification = useCallback((notif: InkoriumNotification) => {
    setNotifications(prev => [notif, ...prev]);
    if (notif.userId === currentUserId) {
      playNotificationChime();
      setToasts(prev => [notif, ...prev.filter(t => t.id !== notif.id).slice(0, 3)]);
    }
  }, [currentUserId]);

  const dismissToast = useCallback((toastId: string) => {
    setToasts(prev => prev.filter(t => t.id !== toastId));
  }, []);

  const deleteNotification = useCallback((notifId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notifId));
    setToasts(prev => prev.filter(t => t.id !== notifId));
    playClickSound();
  }, []);

  const setActiveTab = useCallback((tab: 'inicio' | 'perfil' | 'gente' | 'fotos' | 'mensajes' | 'ajustes') => {
    playClickSound();
    setActiveTabState(tab);
    if (tab === 'perfil') {
      setSelectedUserId(currentUserId);
    }
  }, [currentUserId]);

  const viewUserProfile = useCallback((userId: string) => {
    playClickSound();
    setSelectedUserId(userId);
    setActiveTabState('perfil');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const viewPhoto = useCallback((photoId: string | null) => {
    setSelectedPhotoId(photoId);
  }, []);

  const viewAlbum = useCallback((albumId: string | null) => {
    setSelectedAlbumId(albumId);
    setActiveTabState('fotos');
  }, []);

  const setCurrentUserById = useCallback((userId: string) => {
    const u = users.find(user => user.id === userId);
    if (u) {
      setCurrentUserId(userId);
      setSelectedUserId(userId);
      setIsLoggedIn(true);
      playSuccessSound();
    }
  }, [users]);

  const login = useCallback((email: string, _password?: string) => {
    const trimmedEmail = email.trim().toLowerCase();
    const user = users.find(u => u.email.toLowerCase() === trimmedEmail);
    if (user) {
      setCurrentUserId(user.id);
      setSelectedUserId(user.id);
      setIsLoggedIn(true);
      setActiveTabState('inicio');
      playSuccessSound();
      return { success: true };
    }
    return { 
      success: false, 
      error: 'El correo electrónico no coincide con ninguna cuenta registrada.' 
    };
  }, [users]);

  const loginAsUser = useCallback((userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setCurrentUserId(user.id);
      setSelectedUserId(user.id);
      setIsLoggedIn(true);
      setActiveTabState('inicio');
      playSuccessSound();
    }
  }, [users]);

  const logout = useCallback(() => {
    setIsLoggedIn(false);
    playClickSound();
  }, []);

  // Friendship checks
  const isFriend = useCallback((userId1: string, userId2: string) => {
    if (userId1 === userId2) return true;
    return friendships.some(
      f => (f.user1 === userId1 && f.user2 === userId2) || (f.user1 === userId2 && f.user2 === userId1)
    );
  }, [friendships]);

  const hasPendingRequest = useCallback((fromId: string, toId: string) => {
    return friendRequests.some(
      r => r.emisorId === fromId && r.receptorId === toId && r.estado === 'pendiente'
    );
  }, [friendRequests]);

  const getFriendsOf = useCallback((userId: string): User[] => {
    const friendIds = friendships
      .filter(f => f.user1 === userId || f.user2 === userId)
      .map(f => (f.user1 === userId ? f.user2 : f.user1));
    return users.filter(u => friendIds.includes(u.id));
  }, [friendships, users]);

  // Activity Log Handlers
  const logUserActivity = useCallback((activityData: Omit<UserActivity, 'id' | 'timestamp'>) => {
    const newActivity: UserActivity = {
      ...activityData,
      id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: Date.now()
    };
    setActivities(prev => [newActivity, ...prev]);
  }, []);

  const deleteUserActivity = useCallback((activityId: string) => {
    setActivities(prev => prev.filter(a => a.id !== activityId));
    playClickSound();
  }, []);

  const getUserActivities = useCallback((userId: string): UserActivity[] => {
    return activities
      .filter(a => a.userId === userId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [activities]);

  // Feed & Status
  const publishStatus = useCallback((statusText: string, attachedPhotoUrl?: string) => {
    if (!statusText.trim() && !attachedPhotoUrl) return;

    // Update user status
    setUsers(prev => prev.map(u => {
      if (u.id === currentUser.id) {
        return {
          ...u,
          estado: statusText.trim() || u.estado,
          estadoFecha: 'Ahora mismo'
        };
      }
      return u;
    }));

    // Add to feed
    const newFeedItem: FeedItem = {
      id: `feed_${Date.now()}`,
      tipo: attachedPhotoUrl ? 'foto' : 'estado',
      propietarioId: currentUser.id,
      propietarioNombre: `${currentUser.nombre} ${currentUser.apellidos}`,
      propietarioAvatar: currentUser.avatar,
      datos: statusText.trim(),
      fotoUrl: attachedPhotoUrl,
      fecha: 'Ahora mismo',
      likes: [],
      comentarios: []
    };

    setFeed(prev => [newFeedItem, ...prev]);

    // Log Activity
    logUserActivity({
      userId: currentUser.id,
      userName: `${currentUser.nombre} ${currentUser.apellidos}`,
      userAvatar: currentUser.avatar,
      type: 'status_update',
      title: 'ha actualizado su estado',
      detail: statusText.trim(),
      date: 'Ahora mismo'
    });

    playSuccessSound();
  }, [currentUser, logUserActivity]);

  const likeFeedItem = useCallback((feedId: string) => {
    playClickSound();
    setFeed(prev => prev.map(item => {
      if (item.id === feedId) {
        const hasLiked = item.likes.includes(currentUser.id);
        const newLikes = hasLiked
          ? item.likes.filter(id => id !== currentUser.id)
          : [...item.likes, currentUser.id];
        return { ...item, likes: newLikes };
      }
      return item;
    }));
  }, [currentUser.id]);

  const commentFeedItem = useCallback((feedId: string, text: string) => {
    if (!text.trim()) return;
    playClickSound();
    setFeed(prev => prev.map(item => {
      if (item.id === feedId) {
        const newComment = {
          id: `fcom_${Date.now()}`,
          userId: currentUser.id,
          nombre: `${currentUser.nombre} ${currentUser.apellidos}`,
          avatar: currentUser.avatar,
          texto: text.trim(),
          fecha: 'Ahora mismo'
        };
        return { ...item, comentarios: [...item.comentarios, newComment] };
      }
      return item;
    }));
  }, [currentUser]);

  // Wall
  const postWallComment = useCallback((receptorId: string, text: string) => {
    if (!text.trim()) return;
    playSuccessSound();

    const newWallComment: WallComment = {
      id: `wall_${Date.now()}`,
      emisorId: currentUser.id,
      emisorNombre: `${currentUser.nombre} ${currentUser.apellidos}`,
      emisorAvatar: currentUser.avatar,
      receptorId,
      comentario: text.trim(),
      fecha: 'Hoy a las ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setWallComments(prev => [newWallComment, ...prev]);

    // Feed event & Activity if written on someone else's wall
    if (receptorId !== currentUser.id) {
      const recipient = users.find(u => u.id === receptorId);
      if (recipient) {
        const feedItem: FeedItem = {
          id: `feed_${Date.now()}`,
          tipo: 'tablon',
          propietarioId: receptorId,
          propietarioNombre: `${recipient.nombre} ${recipient.apellidos}`,
          propietarioAvatar: recipient.avatar,
          visitanteId: currentUser.id,
          visitanteNombre: `${currentUser.nombre} ${currentUser.apellidos}`,
          visitanteAvatar: currentUser.avatar,
          datos: text.trim(),
          fecha: 'Ahora mismo',
          likes: [],
          comentarios: []
        };
        setFeed(prev => [feedItem, ...prev]);

        // Log Activity for current user
        logUserActivity({
          userId: currentUser.id,
          userName: `${currentUser.nombre} ${currentUser.apellidos}`,
          userAvatar: currentUser.avatar,
          type: 'wall_post',
          title: 'ha firmado en el tablón de',
          targetUserId: recipient.id,
          targetUserName: `${recipient.nombre} ${recipient.apellidos}`,
          targetUserAvatar: recipient.avatar,
          detail: text.trim(),
          date: 'Ahora mismo'
        });

        // Send notification to recipient
        const notif: InkoriumNotification = {
          id: `notif_${Date.now()}`,
          userId: receptorId,
          fromUserId: currentUser.id,
          fromUserName: `${currentUser.nombre} ${currentUser.apellidos}`,
          fromUserAvatar: currentUser.avatar,
          tipo: 'tablon',
          mensaje: `${currentUser.nombre} ${currentUser.apellidos} ha firmado en tu tablón.`,
          detalle: text.trim(),
          targetId: newWallComment.id,
          enlace: 'perfil',
          leido: false,
          fecha: 'Ahora mismo'
        };
        pushNotification(notif);
      }
    }
  }, [currentUser, users, pushNotification, logUserActivity]);

  const deleteWallComment = useCallback((commentId: string) => {
    setWallComments(prev => prev.filter(c => c.id !== commentId));
    playClickSound();
  }, []);

  // Photos & Albums
  const uploadPhoto = useCallback((titulo: string, albumId: string | null, archivoUrl: string) => {
    if (!archivoUrl) return;
    playSuccessSound();

    const targetAlbum = albums.find(a => a.id === albumId);
    const newPhoto: Photo = {
      id: `photo_${Date.now()}`,
      uploaderId: currentUser.id,
      uploaderName: `${currentUser.nombre} ${currentUser.apellidos}`,
      albumId: albumId || null,
      albumName: targetAlbum?.nombre,
      archivo: archivoUrl,
      titulo: titulo.trim() || 'Sin título',
      fecha: 'Hoy a las ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      likes: [],
      etiquetas: [],
      comentarios: []
    };

    setPhotos(prev => [newPhoto, ...prev]);

    // Feed event
    const feedItem: FeedItem = {
      id: `feed_${Date.now()}`,
      tipo: 'foto',
      propietarioId: currentUser.id,
      propietarioNombre: `${currentUser.nombre} ${currentUser.apellidos}`,
      propietarioAvatar: currentUser.avatar,
      datos: titulo.trim() || 'Nueva foto subida',
      fotoUrl: archivoUrl,
      fotoId: newPhoto.id,
      albumId: albumId || undefined,
      fecha: 'Ahora mismo',
      likes: [],
      comentarios: []
    };
    setFeed(prev => [feedItem, ...prev]);

    // Log user activity
    logUserActivity({
      userId: currentUser.id,
      userName: `${currentUser.nombre} ${currentUser.apellidos}`,
      userAvatar: currentUser.avatar,
      type: 'photo_upload',
      title: 'ha subido una nueva foto',
      detail: titulo.trim() || 'Foto subida',
      targetPhotoId: newPhoto.id,
      targetPhotoUrl: archivoUrl,
      targetAlbumId: albumId || undefined,
      targetAlbumName: targetAlbum?.nombre,
      date: 'Ahora mismo'
    });
  }, [currentUser, albums, logUserActivity]);

  const addPhotoTag = useCallback((photoId: string, targetUserId: string, x: number, y: number) => {
    const targetUser = users.find(u => u.id === targetUserId);
    if (!targetUser) return;

    const newTag: PhotoTag = {
      id: `tag_${Date.now()}`,
      photoId,
      userId: targetUserId,
      userName: `${targetUser.nombre} ${targetUser.apellidos}`,
      x: Math.round(x),
      y: Math.round(y)
    };

    setPhotos(prev => prev.map(p => {
      if (p.id === photoId) {
        return {
          ...p,
          etiquetas: [...p.etiquetas.filter(t => t.userId !== targetUserId), newTag]
        };
      }
      return p;
    }));

    playSuccessSound();

    // Notify tagged user
    if (targetUserId !== currentUser.id) {
      const notif: InkoriumNotification = {
        id: `notif_${Date.now()}`,
        userId: targetUserId,
        fromUserId: currentUser.id,
        fromUserName: `${currentUser.nombre} ${currentUser.apellidos}`,
        fromUserAvatar: currentUser.avatar,
        tipo: 'etiqueta',
        mensaje: `${currentUser.nombre} ${currentUser.apellidos} te ha etiquetado en una foto.`,
        targetId: photoId,
        enlace: 'fotos',
        leido: false,
        fecha: 'Ahora mismo'
      };
      pushNotification(notif);
    }
  }, [users, currentUser, pushNotification]);

  const removePhotoTag = useCallback((photoId: string, tagId: string) => {
    setPhotos(prev => prev.map(p => {
      if (p.id === photoId) {
        return {
          ...p,
          etiquetas: p.etiquetas.filter(t => t.id !== tagId)
        };
      }
      return p;
    }));
  }, []);

  const addPhotoComment = useCallback((photoId: string, comentario: string) => {
    if (!comentario.trim()) return;
    playClickSound();

    const newComment = {
      id: `pcom_${Date.now()}`,
      photoId,
      userId: currentUser.id,
      nombre: `${currentUser.nombre} ${currentUser.apellidos}`,
      avatar: currentUser.avatar,
      comentario: comentario.trim(),
      fecha: 'Hoy a las ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setPhotos(prev => prev.map(p => {
      if (p.id === photoId) {
        // notify photo owner if not me
        if (p.uploaderId !== currentUser.id) {
          const notif: InkoriumNotification = {
            id: `notif_${Date.now()}`,
            userId: p.uploaderId,
            fromUserId: currentUser.id,
            fromUserName: `${currentUser.nombre} ${currentUser.apellidos}`,
            fromUserAvatar: currentUser.avatar,
            tipo: 'foto',
            mensaje: `${currentUser.nombre} ${currentUser.apellidos} ha comentado tu foto "${p.titulo}".`,
            detalle: comentario.trim(),
            targetId: photoId,
            enlace: 'fotos',
            leido: false,
            fecha: 'Ahora mismo'
          };
          pushNotification(notif);
        }

        // Log Activity
        logUserActivity({
          userId: currentUser.id,
          userName: `${currentUser.nombre} ${currentUser.apellidos}`,
          userAvatar: currentUser.avatar,
          type: 'photo_comment',
          title: `ha comentado en la foto "${p.titulo}"`,
          detail: comentario.trim(),
          targetPhotoId: photoId,
          targetPhotoUrl: p.archivo,
          date: 'Ahora mismo'
        });

        return { ...p, comentarios: [...p.comentarios, newComment] };
      }
      return p;
    }));
  }, [currentUser, pushNotification, logUserActivity]);

  const likePhoto = useCallback((photoId: string) => {
    playClickSound();
    setPhotos(prev => prev.map(p => {
      if (p.id === photoId) {
        const hasLiked = p.likes.includes(currentUser.id);
        const newLikes = hasLiked
          ? p.likes.filter(id => id !== currentUser.id)
          : [...p.likes, currentUser.id];
        return { ...p, likes: newLikes };
      }
      return p;
    }));
  }, [currentUser.id]);

  const setPhotoAsAvatar = useCallback((photoId: string) => {
    const photo = photos.find(p => p.id === photoId);
    if (!photo) return;

    setUsers(prev => prev.map(u => {
      if (u.id === currentUser.id) {
        return { ...u, avatar: photo.archivo };
      }
      return u;
    }));

    // Log Activity for avatar change
    logUserActivity({
      userId: currentUser.id,
      userName: `${currentUser.nombre} ${currentUser.apellidos}`,
      userAvatar: photo.archivo,
      type: 'avatar_change',
      title: 'ha cambiado su foto de perfil',
      targetPhotoId: photo.id,
      targetPhotoUrl: photo.archivo,
      date: 'Ahora mismo'
    });

    playSuccessSound();
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
  }, [photos, currentUser, logUserActivity]);

  const deletePhoto = useCallback((photoId: string) => {
    setPhotos(prev => prev.filter(p => p.id !== photoId));
    if (selectedPhotoId === photoId) {
      setSelectedPhotoId(null);
    }
    playClickSound();
  }, [selectedPhotoId]);

  const createAlbum = useCallback((nombre: string, descripcion?: string) => {
    if (!nombre.trim()) return;
    const newAlbum: Album = {
      id: `alb_${Date.now()}`,
      userId: currentUser.id,
      nombre: nombre.trim(),
      descripcion: descripcion?.trim(),
      fecha: new Date().toLocaleDateString('es-ES')
    };
    setAlbums(prev => [...prev, newAlbum]);

    // Log Activity for album creation
    logUserActivity({
      userId: currentUser.id,
      userName: `${currentUser.nombre} ${currentUser.apellidos}`,
      userAvatar: currentUser.avatar,
      type: 'album_created',
      title: 'ha creado el álbum',
      targetAlbumId: newAlbum.id,
      targetAlbumName: nombre.trim(),
      detail: descripcion?.trim(),
      date: 'Ahora mismo'
    });

    playSuccessSound();
  }, [currentUser, logUserActivity]);

  const renameAlbum = useCallback((albumId: string, nuevoNombre: string) => {
    if (!nuevoNombre.trim()) return;
    setAlbums(prev => prev.map(a => a.id === albumId ? { ...a, nombre: nuevoNombre.trim() } : a));
    playClickSound();
  }, []);

  const deleteAlbum = useCallback((albumId: string) => {
    setAlbums(prev => prev.filter(a => a.id !== albumId));
    // move photos in album to unassigned
    setPhotos(prev => prev.map(p => p.albumId === albumId ? { ...p, albumId: null, albumName: undefined } : p));
    playClickSound();
  }, []);

  // Friends & Requests
  const sendFriendRequest = useCallback((targetUserId: string) => {
    if (targetUserId === currentUser.id) return;
    if (isFriend(currentUser.id, targetUserId)) return;
    if (hasPendingRequest(currentUser.id, targetUserId)) return;

    const newRequest: FriendRequest = {
      id: `freq_${Date.now()}`,
      emisorId: currentUser.id,
      emisorNombre: `${currentUser.nombre} ${currentUser.apellidos}`,
      emisorAvatar: currentUser.avatar,
      emisorProvincia: currentUser.provincia,
      receptorId: targetUserId,
      fecha: 'Ahora mismo',
      estado: 'pendiente'
    };

    setFriendRequests(prev => [...prev, newRequest]);
    playSuccessSound();

    // Add notification for receiver
    const notif: InkoriumNotification = {
      id: `notif_${Date.now()}`,
      userId: targetUserId,
      fromUserId: currentUser.id,
      fromUserName: `${currentUser.nombre} ${currentUser.apellidos}`,
      fromUserAvatar: currentUser.avatar,
      tipo: 'peticion',
      mensaje: `${currentUser.nombre} ${currentUser.apellidos} te ha enviado una petición de amistad.`,
      targetId: newRequest.id,
      enlace: 'ajustes',
      leido: false,
      fecha: 'Ahora mismo'
    };
    pushNotification(notif);
  }, [currentUser, isFriend, hasPendingRequest, pushNotification]);

  const acceptFriendRequest = useCallback((requestId: string) => {
    const req = friendRequests.find(r => r.id === requestId);
    if (!req) return;

    setFriendRequests(prev => prev.map(r => r.id === requestId ? { ...r, estado: 'aceptada' } : r));

    const newFriendship: Friendship = {
      id: `fr_${Date.now()}`,
      user1: req.emisorId,
      user2: req.receptorId,
      fecha: new Date().toISOString().split('T')[0]
    };

    setFriendships(prev => [...prev, newFriendship]);
    playSuccessSound();
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });

    // Feed event
    const sender = users.find(u => u.id === req.emisorId);
    if (sender) {
      const feedItem: FeedItem = {
        id: `feed_${Date.now()}`,
        tipo: 'amistad',
        propietarioId: currentUser.id,
        propietarioNombre: `${currentUser.nombre} ${currentUser.apellidos}`,
        propietarioAvatar: currentUser.avatar,
        visitanteId: sender.id,
        visitanteNombre: `${sender.nombre} ${sender.apellidos}`,
        visitanteAvatar: sender.avatar,
        fecha: 'Ahora mismo',
        likes: [],
        comentarios: []
      };
      setFeed(prev => [feedItem, ...prev]);

      // Log activity for both users
      logUserActivity({
        userId: currentUser.id,
        userName: `${currentUser.nombre} ${currentUser.apellidos}`,
        userAvatar: currentUser.avatar,
        type: 'friend_added',
        title: 'ahora es amigo de',
        targetUserId: sender.id,
        targetUserName: `${sender.nombre} ${sender.apellidos}`,
        targetUserAvatar: sender.avatar,
        date: 'Ahora mismo'
      });

      logUserActivity({
        userId: sender.id,
        userName: `${sender.nombre} ${sender.apellidos}`,
        userAvatar: sender.avatar,
        type: 'friend_added',
        title: 'ahora es amigo de',
        targetUserId: currentUser.id,
        targetUserName: `${currentUser.nombre} ${currentUser.apellidos}`,
        targetUserAvatar: currentUser.avatar,
        date: 'Ahora mismo'
      });
    }
  }, [friendRequests, currentUser, users, logUserActivity]);

  const ignoreFriendRequest = useCallback((requestId: string) => {
    setFriendRequests(prev => prev.map(r => r.id === requestId ? { ...r, estado: 'ignorada' } : r));
    playClickSound();
  }, []);

  // Messages
  const sendPrivateMessage = useCallback((receptorId: string, asunto: string, mensaje: string) => {
    if (!mensaje.trim()) return;
    const recipient = users.find(u => u.id === receptorId);
    if (!recipient) return;

    const newMsg: PrivateMessage = {
      id: `mp_${Date.now()}`,
      emisorId: currentUser.id,
      emisorNombre: `${currentUser.nombre} ${currentUser.apellidos}`,
      emisorAvatar: currentUser.avatar,
      receptorId,
      receptorNombre: `${recipient.nombre} ${recipient.apellidos}`,
      asunto: asunto.trim() || 'Sin asunto',
      mensaje: mensaje.trim(),
      fecha: 'Hoy a las ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      leido: false
    };

    setMessages(prev => [newMsg, ...prev]);
    playSuccessSound();

    // Notify receiver
    const notif: InkoriumNotification = {
      id: `notif_${Date.now()}`,
      userId: receptorId,
      fromUserId: currentUser.id,
      fromUserName: `${currentUser.nombre} ${currentUser.apellidos}`,
      fromUserAvatar: currentUser.avatar,
      tipo: 'mp',
      mensaje: `Tienes un nuevo mensaje privado de ${currentUser.nombre} ${currentUser.apellidos}.`,
      detalle: mensaje.trim(),
      targetId: newMsg.id,
      enlace: 'mensajes',
      leido: false,
      fecha: 'Ahora mismo'
    };
    pushNotification(notif);
  }, [currentUser, users, pushNotification]);

  const markMessageAsRead = useCallback((messageId: string) => {
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, leido: true } : m));
  }, []);

  const deleteMessage = useCallback((messageId: string) => {
    setMessages(prev => prev.filter(m => m.id !== messageId));
    playClickSound();
  }, []);

  // Chat
  const openChatWith = useCallback((targetUserId: string) => {
    if (targetUserId === currentUser.id) return;
    playClickSound();
    setActiveChatWindows(prev => {
      if (prev.some(w => w.targetUserId === targetUserId)) {
        return prev.map(w => w.targetUserId === targetUserId ? { ...w, minimized: false } : w);
      }
      return [...prev, { targetUserId, minimized: false }];
    });
  }, [currentUser.id]);

  const closeChat = useCallback((targetUserId: string) => {
    setActiveChatWindows(prev => prev.filter(w => w.targetUserId !== targetUserId));
    playClickSound();
  }, []);

  const toggleMinimizeChat = useCallback((targetUserId: string) => {
    setActiveChatWindows(prev => prev.map(w => w.targetUserId === targetUserId ? { ...w, minimized: !w.minimized } : w));
    playClickSound();
  }, []);

  const sendChatMessage = useCallback((targetUserId: string, text: string) => {
    if (!text.trim()) return;

    const newMsg: ChatMessage = {
      id: `chat_${Date.now()}`,
      emisorId: currentUser.id,
      receptorId: targetUserId,
      mensaje: text.trim(),
      fecha: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      leido: true
    };

    setChatMessages(prev => [...prev, newMsg]);
    playClickSound();

    // Simulated retro smart reply after a brief moment
    const targetUser = users.find(u => u.id === targetUserId);
    if (targetUser && targetUser.online) {
      setTimeout(() => {
        const retroReplies = [
          'Jajaja qué pasa fiera! ¿Te has enterado del fiestón de este finde? 🎉',
          'Siii tío! Justo estaba mirando tu tablón xdd',
          'Ey! Me pillas escuchando temazos en Tuenti / Inkorium jaja 🎧',
          'Jajajaj qué grande eres!! A ver si subes más fotos de las vacaciones 📸',
          'De una!! Cuenta conmigo para lo que haga falta!',
          'Jajajaja lol, me meo contigo xd',
          'Oye pásate por mi perfil que he subido nuevo álbum!! :)'
        ];
        const randomReply = retroReplies[Math.floor(Math.random() * retroReplies.length)];
        
        const replyMsg: ChatMessage = {
          id: `chat_${Date.now()}_reply`,
          emisorId: targetUserId,
          receptorId: currentUser.id,
          mensaje: randomReply,
          fecha: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          leido: false
        };

        setChatMessages(prev => [...prev, replyMsg]);
        playMessageSound();
      }, 1400);
    }
  }, [currentUser.id, users]);

  const setChatEstado = useCallback((estado: '1' | '0') => {
    setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, chatEstado: estado } : u));
    playClickSound();
  }, [currentUser.id]);

  // Notifications
  const markNotificationAsRead = useCallback((notifId: string) => {
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, leido: true } : n));
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => n.userId === currentUser.id ? { ...n, leido: true } : n));
  }, [currentUser.id]);

  // Real-time Event Simulators
  const simulateIncomingMessage = useCallback(() => {
    const otherUsers = users.filter(u => u.id !== currentUser.id);
    if (otherUsers.length === 0) return;
    const sender = otherUsers[Math.floor(Math.random() * otherUsers.length)];

    const retroMessages = [
      { asunto: '¡Eyy qué pasa crack!', texto: '¡Hola! ¿Al final vienes hoy a la quedada o te quedas estudiando? Avisa luego crack! ;)' },
      { asunto: 'Fotos de la fiesta!!', texto: '¡Wenas! Ya he subido al Tuenti las fotos de la fiesta del sábado jaja, etiquétate cuando puedas que sales brutal xd' },
      { asunto: '¿Tienes los apuntes?', texto: 'Ey! ¿Por casualidad tienes los apuntes de historia del otro día? Que no pude ir y ando liado jaja. Un besoo' },
      { asunto: '¡Felicidades!!', texto: '¡Ey máquina! Que me acabo de enterar de lo tuyo, muchas felicidades!! A celebrarlo este fin de semana 🎉' },
      { asunto: 'Temazo nuevo 🎧', texto: 'Escúchate esta canción que te va a encantar, la están poniendo en todos lados! Luego me cuentas qué tal ;)' },
      { asunto: 'Quedada este viernes', texto: '¿Qué hacéis este viernes por la tarde? Hemos quedado unos cuantos en el parque y luego al cine. ¡Apúntate!' }
    ];
    const chosen = retroMessages[Math.floor(Math.random() * retroMessages.length)];

    const newMsg: PrivateMessage = {
      id: `mp_${Date.now()}`,
      emisorId: sender.id,
      emisorNombre: `${sender.nombre} ${sender.apellidos}`,
      emisorAvatar: sender.avatar,
      receptorId: currentUser.id,
      receptorNombre: `${currentUser.nombre} ${currentUser.apellidos}`,
      asunto: chosen.asunto,
      mensaje: chosen.texto,
      fecha: 'Hoy a las ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      leido: false
    };

    setMessages(prev => [newMsg, ...prev]);

    const notif: InkoriumNotification = {
      id: `notif_${Date.now()}`,
      userId: currentUser.id,
      fromUserId: sender.id,
      fromUserName: `${sender.nombre} ${sender.apellidos}`,
      fromUserAvatar: sender.avatar,
      tipo: 'mp',
      mensaje: `${sender.nombre} ${sender.apellidos} te ha enviado un mensaje privado: "${chosen.asunto}".`,
      detalle: chosen.texto,
      targetId: newMsg.id,
      enlace: 'mensajes',
      leido: false,
      fecha: 'Ahora mismo'
    };

    pushNotification(notif);
  }, [users, currentUser, pushNotification]);

  const simulateWallComment = useCallback(() => {
    const otherUsers = users.filter(u => u.id !== currentUser.id);
    if (otherUsers.length === 0) return;
    const sender = otherUsers[Math.floor(Math.random() * otherUsers.length)];

    const retroWallSignatures = [
      '¡Firmaaado crack! Pásate por el mío y firma tú también cuando puedas ;)',
      'Jajajaj qué grande eres tío! A ver si nos vemos pronto de fiesta 🎉🍻',
      '¡¡Holitaaa!! Pasaba por aquí para dejarte una firmita rápida jeje, que tengas buena semana! (K)',
      'Eseee fiera!! Vaya finde nos espera xdd. ¡Cuidatee!',
      'Firma para el más salao de todo Inkorium! No cambies nunca compadre :)',
      '¡Ey! Qué fotones tienes subidos jaja. A ver si nos echamos ese PRO un día de estos ⚽'
    ];
    const signature = retroWallSignatures[Math.floor(Math.random() * retroWallSignatures.length)];

    const newComment: WallComment = {
      id: `wall_${Date.now()}`,
      emisorId: sender.id,
      emisorNombre: `${sender.nombre} ${sender.apellidos}`,
      emisorAvatar: sender.avatar,
      receptorId: currentUser.id,
      comentario: signature,
      fecha: 'Hoy a las ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setWallComments(prev => [newComment, ...prev]);

    const feedItem: FeedItem = {
      id: `feed_${Date.now()}`,
      tipo: 'tablon',
      propietarioId: currentUser.id,
      propietarioNombre: `${currentUser.nombre} ${currentUser.apellidos}`,
      propietarioAvatar: currentUser.avatar,
      visitanteId: sender.id,
      visitanteNombre: `${sender.nombre} ${sender.apellidos}`,
      visitanteAvatar: sender.avatar,
      datos: signature,
      fecha: 'Ahora mismo',
      likes: [],
      comentarios: []
    };
    setFeed(prev => [feedItem, ...prev]);

    const notif: InkoriumNotification = {
      id: `notif_${Date.now()}`,
      userId: currentUser.id,
      fromUserId: sender.id,
      fromUserName: `${sender.nombre} ${sender.apellidos}`,
      fromUserAvatar: sender.avatar,
      tipo: 'tablon',
      mensaje: `${sender.nombre} ${sender.apellidos} ha firmado en tu tablón.`,
      detalle: signature,
      targetId: newComment.id,
      enlace: 'perfil',
      leido: false,
      fecha: 'Ahora mismo'
    };

    pushNotification(notif);
  }, [users, currentUser, pushNotification]);

  const simulateFriendRequest = useCallback(() => {
    let candidate = users.find(u => u.id !== currentUser.id && !isFriend(currentUser.id, u.id) && !hasPendingRequest(u.id, currentUser.id));

    if (!candidate) {
      const retroProfiles = [
        { nombre: 'Marta', apellidos: 'Gil Santos', sexo: 'm' as const, provincia: 'Sevilla', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80' },
        { nombre: 'Álex', apellidos: 'Navarro Pons', sexo: 'h' as const, provincia: 'Zaragoza', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80' },
        { nombre: 'Elena', apellidos: 'Sanz Bilbao', sexo: 'm' as const, provincia: 'Bilbao', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80' },
        { nombre: 'Rubén', apellidos: 'Cortés Luque', sexo: 'h' as const, provincia: 'Alicante', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80' }
      ];
      const p = retroProfiles[Math.floor(Math.random() * retroProfiles.length)];
      const newUser: User = {
        id: `user_gen_${Date.now()}`,
        nombre: p.nombre,
        apellidos: p.apellidos,
        email: `${p.nombre.toLowerCase()}.${Date.now()}@inkorium.com`,
        sexo: p.sexo,
        fnac: '1994-06-12',
        provincia: p.provincia,
        ciudad: p.provincia,
        estado: '¡Buscando gente maja en Inkorium! Tuenti forever ;)',
        estadoFecha: 'Hace unos minutos',
        situacionSentimental: 'Soltero/a',
        avatar: p.avatar,
        fechaReg: new Date().toLocaleDateString('es-ES'),
        online: true,
        ultimoAcceso: 'Ahora mismo',
        chatEstado: '1'
      };
      setUsers(prev => [...prev, newUser]);
      candidate = newUser;
    }

    const newRequest: FriendRequest = {
      id: `freq_${Date.now()}`,
      emisorId: candidate.id,
      emisorNombre: `${candidate.nombre} ${candidate.apellidos}`,
      emisorAvatar: candidate.avatar,
      emisorProvincia: candidate.provincia,
      receptorId: currentUser.id,
      fecha: 'Ahora mismo',
      estado: 'pendiente'
    };

    setFriendRequests(prev => [...prev, newRequest]);

    const notif: InkoriumNotification = {
      id: `notif_${Date.now()}`,
      userId: currentUser.id,
      fromUserId: candidate.id,
      fromUserName: `${candidate.nombre} ${candidate.apellidos}`,
      fromUserAvatar: candidate.avatar,
      tipo: 'peticion',
      mensaje: `${candidate.nombre} ${candidate.apellidos} te ha enviado una petición de amistad.`,
      detalle: `Desde ${candidate.provincia}`,
      targetId: newRequest.id,
      enlace: 'ajustes',
      leido: false,
      fecha: 'Ahora mismo'
    };

    pushNotification(notif);
  }, [users, currentUser, isFriend, hasPendingRequest, pushNotification]);

  const simulatePhotoInteraction = useCallback(() => {
    const otherUsers = users.filter(u => u.id !== currentUser.id);
    if (otherUsers.length === 0) return;
    const sender = otherUsers[Math.floor(Math.random() * otherUsers.length)];

    const myPhotos = photos.filter(p => p.uploaderId === currentUser.id);
    const targetPhoto = myPhotos.length > 0 ? myPhotos[Math.floor(Math.random() * myPhotos.length)] : photos[0];
    if (!targetPhoto) return;

    const isComment = Math.random() > 0.4;
    if (isComment) {
      const retroPhotoComments = [
        '¡Vaya fotón! Sales de lujo crack ;) 📸',
        'Jajajajaj momento épico ese día!! Qué risas xd',
        '¡Qué guapos todos! A ver cuándo repetimos!',
        'Menudo postureo jaja, me encanta la foto! (K)',
        '¡Fotaza fiera! Tienes que pasarme las demás por privado!'
      ];
      const text = retroPhotoComments[Math.floor(Math.random() * retroPhotoComments.length)];
      const newComment = {
        id: `pcom_${Date.now()}`,
        photoId: targetPhoto.id,
        userId: sender.id,
        nombre: `${sender.nombre} ${sender.apellidos}`,
        avatar: sender.avatar,
        comentario: text,
        fecha: 'Hoy a las ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setPhotos(prev => prev.map(p => p.id === targetPhoto.id ? { ...p, comentarios: [...p.comentarios, newComment] } : p));

      const notif: InkoriumNotification = {
        id: `notif_${Date.now()}`,
        userId: currentUser.id,
        fromUserId: sender.id,
        fromUserName: `${sender.nombre} ${sender.apellidos}`,
        fromUserAvatar: sender.avatar,
        tipo: 'foto',
        mensaje: `${sender.nombre} ${sender.apellidos} ha comentado tu foto "${targetPhoto.titulo}".`,
        detalle: text,
        targetId: targetPhoto.id,
        enlace: 'fotos',
        leido: false,
        fecha: 'Ahora mismo'
      };
      pushNotification(notif);
    } else {
      setPhotos(prev => prev.map(p => {
        if (p.id === targetPhoto.id && !p.likes.includes(sender.id)) {
          return { ...p, likes: [...p.likes, sender.id] };
        }
        return p;
      }));

      const notif: InkoriumNotification = {
        id: `notif_${Date.now()}`,
        userId: currentUser.id,
        fromUserId: sender.id,
        fromUserName: `${sender.nombre} ${sender.apellidos}`,
        fromUserAvatar: sender.avatar,
        tipo: 'like',
        mensaje: `A ${sender.nombre} ${sender.apellidos} le gusta tu foto "${targetPhoto.titulo}".`,
        targetId: targetPhoto.id,
        enlace: 'fotos',
        leido: false,
        fecha: 'Ahora mismo'
      };
      pushNotification(notif);
    }
  }, [users, currentUser, photos, pushNotification]);

  // Background real-time periodic simulation
  useEffect(() => {
    if (!isRealtimeSimulationEnabled) return;

    const timer = setInterval(() => {
      const choice = Math.random();
      if (choice < 0.3) {
        simulateIncomingMessage();
      } else if (choice < 0.55) {
        simulateWallComment();
      } else if (choice < 0.8) {
        simulatePhotoInteraction();
      } else {
        simulateFriendRequest();
      }
    }, 45000); // Live event every 45s

    return () => clearInterval(timer);
  }, [isRealtimeSimulationEnabled, simulateIncomingMessage, simulateWallComment, simulatePhotoInteraction, simulateFriendRequest]);

  const updateUserData = useCallback((data: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, ...data } : u));
    
    // Log Activity if avatar, state, or info updated
    if (data.avatar && data.avatar !== currentUser.avatar) {
      logUserActivity({
        userId: currentUser.id,
        userName: `${currentUser.nombre} ${currentUser.apellidos}`,
        userAvatar: data.avatar,
        type: 'avatar_change',
        title: 'ha cambiado su foto de perfil',
        targetPhotoUrl: data.avatar,
        date: 'Ahora mismo'
      });
    }
    if (data.estado && data.estado !== currentUser.estado) {
      logUserActivity({
        userId: currentUser.id,
        userName: `${currentUser.nombre} ${currentUser.apellidos}`,
        userAvatar: data.avatar || currentUser.avatar,
        type: 'status_update',
        title: 'ha actualizado su estado',
        detail: data.estado,
        date: 'Ahora mismo'
      });
    }
    if (data.ciudad || data.situacionSentimental || data.provincia) {
      logUserActivity({
        userId: currentUser.id,
        userName: `${currentUser.nombre} ${currentUser.apellidos}`,
        userAvatar: currentUser.avatar,
        type: 'info_update',
        title: 'ha actualizado su información de perfil',
        detail: [data.provincia, data.ciudad, data.situacionSentimental].filter(Boolean).join(', '),
        date: 'Ahora mismo'
      });
    }

    playSuccessSound();
  }, [currentUser, logUserActivity]);

  const resetToDefaultData = useCallback(() => {
    localStorage.clear();
    setUsers(INITIAL_USERS);
    setCurrentUserId('user_1');
    setPhotos(INITIAL_PHOTOS);
    setAlbums(INITIAL_ALBUMS);
    setFeed(INITIAL_FEED);
    setWallComments(INITIAL_WALL_COMMENTS);
    setMessages(INITIAL_MESSAGES);
    setFriendRequests(INITIAL_FRIEND_REQUESTS);
    setFriendships(INITIAL_FRIENDSHIPS);
    setChatMessages([]);
    setNotifications(INITIAL_NOTIFICATIONS);
    setToasts([]);
    setAccessLogs(INITIAL_ACCESS_LOGS);
    setActivities(INITIAL_ACTIVITIES);
    setActiveChatWindows([]);
    setActiveTabState('inicio');
    setSelectedUserId('user_1');
    playSuccessSound();
  }, []);

  const registerNewUser = useCallback((
    nombre: string, 
    apellidos: string, 
    email: string, 
    sexo: 'h' | 'm', 
    provincia: string, 
    fnac: string
  ) => {
    const newUser: User = {
      id: `user_${Date.now()}`,
      nombre: nombre.trim(),
      apellidos: apellidos.trim(),
      email: email.trim(),
      sexo,
      fnac,
      provincia,
      ciudad: provincia,
      estado: '¡Recién llegado a Inkorium! Añadidme todos :)',
      estadoFecha: 'Ahora mismo',
      situacionSentimental: 'Soltero/a',
      avatar: sexo === 'h' 
        ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      fechaReg: new Date().toLocaleDateString('es-ES'),
      online: true,
      ultimoAcceso: 'Ahora mismo',
      chatEstado: '1'
    };

    setUsers(prev => [newUser, ...prev]);
    setCurrentUserId(newUser.id);
    setSelectedUserId(newUser.id);
    setIsLoggedIn(true);
    setActiveTabState('inicio');
    playSuccessSound();
    confetti({ particleCount: 100, spread: 80 });
  }, []);

  return (
    <InkoriumContext.Provider value={{
      currentUser,
      users,
      photos,
      albums,
      feed,
      wallComments,
      messages,
      friendRequests,
      friendships,
      chatMessages,
      notifications,
      toasts,
      accessLogs,
      activities,
      activeChatWindows,
      activeTab,
      selectedUserId,
      selectedPhotoId,
      selectedAlbumId,
      unreadMessagesCount,
      unreadNotificationsCount,
      pendingRequestsCount,
      isRealtimeSimulationEnabled,
      isLoggedIn,
      setActiveTab,
      viewUserProfile,
      viewPhoto,
      viewAlbum,
      setCurrentUserById,
      login,
      loginAsUser,
      logout,
      publishStatus,
      likeFeedItem,
      commentFeedItem,
      postWallComment,
      deleteWallComment,
      uploadPhoto,
      addPhotoTag,
      removePhotoTag,
      addPhotoComment,
      likePhoto,
      setPhotoAsAvatar,
      deletePhoto,
      createAlbum,
      renameAlbum,
      deleteAlbum,
      sendFriendRequest,
      acceptFriendRequest,
      ignoreFriendRequest,
      isFriend,
      hasPendingRequest,
      getFriendsOf,
      sendPrivateMessage,
      markMessageAsRead,
      deleteMessage,
      openChatWith,
      closeChat,
      toggleMinimizeChat,
      sendChatMessage,
      setChatEstado,
      logUserActivity,
      deleteUserActivity,
      getUserActivities,
      pushNotification,
      dismissToast,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      deleteNotification,
      setIsRealtimeSimulationEnabled,
      simulateIncomingMessage,
      simulateWallComment,
      simulateFriendRequest,
      simulatePhotoInteraction,
      updateUserData,
      resetToDefaultData,
      registerNewUser
    }}>
      {children}
    </InkoriumContext.Provider>
  );
};

export const useInkorium = () => {
  const context = useContext(InkoriumContext);
  if (!context) {
    throw new Error('useInkorium must be used within an InkoriumProvider');
  }
  return context;
};
