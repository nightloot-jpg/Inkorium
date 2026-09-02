import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { User, Photo, Album, FeedItem, WallComment, PrivateMessage, FriendRequest, Friendship, ChatMessage, ChatWindow, InkoriumNotification, AccessLog, UserActivity, UserPresence, ThemeMode, Track, RepeatMode } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { fetchPosts, createPost } from '../lib/postsApi';
import { fetchPhotos, insertPhoto } from '../lib/photosApi';
import { INITIAL_USERS, INITIAL_ALBUMS, INITIAL_PHOTOS, INITIAL_FEED, INITIAL_WALL_COMMENTS, INITIAL_FRIENDSHIPS, INITIAL_FRIEND_REQUESTS, INITIAL_MESSAGES, INITIAL_NOTIFICATIONS, INITIAL_ACCESS_LOGS, INITIAL_ACTIVITIES } from '../data/mockData';
import { INITIAL_MUSIC_TRACKS } from '../data/musicTracks';
import { musicAudioEngine } from '../utils/audioEngine';
import { appendMessageToConversation, normalizeUserId, broadcastCrossTabEvent, subscribeCrossTabEvents } from '../lib/chatHistory';
import { generateRetroChatReply, generateRetroPrivateMessageReply } from '../lib/retroChatReplies';
import { playMessageSound } from '../utils/sound';
import { RealtimeManager } from '../lib/realtimeManager';

