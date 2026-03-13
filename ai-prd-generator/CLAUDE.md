# CLAUDE.md — AI PRD Generator 개발 컨텍스트

> 이 파일은 Claude Code가 프로젝트를 이해하고 일관되게 개발할 수 있도록 작성된 AI 컨텍스트 문서입니다.

---

## 프로젝트 개요

**AI PRD Generator**는 PM/기획자가 아이디어 한 줄을 입력하면 Claude AI가 구조화된 PRD(제품 요구사항 정의서) 초안을 30초 안에 자동 생성하는 웹 서비스입니다.

- **핵심 가치**: PRD 초안 작성 시간을 2~4시간 → 30초로 단축
- **주요 사용자**: PM, 기획자, 스타트업 창업자
- **MVP 범위**: 아이디어 입력 → AI PRD 생성 → Markdown 내보내기

---

## 기술 스택

| 영역 | 기술 | 버전 | 비고 |
|------|------|------|------|
| Frontend | HTML5 / CSS3 / Vanilla JS | — | 프레임워크 없음, 간결성 우선 |
| Backend | Node.js + Express | 18+ / 4.x | REST API 서버 |
| AI | Anthropic Claude API | claude-sonnet-4-6 | @anthropic-ai/sdk |
| 환경 변수 | dotenv | 16.x | .env 파일 로드 |
| CORS | cors | 2.x | 프론트-백 통신 허용 |

---

## 아키텍처

```
[Browser]
   │  HTTP GET /          → frontend/index.html 서빙
   │  POST /api/generate-prd  → PRD 생성 요청
   ▼
[Express Server - backend/server.js]
   │  정적 파일: frontend/ 폴더 서빙
   │  API 라우터: backend/routes/prd.js
   ▼
[AI Service - backend/services/ai-service.js]
   │  Claude API 호출 (Messages API)
   │  프롬프트 구성 → 응답 파싱
   ▼
[Anthropic Claude API]
   └  model: claude-sonnet-4-6
```

---

## API 엔드포인트

### POST /api/generate-prd

PRD 자동 생성 엔드포인트.

**Request Body**
```json
{
  "idea": "배달 앱을 위한 AI 메뉴 추천 서비스",
  "targetUser": "배달 앱 사용자 (20~40대)",
  "category": "Food Tech"
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "prd": {
    "executiveSummary": "...",
    "problemStatement": "...",
    "targetUsers": "...",
    "goalsAndMetrics": "...",
    "coreFeatures": "...",
    "userStories": "...",
    "technicalConsiderations": "...",
    "risksAndMitigation": "..."
  },
  "markdown": "# PRD: ...\n\n## Executive Summary\n..."
}
```

**Response (400 Bad Request)**
```json
{
  "success": false,
  "error": "idea 필드는 필수입니다."
}
```

**Response (500 Internal Server Error)**
```json
{
  "success": false,
  "error": "AI 서비스 오류가 발생했습니다."
}
```

---

## 모듈 구조

```
backend/
├── server.js               # Express 앱 초기화, 미들웨어, 포트 설정
├── routes/
│   └── prd.js              # POST /api/generate-prd 라우트 핸들러
└── services/
    └── ai-service.js       # Claude API 호출 및 프롬프트 관리

frontend/
├── index.html              # 메인 페이지 (단일 페이지)
├── style.css               # 전체 스타일 (CSS 변수 기반 디자인 시스템)
└── app.js                  # API 호출, DOM 조작, 이벤트 핸들링
```

### 각 모듈의 책임

**`backend/server.js`**
- Express 인스턴스 생성 및 미들웨어 설정
- `frontend/` 폴더 정적 파일 서빙
- `/api` 라우터 마운트
- 포트 리스닝 (기본 3000)

**`backend/routes/prd.js`**
- 요청 유효성 검사 (idea 필드 필수)
- `ai-service.js` 호출
- 응답 포맷팅 및 반환

**`backend/services/ai-service.js`**
- Anthropic 클라이언트 초기화
- 시스템 프롬프트 + 사용자 프롬프트 구성
- Claude API 호출 및 응답 파싱
- PRD JSON 객체 + Markdown 문자열 반환

**`frontend/app.js`**
- 폼 제출 이벤트 처리
- `/api/generate-prd` POST 요청
- 로딩 상태 UI 관리
- 결과 렌더링 및 Markdown 내보내기

---

## 데이터 모델

### PRD 객체 구조

```javascript
{
  executiveSummary: String,      // 제품 한 줄 요약 및 핵심 가치
  problemStatement: String,      // 해결하려는 문제 및 Pain Point
  targetUsers: String,           // 주요 사용자 그룹 및 특성
  goalsAndMetrics: String,       // 목표 및 측정 가능한 KPI
  coreFeatures: String,          // 우선순위별 핵심 기능 (Markdown 표)
  userStories: String,           // 주요 사용자 시나리오
  technicalConsiderations: String, // 기술 스택 및 제약사항
  risksAndMitigation: String     // 리스크 및 대응 방안
}
```

### 입력 폼 필드

```javascript
{
  idea: String,        // 필수 — 서비스 아이디어 (1~500자)
  targetUser: String,  // 선택 — 타겟 사용자 설명
  category: String     // 선택 — 산업군/카테고리
}
```

---

## 환경 변수

| 변수명 | 필수 | 설명 | 예시 |
|--------|------|------|------|
| `ANTHROPIC_API_KEY` | 필수 | Anthropic API 키 | `sk-ant-...` |
| `PORT` | 선택 | 서버 포트 (기본: 3000) | `3000` |

`.env.example` 파일을 복사하여 `.env` 파일을 만들고 값을 채워야 합니다.

---

## 개발 명령어

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (파일 변경 감지)
npm run dev

# 프로덕션 서버 실행
npm start

# 접속 URL
http://localhost:3000
```

---

## 코딩 규칙

### 전반
- 변수명은 camelCase, 파일명은 kebab-case
- 에러는 반드시 try/catch로 처리하고 사용자에게 명확한 에러 메시지 반환
- 콘솔 로그는 `[서버]`, `[AI]` 접두사로 구분

### Backend
- `async/await` 사용 (콜백, Promise.then 지양)
- API 응답은 항상 `{ success: boolean, ... }` 형태 유지
- 환경 변수는 서버 시작 시 검증하고 누락 시 즉시 종료

### Frontend
- `fetch` API 사용 (axios 미사용)
- DOM 조작은 `app.js`에서만 수행
- CSS 변수(`--color-primary` 등)를 활용한 일관된 디자인

### AI 프롬프트
- 시스템 프롬프트에서 출력 형식(JSON)을 명시적으로 지정
- 온도(temperature)는 0.7로 설정하여 창의성과 일관성 균형 유지
- 최대 토큰: 4096

---

## 주요 판단 기준 (개발 시 참고)

1. **단순성 우선** — PM 직군 프로젝트이므로 프레임워크보다 가독성 있는 코드
2. **빠른 피드백** — 로딩 상태를 항상 표시하여 UX 개선
3. **Markdown 출력** — PRD의 특성상 Markdown 형식이 가장 적합
4. **에러 메시지 친화적** — API 키 누락, 네트워크 오류 등 명확한 안내
