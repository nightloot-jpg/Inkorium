import type { WallComment, User } from '../types';

export const SIGNATURES_STORAGE_KEY = 'inkorium:wall_comments';

export const cleanId = (value?: string | null): string =>
  String(value ?? '').trim().toLowerCase().replace(/^user-/, '');

export const normalizeId = (value?: string | null): string =>
  String(value ?? '').trim().toLowerCase();

/**
 * Finds a matching user in the users list using any of their identifiers:
 * id, clean(id), username, clean(username), nombre, or full_name.
 */
export function findUserByAnyIdentifier(idOrAlias: string, users: User[]): User | undefined {
  if (!idOrAlias) return undefined;
  const targetNorm = normalizeId(idOrAlias);
  const targetClean = cleanId(idOrAlias);

  return users.find(u => {
    if (!u) return false;
    const uId = normalizeId(u.id);
    const uClean = cleanId(u.id);
    const uName = normalizeId(u.username);
    const uNombre = normalizeId(u.nombre);
    const uFullName = normalizeId(u.full_name);

    return (
      uId === targetNorm ||
      uClean === targetClean ||
      (uName && (uName === targetNorm || cleanId(uName) === targetClean)) ||
      (uNombre && uNombre === targetNorm) ||
      (uFullName && uFullName === targetNorm)
    );
  });
}

/**
 * Maps raw backend/database/localStorage signature object into a verified WallComment
 * guaranteed to match the target user profile correctly.
 */
export function mapAndVerifySignatureToProfile(
  raw: any,
  users: User[],
  targetProfileUser?: User
): WallComment {
  const rawProfileId = String(raw.profile_id || raw.propietarioId || raw.receptorId || raw.target_id || '').trim();
  const rawAuthorId = String(raw.author_id || raw.autorId || raw.emisorId || '').trim();
  const content = String(raw.content || raw.texto || raw.comentario || '').trim();

  // 1. Resolve and verify target profile user
  const targetUser =
    (targetProfileUser && (
      cleanId(targetProfileUser.id) === cleanId(rawProfileId) ||
      normalizeId(targetProfileUser.username) === normalizeId(rawProfileId) ||
      normalizeId(targetProfileUser.nombre) === normalizeId(rawProfileId)
    ) ? targetProfileUser : undefined) ||
    findUserByAnyIdentifier(rawProfileId, users);

  const canonicalProfileId = targetUser?.id || rawProfileId;

  // 2. Resolve and verify author user
  const authorUser = findUserByAnyIdentifier(rawAuthorId, users);
  const canonicalAuthorId = authorUser?.id || rawAuthorId;

  const authorName = String(
    raw.author_name ||
    raw.autorNombre ||
    raw.emisorNombre ||
    (authorUser ? (authorUser.full_name || `${authorUser.nombre} ${authorUser.apellidos}`.trim() || authorUser.nombre) : 'Usuario')
  ).trim();

  const authorAvatar = String(
    raw.author_avatar ||
    raw.autorAvatar ||
    raw.emisorAvatar ||
    authorUser?.avatar ||
    ''
  ).trim();

  // 3. Format timestamp / date
  let formattedDate = 'Ahora mismo';
  if (raw.created_at) {
    try {
      formattedDate = new Date(raw.created_at).toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      formattedDate = String(raw.created_at);
    }
  } else if (raw.fecha) {
    formattedDate = String(raw.fecha);
  }

  const id = String(raw.id || `sig-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`);

  return {
    id,
    propietarioId: canonicalProfileId,
    receptorId: canonicalProfileId,
    profile_id: canonicalProfileId,
    autorId: canonicalAuthorId,
    emisorId: canonicalAuthorId,
    author_id: canonicalAuthorId,
    autorNombre: authorName,
    emisorNombre: authorName,
    author_name: authorName,
    autorAvatar: authorAvatar,
    emisorAvatar: authorAvatar,
    author_avatar: authorAvatar,
    texto: content,
    comentario: content,
    content: content,
    fecha: formattedDate,
    created_at: raw.created_at || new Date().toISOString(),
    likes: Array.isArray(raw.likes) ? raw.likes : []
  };
}

/**
 * Robust verification function that checks if a signature belongs to a given user profile.
 * Resilient against user- prefix, id vs username, uppercase/lowercase, and full names.
 */
export function isSignatureForProfile(
  signature: WallComment,
  profileUser: { id: string; username?: string; nombre?: string; full_name?: string }
): boolean {
  if (!signature || !profileUser) return false;

  const commentTargets = [
    signature.receptorId,
    signature.propietarioId,
    signature.profile_id
  ].filter(Boolean) as string[];

  if (commentTargets.length === 0) return false;

  const pId = normalizeId(profileUser.id);
  const pClean = cleanId(profileUser.id);
  const pUsername = normalizeId(profileUser.username);
  const pUsernameClean = cleanId(profileUser.username);
  const pNombre = normalizeId(profileUser.nombre);
  const pFullName = normalizeId(profileUser.full_name);

  return commentTargets.some(target => {
    const tNorm = normalizeId(target);
    const tClean = cleanId(target);

    return (
      tNorm === pId ||
      tClean === pClean ||
      (pUsername && (tNorm === pUsername || tClean === pUsernameClean)) ||
      (pNombre && tNorm === pNombre) ||
      (pFullName && tNorm === pFullName)
    );
  });
}

