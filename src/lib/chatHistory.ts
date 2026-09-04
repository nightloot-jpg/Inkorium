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
  | { type: 'CHAT_READ'; payload: { readerId: string; senderId: string; messageIds: string[]; readAt: number; readDate: string } }
  | { type: 'CHAT_REACTION'; payload: { messageId: string; emoji: string; userId: string; targetUserId: string } }
  | { type: 'PEER_TYPING'; payload: { targetUserId: string; isTyping: boolean } }
  | { type: 'PRIVATE_MESSAGE'; payload: { message: any; recipientId: string } }
  | { type: 'NOTIFICATION'; payload: { notification: any } }
  | { type: 'PROFILE_UPDATE'; payload: { userId: string; data: any } }
  | { type: 'CHAT_BLOCK_UPDATE'; payload: { blockerId: string; blockedId: string; isBlocked: boolean } };

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
  // Real chats between real people start clean without simulated bot messages
  return [];
}

/**
 * Loads all conversation messages for a pair from localStorage.
 * Only authentic messages sent between real users are returned.
 */
export function getFullConversation(currentUserId: string, targetUserId: string, _targetUserName = ''): ChatMessage[] {
  if (typeof window === 'undefined') return [];
  const key = getStorageConversationKey(currentUserId, targetUserId);
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Filter out any synthetic/bot replies or initial fake messages so only real human messages exist
        const realOnly = parsed.filter((m: ChatMessage) => {
          if (!m || !m.id) return false;
          if (m.id.startsWith('chat-reply-') || m.id.startsWith('init-')) {
            return false;
          }
          return true;
        });

        // If some bot messages were filtered out, clean the persisted storage
        if (realOnly.length !== parsed.length) {
          saveFullConversation(currentUserId, targetUserId, realOnly);
        }

        return realOnly.sort((a: ChatMessage, b: ChatMessage) => (a.timestamp || 0) - (b.timestamp || 0));
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
 * Marks unread messages sent by targetUserId to currentUserId as read locally
 * and returns the list of message IDs that were marked as read.
 */
export function markConversationAsRead(
  currentUserId: string,
  targetUserId: string,
  readAt = Date.now(),
  readDate = new Date(readAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
): { updatedCount: number; messageIds: string[]; updatedMessages: ChatMessage[] } {
  if (typeof window === 'undefined') return { updatedCount: 0, messageIds: [], updatedMessages: [] };
  const normTarget = normalizeUserId(targetUserId);
  const current = getFullConversation(currentUserId, targetUserId);
  const messageIds: string[] = [];

  const updatedMessages = current.map((m) => {
    if (normalizeUserId(m.emisorId) === normTarget && !m.leido) {
      messageIds.push(m.id);
      return {
        ...m,
        leido: true,
        readAt,
        readDate
      };
    }
    return m;
  });

  if (messageIds.length > 0) {
    saveFullConversation(currentUserId, targetUserId, updatedMessages);
  }

  return { updatedCount: messageIds.length, messageIds, updatedMessages };
}

/**
 * Updates messages in conversation when a read receipt is received from the peer.
 */
export function applyReadReceiptsToConversation(
  currentUserId: string,
  targetUserId: string,
  messageIds: string[],
  readAt: number,
  readDate: string
): ChatMessage[] {
  if (typeof window === 'undefined') return [];
  const current = getFullConversation(currentUserId, targetUserId);
  let changed = false;

  const updatedMessages = current.map((m) => {
    const isTarget = messageIds.length === 0 || messageIds.includes(m.id);
    if (isTarget && !m.leido) {
      changed = true;
      return {
        ...m,
        leido: true,
        readAt,
        readDate
      };
    }
    return m;
  });

  if (changed) {
    saveFullConversation(currentUserId, targetUserId, updatedMessages);
  }

  return updatedMessages;
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

const BLOCKED_USERS_STORAGE_PREFIX = 'inkorium:blocked_chat_users:';

export function getStoredBlockedUserIds(currentUserId: string): string[] {
  if (typeof localStorage === 'undefined' || !currentUserId) return [];
  try {
    const raw = localStorage.getItem(`${BLOCKED_USERS_STORAGE_PREFIX}${normalizeUserId(currentUserId)}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function saveStoredBlockedUserIds(currentUserId: string, blockedIds: string[]): void {
  if (typeof localStorage === 'undefined' || !currentUserId) return;
  try {
    const unique = Array.from(new Set(blockedIds.map(String)));
    localStorage.setItem(`${BLOCKED_USERS_STORAGE_PREFIX}${normalizeUserId(currentUserId)}`, JSON.stringify(unique));
  } catch {}
}
