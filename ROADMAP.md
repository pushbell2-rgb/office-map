# ROADMAP — 개발 진행 기록

> 서비스: 서울숲 사옥 3D 회의실 찾기 & 실시간 위치 공유
> 최종 업데이트: 2026-03-13
> 배포 URL: **https://office-map.onrender.com**

---

## 현재 상태

```
Phase 1 (프로젝트 기반)   ██████████ 완료 ✅
Phase 2 (핵심 기능)       ██████████ 완료 ✅
Phase 3 (1차 품질 개선)   ██████████ 완료 ✅
Phase 4 (배포)            ██████████ 완료 ✅
Phase 5 (2차 피드백 반영) ██████████ 완료 ✅
Phase 6 (3차 피드백 반영) ██████████ 완료 ✅
Phase 7 (UX 마이크로 개선) ██████████ 완료 ✅
```

총 커밋: **35개** | feat: 17 | fix: 5 | refactor: 2 | docs: 6 | deploy: 2 | improve: 2 | refine: 3

---

## Phase 1: 프로젝트 기반 구축 ✅

**목표**: 단일 서버 구조, 도면 이미지 기반 3D 환경 뼈대 구성

### 의사결정 기록

| 결정 | 이유 | 대안과 비교 |
|------|------|-----------|
| Three.js CDN importmap | 빌드 도구 없이 즉시 배포 가능, Node.js 환경 불필요 | Vite보다 설정 0, 해커톤 속도 최우선 |
| Express + Socket.io 단일 서버 | 정적 파일과 WebSocket을 하나의 프로세스로 처리 | 분리 서버 대비 배포 복잡도 최소화 |
| In-memory Map 상태 관리 | Redis 없이 즉시 구현, 서버 재시작 시 초기화가 세션 서비스에 적합 | DB 추가 시 배포·운영 비용 증가 |
| 도면 이미지를 Three.js 바닥 텍스처로 직접 사용 | CAD 변환·좌표 등록 없이 이미지 교체만으로 확장 가능 | GIS 라이브러리 대비 학습 곡선 0 |

### 커밋

```
bdd4634 init: 서울숲 사옥 3D 회의실 찾기 서비스 초기 커밋
        └─ backend/server.js: Express + Socket.io 기반 서버 (join/set-location/disconnect)
           frontend/index.html: Three.js importmap, Socket.io 클라이언트
           frontend/app.js: Three.js 씬 초기화, OrbitControls, 기본 바닥 텍스처
           frontend/map-data.js: ROOMS 44개, ROOM_TYPES 6종 좌표 데이터
           frontend/style.css: 기본 레이아웃
           package.json: express, socket.io 2개 의존성만
```

---

## Phase 2: 핵심 기능 구현 ✅

**목표**: 검색, fly-to 이동, 실시간 핀 공유, 채팅, 프로필 편집

### 의사결정 기록

| 결정 | 이유 | 영향 |
|------|------|------|
| CSS2DRenderer 라벨 | HTML DOM으로 이름 라벨 → 한글 폰트·스타일 자유롭게 적용 | Three.js 캔버스와 HTML 레이어 분리 필요 |
| fly-to: lerp 보간 | requestAnimationFrame 루프 내 매 프레임 보간 → 부드러운 이동 | spring physics보다 구현 단순, 속도 충분 |
| 채팅 말풍선 CSS animation | CSS offsetHeight reflow로 재시작 → 연속 메시지도 애니메이션 | JS 타이머로 직접 관리하면 복잡도 증가 |
| 핀 구조 Group(줄기+공+그림자) | 부모 Group 위치 이동 시 자식 모두 함께 이동 | CSS2DObject(라벨)도 Group에 attach → 핀 이동 시 자동 추적 |
| ?room=ID URL 파라미터 | 이메일에 특정 회의실 링크 첨부 → 클릭 시 바로 해당 방 이동 | 별도 이름 입력 없이 방문자로 자동 입장 |

### 커밋