/**
 * Deduplicates signatures by id and sorts them with most recent first.
 */
export function deduplicateAndSortSignatures(signatures: WallComment[]): WallComment[] {
  const seen = new Map<string, WallComment>();
  for (const sig of signatures) {
    if (sig && sig.id) {
      seen.set(sig.id, sig);
    }
  }

  return Array.from(seen.values()).sort((a, b) => {
    const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
    if (timeA && timeB) return timeB - timeA;
    return b.id.localeCompare(a.id);
  });
}

// ================= EVENT BUS DEFINITIONS =================

export type SignatureEventPayloads = {
  SIGNATURES_SYNCED: {
    profileId: string;
    signatures: WallComment[];
    addedCount: number;
    updatedCount: number;
    source: string;
    timestamp: number;
  };
  SIGNATURE_POSTED: {
    signature: WallComment;
    profileId: string;
    timestamp: number;
  };
  SIGNATURE_DELETED: {
    signatureId: string;
    profileId: string;
    timestamp: number;
  };
  SIGNATURE_REQUEST_SYNC: {
    profileId?: string;
    source: string;
    timestamp: number;
  };
  SIGNATURE_STATUS_CHANGE: {
    isSyncing: boolean;
    profileId?: string;
    error?: string;
    timestamp: number;
  };
};

export type SignatureEventType = keyof SignatureEventPayloads;
export type SignatureEventListener<T extends SignatureEventType> = (data: SignatureEventPayloads[T]) => void;

class ProfileSignatureEventBus {
  private listeners: { [K in SignatureEventType]?: Set<SignatureEventListener<K>> } = {};
  private broadcastChannel: BroadcastChannel | null = null;
  private isSyncing = false;

  constructor() {
    if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
      try {
        this.broadcastChannel = new BroadcastChannel('inkorium_signature_event_bus');
        this.broadcastChannel.onmessage = (event) => {
          if (event.data && event.data.type && event.data.payload) {
            this.dispatchLocal(event.data.type, event.data.payload, false);
          }
        };
      } catch (e) {
        console.warn('[SignatureEventBus] BroadcastChannel not supported:', e);
      }
    }
  }

  /**
   * Subscribe to a specific signature event
   */
  public on<T extends SignatureEventType>(event: T, listener: SignatureEventListener<T>): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = new Set() as any;
    }
    const set = this.listeners[event] as Set<SignatureEventListener<T>>;
    set.add(listener);

    return () => {
      set.delete(listener);
    };
  }

  /**
   * Emit an event locally, to window CustomEvents, and cross-tab via BroadcastChannel
   */
  public emit<T extends SignatureEventType>(event: T, payload: SignatureEventPayloads[T]): void {
    this.dispatchLocal(event, payload, true);
  }

  private dispatchLocal<T extends SignatureEventType>(event: T, payload: SignatureEventPayloads[T], broadcast: boolean): void {
    const set = this.listeners[event];
    if (set) {
      for (const listener of set) {
        try {
          listener(payload as any);
        } catch (err) {
          console.error(`[SignatureEventBus] Error in listener for ${event}:`, err);
        }
      }
    }

    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(
          new CustomEvent('inkorium:signature_bus_event', {
            detail: { type: event, payload }
          })
        );
      } catch {}
    }

    if (broadcast && this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({ type: event, payload });
      } catch {}
    }
  }

  /**
   * Trigger a sync request for a specific profile (or global)
   */
  public requestSync(profileId?: string, source = 'ui_request'): void {
    this.emit('SIGNATURE_REQUEST_SYNC', {
      profileId,
      source,
      timestamp: Date.now()
    });
  }

  /**
   * Notifies all components that cloud synchronization completed successfully
   */
  public notifySignaturesSynced(
    profileId: string,
    signatures: WallComment[],
    addedCount = 0,
    updatedCount = 0,
    source = 'cloud_sync'
  ): void {
    this.emit('SIGNATURES_SYNCED', {
      profileId,
      signatures,
      addedCount,
      updatedCount,
      source,
      timestamp: Date.now()
    });
  }

  /**
   * Notifies all components that a signature was newly created
   */
  public notifySignaturePosted(signature: WallComment): void {
    const profileId = signature.receptorId || signature.propietarioId || signature.profile_id || '';
    this.emit('SIGNATURE_POSTED', {
      signature,
      profileId,
      timestamp: Date.now()
    });
  }

  /**
   * Notifies all components that a signature was deleted
   */
  public notifySignatureDeleted(signatureId: string, profileId: string): void {
    this.emit('SIGNATURE_DELETED', {
      signatureId,
      profileId,
      timestamp: Date.now()
    });
  }

  /**
   * Update sync progress status
   */
  public notifyStatus(isSyncing: boolean, profileId?: string, error?: string): void {
    this.isSyncing = isSyncing;
    this.emit('SIGNATURE_STATUS_CHANGE', {
      isSyncing,
      profileId,
      error,
      timestamp: Date.now()
    });
  }

  public getSyncingStatus(): boolean {
    return this.isSyncing;
  }
}

export const signatureEventBus = new ProfileSignatureEventBus();
