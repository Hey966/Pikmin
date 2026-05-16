const CACHE_NAME = "pikmin-flower-notes-v14";

const APP_ASSETS = [
  "./",
  "./index.html",
  "./css/style.css",
  "./css/map.css",
  "./css/route-plans.css",
  "./css/help.css",
  "./css/stats.css",
  "./css/install.css",
  "./js/globals.js",
  "./js/geo.js",
  "./js/records-state.js",
  "./data/taiwan-districts-a.js",
  "./data/taiwan-districts-b.js",
  "./js/records-core.js",
  "./js/records-view.js",
  "./js/backup.js",
  "./js/route.js",
  "./js/route-plans.js",
  "./js/map.js",
  "./js/stats.js",
  "./js/help.js",
  "./js/pwa.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", function(event) {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(APP_ASSETS);
    })
  );
});

self.addEventListener("activate", function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.map(function(key) {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }

          return null;
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function(event) {
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(function(cachedResponse) {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then(function(networkResponse) {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === "opaque") {
          return networkResponse;
        }

        var responseClone = networkResponse.clone();

        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, responseClone);
        });

        return networkResponse;
      }).catch(function() {
        if (event.request.mode === "navigate") {
          return caches.match("./index.html");
        }

        return null;
      });
    })
  );
});
