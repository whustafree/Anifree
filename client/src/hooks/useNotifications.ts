import { useState, useEffect } from 'react';
import { config } from '../store';

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );

  const requestPermission = async (): Promise<boolean> => {
    if (typeof Notification === 'undefined') return false;
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === 'granted') config.set({ notificationsEnabled: true });
    return result === 'granted';
  };

  const isSubscribed = (slug: string) => config.get().notifiedAnimes.includes(slug);

  const toggle = async (slug: string, title: string): Promise<boolean> => {
    if (permission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) return false;
    }
    const subscribed = config.toggleNotification(slug);
    if (subscribed) {
      new Notification('AnimeFree', {
        body: `Te avisaremos cuando salga nuevo episodio de "${title}"`,
        icon: '/icons/icon-192.svg',
      });
    }
    return subscribed;
  };

  return { permission, isSubscribed, toggle, requestPermission };
}
