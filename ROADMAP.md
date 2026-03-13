# ROADMAP — 개발 진행 기록

> 서비스: 서울숲 사옥 3D 회의실 찾기 & 실시간 위치 공유
> 최종 업데이트: 2026-03-13

---

## 현재 상태

```
Phase 1 (기반 구축)      ██████████ 완료 ✅
Phase 2 (핵심 기능)      ██████████ 완료 ✅
Phase 3 (품질 개선)      ██████████ 완료 ✅
Phase 4 (배포 & 제출)    ██████████ 완료 ✅
Phase 5 (2차 피드백 반영) ██████████ 완료 ✅
```

---

## Phase 1: 프로젝트 기반 구축 ✅

### 목표
단일 서버로 실행되는 기반 구조 구성, 실제 도면 이미지 확보

| 항목 | 상태 | 설명 |
|------|------|------|
| 프로젝트 디렉토리 구성 | ✅ | backend/, frontend/, public/, docs/ |
| package.json | ✅ | express, socket.io 2개 의존성만 |
| .gitignore | ✅ | node_modules, .env 제외 |
| Express + Socket.io 서버 | ✅ | 단일 서버, PORT 환경변수 지원 |
| 도면 이미지 준비 | ✅ | map2.jpg (2758×1728px 고해상도) |

### 커밋
```
init: 서울숲 사옥 3D 회의실 찾기 서비스 초기 커밋
```

---

## Phase 2: 핵심 기능 구현 ✅

### 목표
3D 도면 렌더링, 회의실 검색, 실시간 위치 공유 구현

| 항목 | 상태 | 설명 |
|------|------|------|
| Three.js 씬 (바닥 텍스처, 조명, 안개) | ✅ | AmbientLight + DirectionalLight + PointLight |
| 44개 회의실 좌표 데이터 (map-data.js) | ✅ | 6가지 타입, 2758×1728px 기준 정밀 계산 |
| 3D 회의실 박스 + 엣지 + CSS2D 라벨 | ✅ | 타입별 반투명 색상 박스 |
| OrbitControls (드래그/줌/패닝) | ✅ | maxPolarAngle 제한, enableDamping |
| 카메라 fly-to 애니메이션 | ✅ | lerp 보간, 목표 도달 시 자동 해제 |
| Raycaster 클릭 인터랙션 | ✅ | 방 클릭→정보패널, 바닥 클릭→위치설정 |
| 회의실 검색 + 3D 필터링 | ✅ | 미매칭 방 opacity 0.08 처리 |
| Socket.io 실시간 위치 공유 | ✅ | join / set-location / disconnect |
| 사용자 핀 렌더링 + 펄싱 애니메이션 | ✅ | Cylinder + Sphere + Circle 그룹 |
| 동료 위치 패널 + fly-to | ✅ | 우측 사이드바 실시간 갱신 |
| 좌표 정밀도 개선 | ✅ | 도면 실제 크기 기준 FLOOR_D 78→88 수정 |

---

## Phase 3: 코드 품질 & 문서 개선 ✅

### 목표
1차 피드백 반영 — 코드 구조화, 문서 구체성 강화

| 항목 | 상태 | 개선 내용 |
|------|------|---------|
| app.js 리팩터링 | ✅ | state 객체 도입, 초기화 함수 분리, 헬퍼 함수 추출 |
| validation-plan.md 구체화 | ✅ | 베이스라인 수치, 테스트 시나리오, 관찰 기록 양식 추가 |
| prd.md 경쟁 분석 심화 | ✅ | 7개 대안 정량 비교, 차별화 근거 구체화 |
| Railway 배포 설정 | ✅ | railway.json, Procfile 추가 |

### 커밋
```
refactor: app.js 전역 변수 그룹화 및 함수 구조화
improve:  validation-plan.md 검증 실행 계획 구체화
improve:  prd.md 경쟁 분석 심화 - 정량 비교 및 차별화 근거 강화
deploy:   Railway 배포 설정 추가
```

---

## Phase 4: 배포 & 제출 🔄

