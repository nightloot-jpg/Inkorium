export type RealtimeStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

export interface RealtimeManagerOptions {
  userId: string;
  initialDelayMs?: number;
  maxDelayMs?: number;
  factor?: number;
  jitterMs?: number;
  maxRetries?: number;
  onChatMessage?: (msg: any) => void;
  onPrivateMessage?: (msg: any) => void;
  onChatTyping?: (data: any) => void;
  onChatNudge?: (data: any) => void;
  onChatRead?: (data: { readerId: string; senderId: string; messageIds: string[]; readAt: number; readDate: string }) => void;
  onNotification?: (notif: any) => void;
  onWallComment?: (comment: any) => void;
  onWallCommentDelete?: (data: { id: string; profile_id?: string }) => void;
  onStatusChange?: (status: RealtimeStatus, details?: { attempt: number; nextRetryMs?: number }) => void;
}

export class RealtimeManager {
  private userId: string;
  private initialDelayMs: number;
  private maxDelayMs: number;
  private factor: number;
  private jitterMs: number;
  private maxRetries: number;

  private onChatMessage?: (msg: any) => void;
  private onPrivateMessage?: (msg: any) => void;
  private onChatTyping?: (data: any) => void;
  private onChatNudge?: (data: any) => void;
  private onChatRead?: (data: { readerId: string; senderId: string; messageIds: string[]; readAt: number; readDate: string }) => void;
  private onNotification?: (notif: any) => void;
  private onWallComment?: (comment: any) => void;
  private onWallCommentDelete?: (data: { id: string; profile_id?: string }) => void;
  private onStatusChange?: (status: RealtimeStatus, details?: { attempt: number; nextRetryMs?: number }) => void;

  private eventSource: EventSource | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private retryCount = 0;
  private isExplicitlyClosed = false;
  private status: RealtimeStatus = 'disconnected';

  constructor(options: RealtimeManagerOptions) {
    this.userId = options.userId;
    this.initialDelayMs = options.initialDelayMs ?? 1000;
    this.maxDelayMs = options.maxDelayMs ?? 30000;
    this.factor = options.factor ?? 2;
    this.jitterMs = options.jitterMs ?? 1000;
    this.maxRetries = options.maxRetries ?? 20;

    this.onChatMessage = options.onChatMessage;
    this.onPrivateMessage = options.onPrivateMessage;
    this.onChatTyping = options.onChatTyping;
    this.onChatNudge = options.onChatNudge;
    this.onChatRead = options.onChatRead;
    this.onNotification = options.onNotification;
    this.onWallComment = options.onWallComment;
    this.onWallCommentDelete = options.onWallCommentDelete;
    this.onStatusChange = options.onStatusChange;
  }

