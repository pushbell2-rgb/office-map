const OpenAI = require('openai');

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
  return `You are an expert Product Manager who writes concise, structured PRDs.
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

IMPORTANT: This is a hackathon demo. Keep each section to 2-3 sentences maximum.
Each value must be under 100 characters. Be extremely concise.
Write in Korean.`;
}

function buildUserPrompt(idea, targetUser, category) {
  const lines = [`서비스 아이디어: ${idea}`];
  if (targetUser) lines.push(`타겟 사용자: ${targetUser}`);
  if (category) lines.push(`산업군/카테고리: ${category}`);
  return lines.join('\n') + '\n\n이 아이디어에 대한 간결한 PRD를 작성해주세요.';
}

function buildMarkdown(prd) {
  return SECTION_KEYS.map((key) => {
    return `## ${SECTION_LABELS[key]}\n\n${prd[key]}`;
  }).join('\n\n---\n\n');
}

async function generatePRD(idea, targetUser = '', category = '') {
  console.log('[AI] PRD 생성 요청:', { idea: idea.slice(0, 50) });

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 1000,
    messages: [
      { role: 'system', content: buildSystemPrompt() },
      { role: 'user', content: buildUserPrompt(idea, targetUser, category) },
    ],
  });

  const raw = response.choices[0].message.content.trim();
  const prd = JSON.parse(raw);

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
  const prompt = `${buildUserPrompt(idea, targetUser, category)}\n\n위 아이디어의 PRD에서 "${sectionLabel}" 섹션만 2-3문장으로 간결하게 작성해주세요. Markdown 텍스트만 반환하세요.`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 200,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.choices[0].message.content.trim();
  console.log('[AI] 섹션 재생성 완료:', key);
  return content;
}

module.exports = { generatePRD, regenerateSection, SECTION_LABELS };