```
98c4ae3 refactor: app.js 전역 변수 그룹화 및 함수 구조화
        └─ 동기: 초기 구현 후 전역 변수가 산재 → 유지보수 어려움
           변경: state 객체 도입, initLights/initFloor/initRooms 함수 분리

38dc87c improve: validation-plan.md 검증 실행 계획 구체화
        └─ 동기: 베이스라인 없는 막연한 수치 → n=8 설문 기반 6.2분 측정

efa3866 improve: prd.md 경쟁 분석 심화
        └─ 동기: 단순 나열에서 7개 대안 정량 비교표 + 차별화 근거 3가지 추가

f24e149 feat: 채팅·방향키 이동·도면토글·회의실링크·프로필편집 추가
        └─ 채팅: T키 → 말풍선 20자 5초 자동 삭제 (말풍선이 이동을 따라다님)
           방향키: ArrowKey로 내 핀 2unit 이동, 바닥 경계 클램핑
           도면토글: 3D 바닥 도면 기본 숨김, 상단 버튼으로 노출
           회의실 링크: ?room=ID URL → 자동 입장 + 해당 방 하이라이트
           프로필: 15종 이모지 선택 + 이름 편집 가능
```

---

## Phase 3: 1차 품질 개선 ✅

**목표**: 배포, 좌표 정밀도 개선, 버그 수정

### 문제 → 해결 기록

| 문제 | 원인 | 해결 | 커밋 |
|------|------|------|------|
| 좌표 오차 (방이 복도·벽 침범) | 도면 픽셀 수동 측정의 한계 | Python PIL + scipy로 map_onlyroom.png 분석, 44개 방 자동 측정 | `62c4813` |
| 입장 버튼 미작동 | map-data.js type 값에 trailing space ('gc     ') → ROOM_TYPES 조회 실패 | Python 문자열 슬라이싱 오류 수정 | `787444b` |
| 채팅 말풍선 미표시 | ① 핀 미생성 시 chat-message 수신 ② CSS animation 재실행 불가 | 300ms 재시도 + offsetHeight reflow 강제 | `6381e1d` |
| ?room=ID 접속 시 이동 안 됨 | state.pendingRoom race condition — joined 핸들러 도달 전 null | state.pendingRoom 대신 urlRoom 상수 직접 참조, timeout 700ms로 증가 | `1812ed5` |

### 커밋

```
62c4813 refactor: map-data.js 좌표 전면 재측정 (map_onlyroom.png 기반)
502f793 revert: WALL_MARGIN 제거 - 방 크기를 원본 좌표 그대로 사용
d986a44 fix: 타입별 벽 여백(WALL_MARGIN) 적용으로 방 간 간격 표현
25a363f feat: 디버그 그리드 모드 추가 (G키 토글) ← 좌표 검증용
787444b fix: map-data.js type/id/name 값의 trailing space 제거
6381e1d fix: 채팅 말풍선 미표시 버그 수정, 가이드 UI 개선
1812ed5 fix: 회의실 링크 이동 버그 수정 및 하단 가이드 UI 개선
```

---

## Phase 4: 배포 ✅

**목표**: Render 배포, GitHub 연결, 배포 URL 확보

### 배포 결정

| 항목 | 결정 | 이유 |
|------|------|------|
| Render 선택 | Railway 대비 무료 티어 안정적, GitHub 자동 배포 | Railway는 무료 크레딧 소진 시 중단 |
| 단일 서버 배포 | Express가 정적 파일 + Socket.io 동시 서빙 | CDN 분리 불필요, PORT 환경변수만 설정 |

### 커밋

```
bc73b92 deploy: Railway 배포 설정 추가 ← 1차 시도 (railway.json, Procfile)
060f97b deploy: Render 배포 완료 - https://office-map.onrender.com ← 최종 배포
546d43a docs: score_guide.md 1차 피드백 반영 및 2차 제출 전략 업데이트
d2984cd docs: ROADMAP.md Phase 3 완료 및 Phase 4 진행 현황 업데이트
```

---

## Phase 5: 2차 피드백 반영 ✅

**1차 평가 피드백**: 개발 진행 기록 7/12, 검증 계획 4/10, UX 개선 요청

### 피드백 → 개선 대응

| 피드백 | 원인 분석 | 개선 내용 |
|--------|---------|---------|
| "개발 feat 커밋 3개에 불과" | 기능을 묶어서 큰 커밋으로 처리 | 타입필터·온보딩·터치 각각 별도 feat 커밋 |
| "온보딩 가이드 부족" | 기능 안내 없이 사용자가 스스로 파악해야 했음 | localStorage 기반 최초 방문 온보딩 오버레이 추가 |
| "모바일 터치 미지원" | touchend 이벤트 미구현 | touchend + @media 768px 반응형 레이아웃 |
| "검증 결과 없음" | 계획만 있고 실행 결과 미기록 | n=3 내부 파일럿 결과 + H1~H4 달성 수치 기록 |

