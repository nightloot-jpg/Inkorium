import { SocialEvent, TuentiPage, GameScore } from '../types';

export const INITIAL_EVENTS: SocialEvent[] = [
  {
    id: 'evt-1',
    creadorId: 'user-laura',
    creadorNombre: 'Laura Gómez',
    creadorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    titulo: 'Cumple de Laura ★ Fiesta 2000s & Disfraces',
    descripcion: '¡Hola a todos! Este sábado celebro mis 21 en el local de mi primo. Habrá música de la época dorada (El Canto del Loco, Estopa, Melendi), ponche y risas aseguradas. ¡Venid con ropa dosmilera o disfrazados! Avisad quién viene para calcular la bebida.',
    lugar: 'Local La Nave (C/ Mayor 44)',
    ciudad: 'Madrid',
    provincia: 'Madrid',
    fechaHora: '2026-09-12T22:30:00',
    fechaTexto: 'Sábado 12 Sep - 22:30h',
    portada: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&auto=format&fit=crop&q=80',
    categoria: 'cumpleanos',
    privacidad: 'amigos',
    asistentes: [
      {
        userId: 'user-laura',
        userName: 'Laura Gómez',
        userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
        estado: 'asistire',
        fecha: 'Hace 2 días'
      },
      {
        userId: 'user-carlos',
        userName: 'Carlos Ruiz',
        userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
        estado: 'asistire',
        fecha: 'Ayer'
      },
      {
        userId: 'user-elena',
        userName: 'Elena Martínez',
        userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&auto=format&fit=crop&q=80',
        estado: 'asistire',
        fecha: 'Ayer'
      },
      {
        userId: 'user-nightloot',
        userName: 'David Tuenti',
        userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
        estado: 'quizas',
        fecha: 'Hace unas horas'
      }
    ],
    comentarios: [
      {
        id: 'c-evt-1',
        autorId: 'user-carlos',
        autorNombre: 'Carlos Ruiz',
        autorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
        texto: '¡Felicidades de antemano Lau! Yo llevo hielo y los vasos de plástico gigantes.',
        fecha: 'Ayer a las 19:40'
      },
      {
        id: 'c-evt-2',
        autorId: 'user-elena',
        autorNombre: 'Elena Martínez',
        autorAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&auto=format&fit=crop&q=80',
        texto: '¡Qué ganas! Ya tengo la cámara digital cargada a tope para subir el álbum el domingo jajaja.',
        fecha: 'Hoy a las 11:15'
      }
    ]
  },
  {
    id: 'evt-2',
    creadorId: 'user-carlos',
    creadorNombre: 'Carlos Ruiz',
    creadorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    titulo: 'Botellón Fin de Exámenes en Ciudad Universitaria',
    descripcion: 'Se acabaron las recuperaciones y los exámenes. Quedamos en las campas de Farmacia / Metro Ciudad Universitaria. Traed cartas, altavoces portátiles y buen rollo. Si llueve nos movemos a los soportales.',
    lugar: 'Campas de Farmacia (Metro Ciudad Universitaria)',
    ciudad: 'Madrid',
    provincia: 'Madrid',
    fechaHora: '2026-09-18T20:00:00',
    fechaTexto: 'Viernes 18 Sep - 20:00h',
    portada: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop&q=80',
    categoria: 'botellon',
    privacidad: 'publico',
    asistentes: [
      {
        userId: 'user-carlos',
        userName: 'Carlos Ruiz',
        userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
        estado: 'asistire',
        fecha: 'Hace 3 días'
      },
      {
        userId: 'user-nightloot',
        userName: 'David Tuenti',
        userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
        estado: 'asistire',
        fecha: 'Hace 2 días'
      }
    ],
    comentarios: [
      {
        id: 'c-evt-3',
        autorId: 'user-nightloot',
        autorNombre: 'David Tuenti',
        autorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
        texto: 'Por fin libertad. ¿A qué hora empezáis a llegar?',
        fecha: 'Hace 1 día'
      }
    ]
  },
  {
    id: 'evt-3',
    creadorId: 'user-elena',
    creadorNombre: 'Elena Martínez',
    creadorAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&auto=format&fit=crop&q=80',
    titulo: 'Concierto Homenaje Pop-Rock Español 2000s',
    descripcion: 'Tributo en directo a El Canto del Loco, Pereza, Los Piratas y M-Clan. Entrada anticipada con consumición 12€. Vamos en grupo desde Moncloa.',
    lugar: 'Sala Caracol',
    ciudad: 'Madrid',
    provincia: 'Madrid',
    fechaHora: '2026-09-25T21:00:00',
    fechaTexto: 'Viernes 25 Sep - 21:00h',
    portada: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80',
    categoria: 'concierto',
    privacidad: 'publico',
    asistentes: [
      {
        userId: 'user-elena',
        userName: 'Elena Martínez',
        userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&auto=format&fit=crop&q=80',
        estado: 'asistire',
        fecha: 'Hace 4 días'
      },
      {
        userId: 'user-laura',
        userName: 'Laura Gómez',
        userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
        estado: 'quizas',
        fecha: 'Hace 2 días'
      }
    ],
    comentarios: []
  }
];

