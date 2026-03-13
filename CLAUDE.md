# CLAUDE.md — AI 컨텍스트 가이드

> 이 파일은 AI 어시스턴트(Claude Code 등)가 이 프로젝트를 정확히 이해하고 작업을 이어받을 수 있도록 작성된 컨텍스트 문서다.

---

## 프로젝트 한 줄 요약

**서울숲 사옥 LF층 3D 회의실 찾기 & 실시간 위치 공유** — 실제 도면 이미지를 Three.js로 3D 렌더링하고, Socket.io로 사용자 위치를 실시간 공유하는 사내 웹 서비스. 빌드 도구 없이 CDN importmap 방식의 ES Modules를 사용한다.

---

## 기술 스택 및 버전

| 기술 | 버전 | 비고 |
|------|------|------|
| Three.js | r161 | CDN: `https://unpkg.com/three@0.161.0/build/three.module.js` |
| OrbitControls | r161 | `three/addons/controls/OrbitControls.js` |
| CSS2DRenderer | r161 | `three/addons/renderers/CSS2DRenderer.js` |
| Socket.io | 4.7.4 | 서버: npm 패키지 / 클라이언트: Express가 `/socket.io/socket.io.js` 자동 서빙 |
| Express | 4.18.3 | 정적 파일 + Socket.io 단일 서버 |
| Node.js | 18+ | `node --watch` 개발 모드 지원 |

**빌드 도구 없음**: `index.html`의 `<script type="importmap">`으로 CDN 모듈 직접 로드. webpack, vite 등 추가 금지.

---

## 아키텍처

```
브라우저
  ├── HTTP GET → Express 정적 파일 서빙 (frontend/, public/)
  └── WebSocket (Socket.io)
         │
    Express 서버 (port 3001)
         └── Socket.io Server
               └── In-memory Map<socketId, UserState>
                     { id, name, x, z, color }
```

- **단일 서버**: Express가 정적 파일과 Socket.io를 모두 처리
- **인메모리 상태**: 서버 재시작 시 모든 사용자 위치 초기화됨 (의도적 설계)
- **포트**: `process.env.PORT || 3001` — 배포 플랫폼이 PORT 환경변수 주입

---

## 파일별 역할

| 파일 | 역할 |
|------|------|
| `backend/server.js` | Express + Socket.io 서버. 사용자 Map 관리, join/set-location/disconnect 처리, broadcast |
| `frontend/index.html` | 진입점. Three.js importmap, Socket.io 클라이언트 로드, 전체 HTML 레이아웃 |
| `frontend/app.js` | Three.js 씬 구성, 렌더링 루프, OrbitControls, Raycaster, UI 이벤트, Socket.io 연동 |
| `frontend/map-data.js` | `ROOMS` 배열(44개 방), `ROOM_TYPES` 정의. export만 수행 |
| `frontend/style.css` | 전체 UI 스타일 (사이드바, 패널, 오버레이, 핀 라벨 등) |
| `public/map2.jpg` | 실제 도면 이미지 원본 2758×1728px. `/public/map2.jpg`로 서빙됨 |

---

## 좌표 시스템 (수정 시 반드시 숙지)

```
도면 이미지 크기: 2758 × 1728 px
3D 바닥 크기:    140  × 88   units

변환 공식:
  3D_x = pixel_x × (140 / 2758)  ≈  pixel_x / 19.7
  3D_z = pixel_y × (88  / 1728)  ≈  pixel_y / 19.6

Three.js 배치:
  바닥: PlaneGeometry(140, 88), rotation.x = -Math.PI/2, position.set(70, 0, 44)
  방 메시: position.set(room.x + room.w/2, ROOM_H/2, room.z + room.d/2)
  FLOOR_CX = 70 (FLOOR_W/2), FLOOR_CZ = 44 (FLOOR_D/2)

map-data.js 좌표 의미:
  x/z = 방 좌상단 꼭짓점 (3D 단위)
  w   = 가로 길이 (X축 방향)
  d   = 깊이 (Z축 방향)
```

---

## Socket.io 이벤트 명세

| 방향 | 이벤트 | 페이로드 | 설명 |
|------|--------|---------|------|
| 클라 → 서버 | `join` | `{ name: string, emoji: string }` | 세션 참여, 이름·이모지 등록 |
| 클라 → 서버 | `set-location` | `{ x: number, z: number }` | 3D 좌표로 위치 업데이트 |
| 클라 → 서버 | `update-profile` | `{ name?: string, emoji?: string }` | 이름·이모지 변경 |
| 클라 → 서버 | `chat` | `{ message: string }` | 채팅 메시지 전송 (서버에서 20자 슬라이싱) |
| 서버 → 클라 | `joined` | `{ color: string }` | 내 색상 할당 확인 |
| 서버 → 클라 | `users-update` | `User[]` | 전체 사용자 상태 동기화 |
| 서버 → 클라 | `chat-message` | `{ id: string, message: string, color: string }` | 브로드캐스트된 채팅 메시지 |

