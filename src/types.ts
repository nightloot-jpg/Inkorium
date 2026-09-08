export type Gender = 'h' | 'm' | 'otro';

export type ThemeMode = 'light' | 'dark' | 'auto';

export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number; // in seconds
  coverUrl: string;
  audioUrl?: string;
  genre?: string;
  year?: number;
  synthStyle?: 'retro_pop' | 'chiptune' | 'electro' | 'lofi' | 'indie_rock' | 'ambient';
  youtubeId?: string;
  youtubeUrl?: string;
  channelTitle?: string;
  views?: string;
}

export interface YouTubeVideoResult {
  id: string; // videoId
  title: string;
  channelTitle: string;
  thumbnail: string;
  duration: string;
  durationSeconds: number;
  views?: string;
  publishedAt?: string;
  youtubeUrl: string;
}

export type RepeatMode = 'off' | 'all' | 'one';

export type UserPresence = 'conectado' | 'ausente' | 'ocupado' | 'invisible';

export type RelationshipStatus = 'Soltero/a' | 'Con pareja' | 'En una relación' | 'Casado/a' | 'Es complicado' | 'De fiesta en fiesta';

export type PrivacyAudience = 'amigos' | 'todos';

export interface ProfilePrivacySettings {
  fotos: PrivacyAudience;            // 'amigos': solo amigos; 'todos': público / todo el mundo
  tablon: PrivacyAudience;           // 'amigos': solo amigos; 'todos': público / todo el mundo
  amigos: PrivacyAudience;           // 'amigos': solo amigos; 'todos': público / todo el mundo
  info: PrivacyAudience;             // 'amigos': solo amigos; 'todos': público / todo el mundo
  comentarTablon: PrivacyAudience;   // 'amigos': solo amigos pueden firmar; 'todos': cualquier usuario registrado
  permitirNoRegistrados: boolean;    // Si es true, usuarios no registrados pueden ver las partes marcadas como 'todos'
}

export const DEFAULT_PROFILE_PRIVACY: ProfilePrivacySettings = {
  fotos: 'amigos',
  tablon: 'amigos',
  amigos: 'amigos',
  info: 'todos',
  comentarTablon: 'amigos',
  permitirNoRegistrados: true,
};

export interface User {
  id: string;
  username?: string;
  full_name?: string;
  nombre: string;
  apellidos: string;
  email: string;
  password?: string;
  sexo: Gender;
  fnac: string; // YYYY-MM-DD
  pais?: string;
  provincia: string;
  ciudad?: string;
  estado: string; // Status message ("¿Qué estás haciendo?")
  estadoFecha?: string;
  presencia?: UserPresence;
  situacionSentimental: RelationshipStatus;
  ocupacion?: string;
  intereses?: string;
  musica?: string;
  avatar: string;
  avatar_url?: string;
  fechaReg: string;
  online: boolean;
  ultimoAcceso: string;
  chatEstado: '1' | '0'; // '1' = activo, '0' = desactivado
  topAmigos?: string[]; // IDs de los 6-8 amigos destacados del perfil
  privacidadPerfil?: ProfilePrivacySettings; // Configuración de privacidad del perfil
  invitacionesRestantes?: number;
  invitacionesDisponibles?: number;
  invitacionesEnviadas?: UserInvitation[];
  updated_at?: string;
}

export interface PhotoTag {
  id: string;
  photoId?: string;
  userId: string;
  userName: string;
  usuarioId?: string;
  nombre?: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
}

export interface PhotoComment {
  id: string;
  photoId?: string;
  userId?: string;
  autorId?: string;
  nombre?: string;
  autorNombre?: string;
  avatar?: string;
  autorAvatar?: string;
  comentario?: string;
  texto?: string;
  fecha: string;
}

export type PhotoPrivacy = 'amigos' | 'publica' | 'eleccion';

export interface Photo {
  id: string;
  uploaderId: string;
  uploaderName: string;
  uploaderAvatar?: string;
  albumId?: string | null; // null for general uploads
  albumName?: string;
  archivo: string;
  titulo: string;
  fecha: string;
  etiquetas: PhotoTag[];
  comentarios: PhotoComment[];
  likes: string[]; // userIds
  privacidad?: PhotoPrivacy; // 'amigos' | 'publica' | 'eleccion'
  allowedUserIds?: string[]; // IDs de usuarios autorizados cuando privacidad es 'eleccion'
}

