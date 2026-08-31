import { 
  User, Photo, Album, FeedItem, WallComment, PrivateMessage, 
  FriendRequest, Friendship, InkoriumNotification, AccessLog, UserActivity 
} from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'user-nightloot',
    username: 'nightloot',
    full_name: 'Night Loot',
    nombre: 'Night',
    apellidos: 'Loot',
    email: 'nightloot@gmail.com',
    sexo: 'h',
    fnac: '1998-06-15',
    provincia: 'Madrid',
    ciudad: 'Madrid',
    estado: '¡Conectado a Inkorium! 🚀✨',
    estadoFecha: 'Ahora mismo',
    presencia: 'conectado',
    situacionSentimental: 'Soltero/a',
    ocupacion: 'Desarrollador & Creador',
    intereses: 'Tecnología, desarrollo web, música indie, videojuegos retro, fotografía',
    musica: 'Daft Punk, Vetusta Morla, The Midnight, M83',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
    fechaReg: '01/01/2007',
    online: true,
    ultimoAcceso: 'Ahora mismo',
    chatEstado: '1'
  },
  {
    id: 'user-laura',
    username: 'laurasanz',
    full_name: 'Laura Sanz',
    nombre: 'Laura',
    apellidos: 'Sanz Gómez',
    email: 'laura.sanz@inkorium.es',
    sexo: 'm',
    fnac: '2001-04-18',
    provincia: 'Madrid',
    ciudad: 'Madrid',
    estado: 'A tope con los exámenes del cuatrimestre 📚☕',
    estadoFecha: 'Hace 20 min',
    presencia: 'conectado',
    situacionSentimental: 'Soltero/a',
    ocupacion: 'Estudiante de Periodismo en la Complutense',
    intereses: 'Fotografía analógica, festivales, conciertos indie, viajar en furgoneta, cine de los 90',
    musica: 'Vetusta Morla, Lori Meyers, Love of Lesbian, Arctic Monkeys, The Strokes',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    fechaReg: '14/09/2007',
    online: true,
    ultimoAcceso: 'Ahora mismo',
    chatEstado: '1'
  },
  {
    id: 'user-carlos',
    username: 'carlosruiz',
    full_name: 'Carlos Ruiz',
    nombre: 'Carlos',
    apellidos: 'Ruiz Navarro',
    email: 'carlos.ruiz@inkorium.es',
    sexo: 'h',
    fnac: '1999-11-03',
    provincia: 'Barcelona',
    ciudad: 'Barcelona',
    estado: 'Fin de semana en la Costa Brava preparando el festival 🎵🏖️',
    estadoFecha: 'Hace 1 hora',
    presencia: 'ausente',
    situacionSentimental: 'En una relación',
    ocupacion: 'Diseñador UI/UX & DJ aficionado',
    intereses: 'Diseño gráfico, música electrónica, skate, rutas de montaña, sintetizadores',
    musica: 'Daft Punk, Justice, Bicep, Disclosure, Phoenix',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    fechaReg: '02/10/2006',
    online: true,
    ultimoAcceso: 'Hace 15 minutos',
    chatEstado: '1'
  },
  {
    id: 'user-elena',
    username: 'elenis',
    full_name: 'Elena Morales',
    nombre: 'Elena',
    apellidos: 'Morales Vidal',
    email: 'elena.morales@inkorium.es',
    sexo: 'm',
    fnac: '2002-07-22',
    provincia: 'Valencia',
    ciudad: 'Valencia',
    estado: '¿Alguien para unas cañas por Ruzafa esta tarde? 🍻☀️',
    estadoFecha: 'Hace 45 min',
    presencia: 'conectado',
    situacionSentimental: 'Es complicado',
    ocupacion: 'Arquitectura & Bellas Artes',
    intereses: 'Diseño de interiores, cerámica, pintura al óleo, patinar por el cauce del Turia',
    musica: 'C. Tangana, Rosalía, Sen Senra, Alizzz, Guitarricadelafuente',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
    fechaReg: '20/03/2008',
    online: true,
    ultimoAcceso: 'Ahora mismo',
    chatEstado: '1'
  },
  {
    id: 'user-alex',
    username: 'alex_p',
    full_name: 'Alejandro Peña',
    nombre: 'Alejandro',
    apellidos: 'Peña Gil',
    email: 'alejandro.pena@inkorium.es',
    sexo: 'h',
    fnac: '1998-05-14',
    provincia: 'Sevilla',
    ciudad: 'Sevilla',
    estado: 'De ruta ciclista por la sierra norte 🚴‍♂️⛰️',
    estadoFecha: 'Hace 3 horas',
    presencia: 'ocupado',
    situacionSentimental: 'Soltero/a',
    ocupacion: 'Ingeniero de Telecomunicaciones',
    intereses: 'Ciclismo de carretera, senderismo, gadgets retro, astronomía',
    musica: 'Muse, Foo Fighters, Red Hot Chili Peppers, Extremoduro, Platero y Tú',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    fechaReg: '11/11/2006',
    online: true,
    ultimoAcceso: 'Hace 1 hora',
    chatEstado: '1'
  },
  {
    id: 'user-sara',
    username: 'sarad',
    full_name: 'Sara Domínguez',
    nombre: 'Sara',
    apellidos: 'Domínguez Rey',
    email: 'sara.dominguez@inkorium.es',
    sexo: 'm',
    fnac: '2000-09-30',
    provincia: 'Bizkaia',
    ciudad: 'Bilbao',
    estado: 'Lluvia en Bilbao, café caliente y vinilos ☕🌧️',
    estadoFecha: 'Hace 2 horas',
    presencia: 'conectado',
    situacionSentimental: 'En una relación',
    ocupacion: 'Traductora e Intérprete',
    intereses: 'Literatura clásica, idiomas, repostería casera, museos, fotografía de paisajes',
    musica: 'Fleet Foxes, Bon Iver, Florence + The Machine, Sufjan Stevens',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    fechaReg: '05/06/2007',
    online: true,
    ultimoAcceso: 'Ahora mismo',
    chatEstado: '1'
  },
  {
    id: 'user-marcos',
    username: 'marcosv',
    full_name: 'Marcos Varela',
    nombre: 'Marcos',
    apellidos: 'Varela Muñoz',
    email: 'marcos.varela@inkorium.es',
    sexo: 'h',
    fnac: '1997-02-19',
    provincia: 'Málaga',
    ciudad: 'Málaga',
    estado: 'Programando hasta las tantas con buen café 💻⚡',
    estadoFecha: 'Hace 10 min',
    presencia: 'conectado',
    situacionSentimental: 'Soltero/a',
    ocupacion: 'Full Stack Web Developer',
    intereses: 'Open Source, videojuegos retro, impresión 3D, paddle surf',
    musica: 'Gorillaz, Daft Punk, MGMT, Empire of the Sun, Franz Ferdinand',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&auto=format&fit=crop&q=80',
    fechaReg: '18/01/2007',
    online: true,
    ultimoAcceso: 'Ahora mismo',
    chatEstado: '1'
  },
  {
    id: 'user-irene',
    username: 'irene_b',
    full_name: 'Irene Blanco',
    nombre: 'Irene',
    apellidos: 'Blanco Herrero',
    email: 'irene.blanco@inkorium.es',
    sexo: 'm',
    fnac: '2003-08-11',
    provincia: 'Salamanca',
    ciudad: 'Salamanca',
    estado: '¡Jueves universitario en Plaza Mayor! 🎉🍻',
    estadoFecha: 'Ayer',
    presencia: 'ausente',
    situacionSentimental: 'Soltero/a',
    ocupacion: 'Estudiante de Derecho',
    intereses: 'Derecho internacional, oratoria, teatro, baile moderno, viajes con amigas',
    musica: 'Melendi, El Canto del Loco, Pereza, Amaral, Estopa',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80',
    fechaReg: '19/09/2008',
    online: true,
    ultimoAcceso: 'Hace 30 minutos',
    chatEstado: '1'
  },
  {
    id: 'user-david',
    username: 'davidc',
    full_name: 'David Castro',
    nombre: 'David',
    apellidos: 'Castro Pardo',
    email: 'david.castro@inkorium.es',
    sexo: 'h',
    fnac: '1999-06-25',
    provincia: 'Zaragoza',
    ciudad: 'Zaragoza',
    estado: 'Sesión de gimnasio finiquitada 💪 Hoy noche de peli',
    estadoFecha: 'Hace 4 horas',
    presencia: 'conectado',
    situacionSentimental: 'Casado/a',
    ocupacion: 'Fisioterapeuta deportivo',
    intereses: 'Crossfit, nutrición deportiva, pádel, senderismo por el Pirineo',
    musica: 'Linkin Park, The Offspring, Blink-182, Sum 41, Green Day',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
    fechaReg: '12/04/2007',
    online: true,
    ultimoAcceso: 'Ahora mismo',
    chatEstado: '1'
  },
  {
    id: 'user-lucia',
    username: 'luciaramos',
    full_name: 'Lucía Ramos',
    nombre: 'Lucía',
    apellidos: 'Ramos Serrano',
    email: 'lucia.ramos@inkorium.es',
    sexo: 'm',
    fnac: '2001-12-05',
    provincia: 'Granada',
    ciudad: 'Granada',
    estado: 'Atardecer en el Mirador de San Nicolás ✨ Alhambra mágica',
    estadoFecha: 'Hace 30 min',
    presencia: 'conectado',
    situacionSentimental: 'En una relación',
    ocupacion: 'Historia del Arte & Guía Cultural',
    intereses: 'Historia medieval, monumentos, tapeo granadino, flamenco fusión, poesía',
    musica: "Lole y Manuel, Ketama, Chambao, O'Funk'illo, Los Delinqüentes",
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
    fechaReg: '27/05/2008',
    online: true,
    ultimoAcceso: 'Ahora mismo',
    chatEstado: '1'
  },
  {
    id: 'user-barbara',
    username: 'barbara',
    full_name: 'Bárbara Valero',
    nombre: 'Bárbara',
    apellidos: 'Valero Gómez',
    email: 'barbara.valero@inkorium.es',
    sexo: 'm',
    fnac: '2001-09-14',
    provincia: 'Madrid',
    ciudad: 'Madrid',
    estado: '¡Hola a todos en Inkorium! Escribidme un mensaje 💬✨',
    estadoFecha: 'Hace 10 min',
    presencia: 'conectado',
    situacionSentimental: 'Soltero/a',
    ocupacion: 'Estudiante de Fotografía & Diseño',
    intereses: 'Fotografía analógica, festivales, cine independiente, viajes',
    musica: 'Vetusta Morla, La Casa Azul, Dorian, Zahara',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    fechaReg: '10/05/2008',
    online: true,
    ultimoAcceso: 'Ahora mismo',
    chatEstado: '1'
  },
  {
    id: 'user-javi',
    username: 'javi_nav',
    full_name: 'Javier Navarro',
    nombre: 'Javier',
    apellidos: 'Navarro Pastor',
    email: 'javier.navarro@inkorium.es',
    sexo: 'h',
    fnac: '1998-03-12',
    provincia: 'Alicante',
    ciudad: 'Alicante',
    estado: 'Desconexión total en San Juan 🌊☀️',
    estadoFecha: 'Hace 5 horas',
    presencia: 'invisible',
    situacionSentimental: 'Soltero/a',
    ocupacion: 'Biólogo Marino',
    intereses: 'Buceo, snorkel, conservación marina, fotografía submarina, kayak',
    musica: 'Jack Johnson, Ben Howard, Xavier Rudd, Ziggy Alberts',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&auto=format&fit=crop&q=80',
    fechaReg: '08/08/2007',
    online: false,
    ultimoAcceso: 'Ayer a las 22:15',
    chatEstado: '0'
  },
  {
    id: 'user-paula',
    username: 'paulagil',
    full_name: 'Paula Gil',
    nombre: 'Paula',
    apellidos: 'Gil Martínez',
    email: 'paula.gil@inkorium.es',
    sexo: 'm',
    fnac: '2002-01-14',
    provincia: 'Madrid',
    ciudad: 'Madrid',
    estado: '¡Fotos del fiestón del sábado ya subidas! Etiquetaos 📸💃',
    estadoFecha: 'Hace 1 hora',
    presencia: 'conectado',
    situacionSentimental: 'Soltero/a',
    ocupacion: 'Marketing Digital & Creadora de Contenido',
    intereses: 'Moda vintage, festivales de verano, viajes low cost, fotografía de retrato',
    musica: 'Dua Lipa, The Weeknd, Harry Styles, Rigoberta Bandini, Zahara',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
    fechaReg: '15/10/2008',
    online: true,
    ultimoAcceso: 'Ahora mismo',
    chatEstado: '1'
  },
  {
    id: 'user-adrian',
    username: 'adrian_r',
    full_name: 'Adrián Romero',
    nombre: 'Adrián',
    apellidos: 'Romero Fuentes',
    email: 'adrian.romero@inkorium.es',
    sexo: 'h',
    fnac: '2000-10-08',
    provincia: 'Valladolid',
    ciudad: 'Valladolid',
    estado: 'Ensayando con el grupo para el bolo del viernes 🎸🥁',
    estadoFecha: 'Hace 2 horas',
    presencia: 'conectado',
    situacionSentimental: 'Soltero/a',
    ocupacion: 'Músico & Profesor de Guitarra',
    intereses: 'Guitarras eléctricas, amplificadores de válvulas, grabación en estudio, vinilos',
    musica: 'Led Zeppelin, Pink Floyd, Queen, Héroes del Silencio, M-Clan',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80',
    fechaReg: '03/03/2007',
    online: true,
    ultimoAcceso: 'Ahora mismo',
    chatEstado: '1'
  }
];

