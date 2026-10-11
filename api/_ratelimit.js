// 사람(IP)당 하루 요청 횟수 제한. 파일 이름이 _ 로 시작해서 API 경로가 되지 않아요.
// 횟수는 Upstash Redis(REST)에 저장해요. Vercel에서 Upstash를 연결하면 아래 환경변수가 생겨요.
//   KV_REST_API_URL / KV_REST_API_TOKEN  또는  UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
// 환경변수가 없으면(로컬 개발 등) 제한하지 않아요.

import { createHash } from "node:crypto";

const DAY_SECONDS = 60 * 60 * 24;

function redisConfig() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ""), token } : null;
}

function clientIp(req) {
  const fwd = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  return fwd || String(req.headers["x-real-ip"] || "") || req.socket?.remoteAddress || "unknown";
}

// 한국 시간 기준 날짜 (자정에 횟수가 다시 시작돼요)
const todayKst = () => new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);

// 요청 하나를 세고, 한도를 넘었으면 true를 돌려줘요.
// IP는 그대로 저장하지 않고 해시로 바꿔서 키로 써요.
export async function overDailyLimit(req) {
  const redis = redisConfig();
  if (!redis) return false;
  const limit = Number(process.env.RATE_LIMIT_PER_DAY) || 100;
  const ipHash = createHash("sha256").update(clientIp(req)).digest("hex").slice(0, 24);
  const key = `rl:${todayKst()}:${ipHash}`;
  try {
    const r = await fetch(`${redis.url}/pipeline`, {
      method: "POST",
      headers: { authorization: `Bearer ${redis.token}`, "content-type": "application/json" },
      body: JSON.stringify([["INCR", key], ["EXPIRE", key, String(DAY_SECONDS * 2)]]),
    });
    if (!r.ok) return false; // 저장소 문제로 사이트가 멈추지 않게 통과시켜요
    const [incr] = await r.json();
    return Number(incr?.result) > limit;
  } catch {
    return false;
  }
}
