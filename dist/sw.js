self.addEventListener('install', event => {
  console.log('Service Worker installing.');
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('Service Worker activating.');
  event.waitUntil(clients.claim());
});

self.addEventListener('push', event => {
  event.waitUntil((async () => {
    const defaultPayload = {
      title: 'Task Reminder',
      body: 'You have a notification',
      url: '/'
    };

    let data = { ...defaultPayload };

    if (event.data) {
      // PushMessageData.json() can reject if payload is not valid JSON.
      // Use await + try/catch so we can handle plain text payloads too.
      try {
        data = await event.data.json();
      } catch (e) {
        try {
          const text = await event.data.text();
          data.body = String(text);
        } catch {
          // fallback to default body
        }
      }
    }

    const options = {
      body: data.body,
      icon: '/favicon.ico', // Update with your app icon
      badge: '/favicon.ico',
      data: {
        url: data.url || '/' // URL to open when notification is clicked
      },
      tag: 'task-reminder', // Prevent duplicate notifications
      requireInteraction: true
    };

    return self.registration.showNotification(data.title || 'Task Reminder', options);
  })());
});

self.addEventListener('notificationclick', event => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      const url = event.notification.data.url;

      // Check if there's already a window/tab open with the target URL
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }

      // If no suitable window is found, open a new one
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
  console.log("NEW SW ACTIVE 🚀");
});