export const INITIAL_ALBUMS: Album[] = [
  {
    id: 'album-1',
    nombre: 'Verano en Gandía & Costa Blanca 🏖️',
    descripcion: 'Recuerdos de la casa de la playa con los amigos, festivales y calas.',
    userId: 'user-laura',
    fecha: '15/08/2008'
  },
  {
    id: 'album-2',
    nombre: 'Conciertos y Festivales Indie 🎸',
    descripcion: 'Sonorama, BBK Live y conciertos por salas míticas.',
    userId: 'user-carlos',
    fecha: '22/07/2008'
  },
  {
    id: 'album-3',
    nombre: 'Rutas y Montaña ⛰️',
    descripcion: 'Picos de Europa y escapadas de fin de semana.',
    userId: 'user-alex',
    fecha: '05/09/2008'
  },
  {
    id: 'album-4',
    nombre: 'Fotos con los de siempre ❤️',
    descripcion: 'Momentos inolvidables del grupo.',
    userId: 'user-paula',
    fecha: '10/10/2008'
  }
];

export const INITIAL_PHOTOS: Photo[] = [
  {
    id: 'photo-1',
    titulo: 'Atardecer en la playa con los mejores 🌅',
    albumId: 'album-1',
    albumName: 'Verano en Gandía & Costa Blanca 🏖️',
    uploaderId: 'user-laura',
    uploaderName: 'Laura Sanz',
    archivo: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80',
    fecha: '18/08/2008',
    likes: ['user-carlos', 'user-elena', 'user-paula'],
    etiquetas: [
      { id: 'tag-1', photoId: 'photo-1', userId: 'user-laura', userName: 'Laura Sanz', x: 30, y: 40 },
      { id: 'tag-2', photoId: 'photo-1', userId: 'user-carlos', userName: 'Carlos Ruiz', x: 60, y: 45 }
    ],
    comentarios: [
      { id: 'c-1', photoId: 'photo-1', userId: 'user-carlos', nombre: 'Carlos Ruiz', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80', comentario: '¡Vaya fotón! Qué bien lo pasamos ese día jaja 🍻', fecha: '18/08/2008 20:15' },
      { id: 'c-2', photoId: 'photo-1', userId: 'user-elena', nombre: 'Elena Morales', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80', comentario: '¡Hay que repetir muy pronto chicos! ❤️', fecha: '18/08/2008 20:45' }
    ]
  },
  {
    id: 'photo-2',
    titulo: 'En primera fila en el festival 🎵✨',
    albumId: 'album-2',
    albumName: 'Conciertos y Festivales Indie 🎸',
    uploaderId: 'user-carlos',
    uploaderName: 'Carlos Ruiz',
    archivo: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80',
    fecha: '25/07/2008',
    likes: ['user-adrian', 'user-laura'],
    etiquetas: [
      { id: 'tag-3', photoId: 'photo-2', userId: 'user-carlos', userName: 'Carlos Ruiz', x: 50, y: 50 }
    ],
    comentarios: [
      { id: 'c-3', photoId: 'photo-2', userId: 'user-adrian', nombre: 'Adrián Romero', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80', comentario: '¡Ese directo fue brutal! Menudo temazo el último 🎸', fecha: '25/07/2008 23:30' }
    ]
  },
  {
    id: 'photo-3',
    titulo: 'Cima coronada tras 6 horas de subida 🏔️',
    albumId: 'album-3',
    albumName: 'Rutas y Montaña ⛰️',
    uploaderId: 'user-alex',
    uploaderName: 'Alejandro Peña',
    archivo: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&auto=format&fit=crop&q=80',
    fecha: '08/09/2008',
    likes: ['user-david'],
    etiquetas: [
      { id: 'tag-4', photoId: 'photo-3', userId: 'user-alex', userName: 'Alejandro Peña', x: 45, y: 60 }
    ],
    comentarios: [
      { id: 'c-4', photoId: 'photo-3', userId: 'user-david', nombre: 'David Castro', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80', comentario: '¡Qué vistas crack! La próxima me apunto yo también 💪', fecha: '09/09/2008 09:12' }
    ]
  },
  {
    id: 'photo-4',
    titulo: 'Noche de risas y cumpleaños 🎂🎉',
    albumId: 'album-4',
    albumName: 'Fotos con los de siempre ❤️',
    uploaderId: 'user-paula',
    uploaderName: 'Paula Gil',
    archivo: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=1200&auto=format&fit=crop&q=80',
    fecha: '12/10/2008',
    likes: ['user-irene', 'user-laura', 'user-carlos'],
    etiquetas: [
      { id: 'tag-5', photoId: 'photo-4', userId: 'user-paula', userName: 'Paula Gil', x: 25, y: 40 },
      { id: 'tag-6', photoId: 'photo-4', userId: 'user-irene', userName: 'Irene Blanco', x: 55, y: 45 },
      { id: 'tag-7', photoId: 'photo-4', userId: 'user-laura', userName: 'Laura Sanz', x: 80, y: 50 }
    ],
    comentarios: [
      { id: 'c-5', photoId: 'photo-4', userId: 'user-irene', nombre: 'Irene Blanco', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80', comentario: '¡Madre mía qué risas con la tarta jajaja! 😂', fecha: '12/10/2008 14:02' }
    ]
  }
];

export const INITIAL_FEED: FeedItem[] = [
  {
    id: 'feed-1',
    tipo: 'estado',
    propietarioId: 'user-laura',
    propietarioNombre: 'Laura Sanz',
    propietarioAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    datos: 'Por fin he terminado las entregas del cuatrimestre... ¡modo vacaciones activado al 100%! ☀️🍹 ¿Quién se apunta a una escapada?',
    fecha: 'Hace 30 min',
    likes: ['user-carlos', 'user-elena'],
    comentarios: [
      { id: 'fc-1', userId: 'user-elena', nombre: 'Elena Morales', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80', texto: '¡Yo de cabeza! Vamos a Valencia este finde 🏖️', fecha: 'Hace 15 min' },
      { id: 'fc-2', userId: 'user-carlos', nombre: 'Carlos Ruiz', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80', texto: 'Cuenta conmigo para el sábado tarde 🍻', fecha: 'Hace 5 min' }
    ]
  },
  {
    id: 'feed-2',
    tipo: 'foto',
    propietarioId: 'user-carlos',
    propietarioNombre: 'Carlos Ruiz',
    propietarioAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    fotoId: 'photo-2',
    fotoUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80',
    datos: 'Subidas las fotos del festival de este finde. ¡Menudo ambientazo y menudas bandas! 🎸',
    fecha: 'Hace 2 horas',
    likes: ['user-adrian', 'user-laura'],
    comentarios: [
      { id: 'fc-3', userId: 'user-adrian', nombre: 'Adrián Romero', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80', texto: '¡Tremendo concierto! 🎸', fecha: 'Hace 1 hora' }
    ]
  },
  {
    id: 'feed-3',
    tipo: 'estado',
    propietarioId: 'user-elena',
    propietarioNombre: 'Elena Morales',
    propietarioAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
    datos: 'Tarde de dibujo por el Jardín Botánico y luego cena en Ruzafa. La primavera en Valencia es una maravilla 🌿🎨',
    fecha: 'Hace 4 horas',
    likes: ['user-lucia'],
    comentarios: []
  },
  {
    id: 'feed-4',
    tipo: 'foto',
    propietarioId: 'user-alex',
    propietarioNombre: 'Alejandro Peña',
    propietarioAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    fotoId: 'photo-3',
    fotoUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&auto=format&fit=crop&q=80',
    datos: 'Ruta completada por la sierra. 45km y más de 1200m de desnivel acumulado 🚴‍♂️💨',
    fecha: 'Hace 6 horas',
    likes: ['user-david'],
    comentarios: []
  }
];

export const INITIAL_WALL_COMMENTS: WallComment[] = [
  {
    id: 'wall-1',
    emisorId: 'user-carlos',
    emisorNombre: 'Carlos Ruiz',
    emisorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    receptorId: 'user-laura',
    comentario: '¡Esa Lauu! A ver cuándo nos vemos que hace mil que no coincidimos por Madrid. ¡Un abrazo enorme!',
    fecha: 'Ayer a las 18:40'
  },
  {
    id: 'wall-2',
    emisorId: 'user-elena',
    emisorNombre: 'Elena Morales',
    emisorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
    receptorId: 'user-laura',
    comentario: '¡Tía me encantan las fotos del viaje! Te he dejado un comentario en la del atardecer 😘',
    fecha: 'Hace 2 días'
  },
  {
    id: 'wall-3',
    emisorId: 'user-adrian',
    emisorNombre: 'Adrián Romero',
    emisorAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80',
    receptorId: 'user-carlos',
    comentario: 'Tío pásame los audios de la sesión del sábado cuando puedas que sonaban brutales 🎧',
    fecha: 'Hace 3 días'
  }
];

export const INITIAL_FRIENDSHIPS: Friendship[] = [
  { id: 'f-1', user1: 'user-laura', user2: 'user-carlos', fecha: '01/01/2008' },
  { id: 'f-2', user1: 'user-laura', user2: 'user-elena', fecha: '05/01/2008' },
  { id: 'f-3', user1: 'user-laura', user2: 'user-paula', fecha: '10/01/2008' },
  { id: 'f-4', user1: 'user-carlos', user2: 'user-adrian', fecha: '12/01/2008' },
  { id: 'f-5', user1: 'user-carlos', user2: 'user-marcos', fecha: '15/01/2008' },
  { id: 'f-6', user1: 'user-alex', user2: 'user-david', fecha: '20/01/2008' },
  { id: 'f-7', user1: 'user-elena', user2: 'user-lucia', fecha: '22/01/2008' },
  { id: 'f-8', user1: 'user-sara', user2: 'user-marcos', fecha: '25/01/2008' }
];

export const INITIAL_FRIEND_REQUESTS: FriendRequest[] = [
  {
    id: 'req-1',
    emisorId: 'user-laura',
    emisorNombre: 'Laura Sanz',
    emisorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    emisorProvincia: 'Madrid',
    receptorId: 'nightloot',
    fecha: 'Hace 1 hora',
    estado: 'pendiente'
  },
  {
    id: 'req-2',
    emisorId: 'user-carlos',
    emisorNombre: 'Carlos Ruiz',
    emisorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    emisorProvincia: 'Barcelona',
    receptorId: 'nightloot',
    fecha: 'Hace 3 horas',
    estado: 'pendiente'
  }
];

export const INITIAL_MESSAGES: PrivateMessage[] = [
  {
    id: 'msg-1',
    emisorId: 'user-laura',
    emisorNombre: 'Laura Sanz',
    emisorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    receptorId: 'nightloot',
    receptorNombre: 'Tú',
    asunto: '¡Bienvenido/a a Inkorium! 🎉',
    mensaje: '¡Hola! Qué ilusión verte por aquí en Inkorium. Échale un vistazo a las fotos y al tablón, y si te apetece agrégame como amiga. ¡Nos vemos en el chat!',
    fecha: 'Hoy a las 12:30',
    leido: false
  },
  {
    id: 'msg-2',
    emisorId: 'user-carlos',
    emisorNombre: 'Carlos Ruiz',
    emisorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    receptorId: 'nightloot',
    receptorNombre: 'Tú',
    asunto: '¿Qué tal todo?',
    mensaje: '¡Hey! Bienvenido a la comunidad. Si necesitas cualquier cosa o buscas grupos para salir de fiesta o festivales avisa por aquí.',
    fecha: 'Ayer a las 20:15',
    leido: true
  }
];

export const INITIAL_NOTIFICATIONS: InkoriumNotification[] = [
  {
    id: 'notif-1',
    userId: 'nightloot',
    fromUserId: 'user-laura',
    fromUserName: 'Laura Sanz',
    fromUserAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    tipo: 'peticion',
    mensaje: 'te ha enviado una solicitud de amistad.',
    enlace: 'gente',
    fecha: 'Hace 45 min',
    leido: false,
    estadoPeticion: 'pendiente',
    targetId: 'req-1'
  },
  {
    id: 'notif-2',
    userId: 'nightloot',
    fromUserId: 'user-carlos',
    fromUserName: 'Carlos Ruiz',
    fromUserAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    tipo: 'peticion',
    mensaje: 'te ha enviado una solicitud de amistad.',
    enlace: 'gente',
    fecha: 'Hace 2 horas',
    leido: false,
    estadoPeticion: 'pendiente',
    targetId: 'req-2'
  },
  {
    id: 'notif-3',
    userId: 'nightloot',
    fromUserId: 'user-elena',
    fromUserName: 'Elena Morales',
    fromUserAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
    tipo: 'foto',
    mensaje: 'ha comentado en tu foto "Atardecer en las calas de Menorca".',
    enlace: 'fotos',
    detalle: '¡Fotón brutal! Esas aguas cristalinas dan unas ganas de escaparse ya mismo 😍☀️',
    fecha: 'Hoy a las 11:15',
    leido: false,
    targetId: 'photo-1',
    targetPhotoUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80'
  },
  {
    id: 'notif-4',
    userId: 'nightloot',
    fromUserId: 'user-marcos',
    fromUserName: 'Marcos Alonso',
    fromUserAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    tipo: 'tablon',
    mensaje: 'ha firmado en tu tablón y te ha mencionado.',
    enlace: 'perfil',
    detalle: '¡Bienvenido a Inkorium! A ver si nos vemos el finde con la gente del grupo para echar unas cañas 🍻',
    fecha: 'Hoy a las 10:20',
    leido: false,
    targetId: 'wall-1'
  },
  {
    id: 'notif-5',
    userId: 'nightloot',
    fromUserId: 'user-irene',
    fromUserName: 'Irene Blanco',
    fromUserAvatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80',
    tipo: 'etiqueta',
    mensaje: 'te ha etiquetado en una nueva foto "Noche de risas y cumpleaños 🎂🎉".',
    enlace: 'fotos',
    fecha: 'Ayer a las 22:40',
    leido: true,
    targetId: 'photo-4',
    targetPhotoUrl: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=1200&auto=format&fit=crop&q=80'
  },
  {
    id: 'notif-6',
    userId: 'nightloot',
    fromUserId: 'user-sara',
    fromUserName: 'Sara Navarro',
    fromUserAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
    tipo: 'tablon',
    mensaje: 'ha dejado una firma en tu perfil.',
    enlace: 'perfil',
    detalle: '¡Qué buen perfil tienes! Pásate por el mío cuando quieras :) Saludos!',
    fecha: 'Ayer a las 18:05',
    leido: true,
    targetId: 'wall-2'
  },
  {
    id: 'notif-7',
    userId: 'nightloot',
    fromUserId: 'user-adrian',
    fromUserName: 'Adrián Romero',
    fromUserAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80',
    tipo: 'foto',
    mensaje: 'ha comentado en la foto "Concierto en la sala Riviera":',
    enlace: 'fotos',
    detalle: '¡Ese directo fue brutal! Menudo temazo el último 🎸',
    fecha: '25/08/2026',
    leido: true,
    targetId: 'photo-2',
    targetPhotoUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80'
  },
  {
    id: 'notif-8',
    userId: 'nightloot',
    fromUserId: 'user-david',
    fromUserName: 'David Castro',
    fromUserAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
    tipo: 'peticion',
    mensaje: 'ha aceptado tu solicitud de amistad. ¡Ahora sois amigos!',
    enlace: 'perfil',
    fecha: '24/08/2026',
    leido: true,
    estadoPeticion: 'aceptada'
  },
  {
    id: 'notif-9',
    userId: 'nightloot',
    fromUserId: 'user-laura',
    fromUserName: 'Laura Sanz',
    fromUserAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    tipo: 'like',
    mensaje: 'le ha gustado tu estado: "Por fin he terminado las entregas del cuatrimestre...".',
    enlace: 'inicio',
    fecha: '22/08/2026',
    leido: true
  }
];

export const INITIAL_ACCESS_LOGS: AccessLog[] = [
  {
    id: 'acc-1',
    ip: '83.54.120.44',
    navegador: 'Navegador Web (Windows NT 10.0)',
    fecha: 'Hoy a las 14:10',
    ubicacion: 'Madrid, España'
  }
];

export const INITIAL_ACTIVITIES: UserActivity[] = [
  {
    id: 'act-1',
    userId: 'user-laura',
    userName: 'Laura Sanz',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    type: 'status_update',
    title: 'ha actualizado su estado',
    detail: 'A tope con los exámenes del cuatrimestre 📚☕',
    date: 'Hace 20 min',
    timestamp: Date.now() - 1000 * 60 * 20
  },
  {
    id: 'act-2',
    userId: 'user-carlos',
    userName: 'Carlos Ruiz',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    type: 'photo_upload',
    title: 'ha subido una nueva foto',
    detail: 'En primera fila en el festival 🎵✨',
    targetAlbumName: 'Conciertos y Festivales Indie 🎸',
    date: 'Hace 2 horas',
    timestamp: Date.now() - 1000 * 60 * 120
  }
];
