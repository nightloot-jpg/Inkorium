import { ChatMessage } from '../types';

const DB_NAME = 'inkorium-chat';
const DB_VERSION = 1;
const STORE_NAME = 'messages';

export type StoredChatMessage = ChatMessage & {
  __ownerId: string;
  __key: string;
};

const supported = () => typeof window !== 'undefined' && typeof indexedDB !== 'undefined';

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDb(): Promise<IDBDatabase | null> {
  if (!supported()) return Promise.resolve(null);
  if (dbPromise) return dbPromise;

  dbPromise = new Promise(resolve => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: '__key' });
          store.createIndex('owner', '__ownerId', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
      request.onerror = () => resolve(null);
      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => db.close();
        resolve(db);
      };
    } catch {
      resolve(null);
    }
  });

  return dbPromise;
}

const ownerKey = (ownerId: string) => String(ownerId || '').trim().toLowerCase();
const messageKey = (ownerId: string, messageId: string) => `${ownerKey(ownerId)}:${String(messageId)}`;

export async function loadChatHistory(ownerId: string): Promise<ChatMessage[]> {
  if (!ownerId) return [];
  const db = await openDb();
  if (!db) return [];

  return new Promise(resolve => {
    try {
      const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).index('owner').getAll(ownerKey(ownerId));
      request.onerror = () => resolve([]);
      request.onsuccess = () => {
        const unique = new Map<string, ChatMessage>();
        for (const row of Array.isArray(request.result) ? request.result : []) {
          if (row?.id) {
            const { __ownerId: _owner, __key: _key, ...message } = row as StoredChatMessage;
            unique.set(String(message.id), message);
          }
        }
        resolve(Array.from(unique.values()).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0)));
      };
    } catch {
      resolve([]);
    }
  });
}

export async function persistChatMessages(ownerId: string, messages: ChatMessage[]): Promise<void> {
  if (!ownerId || !messages.length) return;
  const db = await openDb();
  if (!db) return;

  await new Promise<void>(resolve => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const owner = ownerKey(ownerId);
      for (const message of messages) {
        if (!message?.id) continue;
        const record: StoredChatMessage = {
          ...message,
          __ownerId: owner,
          __key: messageKey(ownerId, String(message.id))
        };
        store.put(record);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    } catch {
      resolve();
    }
  });
}

export async function deletePersistedChatMessages(ownerId: string, ids: string[]): Promise<void> {
  if (!ownerId || !ids.length) return;
  const db = await openDb();
  if (!db) return;

  await new Promise<void>(resolve => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      for (const id of ids) store.delete(messageKey(ownerId, id));
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    } catch {
      resolve();
    }
  });
}

export function mergeChatHistory(localMessages: ChatMessage[], freshMessages: ChatMessage[]): ChatMessage[] {
  const merged = new Map<string, ChatMessage>();
  for (const message of [...localMessages, ...freshMessages]) {
    if (message?.id) merged.set(String(message.id), message);
  }
  return Array.from(merged.values()).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
}
