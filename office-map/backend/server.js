const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// 정적 파일 서빙
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/public', express.static(path.join(__dirname, '../public')));

// 인메모리 사용자 상태
const users = new Map();
const PIN_COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
let colorIdx = 0;

function broadcast() {
  io.emit('users-update', Array.from(users.values()));
}

io.on('connection', (socket) => {
  console.log('[소켓] 연결:', socket.id);
  const color = PIN_COLORS[colorIdx++ % PIN_COLORS.length];

  // 현재 사용자 목록 즉시 전송
  socket.emit('users-update', Array.from(users.values()));

  socket.on('join', ({ name }) => {
    users.set(socket.id, { id: socket.id, name: name || '익명', x: null, z: null, color });
    socket.emit('joined', { color });
    broadcast();
  });

  socket.on('set-location', ({ x, z }) => {
    const user = users.get(socket.id);
    if (user) { user.x = x; user.z = z; broadcast(); }
  });

  socket.on('disconnect', () => {
    console.log('[소켓] 연결 끊김:', socket.id);
    users.delete(socket.id);
    broadcast();
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`[서버] 회의실 찾기: http://localhost:${PORT}`);
});
