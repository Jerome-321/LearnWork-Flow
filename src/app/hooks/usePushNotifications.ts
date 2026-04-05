import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}

export function usePushNotifications() {
  const { getAccessToken } = useAuth();

  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [vapidPublicKey, setVapidPublicKey] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [subscriptionChecked, setSubscriptionChecked] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || "/api";

  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);

    if (!supported) return;

    navigator.serviceWorker.register('/sw.js')
      .then(async () => {
        console.log('✅ SW registered');
        await checkSubscriptionStatus();
      });

    const token = getAccessToken();
    if (token) {
      fetch(`${API_URL}/notifications/vapid-public-key/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setVapidPublicKey(data.public_key));
    }

    setPermission(Notification.permission);
  }, []);

  const checkSubscriptionStatus = async () => {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    setIsSubscribed(!!sub);
    setSubscriptionChecked(true);
    return !!sub;
  };

  const requestNotificationPermission = async () => {
    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  };

  const subscribe = async () => {
    console.log('[PUSH] ========== SUBSCRIBE START ==========');
    setIsLoading(true);
    try {
      console.log('[PUSH] Requesting permission...');
      const perm = await requestNotificationPermission();
      console.log('[PUSH] Permission result:', perm);
      if (perm !== 'granted') throw new Error('Permission denied');

      console.log('[PUSH] Getting service worker registration...');
      const reg = await navigator.serviceWorker.ready;
      console.log('[PUSH] Service worker ready');
      
      let sub = await reg.pushManager.getSubscription();
      console.log('[PUSH] Existing subscription:', !!sub);

      if (!sub) {
        console.log('[PUSH] Creating new subscription...');
        console.log('[PUSH] VAPID key:', vapidPublicKey?.substring(0, 50) + '...');
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
        });
        console.log('[PUSH] Subscription created:', sub.endpoint.substring(0, 50) + '...');
      }

      const token = getAccessToken();
      console.log('[PUSH] Token exists:', !!token);
      
      const subscriptionData = { subscription: sub.toJSON() };
      console.log('[PUSH] Sending to backend:', subscriptionData);

      const response = await fetch(`${API_URL}/notifications/subscribe/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(subscriptionData)
      });

      console.log('[PUSH] Backend response status:', response.status);
      const responseData = await response.json();
      console.log('[PUSH] Backend response data:', responseData);

      if (!response.ok) {
        throw new Error('Backend subscription failed');
      }

      await new Promise(r => setTimeout(r, 300));
      await checkSubscriptionStatus();
      console.log('[PUSH] ========== SUBSCRIBE SUCCESS ==========');

      return sub;

    } catch (error) {
      console.error('[PUSH] ========== SUBSCRIBE FAILED ==========');
      console.error('[PUSH] Error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async () => {
    setIsLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();

      if (sub) {
        await sub.unsubscribe();

        await fetch(`${API_URL}/notifications/unsubscribe/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getAccessToken()}`
          },
          body: JSON.stringify({ endpoint: sub.endpoint })
        });
      }

      await checkSubscriptionStatus();
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isSubscribed,
    isLoading,
    permission,
    isSupported,
    subscriptionChecked,
    subscribe,
    unsubscribe,
    requestNotificationPermission,
    checkSubscriptionStatus
  };
}