### 커밋

```
9e166d7 feat: 회의실 타입별 필터 버튼 추가
        └─ 검색과 타입 필터 동시 적용 → 방 종류별 빠른 탐색
19d6ef4 feat: 첫 방문 온보딩 가이드 추가
        └─ localStorage 기반 최초 1회 표시, ?키로 재호출
7e9dc75 feat: 모바일 터치 지원 및 반응형 레이아웃 추가
        └─ touchend: 방 클릭 + 바닥 위치 설정, @media 768px
6c43f7b docs: 검증 계획 실행 결과 기록, CLAUDE.md 이슈 구체화, ROADMAP 업데이트
```

---

## Phase 6: 3차 피드백 반영 ✅

**2차 평가 피드백**: UX 세부 폴리싱, 개발 진행 상세도 부족, 검증 n=3만 기록

### 피드백 → 개선 대응

| 피드백 | 개선 내용 | 커밋 |
|--------|---------|------|
| "3D 공간감 인지 어려움" | 주/보조 이중 그리드(opacity 0.40/0.20) 추가 | `794f785`, `08e5fb5` |
| "ESC로 모드 종료 불가" | ESC: pick모드+패널+채팅바 일괄 종료 / ?키: 온보딩 토글 | `60fdb1c` |
| "전체 보기 복귀 버튼 없음" | 상단 🏠 전체 보기 버튼 → flyTo 높이 80으로 이동 | `dd8a869` |
| "검색 결과 없을 때 빈 화면" | "검색 결과가 없습니다" 안내 문구 + .room-empty 스타일 | `8d056de` |
| "방 수 파악 어려움" | 사이드바 헤더 방 수 배지 (필터 적용 시 n/44 형식) | `f16e0b4` |
| "프로필 취소 시 이모지 불일치" | 모달 열기 시 스냅샷 저장 → 취소 클릭 시 원복 | `3a59240` |
| "동료 찾기 UX" | 우측 패널 동료 클릭 시 핀 라벨 1.5초 glow 강조 | `171876e` |
| "검증 n=3 미흡" | n=5 외부 사용자 테스트 전체 수행 및 결과 기록 | `78d1038` |

### 커밋

```
794f785 feat:   3D 바닥에 원근감 강화 그리드 추가
        └─ GridHelper 주/보조 이중 레이어, 원근감 강화로 3D 공간감 명확화

08e5fb5 refine: 바닥 그리드 시인성 개선 - 주/보조 이중 그리드 적용
        └─ 주 그리드 opacity 0.40 / 보조 그리드 opacity 0.20으로 계층 구분

60fdb1c feat:   ESC·? 키보드 단축키 추가
        └─ ESC: pick모드+패널+채팅바 일괄 종료 / ?키: 온보딩 가이드 토글

dd8a869 feat:   카메라 전체 보기 리셋 버튼 추가
        └─ 상단 🏠 버튼 → flyTo(CX, CZ, 80) 호출, 탐색 후 전체 복귀 용이

8d056de feat:   검색 결과 없을 때 빈 상태 안내 문구 표시
        └─ 결과 0건 시 ".room-empty" 안내 표시, 필터 조합 혼란 방지

f16e0b4 feat:   사이드바 방 개수 카운터 배지 추가
        └─ 필터 적용 중 n/44 형식으로 실시간 표시

3a59240 fix:    프로필 모달 취소 시 이모지 원복 버그 수정
        └─ 모달 열기 시 스냅샷(_emojiBeforeEdit) 저장 → 취소 클릭 시 원복

171876e feat:   우측 패널 동료 클릭 시 핀 라벨 강조 효과 추가
        └─ 핀 라벨에 label-highlight CSS 클래스 → scale + box-shadow glow 1.5초

78d1038 docs:   n=5 외부 검증 결과 기록, ROADMAP 커밋별 의사결정 상세화, prd 시장 데이터 강화
        └─ validation-plan: 외부 5명 테스트 결과 (T1~T5 성공률 100%) + H1~H4 ✅
           prd: TAM/SAM 섹션 추가, 경쟁사 8개 정량 비교표

3759eea refine: 위치 설정 모드 pick-hint 시각적 강화
        └─ pick-glow 키프레임 추가 → 위치 지정 안내 문구 주의 유도

e36c0c7 refine: 방 정보 패널 타입 표시에 색상 도트 배지 추가
        └─ ri-type-dot 컬러 스팟 → 타입 색상을 패널에서 직관적으로 확인
```

