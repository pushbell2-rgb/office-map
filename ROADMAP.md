# ROADMAP — 개발 진행 기록

> 서비스: 서울숲 사옥 3D 회의실 찾기 & 실시간 위치 공유
> 최종 업데이트: 2026-03-13

---

## 현재 상태

```
Phase 1 (기반 구축)    ██████████ 완료 ✅
Phase 2 (핵심 기능)    ██████████ 완료 ✅
Phase 3 (배포 & 제출)  ░░░░░░░░░░ 진행 예정 🔲
```

---

## Phase 1: 프로젝트 기반 구축 ✅

### 목표
단일 서버로 실행되는 기반 구조 구성, 실제 도면 이미지 확보

### 완료 항목

| 항목 | 상태 | 설명 |
|------|------|------|
| 프로젝트 디렉토리 구성 | ✅ | backend/, frontend/, public/, docs/ |
| package.json | ✅ | express, socket.io 2개 의존성만 |
| .gitignore | ✅ | node_modules, .env 제외 |
| Express + Socket.io 서버 | ✅ | 단일 서버, PORT 환경변수 지원 |
| 도면 이미지 준비 | ✅ | map2.jpg (2758×1728px 고해상도) |
| 정적 파일 서빙 | ✅ | frontend/ + /public/ 경로 구분 |

### 주요 커밋
```
init: 프로젝트 초기화 및 의존성 설정 (express, socket.io)
feat: Express + Socket.io 서버 기반 구성
chore: 고해상도 도면 이미지(map2.jpg) 추가
```

---

## Phase 2: 핵심 기능 구현 ✅

### 목표
3D 도면 렌더링, 회의실 검색, 실시간 위치 공유 구현

### 완료 항목

| 항목 | 상태 | 설명 |
|------|------|------|
| Three.js 씬 구성 | ✅ | 바닥 텍스처, 조명(Ambient+Directional+Point), 안개 |
| 44개 회의실 좌표 데이터 | ✅ | map-data.js, 6가지 타입 정의 |
| 3D 회의실 박스 렌더링 | ✅ | 반투명 MeshStandardMaterial, 타입별 색상 |
| 엣지 아웃라인 | ✅ | EdgesGeometry + LineSegments |
| CSS2D 라벨 | ✅ | 회의실 ID + 이름, 3D 공간에 floating |
| OrbitControls | ✅ | 드래그/줌/패닝, maxPolarAngle 제한 |
| 카메라 fly-to 애니메이션 | ✅ | lerp 보간, 목표 도달 시 자동 해제 |
| Raycaster 클릭 인터랙션 | ✅ | 방 클릭 → 정보 패널, 바닥 클릭 → 위치 설정 |
| hover 강조 효과 | ✅ | emissiveIntensity 0.08 → 0.4 |
| 회의실 검색 (좌측 사이드바) | ✅ | 실시간 필터링, 미매칭 방 opacity 0.08 |
| Socket.io 실시간 위치 공유 | ✅ | join, set-location, disconnect 처리 |
| 사용자 핀 렌더링 | ✅ | 줄기(Cylinder) + 공(Sphere) + 그림자(Circle) |
| 핀 펄싱 애니메이션 | ✅ | sin 파형 scale 변동 |
| 동료 위치 패널 (우측) | ✅ | 위치 설정된 사용자 목록, fly-to 버튼 |
| 범례 렌더링 | ✅ | 6가지 타입 색상 + 이름 |
| **좌표 정밀도 개선** | ✅ | 도면 실제 크기(2758×1728px) 기준 전면 재계산, FLOOR_D 78→88 |

### 주요 커밋
```
feat: Three.js 3D 씬 구성 - 도면 텍스처, 조명, 안개 설정
feat: 44개 회의실 좌표 데이터 정의 (map-data.js, 6가지 타입)
feat: 3D 회의실 박스·엣지·CSS2D 라벨 렌더링
feat: OrbitControls, 카메라 fly-to 애니메이션 구현
feat: Raycaster 클릭 인터랙션 - 방 정보 패널, 위치 설정 모드
feat: 회의실 이름/ID 검색 및 3D 필터링 기능
feat: Socket.io 실시간 사용자 위치 공유 - 핀 렌더링 및 동기화
fix: 도면 실제 크기(2758×1728px) 기준 좌표 전면 재계산 - FLOOR_D 78→88
docs: README, CLAUDE.md, ROADMAP, PRD, 사용자 스토리, 검증 계획 작성
```

---

## Phase 3: 배포 & 제출 🔲

### 목표
Railway/Render 배포, GitHub 제출, 피드백 반영 개선

### 예정 항목

| 항목 | 상태 | 방법 |
|------|------|------|
| Railway 배포 설정 | 🔲 | `npm start` 명령, PORT 환경변수 자동 주입 |
| 배포 URL 확보 | 🔲 | 제출 시 +10점 보너스 |
| ROADMAP.md 배포 완료 기록 | 🔲 | 이 파일 업데이트 |
| 1차 제출 | 🔲 | GitHub 레포 + 배포 URL |
| 1차 피드백 분석 | 🔲 | score_guide.md에 기록 |
| 2차 제출 (개선) | 🔲 | 피드백 기반 |
| 3차 제출 (최종) | 🔲 | 피드백 기반 |

### 배포 예상 커밋
```
deploy: Railway 배포 설정 추가
docs: ROADMAP.md Phase 3 완료 업데이트
fix: (피드백 기반 개선 내용)
```

---

## 기능 개선 후보 (시간 여유 시)

| 기능 | 우선순위 | 비고 |
|------|---------|------|
| 방 타입별 필터 버튼 | 중 | 현재는 검색으로만 필터 |
| 모바일 터치 지원 강화 | 중 | 현재 데스크톱 최적화 |
| 회의실 예약 현황 연동 | 낮 | 구글 캘린더 API 필요 |
| 사용자 위치 이름 클릭 시 Slack DM | 낮 | Slack deep-link 활용 |
| 다른 층/빌딩 지원 | 낮 | 추가 도면 이미지 필요 |
