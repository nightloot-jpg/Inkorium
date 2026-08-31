import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Photo, Album, FeedItem, WallComment, PrivateMessage, FriendRequest, Friendship, ChatMessage, ChatWindow, InkoriumNotification, AccessLog, UserActivity, UserPresence } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { fetchPosts, createPost } from '../lib/postsApi';
import { fetchPhotos, insertPhoto } from '../lib/photosApi';
import { INITIAL_USERS, INITIAL_ALBUMS, INITIAL_PHOTOS, INITIAL_FEED, INITIAL_WALL_COMMENTS, INITIAL_FRIENDSHIPS, INITIAL_FRIEND_REQUESTS, INITIAL_MESSAGES, INITIAL_NOTIFICATIONS, INITIAL_ACCESS_LOGS, INITIAL_ACTIVITIES } from '../data/mockData';

interface InkoriumContextType {
  currentUser: User; users: User[]; photos: Photo[]; albums: Album[]; feed: FeedItem[]; wallComments: WallComment[];
  messages: PrivateMessage[]; friendRequests: FriendRequest[]; friendships: Friendship[]; chatMessages: ChatMessage[];
  notifications: InkoriumNotification[]; toasts: InkoriumNotification[]; accessLogs: AccessLog[]; activities: UserActivity[];
  activeChatWindows: ChatWindow[]; activeTab: 'inicio' | 'perfil' | 'gente' | 'fotos' | 'mensajes' | 'notificaciones' | 'ajustes';
  selectedUserId: string; selectedPhotoId: string | null; selectedAlbumId: string | null;
  composeRecipientId: string | null;
  unreadMessagesCount: number; unreadNotificationsCount: number; pendingRequestsCount: number;
  isRealtimeSimulationEnabled: boolean; isLoggedIn: boolean;
  setActiveTab: (tab: InkoriumContextType['activeTab']) => void; viewUserProfile: (userId: string) => void;
  openComposeMessage: (recipientId?: string) => void;
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
  removeFriendship: (targetUserId: string) => void; cancelFriendRequest: (targetUserId: string) => void;
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
  const storedUserId = typeof localStorage !== 'undefined' ? localStorage.getItem('inkorium:user_id') : null;
  const storedLoggedIn = typeof localStorage !== 'undefined' ? localStorage.getItem('inkorium:is_logged_in') === 'true' : false;

