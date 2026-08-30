import { User, Photo, Album, FeedItem, WallComment, PrivateMessage, FriendRequest, Friendship, InkoriumNotification, AccessLog, UserActivity } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'user_1',
    nombre: 'Alejandro',
    apellidos: 'Serrano Vega',
    email: 'alex.serrano@inkorium.com',
    sexo: 'h',
    fnac: '1993-05-14',
    provincia: 'Madrid',
    ciudad: 'Madrid (Malasaña)',
    estado: '¡Vaya fiestón ayer en Fabrik! Ahora a descansar que toca estudiar para selectividad xD 🎧🙌',
    estadoFecha: 'Hace 2 horas',
    situacionSentimental: 'Soltero/a',
    ocupacion: 'Estudiante de Bachillerato / Amante de la música',
    intereses: 'Skate, indie rock, jugar al counter, salir con los colegas',
    musica: 'The Killers, El Canto del Loco, Arctic Monkeys, Pendulum',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
    fechaReg: '12/10/2009',
    online: true,
    ultimoAcceso: 'Ahora mismo',
    chatEstado: '1',
  },
  {
    id: 'user_2',
    nombre: 'Laura',
    apellidos: 'Gómez Vidal',
    email: 'laura.gomez@inkorium.com',
    sexo: 'm',
    fnac: '1994-08-22',
    provincia: 'Barcelona',
    ciudad: 'Barcelona',
    estado: '¡Tuenti > cualquier otra cosa! Subiendo todas las fotos de las fiestas de Gràcia 📷✨',
    estadoFecha: 'Hace 45 minutos',
    situacionSentimental: 'En una relación',
    ocupacion: 'Diseño gráfico & Fotografía',
    intereses: 'Cámara analógica, festival de Benicàssim, leer cómics',
    musica: 'Vetusta Morla, Florence + The Machine, Muse, Lori Meyers',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    fechaReg: '04/03/2010',
    online: true,
    ultimoAcceso: 'Hace 5 minutos',
    chatEstado: '1',
  },
  {
    id: 'user_3',
    nombre: 'Dani',
    apellidos: 'Martín Roca',
    email: 'dani.martin@inkorium.com',
    sexo: 'h',
    fnac: '1992-11-03',
    provincia: 'Valencia',
    ciudad: 'Valencia',
    estado: 'Alguien se echa un PRO esta tarde? Que avise por el chat y montamos torneo ⚽🎮',
    estadoFecha: 'Hace 3 horas',
    situacionSentimental: 'Es complicado',
    ocupacion: 'Informática & Gamer',
    intereses: 'PlayStation, fútbol los domingos, series anime, choleck fresquito',
    musica: 'Estopa, Ska-P, Foo Fighters, Blink-182',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    fechaReg: '18/01/2009',
    online: true,
    ultimoAcceso: 'Ahora mismo',
    chatEstado: '1',
  },
  {
    id: 'user_4',
    nombre: 'Bea',
    apellidos: 'Navarro Ruiz',
    email: 'bea.navarro@inkorium.com',
    sexo: 'm',
    fnac: '1994-02-18',
    provincia: 'Sevilla',
    ciudad: 'Sevilla (Triana)',
    estado: 'Planazo de finde: piscina, amigos y tinto de verano. ¿Quién se viene? ☀️🏊‍♀️',
    estadoFecha: 'Hace 5 horas',
    situacionSentimental: 'Soltero/a',
    ocupacion: 'Periodismo y Comunicación',
    intereses: 'Viajar por Andalucía, escribir en blogs, conciertos al aire libre',
    musica: 'Fito & Fitipaldis, Amaral, Pereza, Melendi (los primeros discos)',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    fechaReg: '09/06/2009',
    online: false,
    ultimoAcceso: 'Ayer a las 23:40',
    chatEstado: '1',
  },
  {
    id: 'user_5',
    nombre: 'Carlos',
    apellidos: 'Ruiz Montes',
    email: 'carlos.ruiz@inkorium.com',
    sexo: 'h',
    fnac: '1993-09-30',
    provincia: 'Málaga',
    ciudad: 'Málaga',
    estado: 'Echando de menos los veranos sin preocupaciones... nostalgia pura en Inkorium ❤️',
    estadoFecha: 'Hace 1 día',
    situacionSentimental: 'Con pareja',
    ocupacion: 'Entrenador deportivo',
    intereses: 'Baloncesto, playa, playa y más playa, cine de los 90',
    musica: 'Linkin Park, Green Day, Red Hot Chili Peppers',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    fechaReg: '22/11/2008',
    online: true,
    ultimoAcceso: 'Hace 12 minutos',
    chatEstado: '1',
  },
  {
    id: 'user_6',
    nombre: 'Sara',
    apellidos: 'Iglesias Cano',
    email: 'sara.iglesias@inkorium.com',
    sexo: 'm',
    fnac: '1995-07-12',
    provincia: 'Vizcaya',
    ciudad: 'Bilbao',
    estado: 'Etiquetando a tod@s en las fotos del campamento!! Buscad vuestras caras jaja 📸😜',
    estadoFecha: 'Hace 6 horas',
    situacionSentimental: 'Soltero/a',
    ocupacion: 'Bellas Artes',
    intereses: 'Ilustración, senderismo por el norte, festivales',
    musica: 'La Oreja de Van Gogh, Deluxe, Mando Diao, Two Door Cinema Club',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
    fechaReg: '15/09/2010',
    online: false,
    ultimoAcceso: 'Hace 3 horas',
    chatEstado: '1',
  },
  {
    id: 'user_7',
    nombre: 'Javier',
    apellidos: 'Blanco Peña',
    email: 'javi.blanco@inkorium.com',
    sexo: 'h',
    fnac: '1992-04-05',
    provincia: 'Zaragoza',
    ciudad: 'Zaragoza',
    estado: 'En el curro deseando que sean las 18:00 para ir al gym y luego cerveceo 🍺',
    estadoFecha: 'Hace 30 minutos',
    situacionSentimental: 'De fiesta en fiesta',
    ocupacion: 'Telecomunicaciones',
    intereses: 'Motos, pádel, pinchar música techno en fiestas privadas',
    musica: 'David Guetta, Tiësto, Swedish House Mafia, Daft Punk',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&auto=format&fit=crop&q=80',
    fechaReg: '30/08/2009',
    online: true,
    ultimoAcceso: 'Ahora mismo',
    chatEstado: '1',
  },
  {
    id: 'user_8',
    nombre: 'Cristina',
    apellidos: 'Morales Gil',
    email: 'cris.morales@inkorium.com',
    sexo: 'm',
    fnac: '1994-12-01',
    provincia: 'Salamanca',
    ciudad: 'Salamanca',
    estado: 'La noche universitaria de Salamanca no se compara con nada en el mundo!! 🎉🥂',
    estadoFecha: 'Hace 7 horas',
    situacionSentimental: 'Soltero/a',
    ocupacion: 'Filología Hispánica',
    intereses: 'Lectura, teatro, tapas por la plaza Mayor, escapadas rurales',
    musica: 'Zahara, Iván Ferreiro, Russian Red, Love of Lesbian',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80',
    fechaReg: '11/02/2011',
    online: true,
    ultimoAcceso: 'Hace 2 minutos',
    chatEstado: '1',
  }
];

