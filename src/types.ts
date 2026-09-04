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
}

export type RepeatMode = 'off' | 'all' | 'one';

export type UserPresence = 'conectado' | 'ausente' | 'ocupado' | 'invisible';

export type RelationshipStatus = 'Soltero/a' | 'Con pareja' | 'En una relación' | 'Casado/a' | 'Es complicado' | 'De fiesta en fiesta';

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
  fechaReg: string;
  online: boolean;
  ultimoAcceso: string;
  chatEstado: '1' | '0'; // '1' = activo, '0' = desactivado
  topAmigos?: string[]; // IDs de los 6-8 amigos destacados del perfil
  invitacionesRestantes?: number;
  invitacionesDisponibles?: number;
  invitacionesEnviadas?: UserInvitation[];
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
  nombre: string;
  descripcion?: string;
  portada?: string;
  numFotos?: number;
  fecha: string;
}

export interface WallComment {
  id: string;
  emisorId?: string;
  autorId?: string;
  emisorNombre?: string;
  autorNombre?: string;
  emisorAvatar?: string;
  autorAvatar?: string;
  receptorId?: string;
  propietarioId?: string;
  comentario?: string;
  texto?: string;
  fecha: string;
  likes?: string[];
}

export interface FeedItem {
  id: string;
  tipo: 'estado' | 'foto' | 'tablon' | 'amistad' | 'album' | 'evento' | 'pagina';
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

export interface Friendship {
  id: string;
  user1: string;
  user2: string;
  fecha: string;
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



