# 냉털 식단

냉장고 재료를 입력하면 유통기한 짧은 재료부터 쓰는 식단표와 레시피를 만들어 주는 웹사이트예요.

## 구조

```
index.html       화면 (정적 페이지)
api/plan.js      식단을 만드는 서버리스 함수 (Gemini)
api/sort.js      보관 장소가 안 적힌 재료를 냉장/냉동/실온으로 나누는 함수 (Gemini)
api/_gemini.js   Gemini 호출 공용 코드 (_ 로 시작해서 API 경로가 되지 않아요)
dev-server.mjs   로컬 테스트용 서버 (npm run dev)
```

## 쓰는 법

- 몸 정보: 성별을 고르면 키·체중 칸이 평균 체형 기본값으로 바뀌어요. 끼니는 아침·점심·저녁 중 자유롭게, 기간은 1일~2주로 골라요.
- 재료: 냉장고 메모를 통째로 붙여넣고 **알아서 정리하기**를 누르면 "냉장고 / 냉동고 / 실온" 같은 제목줄을 보고 칸별로 나눠요. 이건 브라우저에서 바로 해서 API 비용이 들지 않아요. 제목 없이 적은 줄만 `/api/sort`로 AI가 나눠요.

API 키는 서버(`api/plan.js`)에서만 쓰여서 브라우저에 노출되지 않아요.

## 배포 (GitHub + Vercel)

1. 이 폴더를 GitHub 저장소로 올려요.
2. [vercel.com](https://vercel.com)에 GitHub 계정으로 로그인하고 **Add New → Project**에서 저장소를 가져와요.
3. 배포 설정의 **Environment Variables**에 아래를 추가해요.
   - `GEMINI_API_KEY`: [Google AI Studio](https://aistudio.google.com)에서 발급한 키
   - `GEMINI_MODEL` (선택): 기본값은 `gemini-3.5-flash-lite`. 더 좋은 품질이 필요하면 `gemini-3.8-flash`
4. **Deploy**를 누르면 `https://프로젝트이름.vercel.app` 주소가 생겨요. 이후 GitHub에 push할 때마다 자동으로 다시 배포돼요.

## 로컬에서 실행

`.env.local`에 `GEMINI_API_KEY=...`를 넣어두고 실행해요. (`.gitignore`에 포함되어 있어 커밋되지 않아요.)

```
npm run dev
```

http://localhost:3000 에서 열려요. 설치할 것 없이 Node(20.12 이상)만 있으면 돼요. Vercel 환경과 똑같이 확인하고 싶으면 `npm i -g vercel` 후 `vercel dev`를 써도 돼요.

## 비용 관리

누구나 접속할 수 있는 사이트라 요청 비용은 키 주인에게 청구돼요. Google AI Studio / Google Cloud 결제 설정에서 예산 알림이나 사용 한도를 꼭 걸어두세요.

## 지난 식단

만든 식단은 브라우저(localStorage)에 최근 20개까지 저장돼요. 끼니 체크 상태도 식단마다 따로 기억해요. 서버에는 저장하지 않아서 다른 기기에서는 보이지 않아요.

## 안전장치

- BMI 보기 스위치를 켜면 지금 BMI와 목표 BMI를 게이지로 보여줘요. (켜고 끈 상태는 기억해요)
- 지금 BMI나 목표 BMI가 저체중 범위(18.5 미만)이면 식단을 짜기 전에 확인 팝업을 띄워요. 계속하면 감량 대신 골고루 먹는 식단으로 짜고, 식단과 지난 식단 목록에 "주의" 표시를 붙여요.
- 칼로리 숫자나 극단적인 제한은 출력하지 않도록 프롬프트에 규칙이 들어 있어요.
- 재료 입력은 칸당 1000자로 제한하고, 프롬프트는 서버에서만 만들어요.
