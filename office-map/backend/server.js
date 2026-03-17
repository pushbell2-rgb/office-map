const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/public', express.static(path.join(__dirname, '../public')));

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

  socket.on('join', ({ name, emoji }) => {
    users.set(socket.id, {
      id: socket.id,
      name: name || '익명',
      emoji: emoji || '🙂',
      x: null, z: null,
      color,
    });
    socket.emit('joined', { color });
    broadcast();
  });

  socket.on('set-location', ({ x, z }) => {
    const user = users.get(socket.id);
    if (user) { user.x = x; user.z = z; broadcast(); }
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
    }
  });
});

// 24시간마다 끊긴 사용자 정리
setInterval(() => {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  let changed = false;
  for (const [id, user] of users) {
    if (user.disconnected && user.disconnectedAt < cutoff) {
      users.delete(id);
      changed = true;
    }
  }
  if (changed) broadcast();
}, 60 * 60 * 1000);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`[서버] 회의실 찾기: http://localhost:${PORT}`);
});
