import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { User, Photo, Album, FeedItem, WallComment, PrivateMessage, FriendRequest, Friendship, ChatMessage, ChatWindow, InkoriumNotification, AccessLog, UserActivity, UserPresence, ThemeMode, Track, RepeatMode, PhotoComment, PhotoTag, PhotoPrivacy, SocialEvent, EventAttendanceStatus, EventAttendee, EventComment, EventPhoto, ProfileVisit, TuentiPage, PagePost, UserInvitation, GameScore, CampusCommunity, CampusPost, CampusReply, getCountryByZone } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { fetchPosts, createPost } from '../lib/postsApi';
import { fetchPhotos, insertPhoto, addPhotoTagApi, removePhotoTagApi, updatePhotoPrivacyApi, addPhotoCommentApi, likePhotoApi } from '../lib/photosApi';
import { INITIAL_USERS, INITIAL_ALBUMS, INITIAL_PHOTOS, INITIAL_FEED, INITIAL_WALL_COMMENTS, INITIAL_FRIENDSHIPS, INITIAL_FRIEND_REQUESTS, INITIAL_MESSAGES, INITIAL_NOTIFICATIONS, INITIAL_ACCESS_LOGS, INITIAL_ACTIVITIES } from '../data/mockData';
import { INITIAL_EVENTS, INITIAL_PAGES, INITIAL_GAME_SCORES } from '../data/mockEventsAndPages';
import { INITIAL_CAMPUS_COMMUNITIES } from '../data/mockCampus';
import { INITIAL_MUSIC_TRACKS } from '../data/musicTracks';
import { musicAudioEngine } from '../utils/audioEngine';
import { appendMessageToConversation, updateMessageInConversation, normalizeUserId, broadcastCrossTabEvent, subscribeCrossTabEvents, markConversationAsRead, applyReadReceiptsToConversation, getStoredBlockedUserIds, saveStoredBlockedUserIds } from '../lib/chatHistory';
import { playMessageSound, playNotificationChime, playNudgeSound } from '../utils/sound';
import { RealtimeManager } from '../lib/realtimeManager';

const PROFILE_SELECT = [
  'id',
  'username',
  'full_name',
  'avatar_url',
  'city',
  'country',
  'province',
  'birth_date',
  'user_status',
  'profile_interests',
  'updated_at',
  'relationship_status',
  'occupation',
  'music',
  'gender',
  'presence'
].join(',');

export function toProfileAvatarUrl(value: unknown, name = 'Usuario'): string {
  const raw = String(value ?? '').trim();
  if (!raw || raw.startsWith('/api/profile-avatar') || raw.startsWith('data:') || raw.startsWith('blob:')) return raw;

  if (raw.includes('avatar-resolver')) {
    const uuidMatch = raw.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    const userId = uuidMatch ? uuidMatch[0] : '';
    return `/api/profile-avatar?${userId ? `userId=${encodeURIComponent(userId)}&` : ''}name=${encodeURIComponent(name)}`;
  }

  try {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const parsed = new URL(raw, origin);
    const pathname = decodeURIComponent(parsed.pathname || '').replace(/^\/+/, '');
    for (const marker of ['avatars/', 'user-avatars/', 'profile-media/', 'photos/', 'wall/']) {
      const index = pathname.indexOf(marker);
      if (index >= 0) {
        const key = pathname.slice(index);
        if (!key || key.includes('..') || key.includes('\\')) return raw;
        return `/api/profile-avatar?key=${encodeURIComponent(key)}&name=${encodeURIComponent(name)}`;
      }
    }
  } catch {}

  const clean = raw.replace(/^\/+/, '');
  for (const marker of ['avatars/', 'user-avatars/', 'profile-media/', 'photos/', 'wall/']) {
    if (clean.startsWith(marker)) {
      return `/api/profile-avatar?key=${encodeURIComponent(clean)}&name=${encodeURIComponent(name)}`;
    }
  }

  return raw;
}

const PHOTO_TAGS_STORAGE_KEY = 'inkorium:photo_tags';

export function safeSetLocalStorage(key: string, value: string): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(key, value);
  } catch (err) {
    console.warn(`[Inkorium] localStorage write failed for key "${key}":`, err);
  }
}

function getStoredTagsMap(): Record<string, PhotoTag[]> {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(PHOTO_TAGS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function getStoredTagsForPhoto(photoId: string): PhotoTag[] {
  if (!photoId) return [];
  const map = getStoredTagsMap();
  const tags = map[photoId];
  return Array.isArray(tags) ? tags : [];
}

function saveStoredTagsForPhoto(photoId: string, tags: PhotoTag[]) {
  if (typeof localStorage === 'undefined' || !photoId) return;
  try {
    const map = getStoredTagsMap();
    map[photoId] = tags;
    safeSetLocalStorage(PHOTO_TAGS_STORAGE_KEY, JSON.stringify(map));
  } catch {}
}

interface InkoriumContextType {
  currentUser: User; users: User[]; photos: Photo[]; albums: Album[]; feed: FeedItem[]; wallComments: WallComment[];
  messages: PrivateMessage[]; friendRequests: FriendRequest[]; friendships: Friendship[]; chatMessages: ChatMessage[];
  notifications: InkoriumNotification[]; toasts: InkoriumNotification[]; accessLogs: AccessLog[]; activities: UserActivity[];
  activeChatWindows: ChatWindow[]; activeTab: 'inicio' | 'perfil' | 'gente' | 'fotos' | 'mensajes' | 'notificaciones' | 'ajustes' | 'musica' | 'eventos' | 'paginas' | 'juegos' | 'campus';
  selectedUserId: string; selectedPhotoId: string | null; selectedAlbumId: string | null;
  composeRecipientId: string | null;
  // Anti-Algoritmo Mode
  isAntiAlgorithmMode: boolean;
  toggleAntiAlgorithmMode: () => void;
  // Retro Tuenti Features
  events: SocialEvent[];
  pages: TuentiPage[];
  profileVisits: ProfileVisit[];
  gameScores: GameScore[];
  selectedEventId: string | null;
  setSelectedEventId: (id: string | null) => void;
  selectedPageId: string | null;
  setSelectedPageId: (id: string | null) => void;
  isInvitationsModalOpen: boolean;
  setIsInvitationsModalOpen: (open: boolean) => void;
  createEvent: (eventData: Omit<SocialEvent, 'id' | 'creadorId' | 'creadorNombre' | 'creadorAvatar' | 'asistentes' | 'comentarios'>) => string;
  rsvpEvent: (eventId: string, status: EventAttendanceStatus) => void;
  commentEvent: (eventId: string, text: string) => void;
  deleteEvent: (eventId: string) => void;
  addEventPhoto: (eventId: string, photoData: { url: string; caption?: string }) => void;
  // Campus y Comunidades Locales
  campusCommunities: CampusCommunity[];
  selectedCampusId: string | null;
  setSelectedCampusId: (id: string | null) => void;
  joinCampus: (campusId: string) => void;
  leaveCampus: (campusId: string) => void;
  postToCampus: (campusId: string, tipo: CampusPost['tipo'], texto: string, titulo?: string) => void;
  replyToCampusPost: (campusId: string, postId: string, texto: string) => void;
  createCampus: (data: Omit<CampusCommunity, 'id' | 'miembros' | 'posts'>) => string;
  createPage: (pageData: Omit<TuentiPage, 'id' | 'creadorId' | 'seguidores' | 'fechaCreacion' | 'posts'>) => string;
  toggleFollowPage: (pageId: string) => void;
  postPageComment: (pageId: string, text: string, fotoUrl?: string) => void;
  recordProfileVisit: (targetUserId: string) => void;
  updateTopAmigos: (friendIds: string[]) => void;
  unreadMessagesCount: number; unreadNotificationsCount: number; pendingRequestsCount: number;
  isLoggedIn: boolean;
  theme: ThemeMode; isDarkMode: boolean; setTheme: (theme: ThemeMode) => void; toggleTheme: () => void;
  // Music System
  currentTrack: Track | null; isMusicPlaying: boolean; musicPosition: number; musicDuration: number;
  musicVolume: number; isMusicMuted: boolean; isMusicShuffled: boolean; musicRepeatMode: RepeatMode;
  musicPlaylist: Track[]; isMusicPlayerOpen: boolean; isMusicPlayerMinimized: boolean;
  playTrack: (track: Track, openExpanded?: boolean) => void; pauseMusic: () => void; resumeMusic: () => void; togglePlayMusic: () => void;
  nextTrack: () => void; prevTrack: () => void; seekMusic: (seconds: number) => void;
  setMusicVolume: (volume: number) => void; toggleMusicMute: () => void;
  toggleMusicShuffle: () => void; toggleMusicRepeat: () => void;
  setIsMusicPlayerOpen: (open: boolean) => void; setIsMusicPlayerMinimized: (minimized: boolean) => void;
  openMusicPlayer: (track?: Track, openExpanded?: boolean) => void; addCustomTrack: (track: Omit<Track, 'id'>) => void;
  removeTrackFromPlaylist: (trackId: string) => void;
  setActiveTab: (tab: InkoriumContextType['activeTab']) => void; viewUserProfile: (userId: string) => void;
  openComposeMessage: (recipientId?: string) => void;
  viewPhoto: (photoId: string | null) => void; viewAlbum: (albumId: string | null) => void; setCurrentUserById: (userId: string) => void;
  login: (email: string, password?: string) => { success: boolean; error?: string }; loginAsUser: (userId: string) => void; logout: () => void;
  publishStatus: (statusText: string, attachedPhotoUrl?: string) => void; updateStatusText: (statusText: string) => void;
  updateUserPresence: (presencia: UserPresence) => void; likeFeedItem: (feedId: string) => void; commentFeedItem: (feedId: string, text: string) => void;
  postWallComment: (receptorId: string, text: string) => void; deleteWallComment: (commentId: string) => void;
  uploadPhoto: (titulo: string, albumId: string | null, archivoUrl: string, privacidad?: PhotoPrivacy, allowedUserIds?: string[]) => void;
  updatePhotoPrivacy: (photoId: string, privacidad: PhotoPrivacy, allowedUserIds?: string[]) => void;
  canUserViewPhoto: (photo: Photo, viewerUserId?: string) => boolean;
  addPhotoTag: (photoId: string, targetUserId: string, x: number, y: number) => void;
  removePhotoTag: (photoId: string, tagId: string) => void; addPhotoComment: (photoId: string, comentario: string) => void; likePhoto: (photoId: string) => void;
  setPhotoAsAvatar: (photoId: string) => void; deletePhoto: (photoId: string) => void; createAlbum: (nombre: string, descripcion?: string) => string | undefined;
  renameAlbum: (albumId: string, nuevoNombre: string) => void; deleteAlbum: (albumId: string) => void;
  sendFriendRequest: (targetUserId: string) => void; acceptFriendRequest: (requestId: string) => void; ignoreFriendRequest: (requestId: string) => void;
  removeFriendship: (targetUserId: string) => void; cancelFriendRequest: (targetUserId: string) => void;
  isFriend: (userId1: string, userId2: string) => boolean; hasPendingRequest: (fromId: string, toId: string) => boolean; getFriendsOf: (userId: string) => User[];
  sendPrivateMessage: (receptorId: string, asunto: string, mensaje: string) => void; markMessageAsRead: (messageId: string) => void; deleteMessage: (messageId: string) => void; deleteConversation: (targetUserId: string) => void;
  openChatWith: (targetUserId: string) => void; closeChat: (targetUserId: string) => void; toggleMinimizeChat: (targetUserId: string) => void;
  sendChatMessage: (targetUserId: string, text: string, imageUrl?: string, fileData?: { url: string; name: string; size?: number; type?: string }) => void; 
  sendChatNudge: (targetUserId: string) => void;
  reactToChatMessage: (targetUserId: string, messageId: string, emoji: string) => void;
  sendChatTyping: (targetUserId: string, isTyping: boolean) => void;
  sendChatReadReceipt: (targetUserId: string, messageIds?: string[]) => void;
  setChatEstado: (estado: '1' | '0') => void;
  blockedUserIds: string[];
  blockUser: (targetUserId: string) => void;
  unblockUser: (targetUserId: string) => void;
  isUserBlocked: (targetUserId: string) => boolean;
  logUserActivity: (activity: Omit<UserActivity, 'id' | 'timestamp'>) => void; deleteUserActivity: (activityId: string) => void; getUserActivities: (userId: string) => UserActivity[];
  pushNotification: (notif: InkoriumNotification) => void; dismissToast: (toastId: string) => void; markNotificationAsRead: (notifId: string) => void;
  markAllNotificationsAsRead: () => void; deleteNotification: (notifId: string) => void;
  updateUserData: (data: Partial<User>) => void; resetToDefaultData: () => void; registerNewUser: (nombre: string, apellidos: string, email: string, sexo: 'h' | 'm', provincia: string, fnac: string, pais?: string, ciudad?: string) => void;
  refreshProfiles: () => Promise<void>;
}

const InkoriumContext = createContext<InkoriumContextType | undefined>(undefined);
const EMPTY_USER: User = { 
  id: '', 
  nombre: '', 
  apellidos: '', 
  email: '', 
  sexo: 'otro', 
  fnac: '', 
  provincia: '', 
  ciudad: undefined, 
  estado: '', 
  estadoFecha: '', 
  situacionSentimental: 'Soltero/a', 
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80', 
  fechaReg: '', 
  online: false, 
  ultimoAcceso: '', 
  chatEstado: '0' 
};

const isMockId = (id: string | undefined | null): boolean => {
  if (!id) return false;
  const s = String(id).toLowerCase();
  return (
    s === 'user-1' || s === 'user-2' || s === 'user-3' || s === 'user-4' ||
    s === 'user-5' || s === 'user-6' || s === 'user-7' || s === 'user-8' ||
    s === 'user-9' || s === 'user-10' || s === 'user-11' || s === 'user-12' ||
    s === '1' || s === '2' || s === '3' ||
    s === 'user-nightloot' || s === 'nightloot' ||
    s === 'user-elena' || s === 'user-carlos' || s === 'user-laura'
  );
};

export const InkoriumProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const storedUserId = typeof localStorage !== 'undefined' ? localStorage.getItem('inkorium:user_id') : null;
  const storedLoggedIn = typeof localStorage !== 'undefined' ? localStorage.getItem('inkorium:is_logged_in') === 'true' : false;

  const [users, setUsers] = useState<User[]>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('inkorium:users');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const clean = parsed.filter(u => !isMockId(u.id));
            return clean;
          }
        } catch {}
      }
    }
    return INITIAL_USERS;
  });

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    if (storedUserId && !isMockId(storedUserId)) return storedUserId;
    return '';
  });
  const [photos, setPhotos] = useState<Photo[]>(() => {
    if (typeof localStorage !== 'undefined') {
      const storedTagsMap = getStoredTagsMap();
      const saved = localStorage.getItem('inkorium:photos');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map((p: Photo) => {
              const tags = storedTagsMap[p.id];
              return {
                ...p,
                etiquetas: (Array.isArray(p.etiquetas) && p.etiquetas.length > 0)
                  ? p.etiquetas
                  : (Array.isArray(tags) && tags.length > 0 ? tags : [])
              };
            });
          }
        } catch {}
      }
      return INITIAL_PHOTOS.map(p => {
        const tags = storedTagsMap[p.id];
        return (Array.isArray(tags) && tags.length > 0) ? { ...p, etiquetas: tags } : p;
      });
    }
    return INITIAL_PHOTOS;
  });

  // Sync photos to localStorage
  useEffect(() => {
    safeSetLocalStorage('inkorium:photos', JSON.stringify(photos));
  }, [photos]);
  const [albums, setAlbums] = useState<Album[]>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('inkorium:albums');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        } catch {}
      }
    }
    return INITIAL_ALBUMS;
  });

  // Sync albums to localStorage
  useEffect(() => {
    safeSetLocalStorage('inkorium:albums', JSON.stringify(albums));
  }, [albums]);
  const [feed, setFeed] = useState<FeedItem[]>(INITIAL_FEED);
  const [wallComments, setWallComments] = useState<WallComment[]>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('inkorium:wall_comments');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            return parsed.filter(w => !isMockId(w.autorId) && !isMockId(w.propietarioId) && !isMockId(w.receptorId));
          }
        } catch {}
      }
    }
    return INITIAL_WALL_COMMENTS;
  });

