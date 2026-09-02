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
}

export interface PhotoTag {
  id: string;
  photoId: string;
  userId: string;
  userName: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
}

export interface PhotoComment {
  id: string;
  photoId: string;
  userId: string;
  nombre: string;
  avatar: string;
  comentario: string;
  fecha: string;
}

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
  tipo: 'estado' | 'foto' | 'tablon' | 'amistad' | 'album';
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
}

export interface InkoriumNotification {
  id: string;
  userId: string; // recipient
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar: string;
  tipo: 'peticion' | 'mp' | 'tablon' | 'foto' | 'foto_comentario' | 'etiqueta' | 'like' | 'chat';
  mensaje: string;
  enlace: string;
  leido: boolean;
  fecha: string;
  detalle?: string;
  targetId?: string;
  targetPreview?: string;
  photoThumbnail?: string;
  targetPhotoUrl?: string;
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
  formatFullLocation 
} from './data/locations';