  public connect(): void {
    if (typeof window === 'undefined' || !this.userId) return;
    this.isExplicitlyClosed = false;
    this.cleanupTimer();
    this.cleanupConnection();

    this.updateStatus(this.retryCount > 0 ? 'reconnecting' : 'connecting');

    try {
      const url = `/api/realtime/stream?userId=${encodeURIComponent(this.userId)}`;
      const es = new EventSource(url);
      this.eventSource = es;

      es.onopen = () => {
        if (this.isExplicitlyClosed) {
          es.close();
          return;
        }
        this.retryCount = 0;
        this.updateStatus('connected');
      };

      es.addEventListener('init', () => {
        this.retryCount = 0;
        this.updateStatus('connected');
      });

      es.addEventListener('chat_message', (e) => {
        this.retryCount = 0;
        if (this.status !== 'connected') this.updateStatus('connected');
        try {
          const data = JSON.parse(e.data);
          this.onChatMessage?.(data);
        } catch (err) {
          console.warn('Realtime chat_message parse error:', err);
        }
      });

      es.addEventListener('private_message', (e) => {
        this.retryCount = 0;
        if (this.status !== 'connected') this.updateStatus('connected');
        try {
          const data = JSON.parse(e.data);
          this.onPrivateMessage?.(data);
        } catch (err) {
          console.warn('Realtime private_message parse error:', err);
        }
      });

      es.addEventListener('chat_typing', (e) => {
        try {
          const data = JSON.parse(e.data);
          this.onChatTyping?.(data);
        } catch (err) {
          console.warn('Realtime chat_typing parse error:', err);
        }
      });

      es.addEventListener('chat_nudge', (e) => {
        try {
          const data = JSON.parse(e.data);
          this.onChatNudge?.(data);
        } catch (err) {
          console.warn('Realtime chat_nudge parse error:', err);
        }
      });

      es.addEventListener('chat_read', (e) => {
        try {
          const data = JSON.parse(e.data);
          this.onChatRead?.(data);
        } catch (err) {
          console.warn('Realtime chat_read parse error:', err);
        }
      });

      es.addEventListener('notification', (e) => {
        this.retryCount = 0;
        if (this.status !== 'connected') this.updateStatus('connected');
        try {
          const data = JSON.parse(e.data);
          this.onNotification?.(data);
        } catch (err) {
          console.warn('Realtime notification parse error:', err);
        }
      });

      es.addEventListener('wall_comment', (e) => {
        this.retryCount = 0;
        if (this.status !== 'connected') this.updateStatus('connected');
        try {
          const data = JSON.parse(e.data);
          console.log('[Realtime SSE Stream] Received "wall_comment" event:', {
            id: data?.id,
            profile_id: data?.profile_id || data?.propietarioId || data?.receptorId,
            author_id: data?.author_id || data?.autorId || data?.emisorId,
            author_name: data?.author_name || data?.autorNombre,
            content_snippet: String(data?.content || data?.texto || '').slice(0, 50),
            timestamp: new Date().toISOString()
          });
          this.onWallComment?.(data);
        } catch (err) {
          console.warn('Realtime wall_comment parse error:', err);
        }
      });

      es.addEventListener('wall_comment_delete', (e) => {
        try {
          const data = JSON.parse(e.data);
          console.log('[Realtime SSE Stream] Received "wall_comment_delete" event:', {
            id: data?.id,
            profile_id: data?.profile_id,
            timestamp: new Date().toISOString()
          });
          this.onWallCommentDelete?.(data);
        } catch (err) {
          console.warn('Realtime wall_comment_delete parse error:', err);
        }
      });

      es.onerror = () => {
        if (this.isExplicitlyClosed) return;
        // Explicitly close EventSource to suppress unthrottled browser rapid-reconnect loops
        this.cleanupConnection();
        this.scheduleReconnect();
      };
    } catch (err) {
      console.warn('Realtime connection instantiation failed:', err);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.isExplicitlyClosed) return;

    this.retryCount++;
    if (this.retryCount > this.maxRetries) {
      console.warn(`Realtime reached max retries (${this.maxRetries}). Backing off to max delay.`);
    }

    // Calculate Exponential Backoff with Jitter: delay = min(maxDelay, initialDelay * factor^retry) + random(0, jitter)
    const exponentialDelay = this.initialDelayMs * Math.pow(this.factor, Math.min(this.retryCount - 1, 8));
    const cappedDelay = Math.min(this.maxDelayMs, exponentialDelay);
    const jitter = Math.floor(Math.random() * this.jitterMs);
    const totalDelay = cappedDelay + jitter;

    this.updateStatus('reconnecting', { attempt: this.retryCount, nextRetryMs: totalDelay });

    this.cleanupTimer();
    this.reconnectTimer = setTimeout(() => {
      if (!this.isExplicitlyClosed) {
        this.connect();
      }
    }, totalDelay);
  }

  private cleanupConnection(): void {
    if (this.eventSource) {
      try {
        this.eventSource.close();
      } catch {}
      this.eventSource = null;
    }
  }

  private cleanupTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private updateStatus(newStatus: RealtimeStatus, details?: { attempt: number; nextRetryMs?: number }): void {
    this.status = newStatus;
    this.onStatusChange?.(newStatus, details || { attempt: this.retryCount });
  }

  public disconnect(): void {
    this.isExplicitlyClosed = true;
    this.cleanupTimer();
    this.cleanupConnection();
    this.retryCount = 0;
    this.updateStatus('disconnected');
  }

  public getStatus(): RealtimeStatus {
    return this.status;
  }
}
