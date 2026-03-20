self.addEventListener('install', event => {
  console.log('Service Worker installing.');
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('Service Worker activating.');
  event.waitUntil(clients.claim());
});

self.addEventListener('push', event => {
  console.log('[SW] Push event received');
  
  event.waitUntil((async () => {
    const defaultPayload = {
      title: 'Task Reminder',
      body: 'You have a notification',
      url: '/'
    };

    let data = { ...defaultPayload };

    if (event.data) {
      console.log('[SW] Push event has data');
      try {
        data = await event.data.json();
        console.log('[SW] Parsed push data:', data);
      } catch (e) {
        console.log('[SW] Failed to parse as JSON, trying text');
        try {
          const text = await event.data.text();
          data.body = String(text);
          console.log('[SW] Parsed as text:', text);
        } catch {
          console.log('[SW] Failed to parse push data, using default');
        }
      }
    } else {
      console.log('[SW] Push event has no data, using default');
    }

    const options = {
      body: data.body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: {
        url: data.url || '/'
      },
      tag: 'task-reminder',
      requireInteraction: true
    };

    console.log('[SW] Showing notification:', data.title, options);
    return self.registration.showNotification(data.title || 'Task Reminder', options);
  })());
});

self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification clicked:', event.notification.tag);
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      const url = event.notification.data.url;
      console.log('[SW] Opening URL:', url);

      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === url && 'focus' in client) {
          console.log('[SW] Focusing existing window');
          return client.focus();
        }
      }

      if (clients.openWindow) {
        console.log('[SW] Opening new window');
        return clients.openWindow(url);
      }
    })
  );
});