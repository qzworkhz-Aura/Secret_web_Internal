const CACHE_NAME = 'manga-cache-v1';

// Install — gak perlu pre-cache, biar on-demand aja
self.addEventListener('install', (event) => {
    self.skipWaiting(); // langsung aktif
});

self.addEventListener('activate', (event) => {
    // Hapus cache lama kalau ada update versi
    event.waitUntil(
        caches.keys().then((names) => {
            return Promise.all(
                names
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        })
    );
    self.clients.claim(); // ambil kontrol semua tab
});

// Fetch — cache-first untuk gambar, network-first untuk sisanya
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Cuma cache file gambar (jpg, png, webp, gif)
    if (/\.(jpg|jpeg|png|webp|gif)$/i.test(url.pathname)) {
        event.respondWith(
            caches.open(CACHE_NAME).then((cache) => {
                return cache.match(event.request).then((cached) => {
                    if (cached) return cached; // ✅ Ada di cache, serve langsung

                    return fetch(event.request).then((response) => {
                        // Clone response karena body cuma bisa dibaca sekali
                        cache.put(event.request, response.clone());
                        return response;
                    });
                });
            })
        );
    }
    // File lain (HTML, JS, CSS) — langsung ke network seperti biasa
});