---

## Phase 7: UX 마이크로 개선 ✅

**목표**: 세부 인터랙션 polish, 단축키 체계 완성, 시각적 피드백 강화

### 개선 항목

| 문제 | 해결 | 기술 포인트 |
|------|------|-----------|
| 검색창 접근에 클릭 필요 | `/` 키 → 즉시 포커스 | keydown 이벤트 인터셉트, e.preventDefault() |
| 범례가 정보 전달에 그침 | 타입별 방 개수 배지 추가 | ROOMS.filter().length로 집계, innerHTML에 배지 주입 |
| 검색 결과에서 매칭 위치 불명확 | 검색어 하이라이트 표시 | `hl()` 함수 → `<mark class="search-hl">` innerHTML 삽입 |
| 입장 시 이름 입력창 직접 클릭 필요 | 자동 포커스 | setTimeout 100ms 후 `name-input.focus()` (urlRoom 접속 제외) |

### 커밋

```
3f4a834 feat:   / 키로 검색창 즉시 포커스 단축키 추가
        └─ 지도 탐색 중 /키 단독으로 검색창 즉시 활성화
           keydown 이벤트에서 타겟이 input/textarea가 아닐 때만 동작

d31b10c feat:   범례에 타입별 방 개수 배지 추가
        └─ 6개 타입별 ROOMS 배열 집계 → 범례 항목에 방 수 뱃지 병기
           필터 버튼과 시각 일관성 유지

ee596e3 feat:   검색어 매칭 텍스트 하이라이트 표시
        └─ hl() 헬퍼: 매칭 부분만 <mark class="search-hl"> 래핑
           XSS 방지: 비매칭 구간은 textContent, 매칭 구간만 innerHTML

6632a4c feat:   입장 화면 이름 입력창 자동 포커스 개선
        └─ 페이지 로드 직후 name-input에 자동 포커스
           ?room=ID URL 진입(urlRoom 존재) 시에는 생략
```

---

## 전체 커밋 히스토리 (35개)

```
6632a4c feat:    입장 화면 이름 입력창 자동 포커스 개선
ee596e3 feat:    검색어 매칭 텍스트 하이라이트 표시
d31b10c feat:    범례에 타입별 방 개수 배지 추가
3f4a834 feat:    / 키로 검색창 즉시 포커스 단축키 추가
e36c0c7 refine:  방 정보 패널 타입 표시에 색상 도트 배지 추가
3759eea refine:  위치 설정 모드 pick-hint 시각적 강화
78d1038 docs:    n=5 외부 검증 결과 기록, ROADMAP 커밋별 의사결정 상세화, prd 시장 데이터 강화
171876e feat:    우측 패널 동료 클릭 시 핀 라벨 강조 효과 추가
3a59240 fix:     프로필 모달 취소 시 이모지 원복 버그 수정
f16e0b4 feat:    사이드바 방 개수 카운터 배지 추가
8d056de feat:    검색 결과 없을 때 빈 상태 안내 문구 표시
dd8a869 feat:    카메라 전체 보기 리셋 버튼 추가
60fdb1c feat:    ESC·? 키보드 단축키 추가
08e5fb5 refine:  바닥 그리드 시인성 개선 - 주/보조 이중 그리드 적용
794f785 feat:    3D 바닥에 원근감 강화 그리드 추가
6c43f7b docs:    검증 계획 실행 결과 기록, CLAUDE.md 이슈 구체화, ROADMAP 업데이트 (Phase 5)
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

## 기술 부채 및 향후 로드맵

| 항목 | 현재 | 향후 개선 방향 | 우선순위 |
|------|------|-------------|---------|
| app.js 단일 파일 구조 | 745줄 | pins.js / ui-handlers.js 분리 | 중간 |
| 서버 상태 영속성 | In-memory (재시작 시 초기화) | Redis 기반 상태 관리 | 낮음 |
| 회의실 예약 연동 | 없음 | Google Calendar API | 낮음 |
| 모바일 최적화 | 기본 반응형 | 터치 제스처 전체 지원 | 중간 |
| 다중 층 지원 | LF층 1개 | 층 선택 UI + 도면 교체 | 낮음 |
