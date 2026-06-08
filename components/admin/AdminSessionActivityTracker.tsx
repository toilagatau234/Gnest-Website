'use client';

import { useEffect, useRef } from 'react';

const ACTIVITY_PING_INTERVAL_MS = 60 * 1000;
const SESSION_ACTIVITY_ENDPOINT = '/admin/session-activity';

export function AdminSessionActivityTracker() {
  const lastPingAtRef = useRef(0);

  useEffect(() => {
    function pingActivity(force = false) {
      const now = Date.now();

      if (!force && now - lastPingAtRef.current < ACTIVITY_PING_INTERVAL_MS) {
        return;
      }

      lastPingAtRef.current = now;

      void fetch(SESSION_ACTIVITY_ENDPOINT, {
        method: 'POST',
        credentials: 'same-origin',
        keepalive: true,
      }).catch(() => {
        // Ignore activity sync failures; middleware still enforces timeout server-side.
      });
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        pingActivity(true);
      }
    }

    const handleActivity = () => {
      pingActivity(false);
    };

    document.addEventListener('click', handleActivity, { passive: true });
    document.addEventListener('keydown', handleActivity);
    document.addEventListener('pointermove', handleActivity, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('click', handleActivity);
      document.removeEventListener('keydown', handleActivity);
      document.removeEventListener('pointermove', handleActivity);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return null;
}
