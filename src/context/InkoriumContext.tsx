import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { User, Photo, Album, FeedItem, WallComment, PrivateMessage, FriendRequest, Friendship, ChatMessage, ChatWindow, InkoriumNotification, AccessLog, UserActivity, UserPresence, ThemeMode, Track, RepeatMode } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { fetchPosts, createPost } from '../lib/postsApi';
import { fetchPhotos, insertPhoto } from '../lib/photosApi';
import { INITIAL_USERS, INITIAL_ALBUMS, INITIAL_PHOTOS, INITIAL_FEED, INITIAL_WALL_COMMENTS, INITIAL_FRIENDSHIPS, INITIAL_FRIEND_REQUESTS, INITIAL_MESSAGES, INITIAL_NOTIFICATIONS, INITIAL_ACCESS_LOGS, INITIAL_ACTIVITIES } from '../data/mockData';
import { INITIAL_MUSIC_TRACKS } from '../data/musicTracks';
import { musicAudioEngine } from '../utils/audioEngine';
import { appendMessageToConversation } from '../lib/chatHistory';
import { generateRetroChatReply, generateRetroPrivateMessageReply } from '../lib/retroChatReplies';
import { playMessageSound } from '../utils/sound';

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

  const setIsRealtime = useCallback((enabled: boolean) => {
    setIsRealtimeSimulationEnabledState(enabled);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('inkorium:realtime_sim', String(enabled));
    }
  }, []);
  
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
      const existing = prev.find(win => win.targetUserId === targetUserId);
      if (existing) return prev.map(win => win.targetUserId === targetUserId ? { ...win, minimized: false } : win);
      return [...prev, { targetUserId, minimized: false }];
    });

    // 3. Notificar a componentes activos
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('inkorium:chat_message_sync', {
        detail: { targetUserId, message: newMsg }
      }));
    }

    // 4. Simulación interactiva de respuesta del contacto
    const targetUser = users.find(u => u.id === targetUserId || u.username === targetUserId);
    if (targetUser && isRealtimeSimulationEnabled) {
      // Indicar que el contacto está escribiendo tras breve pausa
      const typingTimer = setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('inkorium:peer_typing', {
            detail: { targetUserId, isTyping: true }
          }));
        }
      }, 600);

      // Responder con mensaje retro tras 1.8 - 3.2 segundos
      const replyDelay = 1800 + Math.random() * 1400;
      setTimeout(() => {
        clearTimeout(typingTimer);

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('inkorium:peer_typing', {
            detail: { targetUserId, isTyping: false }
          }));
        }

        const replyText = generateRetroChatReply(targetUser.nombre, message);
        const replyMsg: ChatMessage = {
          id: `chat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          emisorId: targetUserId,
          receptorId: currentUserId,
          mensaje: replyText,
          fecha: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          timestamp: Date.now(),
          leido: true
        };

        appendMessageToConversation(currentUserId, targetUserId, replyMsg);
        setChatMessages(prev => [...prev, replyMsg]);

        try {
          playMessageSound();
        } catch {}

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('inkorium:chat_message_sync', {
            detail: { targetUserId, message: replyMsg }
          }));
        }

        // Si la ventana está minimizada o cerrada, mostrar toast y aviso
        setActiveChatWindows(currentWindows => {
          const win = currentWindows.find(w => w.targetUserId === targetUserId);
          if (!win || win.minimized) {
            pushNotification({
              id: `notif-chat-${Date.now()}`,
              tipo: 'chat',
              userId: currentUserId,
              fromUserId: targetUserId,
              fromUserName: `${targetUser.nombre} ${targetUser.apellidos}`.trim() || targetUser.nombre,
              fromUserAvatar: targetUser.avatar,
              mensaje: `te ha escrito en el chat: "${replyText}"`,
              enlace: 'chat',
              targetId: targetUserId,
              targetPreview: replyText,
              fecha: 'Ahora mismo',
              leido: false
            });
          }
          return currentWindows;
        });
      }, replyDelay);
    }
  }, [currentUserId, users, isRealtimeSimulationEnabled, pushNotification]);

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

    setMessages(prev => {
      const updated = [newMsg, ...prev];
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('inkorium:messages', JSON.stringify(updated));
      }
      return updated;
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

    // 5. Simulación interactiva de respuesta del contacto
    if (targetUser && isRealtimeSimulationEnabled) {
      const replyDelay = 3200 + Math.random() * 2000;
      setTimeout(() => {
        const { subject: replySub, body: replyBody } = generateRetroPrivateMessageReply(
          targetUser.nombre,
          newMsg.asunto,
          cleanText
        );

        const replyMsgId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const replyMsg: PrivateMessage = {
          id: replyMsgId,
          emisorId: resolvedReceptorId,
          emisorNombre: resolvedReceptorName,
          emisorAvatar: resolvedReceptorAvatar,
          receptorId: currentUserId,
          receptorNombre: currentUser.full_name || `${currentUser.nombre} ${currentUser.apellidos}`.trim() || currentUser.nombre,
          asunto: replySub,
          mensaje: replyBody,
          fecha: 'Ahora mismo',
          leido: false
        };

        setMessages(prev => {
          const updated = [replyMsg, ...prev];
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('inkorium:messages', JSON.stringify(updated));
          }
          return updated;
        });

        try {
          playMessageSound();
        } catch {}

        pushNotification({
          id: `notif-mp-${Date.now()}`,
          tipo: 'mp',
          userId: currentUserId,
          fromUserId: resolvedReceptorId,
          fromUserName: resolvedReceptorName,
          fromUserAvatar: resolvedReceptorAvatar,
          mensaje: `te ha respondido al mensaje privado: "${replySub}"`,
          enlace: 'mensajes',
          targetId: replyMsgId,
          targetPreview: replyBody.slice(0, 80),
          fecha: 'Ahora mismo',
          leido: false
        });
      }, replyDelay);
    }

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
    setMessages(prev => {
      const updated = prev.filter(m => m.id !== messageId);
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
    const cleanText = texto.trim();
    if (!currentUserId || !cleanText || !propietarioId) return;

    // Resolver usuario destinatario por id, username o alias
    const targetUser = users.find(u => 
      u.id === propietarioId || 
      u.username === propietarioId || 
      (u.id === 'user-nightloot' && propietarioId === 'nightloot') ||
      (u.id === 'nightloot' && propietarioId === 'user-nightloot')
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
      (currentUser.username && resolvedPropietarioId === currentUser.username) ||
      (currentUser.id === 'user-nightloot' && resolvedPropietarioId === 'nightloot') ||
      (currentUser.id === 'nightloot' && resolvedPropietarioId === 'user-nightloot');

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
    const authorName = `${randomFriend.nombre} ${randomFriend.apellidos}`.trim();
    const commentText = '¡Esa foto de perfil está genial! Saludos nostálgicos ;)';
    const newComment: WallComment = {
      id: commentId,
      propietarioId: currentUserId,
      receptorId: currentUserId,
      autorId: randomFriend.id,
      emisorId: randomFriend.id,
      autorNombre: authorName,
      emisorNombre: authorName,
      autorAvatar: randomFriend.avatar,
      emisorAvatar: randomFriend.avatar,
      texto: commentText,
      comentario: commentText,
      fecha: 'Ahora mismo',
      likes: []
    };
    setWallComments(prev => [newComment, ...prev]);
    pushNotification({
      id: `notif-sim-wc-${Date.now()}`,
      tipo: 'tablon',
      userId: currentUserId,
      fromUserId: randomFriend.id,
      fromUserName: authorName,
      fromUserAvatar: randomFriend.avatar,
      mensaje: 'ha firmado en tu tablón.',
      enlace: 'perfil',
      targetId: commentId,
      targetPreview: commentText,
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
  const isMessageForCurrentUser = (m: PrivateMessage) => {
    return (
      m.receptorId === effectiveUserId ||
      m.receptorId === currentUser.id ||
      (currentUser.username && m.receptorId.toLowerCase() === currentUser.username.toLowerCase()) ||
      (currentUser.email && m.receptorId.toLowerCase() === currentUser.email.toLowerCase()) ||
      ((currentUser.id === 'user-nightloot' || currentUser.id === 'nightloot') && (m.receptorId === 'nightloot' || m.receptorId === 'user-nightloot'))
    );
  };
  const unreadMessagesCount = messages.filter(m => isMessageForCurrentUser(m) && !m.leido).length;
  const unreadNotificationsCount = notifications.filter(n => (n.userId === effectiveUserId || n.userId === currentUser.id || (n.userId === 'nightloot' && currentUser.id === 'user-nightloot')) && !n.leido).length;
  const pendingRequestsCount = friendRequests.filter(r => (r.receptorId === effectiveUserId || r.receptorId === currentUser.id || (r.receptorId === 'nightloot' && currentUser.id === 'user-nightloot')) && r.estado === 'pendiente').length;

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