export const INITIAL_ALBUMS: Album[] = [
  {
    id: 'alb_1',
    userId: 'user_1',
    nombre: 'Verano 2009 con los colegas',
    descripcion: 'Las mejores vacaciones en Gandía y Calpe. ¡Inolvidable!',
    fecha: '28/08/2009',
  },
  {
    id: 'alb_2',
    userId: 'user_1',
    nombre: 'Conciertos y Festis',
    descripcion: 'Recuerdos de directos brutales y noches sin dormir',
    fecha: '14/05/2010',
  },
  {
    id: 'alb_3',
    userId: 'user_2',
    nombre: 'Fiestas Mayores y Noches Locas',
    descripcion: 'Fotos con toda la peña en Barna',
    fecha: '02/09/2010',
  },
  {
    id: 'alb_4',
    userId: 'user_3',
    nombre: 'Torneos de fútbol y paellas',
    descripcion: 'El equipazo de los domingos',
    fecha: '19/04/2010',
  }
];

export const INITIAL_PHOTOS: Photo[] = [
  {
    id: 'photo_1',
    uploaderId: 'user_1',
    uploaderName: 'Alejandro Serrano',
    albumId: 'alb_1',
    albumName: 'Verano 2009 con los colegas',
    archivo: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=900&auto=format&fit=crop&q=80',
    titulo: 'Atardecer en la playa después de pasar todo el día en el chiringuito',
    fecha: '24/08/2009 20:15',
    likes: ['user_2', 'user_3', 'user_4', 'user_6'],
    etiquetas: [
      { id: 'tag_1', photoId: 'photo_1', userId: 'user_1', userName: 'Alejandro Serrano', x: 30, y: 45 },
      { id: 'tag_2', photoId: 'photo_1', userId: 'user_2', userName: 'Laura Gómez', x: 62, y: 42 }
    ],
    comentarios: [
      {
        id: 'pcom_1',
        photoId: 'photo_1',
        userId: 'user_2',
        nombre: 'Laura Gómez',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
        comentario: '¡Qué fotaza Álex! Qué morenos estábamos jaja, hay que repetir el año que viene sí o sí.',
        fecha: '25/08/2009 11:32'
      },
      {
        id: 'pcom_2',
        photoId: 'photo_1',
        userId: 'user_3',
        nombre: 'Dani Martín',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
        comentario: 'Ese postureo bueno jajaja grande!!',
        fecha: '25/08/2009 13:05'
      }
    ]
  },
  {
    id: 'photo_2',
    uploaderId: 'user_1',
    uploaderName: 'Alejandro Serrano',
    albumId: 'alb_1',
    albumName: 'Verano 2009 con los colegas',
    archivo: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=900&auto=format&fit=crop&q=80',
    titulo: 'En primera fila dándolo todo en el escenario principal!! 🎸🔥',
    fecha: '15/07/2009 23:45',
    likes: ['user_2', 'user_5', 'user_7'],
    etiquetas: [
      { id: 'tag_3', photoId: 'photo_2', userId: 'user_1', userName: 'Alejandro Serrano', x: 45, y: 50 },
      { id: 'tag_4', photoId: 'photo_2', userId: 'user_3', userName: 'Dani Martín', x: 75, y: 48 }
    ],
    comentarios: [
      {
        id: 'pcom_3',
        photoId: 'photo_2',
        userId: 'user_7',
        nombre: 'Javier Blanco',
        avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&auto=format&fit=crop&q=80',
        comentario: 'Menudo conciertazo chavales, casi me quedo sin voz al cantar.',
        fecha: '16/07/2009 14:20'
      }
    ]
  },
  {
    id: 'photo_3',
    uploaderId: 'user_2',
    uploaderName: 'Laura Gómez',
    albumId: 'alb_3',
    albumName: 'Fiestas Mayores y Noches Locas',
    archivo: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=900&auto=format&fit=crop&q=80',
    titulo: 'Con las mejores de la uni, no os cambio por nada chicas ❤️',
    fecha: '01/09/2010 01:20',
    likes: ['user_1', 'user_4', 'user_6', 'user_8'],
    etiquetas: [
      { id: 'tag_5', photoId: 'photo_3', userId: 'user_2', userName: 'Laura Gómez', x: 40, y: 38 },
      { id: 'tag_6', photoId: 'photo_3', userId: 'user_4', userName: 'Bea Navarro', x: 68, y: 35 }
    ],
    comentarios: [
      {
        id: 'pcom_4',
        photoId: 'photo_3',
        userId: 'user_4',
        nombre: 'Bea Navarro',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
        comentario: 'Guapísimas todas!! Tuenti no nos deja etiquetar a más de 10 personas pero os quiero igual xd',
        fecha: '01/09/2010 10:15'
      }
    ]
  },
  {
    id: 'photo_4',
    uploaderId: 'user_3',
    uploaderName: 'Dani Martín',
    albumId: 'alb_4',
    albumName: 'Torneos de fútbol y paellas',
    archivo: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=900&auto=format&fit=crop&q=80',
    titulo: 'Sesión DJ en directo, ambientazo increíble anoche 🎧🎶',
    fecha: '18/04/2010 03:30',
    likes: ['user_1', 'user_7', 'user_5'],
    etiquetas: [
      { id: 'tag_7', photoId: 'photo_4', userId: 'user_3', userName: 'Dani Martín', x: 50, y: 40 }
    ],
    comentarios: []
  },
  {
    id: 'photo_5',
    uploaderId: 'user_4',
    uploaderName: 'Bea Navarro',
    albumId: null,
    archivo: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900&auto=format&fit=crop&q=80',
    titulo: 'Playa de Cádiz, paz absoluta 🌊🏖️',
    fecha: '10/08/2010 18:40',
    likes: ['user_1', 'user_2', 'user_5'],
    etiquetas: [
      { id: 'tag_8', photoId: 'photo_5', userId: 'user_4', userName: 'Bea Navarro', x: 50, y: 50 }
    ],
    comentarios: [
      {
        id: 'pcom_5',
        photoId: 'photo_5',
        userId: 'user_1',
        nombre: 'Alejandro Serrano',
        avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
        comentario: '¡Qué envidia sana Bea! Disfruta mucho del sur.',
        fecha: '10/08/2010 19:10'
      }
    ]
  }
];

