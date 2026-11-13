// ── 오늘의 출근 운세 ─────────────────────────────────────────
// 배너 → 카드 뒷면(눌러서 열기) → 결과 카드. 결과는 서버(/api/fortune)가
// clientId + 날짜로 정하므로 하루 동안 항상 같은 운세가 나온다.

const CACHE_KEY = 'lf-fortune'; // 배너 표시용 캐시 { date, total, headline }
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function readCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); } catch (e) { return null; }
}
function writeCache(v) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(v)); } catch (e) {}
}
function todayKST() {
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}
function formatDate(ymd) {
  const [y, m, d] = ymd.split('-').map(Number);
  const wd = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${y}.${String(m).padStart(2, '0')}.${String(d).padStart(2, '0')} (${wd})`;
}
// 종합 점수 → 카드 강조색
function scoreColor(total) {
  if (total >= 80) return '#f59e0b';
  if (total >= 60) return '#22c55e';
  if (total >= 40) return '#3b82f6';
  return '#a78bfa';
}
function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function initFortune({ clientId, getName }) {
  const banner   = document.getElementById('fortune-banner');
  const bannerSub = document.getElementById('fortune-banner-sub');
  const bannerCta = document.getElementById('fortune-banner-cta');
  const modal    = document.getElementById('fortune-modal');
  const back     = document.getElementById('fortune-back');
  const card     = document.getElementById('fortune-card');

  let result = null; // 오늘 결과 (한 번 받으면 재사용)

  function syncBanner() {
    const c = readCache();
    if (c && c.date === todayKST() && c.headline) {
      banner.classList.add('fortune-banner--done');
      bannerSub.textContent = `${c.total}점 · ${c.headline}`;
      bannerCta.textContent = '다시 보기 ›';
    } else {
      banner.classList.remove('fortune-banner--done');
      bannerSub.textContent = '눌러서 오늘의 운을 확인하세요';
      bannerCta.textContent = '뽑기 ›';
    }
    banner.hidden = false;
  }

  function open() {
    modal.hidden = false;
    // 오늘 이미 본 결과가 있으면 바로 앞면
    if (result && result.date === todayKST()) {
      showCard(false);
    } else {
      result = null;
      back.hidden = false;
      back.classList.remove('is-opening');
      card.hidden = true;
    }
  }

  function close() {
    modal.hidden = true;
  }

  async function reveal() {
    if (back.classList.contains('is-opening')) return;
    back.classList.add('is-opening');
    try {
      const [res] = await Promise.all([
        fetch(`/api/fortune?clientId=${encodeURIComponent(clientId)}&name=${encodeURIComponent(getName() || '')}`).then(r => {
          if (!r.ok) throw new Error(r.status);
          return r.json();
        }),
        new Promise(r => setTimeout(r, 900)), // 흔들리는 애니메이션 최소 시간
      ]);
      result = res;
      writeCache({ date: res.date, total: res.total, headline: res.headline });
      syncBanner();
      showCard(true);
    } catch (e) {
      back.classList.remove('is-opening');
      back.querySelector('.fortune-back-sub').textContent = '운세를 불러오지 못했어요. 다시 눌러 주세요.';
    }
  }

  function showCard(animate) {
    const r = result;
    const name = getName();
    const showName = name && name !== '익명' && name !== '방문자';

    card.style.setProperty('--grade', scoreColor(r.total));
    card.innerHTML = `
      <div class="fc-head">
        <span class="fc-brand">🔮 오늘의 출근 운세</span>
        <span class="fc-date">${formatDate(r.date)}</span>
      </div>
      <div class="fc-hero">
        <div class="fc-name">${showName ? `${esc(name)} 님의 오늘 한 줄 평` : '오늘의 한 줄 평'}</div>
        <div class="fc-headline">${esc(r.headline)}</div>
        <div class="fc-total">출근 지수 <b data-count="${r.total}">0</b><small>/100</small></div>
      </div>
      <p class="fc-message">${esc(r.message)}</p>
      <div class="fc-stats">
        ${r.stats.map((s, i) => `
          <div class="fc-stat" style="--i:${i}">
            <span class="fc-stat-label">${s.emoji} ${esc(s.label)}</span>
            <span class="fc-stat-bar"><span class="fc-stat-fill" style="--w:${s.score}%"></span></span>
            <b class="fc-stat-score" data-count="${s.score}">0</b>
            <span class="fc-stat-comment">${esc(s.comment)}</span>
          </div>`).join('')}
      </div>
      <div class="fc-lucky">
        <div><span>📍 행운의 장소</span><b>${esc(r.lucky.place)}</b></div>
        <div><span>🍀 행운의 아이템</span><b>${esc(r.lucky.item)}</b></div>
        <div class="fc-wide"><span>⏰ 행운의 시간</span><b>${esc(r.lucky.time)}</b></div>
      </div>
      <div class="fc-box"><span>🤝 오늘의 귀인</span>${esc(r.helper)}</div>
      <div class="fc-box fc-box--mission"><span>🎯 오늘의 미션</span>${esc(r.mission)}</div>
      <div class="fc-box fc-box--caution"><span>⚠️ 오늘 조심할 것</span>${esc(r.caution)}</div>
      <div class="fc-foot">
        <span>${r.alreadyDrawn ? '오늘 이미 뽑은 운세예요 · ' : ''}오늘 ${r.order}번째로 운세 확인</span>
        <span>office-map.onrender.com</span>
      </div>`;

    back.hidden = true;
    card.hidden = false;
    card.classList.toggle('is-revealed', animate);
    card.classList.toggle('is-static', !animate);
    card.scrollTop = 0;
    modal.scrollTop = 0;

    // 숫자 카운트업
    card.querySelectorAll('[data-count]').forEach(el => {
      const to = Number(el.dataset.count);
      if (!animate) { el.textContent = to; return; }
      const start = performance.now() + 350;
      const tick = now => {
        const t = Math.min(1, Math.max(0, (now - start) / 900));
        el.textContent = Math.round(to * (1 - Math.pow(1 - t, 3)));
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  banner.addEventListener('click', open);
  back.addEventListener('click', reveal);
  document.getElementById('fortune-close').addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  window.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) close(); });

  syncBanner();
}