interface InkoriumContextType {
  currentUser: User; users: User[]; photos: Photo[]; albums: Album[]; feed: FeedItem[]; wallComments: WallComment[];
  messages: PrivateMessage[]; friendRequests: FriendRequest[]; friendships: Friendship[]; chatMessages: ChatMessage[];
  notifications: InkoriumNotification[]; toasts: InkoriumNotification[]; accessLogs: AccessLog[]; activities: UserActivity[];
  activeChatWindows: ChatWindow[]; activeTab: 'inicio' | 'perfil' | 'gente' | 'fotos' | 'mensajes' | 'notificaciones' | 'ajustes' | 'musica';
  selectedUserId: string; selectedPhotoId: string | null; selectedAlbumId: string | null;
  composeRecipientId: string | null;
  unreadMessagesCount: number; unreadNotificationsCount: number; pendingRequestsCount: number;
  isRealtimeSimulationEnabled: boolean; isLoggedIn: boolean;
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
  uploadPhoto: (titulo: string, albumId: string | null, archivoUrl: string) => void; addPhotoTag: (photoId: string, targetUserId: string, x: number, y: number) => void;
  removePhotoTag: (photoId: string, tagId: string) => void; addPhotoComment: (photoId: string, comentario: string) => void; likePhoto: (photoId: string) => void;
  setPhotoAsAvatar: (photoId: string) => void; deletePhoto: (photoId: string) => void; createAlbum: (nombre: string, descripcion?: string) => void;
  renameAlbum: (albumId: string, nuevoNombre: string) => void; deleteAlbum: (albumId: string) => void;
  sendFriendRequest: (targetUserId: string) => void; acceptFriendRequest: (requestId: string) => void; ignoreFriendRequest: (requestId: string) => void;
  removeFriendship: (targetUserId: string) => void; cancelFriendRequest: (targetUserId: string) => void;
  isFriend: (userId1: string, userId2: string) => boolean; hasPendingRequest: (fromId: string, toId: string) => boolean; getFriendsOf: (userId: string) => User[];
  sendPrivateMessage: (receptorId: string, asunto: string, mensaje: string) => void; markMessageAsRead: (messageId: string) => void; deleteMessage: (messageId: string) => void; deleteConversation: (targetUserId: string) => void;
  openChatWith: (targetUserId: string) => void; closeChat: (targetUserId: string) => void; toggleMinimizeChat: (targetUserId: string) => void;
  sendChatMessage: (targetUserId: string, text: string) => void; 
  sendChatTyping: (targetUserId: string, isTyping: boolean) => void;
  setChatEstado: (estado: '1' | '0') => void;
  logUserActivity: (activity: Omit<UserActivity, 'id' | 'timestamp'>) => void; deleteUserActivity: (activityId: string) => void; getUserActivities: (userId: string) => UserActivity[];
  pushNotification: (notif: InkoriumNotification) => void; dismissToast: (toastId: string) => void; markNotificationAsRead: (notifId: string) => void;
  markAllNotificationsAsRead: () => void; deleteNotification: (notifId: string) => void; setIsRealtimeSimulationEnabled: (enabled: boolean) => void;
  simulateIncomingMessage: () => void; simulateWallComment: () => void; simulateFriendRequest: () => void; simulatePhotoInteraction: () => void;
  updateUserData: (data: Partial<User>) => void; resetToDefaultData: () => void; registerNewUser: (nombre: string, apellidos: string, email: string, sexo: 'h' | 'm', provincia: string, fnac: string) => void;
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
  const [photos, setPhotos] = useState<Photo[]>(INITIAL_PHOTOS);
  const [albums, setAlbums] = useState<Album[]>(INITIAL_ALBUMS);
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
  const [isRealtimeSimulationEnabled, setIsRealtimeSimulationEnabledState] = useState<boolean>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('inkorium:realtime_sim');
      if (saved !== null) return saved === 'true';
    }
    return true;
  });
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(storedLoggedIn);
  const [activeTab, setActiveTabState] = useState<InkoriumContextType['activeTab']>('inicio');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [composeRecipientId, setComposeRecipientId] = useState<string | null>(null);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [activeChatWindows, setActiveChatWindows] = useState<ChatWindow[]>([]);

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

  const usersRef = useRef(users);
  usersRef.current = users;

  const currentUserIdRef = useRef(currentUserId);
  currentUserIdRef.current = currentUserId;

  const profilesTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchProfiles = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    if (profilesTimer.current) clearTimeout(profilesTimer.current);
    profilesTimer.current = setTimeout(async () => {
      try {
        const response = await fetch('/api/profiles?select=id,username,full_name,avatar_url,city,birth_date,user_status,profile_interests,updated_at&limit=1000', {
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
          
          // Keep current user in list if not in mapped or preserve local custom avatar/edits
          const existingCurrent = prevUsers.find(u => u.id === curId);
          if (existingCurrent && !combined.some(u => u.id === curId)) {
            combined = [existingCurrent, ...combined];
          } else if (existingCurrent) {
            combined = combined.map(u => u.id === curId ? { ...u, avatar: existingCurrent.avatar || u.avatar, nombre: existingCurrent.nombre || u.nombre } : u);
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
    }, 100);
  }, [mapProfileToUser]);

  const mapPhotoToPhoto = useCallback((row: any): Photo => {
    const uploader = usersRef.current.find(u => u.id === String(row.user_id));
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
  }, []);

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
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => void fetchProfiles())
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

    return () => {
      mounted = false;
      if (profilesTimer.current) clearTimeout(profilesTimer.current);
      if (reconnectTimer) clearTimeout(reconnectTimer);
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
    setNotifications(prev => [notif, ...prev]);
    // Solo mostrar el popup emergente si la notificación va dirigida al usuario actual logueado
    const isForCurrentUser = 
      !notif.userId ||
      notif.userId === currentUserId ||
      notif.userId === currentUser.id ||
      (currentUser.username && notif.userId === currentUser.username);

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
              playMessageSound();
            } catch {}

            // Open active chat window or show indicator
            setActiveChatWindows(prev => {
              const existing = prev.find(w => normalizeUserId(w.targetUserId) === normEmi);
              if (existing) return prev;
              return [...prev, { targetUserId: newMsg.emisorId, minimized: false }];
            });

            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('inkorium:chat_message_sync', {
                detail: { targetUserId: newMsg.emisorId, message: newMsg }
              }));
            }
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
        if (normRecipient === normCurrentUser && normalizeUserId(senderUserId) !== normCurrentUser) {
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
            playMessageSound();
          } catch {}
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('inkorium:chat_message_sync', {
              detail: { targetUserId: message.emisorId, message }
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
      }
    });

    return () => unsubscribe();
  }, [currentUserId]);

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

  const setIsRealtime = useCallback((enabled: boolean) => {
    setIsRealtimeSimulationEnabledState(enabled);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('inkorium:realtime_sim', String(enabled));
    }
  }, []);

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

    const msgId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `chat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newMsg: ChatMessage = {
      id: msgId,
      emisorId: currentUserId,
      receptorId: targetUserId,
      mensaje: message,
      fecha: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      leido: true
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
  }, [currentUserId, currentUser, users, isRealtimeSimulationEnabled, pushNotification]);

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

  // Realtime simulation events (disabled to prevent mock injections)
  const simulateIncomingMessage = useCallback(() => {}, []);
  const simulateWallComment = useCallback(() => {}, []);

  const simulateFriendRequest = useCallback(() => {}, []);
  const simulatePhotoInteraction = useCallback(() => {}, []);

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
      isRealtimeSimulationEnabled, isLoggedIn,
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
      setActiveTab, viewUserProfile, openComposeMessage, viewPhoto, viewAlbum, setCurrentUserById,
      login, loginAsUser, logout, publishStatus, updateStatusText, updateUserPresence,
      likeFeedItem, commentFeedItem, postWallComment, deleteWallComment,
      uploadPhoto, addPhotoTag, removePhotoTag, addPhotoComment, likePhoto,
      setPhotoAsAvatar, deletePhoto, createAlbum, renameAlbum, deleteAlbum,
      sendFriendRequest, acceptFriendRequest, ignoreFriendRequest, removeFriendship, cancelFriendRequest, isFriend, hasPendingRequest, getFriendsOf,
      sendPrivateMessage, markMessageAsRead, deleteMessage, deleteConversation,
      sendChatMessage, sendChatTyping, openChatWith, closeChat, toggleMinimizeChat, setChatEstado,
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