export const INITIAL_FEED: FeedItem[] = [
  {
    id: 'feed_1',
    tipo: 'estado',
    propietarioId: 'user_2',
    propietarioNombre: 'Laura Gómez',
    propietarioAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    datos: '¡Tuenti > cualquier otra cosa! Subiendo todas las fotos de las fiestas de Gràcia 📷✨',
    fecha: 'Hace 45 minutos',
    likes: ['user_1', 'user_4', 'user_6'],
    comentarios: [
      {
        id: 'fcom_1',
        userId: 'user_1',
        nombre: 'Alejandro Serrano',
        avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
        texto: 'A ver si sales etiquetada en alguna que no dé vergüenza jajaja',
        fecha: 'Hace 30 minutos'
      },
      {
        id: 'fcom_2',
        userId: 'user_2',
        nombre: 'Laura Gómez',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
        texto: '@Alejandro ¡Oye! Que salgo estupenda en todas 💅😋',
        fecha: 'Hace 20 minutos'
      }
    ]
  },
  {
    id: 'feed_2',
    tipo: 'foto',
    propietarioId: 'user_1',
    propietarioNombre: 'Alejandro Serrano',
    propietarioAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
    datos: 'Atardecer en la playa después de pasar todo el día en el chiringuito',
    fotoUrl: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=900&auto=format&fit=crop&q=80',
    fotoId: 'photo_1',
    fecha: 'Hace 2 horas',
    likes: ['user_2', 'user_3', 'user_4', 'user_6'],
    comentarios: []
  },
  {
    id: 'feed_3',
    tipo: 'amistad',
    propietarioId: 'user_3',
    propietarioNombre: 'Dani Martín',
    propietarioAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    visitanteId: 'user_7',
    visitanteNombre: 'Javier Blanco',
    visitanteAvatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&auto=format&fit=crop&q=80',
    fecha: 'Hace 3 horas',
    likes: ['user_1'],
    comentarios: []
  },
  {
    id: 'feed_4',
    tipo: 'tablon',
    propietarioId: 'user_1',
    propietarioNombre: 'Alejandro Serrano',
    propietarioAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
    visitanteId: 'user_8',
    visitanteNombre: 'Cristina Morales',
    visitanteAvatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80',
    datos: '¡Ey Álex! ¿Vas a venir al final a la fiesta de Salamanca en octubre? No me falles eeeh!! 🥂',
    fecha: 'Hace 5 horas',
    likes: ['user_1'],
    comentarios: []
  },
  {
    id: 'feed_5',
    tipo: 'estado',
    propietarioId: 'user_4',
    propietarioNombre: 'Bea Navarro',
    propietarioAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    datos: 'Planazo de finde: piscina, amigos y tinto de verano. ¿Quién se viene? ☀️🏊‍♀️',
    fecha: 'Hace 5 horas',
    likes: ['user_1', 'user_5', 'user_2'],
    comentarios: []
  }
];