  const [users, setUsers] = useState<User[]>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('inkorium:users');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch {}
      }
    }
    return INITIAL_USERS;
  });

  const [currentUserId, setCurrentUserId] = useState<string>(storedUserId || INITIAL_USERS[0]?.id || '');
  const [photos, setPhotos] = useState<Photo[]>(INITIAL_PHOTOS);
  const [albums, setAlbums] = useState<Album[]>(INITIAL_ALBUMS);
  const [feed, setFeed] = useState<FeedItem[]>(INITIAL_FEED);
  const [wallComments, setWallComments] = useState<WallComment[]>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('inkorium:wall_comments');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        } catch {}
      }
    }
    return INITIAL_WALL_COMMENTS;
  });

  const [messages, setMessages] = useState<PrivateMessage[]>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('inkorium:messages') || localStorage.getItem('inkorium:private_messages');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch {}
      }
    }
    return INITIAL_MESSAGES;
  });

  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('inkorium:friend_requests');
      if (saved) {
        try { return JSON.parse(saved); } catch {}
      }
    }
    return INITIAL_FRIEND_REQUESTS;
  });

  const [friendships, setFriendships] = useState<Friendship[]>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('inkorium:friendships');
      if (saved) {
        try { return JSON.parse(saved); } catch {}
      }
    }
    return INITIAL_FRIENDSHIPS;
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [notifications, setNotifications] = useState<InkoriumNotification[]>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('inkorium:notifications');
      if (saved) {
        try { return JSON.parse(saved); } catch {}
      }
    }
    return INITIAL_NOTIFICATIONS;
  });

  const [toasts, setToasts] = useState<InkoriumNotification[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>(INITIAL_ACCESS_LOGS);
  const [activities, setActivities] = useState<UserActivity[]>(INITIAL_ACTIVITIES);
  const [isRealtimeSimulationEnabled, setIsRealtimeSimulationEnabledState] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(storedLoggedIn);
  const [activeTab, setActiveTabState] = useState<InkoriumContextType['activeTab']>('inicio');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [composeRecipientId, setComposeRecipientId] = useState<string | null>(null);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [activeChatWindows, setActiveChatWindows] = useState<ChatWindow[]>([]);

  // Sync users to localStorage
  useEffect(() => {
    if (typeof localStorage !== 'undefined' && users.length > 0) {
      localStorage.setItem('inkorium:users', JSON.stringify(users));
    }
  }, [users]);

  // Sync notifications to localStorage
  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('inkorium:notifications', JSON.stringify(notifications));
    }
  }, [notifications]);

  // Sync friend requests to localStorage
  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('inkorium:friend_requests', JSON.stringify(friendRequests));
    }
  }, [friendRequests]);

  // Sync friendships to localStorage
  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('inkorium:friendships', JSON.stringify(friendships));
    }
  }, [friendships]);

  // Sync messages to localStorage
  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('inkorium:messages', JSON.stringify(messages));
      localStorage.setItem('inkorium:private_messages', JSON.stringify(messages));
    }
  }, [messages]);

  // Sync wall comments to localStorage
  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('inkorium:wall_comments', JSON.stringify(wallComments));
    }
  }, [wallComments]);

  // Keep currentUser initialized before callbacks/effects that depend on it.
  const currentUser = users.find(user => user.id === currentUserId) || users[0] || EMPTY_USER;

  const mapProfileToUser = useCallback((p: any): User => {
    const username = String(p.username ?? '').trim();
    const fullName = String(p.full_name ?? p.fullname ?? '').trim();
    const parts = fullName ? fullName.split(/\s+/) : [];
    const nombre = String(p.nombre ?? parts[0] ?? username ?? `Usuario_${String(p.id).slice(0, 6)}`).trim();
    const apellidos = String(p.apellidos ?? parts.slice(1).join(' ')).trim();
    const city = String(p.city ?? p.ciudad ?? '').trim();
    const province = String(p.province ?? p.provincia ?? city).trim();
    const rawPresence = String(p.presence ?? p.presencia ?? p.user_status ?? p.estado ?? '').trim().toLowerCase();
    const presencia: UserPresence = ['conectado','ausente','ocupado','invisible'].includes(rawPresence) ? rawPresence as UserPresence : 'conectado';
    const gender = String(p.gender ?? p.sexo ?? '').trim().toLowerCase();
    const avatar = String(p.avatar_url ?? p.avatar ?? '').trim();
    const interests = Array.isArray(p.profile_interests) ? p.profile_interests.join(', ') : String(p.profile_interests ?? p.intereses ?? '').trim();
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
      intereses: interests,
      musica: p.music ?? p.musica ?? '',
      avatar,
      fechaReg: p.updated_at ? new Date(p.updated_at).toLocaleDateString('es-ES') : 'Reciente',
      online: presencia !== 'invisible',
      ultimoAcceso: p.updated_at ? new Date(p.updated_at).toLocaleString('es-ES') : 'Recientemente',
      chatEstado: presencia === 'invisible' ? '0' : '1'
    };
  }, []);

  const profilesTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchProfiles = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    if (profilesTimer.current) clearTimeout(profilesTimer.current);
    profilesTimer.current = setTimeout(async () => {
      try {
        const response = await fetch('/api/profiles?select=id,username,full_name,avatar_url,city,birth_date,user_status,profile_interests,updated_at&limit=1000', { cache: 'no-store', headers: { Accept: 'application/json' } });
        if (!response.ok) return;
        const data = (await response.json()) as any[];
        if (!Array.isArray(data)) return;
        const mapped: User[] = data.map(mapProfileToUser);
        setUsers(prevUsers => {
          const storedPresence = localStorage.getItem('inkorium:presence') as UserPresence | null;
          let combined = mapped.length > 0 ? mapped : INITIAL_USERS;
          
          // Keep current user in list if not in mapped or preserve local custom avatar/edits
          const existingCurrent = prevUsers.find(u => u.id === currentUserId);
          if (existingCurrent && !combined.some(u => u.id === currentUserId)) {
            combined = [existingCurrent, ...combined];
          } else if (existingCurrent) {
            combined = combined.map(u => u.id === currentUserId ? { ...u, avatar: existingCurrent.avatar || u.avatar, nombre: existingCurrent.nombre || u.nombre } : u);
          }

          for (const initUser of INITIAL_USERS) {
            if (!combined.some(u => u.id === initUser.id || (u.email && u.email === initUser.email))) {
              combined.push(initUser);
            }
          }

          if (storedPresence && ['conectado','ausente','ocupado','invisible'].includes(storedPresence)) {
            return combined.map((user: User) => user.id === currentUserId ? { ...user, presencia: storedPresence, online: storedPresence !== 'invisible', chatEstado: storedPresence === 'invisible' ? '0' : '1' } : user);
          }
          return combined;
        });
      } catch (error) {
        console.error('Profiles load failed:', error);
      }
    }, 100);
  }, [mapProfileToUser, currentUserId]);

  const mapPhotoToPhoto = useCallback((row: any): Photo => {
    const uploader = users.find(u => u.id === String(row.user_id));
    return {
      id: String(row.id),
      uploaderId: String(row.user_id),
      uploaderName: uploader ? `${uploader.nombre} ${uploader.apellidos}`.trim() : 'Usuario',
      albumId: row.album_id ?? null,
      albumName: undefined,
      archivo: String(row.url || ''),
      titulo: String(row.caption || 'Sin título'),
      fecha: row.created_at ? new Date(row.created_at).toLocaleString('es-ES') : 'Recientemente',
      etiquetas: [],
      comentarios: [],
      likes: []
    };
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
          return {
            id: row.id,
            tipo: photoUrl ? 'foto' : 'estado',
            propietarioId: row.author_id,
            propietarioNombre: author ? `${author.nombre} ${author.apellidos}`.trim() : 'Usuario',
            propietarioAvatar: author?.avatar || '',
            datos: row.content,
            fotoUrl: photoUrl || undefined,
            fecha: row.created_at,
            likes: [],
            comentarios: []
          };
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

  const fetchAndMapPrivateMessages = useCallback(async () => {
    if (!isSupabaseConfigured || !currentUserId) return;
    try {
      const session = await supabase?.auth.getSession().catch(() => null);
      const token = session?.data?.session?.access_token;
      const res = await fetch('/api/private-messages?order=created_at.desc&limit=100', {
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const mapped: PrivateMessage[] = data.map((row: any) => {
            const sender = users.find(u => u.id === row.sender_id || u.username === row.sender_id);
            const recipient = users.find(u => u.id === row.recipient_id || u.username === row.recipient_id);
            return {
              id: String(row.id),
              emisorId: String(row.sender_id),
              emisorNombre: sender ? (sender.full_name || `${sender.nombre} ${sender.apellidos}`.trim() || sender.nombre) : 'Usuario',
              emisorAvatar: sender?.avatar || '',
              receptorId: String(row.recipient_id),
              receptorNombre: recipient ? (recipient.full_name || `${recipient.nombre} ${recipient.apellidos}`.trim() || recipient.nombre) : 'Usuario',
              asunto: String(row.subject || 'Sin asunto'),
              mensaje: String(row.body || ''),
              fecha: row.created_at ? new Date(row.created_at).toLocaleString('es-ES') : 'Recientemente',
              leido: Boolean(row.is_read)
            };
          });

          setMessages(prev => {
            const dbIds = new Set(mapped.map(m => m.id));
            const localNonDb = prev.filter(m => !dbIds.has(m.id));
            return [...mapped, ...localNonDb];
          });
        }
      }
    } catch (e) {
      console.warn('Failed to load private messages from Supabase:', e);
    }
  }, [isSupabaseConfigured, currentUserId, users]);

  useEffect(() => {
    if (!supabase || !isSupabaseConfigured) return;
    let mounted = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (data.session?.user) {
        setCurrentUserId(data.session.user.id);
        setIsLoggedIn(true);
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('inkorium:user_id', data.session.user.id);
          localStorage.setItem('inkorium:is_logged_in', 'true');
        }
      }
      void fetchProfiles();
    });

    const { data: auth } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (session?.user) {
        setCurrentUserId(session.user.id);
        setIsLoggedIn(true);
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('inkorium:user_id', session.user.id);
          localStorage.setItem('inkorium:is_logged_in', 'true');
        }
        void fetchProfiles();
      } else if (event === 'SIGNED_OUT') {
        const storedLoggedIn = typeof localStorage !== 'undefined' ? localStorage.getItem('inkorium:is_logged_in') === 'true' : false;
        if (!storedLoggedIn) {
          setCurrentUserId('');
          setIsLoggedIn(false);
        }
      }
    });

    const profilesChannel = supabase.channel('profiles-sync').on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => void fetchProfiles()).subscribe();
    const photosChannel = supabase.channel('photos-sync').on('postgres_changes', { event: '*', schema: 'public', table: 'photos' }, () => void fetchAndMapPhotos()).subscribe();
    const messagesChannel = supabase.channel('messages-sync').on('postgres_changes', { event: '*', schema: 'public', table: 'private_messages' }, () => void fetchAndMapPrivateMessages()).subscribe();

    return () => {
      mounted = false;
      if (profilesTimer.current) clearTimeout(profilesTimer.current);
      auth.subscription.unsubscribe();
      void supabase.removeChannel(profilesChannel);
      void supabase.removeChannel(photosChannel);
      void supabase.removeChannel(messagesChannel);
    };
  }, [fetchProfiles, fetchAndMapPhotos, fetchAndMapPrivateMessages]);

  useEffect(() => { if (users.length > 0 || isSupabaseConfigured) void fetchAndMapPosts(); }, [users.length, fetchAndMapPosts]);
  useEffect(() => { if (currentUserId && isSupabaseConfigured) void fetchAndMapPhotos(); }, [currentUserId, fetchAndMapPhotos]);
  useEffect(() => { if (currentUserId && isSupabaseConfigured) void fetchAndMapPrivateMessages(); }, [currentUserId, isSupabaseConfigured, fetchAndMapPrivateMessages]);

  const updateUserPresence = useCallback((presencia: UserPresence) => {
    if (!currentUserId) return;
    setUsers(prev => prev.map(user => user.id === currentUserId ? { ...user, presencia, online: presencia !== 'invisible', chatEstado: presencia === 'invisible' ? '0' : '1' } : user));
    localStorage.setItem('inkorium:presence', presencia);
  }, [currentUserId]);

  const publishStatus = useCallback((statusText: string, attachedPhotoUrl?: string) => {
    if (!statusText.trim() && !attachedPhotoUrl) return;
    void createPost(statusText.trim(), attachedPhotoUrl).then(row => {
      const author = users.find(u => u.id === row.author_id) || currentUser;
      const photoUrl = row.media_data && typeof row.media_data === 'object' && 'url' in (row.media_data as any) ? String((row.media_data as any).url || '') : attachedPhotoUrl || '';
      const item: FeedItem = {
        id: row.id,
        tipo: photoUrl ? 'foto' : 'estado',
        propietarioId: row.author_id,
        propietarioNombre: `${author.nombre} ${author.apellidos}`.trim() || 'Usuario',
        propietarioAvatar: author.avatar,
        datos: row.content,
        fotoUrl: photoUrl || undefined,
        fecha: row.created_at,
        likes: [],
        comentarios: []
      };
      setFeed(prev => [item, ...prev]);
    }).catch(error => {
      console.error('Post create failed, adding locally:', error);
      const item: FeedItem = {
        id: `local-post-${Date.now()}`,
        tipo: attachedPhotoUrl ? 'foto' : 'estado',
        propietarioId: currentUserId,
        propietarioNombre: `${currentUser.nombre} ${currentUser.apellidos}`.trim() || 'Usuario',
        propietarioAvatar: currentUser.avatar,
        datos: statusText.trim(),
        fotoUrl: attachedPhotoUrl || undefined,
        fecha: 'Ahora mismo',
        likes: [],
        comentarios: []
      };
      setFeed(prev => [item, ...prev]);
    });
  }, [currentUser, users, currentUserId]);

  const uploadPhoto = useCallback((titulo: string, albumId: string | null, archivoUrl: string) => {
    if (!currentUserId || !archivoUrl) return;
    const optimisticId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const optimistic: Photo = {
      id: optimisticId,
      uploaderId: currentUserId,
      uploaderName: `${currentUser.nombre} ${currentUser.apellidos}`.trim() || 'Usuario',
      albumId,
      archivo: archivoUrl,
      titulo: titulo || 'Sin título',
      fecha: new Date().toLocaleString('es-ES'),
      etiquetas: [],
      comentarios: [],
      likes: []
    };
    setPhotos(prev => [optimistic, ...prev]);
    void insertPhoto({ userId: currentUserId, albumId, url: archivoUrl, caption: titulo || 'Sin título' }).then(row => {
      setPhotos(prev => [mapPhotoToPhoto(row), ...prev.filter(photo => photo.id !== optimisticId)]);
    }).catch(error => {
      console.warn('Photo persistence local fallback:', error);
    });
  }, [currentUserId, currentUser, mapPhotoToPhoto]);

  const updateUserData = useCallback((data: Partial<User>) => {
    if (!currentUserId) return;
    setUsers(prev => {
      const updated = prev.map(user => user.id === currentUserId ? { ...user, ...data } : user);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('inkorium:users', JSON.stringify(updated));
      }
      return updated;
    });
  }, [currentUserId]);

  const updateStatusText = useCallback(async (statusText: string) => {
    if (!currentUserId) return;
    const nextStatus = statusText.trim().slice(0, 140);
    setUsers(prev => prev.map(user => user.id === currentUserId ? { ...user, estado: nextStatus, estadoFecha: 'Reciente' } : user));
    try {
      if (supabase) {
        const sessionResult = await supabase.auth.getSession();
        const accessToken = sessionResult.data.session?.access_token;
        if (accessToken) {
          await fetch(`/api/profiles/${encodeURIComponent(currentUserId)}/status`, {
            method: 'PATCH',
            headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
            body: JSON.stringify({ status: nextStatus })
          }).catch(() => null);
        }
      }
    } catch (error) {
      console.warn('Status remote sync skipped:', error);
    }
  }, [currentUserId]);

  const openChatWith = useCallback((targetUserId: string) => {
    if (!currentUserId || !targetUserId || targetUserId === currentUserId) return;
    setActiveChatWindows(prev => {
      const existing = prev.find(win => win.targetUserId === targetUserId);
      if (existing) return prev.map(win => win.targetUserId === targetUserId ? { ...win, minimized: false } : win);
      return [...prev, { targetUserId, minimized: false }];
    });
  }, [currentUserId]);

  const closeChat = useCallback((targetUserId: string) => {
    setActiveChatWindows(prev => prev.filter(win => win.targetUserId !== targetUserId));
  }, []);

  const toggleMinimizeChat = useCallback((targetUserId: string) => {
    setActiveChatWindows(prev => prev.map(win => win.targetUserId === targetUserId ? { ...win, minimized: !win.minimized } : win));
  }, []);

  const sendChatMessage = useCallback((targetUserId: string, text: string) => {
    const message = text.trim();
    if (!currentUserId || !targetUserId || targetUserId === currentUserId || !message) return;
    setChatMessages(prev => [...prev, {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      emisorId: currentUserId,
      receptorId: targetUserId,
      mensaje: message,
      fecha: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      leido: true
    }]);
    setActiveChatWindows(prev => {
      const existing = prev.find(win => win.targetUserId === targetUserId);
      if (existing) return prev.map(win => win.targetUserId === targetUserId ? { ...win, minimized: false } : win);
      return [...prev, { targetUserId, minimized: false }];
    });
  }, [currentUserId]);

  const setActiveTab = useCallback((tab: InkoriumContextType['activeTab']) => {
    if (tab !== 'mensajes') setComposeRecipientId(null);
    setActiveTabState(tab);
  }, []);
  const viewUserProfile = useCallback((id: string) => { setSelectedUserId(id); setActiveTabState('perfil'); }, []);
  const openComposeMessage = useCallback((recipientId?: string) => {
    setComposeRecipientId(recipientId || null);
    setActiveTabState('mensajes');
  }, []);
  const viewPhoto = useCallback((id: string | null) => setSelectedPhotoId(id), []);
  const viewAlbum = useCallback((id: string | null) => setSelectedAlbumId(id), []);

  const login = useCallback((email: string, _password?: string) => {
    const trimmed = email.trim().toLowerCase();
    const target = users.find(u => u.email.toLowerCase() === trimmed) 
      || users.find(u => (u.username || '').toLowerCase() === trimmed);
    if (target) {
      setCurrentUserId(target.id);
      setIsLoggedIn(true);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('inkorium:user_id', target.id);
        localStorage.setItem('inkorium:is_logged_in', 'true');
      }
      return { success: true };
    }
    const fallbackId = `user-${Date.now()}`;
    const cleanName = trimmed.split('@')[0] || 'Usuario';
    const fallbackUser: User = {
      id: fallbackId,
      nombre: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
      apellidos: 'Inkorium',
      email: trimmed.includes('@') ? trimmed : `${trimmed}@inkorium.es`,
      sexo: 'otro',
      fnac: '2000-01-01',
      provincia: 'Madrid',
      ciudad: 'Madrid',
      estado: '¡Hola! Me acabo de conectar a Inkorium :)',
      estadoFecha: 'Reciente',
      presencia: 'conectado',
      situacionSentimental: 'Soltero/a',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      fechaReg: new Date().toLocaleDateString('es-ES'),
      online: true,
      ultimoAcceso: 'Ahora mismo',
      chatEstado: '1',
    };
    setUsers(prev => [fallbackUser, ...prev]);
    setCurrentUserId(fallbackId);
    setIsLoggedIn(true);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('inkorium:user_id', fallbackId);
      localStorage.setItem('inkorium:is_logged_in', 'true');
    }
    return { success: true };
  }, [users]);

  const loginAsUser = useCallback((id: string) => {
    const target = users.find(u => u.id === id);
    const targetId = target ? target.id : id;
    setCurrentUserId(targetId);
    setIsLoggedIn(true);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('inkorium:user_id', targetId);
      localStorage.setItem('inkorium:is_logged_in', 'true');
    }
  }, [users]);

  const registerNewUser = useCallback((nombre: string, apellidos: string, email: string, sexo: 'h' | 'm', provincia: string, fnac: string) => {
    const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `user-${Date.now()}`;
    const newUser: User = {
      id: newId,
      nombre: nombre.trim(),
      apellidos: apellidos.trim(),
      email: email.trim().toLowerCase(),
      sexo,
      provincia,
      fnac,
      estado: '¡Hola! Me acabo de unir a Inkorium :)',
      estadoFecha: 'Reciente',
      situacionSentimental: 'Soltero/a',
      avatar: sexo === 'h'
        ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
      fechaReg: new Date().toLocaleDateString('es-ES'),
      online: true,
      ultimoAcceso: 'Ahora mismo',
      chatEstado: '1',
      presencia: 'conectado',
    };
    setUsers(prev => [newUser, ...prev]);
    setCurrentUserId(newId);
    setIsLoggedIn(true);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('inkorium:user_id', newId);
      localStorage.setItem('inkorium:is_logged_in', 'true');
    }
  }, []);

  const logout = useCallback(() => {
    if (supabase) void supabase.auth.signOut();
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('inkorium:is_logged_in');
    }
    setCurrentUserId('');
    setIsLoggedIn(false);
  }, []);

  const setCurrentUserById = useCallback((id: string) => {
    setCurrentUserId(id);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('inkorium:user_id', id);
    }
  }, []);

  const setIsRealtime = useCallback((enabled: boolean) => setIsRealtimeSimulationEnabledState(enabled), []);
  
  const pushNotification = useCallback((notif: InkoriumNotification) => {
    setNotifications(prev => [notif, ...prev]);
    // Solo mostrar el popup emergente si la notificación va dirigida al usuario actual logueado
    const isForCurrentUser = 
      !notif.userId ||
      notif.userId === currentUserId ||
      notif.userId === currentUser.id ||
      (currentUser.username && notif.userId === currentUser.username) ||
      (currentUser.id === 'user-nightloot' && notif.userId === 'nightloot') ||
      (currentUser.id === 'nightloot' && notif.userId === 'user-nightloot');

    if (isForCurrentUser) {
      setToasts(prev => [notif, ...prev.slice(0, 4)]);
    }
  }, [currentUserId, currentUser.id, currentUser.username]);

  const dismissToast = useCallback((toastId: string) => {
    setToasts(prev => prev.filter(t => t.id !== toastId));
  }, []);

  const markNotificationAsRead = useCallback((notifId: string) => {
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, leido: true } : n));
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, leido: true })));
  }, []);

  const deleteNotification = useCallback((notifId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notifId));
  }, []);

  const acceptFriendRequest = useCallback((requestId: string) => {
    setFriendRequests(prev => prev.map(r => r.id === requestId ? { ...r, estado: 'aceptada' } : r));
    const req = friendRequests.find(r => r.id === requestId);
    if (req) {
      setFriendships(prev => [...prev, {
        id: `f-${Date.now()}`,
        user1: req.emisorId,
        user2: req.receptorId,
        fecha: new Date().toLocaleDateString('es-ES')
      }]);
      setNotifications(prev => prev.map(n => 
        (n.targetId === requestId || (n.tipo === 'peticion' && n.fromUserId === req.emisorId))
          ? { ...n, leido: true, estadoPeticion: 'aceptada', mensaje: 'y tú ahora sois amigos en Inkorium.' }
          : n
      ));
    }
  }, [friendRequests]);

  const ignoreFriendRequest = useCallback((requestId: string) => {
    setFriendRequests(prev => prev.map(r => r.id === requestId ? { ...r, estado: 'rechazada' } : r));
    setNotifications(prev => prev.map(n => 
      n.targetId === requestId ? { ...n, leido: true, estadoPeticion: 'rechazada' } : n
    ));
  }, []);

  const cancelFriendRequest = useCallback((targetUserId: string) => {
    setFriendRequests(prev => prev.filter(r => !(r.emisorId === currentUserId && r.receptorId === targetUserId && r.estado === 'pendiente')));
  }, [currentUserId]);

  const removeFriendship = useCallback((targetUserId: string) => {
    setFriendships(prev => prev.filter(f => 
      !((f.user1 === currentUserId && f.user2 === targetUserId) || (f.user1 === targetUserId && f.user2 === currentUserId))
    ));
    setFriendRequests(prev => prev.filter(r => 
      !((r.emisorId === currentUserId && r.receptorId === targetUserId) || (r.emisorId === targetUserId && r.receptorId === currentUserId))
    ));
  }, [currentUserId]);

  const sendFriendRequest = useCallback((targetUserId: string) => {
    if (!currentUserId || targetUserId === currentUserId) return;
    const newReq: FriendRequest = {
      id: `req-${Date.now()}`,
      emisorId: currentUserId,
      emisorNombre: `${currentUser.nombre} ${currentUser.apellidos}`.trim() || 'Usuario',
      emisorAvatar: currentUser.avatar,
      emisorProvincia: currentUser.provincia,
      receptorId: targetUserId,
      fecha: 'Ahora mismo',
      estado: 'pendiente'
    };
    setFriendRequests(prev => [newReq, ...prev]);
    pushNotification({
      id: `notif-req-${Date.now()}`,
      tipo: 'peticion',
      userId: targetUserId,
      fromUserId: currentUserId,
      fromUserName: `${currentUser.nombre} ${currentUser.apellidos}`.trim() || 'Usuario',
      fromUserAvatar: currentUser.avatar,
      mensaje: 'te ha enviado una petición de amistad.',
      enlace: 'notificaciones',
      targetId: newReq.id,
      estadoPeticion: 'pendiente',
      fecha: 'Ahora mismo',
      leido: false
    });
  }, [currentUserId, currentUser, pushNotification]);

  const isFriend = useCallback((userId1: string, userId2: string) => {
    return friendships.some(f => 
      (f.user1 === userId1 && f.user2 === userId2) || 
      (f.user1 === userId2 && f.user2 === userId1)
    );
  }, [friendships]);

  const hasPendingRequest = useCallback((fromId: string, toId: string) => {
    return friendRequests.some(r => r.emisorId === fromId && r.receptorId === toId && r.estado === 'pendiente');
  }, [friendRequests]);

  const getFriendsOf = useCallback((userId: string): User[] => {
    const friendIds = friendships
      .filter(f => f.user1 === userId || f.user2 === userId)
      .map(f => f.user1 === userId ? f.user2 : f.user1);
    return users.filter(u => friendIds.includes(u.id));
  }, [friendships, users]);

  // ================= PRIVATE MESSAGES =================
  const sendPrivateMessage = useCallback((receptorId: string, asunto: string, mensaje: string) => {
    const cleanText = mensaje.trim();
    if (!currentUserId || !receptorId || !cleanText) return;

    // Buscar destinatario por ID, username o email
    const targetUser = users.find(u => 
      u.id === receptorId || 
      u.username === receptorId || 
      (u.email && u.email.toLowerCase() === receptorId.toLowerCase())
    );
    const resolvedReceptorId = targetUser?.id || receptorId;

    // Protección anti auto-envío: evitar que el receptor sea el usuario actual
    if (
      resolvedReceptorId === currentUserId ||
      resolvedReceptorId === currentUser.id ||
      (currentUser.username && resolvedReceptorId === currentUser.username) ||
      (currentUser.id === 'user-nightloot' && resolvedReceptorId === 'nightloot') ||
      (currentUser.id === 'nightloot' && resolvedReceptorId === 'user-nightloot')
    ) {
      console.warn('No puedes enviarte un mensaje privado a ti mismo');
      return;
    }

    const resolvedReceptorName = targetUser 
      ? (targetUser.full_name || `${targetUser.nombre} ${targetUser.apellidos}`.trim() || targetUser.nombre)
      : 'Usuario';
    const resolvedReceptorAvatar = targetUser?.avatar || '';

    const newMsg: PrivateMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      emisorId: currentUserId,
      emisorNombre: currentUser.full_name || `${currentUser.nombre} ${currentUser.apellidos}`.trim() || currentUser.nombre || 'Usuario',
      emisorAvatar: currentUser.avatar || '',
      receptorId: resolvedReceptorId,
      receptorNombre: resolvedReceptorName,
      asunto: asunto.trim().slice(0, 150) || 'Sin asunto',
      mensaje: cleanText,
      fecha: 'Ahora mismo',
      leido: false
    };

    setMessages(prev => [newMsg, ...prev]);

    // Notificación en tiempo real para el DESTINATARIO
    const notif: InkoriumNotification = {
      id: `notif-mp-${Date.now()}`,
      tipo: 'mp',
      userId: resolvedReceptorId,
      fromUserId: currentUserId,
      fromUserName: currentUser.full_name || `${currentUser.nombre} ${currentUser.apellidos}`.trim() || currentUser.nombre || 'Usuario',
      fromUserAvatar: currentUser.avatar,
      mensaje: `te ha enviado un mensaje privado: "${asunto.trim() || 'Sin asunto'}"`,
      enlace: 'mensajes',
      targetId: newMsg.id,
      targetPreview: cleanText.slice(0, 80),
      fecha: 'Ahora mismo',
      leido: false
    };
    pushNotification(notif);

    // Toast de confirmación de envío para el usuario REMITENTE
    setToasts(prev => [
      {
        id: `toast-sent-${Date.now()}`,
        tipo: 'mp',
        userId: currentUserId,
        fromUserId: resolvedReceptorId,
        fromUserName: resolvedReceptorName,
        fromUserAvatar: resolvedReceptorAvatar,
        mensaje: `Tu mensaje privado para ${resolvedReceptorName} ha sido enviado correctamente.`,
        enlace: 'mensajes',
        leido: true,
        fecha: 'Ahora mismo',
      },
      ...prev.slice(0, 4)
    ]);

    // Sincronizar en segundo plano si hay Supabase/backend disponible
    void (async () => {
      try {
        if (supabase) {
          const session = await supabase.auth.getSession().catch(() => null);
          const token = session?.data?.session?.access_token;
          await fetch('/api/private-messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {})
            },
            body: JSON.stringify({
              sender_id: currentUserId,
              recipient_id: resolvedReceptorId,
              subject: newMsg.asunto,
              body: cleanText
            })
          }).catch(() => null);
        }
      } catch (err) {
        console.warn('Silent private message backend sync error:', err);
      }
    })();
  }, [currentUserId, currentUser, users, pushNotification]);

  const markMessageAsRead = useCallback((messageId: string) => {
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, leido: true } : m));
    void (async () => {
      try {
        if (supabase) {
          const session = await supabase.auth.getSession().catch(() => null);
          const token = session?.data?.session?.access_token;
          await fetch(`/api/private-messages?id=eq.${encodeURIComponent(messageId)}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {})
            },
            body: JSON.stringify({ is_read: true })
          }).catch(() => null);
        }
      } catch {}
    })();
  }, []);

  const deleteMessage = useCallback((messageId: string) => {
    setMessages(prev => prev.filter(m => m.id !== messageId));
    void (async () => {
      try {
        if (supabase) {
          const session = await supabase.auth.getSession().catch(() => null);
          const token = session?.data?.session?.access_token;
          await fetch(`/api/private-messages?id=eq.${encodeURIComponent(messageId)}`, {
            method: 'DELETE',
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {})
            }
          }).catch(() => null);
        }
      } catch {}
    })();
  }, []);

  // ================= WALL & FEED ACTIONS =================
  const postWallComment = useCallback((propietarioId: string, texto: string) => {
    if (!currentUserId || !texto.trim()) return;
    const newComment: WallComment = {
      id: `wc-${Date.now()}`,
      propietarioId,
      autorId: currentUserId,
      autorNombre: `${currentUser.nombre} ${currentUser.apellidos}`.trim() || 'Usuario',
      autorAvatar: currentUser.avatar || '',
      texto: texto.trim(),
      fecha: 'Ahora mismo',
      likes: []
    };
    setWallComments(prev => [newComment, ...prev]);
    if (propietarioId !== currentUserId) {
      pushNotification({
        id: `notif-wall-${Date.now()}`,
        tipo: 'tablon',
        userId: propietarioId,
        fromUserId: currentUserId,
        fromUserName: `${currentUser.nombre} ${currentUser.apellidos}`.trim() || 'Usuario',
        fromUserAvatar: currentUser.avatar,
        mensaje: 'ha firmado en tu tablón.',
        enlace: 'perfil',
        targetId: newComment.id,
        targetPreview: texto.trim().slice(0, 80),
        fecha: 'Ahora mismo',
        leido: false
      });
    }
  }, [currentUserId, currentUser, pushNotification]);

  const deleteWallComment = useCallback((commentId: string) => {
    setWallComments(prev => prev.filter(c => c.id !== commentId));
  }, []);

  const likeFeedItem = useCallback((feedId: string) => {
    if (!currentUserId) return;
    setFeed(prev => prev.map(item => {
      if (item.id === feedId) {
        const hasLiked = item.likes.includes(currentUserId);
        return {
          ...item,
          likes: hasLiked ? item.likes.filter(id => id !== currentUserId) : [...item.likes, currentUserId]
        };
      }
      return item;
    }));
  }, [currentUserId]);

  const commentFeedItem = useCallback((feedId: string, text: string) => {
    if (!currentUserId || !text.trim()) return;
    setFeed(prev => prev.map(item => {
      if (item.id === feedId) {
        return {
          ...item,
          comentarios: [
            ...item.comentarios,
            {
              id: `c-${Date.now()}`,
              autorId: currentUserId,
              autorNombre: `${currentUser.nombre} ${currentUser.apellidos}`.trim() || 'Usuario',
              autorAvatar: currentUser.avatar,
              texto: text.trim(),
              fecha: 'Ahora mismo'
            }
          ]
        };
      }
      return item;
    }));
  }, [currentUserId, currentUser]);

  const likePhoto = useCallback((photoId: string) => {
    if (!currentUserId) return;
    setPhotos(prev => prev.map(photo => {
      if (photo.id === photoId) {
        const hasLiked = photo.likes.includes(currentUserId);
        return {
          ...photo,
          likes: hasLiked ? photo.likes.filter(id => id !== currentUserId) : [...photo.likes, currentUserId]
        };
      }
      return photo;
    }));
  }, [currentUserId]);

  const addPhotoComment = useCallback((photoId: string, comentario: string) => {
    if (!currentUserId || !comentario.trim()) return;
    setPhotos(prev => prev.map(photo => {
      if (photo.id === photoId) {
        return {
          ...photo,
          comentarios: [
            ...photo.comentarios,
            {
              id: `pc-${Date.now()}`,
              autorId: currentUserId,
              autorNombre: `${currentUser.nombre} ${currentUser.apellidos}`.trim() || 'Usuario',
              autorAvatar: currentUser.avatar,
              texto: comentario.trim(),
              fecha: 'Ahora mismo'
            }
          ]
        };
      }
      return photo;
    }));
  }, [currentUserId, currentUser]);

  const setPhotoAsAvatar = useCallback((photoId: string) => {
    const photo = photos.find(p => p.id === photoId);
    if (photo?.archivo) {
      updateUserData({ avatar: photo.archivo });
    }
  }, [photos, updateUserData]);

  const deletePhoto = useCallback((photoId: string) => {
    setPhotos(prev => prev.filter(p => p.id !== photoId));
  }, []);

  const createAlbum = useCallback((nombre: string, descripcion?: string) => {
    if (!currentUserId || !nombre.trim()) return;
    const newAlbum: Album = {
      id: `alb-${Date.now()}`,
      propietarioId: currentUserId,
      nombre: nombre.trim(),
      descripcion: descripcion?.trim() || '',
      portada: '',
      numFotos: 0,
      fecha: new Date().toLocaleDateString('es-ES')
    };
    setAlbums(prev => [...prev, newAlbum]);
  }, [currentUserId]);

  const renameAlbum = useCallback((albumId: string, nuevoNombre: string) => {
    setAlbums(prev => prev.map(a => a.id === albumId ? { ...a, nombre: nuevoNombre.trim() } : a));
  }, []);

  const deleteAlbum = useCallback((albumId: string) => {
    setAlbums(prev => prev.filter(a => a.id !== albumId));
  }, []);

  const addPhotoTag = useCallback((photoId: string, targetUserId: string, x: number, y: number) => {
    const target = users.find(u => u.id === targetUserId);
    setPhotos(prev => prev.map(photo => {
      if (photo.id === photoId) {
        return {
          ...photo,
          etiquetas: [
            ...photo.etiquetas,
            {
              id: `tag-${Date.now()}`,
              usuarioId: targetUserId,
              nombre: target ? `${target.nombre} ${target.apellidos}`.trim() : 'Usuario',
              x,
              y
            }
          ]
        };
      }
      return photo;
    }));
  }, [users]);

  const removePhotoTag = useCallback((photoId: string, tagId: string) => {
    setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, etiquetas: p.etiquetas.filter(t => t.id !== tagId) } : p));
  }, []);

  const setChatEstado = useCallback((estado: '1' | '0') => {
    updateUserData({ chatEstado: estado });
  }, [updateUserData]);

  const logUserActivity = useCallback((_activity: Omit<UserActivity, 'id' | 'timestamp'>) => {}, []);
  const deleteUserActivity = useCallback((_activityId: string) => {}, []);
  const getUserActivities = useCallback((_userId: string) => activities, [activities]);

  const resetToDefaultData = useCallback(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    setUsers(INITIAL_USERS);
    setMessages(INITIAL_MESSAGES);
    setNotifications(INITIAL_NOTIFICATIONS);
    setFriendRequests(INITIAL_FRIEND_REQUESTS);
    setFriendships(INITIAL_FRIENDSHIPS);
    setWallComments(INITIAL_WALL_COMMENTS);
    setPhotos(INITIAL_PHOTOS);
    setAlbums(INITIAL_ALBUMS);
    setFeed(INITIAL_FEED);
  }, []);

  // Realtime simulation events
  const simulateIncomingMessage = useCallback(() => {
    const randomFriend = users.find(u => u.id !== currentUserId) || users[1];
    if (!randomFriend) return;
    const msgId = `msg-sim-${Date.now()}`;
    const newMsg: PrivateMessage = {
      id: msgId,
      emisorId: randomFriend.id,
      emisorNombre: `${randomFriend.nombre} ${randomFriend.apellidos}`.trim(),
      emisorAvatar: randomFriend.avatar,
      receptorId: currentUserId,
      receptorNombre: `${currentUser.nombre} ${currentUser.apellidos}`.trim(),
      asunto: '¿Qué tal estás? :)',
      mensaje: '¡Hola! Te escribía para ver si vas a salir luego por el centro.',
      fecha: 'Ahora mismo',
      leido: false
    };
    setMessages(prev => [newMsg, ...prev]);
    pushNotification({
      id: `notif-sim-mp-${Date.now()}`,
      tipo: 'mp',
      userId: currentUserId,
      fromUserId: randomFriend.id,
      fromUserName: `${randomFriend.nombre} ${randomFriend.apellidos}`.trim(),
      fromUserAvatar: randomFriend.avatar,
      mensaje: 'te ha enviado un mensaje privado: "¿Qué tal estás? :)"',
      enlace: 'mensajes',
      targetId: msgId,
      targetPreview: newMsg.mensaje,
      fecha: 'Ahora mismo',
      leido: false
    });
  }, [currentUserId, currentUser, users, pushNotification]);

  const simulateWallComment = useCallback(() => {
    const randomFriend = users.find(u => u.id !== currentUserId) || users[1];
    if (!randomFriend) return;
    const commentId = `wc-sim-${Date.now()}`;
    const newComment: WallComment = {
      id: commentId,
      propietarioId: currentUserId,
      autorId: randomFriend.id,
      autorNombre: `${randomFriend.nombre} ${randomFriend.apellidos}`.trim(),
      autorAvatar: randomFriend.avatar,
      texto: '¡Esa foto de perfil está genial! Saludos!',
      fecha: 'Ahora mismo',
      likes: []
    };
    setWallComments(prev => [newComment, ...prev]);
    pushNotification({
      id: `notif-sim-wc-${Date.now()}`,
      tipo: 'tablon',
      userId: currentUserId,
      fromUserId: randomFriend.id,
      fromUserName: `${randomFriend.nombre} ${randomFriend.apellidos}`.trim(),
      fromUserAvatar: randomFriend.avatar,
      mensaje: 'ha firmado en tu tablón.',
      enlace: 'perfil',
      targetId: commentId,
      targetPreview: newComment.texto,
      fecha: 'Ahora mismo',
      leido: false
    });
  }, [currentUserId, users, pushNotification]);

  const simulateFriendRequest = useCallback(() => {
    const candidate = users.find(u => u.id !== currentUserId && !friendships.some(f => (f.user1 === currentUserId && f.user2 === u.id) || (f.user2 === currentUserId && f.user1 === u.id))) || users[2];
    if (!candidate) return;
    const reqId = `req-sim-${Date.now()}`;
    const newReq: FriendRequest = {
      id: reqId,
      emisorId: candidate.id,
      emisorNombre: `${candidate.nombre} ${candidate.apellidos}`.trim(),
      emisorAvatar: candidate.avatar,
      emisorProvincia: candidate.provincia,
      receptorId: currentUserId,
      fecha: 'Ahora mismo',
      estado: 'pendiente'
    };
    setFriendRequests(prev => [newReq, ...prev]);
    pushNotification({
      id: `notif-sim-req-${Date.now()}`,
      tipo: 'peticion',
      userId: currentUserId,
      fromUserId: candidate.id,
      fromUserName: `${candidate.nombre} ${candidate.apellidos}`.trim(),
      fromUserAvatar: candidate.avatar,
      mensaje: 'te ha enviado una petición de amistad.',
      enlace: 'notificaciones',
      targetId: reqId,
      estadoPeticion: 'pendiente',
      fecha: 'Ahora mismo',
      leido: false
    });
  }, [currentUserId, users, friendships, pushNotification]);

  const simulatePhotoInteraction = useCallback(() => {
    const randomFriend = users.find(u => u.id !== currentUserId) || users[1];
    if (!randomFriend || photos.length === 0) return;
    const targetPhoto = photos[0];
    pushNotification({
      id: `notif-sim-photo-${Date.now()}`,
      tipo: 'foto_comentario',
      userId: currentUserId,
      fromUserId: randomFriend.id,
      fromUserName: `${randomFriend.nombre} ${randomFriend.apellidos}`.trim(),
      fromUserAvatar: randomFriend.avatar,
      mensaje: 'ha comentado en tu foto.',
      enlace: 'fotos',
      targetId: targetPhoto.id,
      targetPreview: '¡Fotón!',
      photoThumbnail: targetPhoto.archivo,
      fecha: 'Ahora mismo',
      leido: false
    });
  }, [currentUserId, users, photos, pushNotification]);

  // Dynamic counts for current user
  const effectiveUserId = currentUserId || 'nightloot';
  const unreadMessagesCount = messages.filter(m => (m.receptorId === effectiveUserId || m.receptorId === currentUser.id) && !m.leido).length;
  const unreadNotificationsCount = notifications.filter(n => (n.userId === effectiveUserId || n.userId === currentUser.id) && !n.leido).length;
  const pendingRequestsCount = friendRequests.filter(r => (r.receptorId === effectiveUserId || r.receptorId === currentUser.id) && r.estado === 'pendiente').length;

  return (
    <InkoriumContext.Provider value={{
      currentUser, users, photos, albums, feed, wallComments, messages, friendRequests, friendships, chatMessages,
      notifications, toasts, accessLogs, activities, activeChatWindows, activeTab, selectedUserId, selectedPhotoId, selectedAlbumId,
      composeRecipientId,
      unreadMessagesCount, unreadNotificationsCount, pendingRequestsCount,
      isRealtimeSimulationEnabled, isLoggedIn, setActiveTab, viewUserProfile, openComposeMessage, viewPhoto, viewAlbum, setCurrentUserById,
      login, loginAsUser, logout, publishStatus, updateStatusText, updateUserPresence,
      likeFeedItem, commentFeedItem, postWallComment, deleteWallComment,
      uploadPhoto, addPhotoTag, removePhotoTag, addPhotoComment, likePhoto,
      setPhotoAsAvatar, deletePhoto, createAlbum, renameAlbum, deleteAlbum,
      sendFriendRequest, acceptFriendRequest, ignoreFriendRequest, removeFriendship, cancelFriendRequest, isFriend, hasPendingRequest, getFriendsOf,
      sendPrivateMessage, markMessageAsRead, deleteMessage,
      sendChatMessage, openChatWith, closeChat, toggleMinimizeChat, setChatEstado,
      logUserActivity, deleteUserActivity, getUserActivities,
      pushNotification, dismissToast, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification,
      setIsRealtimeSimulationEnabled: setIsRealtime, simulateIncomingMessage, simulateWallComment,
      simulateFriendRequest, simulatePhotoInteraction, updateUserData, resetToDefaultData, registerNewUser
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