| 항목 | 상태 | 방법 |
|------|------|------|
| GitHub 레포지토리 업로드 | ✅ | https://github.com/pushbell2-rgb/office-map |
| Render 배포 연결 | ✅ | GitHub 레포 연결 → 자동 배포 완료 |
| 배포 URL 확보 | ✅ | https://office-map.onrender.com |
| ROADMAP.md 배포 URL 업데이트 | ✅ | 이 파일에 URL 기록 완료 |
| 2차 제출 | 🔲 | 배포 URL 포함 제출 예정 |

### 배포 URL
```
https://office-map.onrender.com
```

---

## 전체 커밋 히스토리

```
7e9dc75 feat:    모바일 터치 지원 및 반응형 레이아웃 추가
19d6ef4 feat:    첫 방문 온보딩 가이드 추가
9e166d7 feat:    회의실 타입별 필터 버튼 추가
1812ed5 fix:     회의실 링크 이동 버그 수정 및 하단 가이드 UI 개선
6381e1d fix:     채팅 말풍선 미표시 버그 수정, 가이드 UI 개선
f24e149 feat:    채팅·방향키 이동·도면토글·회의실링크·프로필편집 추가
787444b fix:     map-data.js type/id/name 값의 trailing space 제거
62c4813 refactor:map-data.js 좌표 전면 재측정 (map_onlyroom.png 기반)
502f793 revert:  WALL_MARGIN 제거 - 방 크기를 원본 좌표 그대로 사용
d986a44 fix:     타입별 벽 여백(WALL_MARGIN) 적용으로 방 간 간격 표현
25a363f feat:    디버그 그리드 모드 추가 (G키 토글)
060f97b deploy:  Render 배포 완료 - https://office-map.onrender.com
546d43a docs:    score_guide.md 1차 피드백 반영 및 2차 제출 전략 업데이트
d2984cd docs:    ROADMAP.md Phase 3 완료 및 Phase 4 진행 현황 업데이트
bc73b92 deploy:  Railway 배포 설정 추가
efa3866 improve: prd.md 경쟁 분석 심화 - 정량 비교 및 차별화 근거 강화
38dc87c improve: validation-plan.md 검증 실행 계획 구체화
98c4ae3 refactor:app.js 전역 변수 그룹화 및 함수 구조화
bdd4634 init:    서울숲 사옥 3D 회의실 찾기 서비스 초기 커밋
```

---

---

## Phase 5: 2차 피드백 반영 ✅

### 목표
1차 평가 피드백(32/40 문서화, 4/10 검증 계획, UX 개선 요청) 기반 개선

| 항목 | 상태 | 개선 내용 |
|------|------|---------|
| 타입별 필터 버튼 | ✅ | 좌측 사이드바에 6가지 타입 필터 칩 추가 |
| 온보딩 가이드 | ✅ | 최초 방문 시 사용법 안내 오버레이 (localStorage 기반) |
| 모바일 터치 지원 | ✅ | touchend 이벤트, @media 768px 반응형 레이아웃 |
| 회의실 링크 이동 버그 | ✅ | ?room=ID URL 진입 시 race condition 수정 |
| 하단 가이드 개선 | ✅ | 좌클릭/우클릭 드래그 구분, 방향키→핀이동 명칭 수정 |
| validation-plan.md | ✅ | 실제 실행 결과 기록, 베이스라인 데이터 강화 (n=8 설문) |
| CLAUDE.md | ✅ | 알려진 이슈 섹션 대폭 구체화, Socket.io 이벤트 최신화 |

### 커밋
```
feat: 회의실 타입별 필터 버튼 추가
feat: 첫 방문 온보딩 가이드 추가
feat: 모바일 터치 지원 및 반응형 레이아웃 추가
fix:  회의실 링크 이동 버그 수정 및 하단 가이드 UI 개선
docs: validation-plan.md 실행 결과 기록 및 베이스라인 강화
docs: CLAUDE.md 알려진 이슈 구체화, Socket.io 이벤트 명세 최신화
docs: ROADMAP.md Phase 5 진행 이력 추가
```

---

## 기능 개선 후보 (향후)

| 기능 | 우선순위 | 비고 |
|------|---------|------|
| 회의실 예약 현황 연동 | 중간 | Google Calendar API |
| 서버 위치 데이터 영속성 | 낮음 | Redis 도입 |
| 다중 층 지원 | 낮음 | 층 선택 UI + 도면 교체 |