export const INITIAL_WALL_COMMENTS: WallComment[] = [
  {
    id: 'wall_1',
    emisorId: 'user_2',
    emisorNombre: 'Laura Gómez',
    emisorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    receptorId: 'user_1',
    comentario: '¡Feliz cumpleaños con retraso chiquitín! A ver cuándo nos vemos que hace mil que no tomamos algo x tuenti.',
    fecha: '15/05/2010 17:40'
  },
  {
    id: 'wall_2',
    emisorId: 'user_3',
    emisorNombre: 'Dani Martín',
    emisorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    receptorId: 'user_1',
    comentario: 'Álex pásame las canciones de la sesión de electrónica que pusiste el otro día en tu casa, estaban brutales!!',
    fecha: '18/06/2010 21:12'
  },
  {
    id: 'wall_3',
    emisorId: 'user_8',
    emisorNombre: 'Cristina Morales',
    emisorAvatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80',
    receptorId: 'user_1',
    comentario: '¡Ey Álex! ¿Vas a venir al final a la fiesta de Salamanca en octubre? No me falles eeeh!! 🥂',
    fecha: 'Hoy a las 11:30'
  }
];

export const INITIAL_FRIENDSHIPS: Friendship[] = [
  { id: 'fr_1', user1: 'user_1', user2: 'user_2', fecha: '2009-10-15' },
  { id: 'fr_2', user1: 'user_1', user2: 'user_3', fecha: '2009-10-18' },
  { id: 'fr_3', user1: 'user_1', user2: 'user_4', fecha: '2009-11-02' },
  { id: 'fr_4', user1: 'user_1', user2: 'user_5', fecha: '2010-01-20' },
  { id: 'fr_5', user1: 'user_1', user2: 'user_7', fecha: '2010-02-14' },
  { id: 'fr_6', user1: 'user_1', user2: 'user_8', fecha: '2010-03-01' },
];