export const INITIAL_PAGES: TuentiPage[] = [
  {
    id: 'pag-1',
    nombre: 'Discoteca Fabrik',
    categoria: 'discoteca',
    descripcion: 'La catedral de la música electrónica en Madrid. Fiestas GOA, SuperMartXé, 150 y aniversarios míticos con la mejor gente de toda España.',
    avatar: 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=400&auto=format&fit=crop&q=80',
    portada: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80',
    creadorId: 'admin',
    seguidores: ['user-carlos', 'user-nightloot', 'user-elena'],
    fechaCreacion: '2008-04-12',
    ubicacion: 'Humanes de Madrid, Madrid',
    verificada: true,
    posts: [
      {
        id: 'p-post-1',
        autorId: 'admin',
        autorNombre: 'Discoteca Fabrik Oficial',
        autorAvatar: 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=400&auto=format&fit=crop&q=80',
        texto: '¡Atención fans! Este fin de semana abrimos la Main Room con los himnos de los 2000 que marcaron época. Buses lanzadera desde Plaza de España y Fuenlabrada Central. ¡Nos vemos en la pista!',
        fecha: 'Ayer a las 18:00',
        likes: ['user-carlos', 'user-nightloot'],
        fotoUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80'
      }
    ]
  },
  {
    id: 'pag-2',
    nombre: 'El Canto del Loco Fans',
    categoria: 'musica',
    descripcion: 'Página oficial de seguidores de ECDL. Zapatillas, La Madre de José, Volverá, Besos, Son Sueños... Porque Dani Martín marcó nuestra adolescencia.',
    avatar: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80',
    portada: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80',
    creadorId: 'user-laura',
    seguidores: ['user-laura', 'user-elena', 'user-nightloot', 'user-carlos'],
    fechaCreacion: '2007-10-05',
    ubicacion: 'España',
    verificada: true,
    posts: [
      {
        id: 'p-post-2',
        autorId: 'user-laura',
        autorNombre: 'Laura Gómez',
        autorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
        texto: '¿Cuál es la canción que más os poníais en bucle mientras firmabais en los tablones de Tuenti? Para mí "Volverá" sin duda alguna ★♫',
        fecha: 'Hace 3 días',
        likes: ['user-elena', 'user-nightloot']
      }
    ]
  },
  {
    id: 'pag-3',
    nombre: 'Yo también salía a la calle a jugar sin móvil',
    categoria: 'humor',
    descripcion: 'Comunidad nostálgica para los que llamábamos a los timbres de los amigos, subíamos fotos a Tuenti con la fecha en naranja y mandábamos zumbidos en el Messenger.',
    avatar: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=400&auto=format&fit=crop&q=80',
    creadorId: 'user-carlos',
    seguidores: ['user-carlos', 'user-nightloot', 'user-laura', 'user-elena'],
    fechaCreacion: '2009-02-14',
    ubicacion: 'Toda España',
    verificada: false,
    posts: [
      {
        id: 'p-post-3',
        autorId: 'user-carlos',
        autorNombre: 'Carlos Ruiz',
        autorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
        texto: 'Si no te hiciste una foto con la cámara compacta sujetada desde arriba mirando a la nada en 2008, ¿realmente tuviste Tuenti? jajaja',
        fecha: 'Hace 5 días',
        likes: ['user-laura', 'user-nightloot', 'user-elena']
      }
    ]
  },
  {
    id: 'pag-4',
    nombre: 'Universidad Complutense de Madrid',
    categoria: 'universidad',
    descripcion: 'Comunidad de estudiantes y antiguos alumnos de la UCM. Ciudad Universitaria, Somosaguas, apuntes, fiestas y tablón de anuncios.',
    avatar: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&auto=format&fit=crop&q=80',
    creadorId: 'admin',
    seguidores: ['user-carlos', 'user-elena'],
    fechaCreacion: '2008-09-01',
    ubicacion: 'Madrid',
    verificada: true,
    posts: [
      {
        id: 'p-post-4',
        autorId: 'user-elena',
        autorNombre: 'Elena Martínez',
        autorAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&auto=format&fit=crop&q=80',
        texto: '¿Alguien tiene los apuntes de Historia Contemporánea de 2º? Dejadme firma en el tablón porfa!',
        fecha: 'Hace 1 semana',
        likes: []
      }
    ]
  }
];

