const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SECTION_KEYS = [
  'executiveSummary',
  'problemStatement',
  'targetUsers',
  'goalsAndMetrics',
  'coreFeatures',
  'userStories',
  'technicalConsiderations',
  'risksAndMitigation',
];

const SECTION_LABELS = {
  executiveSummary: 'Executive Summary',
  problemStatement: 'Problem Statement',
  targetUsers: 'Target Users & Personas',
  goalsAndMetrics: 'Goals & Success Metrics',
  coreFeatures: 'Core Features (MVP)',
  userStories: 'User Stories',
  technicalConsiderations: 'Technical Considerations',
  risksAndMitigation: 'Risks & Mitigation',
};

function buildSystemPrompt() {
  return `You are an expert Product Manager who writes clear, structured PRDs.
You MUST respond with a valid JSON object only — no markdown fences, no extra text.

The JSON must have exactly these 8 keys:
- executiveSummary
- problemStatement
- targetUsers
- goalsAndMetrics
- coreFeatures
- userStories
- technicalConsiderations
- risksAndMitigation

Each value is a Markdown string (use headers, bullet lists, tables as appropriate).
Write in Korean. Be specific, practical, and concise.`;
}

function buildUserPrompt(idea, targetUser, category) {
  const lines = [`서비스 아이디어: ${idea}`];
  if (targetUser) lines.push(`타겟 사용자: ${targetUser}`);
  if (category) lines.push(`산업군/카테고리: ${category}`);
  return lines.join('\n') + '\n\n이 아이디어에 대한 PRD를 작성해주세요.';
}

function buildMarkdown(prd) {
  return SECTION_KEYS.map((key) => {
    return `## ${SECTION_LABELS[key]}\n\n${prd[key]}`;
  }).join('\n\n---\n\n');
}

async function generatePRD(idea, targetUser = '', category = '') {
  console.log('[AI] PRD 생성 요청:', { idea: idea.slice(0, 50) });

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    temperature: 0.7,
    system: buildSystemPrompt(),
    messages: [{ role: 'user', content: buildUserPrompt(idea, targetUser, category) }],
  });

  const raw = message.content[0].text.trim();
  const prd = JSON.parse(raw);

  // 필수 키 검증
  for (const key of SECTION_KEYS) {
    if (!prd[key]) throw new Error(`AI 응답에 '${key}' 섹션이 누락되었습니다.`);
  }

  const markdown = buildMarkdown(prd);
  console.log('[AI] PRD 생성 완료');
  return { prd, markdown };
}

async function regenerateSection(key, idea, targetUser = '', category = '') {
  if (!SECTION_KEYS.includes(key)) throw new Error(`유효하지 않은 섹션 키: ${key}`);

  console.log('[AI] 섹션 재생성 요청:', key);

  const sectionLabel = SECTION_LABELS[key];
  const prompt = `${buildUserPrompt(idea, targetUser, category)}\n\n위 아이디어에 대해 PRD의 "${sectionLabel}" 섹션만 Markdown 형식으로 작성해주세요. JSON 없이 Markdown 텍스트만 반환하세요.`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    temperature: 0.7,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = message.content[0].text.trim();
  console.log('[AI] 섹션 재생성 완료:', key);
  return content;
}

module.exports = { generatePRD, regenerateSection, SECTION_LABELS };
