const CACHE_NAME = "suite-ejecutiva-v1";
const OFFLINE_URL = "offline.html";

// Archivos principales a cachear
const ASSETS_TO_CACHE = [
  "/",
  "index.html",
  "offline.html",
  "favicon-16x16.png",
  "favicon-32x32.png",
  "apple-touch-icon.png",
  "android-chrome-192x192.png",
  "android-chrome-512x512.png",
  "site.webmanifest",
  "browserconfig.xml",
  "videos/animacion-logo-qk-original.mp4",
  "videos/animacion-insight-mercado.mp4",
  "videos/animacion-nuevo-logo-3d.mp4",
  "videos/animacion-papeleria-merchandising-packaging.mp4",
  "videos/animacion-ecosistema-digital.mp4",
  "videos/animacion-srm-qk-k.mp4"
];

// 🧩 INSTALACIÓN — cachea los recursos esenciales
self.addEventListener("install", (event) => {
  console.log("📦 Instalando Service Worker...");
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// ♻️ ACTIVACIÓN — limpia versiones antiguas
self.addEventListener("activate", (event) => {
  console.log("🔁 Activando nuevo Service Worker...");
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("🗑️ Eliminando caché vieja:", key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// 🌐 FETCH — modo inteligente: red > caché > offline
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Si hay conexión, actualiza el caché
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => cached || caches.match(OFFLINE_URL))
      )
  );
});
