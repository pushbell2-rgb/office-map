# AI PRD Generator

> 아이디어 한 줄을 입력하면 AI가 구조화된 PRD를 자동 생성하는 웹 서비스

## 문제 정의

PM이 PRD(Product Requirements Document)를 작성하는 데 평균 2~4시간이 소요됩니다.
초안 작성의 어려움, 놓치는 섹션, 일관성 부족 등이 주요 문제입니다.

**AI PRD Generator**는 이 과정을 30초로 단축합니다.

---

## 핵심 기능

| ID | 기능 | 설명 |
|----|------|------|
| F001 | 아이디어 입력 | 서비스 아이디어, 타겟 사용자, 산업군 입력 |
| F002 | AI PRD 생성 | Claude AI가 구조화된 PRD 초안 자동 생성 |
| F003 | 섹션별 재생성 | 마음에 들지 않는 섹션만 AI에게 재생성 요청 |
| F004 | Markdown 내보내기 | 생성된 PRD를 .md 파일로 다운로드 |

---

## PRD 생성 섹션 구조

AI가 생성하는 PRD는 다음 8개 필수 섹션을 포함합니다:

1. **Executive Summary** — 제품 한 줄 요약 및 핵심 가치
2. **Problem Statement** — 해결하려는 문제와 현재 Pain Point
3. **Target Users & Personas** — 주요 사용자 그룹 및 특성
4. **Goals & Success Metrics** — 목표와 측정 가능한 KPI
5. **Core Features (MVP)** — 우선순위별 핵심 기능 목록
6. **User Stories** — 주요 사용자 시나리오
7. **Technical Considerations** — 기술 스택 및 제약사항
8. **Risks & Mitigation** — 잠재적 리스크 및 대응 방안

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Node.js, Express |
| AI | Claude API (claude-sonnet-4-6) |
| 배포 | Railway / Vercel |

---

## 실행 방법

### 사전 요구사항
- Node.js 18 이상
- Anthropic API 키 ([발급](https://console.anthropic.com))

### 로컬 실행

```bash
# 의존성 설치
cd ai-prd-generator
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일에 ANTHROPIC_API_KEY 입력

# 서버 실행
npm start

# 브라우저에서 접속
open http://localhost:3000
```

---

## 프로젝트 구조

```
ai-prd-generator/
├── CLAUDE.md                  # AI 컨텍스트 및 개발 가이드
├── README.md                  # 프로젝트 정의 (이 파일)
├── ROADMAP.md                 # 개발 로드맵 및 진행 상태
├── docs/
│   ├── prd.md                 # 제품 요구사항 정의서
│   ├── user-story.md          # 사용자 스토리 & 페르소나
│   └── validation-plan.md    # 검증 계획
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── backend/
│   ├── server.js
│   ├── routes/prd.js
│   └── services/ai-service.js
├── package.json
├── .env.example
└── .gitignore
```

---

## 검증 목표

> "PM이 AI PRD Generator를 사용하면, PRD 초안 작성 시간을 70% 이상 단축할 수 있다."

- PRD 초안 생성 시간: **30초 이내** (vs 수동 2~4시간)
- 생성된 PRD 섹션 완성도: **필수 8개 섹션 모두 포함**
- 사용자 만족도: **5점 만점 중 4점 이상**

---

## 관련 문서

- [PRD (제품 요구사항 정의서)](docs/prd.md)
- [사용자 스토리 & 페르소나](docs/user-story.md)
- [검증 계획](docs/validation-plan.md)
- [개발 로드맵](ROADMAP.md)
