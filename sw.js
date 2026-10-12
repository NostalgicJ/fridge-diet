// 서비스 워커: 인터넷이 없어도 화면이 열리게 해요.
// - 페이지: 인터넷이 되면 항상 새로 받아오고(최신 유지), 안 되면 저장해 둔 걸 보여줘요.
// - 아이콘·글꼴: 저장해 둔 걸 먼저 쓰고 뒤에서 새로 받아둬요.
// - /api/ 요청은 건드리지 않아요 (식단 만들기는 인터넷이 있어야 해요).
// 지난 식단은 localStorage에 있어서 오프라인에서도 그대로 보여요.

const CACHE = "fridge-diet-v1";
const SHELL = ["/", "/manifest.webmanifest", "/apple-touch-icon.png", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin && url.pathname.startsWith("/api/")) return;

  // 페이지: 네트워크 먼저, 안 되면 저장본
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put("/", copy)); return res; })
        .catch(() => caches.match("/"))
    );
    return;
  }

  // 같은 사이트 파일과 구글 글꼴: 저장본 먼저, 뒤에서 새로 받아두기
  const fonts = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (url.origin !== location.origin && !fonts) return;
  event.respondWith(
    caches.open(CACHE).then(async c => {
      const hit = await c.match(req);
      const fresh = fetch(req)
        .then(res => { if (res.ok || res.type === "opaque") c.put(req, res.clone()); return res; })
        .catch(() => hit);
      return hit || fresh;
    })
  );
});