const getDeletedMessageIds = (): Set<string> => {
  if (typeof localStorage === 'undefined') return new Set();
  try {
    const saved = localStorage.getItem('inkorium:deleted_message_ids');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return new Set(parsed);
    }
  } catch {}
  return new Set();
};

const addDeletedMessageIds = (ids: string[]) => {
  if (typeof localStorage === 'undefined' || ids.length === 0) return;
  try {
    const currentSet = getDeletedMessageIds();
    ids.forEach(id => {
      if (id) currentSet.add(id);
    });
    localStorage.setItem('inkorium:deleted_message_ids', JSON.stringify(Array.from(currentSet)));
  } catch {}
};

  const [messages, setMessages] = useState<PrivateMessage[]>(() => {
    const deletedIds = getDeletedMessageIds();
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('inkorium:messages') || localStorage.getItem('inkorium:private_messages');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.filter(m => !isMockId(m.emisorId) && !isMockId(m.receptorId) && !deletedIds.has(m.id));
          }
        } catch {}
      }
    }
    return INITIAL_MESSAGES.filter(m => !deletedIds.has(m.id));
  });

  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('inkorium:friend_requests');
      if (saved) {
        try { 
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed.filter(r => !isMockId(r.emisorId) && !isMockId(r.receptorId));
        } catch {}
      }
    }
    return INITIAL_FRIEND_REQUESTS;
  });

  const [friendships, setFriendships] = useState<Friendship[]>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('inkorium:friendships');
      if (saved) {
        try { 
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed.filter(f => !isMockId(f.user1) && !isMockId(f.user2));
        } catch {}
      }
    }
    return INITIAL_FRIENDSHIPS;
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [notifications, setNotifications] = useState<InkoriumNotification[]>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('inkorium:notifications');
      if (saved) {
        try { 
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed.filter(n => !isMockId(n.userId) && !isMockId(n.fromUserId));
        } catch {}
      }
    }
    return INITIAL_NOTIFICATIONS;
  });

  const [toasts, setToasts] = useState<InkoriumNotification[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>(INITIAL_ACCESS_LOGS);
  const [activities, setActivities] = useState<UserActivity[]>(INITIAL_ACTIVITIES);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(storedLoggedIn);
  const [activeTab, setActiveTabState] = useState<InkoriumContextType['activeTab']>('inicio');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [composeRecipientId, setComposeRecipientId] = useState<string | null>(null);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [isInvitationsModalOpen, setIsInvitationsModalOpen] = useState(false);

  // Retro Tuenti Features State
  const [events, setEvents] = useState<SocialEvent[]>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('inkorium:events');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch {}
      }
    }
    return INITIAL_EVENTS;
  });

  const [pages, setPages] = useState<TuentiPage[]>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('inkorium:pages');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch {}
      }
    }
    return INITIAL_PAGES;
  });

  const [profileVisits, setProfileVisits] = useState<ProfileVisit[]>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('inkorium:profile_visits');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            // Filter out any mock/simulated visits - visits must be 100% real
            const clean = parsed.filter(v => v && !String(v.id).startsWith('vis-1') && !String(v.id).startsWith('vis-2') && !String(v.id).startsWith('vis-3') && !isMockId(v.visitorId));
            return clean;
          }
        } catch {}
      }
    }
    // No simulated visits - starts empty and only records real visits
    return [];
  });

  const [gameScores, setGameScores] = useState<GameScore[]>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('inkorium:game_scores');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch {}
      }
    }
    return INITIAL_GAME_SCORES;
  });

  // Anti-Algoritmo state (Active by default for real friends intimate web)
  const [isAntiAlgorithmMode, setIsAntiAlgorithmMode] = useState<boolean>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('inkorium:anti_algorithm');
      if (saved !== null) return saved === 'true';
    }
    return true;
  });

  const toggleAntiAlgorithmMode = useCallback(() => {
    setIsAntiAlgorithmMode(prev => {
      const next = !prev;
      safeSetLocalStorage('inkorium:anti_algorithm', String(next));
      return next;
    });
  }, []);

  // Campus y Comunidades Locales state
  const [selectedCampusId, setSelectedCampusId] = useState<string | null>(null);
  const [campusCommunities, setCampusCommunities] = useState<CampusCommunity[]>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('inkorium:campus');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch {}
      }
    }
    return INITIAL_CAMPUS_COMMUNITIES;
  });

  const [activeChatWindows, setActiveChatWindows] = useState<ChatWindow[]>([]);
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>(() => {
    return getStoredBlockedUserIds(storedUserId || '');
  });

  // Dark/Light Theme state with LocalStorage persistence
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('inkorium:theme');
      if (saved === 'dark' || saved === 'light' || saved === 'auto') return saved as ThemeMode;
    }
    return 'light';
  });

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem('inkorium:theme');
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    const computeAndApply = () => {
      let darkActive = false;
      if (theme === 'dark') {
        darkActive = true;
      } else if (theme === 'light') {
        darkActive = false;
      } else {
        darkActive = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }

      setIsDarkMode(darkActive);
      if (darkActive) {
        root.classList.add('dark');
        body.classList.add('dark');
      } else {
        root.classList.remove('dark');
        body.classList.remove('dark');
      }
    };

    computeAndApply();

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('inkorium:theme', theme);
    }

    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => computeAndApply();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [theme]);

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState(prev => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  // Sync blocked users for current user from localStorage & server
  useEffect(() => {
    if (currentUserId) {
      setBlockedUserIds(getStoredBlockedUserIds(currentUserId));
      fetch(`/api/chat-blocks?userId=${encodeURIComponent(currentUserId)}`)
        .then(r => r.json())
        .then(data => {
          if (data && Array.isArray(data.blockedUserIds)) {
            setBlockedUserIds(prev => {
              const merged = Array.from(new Set([...prev, ...data.blockedUserIds]));
              saveStoredBlockedUserIds(currentUserId, merged);
              return merged;
            });
          }
        })
        .catch(() => null);
    } else {
      setBlockedUserIds([]);
    }
  }, [currentUserId]);

  // ==========================================
  // MUSIC PLAYER STATE & CONTROLS
  // ==========================================
  const [musicPlaylist, setMusicPlaylist] = useState<Track[]>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('inkorium:music_playlist');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch {}
      }
    }
    return INITIAL_MUSIC_TRACKS;
  });

  const [currentTrack, setCurrentTrack] = useState<Track | null>(() => {
    if (typeof localStorage !== 'undefined') {
      const savedId = localStorage.getItem('inkorium:current_track_id');
      if (savedId) {
        const found = INITIAL_MUSIC_TRACKS.find(t => t.id === savedId);
        if (found) return found;
      }
    }
    return INITIAL_MUSIC_TRACKS[0] || null;
  });

  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [musicPosition, setMusicPosition] = useState(0);
  const [musicDuration, setMusicDuration] = useState(INITIAL_MUSIC_TRACKS[0]?.duration || 194);
  const [musicVolume, setMusicVolumeState] = useState<number>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('inkorium:music_volume');
      if (saved) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed)) return parsed;
      }
    }
    return 0.8;
  });
  const [isMusicMuted, setIsMusicMuted] = useState(false);
  const [isMusicShuffled, setIsMusicShuffled] = useState(false);
  const [musicRepeatMode, setMusicRepeatMode] = useState<RepeatMode>('all');
  const [isMusicPlayerOpen, setIsMusicPlayerOpen] = useState(false);
  const [isMusicPlayerMinimized, setIsMusicPlayerMinimized] = useState(true);

  // Sync playlist to storage
  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('inkorium:music_playlist', JSON.stringify(musicPlaylist));
    }
  }, [musicPlaylist]);

  // Sync current track id
  useEffect(() => {
    if (typeof localStorage !== 'undefined' && currentTrack) {
      localStorage.setItem('inkorium:current_track_id', currentTrack.id);
    }
  }, [currentTrack]);

  // Sync volume
  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('inkorium:music_volume', String(musicVolume));
    }
    musicAudioEngine.setVolume(isMusicMuted ? 0 : musicVolume);
  }, [musicVolume, isMusicMuted]);

  // Music callbacks reference for nextTrack in engine onEnded
  const playlistRef = useRef(musicPlaylist);
  playlistRef.current = musicPlaylist;
  const currentTrackRef = useRef(currentTrack);
  currentTrackRef.current = currentTrack;
  const shuffleRef = useRef(isMusicShuffled);
  shuffleRef.current = isMusicShuffled;
  const repeatRef = useRef(musicRepeatMode);
  repeatRef.current = musicRepeatMode;

  const nextTrackInternal = useCallback(() => {
    const list = playlistRef.current;
    const current = currentTrackRef.current;
    if (list.length === 0) return;

    if (repeatRef.current === 'one' && current) {
      musicAudioEngine.play(current, 0);
      return;
    }

    if (shuffleRef.current && list.length > 1) {
      const remaining = list.filter(t => t.id !== current?.id);
      const randomTrack = remaining[Math.floor(Math.random() * remaining.length)] || list[0];
      setCurrentTrack(randomTrack);
      setMusicPosition(0);
      setMusicDuration(randomTrack.duration);
      musicAudioEngine.play(randomTrack, 0);
      return;
    }

    const currentIndex = current ? list.findIndex(t => t.id === current.id) : -1;
    let nextIndex = currentIndex + 1;
    if (nextIndex >= list.length) {
      if (repeatRef.current === 'off') {
        setIsMusicPlaying(false);
        setMusicPosition(0);
        return;
      }
      nextIndex = 0;
    }

    const nextTrk = list[nextIndex] || list[0];
    setCurrentTrack(nextTrk);
    setMusicPosition(0);
    setMusicDuration(nextTrk.duration);
    musicAudioEngine.play(nextTrk, 0);
  }, []);

  // Setup engine callbacks
  useEffect(() => {
    musicAudioEngine.setCallbacks(
      (time, dur) => {
        setMusicPosition(time);
        setMusicDuration(dur);
      },
      () => {
        nextTrackInternal();
      },
      (playing) => {
        setIsMusicPlaying(playing);
      }
    );
  }, [nextTrackInternal]);

  const playTrack = useCallback((track: Track, openExpanded: boolean = false) => {
    setCurrentTrack(track);
    setMusicPosition(0);
    setMusicDuration(track.duration);
    setIsMusicPlayerOpen(true);
    setIsMusicPlayerMinimized(!openExpanded);
    // If not in playlist, add it
    setMusicPlaylist(prev => {
      if (prev.some(t => t.id === track.id)) return prev;
      return [track, ...prev];
    });
    musicAudioEngine.play(track, 0);
  }, []);

  const pauseMusic = useCallback(() => {
    musicAudioEngine.pause();
    setIsMusicPlaying(false);
  }, []);

  const resumeMusic = useCallback(() => {
    if (!currentTrack && musicPlaylist.length > 0) {
      playTrack(musicPlaylist[0]);
    } else {
      musicAudioEngine.resume();
    }
  }, [currentTrack, musicPlaylist, playTrack]);

  const togglePlayMusic = useCallback(() => {
    if (isMusicPlaying) {
      pauseMusic();
    } else {
      resumeMusic();
    }
  }, [isMusicPlaying, pauseMusic, resumeMusic]);

  const nextTrack = useCallback(() => {
    nextTrackInternal();
  }, [nextTrackInternal]);

  const prevTrack = useCallback(() => {
    if (musicPosition > 3 && currentTrack) {
      musicAudioEngine.seek(0);
      setMusicPosition(0);
      return;
    }
    const list = playlistRef.current;
    const current = currentTrackRef.current;
    if (list.length === 0) return;

    const currentIndex = current ? list.findIndex(t => t.id === current.id) : 0;
    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) {
      prevIndex = list.length - 1;
    }
    const prevTrk = list[prevIndex] || list[0];
    setCurrentTrack(prevTrk);
    setMusicPosition(0);
    setMusicDuration(prevTrk.duration);
    musicAudioEngine.play(prevTrk, 0);
  }, [musicPosition, currentTrack]);

  const seekMusic = useCallback((seconds: number) => {
    setMusicPosition(seconds);
    musicAudioEngine.seek(seconds);
  }, []);

  const setMusicVolume = useCallback((val: number) => {
    setMusicVolumeState(val);
    if (isMusicMuted && val > 0) {
      setIsMusicMuted(false);
    }
  }, [isMusicMuted]);

  const toggleMusicMute = useCallback(() => {
    setIsMusicMuted(prev => !prev);
  }, []);

  const toggleMusicShuffle = useCallback(() => {
    setIsMusicShuffled(prev => !prev);
  }, []);

  const toggleMusicRepeat = useCallback(() => {
    setMusicRepeatMode(prev => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  }, []);

  const openMusicPlayer = useCallback((track?: Track, openExpanded: boolean = false) => {
    setIsMusicPlayerOpen(true);
    setIsMusicPlayerMinimized(!openExpanded);
    if (track) {
      playTrack(track, openExpanded);
    }
  }, [playTrack]);

  const addCustomTrack = useCallback((trackData: Omit<Track, 'id'>) => {
    const newTrack: Track = {
      id: `track-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ...trackData
    };
    setMusicPlaylist(prev => [newTrack, ...prev]);
    playTrack(newTrack);
  }, [playTrack]);

  const removeTrackFromPlaylist = useCallback((trackId: string) => {
    setMusicPlaylist(prev => prev.filter(t => t.id !== trackId));
    if (currentTrack?.id === trackId) {
      nextTrackInternal();
    }
  }, [currentTrack, nextTrackInternal]);

  // Sync users to localStorage
  useEffect(() => {
    if (users.length > 0) {
      safeSetLocalStorage('inkorium:users', JSON.stringify(users));
    }
  }, [users]);

  // Sync notifications to localStorage
  useEffect(() => {
    safeSetLocalStorage('inkorium:notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Sync friend requests to localStorage
  useEffect(() => {
    safeSetLocalStorage('inkorium:friend_requests', JSON.stringify(friendRequests));
  }, [friendRequests]);

  // Sync friendships to localStorage
  useEffect(() => {
    safeSetLocalStorage('inkorium:friendships', JSON.stringify(friendships));
  }, [friendships]);

  // Sync messages to localStorage
  useEffect(() => {
    safeSetLocalStorage('inkorium:messages', JSON.stringify(messages));
    safeSetLocalStorage('inkorium:private_messages', JSON.stringify(messages));
  }, [messages]);

  // Sync wall comments to localStorage
  useEffect(() => {
    safeSetLocalStorage('inkorium:wall_comments', JSON.stringify(wallComments));
  }, [wallComments]);

  // Keep currentUser initialized before callbacks/effects that depend on it.
  const currentUser = users.find(user => 
    user.id === currentUserId || 
    (Boolean(currentUserId) && normalizeUserId(user.id) === normalizeUserId(currentUserId))
  ) || users[0] || EMPTY_USER;

  const mapProfileToUser = useCallback((p: any): User => {
    const username = String(p.username ?? '').trim();
    const fullName = String(p.full_name ?? p.fullname ?? '').trim();
    const parts = fullName ? fullName.split(/\s+/) : [];
    const nombre = String(p.nombre ?? parts[0] ?? username ?? `Usuario_${String(p.id).slice(0, 6)}`).trim();
    const apellidos = String(p.apellidos ?? parts.slice(1).join(' ')).trim();
    const city = String(p.city ?? p.ciudad ?? '').trim();
    const province = String(p.province ?? p.provincia ?? city).trim();
    const country = String(p.country ?? p.pais ?? '').trim();
    const rawPresence = String(p.presence ?? p.presencia ?? p.user_status ?? p.estado ?? '').trim().toLowerCase();
    const presencia: UserPresence = ['conectado','ausente','ocupado','invisible'].includes(rawPresence) ? rawPresence as UserPresence : 'conectado';
    const gender = String(p.gender ?? p.sexo ?? '').trim().toLowerCase();
    const rawAvatar = String(p.avatar_url ?? p.avatar ?? '').trim();
    const avatar = toProfileAvatarUrl(rawAvatar, nombre || username || 'Usuario');
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
      pais: country || (province ? getCountryByZone(province)?.name : undefined) || 'España',
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

  const usersRef = useRef(users);
  usersRef.current = users;

  const photosRef = useRef(photos);
  photosRef.current = photos;

  const currentUserIdRef = useRef(currentUserId);
  currentUserIdRef.current = currentUserId;

  const profilesTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchProfiles = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    try {
      const response = await fetch(`/api/profiles?select=${encodeURIComponent(PROFILE_SELECT)}&limit=1000`, {
        cache: 'no-store',
        credentials: 'omit',
        headers: { Accept: 'application/json' }
      });
      if (!response.ok) return;
      const text = await response.text().catch(() => '');
      if (!text || text.trim().startsWith('<')) return;
      let data: any[] = [];
      try {
        data = JSON.parse(text);
      } catch {
        return;
      }
      if (!Array.isArray(data)) return;
      const mapped: User[] = data.map(mapProfileToUser);
      const curId = currentUserIdRef.current;
      setUsers(prevUsers => {
        const storedPresence = localStorage.getItem('inkorium:presence') as UserPresence | null;
        let combined = mapped.length > 0 ? mapped : INITIAL_USERS;
        
        // Merge remote server data with previous local state, prioritizing fresh server profile updates
        combined = combined.map(u => {
          const existing = prevUsers.find(p => p.id === u.id);
          if (!existing) return u;
          return {
            ...existing,
            ...u,
            nombre: u.nombre || existing.nombre,
            apellidos: u.apellidos !== undefined ? u.apellidos : existing.apellidos,
            avatar: (u.id === curId && existing.avatar && !existing.avatar.includes('avatar-resolver'))
              ? existing.avatar
              : ((u.avatar && !u.avatar.includes('avatar-resolver')) ? u.avatar : (existing.avatar || u.avatar)),
            provincia: u.provincia || existing.provincia,
            ciudad: u.ciudad || existing.ciudad,
            situacionSentimental: u.situacionSentimental || existing.situacionSentimental,
            fnac: u.fnac || existing.fnac,
            ocupacion: u.ocupacion || existing.ocupacion,
            intereses: u.intereses || existing.intereses,
            musica: u.musica || existing.musica,
            estado: u.estado || existing.estado,
            presencia: existing.presencia || u.presencia,
            online: existing.online !== undefined ? existing.online : u.online
          };
        });

        // Keep current user in list if not in mapped
        const existingCurrent = prevUsers.find(u => u.id === curId);
        if (existingCurrent && !combined.some(u => u.id === curId)) {
          combined = [existingCurrent, ...combined];
        }

        for (const initUser of INITIAL_USERS) {
          if (!combined.some(u => u.id === initUser.id || (u.email && u.email === initUser.email))) {
            combined.push(initUser);
          }
        }

        if (storedPresence && ['conectado','ausente','ocupado','invisible'].includes(storedPresence)) {
          return combined.map((user: User) => user.id === curId ? { ...user, presencia: storedPresence, online: storedPresence !== 'invisible', chatEstado: storedPresence === 'invisible' ? '0' : '1' } : user);
        }
        return combined;
      });
    } catch (error) {
      console.error('Profiles load failed:', error);
    }
  }, [mapProfileToUser]);

  const mapPhotoToPhoto = useCallback((row: any, prevPhotos: Photo[] = []): Photo => {
    const photoId = String(row.id);
    const uploader = usersRef.current.find(u => u.id === String(row.user_id));
    const existingPhoto = prevPhotos.find(p => p.id === photoId) || photosRef.current.find(p => p.id === photoId);
    const storedTags = getStoredTagsForPhoto(photoId);

    const rowTags = Array.isArray(row.etiquetas) ? row.etiquetas : [];
    const existingTags = Array.isArray(existingPhoto?.etiquetas) ? existingPhoto.etiquetas : [];
    const mergedTags = rowTags.length > 0 ? rowTags : (existingTags.length > 0 ? existingTags : storedTags);

    if (mergedTags.length > 0) {
      saveStoredTagsForPhoto(photoId, mergedTags);
    }

    const rowComments = Array.isArray(row.comentarios) ? row.comentarios : [];
    const existingComments = Array.isArray(existingPhoto?.comentarios) ? existingPhoto.comentarios : [];
    const mergedComments = rowComments.length > 0 ? rowComments : existingComments;

    const rowLikes = Array.isArray(row.likes) ? row.likes : [];
    const existingLikes = Array.isArray(existingPhoto?.likes) ? existingPhoto.likes : [];
    const mergedLikes = rowLikes.length > 0 ? rowLikes : existingLikes;

    const priv = row.privacidad || (row.visibility === 'public' ? 'publica' : row.visibility === 'private' ? 'eleccion' : 'amigos') || existingPhoto?.privacidad || 'amigos';
    const allowed = Array.isArray(row.allowedUserIds) ? row.allowedUserIds : (existingPhoto?.allowedUserIds || []);

    return {
      id: photoId,
      uploaderId: String(row.user_id),
      uploaderName: uploader ? `${uploader.nombre} ${uploader.apellidos}`.trim() : 'Usuario',
      albumId: row.album_id ?? null,
      albumName: existingPhoto?.albumName,
      archivo: String(row.url || ''),
      titulo: String(row.caption || 'Sin título'),
      fecha: row.created_at ? new Date(row.created_at).toLocaleString('es-ES') : (existingPhoto?.fecha || 'Recientemente'),
      etiquetas: mergedTags,
      comentarios: mergedComments,
      likes: mergedLikes,
      privacidad: priv,
      allowedUserIds: allowed
    };
  }, []);

  const fetchAndMapPhotos = useCallback(async () => {
    try {
      const rows = await fetchPhotos();
      if (rows && rows.length > 0) {
        setPhotos(prev => {
          return rows.map(r => mapPhotoToPhoto(r, prev));
        });
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
        const currentUsers = usersRef.current;
        const mapped: FeedItem[] = rows.map(row => {
          const author = currentUsers.find(u => u.id === row.author_id);
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
  }, []);

  const isFetchingPrivateMsgsRef = useRef(false);

  const fetchAndMapPrivateMessages = useCallback(async () => {
    const curId = currentUserIdRef.current;
    if (!curId || isFetchingPrivateMsgsRef.current) return;
    isFetchingPrivateMsgsRef.current = true;
    const deletedIds = getDeletedMessageIds();
    try {
      const session = await supabase?.auth.getSession().catch(() => null);
      const token = session?.data?.session?.access_token;
      let data: any[] | null = null;

      // 1. Fetch via GET with credentials: 'omit' to prevent large browser cookies from causing HTTP 431
      const res = await fetch('/api/private-messages?order=created_at.desc&limit=100', {
        credentials: 'omit',
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      }).catch(() => null);

      if (res && res.ok) {
        data = await res.json().catch(() => null);
      } else {
        // 2. Resilient fallback: Query via POST { action: 'list' }
        const postRes = await fetch('/api/private-messages', {
          method: 'POST',
          credentials: 'omit',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ action: 'list' })
        }).catch(() => null);
        if (postRes && postRes.ok) {
          data = await postRes.json().catch(() => null);
        }
      }

      if (Array.isArray(data) && data.length > 0) {
          const currentUsers = usersRef.current;
          const mapped: PrivateMessage[] = data
            .filter((row: any) => !deletedIds.has(String(row.id)))
            .map((row: any) => {
              const sender = currentUsers.find(u => u.id === row.sender_id || u.username === row.sender_id);
              const recipient = currentUsers.find(u => u.id === row.recipient_id || u.username === row.recipient_id);
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
            const curDeleted = getDeletedMessageIds();
            const validMapped = mapped.filter(m => !curDeleted.has(m.id));
            const dbIds = new Set(validMapped.map(m => m.id));
            const localNonDb = prev.filter(m => !dbIds.has(m.id) && !curDeleted.has(m.id));
            return [...validMapped, ...localNonDb];
          });
        }
    } catch {
      // Graceful fallback to local cache
    } finally {
      isFetchingPrivateMsgsRef.current = false;
    }
  }, []);

  const fetchAndMapChatMessages = useCallback(async () => {
    const curId = currentUserIdRef.current;
    if (!curId) return;
    try {
      const res = await fetch(`/api/chat-messages?userId=${encodeURIComponent(curId)}`, {
        headers: { Accept: 'application/json' },
        credentials: 'omit'
      });
      if (res.ok) {
        const text = await res.text().catch(() => '');
        if (!text || text.trim().startsWith('<')) return;
        let data: any = null;
        try { data = JSON.parse(text); } catch { return; }
        if (Array.isArray(data) && data.length > 0) {
          setChatMessages(prev => {
            const existingIds = new Set(prev.map(m => m.id));
            const newMsgs = data.filter((m: any) => !existingIds.has(m.id));
            if (newMsgs.length === 0) return prev;
            newMsgs.forEach((msg: any) => {
              const partnerId = normalizeUserId(msg.emisorId) === normalizeUserId(curId) ? msg.receptorId : msg.emisorId;
              appendMessageToConversation(curId, partnerId, msg);
            });
            return [...prev, ...newMsgs];
          });
        }
      }
    } catch (e) {
      console.warn('Failed to sync chat messages from server:', e);
    }
  }, []);

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

    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let retryAttempt = 0;

    const setupChannels = () => {
      const handleChannelStatus = (channelName: string) => (status: string) => {
        if (status === 'SUBSCRIBED') {
          retryAttempt = 0;
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          if (!mounted) return;
          retryAttempt++;
          const delay = Math.min(30000, 1000 * Math.pow(2, Math.min(retryAttempt, 5))) + Math.random() * 1000;
          if (reconnectTimer) clearTimeout(reconnectTimer);
          reconnectTimer = setTimeout(() => {
            if (mounted && supabase) {
              void fetchProfiles();
              void fetchAndMapPhotos();
              void fetchAndMapPrivateMessages();
            }
          }, delay);
        }
      };

      const profilesChannel = supabase.channel('profiles-sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload: any) => {
          if (payload?.new && typeof payload.new === 'object') {
            try {
              const mappedUser = mapProfileToUser(payload.new);
              if (mappedUser && mappedUser.id) {
                setUsers(prev => prev.map(u => u.id === mappedUser.id ? { ...u, ...mappedUser } : u));
              }
            } catch {}
          }
          void fetchProfiles();
        })
        .subscribe(handleChannelStatus('profiles'));

      const photosChannel = supabase.channel('photos-sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'photos' }, () => void fetchAndMapPhotos())
        .subscribe(handleChannelStatus('photos'));

      const messagesChannel = supabase.channel('messages-sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'private_messages' }, () => void fetchAndMapPrivateMessages())
        .subscribe(handleChannelStatus('messages'));

      return { profilesChannel, photosChannel, messagesChannel };
    };

    const channels = setupChannels();

    // Real-time SSE connection for instant cross-user profile sync
    let sse: EventSource | null = null;
    try {
      sse = new EventSource('/api/profiles/events');
      sse.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data?.type === 'PROFILE_UPDATE') {
            void fetchProfiles();
          }
        } catch {}
      };
    } catch {}

    // Fast periodic polling fallback to guarantee 100% sync reliability
    const pollProfilesInterval = setInterval(() => {
      void fetchProfiles();
    }, 6000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void fetchProfiles();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      mounted = false;
      if (profilesTimer.current) clearTimeout(profilesTimer.current);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      clearInterval(pollProfilesInterval);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (sse) {
        try { sse.close(); } catch {}
      }
      auth.subscription.unsubscribe();
      void supabase.removeChannel(channels.profilesChannel);
      void supabase.removeChannel(channels.photosChannel);
      void supabase.removeChannel(channels.messagesChannel);
    };
  }, [fetchProfiles, fetchAndMapPhotos, fetchAndMapPrivateMessages]);

  useEffect(() => {
    if (isSupabaseConfigured) void fetchAndMapPosts();
  }, [fetchAndMapPosts]);

  useEffect(() => {
    if (currentUserId) {
      if (isSupabaseConfigured) void fetchAndMapPhotos();
      void fetchAndMapPrivateMessages();
      void fetchAndMapChatMessages();
    }
  }, [currentUserId, fetchAndMapPhotos, fetchAndMapPrivateMessages, fetchAndMapChatMessages]);

  const pushNotification = useCallback((notif: InkoriumNotification) => {
    setNotifications(prev => {
      if (prev.some(n => n.id === notif.id)) return prev;
      const next = [notif, ...prev];
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem('inkorium:notifications', JSON.stringify(next.slice(0, 80)));
        } catch {}
      }
      return next;
    });

    broadcastCrossTabEvent({
      type: 'NOTIFICATION',
      payload: { notification: notif }
    });

    // Solo mostrar el popup emergente si la notificación va dirigida al usuario actual logueado
    const normCur = normalizeUserId(currentUserId);
    const normUser = normalizeUserId(currentUser.id);
    const normTarget = normalizeUserId(notif.userId);

    const isForCurrentUser = 
      !notif.userId ||
      normTarget === normCur ||
      normTarget === normUser ||
      (currentUser.username && normTarget === normalizeUserId(currentUser.username));

    if (isForCurrentUser) {
      setToasts(prev => {
        if (prev.some(t => t.id === notif.id)) return prev;
        return [notif, ...prev.slice(0, 4)];
      });
      try {
        playNotificationChime();
      } catch {}
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

  const fetchAndMapPrivateMessagesRef = useRef(fetchAndMapPrivateMessages);
  fetchAndMapPrivateMessagesRef.current = fetchAndMapPrivateMessages;

  const fetchAndMapChatMessagesRef = useRef(fetchAndMapChatMessages);
  fetchAndMapChatMessagesRef.current = fetchAndMapChatMessages;

  const pushNotificationRef = useRef(pushNotification);
  pushNotificationRef.current = pushNotification;

  // Periodic background polling and Server-Sent Events (SSE) for instant real-time messaging
  useEffect(() => {
    if (!currentUserId) return;

    const interval = setInterval(() => {
      void fetchAndMapPrivateMessagesRef.current();
      void fetchAndMapChatMessagesRef.current();
    }, 20000);

    // Instant Real-Time Push Stream via RealtimeManager with Exponential Backoff retry strategy
    const realtimeManager = new RealtimeManager({
      userId: currentUserId,
      initialDelayMs: 1000,
      maxDelayMs: 30000,
      factor: 2,
      jitterMs: 1000,
      maxRetries: 25,
      onChatMessage: (newMsg: ChatMessage) => {
        if (!newMsg || !newMsg.id) return;
        const normCur = normalizeUserId(currentUserId);
        const normRec = normalizeUserId(newMsg.receptorId);
        const normEmi = normalizeUserId(newMsg.emisorId);

        if (normRec === normCur || normEmi === normCur) {
          setChatMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });

          const partnerId = normEmi === normCur ? newMsg.receptorId : newMsg.emisorId;
          appendMessageToConversation(currentUserId, partnerId, newMsg);

          if (normRec === normCur && normEmi !== normCur) {
            try {
              if (newMsg.isNudge) {
                playNudgeSound();
              } else {
                playMessageSound();
              }
            } catch {}

            // Open active chat window or show indicator
            setActiveChatWindows(prev => {
              const existing = prev.find(w => normalizeUserId(w.targetUserId) === normEmi);
              if (existing) return prev.map(w => normalizeUserId(w.targetUserId) === normEmi ? { ...w, minimized: false } : w);
              return [...prev, { targetUserId: newMsg.emisorId, minimized: false }];
            });

            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('inkorium:chat_message_sync', {
                detail: { targetUserId: newMsg.emisorId, message: newMsg }
              }));
              if (newMsg.isNudge) {
                window.dispatchEvent(new CustomEvent('inkorium:chat_nudge', {
                  detail: { targetUserId: currentUserId, senderUserId: newMsg.emisorId }
                }));
              }
            }
          }
        }
      },
      onChatNudge: (data: any) => {
        if (!data || !data.fromUserId) return;
        const normCur = normalizeUserId(currentUserId);
        const normTarget = normalizeUserId(data.targetUserId);
        if (normTarget === normCur) {
          try {
            playNudgeSound();
          } catch {}
          setActiveChatWindows(prev => {
            const existing = prev.find(w => normalizeUserId(w.targetUserId) === normalizeUserId(data.fromUserId));
            if (existing) return prev.map(w => normalizeUserId(w.targetUserId) === normalizeUserId(data.fromUserId) ? { ...w, minimized: false } : w);
            return [...prev, { targetUserId: data.fromUserId, minimized: false }];
          });
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('inkorium:chat_nudge', {
              detail: { targetUserId: currentUserId, senderUserId: data.fromUserId }
            }));
          }
        }
      },
      onChatRead: (data: { readerId: string; senderId: string; messageIds: string[]; readAt: number; readDate: string }) => {
        if (!data || !data.readerId || !data.senderId) return;
        const normCur = normalizeUserId(currentUserId);
        const normReader = normalizeUserId(data.readerId);
        const normSender = normalizeUserId(data.senderId);

        if (normCur === normSender || normCur === normReader) {
          const partnerId = normCur === normSender ? data.readerId : data.senderId;
          applyReadReceiptsToConversation(currentUserId, partnerId, data.messageIds || [], data.readAt, data.readDate);

          setChatMessages(prev => prev.map(m => {
            const isMatch = (!data.messageIds || data.messageIds.length === 0 || data.messageIds.includes(m.id)) &&
              ((normalizeUserId(m.emisorId) === normSender && normalizeUserId(m.receptorId) === normReader) ||
               (normalizeUserId(m.emisorId) === normReader && normalizeUserId(m.receptorId) === normSender));
            if (isMatch) {
              return {
                ...m,
                leido: true,
                readAt: data.readAt,
                readDate: data.readDate
              };
            }
            return m;
          }));

          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('inkorium:chat_read', {
              detail: data
            }));
          }
        }
      },
      onPrivateMessage: (raw: any) => {
        if (!raw || !raw.id) return;
        const deletedIds = getDeletedMessageIds();
        if (deletedIds.has(String(raw.id))) return;
        const normCur = normalizeUserId(currentUserId);
        const recId = String(raw.recipient_id || raw.receptorId || '');
        const emiId = String(raw.sender_id || raw.emisorId || '');

        if (normalizeUserId(recId) === normCur || normalizeUserId(emiId) === normCur) {
          const currentUsersList = usersRef.current;
          const sender = currentUsersList.find(u => u.id === emiId || u.username === emiId);
          const recipient = currentUsersList.find(u => u.id === recId || u.username === recId);
          const mapped: PrivateMessage = {
            id: String(raw.id),
            emisorId: emiId,
            emisorNombre: raw.emisorNombre || (sender ? (sender.full_name || `${sender.nombre} ${sender.apellidos}`.trim() || sender.nombre) : 'Usuario'),
            emisorAvatar: raw.emisorAvatar || sender?.avatar || '',
            receptorId: recId,
            receptorNombre: raw.receptorNombre || (recipient ? (recipient.full_name || `${recipient.nombre} ${recipient.apellidos}`.trim() || recipient.nombre) : 'Usuario'),
            asunto: String(raw.subject || raw.asunto || 'Sin asunto'),
            mensaje: String(raw.body || raw.mensaje || ''),
            fecha: raw.created_at ? new Date(raw.created_at).toLocaleString('es-ES') : (raw.fecha || 'Ahora mismo'),
            leido: Boolean(raw.is_read || raw.leido)
          };

          setMessages(prev => {
            if (prev.some(m => m.id === mapped.id)) return prev;
            return [mapped, ...prev];
          });

          if (normalizeUserId(recId) === normCur && normalizeUserId(emiId) !== normCur) {
            try {
              playMessageSound();
            } catch {}
            pushNotificationRef.current({
              id: `notif-sse-mp-${Date.now()}`,
              tipo: 'mp',
              userId: currentUserId,
              fromUserId: emiId,
              fromUserName: mapped.emisorNombre,
              fromUserAvatar: mapped.emisorAvatar,
              mensaje: `te ha enviado un mensaje privado: "${mapped.asunto}"`,
              enlace: 'mensajes',
              targetId: mapped.id,
              targetPreview: mapped.mensaje.slice(0, 80),
              fecha: 'Ahora mismo',
              leido: false
            });
          }
        }
      },
      onChatTyping: (data: any) => {
        if (data && normalizeUserId(data.targetUserId) === normalizeUserId(currentUserId)) {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('inkorium:peer_typing', {
              detail: { targetUserId: data.fromUserId, isTyping: Boolean(data.isTyping) }
            }));
          }
        }
      },
      onNotification: (notifData: any) => {
        if (notifData) {
          pushNotificationRef.current(notifData);
        }
      }
    });

    realtimeManager.connect();

    return () => {
      clearInterval(interval);
      realtimeManager.disconnect();
    };
  }, [currentUserId]);

  // Cross-tab synchronization listener
  useEffect(() => {
    const unsubscribe = subscribeCrossTabEvents((event) => {
      if (event.type === 'CHAT_MESSAGE') {
        const { message, senderUserId } = event.payload;
        const normCurrentUser = normalizeUserId(currentUserId);
        const normRecipient = normalizeUserId(message.receptorId);
        const isSenderBlocked = blockedUserIds.some(b => normalizeUserId(b) === normalizeUserId(senderUserId || message.emisorId));
        if (normRecipient === normCurrentUser && normalizeUserId(senderUserId) !== normCurrentUser && !isSenderBlocked) {
          setChatMessages(prev => {
            if (prev.some(m => m.id === message.id)) return prev;
            return [...prev, message];
          });
          appendMessageToConversation(currentUserId, message.emisorId, message);
          setActiveChatWindows(prev => {
            const existing = prev.find(w => normalizeUserId(w.targetUserId) === normalizeUserId(message.emisorId));
            if (existing) return prev;
            return [...prev, { targetUserId: message.emisorId, minimized: false }];
          });
          try {
            if (message.isNudge) {
              playNudgeSound();
            } else {
              playMessageSound();
            }
          } catch {}
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('inkorium:chat_message_sync', {
              detail: { targetUserId: message.emisorId, message }
            }));
            if (message.isNudge) {
              window.dispatchEvent(new CustomEvent('inkorium:chat_nudge', {
                detail: { targetUserId: currentUserId, senderUserId: message.emisorId }
              }));
            }
          }
        }
      } else if (event.type === 'CHAT_NUDGE') {
        const { targetUserId, senderUserId } = event.payload;
        const normCurrentUser = normalizeUserId(currentUserId);
        const isSenderBlocked = blockedUserIds.some(b => normalizeUserId(b) === normalizeUserId(senderUserId));
        if (normalizeUserId(targetUserId) === normCurrentUser && !isSenderBlocked) {
          try {
            playNudgeSound();
          } catch {}
          setActiveChatWindows(prev => {
            const existing = prev.find(w => normalizeUserId(w.targetUserId) === normalizeUserId(senderUserId));
            if (existing) return prev.map(w => normalizeUserId(w.targetUserId) === normalizeUserId(senderUserId) ? { ...w, minimized: false } : w);
            return [...prev, { targetUserId: senderUserId, minimized: false }];
          });
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('inkorium:chat_nudge', {
              detail: { targetUserId: currentUserId, senderUserId }
            }));
          }
        }
      } else if (event.type === 'CHAT_BLOCK_UPDATE') {
        const { blockerId, blockedId, isBlocked } = event.payload;
        if (normalizeUserId(blockerId) === normalizeUserId(currentUserId)) {
          setBlockedUserIds(prev => {
            const normTarget = normalizeUserId(blockedId);
            if (isBlocked) {
              if (prev.some(id => normalizeUserId(id) === normTarget)) return prev;
              return [...prev, blockedId];
            } else {
              return prev.filter(id => normalizeUserId(id) !== normTarget);
            }
          });
        }
      } else if (event.type === 'CHAT_REACTION') {
        const { messageId, emoji, userId, targetUserId } = event.payload;
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('inkorium:chat_reaction', {
            detail: { messageId, emoji, userId, targetUserId }
          }));
        }
      } else if (event.type === 'CHAT_READ') {
        const { readerId, senderId, messageIds, readAt, readDate } = event.payload;
        const normCurrentUser = normalizeUserId(currentUserId);
        const normReader = normalizeUserId(readerId);
        const normSender = normalizeUserId(senderId);

        if (normCurrentUser === normSender || normCurrentUser === normReader) {
          const partnerId = normCurrentUser === normSender ? readerId : senderId;
          applyReadReceiptsToConversation(currentUserId, partnerId, messageIds || [], readAt, readDate);

          setChatMessages(prev => prev.map(m => {
            const isMatch = (!messageIds || messageIds.length === 0 || messageIds.includes(m.id)) &&
              ((normalizeUserId(m.emisorId) === normSender && normalizeUserId(m.receptorId) === normReader) ||
               (normalizeUserId(m.emisorId) === normReader && normalizeUserId(m.receptorId) === normSender));
            if (isMatch) {
              return {
                ...m,
                leido: true,
                readAt,
                readDate
              };
            }
            return m;
          }));

          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('inkorium:chat_read', {
              detail: event.payload
            }));
          }
        }
      } else if (event.type === 'PRIVATE_MESSAGE') {
        const { message } = event.payload;
        if (isMessageForCurrentUser(message)) {
          setMessages(prev => {
            if (prev.some(m => m.id === message.id)) return prev;
            return [message, ...prev];
          });
          try {
            playMessageSound();
          } catch {}
        }
      } else if (event.type === 'NOTIFICATION') {
        const { notification } = event.payload;
        if (!notification) return;
        setNotifications(prev => {
          if (prev.some(n => n.id === notification.id)) return prev;
          return [notification, ...prev];
        });
        const normCurrentUser = normalizeUserId(currentUserId);
        const normTarget = normalizeUserId(notification.userId);
        if (
          !notification.userId || 
          normTarget === normCurrentUser || 
          (currentUser.username && normTarget === normalizeUserId(currentUser.username))
        ) {
          setToasts(prev => {
            if (prev.some(t => t.id === notification.id)) return prev;
            return [notification, ...prev.slice(0, 4)];
          });
          try {
            playNotificationChime();
          } catch {}
        }
      } else if (event.type === 'PROFILE_UPDATE') {
        const { userId, data } = event.payload;
        if (userId && data) {
          setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...data } : u));
        }
      }
    });

    return () => unsubscribe();
  }, [currentUserId, blockedUserIds]);

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

  const uploadPhoto = useCallback((
    titulo: string, 
    albumId: string | null, 
    archivoUrl: string, 
    privacidad: PhotoPrivacy = 'amigos', 
    allowedUserIds: string[] = []
  ) => {
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
      likes: [],
      privacidad,
      allowedUserIds: privacidad === 'eleccion' ? allowedUserIds : []
    };
    setPhotos(prev => [optimistic, ...prev]);

    const apiVisibility = privacidad === 'publica' ? 'public' : privacidad === 'eleccion' ? 'private' : 'friends';
    void insertPhoto({ 
      userId: currentUserId, 
      albumId, 
      url: archivoUrl, 
      caption: titulo || 'Sin título',
      visibility: apiVisibility
    }).then(row => {
      setPhotos(prev => [{ ...mapPhotoToPhoto(row), privacidad, allowedUserIds }, ...prev.filter(photo => photo.id !== optimisticId)]);
    }).catch(error => {
      console.warn('Photo persistence local fallback:', error);
    });
  }, [currentUserId, currentUser, mapPhotoToPhoto]);

  const updateUserData = useCallback((data: Partial<User>) => {
    if (!currentUserId) return;
    setUsers(prev => {
      const updated = prev.map(user => 
        (user.id === currentUserId || (Boolean(currentUserId) && normalizeUserId(user.id) === normalizeUserId(currentUserId)))
          ? { ...user, ...data }
          : user
      );
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('inkorium:users', JSON.stringify(updated));
        const currentUpdated = updated.find(u => 
          u.id === currentUserId || (Boolean(currentUserId) && normalizeUserId(u.id) === normalizeUserId(currentUserId))
        );
        if (currentUpdated) {
          localStorage.setItem(`inkorium:user_profile_${currentUserId}`, JSON.stringify(currentUpdated));
        }
      }
      return updated;
    });

    broadcastCrossTabEvent({
      type: 'PROFILE_UPDATE',
      payload: { userId: currentUserId, data }
    });

    // Remote sync in background
    void (async () => {
      try {
        let token = '';
        if (supabase) {
          const session = await supabase.auth.getSession().catch(() => null);
          token = session?.data?.session?.access_token || '';
        }
        await fetch(`/api/profiles/${encodeURIComponent(currentUserId)}`, {
          method: 'PATCH',
          credentials: 'omit',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify(data)
        }).catch(() => null);
      } catch (err) {
        console.warn('Profile remote update warning:', err);
      }
    })();
  }, [currentUserId]);

  const updateStatusText = useCallback(async (statusText: string) => {
    if (!currentUserId) return;
    const nextStatus = statusText.trim().slice(0, 140);
    setUsers(prev => prev.map(user => 
      (user.id === currentUserId || (Boolean(currentUserId) && normalizeUserId(user.id) === normalizeUserId(currentUserId)))
        ? { ...user, estado: nextStatus, estadoFecha: 'Reciente' } 
        : user
    ));
    try {
      if (supabase) {
        const sessionResult = await supabase.auth.getSession();
        const accessToken = sessionResult.data.session?.access_token;
        if (accessToken) {
          await fetch(`/api/profiles/${encodeURIComponent(currentUserId)}/status`, {
            method: 'PATCH',
            credentials: 'omit',
            headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
            body: JSON.stringify({ status: nextStatus })
          }).catch(() => null);
        }
      }
    } catch (error) {
      console.warn('Status remote sync skipped:', error);
    }
  }, [currentUserId]);

  const sendChatReadReceipt = useCallback((targetUserId: string, messageIds?: string[]) => {
    if (!currentUserId || !targetUserId || targetUserId === currentUserId) return;
    const now = Date.now();
    const readDate = new Date(now).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    // Mark locally in persistent conversation
    const result = markConversationAsRead(currentUserId, targetUserId, now, readDate);
    const idsToMark = messageIds && messageIds.length > 0 ? messageIds : result.messageIds;

    if (idsToMark.length === 0 && (!messageIds || messageIds.length === 0)) {
      return;
    }

    // Update in-memory chat messages state
    setChatMessages(prev => prev.map(m => {
      const normTarget = normalizeUserId(targetUserId);
      const normCur = normalizeUserId(currentUserId);
      if (normalizeUserId(m.emisorId) === normTarget && normalizeUserId(m.receptorId) === normCur && (!idsToMark.length || idsToMark.includes(m.id))) {
        return {
          ...m,
          leido: true,
          readAt: now,
          readDate
        };
      }
      return m;
    }));

    const readPayload = {
      readerId: currentUserId,
      senderId: targetUserId,
      messageIds: idsToMark,
      readAt: now,
      readDate
    };

    // Broadcast cross-tab
    broadcastCrossTabEvent({
      type: 'CHAT_READ',
      payload: readPayload
    });

    // Dispatch custom window event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('inkorium:chat_read', {
        detail: readPayload
      }));
    }

    // Send to server
    void fetch('/api/chat-read', {
      method: 'POST',
      credentials: 'omit',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(readPayload)
    }).catch(() => null);
  }, [currentUserId]);

  const isUserBlocked = useCallback((targetUserId: string): boolean => {
    if (!targetUserId) return false;
    const normTarget = normalizeUserId(targetUserId);
    return blockedUserIds.some(id => normalizeUserId(id) === normTarget);
  }, [blockedUserIds]);

  const blockUser = useCallback((targetUserId: string) => {
    if (!currentUserId || !targetUserId || normalizeUserId(targetUserId) === normalizeUserId(currentUserId)) return;
    setBlockedUserIds(prev => {
      const normTarget = normalizeUserId(targetUserId);
      if (prev.some(id => normalizeUserId(id) === normTarget)) return prev;
      const updated = [...prev, targetUserId];
      saveStoredBlockedUserIds(currentUserId, updated);
      return updated;
    });

    // Close any active chat window with this user
    setActiveChatWindows(prev => prev.filter(w => normalizeUserId(w.targetUserId) !== normalizeUserId(targetUserId)));

    broadcastCrossTabEvent({
      type: 'CHAT_BLOCK_UPDATE',
      payload: { blockerId: currentUserId, blockedId: targetUserId, isBlocked: true }
    });

    void fetch('/api/chat-blocks', {
      method: 'POST',
      credentials: 'omit',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blockerId: currentUserId, blockedId: targetUserId })
    }).catch(() => null);
  }, [currentUserId]);

  const unblockUser = useCallback((targetUserId: string) => {
    if (!currentUserId || !targetUserId) return;
    setBlockedUserIds(prev => {
      const normTarget = normalizeUserId(targetUserId);
      const updated = prev.filter(id => normalizeUserId(id) !== normTarget);
      saveStoredBlockedUserIds(currentUserId, updated);
      return updated;
    });

    broadcastCrossTabEvent({
      type: 'CHAT_BLOCK_UPDATE',
      payload: { blockerId: currentUserId, blockedId: targetUserId, isBlocked: false }
    });

    void fetch('/api/chat-blocks', {
      method: 'DELETE',
      credentials: 'omit',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blockerId: currentUserId, blockedId: targetUserId })
    }).catch(() => null);
  }, [currentUserId]);

  const openChatWith = useCallback((targetUserId: string) => {
    if (!currentUserId || !targetUserId || targetUserId === currentUserId) return;
    if (isUserBlocked(targetUserId)) {
      pushNotification({
        id: `block-notif-${Date.now()}`,
        tipo: 'sistema',
        userId: currentUserId,
        fromUserId: currentUserId,
        fromUserName: 'Inkorium',
        mensaje: 'No puedes abrir el chat con este usuario porque lo tienes bloqueado.',
        fecha: 'Ahora mismo',
        leido: false
      });
      return;
    }
    setActiveChatWindows(prev => {
      const existing = prev.find(win => normalizeUserId(win.targetUserId) === normalizeUserId(targetUserId));
      if (existing) return prev.map(win => normalizeUserId(win.targetUserId) === normalizeUserId(targetUserId) ? { ...win, minimized: false } : win);
      return [...prev, { targetUserId, minimized: false }];
    });
    // Send read receipt immediately upon opening chat
    sendChatReadReceipt(targetUserId);
  }, [currentUserId, isUserBlocked, sendChatReadReceipt, pushNotification]);

  const closeChat = useCallback((targetUserId: string) => {
    setActiveChatWindows(prev => prev.filter(win => normalizeUserId(win.targetUserId) !== normalizeUserId(targetUserId)));
  }, []);

  const toggleMinimizeChat = useCallback((targetUserId: string) => {
    setActiveChatWindows(prev => prev.map(win => {
      if (normalizeUserId(win.targetUserId) === normalizeUserId(targetUserId)) {
        const nextMinimized = !win.minimized;
        if (!nextMinimized) {
          sendChatReadReceipt(targetUserId);
        }
        return { ...win, minimized: nextMinimized };
      }
      return win;
    }));
  }, [sendChatReadReceipt]);

  const sendChatMessage = useCallback((targetUserId: string, text: string, imageUrl?: string, fileData?: { url: string; name: string; size?: number; type?: string }) => {
    const message = text.trim();
    if (!currentUserId || !targetUserId || targetUserId === currentUserId || (!message && !imageUrl && !fileData)) return;
    if (isUserBlocked(targetUserId)) return;

    const msgId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `chat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newMsg: ChatMessage = {
      id: msgId,
      emisorId: currentUserId,
      receptorId: targetUserId,
      mensaje: message || (imageUrl ? '📷 Foto' : (fileData ? `📎 ${fileData.name}` : '')),
      fecha: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      leido: false,
      delivered: true,
      deliveredAt: Date.now(),
      imageUrl: imageUrl || undefined,
      fileUrl: fileData?.url || undefined,
      fileName: fileData?.name || undefined,
      fileSize: fileData?.size || undefined,
      fileType: fileData?.type || undefined
    };

    // 1. Guardar mensaje en historial local
    appendMessageToConversation(currentUserId, targetUserId, newMsg);
    setChatMessages(prev => [...prev, newMsg]);

    // 2. Abrir o restaurar ventana de chat
    setActiveChatWindows(prev => {
      const existing = prev.find(win => normalizeUserId(win.targetUserId) === normalizeUserId(targetUserId));
      if (existing) return prev.map(win => normalizeUserId(win.targetUserId) === normalizeUserId(targetUserId) ? { ...win, minimized: false } : win);
      return [...prev, { targetUserId, minimized: false }];
    });

    // 3. Notificar a componentes activos y otras pestañas
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('inkorium:chat_message_sync', {
        detail: { targetUserId, message: newMsg }
      }));
    }
    broadcastCrossTabEvent({
      type: 'CHAT_MESSAGE',
      payload: { message: newMsg, targetUserId, senderUserId: currentUserId }
    });

    // 4. Sincronizar con el servidor en segundo plano
    void fetch('/api/chat-messages', {
      method: 'POST',
      credentials: 'omit',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMsg)
    }).catch(() => null);
  }, [currentUserId, isUserBlocked]);

  const sendChatNudge = useCallback((targetUserId: string) => {
    if (!currentUserId || !targetUserId || targetUserId === currentUserId) return;
    if (isUserBlocked(targetUserId)) return;

    try {
      playNudgeSound();
    } catch {}

    const msgId = `nudge-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const nudgeMsg: ChatMessage = {
      id: msgId,
      emisorId: currentUserId,
      receptorId: targetUserId,
      mensaje: '💥 ¡Has enviado un zumbido!',
      fecha: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      leido: false,
      delivered: true,
      deliveredAt: Date.now(),
      isNudge: true
    };

    appendMessageToConversation(currentUserId, targetUserId, nudgeMsg);
    setChatMessages(prev => [...prev, nudgeMsg]);

    // Shake chat window
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('inkorium:chat_nudge', {
        detail: { targetUserId, senderUserId: currentUserId }
      }));
      window.dispatchEvent(new CustomEvent('inkorium:chat_message_sync', {
        detail: { targetUserId, message: nudgeMsg }
      }));
    }

    broadcastCrossTabEvent({
      type: 'CHAT_NUDGE',
      payload: { targetUserId, senderUserId: currentUserId }
    });

    void fetch('/api/chat-nudge', {
      method: 'POST',
      credentials: 'omit',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromUserId: currentUserId, targetUserId })
    }).catch(() => null);
  }, [currentUserId, isUserBlocked]);

  const reactToChatMessage = useCallback((targetUserId: string, messageId: string, emoji: string) => {
    if (!currentUserId || !targetUserId || !messageId || !emoji) return;

    const updater = (msg: ChatMessage): ChatMessage => {
      const reactions = { ...(msg.reactions || {}) };
      const currentList = Array.isArray(reactions[emoji]) ? [...reactions[emoji]] : [];
      const hasUser = currentList.includes(currentUserId);
      if (hasUser) {
        reactions[emoji] = currentList.filter(id => id !== currentUserId);
        if (reactions[emoji].length === 0) delete reactions[emoji];
      } else {
        reactions[emoji] = [...currentList, currentUserId];
      }
      return { ...msg, reactions };
    };

    updateMessageInConversation(currentUserId, targetUserId, messageId, updater);
    setChatMessages(prev => prev.map(m => m.id === messageId ? updater(m) : m));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('inkorium:chat_reaction', {
        detail: { messageId, emoji, userId: currentUserId, targetUserId }
      }));
    }

    broadcastCrossTabEvent({
      type: 'CHAT_REACTION',
      payload: { messageId, emoji, userId: currentUserId, targetUserId }
    });
  }, [currentUserId]);

  const sendChatTyping = useCallback((targetUserId: string, isTyping: boolean) => {
    if (!currentUserId || !targetUserId || targetUserId === currentUserId) return;
    broadcastCrossTabEvent({
      type: 'PEER_TYPING',
      payload: { targetUserId, isTyping }
    });
    void fetch('/api/chat-typing', {
      method: 'POST',
      credentials: 'omit',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromUserId: currentUserId, targetUserId, isTyping })
    }).catch(() => null);
  }, [currentUserId]);

  const recordProfileVisit = useCallback((targetUserId: string) => {
    if (!currentUserId || !targetUserId || normalizeUserId(targetUserId) === normalizeUserId(currentUserId)) return;
    const authorName = currentUser.full_name || `${currentUser.nombre} ${currentUser.apellidos}`.trim() || currentUser.nombre || 'Usuario';
    const now = Date.now();
    const newVisit: ProfileVisit = {
      id: `vis-${now}-${Math.random().toString(36).slice(2, 6)}`,
      visitorId: currentUserId,
      visitorName: authorName,
      visitorAvatar: currentUser.avatar,
      visitorProvincia: currentUser.provincia,
      visitedUserId: targetUserId,
      fecha: 'Ahora mismo',
      timestamp: now
    };

    setProfileVisits(prev => {
      // Avoid duplicated entries for the same visitor on this profile: bring latest visit to top
      const filtered = prev.filter(v => !(
        (normalizeUserId(v.visitorId) === normalizeUserId(currentUserId) || v.visitorId === currentUserId) &&
        (normalizeUserId(v.visitedUserId) === normalizeUserId(targetUserId) || v.visitedUserId === targetUserId)
      ));
      const updated = [newVisit, ...filtered].slice(0, 100);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('inkorium:profile_visits', JSON.stringify(updated));
      }
      return updated;
    });
  }, [currentUserId, currentUser]);

  const updateTopAmigos = useCallback((friendIds: string[]) => {
    updateUserData({ topAmigos: friendIds.slice(0, 8) });
  }, [updateUserData]);

  const createEvent = useCallback((eventData: Omit<SocialEvent, 'id' | 'creadorId' | 'creadorNombre' | 'creadorAvatar' | 'asistentes' | 'comentarios'>): string => {
    const newId = `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const myName = currentUser.full_name || `${currentUser.nombre} ${currentUser.apellidos}`.trim() || currentUser.nombre || 'Usuario';
    const newEvent: SocialEvent = {
      ...eventData,
      id: newId,
      creadorId: currentUserId,
      creadorNombre: myName,
      creadorAvatar: currentUser.avatar,
      asistentes: [
        {
          userId: currentUserId,
          userName: myName,
          userAvatar: currentUser.avatar,
          estado: 'asistire',
          fecha: 'Ahora mismo'
        }
      ],
      comentarios: []
    };

    setEvents(prev => {
      const updated = [newEvent, ...prev];
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('inkorium:events', JSON.stringify(updated));
      }
      return updated;
    });

    const newFeedItem: FeedItem = {
      id: `feed-evt-${Date.now()}`,
      tipo: 'evento',
      propietarioId: currentUserId,
      propietarioNombre: myName,
      propietarioAvatar: currentUser.avatar,
      datos: `Ha creado un nuevo evento: "${newEvent.titulo}" (${newEvent.fechaTexto} en ${newEvent.lugar}).`,
      fecha: 'Ahora mismo',
      likes: [],
      comentarios: []
    };
    setFeed(prev => [newFeedItem, ...prev]);

    return newId;
  }, [currentUserId, currentUser]);

  const rsvpEvent = useCallback((eventId: string, status: EventAttendanceStatus) => {
    if (!currentUserId) return;
    const myName = currentUser.full_name || `${currentUser.nombre} ${currentUser.apellidos}`.trim() || currentUser.nombre || 'Usuario';
    setEvents(prev => {
      const updated = prev.map(ev => {
        if (ev.id === eventId) {
          const currentAttendees = ev.asistentes.filter(a => a.userId !== currentUserId);
          const nextAttendees = [
            ...currentAttendees,
            {
              userId: currentUserId,
              userName: myName,
              userAvatar: currentUser.avatar,
              estado: status,
              fecha: 'Ahora mismo'
            }
          ];
          return { ...ev, asistentes: nextAttendees };
        }
        return ev;
      });
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('inkorium:events', JSON.stringify(updated));
      }
      return updated;
    });
  }, [currentUserId, currentUser]);

  const commentEvent = useCallback((eventId: string, text: string) => {
    if (!currentUserId || !text.trim()) return;
    const myName = currentUser.full_name || `${currentUser.nombre} ${currentUser.apellidos}`.trim() || currentUser.nombre || 'Usuario';
    const newComment: EventComment = {
      id: `ev-cmt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      autorId: currentUserId,
      autorNombre: myName,
      autorAvatar: currentUser.avatar,
      texto: text.trim(),
      fecha: 'Ahora mismo'
    };

    setEvents(prev => {
      const updated = prev.map(ev => {
        if (ev.id === eventId) {
          return { ...ev, comentarios: [...ev.comentarios, newComment] };
        }
        return ev;
      });
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('inkorium:events', JSON.stringify(updated));
      }
      return updated;
    });
  }, [currentUserId, currentUser]);

  const deleteEvent = useCallback((eventId: string) => {
    setEvents(prev => {
      const updated = prev.filter(e => e.id !== eventId);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('inkorium:events', JSON.stringify(updated));
      }
      return updated;
    });
  }, []);

  const addEventPhoto = useCallback((eventId: string, photoData: { url: string; caption?: string }) => {
    if (!currentUserId) return;
    const myName = currentUser.full_name || `${currentUser.nombre} ${currentUser.apellidos}`.trim() || currentUser.nombre || 'Usuario';
    const newPhoto: EventPhoto = {
      id: `ev-photo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      url: photoData.url,
      uploaderId: currentUserId,
      uploaderName: myName,
      uploaderAvatar: currentUser.avatar,
      caption: photoData.caption,
      fecha: 'Ahora mismo',
      timestamp: Date.now(),
      likes: []
    };

    setEvents(prev => {
      const updated = prev.map(ev => {
        if (ev.id === eventId) {
          const list = ev.fotosColaborativas || [];
          return {
            ...ev,
            fotosColaborativas: [newPhoto, ...list]
          };
        }
        return ev;
      });
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('inkorium:events', JSON.stringify(updated));
      }
      return updated;
    });

    pushNotification({
      id: `notif-ev-photo-${Date.now()}`,
      tipo: 'foto',
      userId: currentUserId,
      fromUserId: currentUserId,
      fromUserName: myName,
      fromUserAvatar: currentUser.avatar,
      mensaje: 'Has añadido una foto al álbum colaborativo del evento.',
      enlace: 'eventos',
      targetId: eventId,
      photoThumbnail: photoData.url,
      fecha: 'Ahora mismo',
      leido: true
    });
  }, [currentUserId, currentUser, pushNotification]);

  const joinCampus = useCallback((campusId: string) => {
    if (!currentUserId) return;
    setCampusCommunities(prev => {
      const updated = prev.map(c => {
        if (c.id === campusId && !c.miembros.includes(currentUserId)) {
          return { ...c, miembros: [...c.miembros, currentUserId] };
        }
        return c;
      });
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('inkorium:campus', JSON.stringify(updated));
      }
      return updated;
    });
  }, [currentUserId]);

  const leaveCampus = useCallback((campusId: string) => {
    if (!currentUserId) return;
    setCampusCommunities(prev => {
      const updated = prev.map(c => {
        if (c.id === campusId) {
          return { ...c, miembros: c.miembros.filter(id => id !== currentUserId) };
        }
        return c;
      });
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('inkorium:campus', JSON.stringify(updated));
      }
      return updated;
    });
  }, [currentUserId]);

  const postToCampus = useCallback((campusId: string, tipo: CampusPost['tipo'], texto: string, titulo?: string) => {
    if (!currentUserId || !texto.trim()) return;
    const myName = currentUser.full_name || `${currentUser.nombre} ${currentUser.apellidos}`.trim() || currentUser.nombre || 'Usuario';
    const newPost: CampusPost = {
      id: `cpost-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      autorId: currentUserId,
      autorNombre: myName,
      autorAvatar: currentUser.avatar,
      tipo,
      titulo: titulo?.trim(),
      texto: texto.trim(),
      fecha: 'Ahora mismo',
      likes: [],
      respuestas: []
    };

    setCampusCommunities(prev => {
      const updated = prev.map(c => {
        if (c.id === campusId) {
          return { ...c, posts: [newPost, ...c.posts] };
        }
        return c;
      });
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('inkorium:campus', JSON.stringify(updated));
      }
      return updated;
    });
  }, [currentUserId, currentUser]);

  const replyToCampusPost = useCallback((campusId: string, postId: string, texto: string) => {
    if (!currentUserId || !texto.trim()) return;
    const myName = currentUser.full_name || `${currentUser.nombre} ${currentUser.apellidos}`.trim() || currentUser.nombre || 'Usuario';
    const newReply: CampusReply = {
      id: `creply-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      autorId: currentUserId,
      autorNombre: myName,
      autorAvatar: currentUser.avatar,
      texto: texto.trim(),
      fecha: 'Ahora mismo'
    };

    setCampusCommunities(prev => {
      const updated = prev.map(c => {
        if (c.id === campusId) {
          return {
            ...c,
            posts: c.posts.map(p => p.id === postId ? { ...p, respuestas: [...p.respuestas, newReply] } : p)
          };
        }
        return c;
      });
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('inkorium:campus', JSON.stringify(updated));
      }
      return updated;
    });
  }, [currentUserId, currentUser]);

  const createCampus = useCallback((data: Omit<CampusCommunity, 'id' | 'miembros' | 'posts'>): string => {
    const newId = `campus_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newCampus: CampusCommunity = {
      ...data,
      id: newId,
      miembros: currentUserId ? [currentUserId] : [],
      posts: []
    };

    setCampusCommunities(prev => {
      const updated = [newCampus, ...prev];
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('inkorium:campus', JSON.stringify(updated));
      }
      return updated;
    });
    return newId;
  }, [currentUserId]);

  const createPage = useCallback((pageData: Omit<TuentiPage, 'id' | 'creadorId' | 'seguidores' | 'fechaCreacion' | 'posts'>): string => {
    const newId = `page-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newPage: TuentiPage = {
      ...pageData,
      id: newId,
      creadorId: currentUserId,
      seguidores: [currentUserId],
      fechaCreacion: new Date().toLocaleDateString('es-ES'),
      posts: []
    };

    setPages(prev => {
      const updated = [newPage, ...prev];
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('inkorium:pages', JSON.stringify(updated));
      }
      return updated;
    });
    return newId;
  }, [currentUserId]);

  const toggleFollowPage = useCallback((pageId: string) => {
    if (!currentUserId) return;
    setPages(prev => {
      const updated = prev.map(p => {
        if (p.id === pageId) {
          const isFan = p.seguidores.includes(currentUserId);
          const nextSeguidores = isFan
            ? p.seguidores.filter(id => id !== currentUserId)
            : [...p.seguidores, currentUserId];
          return { ...p, seguidores: nextSeguidores };
        }
        return p;
      });
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('inkorium:pages', JSON.stringify(updated));
      }
      return updated;
    });
  }, [currentUserId]);

  const postPageComment = useCallback((pageId: string, text: string, fotoUrl?: string) => {
    if (!currentUserId || !text.trim()) return;
    const myName = currentUser.full_name || `${currentUser.nombre} ${currentUser.apellidos}`.trim() || currentUser.nombre || 'Usuario';
    const newPost: PagePost = {
      id: `page-post-${Date.now()}`,
      autorId: currentUserId,
      autorNombre: myName,
      autorAvatar: currentUser.avatar,
      texto: text.trim(),
      fecha: 'Ahora mismo',
      likes: [],
      fotoUrl
    };

    setPages(prev => {
      const updated = prev.map(p => {
        if (p.id === pageId) {
          return { ...p, posts: [newPost, ...p.posts] };
        }
        return p;
      });
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('inkorium:pages', JSON.stringify(updated));
      }
      return updated;
    });
  }, [currentUserId, currentUser]);

  const setActiveTab = useCallback((tab: InkoriumContextType['activeTab']) => {
    if (tab !== 'mensajes') setComposeRecipientId(null);
    setActiveTabState(tab);
  }, []);
  const viewUserProfile = useCallback((id: string) => { 
    setSelectedUserId(id); 
    setActiveTabState('perfil'); 
    if (id && currentUserId && normalizeUserId(id) !== normalizeUserId(currentUserId)) {
      recordProfileVisit(id);
    }
  }, [currentUserId, recordProfileVisit]);
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
    setNotifications(currentNotifs => {
      const unreadForUser = currentNotifs.filter(n => (n.userId === targetId || n.userId === id) && !n.leido);
      if (unreadForUser.length > 0) {
        const latest = unreadForUser.slice(0, 2);
        setToasts(prev => [...latest, ...prev.slice(0, 3)]);
        playNotificationChime();
      }
      return currentNotifs;
    });
  }, [users]);

  const registerNewUser = useCallback((nombre: string, apellidos: string, email: string, sexo: 'h' | 'm', provincia: string, fnac: string, pais?: string, ciudad?: string) => {
    const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `user-${Date.now()}`;
    const cleanNombre = nombre.trim();
    const cleanApellidos = apellidos.trim();
    const newUser: User = {
      id: newId,
      nombre: cleanNombre,
      apellidos: cleanApellidos,
      full_name: `${cleanNombre} ${cleanApellidos}`.trim(),
      email: email.trim().toLowerCase(),
      sexo,
      pais: pais || 'España',
      provincia,
      ciudad: ciudad?.trim() || undefined,
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

  const canUserViewPhoto = useCallback((photo: Photo, viewerUserId?: string): boolean => {
    if (!photo) return false;
    const vId = viewerUserId || currentUserId;

    // El propio autor de la foto siempre tiene permiso de verla
    if (vId && photo.uploaderId === vId) return true;

    const priv: PhotoPrivacy = photo.privacidad || 'publica';
    if (priv === 'publica') return true;

    if (!vId) return false; // Usuario no logueado y foto no pública

    if (priv === 'amigos') {
      return isFriend(photo.uploaderId, vId);
    }

    if (priv === 'eleccion') {
      const allowed = Array.isArray(photo.allowedUserIds) ? photo.allowedUserIds : [];
      return allowed.includes(vId);
    }

    return true;
  }, [currentUserId, isFriend]);

  const updatePhotoPrivacy = useCallback((photoId: string, privacidad: PhotoPrivacy, allowedUserIds: string[] = []) => {
    setPhotos(prev => {
      const updated = prev.map(p => {
        if (p.id === photoId) {
          return {
            ...p,
            privacidad,
            allowedUserIds: privacidad === 'eleccion' ? allowedUserIds : []
          };
        }
        return p;
      });
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('inkorium:photos', JSON.stringify(updated));
      }
      return updated;
    });

    void updatePhotoPrivacyApi(photoId, privacidad, allowedUserIds).catch(err => {
      console.warn('updatePhotoPrivacyApi error:', err);
    });
  }, []);

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
      (currentUser.username && resolvedReceptorId === currentUser.username)
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

    setMessages(prev => {
      const updated = [newMsg, ...prev];
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('inkorium:messages', JSON.stringify(updated));
      }
      return updated;
    });

    broadcastCrossTabEvent({
      type: 'PRIVATE_MESSAGE',
      payload: { message: newMsg, recipientId: resolvedReceptorId }
    });

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

    // Sincronizar en segundo plano con la API / servidor
    void (async () => {
      try {
        const session = await supabase?.auth.getSession().catch(() => null);
        const token = session?.data?.session?.access_token;
        await fetch('/api/private-messages', {
          method: 'POST',
          credentials: 'omit',
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
      } catch (err) {
        console.warn('Silent private message backend sync error:', err);
      }
    })();
  }, [currentUserId, currentUser, users, pushNotification]);

  const markMessageAsRead = useCallback((messageId: string) => {
    setMessages(prev => {
      const updated = prev.map(m => m.id === messageId ? { ...m, leido: true } : m);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('inkorium:messages', JSON.stringify(updated));
      }
      return updated;
    });
    void (async () => {
      try {
        if (supabase) {
          const session = await supabase.auth.getSession().catch(() => null);
          const token = session?.data?.session?.access_token;
          await fetch(`/api/private-messages?id=eq.${encodeURIComponent(messageId)}`, {
            method: 'PATCH',
            credentials: 'omit',
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
    if (!messageId) return;
    addDeletedMessageIds([messageId]);
    setMessages(prev => {
      const updated = prev.filter(m => m.id !== messageId);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('inkorium:messages', JSON.stringify(updated));
        localStorage.setItem('inkorium:private_messages', JSON.stringify(updated));
      }
      return updated;
    });
    void (async () => {
      try {
        const session = await supabase?.auth.getSession().catch(() => null);
        const token = session?.data?.session?.access_token;
        await fetch(`/api/private-messages?id=eq.${encodeURIComponent(messageId)}`, {
          method: 'DELETE',
          credentials: 'omit',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ id: messageId })
        }).catch(() => null);
      } catch {}
    })();
  }, []);

  const deleteConversation = useCallback((targetUserId: string) => {
    if (!currentUserId || !targetUserId) return;
    const normCur = normalizeUserId(currentUserId);
    const normTarget = normalizeUserId(targetUserId);

    let removedIds: string[] = [];
    setMessages(prev => {
      const toRemove = prev.filter(m => {
        const isFromCurToTarget = (normalizeUserId(m.emisorId) === normCur || normalizeUserId(m.emisorNombre) === normCur) &&
                                  (normalizeUserId(m.receptorId) === normTarget || normalizeUserId(m.receptorNombre) === normTarget);
        const isFromTargetToCur = (normalizeUserId(m.receptorId) === normCur || normalizeUserId(m.receptorNombre) === normCur) &&
                                  (normalizeUserId(m.emisorId) === normTarget || normalizeUserId(m.emisorNombre) === normTarget);
        return isFromCurToTarget || isFromTargetToCur;
      });
      removedIds = toRemove.map(m => m.id);
      addDeletedMessageIds(removedIds);
      const updated = prev.filter(m => !removedIds.includes(m.id));
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('inkorium:messages', JSON.stringify(updated));
        localStorage.setItem('inkorium:private_messages', JSON.stringify(updated));
      }
      return updated;
    });

    void (async () => {
      try {
        const session = await supabase?.auth.getSession().catch(() => null);
        const token = session?.data?.session?.access_token;
        await fetch(`/api/private-messages?thread=${encodeURIComponent(targetUserId)}&currentUserId=${encodeURIComponent(currentUserId)}`, {
          method: 'DELETE',
          credentials: 'omit',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ ids: removedIds, thread: targetUserId, currentUserId })
        }).catch(() => null);

        for (const msgId of removedIds) {
          await fetch(`/api/private-messages?id=eq.${encodeURIComponent(msgId)}`, {
            method: 'DELETE',
            credentials: 'omit',
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {})
            }
          }).catch(() => null);
        }
      } catch {}
    })();
  }, [currentUserId]);

  // ================= WALL & FEED ACTIONS =================
  const postWallComment = useCallback((propietarioId: string, texto: string) => {
    const cleanText = texto.trim();
    if (!currentUserId || !cleanText || !propietarioId) return;

    // Resolver usuario destinatario por id, username o alias
    const targetUser = users.find(u => 
      u.id === propietarioId || 
      u.username === propietarioId
    );
    const resolvedPropietarioId = targetUser?.id || propietarioId;
    const resolvedPropietarioName = targetUser 
      ? (targetUser.full_name || `${targetUser.nombre} ${targetUser.apellidos}`.trim() || targetUser.nombre)
      : 'Usuario';
    const resolvedPropietarioAvatar = targetUser?.avatar || '';

    const authorName = currentUser.full_name || `${currentUser.nombre} ${currentUser.apellidos}`.trim() || currentUser.nombre || 'Usuario';
    const authorAvatar = currentUser.avatar || '';

    const newComment: WallComment = {
      id: `wc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      propietarioId: resolvedPropietarioId,
      receptorId: resolvedPropietarioId,
      autorId: currentUserId,
      emisorId: currentUserId,
      autorNombre: authorName,
      emisorNombre: authorName,
      autorAvatar: authorAvatar,
      emisorAvatar: authorAvatar,
      texto: cleanText,
      comentario: cleanText,
      fecha: 'Ahora mismo',
      likes: []
    };

    setWallComments(prev => [newComment, ...prev]);

    // Añadir al feed de novedades como evento de tablón
    const newFeedItem: FeedItem = {
      id: `feed-wall-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tipo: 'tablon',
      propietarioId: resolvedPropietarioId,
      propietarioNombre: resolvedPropietarioName,
      propietarioAvatar: resolvedPropietarioAvatar,
      visitanteId: currentUserId,
      visitanteNombre: authorName,
      visitanteAvatar: authorAvatar,
      datos: cleanText,
      fecha: 'Ahora mismo',
      likes: [],
      comentarios: []
    };
    setFeed(prev => [newFeedItem, ...prev]);

    // Notificación en tiempo real si se firma en el tablón de otra persona
    const isSelf = 
      resolvedPropietarioId === currentUserId ||
      resolvedPropietarioId === currentUser.id ||
      (currentUser.username && resolvedPropietarioId === currentUser.username);

    if (!isSelf) {
      pushNotification({
        id: `notif-wall-${Date.now()}`,
        tipo: 'tablon',
        userId: resolvedPropietarioId,
        fromUserId: currentUserId,
        fromUserName: authorName,
        fromUserAvatar: authorAvatar,
        mensaje: 'ha firmado en tu tablón.',
        enlace: 'perfil',
        targetId: newComment.id,
        targetPreview: cleanText.slice(0, 80),
        fecha: 'Ahora mismo',
        leido: false
      });
    }

    // Feedback inmediato de confirmación para quien firma
    setToasts(prev => [
      {
        id: `toast-wall-${Date.now()}`,
        tipo: 'tablon',
        userId: currentUserId,
        fromUserId: currentUserId,
        fromUserName: authorName,
        fromUserAvatar: authorAvatar,
        mensaje: isSelf
          ? 'Has publicado una firma en tu propio tablón.'
          : `Has firmado en el tablón de ${resolvedPropietarioName}.`,
        enlace: 'perfil',
        targetId: newComment.id,
        targetPreview: cleanText.slice(0, 80),
        fecha: 'Ahora mismo',
        leido: true
      },
      ...prev.slice(0, 3)
    ]);
  }, [currentUserId, currentUser, users, pushNotification]);

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
    setPhotos(prev => {
      const updated = prev.map(photo => {
        if (photo.id === photoId) {
          const photoLikes = Array.isArray(photo.likes) ? photo.likes : [];
          const hasLiked = photoLikes.includes(currentUserId);
          return {
            ...photo,
            likes: hasLiked ? photoLikes.filter(id => id !== currentUserId) : [...photoLikes, currentUserId]
          };
        }
        return photo;
      });
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('inkorium:photos', JSON.stringify(updated));
      }
      return updated;
    });

    void likePhotoApi(photoId, currentUserId).catch(err => {
      console.warn('likePhotoApi error:', err);
    });
  }, [currentUserId]);

  const addPhotoComment = useCallback((photoId: string, comentario: string) => {
    if (!currentUserId || !comentario.trim()) return;
    const authorName = `${currentUser.nombre} ${currentUser.apellidos}`.trim() || currentUser.nombre || 'Usuario';
    const authorAvatar = currentUser.avatar || '';
    const newComment: PhotoComment = {
      id: `pc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      photoId,
      userId: currentUserId,
      autorId: currentUserId,
      nombre: authorName,
      autorNombre: authorName,
      avatar: authorAvatar,
      autorAvatar: authorAvatar,
      comentario: comentario.trim(),
      texto: comentario.trim(),
      fecha: 'Ahora mismo'
    };
    setPhotos(prev => {
      const updated = prev.map(photo => {
        if (photo.id === photoId) {
          const currentComments = Array.isArray(photo.comentarios) ? photo.comentarios : [];
          return {
            ...photo,
            comentarios: [...currentComments, newComment]
          };
        }
        return photo;
      });
      safeSetLocalStorage('inkorium:photos', JSON.stringify(updated));
      return updated;
    });

    const targetPhoto = photos.find(p => p.id === photoId);
    if (targetPhoto && targetPhoto.uploaderId && targetPhoto.uploaderId !== currentUserId) {
      const ownerId = targetPhoto.uploaderId;
      const notifData: InkoriumNotification = {
        id: `notif-comment-${Date.now()}`,
        userId: ownerId,
        fromUserId: currentUserId,
        fromUserName: authorName,
        fromUserAvatar: authorAvatar,
        tipo: 'foto_comentario',
        mensaje: `${authorName} ha comentado en tu foto.`,
        detalle: targetPhoto.titulo ? `Foto: "${targetPhoto.titulo}"` : undefined,
        enlace: 'fotos',
        targetId: photoId,
        fotoId: photoId,
        photoThumbnail: targetPhoto.archivo,
        targetPhotoUrl: targetPhoto.archivo,
        leido: false,
        fecha: 'Ahora mismo'
      };
      broadcastCrossTabEvent({
        type: 'NOTIFICATION',
        payload: { notification: notifData }
      });
    }

    void addPhotoCommentApi(photoId, newComment).catch(err => {
      console.warn('addPhotoCommentApi error:', err);
    });
  }, [currentUserId, currentUser, photos]);

  const setPhotoAsAvatar = useCallback((photoId: string) => {
    const photo = photos.find(p => p.id === photoId);
    if (photo?.archivo) {
      updateUserData({ avatar: photo.archivo });
    }
  }, [photos, updateUserData]);

  const deletePhoto = useCallback((photoId: string) => {
    setPhotos(prev => prev.filter(p => p.id !== photoId));
  }, []);

  const createAlbum = useCallback((nombre: string, descripcion?: string): string | undefined => {
    if (!currentUserId || !nombre.trim()) return undefined;
    const albumId = `alb-${Date.now()}`;
    const newAlbum: Album = {
      id: albumId,
      userId: currentUserId,
      propietarioId: currentUserId,
      nombre: nombre.trim(),
      descripcion: descripcion?.trim() || '',
      portada: '',
      numFotos: 0,
      fecha: new Date().toLocaleDateString('es-ES')
    };
    setAlbums(prev => [...prev, newAlbum]);
    return albumId;
  }, [currentUserId]);

  const renameAlbum = useCallback((albumId: string, nuevoNombre: string) => {
    setAlbums(prev => prev.map(a => a.id === albumId ? { ...a, nombre: nuevoNombre.trim() } : a));
  }, []);

  const deleteAlbum = useCallback((albumId: string) => {
    setAlbums(prev => prev.filter(a => a.id !== albumId));
  }, []);

  const addPhotoTag = useCallback((photoId: string, targetUserId: string, x: number, y: number) => {
    const target = users.find(u => u.id === targetUserId);
    const targetName = target ? `${target.nombre} ${target.apellidos}`.trim() : 'Usuario';
    const newTag: PhotoTag = {
      id: `tag-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      photoId,
      userId: targetUserId,
      usuarioId: targetUserId,
      userName: targetName,
      nombre: targetName,
      x,
      y
    };
    
    setPhotos(prev => {
      const updated = prev.map(photo => {
        if (photo.id === photoId) {
          const currentTags = Array.isArray(photo.etiquetas) ? photo.etiquetas : [];
          const exists = currentTags.some(t => t.id === newTag.id);
          const nextTags = exists ? currentTags : [...currentTags, newTag];
          saveStoredTagsForPhoto(photoId, nextTags);
          return {
            ...photo,
            etiquetas: nextTags
          };
        }
        return photo;
      });
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('inkorium:photos', JSON.stringify(updated));
      }
      return updated;
    });

    const targetPhoto = photosRef.current.find(p => p.id === photoId) || INITIAL_PHOTOS.find(p => p.id === photoId);
    const photoUrl = targetPhoto?.archivo || '';
    const myName = currentUser.full_name || `${currentUser.nombre} ${currentUser.apellidos}`.trim() || currentUser.nombre || 'Usuario';

    void addPhotoTagApi(photoId, {
      ...newTag,
      creatorId: currentUserId,
      creatorName: myName,
      creatorAvatar: currentUser.avatar || '',
      photoUrl,
      photoTitle: targetPhoto?.titulo || ''
    }).catch(err => {
      console.warn('Failed to sync photo tag to server:', err);
    });

    // Generate notification for tagged friend if not tagging self
    if (targetUserId && targetUserId !== currentUserId) {
      const tagNotif: InkoriumNotification = {
        id: `notif-tag-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userId: targetUserId,
        fromUserId: currentUserId,
        fromUserName: myName,
        fromUserAvatar: currentUser.avatar,
        tipo: 'etiqueta',
        mensaje: `${myName} te ha etiquetado en una foto.`,
        detalle: targetPhoto?.titulo ? `Foto: "${targetPhoto.titulo}"` : undefined,
        enlace: 'fotos',
        targetId: photoId,
        fotoId: photoId,
        photoThumbnail: photoUrl,
        targetPhotoUrl: photoUrl,
        leido: false,
        fecha: 'Ahora mismo'
      };
      pushNotification(tagNotif);

      // Toast confirmation for the user who added the tag
      setToasts(prev => [
        {
          id: `toast-tag-sent-${Date.now()}`,
          userId: currentUserId,
          fromUserId: targetUserId,
          fromUserName: targetName,
          fromUserAvatar: target?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
          tipo: 'etiqueta',
          mensaje: `Has etiquetado a ${targetName} en esta foto. Se le ha enviado una notificación.`,
          detalle: targetPhoto?.titulo ? `Foto: "${targetPhoto.titulo}"` : undefined,
          enlace: 'fotos',
          targetId: photoId,
          fotoId: photoId,
          photoThumbnail: photoUrl,
          targetPhotoUrl: photoUrl,
          leido: true,
          fecha: 'Ahora mismo'
        },
        ...prev.slice(0, 4)
      ]);
      playNotificationChime();
    } else if (targetUserId && targetUserId === currentUserId) {
      // Self-tagging
      const selfNotif: InkoriumNotification = {
        id: `notif-tag-self-${Date.now()}`,
        userId: currentUserId,
        fromUserId: currentUserId,
        fromUserName: myName,
        fromUserAvatar: currentUser.avatar,
        tipo: 'etiqueta',
        mensaje: 'Te has etiquetado en esta foto.',
        detalle: targetPhoto?.titulo ? `Foto: "${targetPhoto.titulo}"` : undefined,
        enlace: 'fotos',
        targetId: photoId,
        fotoId: photoId,
        photoThumbnail: photoUrl,
        targetPhotoUrl: photoUrl,
        leido: false,
        fecha: 'Ahora mismo'
      };
      pushNotification(selfNotif);
      playNotificationChime();
    }
  }, [users, currentUserId, currentUser, pushNotification]);

  const removePhotoTag = useCallback((photoId: string, tagId: string) => {
    setPhotos(prev => {
      const updated = prev.map(p => {
        if (p.id === photoId) {
          const currentTags = Array.isArray(p.etiquetas) ? p.etiquetas : [];
          const nextTags = currentTags.filter(t => t.id !== tagId);
          saveStoredTagsForPhoto(photoId, nextTags);
          return { ...p, etiquetas: nextTags };
        }
        return p;
      });
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('inkorium:photos', JSON.stringify(updated));
      }
      return updated;
    });

    void removePhotoTagApi(photoId, tagId).catch(err => {
      console.warn('Failed to sync remove tag to server:', err);
    });
  }, []);

  const setChatEstado = useCallback((estado: '1' | '0') => {
    updateUserData({ chatEstado: estado });
  }, [updateUserData]);

  const logUserActivity = useCallback((_activity: Omit<UserActivity, 'id' | 'timestamp'>) => {}, []);
  const deleteUserActivity = useCallback((_activityId: string) => {}, []);
  const getUserActivities = useCallback((_userId: string) => activities, [activities]);

  const resetToDefaultData = useCallback(() => {
    if (typeof localStorage !== 'undefined') {
      try {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('inkorium')) {
            localStorage.removeItem(key);
          }
        });
      } catch (err) {
        console.warn('Error resetting inkorium localStorage keys:', err);
      }
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

  // Dynamic counts for current user
  const isMessageForCurrentUser = (m: PrivateMessage) => {
    if (!currentUserId) return false;
    const normRec = normalizeUserId(m.receptorId);
    const normCur = normalizeUserId(currentUser.id);
    const normCurId = normalizeUserId(currentUserId);
    return (
      normRec === normCur ||
      normRec === normCurId ||
      m.receptorId === currentUserId ||
      m.receptorId === currentUser.id ||
      (currentUser.username && m.receptorId.toLowerCase() === currentUser.username.toLowerCase()) ||
      (currentUser.email && m.receptorId.toLowerCase() === currentUser.email.toLowerCase())
    );
  };
  const unreadMessagesCount = messages.filter(m => isMessageForCurrentUser(m) && !m.leido).length;
  const unreadNotificationsCount = notifications.filter(n => Boolean(currentUserId && (n.userId === currentUserId || n.userId === currentUser.id) && !n.leido)).length;
  const pendingRequestsCount = friendRequests.filter(r => Boolean(currentUserId && (r.receptorId === currentUserId || r.receptorId === currentUser.id) && r.estado === 'pendiente')).length;

  return (
    <InkoriumContext.Provider value={{
      currentUser, users, photos, albums, feed, wallComments, messages, friendRequests, friendships, chatMessages,
      notifications, toasts, accessLogs, activities, activeChatWindows, activeTab, selectedUserId, selectedPhotoId, selectedAlbumId,
      composeRecipientId,
      unreadMessagesCount, unreadNotificationsCount, pendingRequestsCount,
      isLoggedIn,
      theme, isDarkMode, setTheme, toggleTheme,
      // Music System
      currentTrack, isMusicPlaying, musicPosition, musicDuration,
      musicVolume, isMusicMuted, isMusicShuffled, musicRepeatMode,
      musicPlaylist, isMusicPlayerOpen, isMusicPlayerMinimized,
      playTrack, pauseMusic, resumeMusic, togglePlayMusic,
      nextTrack, prevTrack, seekMusic,
      setMusicVolume, toggleMusicMute,
      toggleMusicShuffle, toggleMusicRepeat,
      setIsMusicPlayerOpen, setIsMusicPlayerMinimized,
      openMusicPlayer, addCustomTrack,
      removeTrackFromPlaylist,
      // Anti-Algoritmo Mode
      isAntiAlgorithmMode, toggleAntiAlgorithmMode,
      // Retro Tuenti Features
      events, pages, profileVisits, gameScores,
      selectedEventId, setSelectedEventId,
      selectedPageId, setSelectedPageId,
      isInvitationsModalOpen, setIsInvitationsModalOpen,
      createEvent, rsvpEvent, commentEvent, deleteEvent, addEventPhoto,
      // Campus y Comunidades Locales
      campusCommunities, selectedCampusId, setSelectedCampusId,
      joinCampus, leaveCampus, postToCampus, replyToCampusPost, createCampus,
      createPage, toggleFollowPage, postPageComment,
      recordProfileVisit, updateTopAmigos,
      setActiveTab, viewUserProfile, openComposeMessage, viewPhoto, viewAlbum, setCurrentUserById,
      login, loginAsUser, logout, publishStatus, updateStatusText, updateUserPresence,
      likeFeedItem, commentFeedItem, postWallComment, deleteWallComment,
      uploadPhoto, updatePhotoPrivacy, canUserViewPhoto, addPhotoTag, removePhotoTag, addPhotoComment, likePhoto,
      setPhotoAsAvatar, deletePhoto, createAlbum, renameAlbum, deleteAlbum,
      sendFriendRequest, acceptFriendRequest, ignoreFriendRequest, removeFriendship, cancelFriendRequest, isFriend, hasPendingRequest, getFriendsOf,
      sendPrivateMessage, markMessageAsRead, deleteMessage, deleteConversation,
      sendChatMessage, sendChatNudge, reactToChatMessage, sendChatTyping, sendChatReadReceipt, openChatWith, closeChat, toggleMinimizeChat, setChatEstado,
      blockedUserIds, blockUser, unblockUser, isUserBlocked,
      logUserActivity, deleteUserActivity, getUserActivities,
      pushNotification, dismissToast, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification,
      updateUserData, resetToDefaultData, registerNewUser,
      refreshProfiles: fetchProfiles
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
