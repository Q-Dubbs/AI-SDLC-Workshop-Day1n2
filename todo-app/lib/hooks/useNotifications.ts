'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type NotificationTodo = {
  id: number;
  title: string;
  due_date: string | null;
  reminder_minutes: number | null;
};

export function useNotifications(enabledByDefault = false) {
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    if (typeof window === 'undefined' || typeof Notification === 'undefined') {
      return 'default';
    }
    return Notification.permission;
  });
  const [enabled, setEnabled] = useState(() => {
    if (typeof window === 'undefined' || typeof Notification === 'undefined') {
      return enabledByDefault;
    }
    return Notification.permission === 'granted';
  });

  const canNotify = useMemo(() => enabled && permission === 'granted', [enabled, permission]);

  const requestPermission = useCallback(async () => {
    if (typeof window === 'undefined' || typeof Notification === 'undefined') {
      return false;
    }

    const nextPermission = await Notification.requestPermission();
    setPermission(nextPermission);
    const granted = nextPermission === 'granted';
    setEnabled(granted);
    return granted;
  }, []);

  useEffect(() => {
    if (!canNotify) {
      return;
    }

    const interval = window.setInterval(async () => {
      try {
        const response = await fetch('/api/notifications/check');
        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as { notifications?: NotificationTodo[] };
        const todos = Array.isArray(payload.notifications) ? payload.notifications : [];
        for (const todo of todos) {
          new Notification('Todo reminder', {
            body: todo.due_date
              ? `${todo.title} is due at ${new Date(todo.due_date).toLocaleString()}`
              : `${todo.title} is due soon`,
          });
        }
      } catch {
        // Ignore notification polling errors.
      }
    }, 30_000);

    return () => {
      window.clearInterval(interval);
    };
  }, [canNotify]);

  return {
    enabled: canNotify,
    permission,
    requestPermission,
  };
}
