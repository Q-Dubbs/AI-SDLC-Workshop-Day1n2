'use client';

import { useCallback, useState } from 'react';

export function useNotifications() {
  const [isEnabled, setIsEnabled] = useState(false);

  const requestPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }

    const permission = await Notification.requestPermission();
    const enabled = permission === 'granted';
    setIsEnabled(enabled);
    return enabled;
  }, []);

  return { isEnabled, requestPermission };
}
