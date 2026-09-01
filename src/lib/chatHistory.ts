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
  | { type: 'PEER_TYPING'; payload: { targetUserId: string; isTyping: boolean } }
  | { type: 'PRIVATE_MESSAGE'; payload: { message: any; recipientId: string } }
  | { type: 'NOTIFICATION'; payload: { notification: any } };

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

export function generateInitialHistoryForPair(_currentUserId: string, _targetUserId: string, _targetUserName = ''): ChatMessage[] {
  // Real users start with a fresh, clean chat history
  return [];
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
