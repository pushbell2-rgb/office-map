import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { ROOMS, ROOM_TYPES, ENTRANCES, CORRIDORS, WALLS, DESKS, FACILITIES } from './map-data.js';

// ── 상수 ─────────────────────────────────────────────────────
const FLOOR = { W: 158, D: 100, CX: 79, CZ: 50 };
const SPAWN = { cx: 111, cz: 50, r: 8 }; // 입구 1·2 하단 스폰 원
const PIN_BALL_INDEX = 1;
const ARROW_STEP = 2.0;
const EMOJI_LIST = ['🙂','😎','🤔','🥳','😴','🤗','🦊','🐱','🐶','🦁','🐸','🦄','🐼','🎩','🤖'];

// ── 상태 ─────────────────────────────────────────────────────
const state = {
  pickingMode: false,
  hoveredMesh: null,
  flyTarget: null,
  myColor: '#ffffff',
  myEmoji: '🙂',
  myName: '익명',
  myId: null,
  joined: false,
  pendingRoom: null,       // URL ?room= 파라미터
  chatTimers: new Map(),   // userId → timerId (말풍선 자동 삭제용)
  activeFilter: null,      // 타입별 필터 (null = 전체)
  floorWasVisible: false,
  lastPos: null,           // 마지막 위치 (재연결 시 복구용)
};

// ── URL 파라미터 ──────────────────────────────────────────────
const urlRoom = new URLSearchParams(location.search).get('room');
if (urlRoom) state.pendingRoom = urlRoom;

// ── Three.js 핵심 ─────────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0f172a);
scene.fog = new THREE.FogExp2(0x0f172a, 0.008);

const container = document.getElementById('canvas-container');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.domElement.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none';
container.appendChild(labelRenderer.domElement);

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 500);
camera.position.set(FLOOR.CX, 80, FLOOR.D + 55);
camera.lookAt(FLOOR.CX, 0, FLOOR.CZ);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(FLOOR.CX, 0, FLOOR.CZ);
controls.maxPolarAngle = Math.PI / 2 - 0.02;
controls.minDistance = 10;
controls.maxDistance = 160;
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.touches = { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_PAN };
controls.mouseButtons = { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE };

// 사용자가 직접 조작하면 fly 애니메이션 즉시 취소
controls.addEventListener('start', () => { state.flyTarget = null; });

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const clock = new THREE.Clock();

// ── 씬 초기화 함수들 ─────────────────────────────────────────

function initLights() {
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const sun = new THREE.DirectionalLight(0xffffff, 1.0);
  sun.position.set(FLOOR.CX + 20, 80, FLOOR.CZ + 30);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { near: 0.5, far: 200, left: -100, right: 100, top: 80, bottom: -80 });
  scene.add(sun);
  const fill = new THREE.PointLight(0x6366f1, 0.8, 80);
  fill.position.set(20, 20, 20);
  scene.add(fill);
}

