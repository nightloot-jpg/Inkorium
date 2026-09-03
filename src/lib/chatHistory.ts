import { ChatMessage } from '../types';

const CHAT_STORAGE_KEY = 'inkorium:chat_history_store';

// Helper to normalize user identifiers so aliases always map to the exact same conversation
export function normalizeUserId(id: string): string {
  if (!id) return '';
  return String(id).trim().toLowerCase();
}

// Cross-tab real-time sync channel
let syncChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
    syncChannel = new BroadcastChannel('inkorium_cross_tab_sync');
  }
} catch {
  syncChannel = null;
}

export type InkoriumCrossTabEvent = 
  | { type: 'CHAT_MESSAGE'; payload: { message: ChatMessage; targetUserId: string; senderUserId: string } }
  | { type: 'CHAT_NUDGE'; payload: { targetUserId: string; senderUserId: string } }
  | { type: 'CHAT_REACTION'; payload: { messageId: string; emoji: string; userId: string; targetUserId: string } }
  | { type: 'PEER_TYPING'; payload: { targetUserId: string; isTyping: boolean } }
  | { type: 'PRIVATE_MESSAGE'; payload: { message: any; recipientId: string } }
  | { type: 'NOTIFICATION'; payload: { notification: any } }
  | { type: 'PROFILE_UPDATE'; payload: { userId: string; data: any } };

export function broadcastCrossTabEvent(event: InkoriumCrossTabEvent): void {
  try {
    if (syncChannel) {
      syncChannel.postMessage(event);
    }
  } catch (err) {
    console.warn('BroadcastChannel error:', err);
  }
}

export function subscribeCrossTabEvents(listener: (event: InkoriumCrossTabEvent) => void): () => void {
  if (!syncChannel) return () => {};
  const handler = (e: MessageEvent<InkoriumCrossTabEvent>) => {
    if (e.data && e.data.type) {
      listener(e.data);
    }
  };
  syncChannel.addEventListener('message', handler);
  return () => {
    syncChannel?.removeEventListener('message', handler);
  };
}

function getStorageConversationKey(userA: string, userB: string): string {
  const normA = normalizeUserId(userA);
  const normB = normalizeUserId(userB);
  const [first, second] = [normA, normB].sort();
  return `${CHAT_STORAGE_KEY}:${first}:${second}`;
}

export function generateInitialHistoryForPair(currentUserId: string, targetUserId: string, targetUserName = ''): ChatMessage[] {
  if (!currentUserId || !targetUserId || currentUserId === targetUserId) return [];

  const now = Date.now();
  const firstName = (targetUserName || 'amigo').split(' ')[0];

  return [
    {
      id: `init-${targetUserId}-1`,
      emisorId: targetUserId,
      receptorId: currentUserId,
      mensaje: `¡Ey! ¿Qué tal todo? ^^ Mira esta foto que encontré del finde pasado`,
      fecha: 'Ayer, 18:32',
      timestamp: now - 86400000 + 3600000,
      leido: true,
      imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80'
    },
    {
      id: `init-${targetUserId}-2`,
      emisorId: currentUserId,
      receptorId: targetUserId,
      mensaje: `¡Qué buena! XD Salimos genial ahí (L)`,
      fecha: 'Ayer, 18:35',
      timestamp: now - 86400000 + 4000000,
      leido: true,
      reactions: { '❤️': [targetUserId] }
    },
    {
      id: `init-${targetUserId}-3`,
      emisorId: targetUserId,
      receptorId: currentUserId,
      mensaje: `Te paso también los horarios por si los necesitas 📎`,
      fecha: 'Ayer, 18:40',
      timestamp: now - 86400000 + 4500000,
      leido: true,
      fileUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=600&auto=format&fit=crop&q=80',
      fileName: 'horarios-quedada.pdf',
      fileSize: 245000,
      fileType: 'application/pdf'
    },
    {
      id: `init-${targetUserId}-4`,
      emisorId: currentUserId,
      receptorId: targetUserId,
      mensaje: `¡Perfecto! Nos vemos luego entonces ;)`,
      fecha: 'Hoy, 12:15',
      timestamp: now - 3600000,
      leido: true
    }
  ];
}

/**
 * Loads all conversation messages for a pair from localStorage.
 */
export function getFullConversation(currentUserId: string, targetUserId: string, _targetUserName = ''): ChatMessage[] {
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

  // If no history exists yet, generate initial conversation with shared media
  const initial = generateInitialHistoryForPair(currentUserId, targetUserId, _targetUserName);
  if (initial.length > 0) {
    saveFullConversation(currentUserId, targetUserId, initial);
    return initial;
  }

  return [];
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
  if (current.some(m => m.id === newMsg.id)) {
    return current;
  }
  const updated = [...current, newMsg];
  saveFullConversation(currentUserId, targetUserId, updated);
  return updated;
}

export function updateMessageInConversation(currentUserId: string, targetUserId: string, messageId: string, updater: (msg: ChatMessage) => ChatMessage): ChatMessage[] {
  const current = getFullConversation(currentUserId, targetUserId);
  let changed = false;
  const updated = current.map(m => {
    if (m.id === messageId) {
      changed = true;
      return updater(m);
    }
    return m;
  });
  if (changed) {
    saveFullConversation(currentUserId, targetUserId, updated);
  }
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
