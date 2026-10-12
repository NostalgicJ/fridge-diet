// AI 응답 검사. 파일 이름이 _ 로 시작해서 API 경로가 되지 않아요.
// 프롬프트에서 금지했지만 혹시 섞여 나온 칼로리 숫자, 감량 속도, 하루 그램 섭취 목표를 지워요.
// 레시피 계량("두부 150g")처럼 섭취 목표가 아닌 숫자는 건드리지 않아요.

const BANNED = [
  /칼로리|kcal|킬로\s*칼로리|\d+\s*cal\b/i,                                            // 칼로리
  /\d+(\.\d+)?\s*(kg|킬로그램|킬로)\s*(을|를|이|가)?\s*(감량|빼|뺄|빠지|빠져|줄)/i,         // "3kg 감량"
  /(하루|일주일|한\s*주|주|한\s*달|달|개월)\s*(에|동안|만에|마다)?\s*\d+(\.\d+)?\s*(kg|킬로)/i, // "한 달에 2kg"
  /(하루|매일|매끼|끼니당|한\s*끼에?)\s*[^.!?]{0,12}?\d+\s*(g|그램)\b/i,                    // "하루 단백질 100g"
];

// 괄호로 붙은 칼로리 표기는 문장을 지우지 않고 그 부분만 떼요. 예: "된장국 (120kcal)" → "된장국"
const INLINE_KCAL = /\s*[(\[]\s*(약\s*)?\d+\s*(kcal|칼로리|킬로칼로리)\s*[)\]]/gi;

const isBad = s => BANNED.some(re => re.test(s));

// 문장 단위로 나눠 문제 있는 문장만 빼요.
function cleanText(s, stats) {
  const text = String(s).replace(INLINE_KCAL, () => { stats.removed++; return ""; });
  const sentences = text.split(/(?<=[.!?])\s+/);
  const kept = sentences.filter(x => { const bad = isBad(x); if (bad) stats.removed++; return !bad; });
  return kept.join(" ").trim();
}

// 이름처럼 비면 안 되는 칸은 문장을 지우지 않고 괄호 표기만 떼요.
const KEEP_KEYS = new Set(["when", "menu", "name", "id", "recipeId", "time", "level", "meta"]);

function walk(v, key, stats) {
  if (typeof v === "string") {
    if (KEEP_KEYS.has(key)) return v.replace(INLINE_KCAL, () => { stats.removed++; return ""; }).trim();
    return cleanText(v, stats);
  }
  if (Array.isArray(v)) {
    return v.map(x => walk(x, key, stats)).filter(x => !(typeof x === "string" && !x));
  }
  if (v && typeof v === "object") {
    const out = {};
    for (const [k, x] of Object.entries(v)) out[k] = walk(x, k, stats);
    return out;
  }
  return v;
}

// 정리한 식단과 지운 개수를 돌려줘요.
export function sanitizePlan(plan) {
  const stats = { removed: 0 };
  const clean = walk(plan, "", stats);
  return { plan: clean, removed: stats.removed };
}