function initFloor() {
  const loader = new THREE.TextureLoader();
  const mapTex = loader.load('/public/map2.jpg', tex => {
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
  });
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(FLOOR.W, FLOOR.D),
    new THREE.MeshStandardMaterial({ map: mapTex, roughness: 0.9, metalness: 0.0 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(FLOOR.CX, 0, FLOOR.CZ);
  floor.receiveShadow = true;
  floor.name = 'floor';
  floor.visible = false; // 기본 숨김
  scene.add(floor);
  return floor;
}

function initRooms() {
  const meshes = [];
  ROOMS.forEach(room => {
    const typeInfo = ROOM_TYPES[room.type];
    const ROOM_H = room.type === 'lounge' ? 1.5 : 2.5;
    const cx = room.x + room.w / 2;
    const cz = room.z + room.d / 2;

    const geo = new THREE.BoxGeometry(room.w, ROOM_H, room.d);
    const mat = new THREE.MeshStandardMaterial({
      color: typeInfo.hex,
      transparent: true,
      opacity: room.type === 'lounge' ? 0.35 : 0.55,
      roughness: 0.6,
      metalness: 0.1,
      emissive: typeInfo.hex,
      emissiveIntensity: 0.08,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(cx, ROOM_H / 2, cz);
    mesh.castShadow = true;
    mesh.userData = { room, originalOpacity: mat.opacity, originalEmissive: 0.08 };
    scene.add(mesh);
    meshes.push(mesh);

    const line = new THREE.LineSegments(
      new THREE.EdgesGeometry(geo),
      new THREE.LineBasicMaterial({ color: typeInfo.hex, transparent: true, opacity: 0.9 })
    );
    line.position.copy(mesh.position);
    scene.add(line);

    const div = document.createElement('div');
    div.className = 'room-label';
    div.innerHTML = `<span class="rl-id">${room.id}</span><span class="rl-name">${room.name}</span>`;
    div.style.setProperty('--rc', typeInfo.color);
    const labelObj = new CSS2DObject(div);
    labelObj.position.set(0, ROOM_H + 0.5, 0);
    mesh.add(labelObj);
  });
  return meshes;
}

// 형광 동그라미 마커 — THREE.Sprite용 CanvasTexture (줌에 비례해 자연스럽게 크기 변화)
function makeCircleLabel(text, fillColor) {
  const SIZE = 512;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  const cx = SIZE / 2, cy = SIZE / 2, r = SIZE * 0.41;

  // 외부 방사형 글로우
  const grd = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 1.25);
  grd.addColorStop(0, fillColor + 'bb');
  grd.addColorStop(1, fillColor + '00');
  ctx.beginPath();
  ctx.arc(cx, cy, r * 1.25, 0, Math.PI * 2);
  ctx.fillStyle = grd;
  ctx.fill();

  // 메인 원
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = fillColor;
  ctx.globalAlpha = 0.92;
  ctx.fill();
  ctx.globalAlpha = 1;

  // 흰색 테두리
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.88)';
  ctx.lineWidth = SIZE * 0.025;
  ctx.stroke();

  // 텍스트
  const fontSize = Math.floor(SIZE * (text.length > 4 ? 0.155 : 0.195));
  ctx.font = `900 ${fontSize}px -apple-system, "Noto Sans KR", Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#060d02';
  ctx.fillText(text, cx, cy);

  return new THREE.CanvasTexture(canvas);
}

function initEntrances() {
  const animData = [];

  // 동그라미 반지름 (world units) — 화살표 끝점 기준
  const CIRCLE_R = 3.0;
  // 화살표 치수
  const SHAFT_L = 3.5, HEAD_L = 1.5;
  const SHAFT_R = 0.35, HEAD_R  = 1.0;
  const ARROW_Y = 0.5;
  // 화살표 꼬리 → 동그라미 테두리에 화살촉 끝이 닿도록 기점 계산
  const ARROW_ORIGIN_D = CIRCLE_R + SHAFT_L + HEAD_L; // = 8.0

  ENTRANCES.forEach(entry => {
    const isElevator = entry.type === 'elevator';
    const isExit     = entry.type === 'exit';
    // 형광색: 입구=네온 그린, 엘리베이터=네온 옐로, 비상구=네온 레드
    const color    = isElevator ? 0xffee00 : isExit ? 0xff3333 : 0x39ff14;
    const colorStr = isElevator ? '#ffee00' : isExit ? '#ff3333' : '#39ff14';

    const g = new THREE.Group();
    g.position.set(entry.x, 0, entry.z);
    scene.add(g);

    // ── 바닥 글로우 원 (시각적 위치 표시, 낮은 투명도) ──────────
    const glow = new THREE.Mesh(
      new THREE.CircleGeometry(CIRCLE_R * 1.1, 40),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.18, depthWrite: false })
    );
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = 0.04;
    g.add(glow);

    // ── 라벨: 비상구는 이모지 아이콘만, 나머지는 형광 동그라미 스프라이트 ──
    if (isExit) {
      const wrap = document.createElement('div');
      wrap.style.cssText = 'font-size:24px;line-height:1;pointer-events:none;user-select:none;';
      wrap.textContent = '🚨';
      const icon2d = new CSS2DObject(wrap);
      icon2d.position.set(0, 2.5, 0);
      g.add(icon2d);
    } else {
      const labelText = entry.callout || entry.name;
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: makeCircleLabel(labelText, colorStr), transparent: true, depthWrite: false })
      );
      sprite.scale.set(5, 5, 1);
      sprite.position.set(0, 2.5, 0);
      g.add(sprite);
    }

    // ── 방향 화살표 (동그라미 테두리에 화살촉 끝이 닿음) ──────
    if (entry.direction) {
      let dir, origin;
      if (entry.direction === 'z-') {
        dir    = new THREE.Vector3(0, 0, -1);
        origin = new THREE.Vector3(0, ARROW_Y, ARROW_ORIGIN_D);
      } else if (entry.direction === 'z+') {
        dir    = new THREE.Vector3(0, 0, 1);
        origin = new THREE.Vector3(0, ARROW_Y, -ARROW_ORIGIN_D);
      } else {
        dir    = new THREE.Vector3(-1, 0, 0);
        origin = new THREE.Vector3(ARROW_ORIGIN_D, ARROW_Y, 0);
      }

      // 샤프트
      const shaftCenter = origin.clone().addScaledVector(dir, SHAFT_L / 2);
      const shaft = new THREE.Mesh(
        new THREE.CylinderGeometry(SHAFT_R, SHAFT_R, SHAFT_L, 12),
        new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.55, transparent: true, opacity: 0.92 })
      );
      shaft.position.copy(shaftCenter);
      if (entry.direction === 'z-' || entry.direction === 'z+') shaft.rotation.x = Math.PI / 2;
      else                                                       shaft.rotation.z = -Math.PI / 2;
      g.add(shaft);

      // 화살촉 (끝점 = 동그라미 테두리)
      const headCenter = origin.clone().addScaledVector(dir, SHAFT_L + HEAD_L / 2);
      const head = new THREE.Mesh(
        new THREE.ConeGeometry(HEAD_R, HEAD_L, 12),
        new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.7, transparent: true, opacity: 0.98 })
      );
      head.position.copy(headCenter);
      if      (entry.direction === 'z-') head.rotation.x = -Math.PI / 2;
      else if (entry.direction === 'z+') head.rotation.x =  Math.PI / 2;
      else                               head.rotation.z =  Math.PI / 2;
      g.add(head);

      // 슬라이딩 쉐브론 (화살표 꼬리 → 동그라미 테두리까지)
      const chevEnd = origin.clone().addScaledVector(dir, SHAFT_L + HEAD_L);
      const chevrons = [];
      for (let i = 0; i < 3; i++) {
        const chev = new THREE.Mesh(
          new THREE.ConeGeometry(0.58, 0.85, 8),
          new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false })
        );
        if      (entry.direction === 'z-') chev.rotation.x = -Math.PI / 2;
        else if (entry.direction === 'z+') chev.rotation.x =  Math.PI / 2;
        else                               chev.rotation.z =  Math.PI / 2;
        chev.position.copy(origin);
        g.add(chev);
        chevrons.push(chev);
      }
      animData.push({ chevrons, startPos: origin.clone(), endPos: chevEnd.clone() });
    }
  });

  return animData;
}

function makePin(color) {
  const g = new THREE.Group();
  const c = new THREE.Color(color);

  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.18, 2.8, 10),
    new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.3 })
  );
  stem.position.y = 1.4;
  g.add(stem); // [0]

  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(0.75, 20, 20),
    new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.6, roughness: 0.3 })
  );
  ball.position.y = 3.3;
  g.add(ball); // [1] = PIN_BALL_INDEX

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(1.2, 20),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.25 })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  g.add(shadow); // [2]

  return g;
}

function initSpawnZone() {
  const { cx, cz, r } = SPAWN;
  // 반투명 원형 채우기
  const fill = new THREE.Mesh(
    new THREE.CircleGeometry(r, 48),
    new THREE.MeshBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0.05, depthWrite: false })
  );
  fill.rotation.x = -Math.PI / 2;
  fill.position.set(cx, 0.04, cz);
  scene.add(fill);
  // 외곽 링 (펄싱 애니메이션용)
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(r - 0.15, r + 0.15, 48),
    new THREE.MeshBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(cx, 0.05, cz);
  scene.add(ring);
  return ring;
}

function initCorridors() {
  CORRIDORS.forEach(cor => {
    const cx = cor.x + cor.w / 2, cz = cor.z + cor.d / 2;
    // 흰색 반투명 바닥
    const fill = new THREE.Mesh(
      new THREE.PlaneGeometry(cor.w, cor.d),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.32, depthWrite: false })
    );
    fill.rotation.x = -Math.PI / 2;
    fill.position.set(cx, 0.06, cz);
    scene.add(fill);
    // 흰색 테두리 선
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.PlaneGeometry(cor.w, cor.d)),
      new THREE.LineBasicMaterial({ color: 0xe2e8f0, transparent: true, opacity: 0.55 })
    );
    edges.rotation.x = -Math.PI / 2;
    edges.position.set(cx, 0.07, cz);
    scene.add(edges);
  });
}

function initWalls() {
  const WALL_H = 3.2;
  WALLS.forEach(wall => {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(wall.w, WALL_H, wall.d),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.95, metalness: 0.05,
        emissive: 0x1e293b, emissiveIntensity: 0.2 })
    );
    mesh.position.set(wall.x + wall.w / 2, WALL_H / 2, wall.z + wall.d / 2);
    mesh.castShadow = true;
    scene.add(mesh);
    const line = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(wall.w, WALL_H, wall.d)),
      new THREE.LineBasicMaterial({ color: 0x334155, transparent: true, opacity: 0.6 })
    );
    line.position.copy(mesh.position);
    scene.add(line);
  });
}

function initDesks() {
  DESKS.forEach(desk => {
    const cx = desk.x + desk.w / 2, cz = desk.z + desk.d / 2;
    const fill = new THREE.Mesh(
      new THREE.PlaneGeometry(desk.w, desk.d),
      new THREE.MeshBasicMaterial({ color: 0xfb7185, transparent: true, opacity: 0.18, depthWrite: false })
    );
    fill.rotation.x = -Math.PI / 2;
    fill.position.set(cx, 0.05, cz);
    scene.add(fill);
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.PlaneGeometry(desk.w, desk.d)),
      new THREE.LineBasicMaterial({ color: 0xfb7185, transparent: true, opacity: 0.35 })
    );
    edges.rotation.x = -Math.PI / 2;
    edges.position.set(cx, 0.055, cz);
    scene.add(edges);
    const div = document.createElement('div');
    div.className = 'desk-label';
    div.textContent = '💼 desk';
    const labelObj = new CSS2DObject(div);
    labelObj.position.set(cx, 0.5, cz);
    scene.add(labelObj);
  });
}

function initFacilities() {
  FACILITIES.forEach(fac => {
    const isToilet = fac.type === 'toilet';
    const color   = isToilet ? 0x60a5fa : 0xf59e0b;
    const g = new THREE.Group();
    g.position.set(fac.x, 0, fac.z);
    scene.add(g);
    const marker = new THREE.Mesh(
      new THREE.PlaneGeometry(2.2, 2.2),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.28, depthWrite: false })
    );
    marker.rotation.x = -Math.PI / 2;
    marker.position.y = 0.06;
    g.add(marker);
    const div = document.createElement('div');
    div.className = `facility-label facility-${fac.type}`;
    div.textContent = isToilet ? '🚾' : '📞';
    const labelObj = new CSS2DObject(div);
    labelObj.position.set(0, 2.0, 0);
    g.add(labelObj);
  });
}

// ── 길찾기 (A*) ──────────────────────────────────────────────
const GRID_RES  = 2;
const GRID_COLS = Math.ceil(FLOOR.W / GRID_RES); // 70
const GRID_ROWS = Math.ceil(FLOOR.D / GRID_RES); // 44
let navGrid = null;

function buildNavGrid() {
  const walkable = new Uint8Array(GRID_COLS * GRID_ROWS);
  const walkAreas = [
    ...CORRIDORS,
    ...ROOMS.filter(r => r.type === 'lounge'),
  ];
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const wx = col * GRID_RES + GRID_RES * 0.5;
      const wz = row * GRID_RES + GRID_RES * 0.5;
      for (const area of walkAreas) {
        if (wx >= area.x && wx < area.x + area.w && wz >= area.z && wz < area.z + area.d) {
          walkable[row * GRID_COLS + col] = 1;
          break;
        }
      }
    }
  }
  return walkable;
}

function findNearestWalkableCell(col, row) {
  if (!navGrid) navGrid = buildNavGrid();
  col = Math.max(0, Math.min(GRID_COLS - 1, col));
  row = Math.max(0, Math.min(GRID_ROWS - 1, row));
  if (navGrid[row * GRID_COLS + col]) return [col, row];
  for (let r = 1; r < 30; r++) {
    for (let dc = -r; dc <= r; dc++) {
      for (let dr = -r; dr <= r; dr++) {
        if (Math.abs(dc) !== r && Math.abs(dr) !== r) continue;
        const nc = col + dc, nr = row + dr;
        if (nc < 0 || nc >= GRID_COLS || nr < 0 || nr >= GRID_ROWS) continue;
        if (navGrid[nr * GRID_COLS + nc]) return [nc, nr];
      }
    }
  }
  return [col, row];
}

function astarPath(fromX, fromZ, toX, toZ) {
  if (!navGrid) navGrid = buildNavGrid();
  const [sc, sr] = findNearestWalkableCell(Math.floor(fromX / GRID_RES), Math.floor(fromZ / GRID_RES));
  const [ec, er] = findNearestWalkableCell(Math.floor(toX / GRID_RES),   Math.floor(toZ / GRID_RES));
  const N = GRID_COLS * GRID_ROWS;
  const gScore = new Float32Array(N).fill(Infinity);
  const parent = new Int32Array(N).fill(-1);
  const closed = new Uint8Array(N);
  const key = (c, r) => r * GRID_COLS + c;
  const h   = (c, r) => Math.abs(c - ec) + Math.abs(r - er);
  const startK = key(sc, sr);
  gScore[startK] = 0;
  const open = [[h(sc, sr), sc, sr]];
  const DIRS = [[-1,0,1],[1,0,1],[0,-1,1],[0,1,1],[-1,-1,1.414],[-1,1,1.414],[1,-1,1.414],[1,1,1.414]];

  while (open.length > 0) {
    open.sort((a, b) => a[0] - b[0]);
    const [, col, row] = open.shift();
    const k = key(col, row);
    if (closed[k]) continue;
    closed[k] = 1;
    if (col === ec && row === er) {
      const path = [];
      let ck = k;
      while (ck !== -1) {
        const c2 = ck % GRID_COLS;
        const r2 = Math.floor(ck / GRID_COLS);
        path.unshift(new THREE.Vector3(c2 * GRID_RES + GRID_RES * 0.5, 0.13, r2 * GRID_RES + GRID_RES * 0.5));
        ck = parent[ck];
      }
      return path;
    }
    for (const [dc, dr, cost] of DIRS) {
      const nc = col + dc, nr = row + dr;
      if (nc < 0 || nc >= GRID_COLS || nr < 0 || nr >= GRID_ROWS) continue;
      const nk = key(nc, nr);
      if (closed[nk] || !navGrid[nk]) continue;
      const ng = gScore[k] + cost;
      if (ng < gScore[nk]) {
        gScore[nk] = ng;
        parent[nk] = k;
        open.push([ng + h(nc, nr), nc, nr]);
      }
    }
  }
  return null;
}

// ── 회의실 강조 (클릭 선택 / 경로 목적지) ────────────────────
let highlightMesh = null;
let highlightOrigIntensity = 0.08;
let highlightOrigOpacity   = 0.55;

function setRoomHighlight(room) {
  clearRoomHighlight();
  const mesh = roomMeshes.find(m => m.userData.room.id === room.id);
  if (!mesh) return;
  highlightMesh            = mesh;
  highlightOrigIntensity   = mesh.userData.originalEmissive;
  highlightOrigOpacity     = mesh.userData.originalOpacity;
  mesh.material.opacity    = Math.min(0.98, highlightOrigOpacity + 0.35);
}

function clearRoomHighlight() {
  if (!highlightMesh) return;
  highlightMesh.material.emissiveIntensity = highlightOrigIntensity;
  highlightMesh.material.opacity           = highlightOrigOpacity;
  highlightMesh = null;
}

// ── 경로 표시 / 제거 ─────────────────────────────────────────
let pathGroup = null;
// 화살표 방향 갱신용: { inner: HTMLElement, from: THREE.Vector3, to: THREE.Vector3 }
const pathArrows = [];

function showPath(points) {
  clearPath();
  if (!points || points.length < 2) return;
  pathGroup = new THREE.Group();

  // 빨간 선 (경로 전체)
  const lineGeo = new THREE.BufferGeometry().setFromPoints(
    points.map(p => new THREE.Vector3(p.x, 0.28, p.z))
  );
  pathGroup.add(new THREE.Line(lineGeo,
    new THREE.LineBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.7 })
  ));

  // CSS2D 화살표 — from/to를 저장해두고 animate 루프에서 project(camera)로 화면 방향 계산
  // wrap: CSS2DRenderer가 위치 제어 / inner: 회전 담당 (transform 충돌 방지)
  const addArrow = (ax, az, dx, dz) => {
    const len = Math.hypot(dx, dz);
    const wrap = document.createElement('div');
    const inner = document.createElement('div');
    inner.className = 'path-arrow';
    wrap.appendChild(inner);
    const obj = new CSS2DObject(wrap);
    obj.position.set(ax, 0.5, az);
    pathGroup.add(obj);
    // 화면 투영용: 화살표 중심(from)과 진행 방향 1unit 앞(to)
    pathArrows.push({
      inner,
      from: new THREE.Vector3(ax, 0.5, az),
      to:   new THREE.Vector3(ax + dx / len, 0.5, az + dz / len),
    });
  };

  const STEP = Math.max(2, Math.floor(points.length / 18));
  for (let i = 0; i < points.length - 1; i += STEP) {
    const p    = points[i];
    const next = points[Math.min(i + STEP, points.length - 1)];
    const dx = next.x - p.x, dz = next.z - p.z;
    if (Math.hypot(dx, dz) < 0.01) continue;
    addArrow((p.x + next.x) / 2, (p.z + next.z) / 2, dx, dz);
  }

  // 마지막 화살표 (목적지 방향)
  const last2 = points[points.length - 2];
  const last  = points[points.length - 1];
  const fdx = last.x - last2.x, fdz = last.z - last2.z;
  if (Math.hypot(fdx, fdz) > 0.01) {
    addArrow(last.x, last.z, fdx, fdz);
  }

  scene.add(pathGroup);
}

function clearPath() {
  if (!pathGroup) return;
  // CSS2DObject의 DOM 요소를 직접 제거 — scene.remove만으로는 DOM에 남아 고정되는 버그 방지
  pathGroup.traverse(o => {
    if (o.isCSS2DObject && o.element?.parentNode) {
      o.element.parentNode.removeChild(o.element);
    }
    if (o.geometry) o.geometry.dispose();
    if (o.material) o.material.dispose();
  });
  scene.remove(pathGroup);
  pathGroup = null;
  pathArrows.length = 0;
  clearRoomHighlight();
}

// 헥톤입구(ENT-1) 강제 경유 구역 — A*로 경로를 찾더라도 반드시 ENT-1을 거침
const HEKTON_FORCE_IDS = new Set(['M-12', 'M-11', 'M-10', 'P-1']);

// ENT-1(헥톤입구) 경유 fallback 포함 경로 계산
function getNavPath(fromX, fromZ, toX, toZ, toRoomId = null) {
  const forceEnt1 = toRoomId && HEKTON_FORCE_IDS.has(toRoomId);
  if (!forceEnt1) {
    const direct = astarPath(fromX, fromZ, toX, toZ);
    if (direct) return direct;
  }
  // 복도 없는 헥톤 구역: ENT-1까지 복도 경유 후 직선
  const ent = ENTRANCES.find(e => e.id === 'ENT-1');
  if (!ent) return null;
  const toEnt = astarPath(fromX, fromZ, ent.x, ent.z);
  if (!toEnt) return null;
  const steps = Math.max(4, Math.ceil(Math.hypot(toX - ent.x, toZ - ent.z) / 2));
  const tail = [];
  for (let i = 0; i <= steps; i++) {
    const t2 = i / steps;
    tail.push(new THREE.Vector3(ent.x + (toX - ent.x) * t2, 0.13, ent.z + (toZ - ent.z) * t2));
  }
  return [...toEnt, ...tail.slice(1)];
}

function getSpawnPosition() {
  const existing = [];
  userPins.forEach(pin => existing.push({ x: pin.position.x, z: pin.position.z }));
  for (let i = 0; i < 60; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist  = Math.sqrt(Math.random()) * SPAWN.r;
    const x = SPAWN.cx + dist * Math.cos(angle);
    const z = SPAWN.cz + dist * Math.sin(angle);
    if (existing.every(p => Math.hypot(p.x - x, p.z - z) >= 2.5)) return { x, z };
  }
  // 60회 실패 시 원 안 랜덤
  const a = Math.random() * Math.PI * 2;
  return { x: SPAWN.cx + Math.random() * SPAWN.r * Math.cos(a), z: SPAWN.cz + Math.random() * SPAWN.r * Math.sin(a) };
}

// ── 씬 구성 실행 ─────────────────────────────────────────────
initLights();
const floor = initFloor();
initCorridors();
initWalls();
initDesks();
initFacilities();
const roomMeshes = initRooms();
const entranceAnimData = initEntrances();
const spawnRing = initSpawnZone();
const userPins = new Map();

// ── 바닥 그리드 (3D 원근감 강화) ──────────────────────────────
(function initSceneGrid() {
  const SIZE = Math.max(FLOOR.W, FLOOR.D) * 1.2;
  // 주 그리드 (큰 칸)
  const grid = new THREE.GridHelper(SIZE, 14, 0x6366f1, 0x334155);
  grid.position.set(FLOOR.CX, 0.02, FLOOR.CZ);
  const m1 = grid.material;
  m1.transparent = true;
  m1.opacity = 0.40;
  m1.depthWrite = false;
  scene.add(grid);
  // 보조 그리드 (세밀한 칸)
  const grid2 = new THREE.GridHelper(SIZE, 42, 0x334155, 0x334155);
  grid2.position.set(FLOOR.CX, 0.01, FLOOR.CZ);
  const m2 = grid2.material;
  m2.transparent = true;
  m2.opacity = 0.20;
  m2.depthWrite = false;
  scene.add(grid2);
})();

// ── 연결 끊김 상태 관리 ───────────────────────────────────────
const disconnectedPins = new Set();

// ── 모바일 조이스틱 상태 ──────────────────────────────────────
const pinJoystick = { active: false, id: -1, bx: 0, by: 0, dx: 0, dy: 0, fast: false };
const camJoystick = { active: false, id: -1, bx: 0, by: 0, dx: 0, dy: 0, fast: false };
let lastPinEmit = 0;

// ── 채팅 최근 메시지 (유저 목록 표시용) ──────────────────────
const userLastChat = new Map(); // userId → message

// ── 조이스틱 위치 동기화 (팝업 실제 높이 기준으로 위로 이동)
function syncJoystickPos() {
  const mc = document.querySelector('.mobile-controls');
  if (!mc) return;
  const chatEl  = document.getElementById('chat-bar');
  const panelEl = document.getElementById('room-info-panel');
  const chatH   = !chatEl.hidden  ? chatEl.offsetHeight  + 14 : 0;
  const panelH  = !panelEl.hidden ? panelEl.offsetHeight + 14 : 0;
  mc.style.setProperty('--jpad-extra', Math.max(chatH, panelH) + 'px');
}

// ── 나침반 ────────────────────────────────────────────────────
const compassRingEl = document.getElementById('compass-ring');
let lastCompassTheta = null;

function removePinFromScene(id) {
  const pin = userPins.get(id);
  if (!pin) return;
  scene.remove(pin);
  userPins.delete(id);
  disconnectedPins.delete(id);
}

// ── 유저 핀 동기화 ────────────────────────────────────────────
function syncPins(users) {
  for (const [id] of userPins) {
    const user = users.find(u => u.id === id);
    // 완전 퇴장 또는 연결 끊김 → 핀 즉시 제거
    if (!user || user.disconnected) removePinFromScene(id);
  }
  users.forEach(user => {
    if (user.disconnected) return; // 오프라인 사용자는 핀 없음
    if (user.x === null || user.z === null) return;

    if (!userPins.has(user.id)) {
      const pin = makePin(user.color);

      // 말풍선 + 이름을 하나의 컨테이너로 (bubble 위, name 아래 — 가림 없음)
      const wrapDiv = document.createElement('div');
      wrapDiv.className = 'pin-label-wrap';

      const bubbleDiv = document.createElement('div');
      bubbleDiv.className = 'chat-bubble';
      bubbleDiv.style.display = 'none';
      wrapDiv.appendChild(bubbleDiv);

      const nameDiv = document.createElement('div');
      nameDiv.className = 'user-label';
      nameDiv.style.borderColor = user.color;
      nameDiv.style.color = user.color;
      wrapDiv.appendChild(nameDiv);

      const pinLabel = new CSS2DObject(wrapDiv);
      pinLabel.position.set(0, 4.8, 0);
      pin.add(pinLabel); // [3]
      pin.userData.nameDiv = nameDiv;
      pin.userData.bubbleDiv = bubbleDiv;

      scene.add(pin);
      userPins.set(user.id, pin);
    }

    const pin = userPins.get(user.id);
    pin.position.set(user.x, 0, user.z);

    // 내 핀 강조 (첫 확인 시 1회 적용)
    if (user.id === state.myId && !pin.userData.meRingAdded) {
      pin.scale.setScalar(1.5);
      const meRing = new THREE.Mesh(
        new THREE.RingGeometry(1.5, 2.1, 32),
        new THREE.MeshBasicMaterial({ color: user.color, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false })
      );
      meRing.rotation.x = -Math.PI / 2;
      meRing.position.y = 0.03;
      pin.add(meRing);
      pin.userData.meRing = meRing;
      pin.userData.meRingAdded = true;
    }

    // 이름/이모지 업데이트
    const emoji = user.emoji || '🙂';
    const meTag = user.id === state.myId ? '<span class="me-tag">나</span>' : '';
    pin.userData.nameDiv.innerHTML = `<span style="margin-right:3px">${emoji}</span>${user.name}${meTag}`;
  });
  renderUserList(users);
}

// ── 채팅 메시지 수신 ─────────────────────────────────────────
const socket = io();

function showChatBubble(id, message, color) {
  const pin = userPins.get(id);
  if (!pin || !pin.userData.bubbleDiv) return false;

  // 기존 타이머 취소
  if (state.chatTimers.has(id)) {
    clearTimeout(state.chatTimers.get(id));
  }

  const bubbleDiv = pin.userData.bubbleDiv;
  const sender = _cachedUsers.find(u => u.id === id);
  const senderEmoji = sender?.emoji || '';
  bubbleDiv.textContent = senderEmoji ? `${senderEmoji} ${message}` : message;
  bubbleDiv.style.borderColor = color;

  // 애니메이션 강제 재실행 (기존 메시지 위에 새 메시지가 올 때도 동작)
  bubbleDiv.style.display = 'none';
  bubbleDiv.style.animation = 'none';
  // eslint-disable-next-line no-unused-expressions
  bubbleDiv.offsetHeight; // reflow 강제
  bubbleDiv.style.animation = '';
  bubbleDiv.style.display = 'block';

  // 타이머 없이 영구 표시 — 다음 메시지가 오면 교체
  state.chatTimers.delete(id);
  return true;
}

// ── 모바일 플로팅 채팅 로그 ───────────────────────────────────
const chatLogEl = document.getElementById('chat-log');
const MAX_CHAT_LOG = 8;

function addChatLogEntry(id, message, color) {
  if (!chatLogEl) return;
  const user = _cachedUsers.find(u => u.id === id);
  const name  = user?.name  || '익명';
  const emoji = user?.emoji || '🙂';

  const entry = document.createElement('div');
  entry.className = 'cle';
  entry.innerHTML =
    `<span class="cle-name" style="color:${color}">${emoji} ${name}</span>` +
    `<span class="cle-msg">${message}</span>`;
  chatLogEl.appendChild(entry);

  // 최대 개수 초과 시 오래된 항목 제거
  while (chatLogEl.children.length > MAX_CHAT_LOG) {
    chatLogEl.removeChild(chatLogEl.firstChild);
  }

  // 15초 후 페이드 아웃
  setTimeout(() => {
    entry.style.transition = 'opacity .4s';
    entry.style.opacity = '0';
    setTimeout(() => entry.remove(), 400);
  }, 15000);
}

socket.on('chat-message', ({ id, message, color }) => {
  // 핀이 아직 생성되지 않은 경우 300ms 후 재시도
  if (!showChatBubble(id, message, color)) {
    setTimeout(() => showChatBubble(id, message, color), 300);
  }
  // 모바일 플로팅 채팅 로그
  addChatLogEntry(id, message, color);
  // 유저 목록에 마지막 채팅 영구 표시 (유저 퇴장 시 삭제)
  userLastChat.set(id, message);
  renderUserListFromCache();
});

function checkOnboarding() {
  if (!localStorage.getItem('lf-onboarded')) {
    document.getElementById('onboard-overlay').hidden = false;
  }
}
// ?키 재오픈 포함 항상 동작하도록 리스너 분리
document.getElementById('onboard-close').addEventListener('click', () => {
  document.getElementById('onboard-overlay').hidden = true;
  localStorage.setItem('lf-onboarded', '1');
});

socket.on('joined', ({ color }) => {
  state.myColor = color;
  state.myId = socket.id;
  state.joined = true;

  // 재연결인 경우 마지막 위치 복원, 최초 접속은 스폰 위치
  const pos = state.lastPos ?? getSpawnPosition();
  emitLocation(pos.x, pos.z);

  updateProfileBtn();
  if (!urlRoom && !state.lastPos) checkOnboarding(); // 재연결 시 온보딩 생략
  if (urlRoom) {
    setTimeout(() => highlightRoomById(urlRoom), 700);
  }
  // 모바일: 내 위치로 카메라 이동 (줌 유지)
  if (window.innerWidth <= 768) {
    setTimeout(() => flyToRoom(pos.x, pos.z), 300);
  }
});

socket.on('users-update', syncPins);
socket.on('connect_error', () => console.warn('[소켓] 연결 실패, 재시도 중...'));

// ── 연결 끊김 / 재연결 ───────────────────────────────────────
const reconnectBanner = document.getElementById('reconnect-banner');

socket.on('disconnect', () => {
  reconnectBanner.hidden = false;
});

socket.on('connect', () => {
  reconnectBanner.hidden = true;
  // 재연결 시 세션 자동 복구
  if (state.joined) {
    state.myId = socket.id;
    socket.emit('join', { name: state.myName, emoji: state.myEmoji });
  }
});

document.getElementById('reconnect-btn').addEventListener('click', () => {
  socket.connect();
});

// ── 위치 이동 (lastPos 자동 저장) ────────────────────────────
function emitLocation(x, z) {
  state.lastPos = { x, z };
  socket.emit('set-location', { x, z });
}

// ── 카메라 fly-to ─────────────────────────────────────────────
function flyTo(tx, tz, height = 22) {
  state.flyTarget = {
    pos: new THREE.Vector3(tx, height, tz + 26),
    look: new THREE.Vector3(tx, 0, tz),
  };
}

// 현재 줌 레벨·각도를 유지하며 대상 위치로만 이동 (확대 없음)
function flyToRoom(tx, tz) {
  const offset = new THREE.Vector3().subVectors(camera.position, controls.target);
  state.flyTarget = {
    pos:  new THREE.Vector3(tx, 0, tz).add(offset),
    look: new THREE.Vector3(tx, 0, tz),
  };
}

function rotateCamera(deltaTheta, deltaPhi) {
  const offset = new THREE.Vector3().subVectors(camera.position, controls.target);
  const spherical = new THREE.Spherical().setFromVector3(offset);
  spherical.theta += deltaTheta;
  spherical.phi = Math.max(0.05, Math.min(Math.PI / 2 - 0.02, spherical.phi + deltaPhi));
  offset.setFromSpherical(spherical);
  camera.position.copy(controls.target).add(offset);
  camera.lookAt(controls.target);
  controls.update();
}

// ── 회의실 하이라이트 ─────────────────────────────────────────
function highlightRoomById(roomId) {
  const mesh = roomMeshes.find(m => m.userData.room.id === roomId);
  if (!mesh) return;
  flyToRoom(mesh.userData.room.x + mesh.userData.room.w / 2, mesh.userData.room.z + mesh.userData.room.d / 2);
  showRoomInfo(mesh.userData.room);
  flashRoom(mesh);
}

// 링크 유입 강조 — 느린 색상 맥박 (황금색, 0.5Hz, 8초)
function flashRoom(mesh) {
  const origIntensity  = mesh.userData.originalEmissive;
  const origColor      = mesh.material.emissive.clone();
  const highlightColor = new THREE.Color(0xffd700); // 황금색 강조
  const DURATION   = 8000;
  const FADE_START = 5500; // 5.5초 이후 서서히 원래 상태로
  const start = performance.now();

  if (mesh.userData.flashCancel) mesh.userData.flashCancel();
  let raf;

  function tick(now) {
    const elapsed = now - start;
    if (elapsed >= DURATION) {
      mesh.material.emissive.copy(origColor);
      mesh.material.emissiveIntensity = origIntensity;
      mesh.userData.flashCancel = null;
      return;
    }

    // 감쇠 (5.5초 이후 1→0)
    const decay = elapsed < FADE_START
      ? 1.0
      : 1.0 - (elapsed - FADE_START) / (DURATION - FADE_START);

    // 0.5Hz 느린 사인 맥박 (2초 주기)
    const wave = 0.5 + 0.5 * Math.sin(elapsed * 0.00314); // π/1000 ≈ 0.5Hz

    // 황금색으로 보간 + 밝기 강조
    mesh.material.emissive.lerpColors(origColor, highlightColor, wave * decay);
    mesh.material.emissiveIntensity = (origIntensity + wave * 1.6) * decay + origIntensity * (1 - decay);

    raf = requestAnimationFrame(tick);
  }

  mesh.userData.flashCancel = () => cancelAnimationFrame(raf);
  raf = requestAnimationFrame(tick);
}

// ── 드래그 판별 (클릭 vs 패닝) ───────────────────────────────
const DRAG_THRESHOLD = 6; // px 이상 움직이면 드래그로 간주
let _pointerDownX = 0, _pointerDownY = 0, _didDrag = false;

renderer.domElement.addEventListener('mousedown', e => {
  _pointerDownX = e.clientX; _pointerDownY = e.clientY; _didDrag = false;
});
renderer.domElement.addEventListener('mousemove', e => {
  if (e.buttons > 0 && Math.hypot(e.clientX - _pointerDownX, e.clientY - _pointerDownY) > DRAG_THRESHOLD)
    _didDrag = true;
});
renderer.domElement.addEventListener('touchstart', e => {
  if (e.touches.length === 1) {
    _pointerDownX = e.touches[0].clientX; _pointerDownY = e.touches[0].clientY; _didDrag = false;
  }
}, { passive: true });

// ── 인터랙션: 마우스 ──────────────────────────────────────────
function getMouseNDC(e) {
  const rect = renderer.domElement.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
    y: -((e.clientY - rect.top) / rect.height) * 2 + 1,
  };
}

renderer.domElement.addEventListener('mousemove', (e) => {
  const { x, y } = getMouseNDC(e);
  mouse.set(x, y);
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(roomMeshes);

  if (state.hoveredMesh && (hits.length === 0 || hits[0].object !== state.hoveredMesh)) {
    state.hoveredMesh.material.emissiveIntensity = 0.08;
    state.hoveredMesh = null;
    renderer.domElement.style.cursor = state.pickingMode ? 'crosshair' : 'default';
  }
  if (hits.length > 0) {
    state.hoveredMesh = hits[0].object;
    state.hoveredMesh.material.emissiveIntensity = 0.4;
    renderer.domElement.style.cursor = 'pointer';
  }
});

renderer.domElement.addEventListener('click', (e) => {
  if (_didDrag) return; // 드래그 후 click 이벤트 무시
  const { x, y } = getMouseNDC(e);
  mouse.set(x, y);
  raycaster.setFromCamera(mouse, camera);

  const roomHits = raycaster.intersectObjects(roomMeshes);
  if (roomHits.length > 0) {
    showRoomInfo(roomHits[0].object.userData.room);
    return;
  }

  if (state.pickingMode) {
    const floorHit = raycaster.intersectObject(floor);
    if (floorHit.length > 0) {
      const { x: fx, z: fz } = floorHit[0].point;
      emitLocation(fx, fz);
      exitPickMode();
    }
  }
});

// ── 모바일 터치 지원 ─────────────────────────────────────────
renderer.domElement.addEventListener('touchend', (e) => {
  if (!state.joined || e.changedTouches.length !== 1) return;
  const touch = e.changedTouches[0];
  // 터치 이동 거리가 임계값 초과 시 드래그로 간주, 팝업 무시
  if (Math.hypot(touch.clientX - _pointerDownX, touch.clientY - _pointerDownY) > DRAG_THRESHOLD) return;
  const rect = renderer.domElement.getBoundingClientRect();
  const tx = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
  const ty = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
  mouse.set(tx, ty);
  raycaster.setFromCamera(mouse, camera);

  // 방 터치 → 정보 패널
  const roomHits = raycaster.intersectObjects(roomMeshes);
  if (roomHits.length > 0) {
    showRoomInfo(roomHits[0].object.userData.room);
    return;
  }

  // 위치 설정 모드에서 바닥 터치 → 핀 이동
  if (state.pickingMode) {
    const floorHit = raycaster.intersectObject(floor);
    if (floorHit.length > 0) {
      const { x: fx, z: fz } = floorHit[0].point;
      emitLocation(fx, fz);
      exitPickMode();
    }
  }
}, { passive: true });

// ── 키보드 이벤트 ─────────────────────────────────────────────
window.addEventListener('keydown', e => {
  const tag = document.activeElement?.tagName;
  const isTyping = tag === 'INPUT' || tag === 'TEXTAREA';

  // 방향키: 내 위치 이동
  if (!isTyping && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
    if (!state.joined) return;
    e.preventDefault();
    const pin = userPins.get(state.myId);
    const cx = pin ? pin.position.x : FLOOR.CX;
    const cz = pin ? pin.position.z : FLOOR.CZ;
    let nx = cx, nz = cz;
    if (e.key === 'ArrowUp')    nz -= ARROW_STEP;
    if (e.key === 'ArrowDown')  nz += ARROW_STEP;
    if (e.key === 'ArrowLeft')  nx -= ARROW_STEP;
    if (e.key === 'ArrowRight') nx += ARROW_STEP;
    nx = Math.max(0, Math.min(FLOOR.W, nx));
    nz = Math.max(0, Math.min(FLOOR.D, nz));
    emitLocation(nx, nz);
    return;
  }

  // T키: 채팅 입력창 포커스
  if (!isTyping && (e.key === 't' || e.key === 'T')) {
    if (!state.joined) return;
    e.preventDefault();
    openChatBar();
    return;
  }

  // G키: 디버그 그리드
  if (!isTyping && (e.key === 'g' || e.key === 'G')) {
    const next = !debugGrid.visible;
    debugGrid.visible = next;
    debugGridZ.visible = next;
  }

  // ESC키: pick 모드 종료 / 방 정보 패널 닫기 / 채팅바 닫기
  if (e.key === 'Escape') {
    if (state.pickingMode) exitPickMode();
    document.getElementById('room-info-panel').hidden = true;
    document.getElementById('chat-bar').hidden = true;
    syncJoystickPos();
    return;
  }

  // ?키: 온보딩 가이드 다시 보기
  if (!isTyping && e.key === '?') {
    const ov = document.getElementById('onboard-overlay');
    ov.hidden = !ov.hidden;
  }

  // /키: 검색창 포커스
  if (!isTyping && e.key === '/') {
    e.preventDefault();
    const input = document.getElementById('search-input');
    input.focus();
    input.select();
  }
});

// ── 채팅 입력 ─────────────────────────────────────────────────
function submitChat() {
  const input = document.getElementById('chat-input');
  const msg = input.value.trim().slice(0, 20);
  if (msg && state.joined) socket.emit('chat', { message: msg });
  input.value = '';
  document.getElementById('chat-bar').hidden = true;
  input.blur();
  syncJoystickPos();
}

document.getElementById('chat-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); submitChat(); }
  if (e.key === 'Escape') {
    e.target.value = '';
    document.getElementById('chat-bar').hidden = true;
    e.target.blur();
    syncJoystickPos();
  }
});

document.getElementById('chat-send-btn').addEventListener('click', submitChat);

document.getElementById('chat-input').addEventListener('blur', () => {
  // 전송 버튼 클릭(터치) 시 blur → click 순서로 발생하므로 click 먼저 처리되게 대기
  setTimeout(() => {
    document.getElementById('chat-bar').hidden = true;
    syncJoystickPos();
  }, 150);
});

// ── 도면 토글 ────────────────────────────────────────────────
document.getElementById('floor-toggle-btn').addEventListener('click', () => {
  floor.visible = !floor.visible;
  document.getElementById('floor-toggle-btn').textContent = floor.visible ? '🗺 도면 숨기기' : '🗺 도면 보기';
});

// ── 방 정보 패널 ─────────────────────────────────────────────
function showRoomInfo(room) {
  clearPath(); // 다른 방 선택 시 이전 경로 + 강조 해제
  setRoomHighlight(room); // 선택된 방 3D 박스 강조
  const ti = ROOM_TYPES[room.type];
  const panel = document.getElementById('room-info-panel');
  panel.style.borderTopColor = ti.color;
  panel.querySelector('.ri-id').textContent = room.id;
  panel.querySelector('.ri-name').textContent = room.name;
  panel.querySelector('.ri-type').innerHTML =
    `<span class="ri-type-dot" style="background:${ti.color}"></span>${ti.label}`;
  panel.querySelector('.ri-type').style.color = ti.color;
  panel.querySelector('.ri-nav').onclick = () => flyTo(room.x + room.w / 2, room.z + room.d / 2);

  // 링크 복사 버튼
  const linkBtn = panel.querySelector('.ri-link');
  linkBtn.textContent = '🔗 링크 복사';
  linkBtn.classList.remove('copied');
  linkBtn.onclick = () => {
    const url = `${location.origin}${location.pathname}?room=${encodeURIComponent(room.id)}`;
    navigator.clipboard.writeText(url).then(() => {
      linkBtn.textContent = '✓ 복사됨';
      linkBtn.classList.add('copied');
      setTimeout(() => { linkBtn.textContent = '🔗 링크 복사'; linkBtn.classList.remove('copied'); }, 2000);
    });
  };

  // 출발지 선택 버튼 (라운지에서 경로 안내)
  panel.querySelectorAll('.ri-nav-from').forEach(b => b.remove());
  if (!['LOUNGE-1', 'LOUNGE-2'].includes(room.id)) {
    const riActions = panel.querySelector('.ri-actions');
    [{ id: 'LOUNGE-1', label: 'Lounge 1' }, { id: 'LOUNGE-2', label: 'Lounge 2' }].forEach(({ id, label }) => {
      const lounge = ROOMS.find(r => r.id === id);
      if (!lounge) return;
      const btn = document.createElement('button');
      btn.className = 'ri-nav-from';
      btn.textContent = `🚶 ${label}에서 오기`;
      btn.addEventListener('click', () => {
        const fromX = lounge.x + lounge.w / 2, fromZ = lounge.z + lounge.d / 2;
        const toX   = room.x   + room.w   / 2, toZ   = room.z   + room.d   / 2;
        const path  = getNavPath(fromX, fromZ, toX, toZ, room.id);
        showPath(path);
        setRoomHighlight(room); // 목적지 회의실 강조
        // 팝업 닫기
        panel.hidden = true;
        syncJoystickPos();
        // 경로 전체가 한눈에 보이도록 디폴트 탑다운 뷰
        state.flyTarget = {
          pos:  new THREE.Vector3(FLOOR.CX, 150, FLOOR.CZ),
          look: new THREE.Vector3(FLOOR.CX, 0, FLOOR.CZ),
        };
      });
      riActions.appendChild(btn);
    });

    // 내 위치에서 경로 버튼
    const myPin = userPins.get(state.myId);
    if (myPin) {
      const myBtn = document.createElement('button');
      myBtn.className = 'ri-nav-from';
      myBtn.textContent = '📍 내 위치에서 경로';
      myBtn.addEventListener('click', () => {
        const fromX = myPin.position.x, fromZ = myPin.position.z;
        const toX   = room.x + room.w / 2, toZ   = room.z + room.d / 2;
        const path  = getNavPath(fromX, fromZ, toX, toZ, room.id);
        showPath(path);
        setRoomHighlight(room);
        panel.hidden = true;
        syncJoystickPos();
        state.flyTarget = {
          pos:  new THREE.Vector3(FLOOR.CX, 150, FLOOR.CZ),
          look: new THREE.Vector3(FLOOR.CX, 0, FLOOR.CZ),
        };
      });
      riActions.appendChild(myBtn);
    }
  }

  panel.hidden = false;
  syncJoystickPos();
}
document.getElementById('room-info-close').onclick = () => {
  document.getElementById('room-info-panel').hidden = true;
  syncJoystickPos();
};

// ── 입장 ─────────────────────────────────────────────────────
function joinSession() {
  const name = document.getElementById('name-input').value.trim() || '익명';
  state.myName = name;
  socket.emit('join', { name, emoji: state.myEmoji });
  document.getElementById('join-overlay').hidden = true;
}
document.getElementById('join-btn').addEventListener('click', joinSession);
document.getElementById('name-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') joinSession();
});

// URL 파라미터가 있으면 자동 입장 (이름 입력 생략)
if (urlRoom) {
  document.getElementById('join-overlay').hidden = true;
  socket.emit('join', { name: '방문자', emoji: '🙂' });
}

// ── 위치 설정 모드 ────────────────────────────────────────────
function enterPickMode() {
  state.floorWasVisible = floor.visible;
  floor.visible = true; // raycaster needs visible floor
  state.pickingMode = true;
  renderer.domElement.style.cursor = 'crosshair';
  const btn = document.getElementById('locate-btn');
  btn.textContent = '📍 클릭하여 위치 지정 중...';
  btn.classList.add('active');
  document.getElementById('pick-hint').hidden = false;
}
function exitPickMode() {
  state.pickingMode = false;
  floor.visible = state.floorWasVisible;
  renderer.domElement.style.cursor = 'default';
  const btn = document.getElementById('locate-btn');
  btn.textContent = '📍 내 위치 설정';
  btn.classList.remove('active');
  document.getElementById('pick-hint').hidden = true;
}
// 전체 보기: 정상(top-down) 시점, 최대 축소
document.getElementById('reset-camera-btn').addEventListener('click', () => {
  state.flyTarget = {
    pos:  new THREE.Vector3(FLOOR.CX, 150, FLOOR.CZ),
    look: new THREE.Vector3(FLOOR.CX, 0, FLOOR.CZ),
  };
});

// 나침반 방향 클릭 → 해당 방향이 화면 위쪽에 오도록 회전
// theta 기준: 0=북↑, PI/2=서↑, PI=남↑, -PI/2=동↑
function flyToAzimuth(targetTheta) {
  const offset = new THREE.Vector3().subVectors(camera.position, controls.target);
  const spherical = new THREE.Spherical().setFromVector3(offset);
  spherical.theta = targetTheta;
  offset.setFromSpherical(spherical);
  state.flyTarget = {
    pos:  new THREE.Vector3().addVectors(controls.target, offset),
    look: controls.target.clone(),
  };
}

// 나침반 클릭 → 정북(디폴트) 방향으로 초기화
document.getElementById('compass')?.addEventListener('click', () => {
  flyToAzimuth(0);
});

// 화면 방향 초기화 (PC 버튼)
window.resetCameraRotation = () => { flyToAzimuth(0); };

// 내 핀 위치로 이동 (PC 버튼)
window.flyToMyPin = () => {
  const pin = userPins.get(state.myId);
  if (pin) flyTo(pin.position.x, pin.position.z, 22);
};

document.getElementById('locate-btn').addEventListener('click', () => {
  state.pickingMode ? exitPickMode() : enterPickMode();
});

// ── 타입 필터 ─────────────────────────────────────────────────
function initTypeFilters() {
  const filterHTML = Object.entries(ROOM_TYPES).map(([type, ti]) =>
    `<button class="filter-btn" data-type="${type}" onclick="setTypeFilter('${type}')" style="--filter-color:${ti.color}">
      <span class="filter-dot" style="background:${ti.color}"></span>${ti.label}
    </button>`
  ).join('');
  document.getElementById('type-filters').innerHTML = filterHTML;
  const mobFilters = document.getElementById('mob-type-filters');
  if (mobFilters) mobFilters.innerHTML = filterHTML;
}

window.setTypeFilter = (type) => {
  state.activeFilter = state.activeFilter === type ? null : type;
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === state.activeFilter);
  });
  const q = document.getElementById('mob-search')?.value || document.getElementById('search-input').value;
  renderRoomList(q);
};

// ── 방 목록 & 검색 ────────────────────────────────────────────
function renderRoomList(query = '') {
  const q = query.toLowerCase();
  const matchRoom = r => {
    const matchSearch = !q || r.name.toLowerCase().includes(q) || r.id.toLowerCase().includes(q);
    const matchType = !state.activeFilter || r.type === state.activeFilter;
    return matchSearch && matchType;
  };
  const filtered = ROOMS.filter(matchRoom);

  const hl = (text) => {
    if (!q) return text;
    const idx = text.toLowerCase().indexOf(q);
    if (idx === -1) return text;
    return text.slice(0, idx)
      + `<mark class="search-hl">${text.slice(idx, idx + q.length)}</mark>`
      + text.slice(idx + q.length);
  };

  document.getElementById('room-list').innerHTML = filtered.length === 0
    ? `<div class="room-empty">검색 결과가 없습니다</div>`
    : filtered.map(r => {
        const ti = ROOM_TYPES[r.type];
        return `<div class="room-item" onclick="focusRoom('${r.id}')">
          <span class="ri-dot" style="background:${ti.color}"></span>
          <span class="ri-id-sm">${hl(r.id)}</span>
          <span class="ri-name-sm">${hl(r.name)}</span>
          <div class="ri-item-actions">
            <button class="btn-link-room" onclick="copyRoomLink(event,'${r.id}')" title="링크 복사">🔗</button>
          </div>
        </div>`;
      }).join('');

  roomMeshes.forEach(m => {
    m.material.opacity = matchRoom(m.userData.room) ? m.userData.originalOpacity : 0.08;
  });

  const badge = document.getElementById('room-count');
  if (badge) {
    badge.textContent = filtered.length < ROOMS.length
      ? `${filtered.length} / ${ROOMS.length}`
      : ROOMS.length;
  }

  const mobList = document.getElementById('mob-room-list');
  if (mobList) mobList.innerHTML = document.getElementById('room-list').innerHTML;

  const mobBadge = document.getElementById('mob-room-count');
  if (mobBadge) mobBadge.textContent = document.getElementById('room-count')?.textContent || '';
}

document.getElementById('search-input').addEventListener('input', e => renderRoomList(e.target.value));

window.focusRoom = (id) => {
  const room = ROOMS.find(r => r.id === id);
  if (!room) return;
  flyToRoom(room.x + room.w / 2, room.z + room.d / 2);
  showRoomInfo(room);
  window.closeSheet?.();
};

// 이동 버튼 — 카메라를 해당 방으로 근접 이동 후 시트 닫기
window.navigateToRoom = (id) => {
  const room = ROOMS.find(r => r.id === id);
  if (!room) return;
  flyTo(room.x + room.w / 2, room.z + room.d / 2);
  window.closeSheet?.();
};

// 방 링크 복사
window.copyRoomLink = (e, roomId) => {
  e.stopPropagation();
  const url = `${location.origin}${location.pathname}?room=${encodeURIComponent(roomId)}`;
  navigator.clipboard.writeText(url).then(() => {
    const toast = document.getElementById('copy-toast');
    toast.hidden = false;
    setTimeout(() => { toast.hidden = true; }, 2500);
  });
};

// ── 유저 목록 ─────────────────────────────────────────────────
let _cachedUsers = [];

function renderUserList(users) {
  _cachedUsers = users;
  renderUserListFromCache();
}

function renderUserListFromCache() {
  const online = _cachedUsers.filter(u => !u.disconnected && u.x !== null);
  document.getElementById('user-count').textContent = online.length;

  const onlineHtml = online.map(u => {
    const lastMsg = userLastChat.get(u.id) || '';
    const chatHtml = lastMsg ? `<span class="u-chat">💬 ${lastMsg}</span>` : '';
    return `<div class="user-item" onclick="flyToUser(${u.x}, ${u.z}, '${u.id}')">
      <span class="u-emoji-icon">${u.emoji || '🙂'}</span>
      <span class="u-dot" style="background:${u.color}"></span>
      <div class="u-info"><span class="u-name">${u.name}</span>${chatHtml}</div>
      <span class="u-go">→ 이동</span>
    </div>`;
  }).join('');

  const html = onlineHtml || '<div class="u-empty">아직 위치를 설정한 사람이 없어요</div>';
  document.getElementById('user-list').innerHTML = html;
  const mobUserList = document.getElementById('mob-user-list');
  if (mobUserList) mobUserList.innerHTML = html;
  const mobUserCount = document.getElementById('mob-user-count');
  if (mobUserCount) mobUserCount.textContent = online.length;
}
window.flyToUser = (x, z, userId) => {
  flyTo(x, z, 18);
  // 해당 핀 라벨 잠깐 강조
  if (userId) {
    const pin = userPins.get(userId);
    if (pin?.userData.nameDiv) {
      pin.userData.nameDiv.classList.add('label-highlight');
      setTimeout(() => pin.userData.nameDiv.classList.remove('label-highlight'), 1500);
    }
  }
};

// ── 범례 ─────────────────────────────────────────────────────
document.getElementById('legend').innerHTML = Object.entries(ROOM_TYPES).map(([type, v]) => {
  const cnt = ROOMS.filter(r => r.type === type).length;
  return `<div class="legend-item">
    <span class="legend-dot" style="background:${v.color}"></span>
    <span>${v.label}</span>
    <span class="legend-count">${cnt}</span>
  </div>`;
}).join('');

// ── 프로필 편집 ───────────────────────────────────────────────
function updateProfileBtn() {
  document.getElementById('profile-btn').textContent = `${state.myEmoji} ${state.myName}`;
  const mobIcon = document.getElementById('mob-profile-icon');
  if (mobIcon) mobIcon.textContent = state.myEmoji;
}

function renderEmojiGrid(gridId) {
  document.getElementById(gridId).innerHTML = EMOJI_LIST.map((em, i) =>
    `<button class="emoji-btn ${em === state.myEmoji ? 'selected' : ''}" onclick="selectEmoji(${i})">${em}</button>`
  ).join('');
}

window.selectEmoji = (idx) => {
  state.myEmoji = EMOJI_LIST[idx];
  renderEmojiGrid('join-emoji-grid');
  renderEmojiGrid('profile-emoji-grid');
};

// 초기 이모지 그리드 렌더링
renderEmojiGrid('join-emoji-grid');
renderEmojiGrid('profile-emoji-grid');

document.getElementById('profile-btn').addEventListener('click', () => {
  state._emojiBeforeEdit = state.myEmoji;   // 취소 시 복원용 스냅샷
  state._nameBeforeEdit  = state.myName;
  document.getElementById('profile-name-input').value = state.myName;
  renderEmojiGrid('profile-emoji-grid');
  document.getElementById('profile-modal').hidden = false;
});

document.getElementById('profile-cancel-btn').addEventListener('click', () => {
  // 모달 안에서 클릭한 이모지 변경사항 원복
  state.myEmoji = state._emojiBeforeEdit ?? state.myEmoji;
  state.myName  = state._nameBeforeEdit  ?? state.myName;
  document.getElementById('profile-modal').hidden = true;
});

document.getElementById('profile-save-btn').addEventListener('click', () => {
  const name = document.getElementById('profile-name-input').value.trim() || state.myName;
  state.myName = name;
  if (state.joined) socket.emit('update-profile', { name, emoji: state.myEmoji });
  updateProfileBtn();
  document.getElementById('profile-modal').hidden = true;
  // 서버 브로드캐스트 대기 없이 즉시 핀 이름 반영
  const myPin = userPins.get(state.myId);
  if (myPin?.userData.nameDiv) {
    myPin.userData.nameDiv.innerHTML =
      `<span style="margin-right:3px">${state.myEmoji}</span>${name}<span class="me-tag">나</span>`;
  }
});

// ── 모바일 시트 & 채팅 ────────────────────────────────────────
window.openSheet = (name) => {
  document.getElementById('sheet-backdrop').hidden = false;
  document.getElementById(`sheet-${name}`).hidden = false;
  const mc = document.querySelector('.mobile-controls');
  if (mc) mc.style.display = 'none';
};
window.closeSheet = () => {
  document.getElementById('sheet-backdrop').hidden = true;
  document.querySelectorAll('.bottom-sheet').forEach(s => { s.hidden = true; });
  const mc = document.querySelector('.mobile-controls');
  if (mc) mc.style.display = '';
};
function openChatBar() {
  // 채팅바 레이블을 내 이모지로 갱신 후 표시
  const label = document.querySelector('.chat-label');
  if (label) label.textContent = state.myEmoji || '💬';
  document.getElementById('chat-bar').hidden = false;
  syncJoystickPos();
  document.getElementById('chat-input').focus();
}

window.openMobChat = () => {
  if (!state.joined) return;
  openChatBar();
};

// ── 모바일 조이스틱 ───────────────────────────────────────────
const JOYSTICK_MAX_R    = 22;
const JOYSTICK_FAST_THR = JOYSTICK_MAX_R * 0.65; // ~14px — 이 이상 드래그 시 고속 모드

function updateJoystick(js, knobEl, touch) {
  const rawDx   = touch.clientX - js.bx;
  const rawDy   = touch.clientY - js.by;
  const rawDist = Math.hypot(rawDx, rawDy);
  const clipped = Math.min(JOYSTICK_MAX_R, rawDist);
  const angle   = Math.atan2(rawDy, rawDx);
  if (knobEl) knobEl.style.transform =
    `translate(${(clipped * Math.cos(angle)).toFixed(1)}px, ${(clipped * Math.sin(angle)).toFixed(1)}px)`;
  js.dx   = rawDx / 38;
  js.dy   = rawDy / 38;
  js.fast = rawDist > JOYSTICK_FAST_THR;
}
function endJoystick(js, padEl, knobEl) {
  js.active = false; js.dx = 0; js.dy = 0; js.fast = false;
  if (padEl)  { padEl.classList.remove('active'); padEl.classList.remove('speed-fast'); }
  if (knobEl) knobEl.style.transform = '';
}

function initMobileControls() {
  const pinPad  = document.getElementById('pin-jpad');
  const pinKnob = document.getElementById('pin-knob');
  const camPad  = document.getElementById('cam-jpad');
  const camKnob = document.getElementById('cam-knob');
  if (!pinPad || !camPad) return;

  function startJoystick(js, pad, e) {
    e.preventDefault();
    const t = e.targetTouches[0];
    js.active = true; js.id = t.identifier;
    js.bx = t.clientX; js.by = t.clientY;
    js.dx = 0; js.dy = 0;
    pad.classList.add('active');
  }
  // 핀 조이스틱: 더블탭 시 내 위치로 카메라 이동
  let pinLastTap = 0;
  pinPad.addEventListener('touchstart', e => {
    const now = Date.now();
    if (now - pinLastTap < 300) {
      e.preventDefault();
      const myPin = userPins.get(state.myId);
      if (myPin) flyToRoom(myPin.position.x, myPin.position.z);
      pinLastTap = 0;
      return;
    }
    pinLastTap = now;
    startJoystick(pinJoystick, pinPad, e);
  }, { passive: false });

  // 카메라 조이스틱: 더블탭 시 기본 시점 복귀, 싱글탭은 조이스틱 시작
  let camLastTap = 0;
  camPad.addEventListener('touchstart', e => {
    const now = Date.now();
    if (now - camLastTap < 300) {
      // 더블탭 — 현재 위치 그대로, 탑다운 뷰로만 전환
      e.preventDefault();
      const dist = camera.position.distanceTo(controls.target);
      const look = controls.target.clone();
      state.flyTarget = {
        pos:  new THREE.Vector3(look.x, dist, look.z),
        look,
      };
      camLastTap = 0;
      return;
    }
    camLastTap = now;
    startJoystick(camJoystick, camPad, e);
  }, { passive: false });

  document.addEventListener('touchmove', (e) => {
    for (const t of e.changedTouches) {
      if (pinJoystick.active && t.identifier === pinJoystick.id) {
        updateJoystick(pinJoystick, pinKnob, t);
        pinPad.classList.toggle('speed-fast', pinJoystick.fast);
      }
      if (camJoystick.active && t.identifier === camJoystick.id) updateJoystick(camJoystick, camKnob, t);
    }
  }, { passive: true });

  document.addEventListener('touchend', (e) => {
    for (const t of e.changedTouches) {
      if (pinJoystick.active && t.identifier === pinJoystick.id) endJoystick(pinJoystick, pinPad, pinKnob);
      if (camJoystick.active && t.identifier === camJoystick.id) endJoystick(camJoystick, camPad, camKnob);
    }
  });

  // mob-search
  document.getElementById('mob-search')?.addEventListener('input', e => renderRoomList(e.target.value));
}

// ── 리사이즈 ─────────────────────────────────────────────────
function onResize() {
  const w = container.clientWidth, h = container.clientHeight;
  renderer.setSize(w, h);
  labelRenderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

// ── 디버그 그리드 (G키) ───────────────────────────────────────
const debugGrid = new THREE.GridHelper(140, 28, 0xff0000, 0x880000);
debugGrid.position.set(FLOOR.CX, 0.15, FLOOR.CZ);
debugGrid.visible = false;
scene.add(debugGrid);

const debugGridZ = new THREE.GridHelper(88, 22, 0x0044ff, 0x002288);
debugGridZ.position.set(FLOOR.CX, 0.15, FLOOR.CZ);
debugGridZ.visible = false;
scene.add(debugGridZ);

// ── 애니메이션 루프 ───────────────────────────────────────────
function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  // 입구 방향 쉐브론 슬라이딩
  entranceAnimData.forEach(data => {
    data.chevrons.forEach((chev, i) => {
      const phase = ((t * 0.65 + i / 3) % 1.0);
      chev.position.lerpVectors(data.startPos, data.endPos, phase);
      chev.material.opacity = Math.sin(phase * Math.PI) * 0.88;
    });
  });

  // 스폰 원 외곽 링 펄싱
  spawnRing.material.opacity = 0.2 + 0.3 * Math.abs(Math.sin(t * 1.2));

  // 모바일 핀 조이스틱
  if (pinJoystick.active && state.joined) {
    const now = performance.now();
    if (now - lastPinEmit > 80 && (Math.abs(pinJoystick.dx) > 0.05 || Math.abs(pinJoystick.dy) > 0.05)) {
      const pin = userPins.get(state.myId);
      const cx = pin ? pin.position.x : FLOOR.CX;
      const cz = pin ? pin.position.z : FLOOR.CZ;
      const spd = pinJoystick.fast ? 0.8 : 0.4; // 65% 이상 드래그 시 2배 속도
      const nx = Math.max(0, Math.min(FLOOR.W, cx + Math.max(-1, Math.min(1, pinJoystick.dx)) * spd));
      const nz = Math.max(0, Math.min(FLOOR.D, cz + Math.max(-1, Math.min(1, pinJoystick.dy)) * spd));
      emitLocation(nx, nz);
      lastPinEmit = now;
    }
  }

  // 모바일 카메라 회전 조이스틱
  if (camJoystick.active && (Math.abs(camJoystick.dx) > 0.05 || Math.abs(camJoystick.dy) > 0.05)) {
    rotateCamera(
       Math.max(-1, Math.min(1, camJoystick.dx)) * 0.04,
      -Math.max(-1, Math.min(1, camJoystick.dy)) * 0.025
    );
  }

  userPins.forEach((pin, id) => {
    const isMe = id === state.myId;
    pin.children[PIN_BALL_INDEX].scale.setScalar(
      isMe ? 1 + 0.18 * Math.sin(t * 4) : 1 + 0.1 * Math.sin(t * 3)
    );
    if (isMe && pin.userData.meRing) {
      pin.userData.meRing.material.opacity = 0.3 + 0.4 * Math.abs(Math.sin(t * 2));
      pin.userData.meRing.scale.setScalar(1 + 0.12 * Math.sin(t * 2));
    }
  });

  if (state.flyTarget) {
    camera.position.lerp(state.flyTarget.pos, 0.06);
    controls.target.lerp(state.flyTarget.look, 0.06);
    if (camera.position.distanceTo(state.flyTarget.pos) < 0.5) state.flyTarget = null;
  }

  // 나침반 회전 업데이트 (방위각에 따라 나침반 링 회전)
  const theta = controls.getAzimuthalAngle();
  if (compassRingEl) {
    if (lastCompassTheta === null || Math.abs(theta - lastCompassTheta) > 0.003) {
      compassRingEl.style.transform = `rotate(${(theta * 180 / Math.PI).toFixed(1)}deg)`;
      lastCompassTheta = theta;
    }
  }

  // 경로 화살표 방향: project(camera)로 3D 경로를 화면 2D로 투영해 CSS rotate 계산
  if (pathArrows.length > 0) {
    const _p1 = new THREE.Vector3(), _p2 = new THREE.Vector3();
    pathArrows.forEach(({ inner, from, to }) => {
      _p1.copy(from).project(camera); // NDC: x right, y up
      _p2.copy(to).project(camera);
      const sx = _p2.x - _p1.x;
      const sy = _p2.y - _p1.y; // NDC y 양수 = 화면 위쪽
      const cssAngle = Math.atan2(sx, sy) * 180 / Math.PI;
      inner.style.transform = `rotate(${cssAngle.toFixed(1)}deg)`;
    });
  }

  // 선택/목적지 회의실 강조 펄스
  if (highlightMesh) {
    highlightMesh.material.emissiveIntensity = 0.45 + 0.75 * Math.abs(Math.sin(t * 2.8));
  }


  controls.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}

// ── 초기화 ───────────────────────────────────────────────────
window.addEventListener('resize', onResize);
onResize();
initTypeFilters();
renderRoomList();
initMobileControls();
animate();

// 입장 오버레이가 표시될 때 이름 입력창 자동 포커스
if (!urlRoom) {
  setTimeout(() => document.getElementById('name-input').focus(), 100);
}