export const INITIAL_FRIEND_REQUESTS: FriendRequest[] = [
  {
    id: 'freq_1',
    emisorId: 'user_6',
    emisorNombre: 'Sara Iglesias Cano',
    emisorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
    emisorProvincia: 'Vizcaya',
    receptorId: 'user_1',
    fecha: 'Hoy a las 09:20',
    estado: 'pendiente'
  }
];

export const INITIAL_MESSAGES: PrivateMessage[] = [
  {
    id: 'mp_1',
    emisorId: 'user_2',
    emisorNombre: 'Laura Gómez',
    emisorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    receptorId: 'user_1',
    receptorNombre: 'Alejandro Serrano',
    asunto: '¡Oye las entradas para el concierto!',
    mensaje: 'Hola Álex! Te escribo por privado porque ya pillamos las entradas para el festival del próximo mes. ¿Al final te vienes en coche con nosotros o bajas en bus? Avísame cuanto antes para organizarnos :) Besitos!!',
    fecha: 'Ayer a las 19:45',
    leido: true
  },
  {
    id: 'mp_2',
    emisorId: 'user_3',
    emisorNombre: 'Dani Martín',
    emisorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    receptorId: 'user_1',
    receptorNombre: 'Alejandro Serrano',
    asunto: 'Torneo de Pro Evolution',
    mensaje: 'Buenas fiera! Este finde montamos torneo en mi piso, somos ya 6. Tráete tu mando si puedes que nos falta uno. Hablamos por el chat de Tuenti / Inkorium.',
    fecha: 'Hoy a las 10:15',
    leido: false
  }
];

