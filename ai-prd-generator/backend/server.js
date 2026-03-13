require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// API 키 검증
if (!process.env.OPENAI_API_KEY) {
  console.error('[서버] 오류: OPENAI_API_KEY 환경 변수가 설정되지 않았습니다.');
  console.error('[서버] .env.example을 참고하여 .env 파일을 생성해주세요.');
  process.exit(1);
}

const prdRouter = require('./routes/prd');

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어
app.use(cors());
app.use(express.json());

// 정적 파일 서빙 (프론트엔드)
app.use(express.static(path.join(__dirname, '../frontend')));

// API 라우터
app.use('/api', prdRouter);

// SPA 폴백 — 모든 non-API 요청은 index.html로
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
  console.log(`[서버] AI PRD Generator 실행 중: http://localhost:${PORT}`);
});
