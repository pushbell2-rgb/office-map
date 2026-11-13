const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const POSITIONS_FILE = path.join(__dirname, 'positions.json');
let savedPositions = {};
try {
  const raw = fs.readFileSync(POSITIONS_FILE, 'utf8');
  savedPositions = JSON.parse(raw || '{}');
  console.log('[위치] 저장된 위치 로드:', Object.keys(savedPositions).length, '명');
} catch (e) {
  savedPositions = {};
}

function savePositions() {
  fs.writeFile(POSITIONS_FILE, JSON.stringify(savedPositions, null, 2), () => {});
}

// ── 접속 로그 ─────────────────────────────────────────────────
// 누가(name) / 언제(connectedAt) / 어떤 브라우저(clientId)로 접속했는지 기록
const CONNECTIONS_FILE = path.join(__dirname, 'connections.json');
const MAX_LOG = 5000; // 로그 무한 증가 방지 (최근 5000건 유지)
let connectionLog = [];
try {
  const raw = fs.readFileSync(CONNECTIONS_FILE, 'utf8');
  connectionLog = JSON.parse(raw || '[]');
  if (!Array.isArray(connectionLog)) connectionLog = [];
  console.log('[접속로그] 기존 로그 로드:', connectionLog.length, '건');
} catch (e) {
  connectionLog = [];
}

function logConnection(entry) {
  connectionLog.push(entry);
  if (connectionLog.length > MAX_LOG) connectionLog = connectionLog.slice(-MAX_LOG);
  fs.writeFile(CONNECTIONS_FILE, JSON.stringify(connectionLog, null, 2), () => {});
}

app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/public', express.static(path.join(__dirname, '../public')));

app.get('/api/positions', (req, res) => {
  res.json(savedPositions);
});

// 접속 로그 조회. ?key=minjong123 일치할 때만 응답
const LOG_KEY = 'minjong123';
app.get('/api/connections', (req, res) => {
  if (req.query.key !== LOG_KEY) {
    return res.status(403).json({ error: 'forbidden' });
  }
  res.json({ count: connectionLog.length, connections: connectionLog });
});

// ── 오늘의 출근 운세 ─────────────────────────────────────────
// 문구는 data/fortunes.json 에서 관리. clientId + 날짜(KST) 시드라서
// 같은 브라우저는 하루 동안 몇 번을 열어도 같은 결과 (서버 재시작에도 유지)
const FORTUNES_FILE = path.join(__dirname, '../data/fortunes.json');
let fortunes = null;
try {
  fortunes = JSON.parse(fs.readFileSync(FORTUNES_FILE, 'utf8'));
  console.log('[운세] 문구 로드:', fortunes.messages.length, '개');
} catch (e) {
  console.error('[운세] fortunes.json 로드 실패 — 운세 기능 비활성:', e.message);
}

