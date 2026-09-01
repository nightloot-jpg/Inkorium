/**
 * Retro Tuenti / Inkorium smart response generator for Chat and Private Messages.
 */

export function generateRetroChatReply(
  targetUserName: string,
  userMessage: string
): string {
  const text = (userMessage || '').toLowerCase().trim();
  const firstName = (targetUserName || 'Amigo').split(' ')[0];

  // 1. Greetings
  if (/\b(hola|buenas|hey|ey|holi|buenas noches|buenos dias|buenas tardes|que tal|q tal|que hay)\b/i.test(text)) {
    const greetings = [
      `¡Eyyy! ¿Qué tal todo por ahí? ^^`,
      `¡Holaaa! Qué alegría leerte por el chat :D`,
      `¡Hombre! ¿Cómo te va la vida crack?`,
      `¡Buenas! Justo estaba conectado viendo fotos jaja ¿tú qué tal?`,
      `¡Eyy! ¿Qué se cuece hoy por Inkorium? :P`
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  // 2. Questions about plans, weekend, party, meetup
  if (/\b(fiesta|salir|quedada|finde|cerveza|tomar|plan|planes|sabado|viernes|botellon|concierto)\b/i.test(text)) {
    const partyReplies = [
      `¡Buah de una! El finde tenemos que montar una buena quedada todos 🎉`,
      `¡Sii! Me comentaron de vernos sobre las 18:00 en el centro, ¿te vienes?`,
      `¡Planazo! Avísame luego y nos tomamos algo seguro :D`,
      `Uff a esa me apunto de cabeza! Ya le tengo ganas al fin de semana jaja`
    ];
    return partyReplies[Math.floor(Math.random() * partyReplies.length)];
  }

  // 3. Photos, Wall, Profile
  if (/\b(foto|fotos|album|tablon|perfil|firma|etiqueta|subir)\b/i.test(text)) {
    const photoReplies = [
      `¡Siii! Me pasé antes por tu perfil y te dejé una firma en el tablón ;)`,
      `¡Vaya fotones tenéis del último viaje! Luego comento en el álbum :D`,
      `Luego subo yo unas cuantas de la fiesta y os etiqueto a todos ^^`,
      `¡Te devuelvo la firma ahora mismito en tu tablón!`
    ];
    return photoReplies[Math.floor(Math.random() * photoReplies.length)];
  }

  // 4. Music
  if (/\b(musica|cancion|tema|temazo|indie|rock|spotify|escuchar|reproductor|grupo)\b/i.test(text)) {
    const musicReplies = [
      `¡Ese temazo es mítico! Lo tengo en bucle en el reproductor de Inkorium 🎵`,
      `¡Qué buen gusto musical! Ese grupo me encanta en directo <3`,
      `¡Siii! Pásate por la sección de Música que han puesto canciones buenísimas ^^`
    ];
    return musicReplies[Math.floor(Math.random() * musicReplies.length)];
  }

  // 5. Studies, university, work, exams
  if (/\b(examen|examenes|estudiar|apuntes|clase|uni|universidad|curro|trabajo|resumen)\b/i.test(text)) {
    const studyReplies = [
      `¡Buf ni me lo recuerdes! Estoy a tope con los apuntes, a ver si acabo pronto >_<`,
      `Si necesitas apuntes o esquemas avísame que los tengo pasados a limpio ;)`,
      `¡Mucho ánimo con eso! Luego nos recompensamos con un buen descanso jaja`
    ];
    return studyReplies[Math.floor(Math.random() * studyReplies.length)];
  }

  // 6. Laughter, memes, jokes
  if (/\b(jaja|jajaja|xd|lol|jeje|jaja|jajajaja)\b/i.test(text)) {
    const laughReplies = [
      `Jajajaja es que es brutal XD`,
      `¡Tal cual jaja! No puedo parar de reírme :P`,
      `Jajaja qué grande eres! Me parto contigo crack :D`
    ];
    return laughReplies[Math.floor(Math.random() * laughReplies.length)];
  }

  // 7. General conversational fallback
  const genericReplies = [
    `¡Genial! Hablamos en un ratillo que justo estoy terminando unas cosas por aquí ^^`,
    `¡Totalmente de acuerdo! Luego me conecto con calma y seguimos hablando crack :D`,
    `¡Oído cocina! Un abrazo enorme y nos vemos por el tablón (L)`,
    `¡Claro que sí! Cualquier cosa me escribes por aquí o me dejas un MP ;)`,
    `¡Qué bien leerte ${firstName}! Me ha dado muchísima nostalgia hablar contigo por Inkorium ^^`
  ];
  return genericReplies[Math.floor(Math.random() * genericReplies.length)];
}

export function generateRetroPrivateMessageReply(
  targetUserName: string,
  subject: string,
  userMessage: string
): { subject: string; body: string } {
  const sub = subject.trim();
  const replySubject = sub.toLowerCase().startsWith('re:') ? sub : `Re: ${sub || 'Mensaje'}`;
  const firstName = (targetUserName || 'Amigo').split(' ')[0];

  const lowerBody = (userMessage || '').toLowerCase();

  let body = '';
  if (lowerBody.includes('hola') || lowerBody.includes('bienvenid') || lowerBody.includes('saludos')) {
    body = `¡Hola! ^^\n\n¡Qué alegría me ha dado recibir tu mensaje privado! Me parece genial que estés por Inkorium, la red está cada vez más animada.\n\nÉchale un ojo a mis fotos y a la música si te apetece, y hablamos cuando quieras por el chat o por el tablón.\n\n¡Un abrazo enorme!\n— ${firstName}`;
  } else if (lowerBody.includes('quedada') || lowerBody.includes('fiesta') || lowerBody.includes('salir') || lowerBody.includes('finde')) {
    body = `¡Buenas! 🎉\n\nMe parece un planazo total. Cuenta conmigo para lo del fin de semana. Le diré también a los demás a ver si nos juntamos una buena tropa.\n\nTe confirmo la hora exacta en cuanto hable con Carlos y Laura.\n\n¡Nos vemos pronto!\n— ${firstName}`;
  } else if (lowerBody.includes('apuntes') || lowerBody.includes('examen') || lowerBody.includes('clase')) {
    body = `¡Hola ${firstName}!\n\nNo te preocupes por el tema del estudio, que lo sacamos adelante seguro. En cuanto me siente delante del ordenador te paso los temas que tengo listos.\n\n¡Mucho ánimo con el repaso!\n— ${firstName}`;
  } else {
    body = `¡Hola! :)\n\nHe leído tu mensaje atentamente. ¡Muchas gracias por escribirme!\n\nEstoy totalmente de acuerdo con lo que me comentas. Ahora mismo estoy con un par de cosas entre manos pero en cuanto me desocupe me paso por tu perfil a firmarte en el tablón.\n\n¡Seguimos en contacto por aquí!\n— ${firstName} <3`;
  }

  return { subject: replySubject, body };
}
