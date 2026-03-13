import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { ROOMS, ROOM_TYPES } from './map-data.js';

// ── 상수 ─────────────────────────────────────────────────────
const FLOOR = { W: 140, D: 88, CX: 70, CZ: 44 };
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

// ── 씬 구성 실행 ─────────────────────────────────────────────
initLights();
const floor = initFloor();
const roomMeshes = initRooms();
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

// ── 유저 핀 동기화 ────────────────────────────────────────────
function syncPins(users) {
  for (const [id, pin] of userPins) {
    if (!users.find(u => u.id === id)) {
      scene.remove(pin);
      userPins.delete(id);
    }
  }
  users.forEach(user => {
    if (user.x === null || user.z === null) return;

    if (!userPins.has(user.id)) {
      const pin = makePin(user.color);

      // 이름 + 이모지 라벨
      const nameDiv = document.createElement('div');
      nameDiv.className = 'user-label';
      nameDiv.style.borderColor = user.color;
      nameDiv.style.color = user.color;
      const nameLabel = new CSS2DObject(nameDiv);
      nameLabel.position.set(0, 4.8, 0);
      pin.add(nameLabel); // [3]
      pin.userData.nameDiv = nameDiv;

      // 말풍선 (초기 숨김)
      const bubbleDiv = document.createElement('div');
      bubbleDiv.className = 'chat-bubble';
      bubbleDiv.style.display = 'none';
      const bubbleLabel = new CSS2DObject(bubbleDiv);
      bubbleLabel.position.set(0, 7.0, 0);
      pin.add(bubbleLabel); // [4]
      pin.userData.bubbleDiv = bubbleDiv;

      scene.add(pin);
      userPins.set(user.id, pin);
    }

    const pin = userPins.get(user.id);
    pin.position.set(user.x, 0, user.z);

    // 이름/이모지 업데이트
    const emoji = user.emoji || '🙂';
    pin.userData.nameDiv.innerHTML = `<span style="margin-right:3px">${emoji}</span>${user.name}`;
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
  bubbleDiv.textContent = message;
  bubbleDiv.style.borderColor = color;

  // 애니메이션 강제 재실행 (기존 메시지 위에 새 메시지가 올 때도 동작)
  bubbleDiv.style.display = 'none';
  bubbleDiv.style.animation = 'none';
  // eslint-disable-next-line no-unused-expressions
  bubbleDiv.offsetHeight; // reflow 강제
  bubbleDiv.style.animation = '';
  bubbleDiv.style.display = 'block';

  // 5초 후 숨김 (마지막 메시지 1개만 유지)
  const timer = setTimeout(() => {
    bubbleDiv.style.display = 'none';
    state.chatTimers.delete(id);
  }, 5000);
  state.chatTimers.set(id, timer);
  return true;
}

socket.on('chat-message', ({ id, message, color }) => {
  // 핀이 아직 생성되지 않은 경우 300ms 후 재시도
  if (!showChatBubble(id, message, color)) {
    setTimeout(() => showChatBubble(id, message, color), 300);
  }
});

function checkOnboarding() {
  if (!localStorage.getItem('lf-onboarded')) {
    document.getElementById('onboard-overlay').hidden = false;
    document.getElementById('onboard-close').addEventListener('click', () => {
      document.getElementById('onboard-overlay').hidden = true;
      localStorage.setItem('lf-onboarded', '1');
    });
  }
}

socket.on('joined', ({ color }) => {
  state.myColor = color;
  state.myId = socket.id;
  state.joined = true;
  // 첫 접속 위치: 가운데
  socket.emit('set-location', { x: FLOOR.CX, z: FLOOR.CZ });
  // 프로필 버튼 업데이트
  updateProfileBtn();
  // 온보딩 가이드 (최초 방문 시)
  if (!urlRoom) checkOnboarding();
  // URL 파라미터 방 처리
  if (urlRoom) {
    setTimeout(() => highlightRoomById(urlRoom), 700);
  }
});

socket.on('users-update', syncPins);
socket.on('connect_error', () => console.warn('[소켓] 연결 실패, 재시도 중...'));

// ── 카메라 fly-to ─────────────────────────────────────────────
function flyTo(tx, tz, height = 22) {
  state.flyTarget = {
    pos: new THREE.Vector3(tx, height, tz + 26),
    look: new THREE.Vector3(tx, 0, tz),
  };
}

// ── 회의실 하이라이트 ─────────────────────────────────────────
function highlightRoomById(roomId) {
  const mesh = roomMeshes.find(m => m.userData.room.id === roomId);
  if (!mesh) return;
  flyTo(mesh.userData.room.x + mesh.userData.room.w / 2, mesh.userData.room.z + mesh.userData.room.d / 2);
  showRoomInfo(mesh.userData.room);
  // 하이라이트 애니메이션 (3초간)
  const orig = mesh.userData.originalEmissive;
  let elapsed = 0;
  const interval = setInterval(() => {
    elapsed += 100;
    mesh.material.emissiveIntensity = 0.08 + 0.5 * Math.abs(Math.sin(elapsed / 200));
    if (elapsed >= 3000) {
      clearInterval(interval);
      mesh.material.emissiveIntensity = orig;
    }
  }, 100);
}

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
      socket.emit('set-location', { x: fx, z: fz });
      exitPickMode();
    }
  }
});