function todayKST() {
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

// 운세 사용 기록: 하루 첫 뽑기마다 시간·결과를 쌓음 (/api/fortune-log 로 조회)
const FORTUNE_LOG_FILE = path.join(__dirname, 'fortune_log.json');
let fortuneLog = [];
try {
  fortuneLog = JSON.parse(fs.readFileSync(FORTUNE_LOG_FILE, 'utf8') || '[]');
  if (!Array.isArray(fortuneLog)) fortuneLog = [];
  console.log('[운세] 기존 기록 로드:', fortuneLog.length, '건');
} catch (e) {
  fortuneLog = [];
}

function logFortune(entry) {
  fortuneLog.push(entry);
  if (fortuneLog.length > MAX_LOG) fortuneLog = fortuneLog.slice(-MAX_LOG);
  fs.writeFile(FORTUNE_LOG_FILE, JSON.stringify(fortuneLog, null, 2), () => {});
}

// 오늘 뽑은 사람 (몇 번째인지 표시 + 중복 기록 방지). 재시작 시 기록에서 복원
let fortuneDate = todayKST();
const fortuneDraws = new Map(); // clientId → { order }
fortuneLog.filter(l => l.date === fortuneDate).forEach(l => {
  if (!fortuneDraws.has(l.clientId)) fortuneDraws.set(l.clientId, { order: fortuneDraws.size + 1 });
});

// 문자열 → 32bit 시드 (FNV-1a) → 시드 기반 난수 (mulberry32)
function seededRandom(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function drawFortune(clientId, date) {
  const rand = seededRandom(`${date}|${clientId}`);
  const pick = arr => arr[Math.floor(rand() * arr.length)];

  // 그날의 기본 운(30~95)을 정하고 항목별로 ±25 흔들어 수치가 들쭉날쭉하지 않게
  const base = 30 + Math.floor(rand() * 66);
  const stats = fortunes.stats.map(s => {
    const score = Math.min(100, Math.max(3, base + Math.floor(rand() * 51) - 25));
    const bucket = score >= 80 ? 'high' : score >= 50 ? 'mid' : 'low';
    return { label: s.label, emoji: s.emoji, score, comment: pick(s.comments[bucket]) };
  });

  return {
    date,
    headline: pick(fortunes.headlines),
    message: pick(fortunes.messages),
    total: Math.round(stats.reduce((s, x) => s + x.score, 0) / stats.length),
    stats,
    lucky: {
      place: pick(fortunes.luckyPlaces),
      item:  pick(fortunes.luckyItems),
      time:  pick(fortunes.luckyTimes),
    },
    helper:  pick(fortunes.helpers),
    mission: pick(fortunes.missions),
    caution: pick(fortunes.cautions),
  };
}

app.get('/api/fortune', (req, res) => {
  if (!fortunes) return res.status(503).json({ error: 'unavailable' });
  const clientId = String(req.query.clientId || '');
  if (!/^[\w-]{4,64}$/.test(clientId)) return res.status(400).json({ error: 'invalid clientId' });

  const date = todayKST();
  if (date !== fortuneDate) { fortuneDate = date; fortuneDraws.clear(); }

  const result = drawFortune(clientId, date);
  const alreadyDrawn = fortuneDraws.has(clientId);
  if (!alreadyDrawn) {
    fortuneDraws.set(clientId, { order: fortuneDraws.size + 1 });
    logFortune({
      date,
      drawnAt: new Date(Date.now() + 9 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19), // KST
      clientId,
      name: String(req.query.name || '').slice(0, 20),
      headline: result.headline,
      total: result.total,
      stats: Object.fromEntries(result.stats.map(s => [s.label, s.score])),
      message: result.message,
    });
  }

  res.json({
    ...result,
    alreadyDrawn,
    order: fortuneDraws.get(clientId).order,
    todayCount: fortuneDraws.size,
  });
});

// 운세 사용 기록 조회. 접속 로그와 같은 키 사용
app.get('/api/fortune-log', (req, res) => {
  if (req.query.key !== LOG_KEY) {
    return res.status(403).json({ error: 'forbidden' });
  }
  const daily = {};
  fortuneLog.forEach(l => { daily[l.date] = (daily[l.date] || 0) + 1; });
  res.json({ count: fortuneLog.length, daily, logs: fortuneLog });
});

const users = new Map();
const PIN_COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
let colorIdx = 0;

function broadcast() {
  io.emit('users-update', Array.from(users.values()));
}

io.on('connection', (socket) => {
  console.log('[소켓] 연결:', socket.id);
  const color = PIN_COLORS[colorIdx++ % PIN_COLORS.length];

  socket.emit('users-update', Array.from(users.values()));

  socket.on('join', ({ name, emoji, clientId }) => {
    const userName = name || '익명';
    users.set(socket.id, {
      id: socket.id,
      name: userName,
      emoji: emoji || '🙂',
      x: null, z: null,
      color,
    });
    logConnection({
      name: userName,
      clientId: clientId || null,   // 브라우저별 영속 ID (IP 대신 사용자 구분값)
      socketId: socket.id,          // 세션별 소켓 ID (재접속 시 변경됨)
      connectedAt: new Date().toISOString(),
    });
    socket.emit('joined', { color });
    socket.emit('desks-update', savedPositions);
    broadcast();
  });

  socket.on('set-location', ({ x, z }) => {
    const user = users.get(socket.id);
    if (user) { user.x = x; user.z = z; broadcast(); }
  });

  socket.on('set-desk', ({ x, z }) => {
    const user = users.get(socket.id);
    if (!user) return;
    savedPositions[user.name] = { x, z, emoji: user.emoji };
    savePositions();
    io.emit('desks-update', savedPositions);
  });

  socket.on('delete-desk', ({ name }) => {
    if (!name || !savedPositions[name]) return;
    delete savedPositions[name];
    savePositions();
    io.emit('desks-update', savedPositions);
  });

  socket.on('update-profile', ({ name, emoji }) => {
    const user = users.get(socket.id);
    if (user) {
      if (name) user.name = name;
      if (emoji) user.emoji = emoji;
      broadcast();
    }
  });

  // 채팅: 최대 20자 제한, 5초 후 자동 삭제
  socket.on('chat', ({ message }) => {
    const user = users.get(socket.id);
    if (!user || !message) return;
    const msg = String(message).slice(0, 20);
    io.emit('chat-message', {
      id: socket.id,
      message: msg,
      color: user.color,
    });
  });

  socket.on('disconnect', () => {
    console.log('[소켓] 연결 끊김:', socket.id);
    const user = users.get(socket.id);
    if (user) {
      user.disconnected = true;
      user.disconnectedAt = Date.now();
      broadcast();
      // 30초 유예 후 제거 (짧은 네트워크 단절 대응)
      setTimeout(() => {
        if (users.get(socket.id)?.disconnected) {
          users.delete(socket.id);
          broadcast();
        }
      }, 30 * 1000);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`[서버] 회의실 찾기: http://localhost:${PORT}`);
});
