import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card';

function useSSE(url: string) {
  const [data, setData] = useState<any>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(url);
      eventSource.onopen = () => setConnected(true);
      eventSource.onerror = () => setConnected(false);
      eventSource.onmessage = (e) => {
        try {
          setData(JSON.parse(e.data));
        } catch {
          setData(e.data);
        }
      };
    } catch {
      setConnected(false);
    }
    return () => {
      eventSource?.close();
    };
  }, [url]);

  return { data, connected };
}

interface SignalEvent {
  id: string;
  timestamp: string;
  type: string;
  payload: any;
}

export const SignalFeed: React.FC = () => {
  const sseUrl = import.meta.env.VITE_SSE_URL || 'http://localhost:8089';
  const { data, connected } = useSSE(sseUrl);
  const [events, setEvents] = useState<SignalEvent[]>([]);
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (data) {
      setEvents((prev) => {
        const newEvent = {
          id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
          timestamp: new Date().toISOString(),
          type: data.type || (typeof data === 'object' && Object.keys(data)[0]) || 'signal_event',
          payload: data.payload || data,
        };
        return [newEvent, ...prev].slice(0, 50);
      });
    }
  }, [data]);

  return (
    <Card className="flex flex-col h-full bg-white shadow-sm border border-slate-200/90 rounded-2xl overflow-hidden p-0">
      <CardHeader className="flex items-center justify-between p-5 border-b border-slate-100 mb-0 bg-slate-50/60">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-bold text-slate-800 tracking-tight">Live Signal Stream</CardTitle>
          <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
            SSE Realtime
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <span className="relative flex h-2.5 w-2.5">
            {connected && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${connected ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
          </span>
          <span className={connected ? 'text-emerald-700 font-semibold' : 'text-rose-600'}>
            {connected ? 'Live Feed Connected' : 'Connecting to :8089...'}
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-4 overflow-y-auto max-h-[380px]" ref={feedRef}>
        <div className="flex flex-col gap-2.5">
          {events.length === 0 && (
            <div className="text-center text-slate-400 py-12 flex flex-col items-center justify-center gap-2">
              <div className="w-8 h-8 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin"></div>
              <p className="text-xs">Listening for incoming Telegram/WhatsApp signals...</p>
            </div>
          )}
          {events.map((event) => (
            <div
              key={event.id}
              className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:bg-slate-100/60 transition-colors text-xs"
            >
              <div className="flex justify-between items-center mb-1.5">
                <span className="font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md text-[11px]">
                  {event.type}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <pre className="text-slate-700 whitespace-pre-wrap font-mono text-[11px] overflow-x-auto bg-white p-2 rounded-lg border border-slate-200/60">
                {typeof event.payload === 'string' ? event.payload : JSON.stringify(event.payload, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SignalFeed;
