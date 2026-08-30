export type Gender = 'h' | 'm' | 'otro';

export type RelationshipStatus = 'Soltero/a' | 'Con pareja' | 'En una relación' | 'Casado/a' | 'Es complicado' | 'De fiesta en fiesta';

export interface User {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  password?: string;
  sexo: Gender;
  fnac: string; // YYYY-MM-DD
  provincia: string;
  ciudad?: string;
  estado: string; // Status message ("¿Qué estás haciendo?")
  estadoFecha?: string;
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
  userId: string;
  nombre: string;
  descripcion?: string;
  fecha: string;
}

export interface WallComment {
  id: string;
  emisorId: string;
  emisorNombre: string;
  emisorAvatar: string;
  receptorId: string;
  comentario: string;
  fecha: string;
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
    userId: string;
    nombre: string;
    avatar: string;
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
  estado: 'pendiente' | 'aceptada' | 'ignorada';
}

export interface Friendship {
  id: string;
  user1: string;
  user2: string;
  fecha: string;
}

export interface ChatMessage {
  id: string;
  emisorId: string;
  receptorId: string;
  mensaje: string;
  fecha: string;
  leido: boolean;
}

export interface InkoriumNotification {
  id: string;
  userId: string; // recipient
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar: string;
  tipo: 'peticion' | 'mp' | 'tablon' | 'foto' | 'etiqueta' | 'like';
  mensaje: string;
  enlace: string;
  leido: boolean;
  fecha: string;
  detalle?: string;
  targetId?: string;
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

export const PROVINCIAS_ESPANA = [
  'Álava', 'Albacete', 'Alicante', 'Almería', 'Asturias', 'Ávila', 'Badajoz', 'Barcelona', 
  'Burgos', 'Cáceres', 'Cádiz', 'Cantabria', 'Castellón', 'Ciudad Real', 'Córdoba', 'Cuenca', 
  'Girona', 'Granada', 'Guadalajara', 'Guipúzcoa', 'Huelva', 'Huesca', 'Islas Baleares', 
  'Jaén', 'La Coruña', 'La Rioja', 'Las Palmas', 'León', 'Lleida', 'Lugo', 'Madrid', 
  'Málaga', 'Murcia', 'Navarra', 'Ourense', 'Palencia', 'Pontevedra', 'Salamanca', 
  'Santa Cruz de Tenerife', 'Segovia', 'Sevilla', 'Soria', 'Tarragona', 'Teruel', 
  'Toledo', 'Valencia', 'Valladolid', 'Vizcaya', 'Zamora', 'Zaragoza', 'Ceuta', 'Melilla'
];