`User` 타입: `{ id: string, name: string, emoji: string, x: number|null, z: number|null, color: string }`

> **채팅 말풍선 규칙**: 최대 20자, 5초 후 자동 삭제. 연속 입력 시 이전 타이머 취소 후 최신 메시지만 유지.

---

## 핀 색상 풀

```javascript
const PIN_COLORS = ['#ef4444','#3b82f6','#10b981','#f59e0b','#8b5cf6','#ec4899','#06b6d4','#84cc16'];
// 접속 순서대로 순환 할당 (colorIdx++ % 8)
```

---

## 렌더링 구조 (app.js)

```
scene
├── floor (PlaneGeometry, map2.jpg 텍스처)
├── roomMeshes[] (BoxGeometry, 반투명 MeshStandardMaterial)
│     └── CSS2DObject (라벨: room.id + room.name)
├── EdgesGeometry LineSegments (각 방 아웃라인)
└── userPins Map<userId, Group>
      ├── stem (CylinderGeometry)
      ├── ball (SphereGeometry) ← 펄싱 애니메이션 대상 (children[1])
      ├── shadow (CircleGeometry)
      └── CSS2DObject (사용자 이름 라벨)
```

---

## 개발 명령어

```bash
npm install   # express, socket.io 설치
npm start     # node backend/server.js
npm run dev   # node --watch backend/server.js (자동 재시작)
```

---

## 코딩 규칙

1. **좌표 수정** 시 위의 변환 공식 사용. `pixel_x / 19.7`, `pixel_y / 19.6`
2. **빌드 도구 추가 금지** — importmap CDN 방식 유지
3. **`map-data.js`** 는 `ROOMS`, `ROOM_TYPES` export만. Three.js import 없음
4. **`.env` 커밋 금지** — PORT만 환경변수로 사용, 시크릿 없음
5. **인메모리 상태** 는 의도적 설계 — DB 추가 금지 (MVP 범위 외)

---

## 알려진 이슈 / 주의사항

### 렌더링

- **핀 구조 인덱스**: `pin.children[PIN_BALL_INDEX]` (= `children[1]`)이 ball을 가정. 핀 구조 변경 시 `PIN_BALL_INDEX` 상수 재확인 필요
- **OrbitControls 각도 제한**: `maxPolarAngle = Math.PI/2 - 0.02` — 바닥 아래 카메라 이동 방지. 이보다 낮게 내리면 바닥이 보이지 않는 버그 발생
- **CSS2DRenderer 레이어**: `pointer-events: none` 설정 필수. 제거 시 마우스 클릭이 캔버스에 도달하지 않음
- **Fog 설정**: `FogExp2(0x0f172a, 0.008)` — 밀도 0.01 이상 시 먼 거리 방 라벨 시인성 저하

### 소켓 / 상태

- **서버 재시작 시 모든 위치 초기화**: In-memory `Map` 설계 의도. Redis 도입 전까지 영속성 없음
- **색상 순환 충돌**: `PIN_COLORS` 8가지 순환 — 9번째 사용자부터 색상 중복 발생 (의도된 MVP 설계)
- **`socket.id` 변경 조건**: 네트워크 재연결 시 `socket.id` 변경 → 기존 핀 제거되고 새 핀 생성됨

### 좌표 시스템

- **방 좌표 오차**: 도면 이미지 픽셀 직접 측정으로 ±0.5 unit 오차 가능. 오차 발생 시 `map-data.js`에서 `x`, `z`, `w`, `d` 개별 조정
- **바닥 비율**: `FLOOR = { W:140, D:88 }` — 도면 원본 비율 유지. 임의 변경 시 모든 방 좌표 일괄 재계산 필요
- **방 클릭 Raycaster**: `roomMeshes` 배열 순서로 hit 탐지. 방이 겹칠 경우 앞쪽 방만 선택됨

### 채팅 / 말풍선

- **말풍선 animation 재시작**: CSS animation 재실행을 위해 `element.offsetHeight` reflow 강제 필요. 이 없으면 2번째 메시지부터 애니메이션 없음
- **핀 생성 전 메시지 수신**: 위치가 설정되지 않은 사용자의 채팅은 핀 없음 → `showChatBubble`이 300ms 후 재시도 1회

### 배포

- **Render 무료 티어 Cold Start**: 비활성 후 첫 요청에 30~60초 지연 발생. 사용자에게 로딩 시간 안내 권장
- **`process.env.PORT`**: 배포 플랫폼이 PORT 환경변수 주입. 로컬은 3001 기본값 사용
- **CORS**: 현재 설정 없음 (동일 서버에서 프론트/백 모두 서빙). CDN 분리 배포 시 CORS 설정 필요
