import { SocialEvent, TuentiPage, GameScore } from '../types';

export const INITIAL_EVENTS: SocialEvent[] = [];

export const INITIAL_PAGES: TuentiPage[] = [];

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

export const INITIAL_GAME_SCORES: GameScore[] = [];
