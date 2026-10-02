'use client';

import { useEffect } from 'react';
import { API_URL } from '@/lib/constants';

const VISITOR_KEY = 'otherhalf_visitor_id';

function getVisitorId() {
  let id = window.localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

export function VisitorTracker() {
  useEffect(() => {
    const visitorId = getVisitorId();
    const send = (path: string) => {
      void fetch(`${API_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId }),
        keepalive: true,
      }).catch(() => undefined);
    };
    send('/analytics/visit');
    const interval = window.setInterval(() => send('/analytics/heartbeat'), 30_000);
    return () => window.clearInterval(interval);
  }, []);
  return null;
}