// ── 모바일 터치 지원 ─────────────────────────────────────────
renderer.domElement.addEventListener('touchend', (e) => {
  if (!state.joined || e.changedTouches.length !== 1) return;
  const touch = e.changedTouches[0];
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
      socket.emit('set-location', { x: fx, z: fz });
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
    socket.emit('set-location', { x: nx, z: nz });
    return;
  }

  // T키: 채팅 입력창 포커스
  if (!isTyping && (e.key === 't' || e.key === 'T')) {
    if (!state.joined) return;
    e.preventDefault();
    document.getElementById('chat-bar').hidden = false;
    document.getElementById('chat-input').focus();
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
    return;
  }

  // ?키: 온보딩 가이드 다시 보기
  if (!isTyping && e.key === '?') {
    const ov = document.getElementById('onboard-overlay');
    ov.hidden = !ov.hidden;
  }
});

// ── 채팅 입력 ─────────────────────────────────────────────────
document.getElementById('chat-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const msg = e.target.value.trim().slice(0, 20);
    if (msg && state.joined) socket.emit('chat', { message: msg });
    e.target.value = '';
    document.getElementById('chat-bar').hidden = true;
    e.target.blur();
  }
  if (e.key === 'Escape') {
    e.target.value = '';
    document.getElementById('chat-bar').hidden = true;
    e.target.blur();
  }
});

// ── 도면 토글 ────────────────────────────────────────────────
document.getElementById('floor-toggle-btn').addEventListener('click', () => {
  floor.visible = !floor.visible;
  document.getElementById('floor-toggle-btn').textContent = floor.visible ? '🗺 도면 숨기기' : '🗺 도면 보기';
});

// ── 방 정보 패널 ─────────────────────────────────────────────
function showRoomInfo(room) {
  const ti = ROOM_TYPES[room.type];
  const panel = document.getElementById('room-info-panel');
  panel.style.borderTopColor = ti.color;
  panel.querySelector('.ri-id').textContent = room.id;
  panel.querySelector('.ri-name').textContent = room.name;
  panel.querySelector('.ri-type').textContent = ti.label;
  panel.querySelector('.ri-type').style.color = ti.color;
  panel.querySelector('.ri-nav').onclick = () => flyTo(room.x + room.w / 2, room.z + room.d / 2);
  panel.hidden = false;
}
document.getElementById('room-info-close').onclick = () => {
  document.getElementById('room-info-panel').hidden = true;
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
  state.pickingMode = true;
  renderer.domElement.style.cursor = 'crosshair';
  const btn = document.getElementById('locate-btn');
  btn.textContent = '📍 클릭하여 위치 지정 중...';
  btn.classList.add('active');
  document.getElementById('pick-hint').hidden = false;
}
function exitPickMode() {
  state.pickingMode = false;
  renderer.domElement.style.cursor = 'default';
  const btn = document.getElementById('locate-btn');
  btn.textContent = '📍 내 위치 설정';
  btn.classList.remove('active');
  document.getElementById('pick-hint').hidden = true;
}
document.getElementById('reset-camera-btn').addEventListener('click', () => {
  flyTo(FLOOR.CX, FLOOR.CZ, 80);
});

