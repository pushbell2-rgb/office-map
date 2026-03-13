// ===== 상수 =====
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

const SECTION_KEYS = Object.keys(SECTION_LABELS);

// ===== 상태 =====
let currentPrd = null;
let currentInputs = {};

// ===== DOM 요소 =====
const form = document.getElementById('prdForm');
const ideaTextarea = document.getElementById('idea');
const ideaCount = document.getElementById('ideaCount');
const ideaError = document.getElementById('ideaError');
const submitBtn = document.getElementById('submitBtn');
const downloadBtn = document.getElementById('downloadBtn');
const retryBtn = document.getElementById('retryBtn');

const resultEmpty = document.getElementById('resultEmpty');
const resultLoading = document.getElementById('resultLoading');
const resultError = document.getElementById('resultError');
const resultContent = document.getElementById('resultContent');
const prdSections = document.getElementById('prdSections');
const errorMessage = document.getElementById('errorMessage');

// ===== 유틸리티 =====
function showPanel(panelEl) {
  [resultEmpty, resultLoading, resultError, resultContent].forEach((el) => {
    el.hidden = el !== panelEl;
  });
}

function setLoading(loading) {
  const btnText = submitBtn.querySelector('.btn-text');
  const btnLoader = submitBtn.querySelector('.btn-loader');
  submitBtn.disabled = loading;
  btnText.hidden = loading;
  btnLoader.hidden = !loading;
}

function simpleMarkdown(text) {
  // 최소한의 Markdown → HTML 변환
  return text
    .replace(/^### (.+)$/gm, '<strong>$1</strong>')
    .replace(/^## (.+)$/gm, '<strong>$1</strong>')
    .replace(/^# (.+)$/gm, '<strong>$1</strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '• $1')
    .replace(/^\d+\. (.+)$/gm, (_, p1, offset, str) => {
      const num = str.slice(0, offset).split('\n').filter(l => /^\d+\./.test(l)).length + 1;
      return `${num}. ${p1}`;
    });
}

// ===== PRD 렌더링 =====
function renderPRD(prd) {
  prdSections.innerHTML = '';

  SECTION_KEYS.forEach((key) => {
    const section = document.createElement('div');
    section.className = 'prd-section';
    section.dataset.key = key;

    section.innerHTML = `
      <div class="prd-section-header">
        <span class="prd-section-title">${SECTION_LABELS[key]}</span>
        <button class="btn-regenerate" data-key="${key}" title="${SECTION_LABELS[key]} 섹션 재생성">재생성</button>
      </div>
      <div class="prd-section-body">${prd[key] || ''}</div>
    `;

    section.querySelector('.btn-regenerate').addEventListener('click', () => {
      handleRegenerate(key, section);
    });

    prdSections.appendChild(section);
  });

  showPanel(resultContent);
  downloadBtn.disabled = false;
}

// ===== 섹션 재생성 =====
async function handleRegenerate(key, sectionEl) {
  const btn = sectionEl.querySelector('.btn-regenerate');
  const body = sectionEl.querySelector('.prd-section-body');

  btn.disabled = true;
  btn.textContent = '생성 중...';
  body.style.opacity = '0.4';

  try {
    const res = await fetch('/api/regenerate-section', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, ...currentInputs }),
    });

    const data = await res.json();
    if (!data.success) throw new Error(data.error);

    body.textContent = data.content;
    currentPrd[key] = data.content;
  } catch (err) {
    alert(`섹션 재생성에 실패했습니다: ${err.message}`);
  } finally {
    btn.disabled = false;
    btn.textContent = '재생성';
    body.style.opacity = '1';
  }
}

// ===== 폼 제출 =====
async function handleSubmit(e) {
  e.preventDefault();

  const idea = ideaTextarea.value.trim();
  if (!idea) {
    ideaError.hidden = false;
    ideaTextarea.classList.add('error');
    ideaTextarea.focus();
    return;
  }

  ideaError.hidden = true;
  ideaTextarea.classList.remove('error');

  currentInputs = {
    idea,
    targetUser: document.getElementById('targetUser').value.trim(),
    category: document.getElementById('category').value.trim(),
  };

  setLoading(true);
  showPanel(resultLoading);
  downloadBtn.disabled = true;

  try {
    const res = await fetch('/api/generate-prd', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentInputs),
    });

    const data = await res.json();
    if (!data.success) throw new Error(data.error);

    currentPrd = data.prd;
    renderPRD(data.prd);
  } catch (err) {
    errorMessage.textContent = err.message || '알 수 없는 오류가 발생했습니다.';
    showPanel(resultError);
  } finally {
    setLoading(false);
  }
}

// ===== Markdown 다운로드 =====
function handleDownload() {
  if (!currentPrd) return;

  const lines = ['# PRD: ' + (currentInputs.idea || '').slice(0, 60), ''];
  if (currentInputs.targetUser) lines.push(`> **타겟 사용자**: ${currentInputs.targetUser}`, '');
  if (currentInputs.category) lines.push(`> **카테고리**: ${currentInputs.category}`, '');
  lines.push('---', '');

  SECTION_KEYS.forEach((key) => {
    lines.push(`## ${SECTION_LABELS[key]}`, '', currentPrd[key] || '', '', '---', '');
  });

  const markdown = lines.join('\n');
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const slug = (currentInputs.idea || 'prd').slice(0, 20).replace(/\s+/g, '-');
  const filename = `prd-${slug}-${dateStr}.md`;

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ===== 이벤트 바인딩 =====
form.addEventListener('submit', handleSubmit);
downloadBtn.addEventListener('click', handleDownload);
retryBtn.addEventListener('click', () => {
  showPanel(resultEmpty);
  form.dispatchEvent(new Event('submit'));
});

ideaTextarea.addEventListener('input', () => {
  ideaCount.textContent = ideaTextarea.value.length;
  if (ideaTextarea.value.trim()) {
    ideaError.hidden = true;
    ideaTextarea.classList.remove('error');
  }
});
