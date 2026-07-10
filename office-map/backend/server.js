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