export const INITIAL_NOTIFICATIONS: InkoriumNotification[] = [
  {
    id: 'notif_1',
    userId: 'user_1',
    fromUserId: 'user_6',
    fromUserName: 'Sara Iglesias',
    fromUserAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
    tipo: 'peticion',
    mensaje: 'Sara Iglesias te ha enviado una petición de amistad.',
    enlace: 'ajustes_peticiones',
    leido: false,
    fecha: 'Hace 2 horas'
  },
  {
    id: 'notif_2',
    userId: 'user_1',
    fromUserId: 'user_8',
    fromUserName: 'Cristina Morales',
    fromUserAvatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80',
    tipo: 'tablon',
    mensaje: 'Cristina Morales ha escrito en tu tablón.',
    enlace: 'perfil',
    leido: false,
    fecha: 'Hace 5 horas'
  },
  {
    id: 'notif_3',
    userId: 'user_1',
    fromUserId: 'user_2',
    fromUserName: 'Laura Gómez',
    fromUserAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    tipo: 'foto',
    mensaje: 'Laura Gómez comentó en tu foto "Atardecer en la playa".',
    enlace: 'fotos',
    leido: true,
    fecha: 'Ayer'
  }
];

export const INITIAL_ACCESS_LOGS: AccessLog[] = [
  {
    id: 'acc_1',
    ip: '83.45.192.110',
    navegador: 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) Chrome/12.0',
    fecha: '30/08/2026 14:30:12',
    ubicacion: 'Madrid, España'
  },
  {
    id: 'acc_2',
    ip: '83.45.192.110',
    navegador: 'Mozilla/5.0 (Windows NT 6.1; rv:3.6) Gecko Firefox/3.6.8',
    fecha: '29/08/2026 21:15:04',
    ubicacion: 'Madrid, España'
  },
  {
    id: 'acc_3',
    ip: '194.224.199.34',
    navegador: 'Safari/533.16 (Macintosh; Intel Mac OS X 10_6_4)',
    fecha: '28/08/2026 18:02:40',
    ubicacion: 'Madrid, España'
  }
];

