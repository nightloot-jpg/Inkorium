import { useEffect, useRef } from 'react';
import { realtimeManager } from './realtime-manager';

export interface UseRealtimeOptions {
  schema?: string;
  table: string;
  event?: '*' | 'INSERT' | 'UPDATE' | 'DELETE';
  filter?: string;
  onEvent: (payload: any) => void;
}

/**
 * Hook to subscribe to Supabase Realtime postgres_changes.
 * It manages the lifecycle safely and prevents issues with React Strict Mode
 * by using a central RealtimeManager singleton.
 */
export const useRealtime = ({
  schema = 'public',
  table,
  event = '*',
  filter,
  onEvent,
}: UseRealtimeOptions) => {
  // Use a ref to keep track of the latest callback without triggering effect re-runs
  // if the callback reference changes.
  const savedCallback = useRef(onEvent);

  useEffect(() => {
    savedCallback.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    // The actual callback that the manager will call
    const eventHandler = (payload: any) => {
      if (savedCallback.current) {
        savedCallback.current(payload);
      }
    };

    realtimeManager.subscribe(schema, table, event, eventHandler, filter);

    // Cleanup function
    return () => {
      realtimeManager.unsubscribe(schema, table, event, eventHandler, filter);
    };
  }, [schema, table, event, filter]); // We don't include onEvent to avoid re-subscribing
};
