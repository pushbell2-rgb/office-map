import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { ROOMS, ROOM_TYPES } from './map-data.js';

// ── 기본 설정 ──────────────────────────────────────────────
const FLOOR_W = 100, FLOOR_D = 54;
const FLOOR_CX = FLOOR_W / 2, FLOOR_CZ = FLOOR_D / 2;

// ── Scene ──────────────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0f172a);
scene.fog = new THREE.FogExp2(0x0f172a, 0.008);

// ── Renderer ───────────────────────────────────────────────
const container = document.getElementById('canvas-container');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

// CSS2D (라벨)
const labelRenderer = new CSS2DRenderer();
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0';
labelRenderer.domElement.style.left = '0';
labelRenderer.domElement.style.pointerEvents = 'none';
container.appendChild(labelRenderer.domElement);

function resize() {
  const w = container.clientWidth, h = container.clientHeight;
  renderer.setSize(w, h);
  labelRenderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

// ── Camera ─────────────────────────────────────────────────
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 500);
camera.position.set(FLOOR_CX, 58, FLOOR_D + 42);
camera.lookAt(FLOOR_CX, 0, FLOOR_CZ);

// ── Controls ───────────────────────────────────────────────
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(FLOOR_CX, 0, FLOOR_CZ);
controls.maxPolarAngle = Math.PI / 2 - 0.02;
controls.minDistance = 10;
controls.maxDistance = 160;
controls.enableDamping = true;
controls.dampingFactor = 0.08;

// ── Lights ─────────────────────────────────────────────────
scene.add(new THREE.AmbientLight(0xffffff, 0.55));

const sun = new THREE.DirectionalLight(0xffffff, 1.0);
sun.position.set(FLOOR_CX + 20, 80, FLOOR_CZ + 30);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 0.5;
sun.shadow.camera.far = 200;
sun.shadow.camera.left = -80;
sun.shadow.camera.right = 80;
sun.shadow.camera.top = 60;
sun.shadow.camera.bottom = -60;
scene.add(sun);

// 보조 포인트 라이트 (depth감)
const fill = new THREE.PointLight(0x6366f1, 0.8, 80);
fill.position.set(20, 20, 20);
scene.add(fill);

// ── 바닥 (map.jpg 텍스처) ────────────────────────────────
const loader = new THREE.TextureLoader();
const mapTex = loader.load('/public/map.jpg', tex => {
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
});
const floorMat = new THREE.MeshStandardMaterial({ map: mapTex, roughness: 0.9, metalness: 0.0 });
const floorGeo = new THREE.PlaneGeometry(FLOOR_W, FLOOR_D);
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI / 2;
floor.position.set(FLOOR_CX, 0, FLOOR_CZ);
floor.receiveShadow = true;
floor.name = 'floor';
scene.add(floor);

// ── 방 생성 ────────────────────────────────────────────────
const roomMeshes = [];

ROOMS.forEach(room => {
  const typeInfo = ROOM_TYPES[room.type];
  const hexColor = typeInfo.hex;
  const cx = room.x + room.w / 2;
  const cz = room.z + room.d / 2;
  const ROOM_H = room.type === 'lounge' ? 1.5 : 2.5;

  // 방 박스 (반투명)
  const geo = new THREE.BoxGeometry(room.w, ROOM_H, room.d);
  const mat = new THREE.MeshStandardMaterial({
    color: hexColor,
    transparent: true,
    opacity: room.type === 'lounge' ? 0.35 : 0.55,
    roughness: 0.6,
    metalness: 0.1,
    emissive: hexColor,
    emissiveIntensity: 0.08,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(cx, ROOM_H / 2, cz);
  mesh.castShadow = true;
  mesh.userData = { room, originalOpacity: mat.opacity };
  scene.add(mesh);
  roomMeshes.push(mesh);

  // 엣지 아웃라인
  const edges = new THREE.EdgesGeometry(geo);
  const line = new THREE.LineSegments(
    edges,
    new THREE.LineBasicMaterial({ color: hexColor, transparent: true, opacity: 0.9 })
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

// ── 사용자 핀 ──────────────────────────────────────────────
const userPins = new Map();

function makePin(color) {
  const g = new THREE.Group();
  const c = new THREE.Color(color);

  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.18, 2.8, 10),
    new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.3 })
  );
  stem.position.y = 1.4;
  g.add(stem);

  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(0.75, 20, 20),
    new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.6, roughness: 0.3 })
  );
  ball.position.y = 3.3;
  g.add(ball);

  // 그림자 원
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(1.2, 20),
    new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.25 })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  g.add(shadow);

  return g;
}

