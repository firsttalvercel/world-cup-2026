self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const title = data.title ?? "World Cup 2026";
  const options = {
    body: data.body ?? "",
    icon: "/favicon.png",
    badge: "/favicon.png",
    tag: data.tag ?? "wc2026",
    data: { url: data.url ?? "/matches" },
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/matches";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
