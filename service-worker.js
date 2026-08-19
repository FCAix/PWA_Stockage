const CACHE_NAME =
    "pwa-stockage-v18.5";

const FILES_TO_CACHE = [

    "./",

    "./index.html",
    "./accueil.html",

    "./login.html",
    "./registrer.html",

    "./materiel.html",
    "./materiel2.html",
    "./minibus.html",
    "./tonnelles.html",
    "./mouvements.html",

    "./reservation.html",
    "./agenda.html",
    "./mesDemandes.html",
    "./adminReservations.html",

    "./styles.css",
    "./manifest.webmanifest",

    "./js/app.js",
    "./js/supabase.js",
    "./js/authGuard.js",
    "./js/navigation.js",

    "./js/reservationsConfig.js",
    "./js/reservation.js",
    "./js/agendaReservations.js",
    "./js/mesDemandes.js",
    "./js/demandesAdmin.js",

    "./js/bodega.js",
    "./js/materiel.js",
    "./js/minibus.js",
    "./js/tonelles.js",
    "./js/mouvement.js",
    "./js/mouvementStock.js",
    "./js/insertarMaterial.js",

    "./icons/icon-192.svg",
    "./icons/icon-512.svg",

    "./icons/navigation/bodega.svg",
    "./icons/navigation/materiel.svg",
    "./icons/navigation/tonnelles.svg",
    "./icons/navigation/minibus.svg",
    "./icons/navigation/reservations.svg",
    "./icons/navigation/agenda.svg",
    "./icons/navigation/demandes.svg"

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