function syncPins(users) {
  // 삭제된 유저 핀 제거
  for (const [id, pin] of userPins) {
    if (!users.find(u => u.id === id)) {
      scene.remove(pin);
      userPins.delete(id);
    }
  }
  // 추가/업데이트
  users.forEach(user => {
    if (user.x === null || user.z === null) return;
    if (!userPins.has(user.id)) {
      const pin = makePin(user.color);
      // 이름 라벨
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
let myColor = '#ffffff';

socket.on('joined', ({ color }) => { myColor = color; });
socket.on('users-update', syncPins);

// ── 카메라 fly-to 애니메이션 ───────────────────────────────
let flyTarget = null;

function flyTo(tx, tz, height = 22) {
  flyTarget = {
    pos: new THREE.Vector3(tx, height, tz + 26),
    look: new THREE.Vector3(tx, 0, tz),
  };
}

// ── Raycaster & 인터랙션 ───────────────────────────────────
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let pickingMode = false;
let hoveredMesh = null;

renderer.domElement.addEventListener('mousemove', (e) => {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(roomMeshes);

  // hover 복원
  if (hoveredMesh && (hits.length === 0 || hits[0].object !== hoveredMesh)) {
    hoveredMesh.material.emissiveIntensity = 0.08;
    hoveredMesh = null;
    renderer.domElement.style.cursor = pickingMode ? 'crosshair' : 'default';
  }
  if (hits.length > 0) {
    hoveredMesh = hits[0].object;
    hoveredMesh.material.emissiveIntensity = 0.4;
    renderer.domElement.style.cursor = 'pointer';
  }
});

renderer.domElement.addEventListener('click', (e) => {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  // 방 클릭
  const roomHits = raycaster.intersectObjects(roomMeshes);
  if (roomHits.length > 0) {
    showRoomInfo(roomHits[0].object.userData.room);
    return;
  }

  // 바닥 클릭 → 위치 설정
  if (pickingMode) {
    const floorHit = raycaster.intersectObject(floor);
    if (floorHit.length > 0) {
      const { x, z } = floorHit[0].point;
      socket.emit('set-location', { x, z });
      exitPickMode();
    }
  }
});

// ── UI: 방 정보 패널 ───────────────────────────────────────
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

// ── UI: 입장 ───────────────────────────────────────────────
function joinSession() {
  const name = document.getElementById('name-input').value.trim() || '익명';
  socket.emit('join', { name });
  document.getElementById('join-overlay').hidden = true;
}
document.getElementById('join-btn').addEventListener('click', joinSession);
document.getElementById('name-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') joinSession();
});

// ── UI: 위치 설정 ──────────────────────────────────────────
function enterPickMode() {
  pickingMode = true;
  renderer.domElement.style.cursor = 'crosshair';
  const btn = document.getElementById('locate-btn');
  btn.textContent = '📍 클릭하여 위치 지정 중...';
  btn.classList.add('active');
  document.getElementById('pick-hint').hidden = false;
}
function exitPickMode() {
  pickingMode = false;
  renderer.domElement.style.cursor = 'default';
  const btn = document.getElementById('locate-btn');
  btn.textContent = '📍 내 위치 설정';
  btn.classList.remove('active');
  document.getElementById('pick-hint').hidden = true;
}
document.getElementById('locate-btn').addEventListener('click', () => {
  pickingMode ? exitPickMode() : enterPickMode();
});

// ── UI: 방 목록 & 검색 ────────────────────────────────────
function renderRoomList(query = '') {
  const q = query.toLowerCase();
  const filtered = q ? ROOMS.filter(r =>
    r.name.toLowerCase().includes(q) || r.id.toLowerCase().includes(q)
  ) : ROOMS;

  document.getElementById('room-list').innerHTML = filtered.map(r => {
    const ti = ROOM_TYPES[r.type];
    return `<div class="room-item" onclick="focusRoom('${r.id}')">
      <span class="ri-dot" style="background:${ti.color}"></span>
      <span class="ri-id-sm">${r.id}</span>
      <span class="ri-name-sm">${r.name}</span>
    </div>`;
  }).join('');

  // 3D에서 미매칭 방 흐리게
  roomMeshes.forEach(m => {
    const r = m.userData.room;
    const match = !q || r.name.toLowerCase().includes(q) || r.id.toLowerCase().includes(q);
    m.material.opacity = match ? m.userData.originalOpacity : 0.08;
  });
}

document.getElementById('search-input').addEventListener('input', e => {
  renderRoomList(e.target.value);
});

window.focusRoom = (id) => {
  const room = ROOMS.find(r => r.id === id);
  if (!room) return;
  flyTo(room.x + room.w / 2, room.z + room.d / 2);
  showRoomInfo(room);
};

// ── UI: 유저 목록 ──────────────────────────────────────────
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

// ── 범례 렌더링 ────────────────────────────────────────────
document.getElementById('legend').innerHTML = Object.entries(ROOM_TYPES).map(([, v]) => `
  <div class="legend-item">
    <span class="legend-dot" style="background:${v.color}"></span>
    <span>${v.label}</span>
  </div>
`).join('');

// ── 애니메이션 루프 ────────────────────────────────────────
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  // 핀 펄싱
  userPins.forEach(pin => {
    const scale = 1 + 0.1 * Math.sin(t * 3);
    pin.children[1].scale.setScalar(scale); // ball
  });

  // fly-to 카메라 보간
  if (flyTarget) {
    camera.position.lerp(flyTarget.pos, 0.06);
    controls.target.lerp(flyTarget.look, 0.06);
    if (camera.position.distanceTo(flyTarget.pos) < 0.5) flyTarget = null;
  }

  controls.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}

// ── Init ───────────────────────────────────────────────────
window.addEventListener('resize', resize);
resize();
renderRoomList();
animate();
