import { CampusCommunity } from '../types';

export const INITIAL_CAMPUS_COMMUNITIES: CampusCommunity[] = [
  {
    id: 'campus_ucm',
    nombre: 'Universidad Complutense de Madrid',
    siglas: 'UCM',
    tipo: 'universidad',
    ciudad: 'Madrid',
    descripcion: 'Espacio de estudiantes de la Complutense (Moncloa, Ciudad Universitaria y Somosaguas). Apuntes, fiestas y quedadas.',
    avatar: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=200&auto=format&fit=crop&q=80',
    portada: 'https://images.unsplash.com/photo-1562774053-701939374585?w=1200&auto=format&fit=crop&q=80',
    miembros: ['user_1', 'user_2', 'user_4', 'user_6'],
    posts: [
      {
        id: 'post_ucm_1',
        autorId: 'user_2',
        autorNombre: 'Elena Martínez',
        autorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        tipo: 'apuntes',
        titulo: 'Apuntes de Historia del Arte Contemporáneo (Cuatrimestre 1)',
        texto: '¡Hola a todos! He subido a la biblioteca compartida mis apuntes completos en limpio de Vanguardias y Arte del siglo XX. ¡Mucha suerte a todos con las entregas!',
        fecha: 'Hoy a las 14:20',
        likes: ['user_1', 'user_4'],
        respuestas: [
          {
            id: 'resp_1',
            autorId: 'user_4',
            autorNombre: 'Pablo Moreno',
            autorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
            texto: '¡Mil gracias Elena! Me salvas la vida para el examen de la semana que viene.',
            fecha: 'Hoy a las 15:02'
          }
        ]
      },
      {
        id: 'post_ucm_2',
        autorId: 'user_1',
        autorNombre: 'Laura Gómez',
        autorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        tipo: 'fiesta',
        titulo: 'Fiesta de San Isidoro en el césped de Filología',
        texto: 'Este viernes a partir de las 18:00 nos vemos todos en el césped detrás de Filología con guitarras y merienda. ¡Quien quiera apuntarse es bienvenido!',
        fecha: 'Ayer a las 20:15',
        likes: ['user_2', 'user_6'],
        respuestas: []
      }
    ]
  },
  {
    id: 'campus_upc',
    nombre: 'Universitat Politècnica de Catalunya',
    siglas: 'UPC',
    tipo: 'universidad',
    ciudad: 'Barcelona',
    descripcion: 'Comunidad de la UPC: FIB, ETSEIB, ETSAB y Campus Nord. Dudas de programación, proyectos y quedadas.',
    avatar: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=200&auto=format&fit=crop&q=80',
    portada: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&auto=format&fit=crop&q=80',
    miembros: ['user_3', 'user_5', 'user_7'],
    posts: [
      {
        id: 'post_upc_1',
        autorId: 'user_3',
        autorNombre: 'Carlos Ruiz',
        autorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        tipo: 'duda',
        titulo: 'Duda con la práctica de Estructuras de Datos y Algoritmos',
        texto: '¿Alguien que esté haciendo la entrega de árboles binarios en C++ me puede echar un cable con el balanceo AVL? Tengo un memory leak en el destructor.',
        fecha: 'Hoy a las 11:30',
        likes: ['user_5'],
        respuestas: [
          {
            id: 'resp_upc_1',
            autorId: 'user_5',
            autorNombre: 'Lucía Sánchez',
            autorAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
            texto: 'Revisa si estás liberando los subárboles recursivamente antes de reasignar el puntero raíz. Te mando mensaje privado con mi snippet.',
            fecha: 'Hoy a las 12:05'
          }
        ]
      }
    ]
  },
  {
    id: 'campus_uam',
    nombre: 'Universidad Autónoma de Madrid',
    siglas: 'UAM',
    tipo: 'universidad',
    ciudad: 'Madrid',
    descripcion: 'Campus de Cantoblanco: Ciencias, Derecho, Económicas, Filosofía y Psicología.',
    avatar: 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=200&auto=format&fit=crop&q=80',
    portada: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&auto=format&fit=crop&q=80',
    miembros: ['user_4', 'user_8'],
    posts: [
      {
        id: 'post_uam_1',
        autorId: 'user_4',
        autorNombre: 'Pablo Moreno',
        autorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        tipo: 'quedada',
        titulo: 'Torneo de Mus en la cafetería de Derecho',
        texto: 'Este jueves organizamos campeonato de mus por parejas en la terraza de la cafetería de Derecho. Inscripción gratis, solo ganas de pasar la tarde.',
        fecha: 'Hace 2 días',
        likes: ['user_8'],
        respuestas: []
      }
    ]
  },
  {
    id: 'campus_us',
    nombre: 'Universidad de Sevilla',
    siglas: 'US',
    tipo: 'universidad',
    ciudad: 'Sevilla',
    descripcion: 'Fábrica de Tabacos, Reina Mercedes, Cartuja y Ramón y Cajal. Punto de encuentro de los universitarios de Sevilla.',
    avatar: 'https://images.unsplash.com/photo-1525921429624-479b6a26d84d?w=200&auto=format&fit=crop&q=80',
    portada: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1200&auto=format&fit=crop&q=80',
    miembros: ['user_5', 'user_6'],
    posts: [
      {
        id: 'post_us_1',
        autorId: 'user_5',
        autorNombre: 'Lucía Sánchez',
        autorAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
        tipo: 'general',
        titulo: 'Compartir piso en zona Viapol / San Bernardo',
        texto: 'Buscamos compañera/o de piso para el segundo cuatrimestre, a 5 minutos andando de las facultades de Ramón y Cajal. 220€/mes con gastos incluidos.',
        fecha: 'Hace 3 días',
        likes: ['user_6'],
        respuestas: []
      }
    ]
  },
  {
    id: 'campus_ies_beatriz',
    nombre: 'IES Beatriz Galindo',
    siglas: 'IES BG',
    tipo: 'instituto',
    ciudad: 'Madrid',
    descripcion: 'Comunidad de Bachillerato y ESO del instituto en el barrio de Salamanca.',
    avatar: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=200&auto=format&fit=crop&q=80',
    portada: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=1200&auto=format&fit=crop&q=80',
    miembros: ['user_1', 'user_7'],
    posts: [
      {
        id: 'post_ies_1',
        autorId: 'user_7',
        autorNombre: 'David Navarro',
        autorAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
        tipo: 'general',
        titulo: 'Reunión graduación 2º de Bachillerato',
        texto: 'Compañeros de 2º de Bachillerato, tenemos que votar el modelo de sudadera de la graduación antes del viernes.',
        fecha: 'Hace 1 día',
        likes: ['user_1'],
        respuestas: []
      }
    ]
  },
  {
    id: 'barrio_malasana',
    nombre: 'Malasaña & Tribunal',
    siglas: 'MAL',
    tipo: 'barrio',
    ciudad: 'Madrid',
    descripcion: 'Espacio de amigos y vecinos de Malasaña, Dos de Mayo, Tribunal y Conde Duque.',
    avatar: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=200&auto=format&fit=crop&q=80',
    portada: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=1200&auto=format&fit=crop&q=80',
    miembros: ['user_1', 'user_2', 'user_3', 'user_4'],
    posts: [
      {
        id: 'post_mal_1',
        autorId: 'user_1',
        autorNombre: 'Laura Gómez',
        autorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        tipo: 'quedada',
        titulo: 'Tarde de vinilos y café en Dos de Mayo',
        texto: '¿Quién se apunta a dar una vuelta por las tiendas de vinilos de la calle Palma esta tarde?',
        fecha: 'Hoy a las 16:00',
        likes: ['user_2', 'user_3'],
        respuestas: []
      }
    ]
  },
  {
    id: 'barrio_gracia',
    nombre: 'Barri de Gràcia',
    siglas: 'GRA',
    tipo: 'barrio',
    ciudad: 'Barcelona',
    descripcion: 'Plaça del Sol, Plaça de la Virreina y carrers de Gràcia. Conoce gente del barrio y propuestas culturales.',
    avatar: 'https://images.unsplash.com/photo-1511527661048-7fe73d85e9a4?w=200&auto=format&fit=crop&q=80',
    portada: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1200&auto=format&fit=crop&q=80',
    miembros: ['user_3', 'user_5'],
    posts: [
      {
        id: 'post_gra_1',
        autorId: 'user_5',
        autorNombre: 'Lucía Sánchez',
        autorAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
        tipo: 'general',
        titulo: 'Cine al aire libre en Plaça de la Virreina',
        texto: 'Proyectan ciclo de cortos independientes este jueves por la noche. ¡Traed cojines!',
        fecha: 'Ayer',
        likes: ['user_3'],
        respuestas: []
      }
    ]
  }
];
