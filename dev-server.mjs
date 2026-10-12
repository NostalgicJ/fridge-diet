// 로컬 테스트용 서버: npm run dev → http://localhost:3000
// index.html 을 보여주고, /api/plan·/api/sort 는 api/ 폴더의 함수를 Vercel과 같은 방식으로 호출해요.
// API 키는 .env.local 의 GEMINI_API_KEY 에서 읽어요. (배포에는 쓰이지 않아요)

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import plan from "./api/plan.js";
import sort from "./api/sort.js";

const routes = { "/api/plan": plan, "/api/sort": sort };
// 배포 때 Vercel이 그대로 내보내는 정적 파일들
const STATIC = {
  "/apple-touch-icon.png": "image/png",
  "/icon-192.png": "image/png",
  "/icon-512.png": "image/png",
  "/manifest.webmanifest": "application/manifest+json",
  "/sw.js": "text/javascript; charset=utf-8",
};

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const PORT = Number(process.env.PORT) || 3000;

// Vercel의 res.status().json() 을 흉내 내는 최소한의 래퍼
const wrap = (res) => {
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (obj) => {
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.end(JSON.stringify(obj));
    return res;
  };
  return res;
};

createServer(async (req, res) => {
  wrap(res);
  try {
    const handler = routes[req.url.split("?")[0]];
    if (handler) {
      let body = "";
      for await (const chunk of req) body += chunk;
      try { req.body = body ? JSON.parse(body) : {}; } catch { req.body = body; }
      return await handler(req, res);
    }
    const path = req.url.split("?")[0];
    if (STATIC[path]) {
      res.setHeader("content-type", STATIC[path]);
      return res.end(await readFile("." + path));
    }
    if (req.url === "/" || req.url.startsWith("/index.html")) {
      res.setHeader("content-type", "text/html; charset=utf-8");
      return res.end(await readFile("index.html"));
    }
    res.status(404).end("not found");
  } catch (e) {
    console.error(e);
    if (!res.headersSent) res.status(500).json({ error: "dev_server" });
  }
}).listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
  if (!process.env.GEMINI_API_KEY) console.log("⚠ GEMINI_API_KEY 가 없어요. .env.local 에 넣어주세요.");
});
