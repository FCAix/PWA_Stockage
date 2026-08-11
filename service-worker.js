const CACHE_NAME = "pwa-stockage-v9";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./materiel.html",
  "./mouvements.html",
  "./tonnelles.html",
  "./reservation-tonnelles.html",
  "./agenda-tonnelles.html",
  "./minibus.html",
  "./reservationMinibus.html",
  "./agendaminibus.html",
  "./styles.css",
  "./manifest.webmanifest",
  "./js/app.js",
  "./js/navigation.js",
  "./js/bodega.js",
  "./js/materiel.js",
  "./js/tonelles.js",
  "./js/minibus.js",
  "./js/mouvement.js",
  "./js/mouvementStock.js",
  "./js/insertarMaterial.js",
  "./js/reservationTonnelles.js",
  "./js/agendaTonnelles.js",
  "./js/reservationMinibus.js",
  "./js/agendaMinibus.js",
  "./icons/icon-192.svg",
  "./icons/icon-512.svg",
  "./icons/navigation/bodega.svg",
  "./icons/navigation/materiel.svg",
  "./icons/navigation/tonnelles.svg",
  "./icons/navigation/minibus.svg"
];

const OFFLINE_PAGE = new URL(
  "./index.html",
  self.registration.scope
).href;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.allSettled(
        FILES_TO_CACHE.map((file) => cache.add(file))
      );
    })
  );

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );

  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const requestUrl = new URL(request.url);

  if (request.method !== "GET") {
    return;
  }

  if (
    requestUrl.hostname.includes("supabase.co") ||
    requestUrl.hostname.includes("supabase.com")
  ) {
    return;
  }

  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse.ok) {
          const responseCopy = networkResponse.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseCopy);
          });
        }

        return networkResponse;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(request);

        if (cachedResponse) {
          return cachedResponse;
        }

        if (request.mode === "navigate") {
          return caches.match(OFFLINE_PAGE);
        }

        return Response.error();
      })
  );
});
