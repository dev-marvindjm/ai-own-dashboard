import { useState, useEffect, useRef, useCallback } from 'react';

const SSE_URL = import.meta.env.VITE_SSE_URL || 'http://localhost:8089';

export interface SSEEvent {
  id: string;
  type: string;
  data: any;
  timestamp: string;
}

export function useSSE(endpoint: string = '/events') {
  const [events, setEvents] = useState<SSEEvent[]>([]);
  const [lastEvent, setLastEvent] = useState<SSEEvent | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const retryCountRef = useRef<number>(0);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const url = `${SSE_URL}${endpoint}`;
    const es = new EventSource(url, { withCredentials: true });

    es.onopen = () => {
      setIsConnected(true);
      retryCountRef.current = 0;
    };

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const newEvent: SSEEvent = {
          id: event.lastEventId || Date.now().toString(),
          type: event.type || 'message',
          data,
          timestamp: new Date().toISOString(),
        };

        setLastEvent(newEvent);
        setEvents((prev) => {
          const updated = [newEvent, ...prev];
          return updated.slice(0, 50); // Keep max 50 events
        });
      } catch (e) {
        console.error('Error parsing SSE message:', e);
      }
    };

    es.onerror = () => {
      setIsConnected(false);
      es.close();

      // Exponential backoff
      const timeout = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
      retryCountRef.current += 1;

      reconnectTimeoutRef.current = window.setTimeout(connect, timeout);
    };

    eventSourceRef.current = es;
  }, [endpoint]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [connect]);

  return { events, lastEvent, isConnected };
}
