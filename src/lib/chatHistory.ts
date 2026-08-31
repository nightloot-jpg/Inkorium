import { ChatMessage } from '../types';

const CHAT_STORAGE_KEY = 'inkorium:chat_history_store';

// Helper to create timestamp offsets
const now = Date.now();
const ONE_HOUR = 3600 * 1000;
const ONE_DAY = 24 * ONE_HOUR;

// Seed conversation templates between users
interface SeedMessageTemplate {
  fromOther: boolean;
  text: string;
  offsetMs: number;
}

const CONVERSATION_SEEDS: Record<string, SeedMessageTemplate[]> = {
  // Elena Ramos (id: 1 or user-1 or nightloot / default)
  default: [
    { fromOther: true, text: '¡Eyyy! ¿Qué tal todo? ¡Qué alegría verte por Inkorium! ^^', offsetMs: 30 * ONE_DAY + 4 * ONE_HOUR },
    { fromOther: false, text: '¡Hola Elena! Siii, me ha dado muchísima nostalgia entrar aquí jaja', offsetMs: 30 * ONE_DAY + 3 * ONE_HOUR },
    { fromOther: true, text: 'Totalmente!! ¿Viste las fotos que subí del viaje del verano pasado?', offsetMs: 30 * ONE_DAY + 2 * ONE_HOUR },
    { fromOther: false, text: 'Siii, os quedaron brutales, sobre todo la de la playa al atardecer :D', offsetMs: 30 * ONE_DAY + 1 * ONE_HOUR },
    { fromOther: true, text: 'Jajaja muchas gracias!! Te he dejado una firma en el tablón por cierto ;)', offsetMs: 30 * ONE_DAY },
    { fromOther: true, text: 'Oye, ¿te acuerdas del examen de historia de la semana que viene?', offsetMs: 14 * ONE_DAY + 5 * ONE_HOUR },
    { fromOther: false, text: 'Buf ni me lo recuerdes... todavía tengo que resumir el tema 4 y 5 >_<', offsetMs: 14 * ONE_DAY + 4 * ONE_HOUR },
    { fromOther: true, text: 'Si quieres te paso mis apuntes que los tengo pasados a limpio en PDF!', offsetMs: 14 * ONE_DAY + 3 * ONE_HOUR },
    { fromOther: false, text: '¡Buah me salvas la vida! Te debo una pizza enorme (L)', offsetMs: 14 * ONE_DAY + 2 * ONE_HOUR },
    { fromOther: true, text: 'Jajaja trato hecho! Te los paso ahora mismo por correo.', offsetMs: 14 * ONE_DAY + 1 * ONE_HOUR },
    { fromOther: true, text: '¿Vas a ir a la quedada del sábado en el Retiro?', offsetMs: 5 * ONE_DAY + 6 * ONE_HOUR },
    { fromOther: false, text: 'Sii, me dijo Carlos que iremos casi todos sobre las 17:00', offsetMs: 5 * ONE_DAY + 5 * ONE_HOUR },
    { fromOther: true, text: 'Genial! Llevo la cámara de fotos y nos hacemos unas cuantas para subirlas', offsetMs: 5 * ONE_DAY + 4 * ONE_HOUR },
    { fromOther: false, text: 'De una! Y luego nos etiquetamos en el álbum :P', offsetMs: 5 * ONE_DAY + 3 * ONE_HOUR },
    { fromOther: true, text: '¡Hola! ¿Estás por ahí?', offsetMs: 1 * ONE_DAY + 2 * ONE_HOUR },
    { fromOther: false, text: 'Eyy, dime! Estaba terminando de cenar', offsetMs: 1 * ONE_DAY + 1 * ONE_HOUR },
    { fromOther: true, text: '¿Escuchaste la nueva canción que puse en mi estado de Inkorium?', offsetMs: 1 * ONE_DAY + 30 * 60 * 1000 },
    { fromOther: false, text: 'Siii temazo total! La tengo en bucle en el MP3 jaja', offsetMs: 1 * ONE_DAY + 10 * 60 * 1000 },
    { fromOther: true, text: 'Jajaja es que es un clásico! Hablamos mañana entonces ^^', offsetMs: 1 * ONE_DAY },
    { fromOther: true, text: '¡Buenas! ¿Qué planes tienes para hoy por la tarde?', offsetMs: 2 * ONE_HOUR },
    { fromOther: false, text: '¡Hola! Nada en especial, dando una vuelta por aquí viendo los tablones y fotos.', offsetMs: 1 * ONE_HOUR },
    { fromOther: true, text: 'Genial, avísame si te apetece tomar algo luego!', offsetMs: 20 * 60 * 1000 }
  ],
  // Carlos Ruiz
  carlos: [
    { fromOther: true, text: '¡Hombre máquina! ¿Cómo va eso?', offsetMs: 25 * ONE_DAY },
    { fromOther: false, text: '¡Carlos! Todo bien tío, dándole caña a los proyectos. ¿Y tú?', offsetMs: 25 * ONE_DAY - 20 * 60 * 1000 },
    { fromOther: true, text: 'Aquí andamos, a ver si echamos unas partidas al Counter o al Pro este finde!', offsetMs: 25 * ONE_DAY - 40 * 60 * 1000 },
    { fromOther: false, text: 'Cuenta con ello, el viernes por la noche le damos sin falta!', offsetMs: 25 * ONE_DAY - 60 * 60 * 1000 },
    { fromOther: true, text: '¿Viste el partidazo de ayer? Qué golazo en el último minuto madre mía', offsetMs: 8 * ONE_DAY },
    { fromOther: false, text: 'Increíble, casi rompo el sofá celebrándolo jajaja', offsetMs: 8 * ONE_DAY - 15 * 60 * 1000 },
    { fromOther: true, text: 'Oye te he firmado en el tablón una foto del concierto!', offsetMs: 2 * ONE_DAY },
    { fromOther: false, text: 'Ahora mismito me paso a verla y te devuelvo la firma crack!', offsetMs: 2 * ONE_DAY - 30 * 60 * 1000 }
  ],
  // Laura Sanz
  laura: [
    { fromOther: true, text: '¡Holaa! ¿Vienes mañana a clase o te quedas estudiando?', offsetMs: 18 * ONE_DAY },
    { fromOther: false, text: 'Hola Laura! Sí voy, que no me quiero perder la explicación de mates', offsetMs: 18 * ONE_DAY - 15 * 60 * 1000 },
    { fromOther: true, text: 'Menos mal, así nos sentamos juntos y nos enteramos mejor ^^', offsetMs: 18 * ONE_DAY - 30 * 60 * 1000 },
    { fromOther: true, text: '¡Mira la foto que me acabo de poner de perfil! ¿Qué te parece?', offsetMs: 3 * ONE_DAY },
    { fromOther: false, text: '¡Está chulísima! El efecto retro le queda perfecto', offsetMs: 3 * ONE_DAY - 10 * 60 * 1000 },
    { fromOther: true, text: 'Muchas gracias!! <3 Nos vemos mañana!', offsetMs: 3 * ONE_DAY - 20 * 60 * 1000 }
  ]
};