export const TRIVIA_QUESTIONS = [
  {
    id: 1,
    pregunta: '¿En qué año se fundó Tuenti originalmente en España?',
    opciones: ['2004', '2006', '2009', '2011'],
    correcta: 1,
    explicacion: 'Tuenti fue fundada a finales de 2006 por Zaryn Dentzel, Félix Ruiz, Kenny Bentley y Joaquín Ayuso.'
  },
  {
    id: 2,
    pregunta: '¿Cómo se llamaba la famosa acción para llamar la atención en el chat de MSN y Tuenti?',
    opciones: ['Poke / Toque', 'Zumbido', 'Bocina', 'Flash'],
    correcta: 1,
    explicacion: '¡El mítico Zumbido! Hacía temblar la pantalla entera con un sonido inconfundible.'
  },
  {
    id: 3,
    pregunta: '¿De qué color característico era el sello con la fecha en las fotos de cámaras compactas de 2008?',
    opciones: ['Blanco puro', 'Azul celeste', 'Naranja / Ámbar digital', 'Verde fosforito'],
    correcta: 2,
    explicacion: 'Las cámaras digitales compactas estampaban la fecha en números digitales color ámbar/naranja en la esquina inferior.'
  },
  {
    id: 4,
    pregunta: '¿Cuál era la forma obligatoria para poder registrarse en los primeros años de Tuenti?',
    opciones: ['Pagar 1 euro por SMS', 'Tener una cuenta de universidad (.es)', 'Recibir una invitación de un amigo', 'Comprar una tarjeta SIM Tuenti'],
    correcta: 2,
    explicacion: 'Tuenti era una red cerrada y exclusiva a la que solo podías acceder si un amigo te enviaba una de sus invitaciones.'
  },
  {
    id: 5,
    pregunta: '¿Qué grupo español cantaba "Quiero entrar en tu garito con zapatillas"?',
    opciones: ['Pignoise', 'El Canto del Loco', 'Melendi', 'Pereza'],
    correcta: 1,
    explicacion: 'El Canto del Loco compuso "Zapatillas" en 2005, el himno absoluto de los veranos de Tuenti.'
  },
  {
    id: 6,
    pregunta: '¿Qué sección del perfil servía para que los amigos dejaran mensajes públicos a la vista de todos?',
    opciones: ['El Muro / Tablón', 'El Libro de visitas', 'La Pizarra', 'El Foro'],
    correcta: 0,
    explicacion: 'El Tablón era el lugar sagrado donde tus amigos te dejaban firmas públicas como "firmitaaa wapo tkmmm".'
  },
  {
    id: 7,
    pregunta: '¿Cómo se llamaba la famosa pose de foto en la que la cámara se sujetaba en alto con un brazo?',
    opciones: ['Selfie Cenital', 'Ángulo Tuenti / Fotolog', 'Pose Flamingo', 'Flashback'],
    correcta: 1,
    explicacion: 'El clásico "ángulo picado Tuenti" con el brazo estirado apuntando desde arriba hacia el flequillo.'
  },
  {
    id: 8,
    pregunta: '¿Cuál de estos juegos flash estuvo integrado dentro de Tuenti en su época dorada?',
    opciones: ['Towner', 'Counter-Strike 1.6', 'Club Penguin', 'FarmVille Tuenti'],
    correcta: 0,
    explicacion: 'Towner fue uno de los juegos más populares dentro de la sección de Juegos de Tuenti.'
  }
];

export const INITIAL_GAME_SCORES: GameScore[] = [
  { id: 'sc-1', gameId: 'trivia', juego: 'trivia', userId: 'user-laura', userName: 'Laura Gómez', userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80', score: 800, puntos: 800, date: 'Ayer', fecha: 'Ayer' },
  { id: 'sc-2', gameId: 'trivia', juego: 'trivia', userId: 'user-carlos', userName: 'Carlos Ruiz', userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80', score: 700, puntos: 700, date: 'Hace 2 días', fecha: 'Hace 2 días' },
  { id: 'sc-3', gameId: 'trivia', juego: 'trivia', userId: 'user-elena', userName: 'Elena Martínez', userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&auto=format&fit=crop&q=80', score: 650, puntos: 650, date: 'Hace 3 días', fecha: 'Hace 3 días' },
  { id: 'sc-4', gameId: 'stacker', juego: 'stacker', userId: 'user-carlos', userName: 'Carlos Ruiz', userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80', score: 18, puntos: 18, date: 'Ayer', fecha: 'Ayer' },
  { id: 'sc-5', gameId: 'stacker', juego: 'stacker', userId: 'user-laura', userName: 'Laura Gómez', userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80', score: 14, puntos: 14, date: 'Hace 2 días', fecha: 'Hace 2 días' }
];