export const INITIAL_ACTIVITIES: UserActivity[] = [
  // User 1 (Alejandro)
  {
    id: 'act_1',
    userId: 'user_1',
    userName: 'Alejandro Serrano Vega',
    userAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
    type: 'avatar_change',
    title: 'ha cambiado su foto de perfil',
    targetPhotoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
    date: 'Hace 30 minutos',
    timestamp: Date.now() - 1000 * 60 * 30
  },
  {
    id: 'act_2',
    userId: 'user_1',
    userName: 'Alejandro Serrano Vega',
    userAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
    type: 'status_update',
    title: 'ha actualizado su estado',
    detail: '¡Vaya fiestón ayer en Fabrik! Ahora a descansar que toca estudiar para selectividad xD 🎧🙌',
    date: 'Hace 2 horas',
    timestamp: Date.now() - 1000 * 60 * 120
  },
  {
    id: 'act_3',
    userId: 'user_1',
    userName: 'Alejandro Serrano Vega',
    userAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
    type: 'friend_added',
    title: 'ahora es amigo de',
    targetUserId: 'user_2',
    targetUserName: 'Laura Gómez Vidal',
    targetUserAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    date: 'Hoy a las 11:24',
    timestamp: Date.now() - 1000 * 60 * 240
  },
  {
    id: 'act_4',
    userId: 'user_1',
    userName: 'Alejandro Serrano Vega',
    userAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
    type: 'photo_upload',
    title: 'ha subido una nueva foto',
    detail: 'Atardecer en la playa con los chavales 🌅🏖️',
    targetPhotoId: 'photo_1',
    targetPhotoUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
    targetAlbumName: 'Verano Inolvidable 2009',
    date: 'Ayer a las 19:45',
    timestamp: Date.now() - 1000 * 60 * 60 * 20
  },
  {
    id: 'act_5',
    userId: 'user_1',
    userName: 'Alejandro Serrano Vega',
    userAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
    type: 'wall_post',
    title: 'ha firmado en el tablón de',
    targetUserId: 'user_3',
    targetUserName: 'Dani Martín Roca',
    targetUserAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    detail: 'Ese Dani!! A ver cuándo nos echamos ese PRO que te voy a meter 5 con el Barça jajaja ⚽🎮',
    date: 'Hace 2 días',
    timestamp: Date.now() - 1000 * 60 * 60 * 48
  },
  {
    id: 'act_6',
    userId: 'user_1',
    userName: 'Alejandro Serrano Vega',
    userAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
    type: 'album_created',
    title: 'ha creado el álbum',
    targetAlbumName: 'Verano Inolvidable 2009',
    detail: 'Las mejores fotos de las vacaciones de julio y agosto con la cuadrilla.',
    date: 'Hace 4 días',
    timestamp: Date.now() - 1000 * 60 * 60 * 96
  },

  // User 2 (Laura)
  {
    id: 'act_7',
    userId: 'user_2',
    userName: 'Laura Gómez Vidal',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    type: 'status_update',
    title: 'ha actualizado su estado',
    detail: '¡Tuenti > cualquier otra cosa! Subiendo todas las fotos de las fiestas de Gràcia 📷✨',
    date: 'Hace 45 minutos',
    timestamp: Date.now() - 1000 * 60 * 45
  },
  {
    id: 'act_8',
    userId: 'user_2',
    userName: 'Laura Gómez Vidal',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    type: 'avatar_change',
    title: 'ha cambiado su foto de perfil',
    targetPhotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    date: 'Hoy a las 09:15',
    timestamp: Date.now() - 1000 * 60 * 180
  },
  {
    id: 'act_9',
    userId: 'user_2',
    userName: 'Laura Gómez Vidal',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    type: 'friend_added',
    title: 'ahora es amiga de',
    targetUserId: 'user_1',
    targetUserName: 'Alejandro Serrano Vega',
    targetUserAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
    date: 'Hoy a las 11:24',
    timestamp: Date.now() - 1000 * 60 * 240
  },
  {
    id: 'act_10',
    userId: 'user_2',
    userName: 'Laura Gómez Vidal',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    type: 'photo_upload',
    title: 'ha subido una nueva foto',
    detail: 'Concierto épico en Razzmatazz con buena compañía 🎸⚡',
    targetPhotoId: 'photo_2',
    targetPhotoUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
    targetAlbumName: 'Fiestas y Conciertos 2010',
    date: 'Ayer a las 23:10',
    timestamp: Date.now() - 1000 * 60 * 60 * 18
  },

  // User 3 (Dani)
  {
    id: 'act_11',
    userId: 'user_3',
    userName: 'Dani Martín Roca',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    type: 'status_update',
    title: 'ha actualizado su estado',
    detail: 'Alguien se echa un PRO esta tarde? Que avise por el chat y montamos torneo ⚽🎮',
    date: 'Hace 3 horas',
    timestamp: Date.now() - 1000 * 60 * 180
  },
  {
    id: 'act_12',
    userId: 'user_3',
    userName: 'Dani Martín Roca',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    type: 'friend_added',
    title: 'ahora es amigo de',
    targetUserId: 'user_7',
    targetUserName: 'Carlos Méndez Gil',
    targetUserAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    date: 'Ayer a las 16:30',
    timestamp: Date.now() - 1000 * 60 * 60 * 25
  },
  {
    id: 'act_13',
    userId: 'user_3',
    userName: 'Dani Martín Roca',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    type: 'photo_upload',
    title: 'ha subido una nueva foto',
    detail: 'Tarde de skate en el río con los de siempre 🛹🤙',
    targetPhotoId: 'photo_3',
    targetPhotoUrl: 'https://images.unsplash.com/photo-1520045892732-304bc3ac5d8e?w=800&auto=format&fit=crop&q=80',
    date: 'Hace 3 días',
    timestamp: Date.now() - 1000 * 60 * 60 * 72
  },

  // User 4 (Bea)
  {
    id: 'act_14',
    userId: 'user_4',
    userName: 'Bea Navarro Ruiz',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    type: 'status_update',
    title: 'ha actualizado su estado',
    detail: 'Planazo de finde: piscina, amigos y tinto de verano. ¿Quién se viene? ☀️🏊‍♀️',
    date: 'Hace 5 horas',
    timestamp: Date.now() - 1000 * 60 * 300
  },
  {
    id: 'act_15',
    userId: 'user_4',
    userName: 'Bea Navarro Ruiz',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    type: 'friend_added',
    title: 'ahora es amiga de',
    targetUserId: 'user_6',
    targetUserName: 'Lucía Torres Cano',
    targetUserAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
    date: 'Ayer a las 14:00',
    timestamp: Date.now() - 1000 * 60 * 60 * 28
  }
];