document.getElementById('locate-btn').addEventListener('click', () => {
  state.pickingMode ? exitPickMode() : enterPickMode();
});

// ── 타입 필터 ─────────────────────────────────────────────────
function initTypeFilters() {
  const wrap = document.getElementById('type-filters');
  wrap.innerHTML = Object.entries(ROOM_TYPES).map(([type, ti]) =>
    `<button class="filter-btn" data-type="${type}" onclick="setTypeFilter('${type}')" style="--filter-color:${ti.color}">
      <span class="filter-dot" style="background:${ti.color}"></span>${ti.label}
    </button>`
  ).join('');
}

window.setTypeFilter = (type) => {
  state.activeFilter = state.activeFilter === type ? null : type;
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === state.activeFilter);
  });
  renderRoomList(document.getElementById('search-input').value);
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

  document.getElementById('room-list').innerHTML = filtered.map(r => {
    const ti = ROOM_TYPES[r.type];
    return `<div class="room-item" onclick="focusRoom('${r.id}')">
      <span class="ri-dot" style="background:${ti.color}"></span>
      <span class="ri-id-sm">${r.id}</span>
      <span class="ri-name-sm">${r.name}</span>
      <button class="btn-link-room" onclick="copyRoomLink(event,'${r.id}')" title="링크 복사">🔗</button>
    </div>`;
  }).join('');

  roomMeshes.forEach(m => {
    m.material.opacity = matchRoom(m.userData.room) ? m.userData.originalOpacity : 0.08;
  });
}

document.getElementById('search-input').addEventListener('input', e => renderRoomList(e.target.value));

window.focusRoom = (id) => {
  const room = ROOMS.find(r => r.id === id);
  if (!room) return;
  flyTo(room.x + room.w / 2, room.z + room.d / 2);
  showRoomInfo(room);
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
function renderUserList(users) {
  const placed = users.filter(u => u.x !== null);
  document.getElementById('user-count').textContent = placed.length;
  document.getElementById('user-list').innerHTML = placed.map(u => `
    <div class="user-item" onclick="flyToUser(${u.x}, ${u.z})">
      <span class="u-emoji-icon">${u.emoji || '🙂'}</span>
      <span class="u-dot" style="background:${u.color}"></span>
      <span class="u-name">${u.name}</span>
      <span class="u-go">→ 이동</span>
    </div>
  `).join('') || '<div class="u-empty">아직 위치를 설정한 사람이 없어요</div>';
}
window.flyToUser = (x, z) => flyTo(x, z, 18);

// ── 범례 ─────────────────────────────────────────────────────
document.getElementById('legend').innerHTML = Object.entries(ROOM_TYPES).map(([, v]) => `
  <div class="legend-item">
    <span class="legend-dot" style="background:${v.color}"></span>
    <span>${v.label}</span>
  </div>
`).join('');

// ── 프로필 편집 ───────────────────────────────────────────────
function updateProfileBtn() {
  document.getElementById('profile-btn').textContent = `${state.myEmoji} ${state.myName}`;
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
  document.getElementById('profile-name-input').value = state.myName;
  renderEmojiGrid('profile-emoji-grid');
  document.getElementById('profile-modal').hidden = false;
});

document.getElementById('profile-cancel-btn').addEventListener('click', () => {
  document.getElementById('profile-modal').hidden = true;
});

document.getElementById('profile-save-btn').addEventListener('click', () => {
  const name = document.getElementById('profile-name-input').value.trim() || state.myName;
  state.myName = name;
  if (state.joined) socket.emit('update-profile', { name, emoji: state.myEmoji });
  updateProfileBtn();
  document.getElementById('profile-modal').hidden = true;
});

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

  userPins.forEach(pin => {
    pin.children[PIN_BALL_INDEX].scale.setScalar(1 + 0.1 * Math.sin(t * 3));
  });

  if (state.flyTarget) {
    camera.position.lerp(state.flyTarget.pos, 0.06);
    controls.target.lerp(state.flyTarget.look, 0.06);
    if (camera.position.distanceTo(state.flyTarget.pos) < 0.5) state.flyTarget = null;
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
animate();
