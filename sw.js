/* Service Worker — Minna Vocab PWA
 * CƠ CHẾ CẬP NHẬT:
 *  - Chỉ đổi nội dung app (từ vựng, tính năng): chỉ cần thay index.html trên host.
 *    Chiến lược network-first sẽ tự lấy bản mới, KHÔNG cần đổi gì trong file này.
 *  - Đổi icon / manifest: tăng CACHE 'v1' -> 'v2' để xoá cache cũ.
 */
const CACHE = 'minna-vocab-v1';
const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // Điều hướng (mở app): ưu tiên mạng để luôn có bản mới; mất mạng -> dùng cache (offline)
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(res => {
        const c1 = res.clone(), c2 = res.clone();
        caches.open(CACHE).then(c => { c.put('./index.html', c1); c.put(req, c2); });
        return res;
      }).catch(() => caches.match('./index.html').then(r => r || caches.match('./')))
    );
    return;
  }

  // Tài nguyên tĩnh cùng origin: cache-first
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok && new URL(req.url).origin === location.origin) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
