# 냉털 식단

냉장고 재료를 입력하면 유통기한 짧은 재료부터 쓰는 식단표와 레시피를 만들어 주는 웹사이트예요.

## 구조

```
index.html     화면 (정적 페이지)
api/plan.js    Gemini API를 호출하는 서버리스 함수
```

API 키는 서버(`api/plan.js`)에서만 쓰여서 브라우저에 노출되지 않아요.

## 배포 (GitHub + Vercel)

1. 이 폴더를 GitHub 저장소로 올려요.
2. [vercel.com](https://vercel.com)에 GitHub 계정으로 로그인하고 **Add New → Project**에서 저장소를 가져와요.
3. 배포 설정의 **Environment Variables**에 아래를 추가해요.
   - `GEMINI_API_KEY`: [Google AI Studio](https://aistudio.google.com)에서 발급한 키
   - `GEMINI_MODEL` (선택): 기본값은 `gemini-3.5-flash-lite`. 더 좋은 품질이 필요하면 `gemini-3.8-flash`
4. **Deploy**를 누르면 `https://프로젝트이름.vercel.app` 주소가 생겨요. 이후 GitHub에 push할 때마다 자동으로 다시 배포돼요.

## 로컬에서 실행

```
npm i -g vercel
vercel dev
```

`.env.local`에 `GEMINI_API_KEY=...`를 넣어두면 돼요. (`.gitignore`에 포함되어 있어 커밋되지 않아요.)

## 비용 관리

누구나 접속할 수 있는 사이트라 요청 비용은 키 주인에게 청구돼요. Google AI Studio / Google Cloud 결제 설정에서 예산 알림이나 사용 한도를 꼭 걸어두세요.

## 안전장치

- 목표 체중이 저체중 범위(BMI 18.5 미만)이면 감량 대신 유지 식단으로 짜요.
- 칼로리 숫자나 극단적인 제한은 출력하지 않도록 프롬프트에 규칙이 들어 있어요.
- 재료 입력은 칸당 1000자로 제한하고, 프롬프트는 서버에서만 만들어요.
