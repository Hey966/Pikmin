const APP_VERSION = "1.0.16";
const CACHE_NAME = "pikmin-flower-notes-v16";

const APP_ASSETS = [
  "./",
  "./index.html",
  "./version.json",
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
  "./js/init.js",
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

self.addEventListener("message", function(event) {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

function shouldUseNetworkFirst(request) {
  var url = new URL(request.url);
  return request.mode === "navigate" || url.origin === self.location.origin;
}

function putInCache(request, response) {
  if (!response || response.status !== 200 || response.type === "opaque") {
    return response;
  }

  var copy = response.clone();
  caches.open(CACHE_NAME).then(function(cache) {
    cache.put(request, copy);
  });

  return response;
}

function readFromCache(request) {
  return caches.match(request, { ignoreSearch: true }).then(function(cachedResponse) {
    if (cachedResponse) return cachedResponse;
    if (request.mode === "navigate") return caches.match("./index.html", { ignoreSearch: true });
    return null;
  });
}

self.addEventListener("fetch", function(event) {
  if (event.request.method !== "GET") return;
  if (!shouldUseNetworkFirst(event.request)) return;

  event.respondWith(
    fetch(event.request)
      .then(function(networkResponse) {
        return putInCache(event.request, networkResponse);
      })
      .catch(function() {
        return readFromCache(event.request);
      })
  );
});
