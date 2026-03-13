import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { ROOMS, ROOM_TYPES } from './map-data.js';

// ── 상수 ────────────────────────────────────────────────────
const FLOOR = { W: 140, D: 88, CX: 70, CZ: 44 };
const PIN_BALL_INDEX = 1; // Group children 내 ball 위치


// ── 상태 (인터랙션·소켓) ──────────────────────────────────
const state = {
  pickingMode: false,
  hoveredMesh: null,
  flyTarget: null,
  myColor: '#ffffff',
};

// ── Three.js 핵심 객체 ────────────────────────────────────
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

// ── 씬 초기화 함수들 ──────────────────────────────────────

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
    mesh.userData = { room, originalOpacity: mat.opacity };
    scene.add(mesh);
    meshes.push(mesh);

    // 엣지 아웃라인
    const line = new THREE.LineSegments(
      new THREE.EdgesGeometry(geo),
      new THREE.LineBasicMaterial({ color: typeInfo.hex, transparent: true, opacity: 0.9 })
    );
    line.position.copy(mesh.position);
    scene.add(line);

    // CSS2D 라벨
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
  g.add(stem); // children[0]

  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(0.75, 20, 20),
    new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.6, roughness: 0.3 })
  );
  ball.position.y = 3.3;
  g.add(ball); // children[1] = PIN_BALL_INDEX

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(1.2, 20),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.25 })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  g.add(shadow); // children[2]

  return g;
}

// ── 씬 구성 실행 ──────────────────────────────────────────
initLights();
const floor = initFloor();
const roomMeshes = initRooms();
const userPins = new Map();

// ── 유저 핀 동기화 ────────────────────────────────────────
function syncPins(users) {
  // 퇴장한 유저 핀 제거
  for (const [id, pin] of userPins) {
    if (!users.find(u => u.id === id)) {
      scene.remove(pin);
      userPins.delete(id);
    }
  }
  // 신규/위치 업데이트
  users.forEach(user => {
    if (user.x === null || user.z === null) return;
    if (!userPins.has(user.id)) {
      const pin = makePin(user.color);
      const nameDiv = document.createElement('div');
      nameDiv.className = 'user-label';
      nameDiv.textContent = user.name;
      nameDiv.style.borderColor = user.color;
      nameDiv.style.color = user.color;
      pin.add(new CSS2DObject(nameDiv));
      scene.add(pin);
      userPins.set(user.id, pin);
    }
    userPins.get(user.id).position.set(user.x, 0, user.z);
  });
  renderUserList(users);
}

// ── Socket.io ──────────────────────────────────────────────
const socket = io();
socket.on('joined', ({ color }) => { state.myColor = color; });
socket.on('users-update', syncPins);
socket.on('connect_error', () => console.warn('[소켓] 연결 실패, 재시도 중...'));

// ── 카메라 fly-to ──────────────────────────────────────────
function flyTo(tx, tz, height = 22) {
  state.flyTarget = {
    pos: new THREE.Vector3(tx, height, tz + 26),
    look: new THREE.Vector3(tx, 0, tz),
  };
}

// ── 인터랙션: 마우스 이벤트 ──────────────────────────────
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

// ── UI: 방 정보 패널 ──────────────────────────────────────
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

// ── UI: 입장 ──────────────────────────────────────────────
function joinSession() {
  const name = document.getElementById('name-input').value.trim() || '익명';
  socket.emit('join', { name });
  document.getElementById('join-overlay').hidden = true;
}
document.getElementById('join-btn').addEventListener('click', joinSession);
document.getElementById('name-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') joinSession();
});

// ── UI: 위치 설정 모드 ────────────────────────────────────
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
document.getElementById('locate-btn').addEventListener('click', () => {
  state.pickingMode ? exitPickMode() : enterPickMode();
});

// ── UI: 방 목록 & 검색 ───────────────────────────────────
function renderRoomList(query = '') {
  const q = query.toLowerCase();
  const matchRoom = r => !q || r.name.toLowerCase().includes(q) || r.id.toLowerCase().includes(q);
  const filtered = ROOMS.filter(matchRoom);

  document.getElementById('room-list').innerHTML = filtered.map(r => {
    const ti = ROOM_TYPES[r.type];
    return `<div class="room-item" onclick="focusRoom('${r.id}')">
      <span class="ri-dot" style="background:${ti.color}"></span>
      <span class="ri-id-sm">${r.id}</span>
      <span class="ri-name-sm">${r.name}</span>
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

// ── UI: 유저 목록 ─────────────────────────────────────────
function renderUserList(users) {
  const placed = users.filter(u => u.x !== null);
  document.getElementById('user-count').textContent = placed.length;
  document.getElementById('user-list').innerHTML = placed.map(u => `
    <div class="user-item" onclick="flyToUser(${u.x}, ${u.z})">
      <span class="u-dot" style="background:${u.color}"></span>
      <span class="u-name">${u.name}</span>
      <span class="u-go">→ 이동</span>
    </div>
  `).join('') || '<div class="u-empty">아직 위치를 설정한 사람이 없어요</div>';
}
window.flyToUser = (x, z) => flyTo(x, z, 18);

// ── 범례 ──────────────────────────────────────────────────
document.getElementById('legend').innerHTML = Object.entries(ROOM_TYPES).map(([, v]) => `
  <div class="legend-item">
    <span class="legend-dot" style="background:${v.color}"></span>
    <span>${v.label}</span>
  </div>
`).join('');

// ── 리사이즈 ──────────────────────────────────────────────
function onResize() {
  const w = container.clientWidth, h = container.clientHeight;
  renderer.setSize(w, h);
  labelRenderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

// ── 애니메이션 루프 ───────────────────────────────────────
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

// ── 디버그 그리드 (G키 토글) ─────────────────────────────
const debugGrid = new THREE.GridHelper(140, 28, 0xff0000, 0x880000);
debugGrid.position.set(FLOOR.CX, 0.15, FLOOR.CZ);
debugGrid.visible = false;
scene.add(debugGrid);

// 좌표 눈금용 Z축 그리드 (88 단위)
const debugGridZ = new THREE.GridHelper(88, 22, 0x0044ff, 0x002288);
debugGridZ.position.set(FLOOR.CX, 0.15, FLOOR.CZ);
debugGridZ.visible = false;
scene.add(debugGridZ);

window.addEventListener('keydown', e => {
  if (e.key === 'g' || e.key === 'G') {
    const next = !debugGrid.visible;
    debugGrid.visible = next;
    debugGridZ.visible = next;
    console.log(`[디버그] 그리드 ${next ? 'ON 🟥 (빨강=X축/5unit, 파랑=Z축/4unit)' : 'OFF'}`);
  }
});

// ── 초기화 ────────────────────────────────────────────────
window.addEventListener('resize', onResize);
onResize();
renderRoomList();
animate();