function getStorageConversationKey(userA: string, userB: string): string {
  const [first, second] = [String(userA), String(userB)].sort();
  return `${CHAT_STORAGE_KEY}:${first}:${second}`;
}

export function generateInitialHistoryForPair(currentUserId: string, targetUserId: string, targetUserName: string): ChatMessage[] {
  const isCarlos = targetUserName.toLowerCase().includes('carlos') || targetUserId.includes('2');
  const isLaura = targetUserName.toLowerCase().includes('laura') || targetUserId.includes('3');
  
  const templateKey = isCarlos ? 'carlos' : isLaura ? 'laura' : 'default';
  const templates = CONVERSATION_SEEDS[templateKey] || CONVERSATION_SEEDS.default;

  return templates.map((t, idx) => {
    const timestamp = now - t.offsetMs;
    const dateObj = new Date(timestamp);
    return {
      id: `hist-${targetUserId}-${idx}-${timestamp}`,
      emisorId: t.fromOther ? targetUserId : currentUserId,
      receptorId: t.fromOther ? currentUserId : targetUserId,
      mensaje: t.text,
      fecha: dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      timestamp,
      leido: true
    };
  }).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
}

/**
 * Loads all conversation messages for a pair from localStorage, initializing with seed if empty.
 */
export function getFullConversation(currentUserId: string, targetUserId: string, targetUserName = ''): ChatMessage[] {
  if (typeof window === 'undefined') return [];
  const key = getStorageConversationKey(currentUserId, targetUserId);
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.sort((a: ChatMessage, b: ChatMessage) => (a.timestamp || 0) - (b.timestamp || 0));
      }
    }
  } catch (e) {
    console.warn('Error reading chat history from storage:', e);
  }

  // If not stored yet, initialize seed history and save
  const seeded = generateInitialHistoryForPair(currentUserId, targetUserId, targetUserName);
  saveFullConversation(currentUserId, targetUserId, seeded);
  return seeded;
}

export function saveFullConversation(currentUserId: string, targetUserId: string, messages: ChatMessage[]): void {
  if (typeof window === 'undefined') return;
  const key = getStorageConversationKey(currentUserId, targetUserId);
  try {
    localStorage.setItem(key, JSON.stringify(messages));
  } catch (e) {
    console.warn('Error saving chat history to storage:', e);
  }
}

export function appendMessageToConversation(currentUserId: string, targetUserId: string, newMsg: ChatMessage): ChatMessage[] {
  const current = getFullConversation(currentUserId, targetUserId);
  const updated = [...current, newMsg];
  saveFullConversation(currentUserId, targetUserId, updated);
  return updated;
}

/**
 * Formats a timestamp or date string into a friendly retro Spanish chat date separator:
 * e.g., "Hoy", "Ayer", "14 de Agosto de 2026"
 */
export function formatChatDateDivider(timestampOrDateStr: number | string | undefined): string {
  if (!timestampOrDateStr) return 'Hoy';
  const d = typeof timestampOrDateStr === 'number' ? new Date(timestampOrDateStr) : new Date(timestampOrDateStr);
  if (isNaN(d.getTime())) return 'Hoy';

  const today = new Date();
  const isToday = d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  if (isToday) return 'Hoy';

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const isYesterday = d.getDate() === yesterday.getDate() && d.getMonth() === yesterday.getMonth() && d.getFullYear() === yesterday.getFullYear();
  if (isYesterday) return 'Ayer';

  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}
