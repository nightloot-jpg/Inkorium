import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../supabase';

type Payload = any;
type Callback = (payload: Payload) => void;

class RealtimeManager {
  private channels: Map<string, RealtimeChannel> = new Map();
  private listeners: Map<string, Set<Callback>> = new Map();

  /**
   * Generates a stable key for the subscription based on schema, table, and event.
   */
  private getSubscriptionKey(schema: string, table: string, event: string, filter?: string): string {
    return `${schema}:${table}:${event}${filter ? `:${filter}` : ''}`;
  }

  /**
   * Subscribes to a postgres changes event.
   * If a channel for the same configuration already exists, it adds the callback to the listeners.
   * Otherwise, it creates a new channel, sets up the listener, and subscribes.
   */
  public subscribe(
    schema: string,
    table: string,
    event: string,
    callback: Callback,
    filter?: string
  ): void {
    const key = this.getSubscriptionKey(schema, table, event, filter);

    // Initialize the listeners set for this key if it doesn't exist
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }

    const listenersForEvent = this.listeners.get(key)!;
    listenersForEvent.add(callback);

    // If we already have an active channel for this key, no need to create a new one
    if (this.channels.has(key)) {
      return;
    }

    // Create a new channel
    // We use the key as the topic to ensure predictable channel topics as recommended by Supabase
    const channel = supabase.channel(key);

    const filterConfig: any = { event, schema, table };
    if (filter) {
      filterConfig.filter = filter;
    }

    channel
      .on(
        'postgres_changes',
        filterConfig,
        (payload) => {
          // Notify all registered listeners for this event
          const currentListeners = this.listeners.get(key);
          if (currentListeners) {
            currentListeners.forEach((cb) => cb(payload));
          }
        }
      )
      .subscribe();

    this.channels.set(key, channel);
  }

  /**
   * Unsubscribes a callback from a postgres changes event.
   * If it's the last callback for that configuration, it removes the channel from Supabase.
   */
  public unsubscribe(
    schema: string,
    table: string,
    event: string,
    callback: Callback,
    filter?: string
  ): void {
    const key = this.getSubscriptionKey(schema, table, event, filter);
    const listenersForEvent = this.listeners.get(key);

    if (listenersForEvent) {
      listenersForEvent.delete(callback);

      // If no more listeners for this event, remove the channel completely
      if (listenersForEvent.size === 0) {
        this.listeners.delete(key);

        const channel = this.channels.get(key);
        if (channel) {
          supabase.removeChannel(channel);
          this.channels.delete(key);
        }
      }
    }
  }
}

// Export a singleton instance
export const realtimeManager = new RealtimeManager();
