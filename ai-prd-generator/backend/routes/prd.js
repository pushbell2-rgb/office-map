const express = require('express');
const { generatePRD, regenerateSection } = require('../services/ai-service');

const router = express.Router();

// POST /api/generate-prd
router.post('/generate-prd', async (req, res) => {
  const { idea, targetUser = '', category = '' } = req.body;

  if (!idea || !idea.trim()) {
    return res.status(400).json({ success: false, error: 'idea 필드는 필수입니다.' });
  }
  if (idea.trim().length > 500) {
    return res.status(400).json({ success: false, error: 'idea는 500자 이내로 입력해주세요.' });
  }

  try {
    const { prd, markdown } = await generatePRD(idea.trim(), targetUser.trim(), category.trim());
    res.json({ success: true, prd, markdown });
  } catch (err) {
    console.error('[라우터] PRD 생성 오류:', err.message);
    const isParseError = err instanceof SyntaxError;
    res.status(500).json({
      success: false,
      error: isParseError
        ? 'AI 응답을 처리하는 중 오류가 발생했습니다. 다시 시도해주세요.'
        : 'AI 서비스 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
    });
  }
});

// POST /api/regenerate-section
router.post('/regenerate-section', async (req, res) => {
  const { key, idea, targetUser = '', category = '' } = req.body;

  if (!key || !idea || !idea.trim()) {
    return res.status(400).json({ success: false, error: 'key와 idea 필드는 필수입니다.' });
  }

  try {
    const content = await regenerateSection(key, idea.trim(), targetUser.trim(), category.trim());
    res.json({ success: true, key, content });
  } catch (err) {
    console.error('[라우터] 섹션 재생성 오류:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
