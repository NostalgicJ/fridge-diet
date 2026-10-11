// Gemini 호출 공용 함수. 파일 이름이 _ 로 시작해서 Vercel이 API 경로로 만들지 않아요.

export class GeminiError extends Error {
  constructor(code) { super(code); this.code = code; }
}

// 프롬프트를 보내고 응답 JSON 객체를 돌려줘요. 실패하면 GeminiError(code)를 던져요.
export async function askGeminiJson(prompt, maxOutputTokens = 8000) {
  const model = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", maxOutputTokens },
      }),
    }
  );
  if (r.status === 429) throw new GeminiError("rate_limited");
  if (!r.ok) throw new GeminiError("upstream");

  try {
    const data = await r.json();
    const parts = data?.candidates?.[0]?.content?.parts || [];
    const text = parts.map(p => p.text || "").join("").replace(/```json|```/g, "").trim();
    return JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
  } catch {
    throw new GeminiError("bad_shape");
  }
}

// Vercel이 body를 문자열로 줄 때도 객체로 바꿔요.
export function readBody(req) {
  let raw = req.body;
  if (typeof raw === "string") { try { raw = JSON.parse(raw); } catch { raw = {}; } }
  return raw || {};
}
