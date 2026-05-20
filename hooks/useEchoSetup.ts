import { useEffect } from 'react';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

export function useEchoSetup() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Skip if already initialized
    if ((window as any).Echo) return;

    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap3';

    if (!pusherKey) {
      console.warn('Pusher key not configured');
      return;
    }

    try {
      (window as any).Pusher = Pusher;

      (window as any).Echo = new Echo({
        broadcaster: 'pusher',
        key: pusherKey,
        cluster: pusherCluster,
        encrypted: true,
      });
    } catch (error) {
      console.error('Failed to initialize Laravel Echo:', error);
    }
  }, []);
}