export interface Album {
  id: string;
  userId?: string;
  propietarioId?: string;
  propietarioNombre?: string;
  propietarioAvatar?: string;
  nombre: string;
  descripcion?: string;
  portada?: string;
  numFotos?: number;
  fecha: string;
  isCollaborative?: boolean;
  colaboradoresIds?: string[]; // IDs de amigos autorizados para subir fotos
  allowAllFriends?: boolean; // Permite a todos los amigos del propietario subir fotos
  eventId?: string; // ID del evento social vinculado (fiesta, quedada, cumpleaños)
  eventName?: string;
  categoria?: string;
  photoOrder?: string[]; // IDs de las fotos ordenadas cronológicamente para el evento
  timelineNotes?: Record<string, string>; // Notas/hitos cronológicos asociados a fotos específicas (ej: "Llegada al evento", "Brindis", "Fin de fiesta")
}

export interface SocialPlaylist {
  id: string;
  name: string;
  title?: string;
  description?: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar?: string;
  coverUrl: string;
  tracks: Track[];
  songsCount: number;
  duration: number; // in seconds
  durationFormatted?: string;
  category: 'populares' | 'nuevas' | 'amigos' | 'tuenti_classic' | 'verano' | 'indie' | 'reggaeton';
  likes?: string[];
  isCommunity?: boolean;
  isCustom?: boolean;
  isCollaborative?: boolean;
  collaborators?: string[];
  isPrivate?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CommunityListeningActivity {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userCity?: string;
  track: Track;
  timestamp: string;
  isProfileSong?: boolean;
  isPlayingNow?: boolean;
}

export interface WallComment {
  id: string;
  emisorId?: string;
  autorId?: string;
  author_id?: string;
  emisorNombre?: string;
  autorNombre?: string;
  author_name?: string;
  emisorAvatar?: string;
  autorAvatar?: string;
  author_avatar?: string;
  receptorId?: string;
  propietarioId?: string;
  profile_id?: string;
  comentario?: string;
  texto?: string;
  content?: string;
  fecha: string;
  created_at?: string;
  likes?: string[];
}

export interface FeedItem {
  id: string;
  tipo: 'estado' | 'foto' | 'tablon' | 'amistad' | 'album' | 'evento' | 'pagina' | 'musica' | 'playlist';
  propietarioId: string;
  propietarioNombre: string;
  propietarioAvatar: string;
  visitanteId?: string;
  visitanteNombre?: string;
  visitanteAvatar?: string;
  datos?: string;
  fotoUrl?: string;
  fotoId?: string;
  albumId?: string;
  track?: Track;
  playlist?: SocialPlaylist;
  fecha: string;
  likes: string[]; // userIds
  comentarios: {
    id: string;
    autorId?: string;
    userId?: string;
    nombre?: string;
    autorNombre?: string;
    avatar?: string;
    autorAvatar?: string;
    texto: string;
    fecha: string;
  }[];
}

export interface PrivateMessage {
  id: string;
  emisorId: string;
  emisorNombre: string;
  emisorAvatar: string;
  receptorId: string;
  receptorNombre: string;
  asunto: string;
  mensaje: string;
  fecha: string;
  leido: boolean;
}

export interface FriendRequest {
  id: string;
  emisorId: string;
  emisorNombre: string;
  emisorAvatar: string;
  emisorProvincia: string;
  receptorId: string;
  fecha: string;
  estado: 'pendiente' | 'aceptada' | 'ignorada' | 'rechazada';
}

export type FriendCategory = 'mejores_amigos' | 'familia' | 'colegas' | 'fiesta' | 'general';

export interface FriendCategoryConfig {
  id: FriendCategory;
  label: string;
  shortLabel: string;
  description: string;
  emoji: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  colorName: string;
}

export const PREDEFINED_FRIEND_CATEGORIES: FriendCategoryConfig[] = [
  {
    id: 'mejores_amigos',
    label: 'Mejores Amigos',
    shortLabel: 'Mejores',
    description: 'Tus amistades más cercanas y de máxima confianza',
    emoji: '⭐',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/40',
    badgeText: 'text-amber-700 dark:text-amber-300',
    badgeBorder: 'border-amber-200 dark:border-amber-800/60',
    colorName: 'amber'
  },
  {
    id: 'familia',
    label: 'Familia',
    shortLabel: 'Familia',
    description: 'Familiares y parientes cercanos',
    emoji: '❤️',
    badgeBg: 'bg-rose-50 dark:bg-rose-950/40',
    badgeText: 'text-rose-700 dark:text-rose-300',
    badgeBorder: 'border-rose-200 dark:border-rose-800/60',
    colorName: 'rose'
  },
  {
    id: 'colegas',
    label: 'Colegas / Uni / Trabajo',
    shortLabel: 'Colegas',
    description: 'Compañeros de clase, universidad o trabajo',
    emoji: '🎓',
    badgeBg: 'bg-sky-50 dark:bg-sky-950/40',
    badgeText: 'text-sky-700 dark:text-sky-300',
    badgeBorder: 'border-sky-200 dark:border-sky-800/60',
    colorName: 'sky'
  },
  {
    id: 'fiesta',
    label: 'Fiesta & Salir',
    shortLabel: 'Fiesta',
    description: 'Gente para salir de fiesta, festivales y conciertos',
    emoji: '🎉',
    badgeBg: 'bg-purple-50 dark:bg-purple-950/40',
    badgeText: 'text-purple-700 dark:text-purple-300',
    badgeBorder: 'border-purple-200 dark:border-purple-800/60',
    colorName: 'purple'
  },
  {
    id: 'general',
    label: 'Amigos (General)',
    shortLabel: 'Amigos',
    description: 'Círculo general de amigos y conocidos',
    emoji: '👥',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    badgeBorder: 'border-emerald-200 dark:border-emerald-800/60',
    colorName: 'emerald'
  }
];

export interface Friendship {
  id: string;
  user1: string;
  user2: string;
  fecha: string;
  categoria?: FriendCategory;
  categoriaPorUsuario?: Record<string, FriendCategory>;
  notaPrivada?: string;
}

export interface ChatWindow {
  targetUserId: string;
  minimized: boolean;
}

export interface ChatMessage {
  id: string;
  emisorId: string;
  receptorId: string;
  mensaje: string;
  fecha: string;
  leido: boolean;
  timestamp?: number;
  readAt?: number;
  readDate?: string;
  delivered?: boolean;
  deliveredAt?: number;
  imageUrl?: string;
  isNudge?: boolean;
  reactions?: Record<string, string[]>;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
}

export interface InkoriumNotification {
  id: string;
  userId: string; // recipient
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar?: string;
  tipo: 'peticion' | 'mp' | 'tablon' | 'foto' | 'foto_comentario' | 'etiqueta' | 'like' | 'chat' | 'sistema' | 'amistad';
  mensaje: string;
  enlace?: string;
  leido: boolean;
  fecha: string;
  detalle?: string;
  targetId?: string;
  targetPreview?: string;
  photoThumbnail?: string;
  targetPhotoUrl?: string;
  fotoId?: string;
  timestamp?: number;
  estadoPeticion?: 'pendiente' | 'aceptada' | 'rechazada' | 'ignorada';
}

export interface AccessLog {
  id: string;
  ip: string;
  navegador: string;
  fecha: string;
  ubicacion: string;
}

export type UserActivityType = 
  | 'avatar_change'       // ha cambiado su foto de perfil
  | 'friend_added'        // ahora es amigo de...
  | 'status_update'       // ha actualizado su estado
  | 'photo_upload'        // ha subido una nueva foto
  | 'album_created'       // ha creado un nuevo álbum
  | 'wall_post'           // ha firmado en el tablón de...
  | 'photo_comment'       // ha comentado en una foto de...
  | 'info_update';        // ha actualizado su información de perfil

export interface UserActivity {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  type: UserActivityType;
  title: string;
  detail?: string;
  targetUserId?: string;
  targetUserName?: string;
  targetUserAvatar?: string;
  targetPhotoId?: string;
  targetPhotoUrl?: string;
  targetAlbumId?: string;
  targetAlbumName?: string;
  date: string;
  timestamp: number;
}

export type { CountryLocation } from './data/locations';
export { 
  COUNTRIES_LIST, 
  PROVINCIAS_ESPANA, 
  ALL_COUNTRIES, 
  getZonesForCountry, 
  getCountryByZone, 
  formatFullLocation,
  calculateAge,
  formatBirthDate
} from './data/locations';

// ==========================================
// NUEVAS FUNCIONALIDADES TUENTI CLÁSICAS
// ==========================================

// 1. EVENTOS Y QUEDADAS
export type EventAttendanceStatus = 'asistire' | 'quizas' | 'no_asistire';

export interface EventAttendee {
  userId: string;
  userName: string;
  userAvatar: string;
  estado: EventAttendanceStatus;
  fecha: string;
}

export interface EventComment {
  id: string;
  autorId: string;
  autorNombre: string;
  autorAvatar: string;
  texto: string;
  fecha: string;
}

export interface EventPhoto {
  id: string;
  url: string;
  uploaderId: string;
  uploaderName: string;
  uploaderAvatar: string;
  caption?: string;
  fecha: string;
  timestamp: number;
  likes: string[];
}

export interface SocialEvent {
  id: string;
  creadorId: string;
  creadorNombre: string;
  creadorAvatar: string;
  titulo: string;
  descripcion: string;
  lugar: string;
  ciudad?: string;
  provincia?: string;
  fechaHora: string; // Formato legible ej "Viernes, 23:00" o fecha ISO
  fechaTexto: string;
  portada?: string;
  categoria: 'fiesta' | 'cumpleanos' | 'botellon' | 'concierto' | 'deporte' | 'quedada' | 'otro';
  asistentes: EventAttendee[];
  comentarios: EventComment[];
  privacidad: 'publico' | 'amigos' | 'invitacion';
  fotosAlbumId?: string; // Álbum colaborativo opcional del evento
  fotosColaborativas?: EventPhoto[]; // Fotos volcadas post-fiesta por los asistentes
}

// 2. VISITAS AL PERFIL ("Quién ha visto mi perfil")
export interface ProfileVisit {
  id: string;
  visitorId: string;
  visitorName: string;
  visitorAvatar: string;
  visitorProvincia?: string;
  visitedUserId: string;
  fecha: string;
  timestamp: number;
}

// 3. PÁGINAS Y SITIOS DE TUENTI
export interface PagePost {
  id: string;
  autorId: string;
  autorNombre: string;
  autorAvatar: string;
  texto: string;
  fecha: string;
  likes: string[];
  fotoUrl?: string;
}

export interface TuentiPage {
  id: string;
  nombre: string;
  categoria: 'discoteca' | 'musica' | 'comunidad' | 'ocio' | 'humor' | 'universidad' | 'local';
  descripcion: string;
  avatar: string;
  portada?: string;
  creadorId: string;
  seguidores: string[]; // userIds que son "fans"
  fechaCreacion: string;
  posts: PagePost[];
  ubicacion?: string;
  verificada?: boolean;
}

// 4. INVITACIONES EXCLUSIVAS
export interface UserInvitation {
  id: string;
  codigo?: string;
  code?: string;
  email?: string;
  fecha?: string;
  creada?: string;
  canjeada?: boolean;
  canjeadaPorNombre?: string;
  estado?: 'pendiente' | 'usada';
  usadaPorNombre?: string;
}

// 5. JUEGOS Y RANKINGS
export interface GameScore {
  id: string;
  gameId?: 'trivia' | 'stacker';
  juego: 'trivia' | 'stacker';
  userId: string;
  userName: string;
  userAvatar: string;
  score?: number;
  puntos: number;
  date?: string;
  fecha?: string;
}

// 6. COMUNIDADES LOCALES / CAMPUS UNIVERSITARIOS E INSTITUTOS
export interface CampusReply {
  id: string;
  autorId: string;
  autorNombre: string;
  autorAvatar: string;
  texto: string;
  fecha: string;
}

export interface CampusPost {
  id: string;
  autorId: string;
  autorNombre: string;
  autorAvatar: string;
  tipo: 'apuntes' | 'quedada' | 'fiesta' | 'duda' | 'general';
  titulo?: string;
  texto: string;
  fecha: string;
  likes: string[];
  respuestas: CampusReply[];
}

export interface CampusCommunity {
  id: string;
  nombre: string;
  tipo: 'universidad' | 'instituto' | 'barrio';
  ciudad: string;
  siglas?: string;
  descripcion: string;
  avatar: string;
  portada: string;
  miembros: string[]; // userIds que pertenecen a este campus
  posts: CampusPost[];
}

export interface PushNotificationPreferences {
  enabled: boolean;
  mensajes: boolean; // Avisos de nuevos mensajes privados
  comentarios_tablon: boolean; // Avisos de nuevas firmas y comentarios en el tablón
  amigos: boolean; // Peticiones de amistad y nuevos amigos
  etiquetas: boolean; // Etiquetas en fotos y álbumes
  eventos: boolean; // Invitaciones a eventos y quedadas
  sonido: boolean; // Tono de notificación retro
}

export interface ServiceWorkerStatusInfo {
  isSupported: boolean;
  isRegistered: boolean;
  registrationScope?: string;
  scriptUrl?: string;
  state?: 'installing' | 'installed' | 'activating' | 'activated' | 'redundant' | 'not-registered';
  permission: NotificationPermission;
  isSubscribed: boolean;
  endpoint?: string;
  lastUpdated?: string;
}

export interface PushSubscriptionRecord {
  id: string;
  userId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
  createdAt: string;
  updatedAt: string;
}




