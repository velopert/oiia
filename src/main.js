import './style.css';
import oiiaUrl from '/oiia.mp3?url';
import catGifUrl from '/oia-uia.gif?url';
import { createFX, createCatSpawner } from './effects.js';

const fx = createFX();
const catFx = createCatSpawner(catGifUrl);

let wakeLock = null;
async function requestWakeLock() {
  if (!('wakeLock' in navigator)) return;
  if (wakeLock && !wakeLock.released) return;
  try {
    wakeLock = await navigator.wakeLock.request('screen');
    wakeLock.addEventListener('release', () => { wakeLock = null; });
  } catch {}
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') requestWakeLock();
});

let fpsVal = 60, fpsFrames = 0, fpsLast = performance.now();
const fpsEl = document.createElement('div');
fpsEl.className = 'fps-meter';
document.body.appendChild(fpsEl);
(function fpsTick() {
  fpsFrames++;
  const now = performance.now();
  if (now - fpsLast >= 1000) {
    fpsVal = Math.round(fpsFrames * 1000 / (now - fpsLast));
    fpsFrames = 0;
    fpsLast = now;
    fpsEl.textContent = fpsVal + ' fps';
    fpsEl.classList.toggle('low', fpsVal < 45);
    fx.setQuality(fpsVal < 40 ? 0.5 : fpsVal < 50 ? 0.75 : 1);
  }
  requestAnimationFrame(fpsTick);
})();

function setupStartHint() {
  const hint = document.getElementById('start-hint');
  if (!hint) return;
  let dismissed = false;
  function dismiss() {
    if (dismissed) return;
    dismissed = true;
    hint.classList.add('hiding');
    setTimeout(() => hint.remove(), 500);
    document.removeEventListener('keydown', dismiss, true);
    document.removeEventListener('pointerdown', dismiss, true);
  }
  document.addEventListener('keydown', dismiss, true);
  document.addEventListener('pointerdown', dismiss, true);
}
setupStartHint();

function setupTour() {
  if (localStorage.getItem('oiia-tour-done-v1')) return;
  const root = document.getElementById('tour');
  if (!root) return;
  const titleEl = document.getElementById('tour-title');
  const bodyEl = document.getElementById('tour-body');
  const nEl = document.getElementById('tour-n');
  const arrow = document.getElementById('tour-arrow');
  const steps = [
    { title: '키를 눌러보세요', body: 'ㅜ(N) · ㅣ(L) · ㅏ(K) 각 자모가 소리와 파티클을 터뜨립니다.', target: '#keys .key' },
    { title: '꾹 눌러보세요', body: '키를 1초 이상 유지 → EDM 빌드업 → 드롭 폭발.', target: '#keys .key' },
    { title: 'DJ 슬롯 1–9', body: '숫자 키 또는 ▶ 버튼으로 DJ 이펙트 발사. 🎲 셔플 해보세요.', target: '#dj-slots .dj-slot-wrap' },
  ];
  let i = 0;
  function position() {
    const tgt = document.querySelector(steps[i].target);
    if (!tgt) return;
    const r = tgt.getBoundingClientRect();
    arrow.style.left = (r.left + r.width / 2 - 24) + 'px';
    arrow.style.top = (r.top + r.height / 2 - 24) + 'px';
  }
  function render() {
    titleEl.textContent = steps[i].title;
    bodyEl.textContent = steps[i].body;
    nEl.textContent = (i + 1);
    position();
  }
  function done() {
    localStorage.setItem('oiia-tour-done-v1', '1');
    document.removeEventListener('keydown', keyHandler, true);
    root.style.animation = 'sh-fadeout 0.3s ease forwards';
    setTimeout(() => root.remove(), 320);
  }
  function keyHandler(e) {
    if (root.hidden) return;
    if (e.key === 'Escape') { done(); return; }
    if (e.key === 'ArrowRight' || e.key === 'Enter' || e.code === 'Space') {
      e.preventDefault();
      i++;
      if (i >= steps.length) done();
      else render();
    } else if (e.key.length === 1 || /^Key|^Digit/.test(e.code)) {
      done();
    }
  }
  document.getElementById('tour-skip').onclick = done;
  document.getElementById('tour-next').onclick = () => {
    i++;
    if (i >= steps.length) done();
    else render();
  };
  document.addEventListener('keydown', keyHandler, true);
  window.addEventListener('resize', position);
  setTimeout(() => {
    root.hidden = false;
    render();
  }, 1600);
}
setupTour();

function setupTheme() {
  const saved = localStorage.getItem('oiia-theme-v1');
  if (saved === 'light') document.documentElement.setAttribute('data-theme', 'light');
  const btn = document.createElement('button');
  btn.className = 'theme-toggle';
  btn.setAttribute('aria-label', '테마 전환');
  btn.title = '다크 ↔ 라이트';
  function refresh() {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    btn.textContent = isLight ? '🌙' : '☀️';
  }
  refresh();
  btn.onclick = () => {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    if (isLight) {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('oiia-theme-v1', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('oiia-theme-v1', 'light');
    }
    refresh();
  };
  document.body.appendChild(btn);
}
setupTheme();

(function setupFxIntensity() {
  const slider = document.getElementById('fx-intensity');
  const val = document.getElementById('fx-intensity-val');
  if (!slider) return;
  const saved = +(localStorage.getItem('oiia-fx-intensity-v1') || 1);
  slider.value = saved;
  val.textContent = saved.toFixed(2).replace(/0+$/, '').replace(/\.$/, '') + '×';
  fx.setIntensity(saved);
  slider.addEventListener('input', () => {
    const v = +slider.value;
    fx.setIntensity(v);
    val.textContent = v.toFixed(2).replace(/0+$/, '').replace(/\.$/, '') + '×';
    localStorage.setItem('oiia-fx-intensity-v1', v);
  });
  slider.addEventListener('click', (e) => e.stopPropagation());
})();

document.getElementById('replay-tour')?.addEventListener('click', (e) => {
  e.stopPropagation();
  localStorage.removeItem('oiia-tour-done-v1');
  location.reload();
});
document.getElementById('reset-storage')?.addEventListener('click', (e) => {
  e.stopPropagation();
  if (!confirm('세그먼트·DJ 매핑·볼륨·테마·튜토리얼 기록을 모두 지우고 새로고침합니다. 진행?')) return;
  ['oiia-segments-v7', 'oiia-dj-mapping-v1', 'oiia-dj-vol-v1', 'oiia-theme-v1', 'oiia-tour-done-v1', 'oiia-master-vol-v1'].forEach((k) => localStorage.removeItem(k));
  location.href = location.origin + location.pathname;
});

const sessionStats = { key: {}, dj: {}, total: 0, start: Date.now() };

function bumpStat(group, id) {
  sessionStats[group][id] = (sessionStats[group][id] || 0) + 1;
  sessionStats.total++;
  if (sessionStats.total > 0 && sessionStats.total % 100 === 0) {
    celebrate(sessionStats.total);
  }
}

function celebrate(n) {
  const palette = ['#ff6b6b', '#ffd93d', '#6bcf7f', '#4d96ff', '#c86bff'];
  palette.forEach((c, i) => {
    setTimeout(() => fx.drop(c, `${n}!`), i * 90);
  });
  toast(`🎉 ${n} 프레스 달성!`);
  haptic([40, 30, 80]);
}

function renderStats() {
  const el = document.getElementById('keyhelp-stats');
  if (!el) return;
  const el_total = sessionStats.total;
  const keyEntries = Object.entries(sessionStats.key).sort((a, b) => b[1] - a[1]);
  const djEntries = Object.entries(sessionStats.dj).sort((a, b) => b[1] - a[1]);
  const minutes = Math.max(1, Math.round((Date.now() - sessionStats.start) / 60000));
  const perMin = Math.round(el_total / minutes);
  const keyTop = keyEntries.slice(0, 3).map(([k, v]) => `<span class="stats-chip">${k}·${v}</span>`).join('');
  const djTop = djEntries.slice(0, 3).map(([k, v]) => `<span class="stats-chip dj">${k.toUpperCase()}·${v}</span>`).join('');
  el.innerHTML = `
    <div class="stats-title">세션 통계</div>
    <div class="stats-row"><span>총 프레스</span><b>${el_total} (${perMin}/분)</b></div>
    <div class="stats-row"><span>경과 시간</span><b>~${minutes}분</b></div>
    ${keyTop ? `<div class="stats-row"><span>상위 키</span><b class="stats-chips">${keyTop}</b></div>` : ''}
    ${djTop ? `<div class="stats-row"><span>상위 DJ</span><b class="stats-chips">${djTop}</b></div>` : ''}
  `;
}

function setupKeyhelp() {
  const el = document.getElementById('keyhelp');
  if (!el) return;
  function toggle(show) {
    if (show === undefined) show = el.hidden;
    el.hidden = !show;
    if (show !== false) renderStats();
  }
  el.addEventListener('click', () => toggle(false));
  document.addEventListener('keydown', (e) => {
    if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
      e.preventDefault();
      toggle();
    } else if (e.key === 'Escape' && !el.hidden) {
      e.preventDefault();
      toggle(false);
    }
  });
}
setupKeyhelp();

const DEFAULT_SEGMENTS = [
  { id: 'o', jamo: 'ㅜ', latin: 'O', code: 'KeyN', key: 'ㅜ', start: 0.430, end: 0.622, color: '#ff6b6b' },
  { id: 'i', jamo: 'ㅣ', latin: 'I', code: 'KeyL', key: 'ㅣ', start: 1.345, end: 1.465, color: '#ffd93d' },
  { id: 'a', jamo: 'ㅏ', latin: 'A', code: 'KeyK', key: 'ㅏ', start: 0.831, end: 1.017, color: '#6bcf7f' },
  { id: 'ka', jamo: 'A', latin: 'A', code: 'KeyA', key: 'a', start: 0.440, end: 2.041, color: '#4d96ff' },
  { id: 'kb', jamo: 'B', latin: 'B', code: 'KeyB', key: 'b', start: 3.268, end: 5.304, color: '#c86bff' },
];

const KEY_ORDER = [
  { jamo: 'ㅜ', latin: 'O', code: 'KeyN', segId: 'o' },
  { jamo: 'ㅣ', latin: 'I', code: 'KeyL', segId: 'i' },
  { jamo: 'ㅏ', latin: 'A', code: 'KeyK', segId: 'a' },
  { jamo: 'A', latin: 'A', code: 'KeyA', segId: 'ka' },
  { jamo: 'B', latin: 'B', code: 'KeyB', segId: 'kb' },
];

const app = document.getElementById('app');
app.innerHTML = `
  <h1>Oiiai Keyboard</h1>
  <div class="hint">
    <code>ㅜ</code><code>ㅣ</code><code>ㅣ</code><code>ㅏ</code> (물리키 N/L/K) · 추가 슬롯 <code>A</code><code>B</code> · <code>1</code>–<code>9</code> = 🎧 DJ 이펙트 슬롯 · 꾹 누르기 = EDM 빌드업 + 드롭
    <br/>파형 조작: 구간 <b>클릭=선택</b> · 바디 <b>드래그=이동</b> · 경계선 <b>드래그=리사이즈</b> · 빈영역 <b>드래그=선택된 구간 범위 재지정</b> · 빈영역 클릭=미리듣기
    <br/>단축키: Space=전체재생 · <code>Tab</code>=구간 순환 · 파형 드래그로 구간 튜닝
  </div>
  <div class="active-bar" id="active-bar"></div>
  <div class="ticker" id="ticker" aria-hidden="true"></div>
  <div class="presets" id="presets"></div>
  <div class="seg-tools">
    <button id="randomize-segs" class="dj-shuffle" title="세그먼트 위치를 랜덤으로 (길이 유지)">🎰 세그먼트 랜덤</button>
  </div>
  <canvas id="waveform"></canvas>
  <div class="keys" id="keys"></div>
  <div class="segments" id="segments"></div>
  <div class="dj-header">
    <h3 style="margin:0;font-size:14px;color:#888;">🎧 DJ 슬롯 (1–9 키)</h3>
    <input id="dj-filter" class="dj-filter" type="search" placeholder="이펙트 검색…" />
    <button id="shuffle-dj" class="dj-shuffle" title="9개 슬롯을 전부 랜덤 이펙트로">🎲 셔플</button>
    <button id="reset-dj" class="dj-shuffle" title="DJ 슬롯을 기본값으로">↺ 기본</button>
  </div>
  <div class="dj-slots" id="dj-slots"></div>
  <div class="controls">
    <button id="play-all">▶ 전체 재생 (Space)</button>
    <button id="play-oiia" class="secondary">▶ ㅜㅣㅣㅏ 순서로</button>
    <button id="rec" class="rec-btn">⏺ 녹음</button>
    <button id="tap" class="tap-btn" title="t 키로도 탭">
      <span class="tap-label">TAP</span>
      <span id="bpm-value" class="bpm-value">— BPM</span>
    </button>
    <button id="auto-beat" class="secondary">🎲 Auto-beat</button>
    <button id="metro" class="secondary" title="BPM 클릭 트랙 (BPM 설정 필요)">🥁 Metro</button>
    <button id="make-clip" class="make-clip-btn">🎬 Make Clip</button>
    <button id="replay-btn" class="secondary" title="마지막 10초를 리플레이">🎞 리플레이</button>
    <button id="loop-btn" class="loop-btn">🔁 루프</button>
    <button id="loop-speed" class="secondary" title="루프 재생 속도">1×</button>
    <button id="share" class="secondary">🔗 링크 공유</button>
    <button id="share-x" class="secondary">𝕏 트윗</button>
    <button id="reset" class="secondary">↺ 기본값</button>
    <button id="export" class="secondary">⬇ 타임스탬프 복사</button>
    <label class="master-vol-wrap" title="마스터 볼륨">
      <span>🔊</span>
      <input type="range" id="master-vol" min="0" max="1.3" step="0.01" value="0.9">
    </label>
  </div>
  <div id="countdown" class="countdown" hidden></div>
  <div id="toast" class="toast" hidden></div>
`;

let audioCtx;
let buffer;
let segments = loadSegments();
let activeSegIndex = 0;
let dragState = null;

const canvas = document.getElementById('waveform');
const keysEl = document.getElementById('keys');
const segsEl = document.getElementById('segments');

function loadSegments() {
  try {
    const saved = localStorage.getItem('oiia-segments-v7');
    if (saved) return JSON.parse(saved);
  } catch {}
  return structuredClone(DEFAULT_SEGMENTS);
}

const segHistory = [];
function pushSegHistory() {
  segHistory.push(JSON.stringify(segments));
  if (segHistory.length > 10) segHistory.shift();
}
function undoSegments() {
  if (segHistory.length < 2) return false;
  segHistory.pop();
  const prev = segHistory[segHistory.length - 1];
  if (!prev) return false;
  const restored = JSON.parse(prev);
  segments.forEach((s, i) => {
    if (restored[i]) {
      s.start = restored[i].start;
      s.end = restored[i].end;
    }
  });
  localStorage.setItem('oiia-segments-v7', JSON.stringify(segments));
  renderSegments();
  renderActiveBar();
  drawWaveform();
  toast('세그먼트 되돌림');
  return true;
}

function saveSegments() {
  localStorage.setItem('oiia-segments-v7', JSON.stringify(segments));
  pushSegHistory();
}

let masterOut;
let masterGain;
let djBus;

async function init() {
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterOut = audioCtx.createDynamicsCompressor();
    masterOut.threshold.value = -8;
    masterOut.knee.value = 18;
    masterOut.ratio.value = 6;
    masterOut.attack.value = 0.003;
    masterOut.release.value = 0.18;
    masterGain = audioCtx.createGain();
    masterGain.gain.value = +(localStorage.getItem('oiia-master-vol-v1') ?? 0.9);
    masterGain.connect(audioCtx.destination);
    masterOut.connect(masterGain);
    djBus = audioCtx.createGain();
    djBus.gain.value = 1;
    djBus.connect(masterOut);
    const mv = document.getElementById('master-vol');
    if (mv) {
      mv.value = masterGain.gain.value;
      mv.addEventListener('input', () => {
        masterGain.gain.value = +mv.value;
        localStorage.setItem('oiia-master-vol-v1', mv.value);
      });
    }
    const res = await fetch(oiiaUrl);
    const arr = await res.arrayBuffer();
    buffer = await audioCtx.decodeAudioData(arr);
    clampSegments();
    pushSegHistory();
    renderKeys();
    renderActiveBar();
    renderSegments();
    renderDjSlots();
    renderPresets();
    drawWaveform();
    loadFromHash();
  } catch (err) {
    app.innerHTML = `<div class="error">로드 실패: ${err.message}</div>`;
  }
}

function clampSegments() {
  segments.forEach((s) => {
    if (s.end > buffer.duration) s.end = buffer.duration;
    if (s.start < 0) s.start = 0;
    if (s.start >= s.end) s.start = Math.max(0, s.end - 0.05);
  });
}

function drawWaveform() {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, h);

  const data = buffer.getChannelData(0);
  const step = Math.ceil(data.length / w);
  const amp = h / 2;

  ctx.strokeStyle = '#3a7ab8';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < w; i++) {
    let min = 1, max = -1;
    for (let j = 0; j < step; j++) {
      const v = data[i * step + j];
      if (v < min) min = v;
      if (v > max) max = v;
    }
    ctx.moveTo(i, (1 + min) * amp);
    ctx.lineTo(i, (1 + max) * amp);
  }
  ctx.stroke();

  segments.forEach((s, i) => {
    const x1 = (s.start / buffer.duration) * w;
    const x2 = (s.end / buffer.duration) * w;
    const isActive = i === activeSegIndex;
    ctx.fillStyle = s.color + (isActive ? '55' : '1f');
    ctx.fillRect(x1, 0, x2 - x1, h);
    ctx.fillStyle = s.color;
    ctx.fillRect(x1, 0, isActive ? 3 : 2, h);
    ctx.fillRect(x2 - (isActive ? 3 : 2), 0, isActive ? 3 : 2, h);
    ctx.fillStyle = '#fff';
    ctx.font = (isActive ? 'bold 14px' : 'bold 13px') + ' sans-serif';
    ctx.fillText(s.jamo + (isActive ? ' ●' : ''), x1 + 4, 16);
  });

  ctx.fillStyle = '#555';
  ctx.font = '10px ui-monospace, monospace';
  for (let t = 0; t <= buffer.duration; t += 0.5) {
    const x = (t / buffer.duration) * w;
    ctx.fillRect(x, h - 8, 1, 8);
    ctx.fillText(t.toFixed(1) + 's', x + 2, h - 10);
  }
}

function renderKeys() {
  keysEl.innerHTML = '';
  KEY_ORDER.forEach((k) => {
    const seg = segments.find((s) => s.id === k.segId);
    const color = seg ? seg.color : '#888';
    const el = document.createElement('div');
    el.className = 'key';
    el.id = 'key-' + k.code;
    el.style.setProperty('--c', color);
    el.innerHTML = `
      <div class="jamo">${k.jamo}</div>
      <div class="latin">${k.latin}</div>
      <div class="bind">${k.code.replace('Key', '')} · ${k.jamo}</div>
    `;
    el.addEventListener('pointerdown', () => pressKey(k.code));
    keysEl.appendChild(el);
  });
}

function renderSegments() {
  segsEl.innerHTML = '';
  segments.forEach((s, i) => {
    const el = document.createElement('div');
    el.className = 'seg' + (i === activeSegIndex ? ' active' : '');
    el.dataset.idx = i;
    el.addEventListener('click', (ev) => {
      if (ev.target.tagName === 'INPUT' || ev.target.tagName === 'BUTTON') return;
      setActiveSegment(i);
    });
    el.innerHTML = `
      <div class="seg-head">
        <span class="seg-label">${s.jamo} <span style="color:#888;font-weight:400">(${s.id})</span></span>
        <input type="color" data-color="${i}" value="${s.color}" title="세그먼트 컬러" class="seg-color">
        <span class="seg-meta">${(s.end - s.start).toFixed(3)}s</span>
      </div>
      <div class="row"><span>start</span><span id="v-${i}-start">${s.start.toFixed(3)}s</span></div>
      <input type="range" min="0" max="${buffer.duration.toFixed(3)}" step="0.005" value="${s.start}" data-i="${i}" data-k="start">
      <div class="row"><span>end</span><span id="v-${i}-end">${s.end.toFixed(3)}s</span></div>
      <input type="range" min="0" max="${buffer.duration.toFixed(3)}" step="0.005" value="${s.end}" data-i="${i}" data-k="end">
      <button data-play="${i}">▶ ${s.jamo} 재생</button>
    `;
    segsEl.appendChild(el);
  });
  segsEl.querySelectorAll('input[type=range]').forEach((inp) => {
    inp.addEventListener('input', (e) => {
      const i = +e.target.dataset.i;
      const k = e.target.dataset.k;
      segments[i][k] = +e.target.value;
      document.getElementById(`v-${i}-${k}`).textContent = (+e.target.value).toFixed(3) + 's';
      segsEl.children[i].querySelector('.seg-meta').textContent = (segments[i].end - segments[i].start).toFixed(3) + 's';
      saveSegments();
      drawWaveform();
    });
  });
  segsEl.querySelectorAll('button[data-play]').forEach((btn) => {
    btn.addEventListener('click', () => playSegmentByIndex(+btn.dataset.play));
  });
  segsEl.querySelectorAll('input[data-color]').forEach((cp) => {
    cp.addEventListener('input', (e) => {
      const i = +e.target.dataset.color;
      segments[i].color = e.target.value;
      saveSegments();
      drawWaveform();
      renderKeys();
      renderActiveBar();
    });
  });
}

function playSegmentByIndex(i) {
  const s = segments[i];
  if (!s) return;
  const dur = Math.max(0.01, s.end - s.start);
  const fadeDur = Math.min(0.006, dur / 4);
  const src = audioCtx.createBufferSource();
  src.buffer = buffer;
  const g = audioCtx.createGain();
  g.connect(masterOut);
  src.connect(g);
  const t = audioCtx.currentTime;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(1, t + fadeDur);
  g.gain.setValueAtTime(1, t + Math.max(fadeDur, dur - fadeDur));
  g.gain.linearRampToValueAtTime(0, t + dur);
  src.start(0, s.start, dur);
}

function playSegmentById(id) {
  const i = segments.findIndex((s) => s.id === id);
  if (i >= 0) playSegmentByIndex(i);
}

function haptic(ms) {
  try { navigator.vibrate && navigator.vibrate(ms); } catch {}
}

function pressKey(code, intensity = 1) {
  if (audioCtx?.state === 'suspended') audioCtx.resume();
  requestWakeLock();
  const k = KEY_ORDER.find((x) => x.code === code);
  if (!k) return;
  loopRec('key', code);
  replayRec('key', code);
  bumpStat('key', k.jamo);
  playSegmentById(k.segId);
  flashKey(code);
  const seg = segments.find((s) => s.id === k.segId);
  if (seg) fx.burst(seg.color, seg.jamo, intensity);
  if (code === 'KeyA') catFx.spawn();
  haptic(Math.min(30, 12 + intensity * 6));
}

const activeDjNodes = new Set();

function stopAllDj() {
  for (const n of activeDjNodes) {
    try { n.stop(); } catch {}
  }
  activeDjNodes.clear();
}

let aSubBufferCache = null;
let aSubBufferKey = '';

function getDjBuffer() {
  if (!buffer) return null;
  const seg = segments.find((s) => s.id === 'ka');
  if (!seg) return buffer;
  const key = `${seg.start.toFixed(4)}|${seg.end.toFixed(4)}`;
  if (aSubBufferCache && aSubBufferKey === key) return aSubBufferCache;

  const sampleStart = Math.max(0, Math.floor(seg.start * buffer.sampleRate));
  const sampleEnd = Math.min(buffer.length, Math.floor(seg.end * buffer.sampleRate));
  const length = Math.max(1, sampleEnd - sampleStart);
  const sub = audioCtx.createBuffer(buffer.numberOfChannels, length, buffer.sampleRate);
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const src = buffer.getChannelData(ch);
    const dst = sub.getChannelData(ch);
    for (let i = 0; i < length; i++) dst[i] = src[sampleStart + i];
  }
  aSubBufferCache = sub;
  aSubBufferKey = key;
  return sub;
}

function djBufferSource(buf) {
  const s = audioCtx.createBufferSource();
  s.buffer = buf || getDjBuffer();
  activeDjNodes.add(s);
  return s;
}

function djOsc(type, freq) {
  const o = audioCtx.createOscillator();
  o.type = type || 'sine';
  o.frequency.value = freq;
  activeDjNodes.add(o);
  return o;
}

function makeDistortionCurve(amount) {
  const n = 44100;
  const curve = new Float32Array(n);
  const deg = Math.PI / 180;
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
}

function reverseBuffer(buf) {
  const rev = audioCtx.createBuffer(buf.numberOfChannels, buf.length, buf.sampleRate);
  for (let ch = 0; ch < buf.numberOfChannels; ch++) {
    const src = buf.getChannelData(ch);
    const dst = rev.getChannelData(ch);
    for (let i = 0; i < src.length; i++) dst[i] = src[src.length - 1 - i];
  }
  return rev;
}

function dj_distort() {
  const ws = audioCtx.createWaveShaper();
  ws.curve = makeDistortionCurve(600);
  ws.oversample = '4x';
  const g = audioCtx.createGain();
  g.gain.value = 0.35;
  ws.connect(g).connect(djBus);
  const s = djBufferSource();
  s.connect(ws);
  s.start();
}

function dj_reverse() {
  const s = djBufferSource(reverseBuffer(getDjBuffer()));
  s.connect(djBus);
  s.start();
}

function dj_deep() {
  const s = djBufferSource();
  s.playbackRate.value = 0.55;
  const g = audioCtx.createGain();
  g.gain.value = 1.2;
  s.connect(g).connect(djBus);
  s.start();
}

function antiAliasFilter(maxRate) {
  const f = audioCtx.createBiquadFilter();
  f.type = 'lowpass';
  f.Q.value = 0.5;
  f.frequency.value = Math.min(18000, (audioCtx.sampleRate / 2) / Math.max(1, maxRate) * 0.88);
  return f;
}

function dj_chipmunk() {
  const s = djBufferSource();
  s.playbackRate.value = 1.9;
  const aa = antiAliasFilter(1.9);
  s.connect(aa).connect(djBus);
  s.start();
}

function dj_sweep() {
  const f = audioCtx.createBiquadFilter();
  f.type = 'lowpass';
  f.Q.value = 10;
  f.connect(djBus);
  const t = audioCtx.currentTime;
  f.frequency.setValueAtTime(150, t);
  f.frequency.exponentialRampToValueAtTime(14000, t + 2.5);
  const s = djBufferSource();
  s.connect(f);
  s.start();
}

function dj_riser() {
  const f = audioCtx.createBiquadFilter();
  f.type = 'highpass';
  f.Q.value = 6;
  f.connect(djBus);
  const t = audioCtx.currentTime;
  f.frequency.setValueAtTime(100, t);
  f.frequency.exponentialRampToValueAtTime(6000, t + 2.2);
  const s = djBufferSource();
  s.connect(f);
  s.start();
}

function beatSec(div) {
  const bpm = currentBpm || 120;
  return (60 / bpm) * (4 / div);
}

function dj_stutter() {
  const unit = currentBpm ? beatSec(16) : 0.105;
  const segLen = unit * 0.82;
  const gap = unit * 0.18;
  const count = 14;
  const startT = 0;
  const base = audioCtx.currentTime;
  for (let i = 0; i < count; i++) {
    const s = djBufferSource();
    s.connect(djBus);
    s.start(base + i * (segLen + gap), startT, segLen);
  }
}

function dj_scratch() {
  const s = djBufferSource();
  const aa = antiAliasFilter(2.5);
  s.connect(aa).connect(djBus);
  const t = audioCtx.currentTime;
  s.playbackRate.setValueAtTime(0.2, t);
  s.playbackRate.linearRampToValueAtTime(2.5, t + 0.25);
  s.playbackRate.linearRampToValueAtTime(0.4, t + 0.55);
  s.playbackRate.linearRampToValueAtTime(1.8, t + 0.9);
  s.playbackRate.linearRampToValueAtTime(1.0, t + 1.3);
  s.start();
  s.stop(t + 2);
}

function dj_wubwub() {
  const f = audioCtx.createBiquadFilter();
  f.type = 'lowpass';
  f.Q.value = 18;
  f.frequency.value = 1500;
  f.connect(djBus);
  const lfo = djOsc('sine', currentBpm ? currentBpm / 60 : 7);
  const lfoGain = audioCtx.createGain();
  lfoGain.gain.value = 1400;
  lfo.connect(lfoGain).connect(f.frequency);
  lfo.start();
  const s = djBufferSource();
  s.connect(f);
  s.start();
  s.onended = () => lfo.stop();
}

function dj_echo() {
  const delay = audioCtx.createDelay(2);
  delay.delayTime.value = currentBpm ? beatSec(8) : 0.22;
  const fb = audioCtx.createGain();
  fb.gain.value = 0.55;
  const wet = audioCtx.createGain();
  wet.gain.value = 0.7;
  delay.connect(fb).connect(delay);
  delay.connect(wet).connect(djBus);
  const s = djBufferSource();
  s.connect(djBus);
  s.connect(delay);
  s.start();
}

function dj_crush() {
  const ws = audioCtx.createWaveShaper();
  const steps = 8;
  const n = 256;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = Math.round(x * steps) / steps;
  }
  ws.curve = curve;
  const f = audioCtx.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = 3500;
  ws.connect(f).connect(djBus);
  const s = djBufferSource();
  s.connect(ws);
  s.start();
}

function dj_tremolo() {
  const g = audioCtx.createGain();
  g.connect(djBus);
  g.gain.value = 0.5;
  const lfo = djOsc('sine', currentBpm ? currentBpm / 60 * 2 : 9);
  const lfoGain = audioCtx.createGain();
  lfoGain.gain.value = 0.5;
  lfo.connect(lfoGain).connect(g.gain);
  lfo.start();
  const s = djBufferSource();
  s.connect(g);
  s.start();
  s.onended = () => lfo.stop();
}

function dj_flanger() {
  const delay = audioCtx.createDelay(0.02);
  delay.delayTime.value = 0.005;
  const fb = audioCtx.createGain();
  fb.gain.value = 0.7;
  const lfo = djOsc('sine', 0.4);
  const lfoGain = audioCtx.createGain();
  lfoGain.gain.value = 0.004;
  lfo.connect(lfoGain).connect(delay.delayTime);
  lfo.start();
  delay.connect(fb).connect(delay);
  delay.connect(djBus);
  const s = djBufferSource();
  s.connect(djBus);
  s.connect(delay);
  s.start();
  s.onended = () => lfo.stop();
}

function dj_autowah() {
  const f = audioCtx.createBiquadFilter();
  f.type = 'bandpass';
  f.Q.value = 8;
  f.frequency.value = 1500;
  f.connect(djBus);
  const lfo = djOsc('sine', 3);
  const lfoGain = audioCtx.createGain();
  lfoGain.gain.value = 1200;
  lfo.connect(lfoGain).connect(f.frequency);
  lfo.start();
  const s = djBufferSource();
  s.connect(f);
  s.start();
  s.onended = () => lfo.stop();
}

function dj_phone() {
  const hp = audioCtx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 900;
  const lp = audioCtx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 2800;
  const ws = audioCtx.createWaveShaper();
  ws.curve = makeDistortionCurve(40);
  hp.connect(lp).connect(ws).connect(djBus);
  const s = djBufferSource();
  s.connect(hp);
  s.start();
}

function dj_gate() {
  const g = audioCtx.createGain();
  g.gain.value = 0.5;
  g.connect(djBus);
  const lfo = djOsc('square', currentBpm ? currentBpm / 60 * 2 : 8);
  const lfoGain = audioCtx.createGain();
  lfoGain.gain.value = 0.5;
  lfo.connect(lfoGain).connect(g.gain);
  lfo.start();
  const s = djBufferSource();
  s.connect(g);
  s.start();
  s.onended = () => lfo.stop();
}

function dj_backspin() {
  const s = djBufferSource();
  s.connect(djBus);
  const t = audioCtx.currentTime;
  s.playbackRate.setValueAtTime(1.0, t);
  s.playbackRate.exponentialRampToValueAtTime(0.08, t + 0.8);
  s.start();
  s.stop(t + 1);
}

function dj_powerup() {
  const s = djBufferSource();
  const aa = antiAliasFilter(2.4);
  s.connect(aa).connect(djBus);
  const t = audioCtx.currentTime;
  s.playbackRate.setValueAtTime(0.4, t);
  s.playbackRate.exponentialRampToValueAtTime(2.4, t + 1.6);
  s.start();
}

function dj_vinyl() {
  const f = audioCtx.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = 3800;
  const g = audioCtx.createGain();
  g.gain.value = 0.85;
  f.connect(g).connect(djBus);
  const lfo = djOsc('sine', 0.7);
  const lfoGain = audioCtx.createGain();
  lfoGain.gain.value = 0.05;
  lfo.connect(lfoGain).connect(g.gain);
  lfo.start();
  const s = djBufferSource();
  s.playbackRate.value = 0.94;
  s.connect(f);
  s.start();
  s.onended = () => lfo.stop();
}

function dj_hall() {
  const taps = [0.05, 0.11, 0.17, 0.23, 0.31, 0.43];
  const out = audioCtx.createGain();
  out.gain.value = 0.75;
  out.connect(djBus);
  const s = djBufferSource();
  s.connect(out);
  taps.forEach((d, i) => {
    const dl = audioCtx.createDelay(1);
    dl.delayTime.value = d;
    const g = audioCtx.createGain();
    g.gain.value = 0.45 / (i + 1);
    s.connect(dl).connect(g).connect(out);
  });
  s.start();
}

function dj_overdrive() {
  const ws = audioCtx.createWaveShaper();
  ws.curve = makeDistortionCurve(150);
  ws.oversample = '2x';
  const g = audioCtx.createGain();
  g.gain.value = 0.55;
  ws.connect(g).connect(djBus);
  const s = djBufferSource();
  s.connect(ws);
  s.start();
}

function dj_laser() {
  const s = djBufferSource();
  const aa = antiAliasFilter(2.6);
  s.connect(aa).connect(djBus);
  const t = audioCtx.currentTime;
  s.playbackRate.setValueAtTime(2.6, t);
  s.playbackRate.exponentialRampToValueAtTime(0.35, t + 1.4);
  s.start();
}

function dj_pingpong() {
  const splitL = audioCtx.createDelay(1);
  const splitR = audioCtx.createDelay(1);
  splitL.delayTime.value = currentBpm ? beatSec(8)  : 0.18;
  splitR.delayTime.value = currentBpm ? beatSec(4)  : 0.36;
  const fbL = audioCtx.createGain();
  const fbR = audioCtx.createGain();
  fbL.gain.value = 0.5;
  fbR.gain.value = 0.5;
  splitL.connect(fbR).connect(splitR);
  splitR.connect(fbL).connect(splitL);
  const merger = audioCtx.createChannelMerger(2);
  splitL.connect(merger, 0, 0);
  splitR.connect(merger, 0, 1);
  merger.connect(djBus);
  const s = djBufferSource();
  s.connect(djBus);
  s.connect(splitL);
  s.start();
}

function dj_drumroll() {
  const unit = currentBpm ? beatSec(32) : 0.05;
  const count = 28;
  const base = audioCtx.currentTime;
  for (let i = 0; i < count; i++) {
    const s = djBufferSource();
    const g = audioCtx.createGain();
    g.gain.value = 0.3 + (i / count) * 0.7;
    s.connect(g).connect(djBus);
    try { s.start(base + i * unit, 0, unit * 0.9); } catch {}
  }
}

function dj_chord() {
  const rates = [0.5, 1.0, 1.5];
  const gains = [0.6, 0.7, 0.45];
  rates.forEach((r, i) => {
    const s = djBufferSource();
    s.playbackRate.value = r;
    const g = audioCtx.createGain();
    g.gain.value = gains[i];
    const aa = antiAliasFilter(Math.max(1, r));
    s.connect(aa).connect(g).connect(djBus);
    s.start();
  });
}

function dj_swell() {
  const s = djBufferSource();
  const g = audioCtx.createGain();
  g.gain.value = 0;
  s.connect(g).connect(djBus);
  const t = audioCtx.currentTime;
  g.gain.setValueAtTime(0, t);
  g.gain.exponentialRampToValueAtTime(1, t + 1.4);
  g.gain.setValueAtTime(1, t + 2.6);
  g.gain.exponentialRampToValueAtTime(0.01, t + 3.0);
  s.start();
}

function dj_chop() {
  const s = djBufferSource();
  const g = audioCtx.createGain();
  g.gain.value = 1;
  s.connect(g).connect(djBus);
  const t = audioCtx.currentTime;
  const step = currentBpm ? beatSec(16) : 0.1;
  const total = getDjBuffer().duration || 2;
  let tt = t;
  let on = true;
  while (tt < t + total) {
    g.gain.setValueAtTime(on ? 1 : 0, tt);
    tt += step * (0.6 + Math.random() * 0.8);
    on = Math.random() > 0.35;
  }
  s.start();
}

function dj_phaser() {
  const s = djBufferSource();
  const lfo = djOsc('sine', 0.5);
  const lfoGain = audioCtx.createGain();
  lfoGain.gain.value = 800;
  lfo.connect(lfoGain);
  let prev = s;
  const stages = [];
  for (let i = 0; i < 4; i++) {
    const ap = audioCtx.createBiquadFilter();
    ap.type = 'allpass';
    ap.Q.value = 1.2;
    ap.frequency.value = 400 + i * 350;
    lfoGain.connect(ap.frequency);
    stages.push(ap);
    prev.connect(ap);
    prev = ap;
  }
  const wet = audioCtx.createGain();
  wet.gain.value = 0.7;
  prev.connect(wet).connect(djBus);
  s.connect(djBus);
  lfo.start();
  s.start();
}

function dj_glitch() {
  const base = audioCtx.currentTime;
  const totalDur = 1.6;
  const buf = getDjBuffer();
  const maxOffset = Math.max(0.1, buf.duration - 0.15);
  let t = 0;
  while (t < totalDur) {
    const segLen = 0.05 + Math.random() * 0.13;
    const offset = Math.random() * maxOffset;
    const s = djBufferSource();
    s.playbackRate.value = 0.4 + Math.random() * 2.2;
    if (Math.random() > 0.5) {
      const rev = reverseBuffer(buf);
      s.buffer = rev;
    }
    s.connect(djBus);
    try { s.start(base + t, offset, segLen); } catch {}
    t += segLen + Math.random() * 0.04;
  }
}

function dj_robot() {
  const s = djBufferSource();
  const modGain = audioCtx.createGain();
  modGain.gain.value = 0;
  const ring = djOsc('sine', 80);
  ring.connect(modGain.gain);
  s.connect(modGain);
  modGain.connect(djBus);
  ring.start();
  s.start();
}

function dj_tapestop() {
  const s = djBufferSource();
  s.connect(djBus);
  const t = audioCtx.currentTime;
  s.playbackRate.setValueAtTime(1.0, t);
  s.playbackRate.linearRampToValueAtTime(0.01, t + 1.2);
  s.start();
  s.stop(t + 1.3);
}

function dj_siren() {
  const s = djBufferSource();
  const aa = antiAliasFilter(2.2);
  s.connect(aa).connect(djBus);
  const t = audioCtx.currentTime;
  const dur = 2.0;
  for (let i = 0; i < 6; i++) {
    const tt = t + (i / 6) * dur;
    s.playbackRate.setValueAtTime(i % 2 ? 1.8 : 0.6, tt);
    s.playbackRate.linearRampToValueAtTime(i % 2 ? 0.6 : 1.8, tt + dur / 6);
  }
  s.start();
  s.stop(t + dur + 0.1);
}

function dj_lofi() {
  const f1 = audioCtx.createBiquadFilter();
  f1.type = 'lowpass';
  f1.frequency.value = 3200;
  f1.Q.value = 0.7;
  const hp = audioCtx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 160;
  const ws = audioCtx.createWaveShaper();
  const n = 256, curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = Math.round(x * 24) / 24;
  }
  ws.curve = curve;
  f1.connect(hp).connect(ws).connect(djBus);
  // vinyl noise
  const bufSize = audioCtx.sampleRate * 2;
  const noiseBuf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
  const data = noiseBuf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * (Math.random() < 0.02 ? 1 : 0.12);
  const noise = audioCtx.createBufferSource();
  noise.buffer = noiseBuf;
  const ng = audioCtx.createGain();
  ng.gain.value = 0.08;
  noise.connect(ng).connect(djBus);
  activeDjNodes.add(noise);
  noise.start();
  const s = djBufferSource();
  s.playbackRate.value = 0.92;
  s.connect(f1);
  s.onended = () => { try { noise.stop(); } catch {} };
  s.start();
}

function dj_reverse_echo() {
  const rev = reverseBuffer(getDjBuffer());
  const delay = audioCtx.createDelay(2);
  delay.delayTime.value = 0.18;
  const fb = audioCtx.createGain();
  fb.gain.value = 0.5;
  delay.connect(fb).connect(delay);
  delay.connect(djBus);
  const s = djBufferSource(rev);
  s.playbackRate.value = 0.9;
  s.connect(djBus);
  s.connect(delay);
  s.start();
}

const DJ_EFFECTS = [
  { id: 'distort',  name: 'DISTORT',  color: '#ff3355', play: dj_distort,       desc: '하드클립 왜곡, 찌그러지고 공격적' },
  { id: 'reverse',  name: 'REVERSE',  color: '#55ffaa', play: dj_reverse,       desc: '거꾸로 재생' },
  { id: 'deep',     name: 'DEEP',     color: '#ff8800', play: dj_deep,          desc: '0.55배속, 저음 묵직' },
  { id: 'chip',     name: 'CHIP',     color: '#ffee55', play: dj_chipmunk,      desc: '1.9배속, 칩멍크' },
  { id: 'sweep',    name: 'SWEEP',    color: '#3388ff', play: dj_sweep,         desc: '로우패스 150Hz→14kHz 오픈 (빌드업)' },
  { id: 'riser',    name: 'RISER',    color: '#ff55ee', play: dj_riser,         desc: '하이패스 100Hz→6kHz 상승 (스릴러)' },
  { id: 'stutter',  name: 'STUTTER',  color: '#ffffff', play: dj_stutter,       desc: '같은 조각 14번 연타' },
  { id: 'scratch',  name: 'SCRATCH',  color: '#00ffff', play: dj_scratch,       desc: '턴테이블 스크래치 (rate 오락가락)' },
  { id: 'wubwub',   name: 'WUBWUB',   color: '#aa33ff', play: dj_wubwub,        desc: '덥스텝 LFO 필터' },
  { id: 'echo',     name: 'ECHO',     color: '#77ffdd', play: dj_echo,          desc: '피드백 딜레이' },
  { id: 'crush',    name: 'CRUSH',    color: '#ff99cc', play: dj_crush,         desc: '8단계 양자화 + 저역 (비트크러시)' },
  { id: 'tremolo',  name: 'TREMOLO',  color: '#ffaa33', play: dj_tremolo,       desc: '9Hz 볼륨 흔들림' },
  { id: 'flanger',  name: 'FLANGER',  color: '#44ddff', play: dj_flanger,       desc: '딜레이 LFO 변조' },
  { id: 'autowah',  name: 'AUTOWAH',  color: '#ccff33', play: dj_autowah,       desc: '밴드패스 스윕 (와우)' },
  { id: 'phone',    name: 'PHONE',    color: '#888888', play: dj_phone,         desc: '전화기 음질 (밴드제한 + 왜곡)' },
  { id: 'gate',     name: 'GATE',     color: '#ff4488', play: dj_gate,          desc: '8Hz 사각파 on/off 게이트' },
  { id: 'backspin', name: 'BACKSPIN', color: '#ff6600', play: dj_backspin,      desc: '감속 → 정지 (턴테이블 제동)' },
  { id: 'powerup',  name: 'POWERUP',  color: '#ffff00', play: dj_powerup,       desc: '저속에서 고속으로 가속' },
  { id: 'vinyl',    name: 'VINYL',    color: '#cc8866', play: dj_vinyl,         desc: '저역 + 살짝 워블 (LP판)' },
  { id: 'hall',     name: 'HALL',     color: '#99ddff', play: dj_hall,          desc: '멀티탭 딜레이 잔향 (홀)' },
  { id: 'drive',    name: 'OVERDRIVE',color: '#dd3300', play: dj_overdrive,     desc: '따뜻한 소프트 드라이브' },
  { id: 'laser',    name: 'LASER',    color: '#ff00ff', play: dj_laser,         desc: '피치 2.6→0.35 급락 (SF 레이저)' },
  { id: 'pingpong', name: 'PINGPONG', color: '#00ff88', play: dj_pingpong,      desc: '스테레오 좌우 튀는 딜레이' },
  { id: 'revecho',  name: 'REV-ECHO', color: '#9966ff', play: dj_reverse_echo,  desc: '역재생 + 피드백 딜레이' },
  { id: 'robot',    name: 'ROBOT',    color: '#11dd99', play: dj_robot,         desc: '80Hz 링 모듈레이션, 로봇 음성' },
  { id: 'tapestop', name: 'TAPESTOP', color: '#ee4422', play: dj_tapestop,      desc: '1.2초에 걸쳐 서서히 정지' },
  { id: 'glitch',   name: 'GLITCH',   color: '#ff0066', play: dj_glitch,        desc: '랜덤 오프셋·길이·피치·방향 스터터' },
  { id: 'phaser',   name: 'PHASER',   color: '#66aaff', play: dj_phaser,        desc: '4단 allpass 위상 시프트 + 0.5Hz LFO' },
  { id: 'swell',    name: 'SWELL',    color: '#88ffaa', play: dj_swell,         desc: '1.4초 볼륨 스웰 인 → 급격 페이드' },
  { id: 'chop',     name: 'CHOP',     color: '#ff55bb', play: dj_chop,          desc: 'BPM 기반 랜덤 게이트 (trance gate)' },
  { id: 'chord',    name: 'CHORD',    color: '#aaff44', play: dj_chord,         desc: '옥타브 다운 + 기본 + 5도 위 동시 재생' },
  { id: 'drumroll', name: 'DRUMROLL', color: '#ffcc66', play: dj_drumroll,      desc: '32분음 고속 반복 + 크레셴도' },
  { id: 'siren',    name: 'SIREN',    color: '#ff3333', play: dj_siren,         desc: '사이렌 (피치 0.6↔1.8 반복 스윕)' },
  { id: 'lofi',     name: 'LOFI',     color: '#b79066', play: dj_lofi,          desc: '저샘플 + 비닐 노이즈 (로파이)' },
];

const DEFAULT_DJ_MAPPING = ['distort', 'reverse', 'deep', 'chip', 'sweep', 'stutter', 'wubwub', 'scratch', 'riser'];

function loadDjMapping() {
  try {
    const saved = localStorage.getItem('oiia-dj-mapping-v1');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length === 9) {
        return parsed.map((id) => (DJ_EFFECTS.find((e) => e.id === id) ? id : DEFAULT_DJ_MAPPING[0]));
      }
    }
  } catch {}
  return [...DEFAULT_DJ_MAPPING];
}

function saveDjMapping() {
  localStorage.setItem('oiia-dj-mapping-v1', JSON.stringify(djMapping));
}

let djMapping = loadDjMapping();

function loadSlotVol() {
  try {
    const saved = localStorage.getItem('oiia-dj-vol-v1');
    if (saved) {
      const p = JSON.parse(saved);
      if (Array.isArray(p) && p.length === 9) return p.map((v) => Math.max(0, Math.min(1, +v)));
    }
  } catch {}
  return [1, 1, 1, 1, 1, 1, 1, 1, 1];
}
let slotVol = loadSlotVol();
function saveSlotVol() { localStorage.setItem('oiia-dj-vol-v1', JSON.stringify(slotVol)); }

function playDjSlot(idx) {
  if (!buffer) return;
  if (audioCtx?.state === 'suspended') audioCtx.resume();
  stopAllDj();
  const id = djMapping[idx];
  const eff = DJ_EFFECTS.find((e) => e.id === id);
  if (!eff) return;
  loopRec('dj', idx);
  replayRec('dj', idx);
  bumpStat('dj', id);
  if (djBus) {
    const t = audioCtx.currentTime;
    djBus.gain.cancelScheduledValues(t);
    djBus.gain.setValueAtTime(slotVol[idx], t);
  }
  try { eff.play(); } catch (err) { console.error(err); }
  fx.drop(eff.color, eff.name);
  haptic([30, 20, 40]);
  const wrap = document.querySelector(`.dj-slot-wrap:nth-child(${idx + 1})`);
  if (wrap) {
    wrap.classList.remove('firing');
    void wrap.offsetWidth;
    wrap.classList.add('firing');
    setTimeout(() => wrap.classList.remove('firing'), 800);
  }
}

let djFilter = '';
function renderDjSlots() {
  const el = document.getElementById('dj-slots');
  if (!el) return;
  const q = djFilter.trim().toLowerCase();
  el.innerHTML = djMapping.map((id, i) => {
    const opts = DJ_EFFECTS.filter((e) =>
      !q || e.name.toLowerCase().includes(q) || (e.desc || '').toLowerCase().includes(q) || e.id === id
    ).map((e) =>
      `<option value="${e.id}" title="${e.desc || ''}"${e.id === id ? ' selected' : ''}>${e.name}</option>`
    ).join('');
    const curr = DJ_EFFECTS.find((e) => e.id === id) || DJ_EFFECTS[0];
    const vol = slotVol[i] ?? 1;
    return `
      <div class="dj-slot-wrap" style="--c:${curr.color}" data-wrap="${i}">
        <div class="dj-slot" title="${curr.desc || ''}">
          <span class="dj-num">${i + 1}</span>
          <select data-slot="${i}" title="${curr.desc || ''}">${opts}</select>
          <button data-test="${i}" title="${curr.desc || '테스트'}">▶</button>
        </div>
        <div class="dj-desc">${curr.desc || ''}</div>
        <div class="dj-vol" data-vol="${i}" title="휠 / 드래그로 볼륨 조절">
          <div class="dj-vol-fill" style="width:${Math.round(vol * 100)}%"></div>
          <div class="dj-vol-label">${Math.round(vol * 100)}%</div>
        </div>
      </div>
    `;
  }).join('');
  el.querySelectorAll('select').forEach((sel) => {
    sel.addEventListener('change', (e) => {
      djMapping[+e.target.dataset.slot] = e.target.value;
      saveDjMapping();
      renderDjSlots();
    });
  });
  el.querySelectorAll('button[data-test]').forEach((btn) => {
    btn.addEventListener('click', () => playDjSlot(+btn.dataset.test));
  });
  el.querySelectorAll('.dj-vol').forEach((vb) => {
    const i = +vb.dataset.vol;
    vb.addEventListener('wheel', (e) => {
      e.preventDefault();
      const step = e.deltaY > 0 ? -0.06 : 0.06;
      slotVol[i] = Math.max(0, Math.min(1, (slotVol[i] ?? 1) + step));
      saveSlotVol();
      const fill = vb.querySelector('.dj-vol-fill');
      const lbl = vb.querySelector('.dj-vol-label');
      const pct = Math.round(slotVol[i] * 100);
      if (fill) fill.style.width = pct + '%';
      if (lbl) lbl.textContent = pct + '%';
    }, { passive: false });
    vb.addEventListener('pointerdown', (e) => {
      function apply(clientX) {
        const r = vb.getBoundingClientRect();
        const v = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
        slotVol[i] = v;
        const fill = vb.querySelector('.dj-vol-fill');
        const lbl = vb.querySelector('.dj-vol-label');
        const pct = Math.round(v * 100);
        if (fill) fill.style.width = pct + '%';
        if (lbl) lbl.textContent = pct + '%';
      }
      apply(e.clientX);
      vb.setPointerCapture(e.pointerId);
      const onMove = (ev) => apply(ev.clientX);
      const onUp = () => {
        vb.removeEventListener('pointermove', onMove);
        vb.removeEventListener('pointerup', onUp);
        saveSlotVol();
      };
      vb.addEventListener('pointermove', onMove);
      vb.addEventListener('pointerup', onUp);
    });
  });
}

const HOLD_START = 0.35;
const HOLD_PEAK = 0.04;
const HOLD_BUILDUP = 2.5;
const DROP_MIN_HOLD = 1.0;
const heldKeys = new Map();

function startHold(code) {
  if (heldKeys.has(code)) return;
  const k = KEY_ORDER.find((x) => x.code === code);
  if (!k) return;
  const state = { startTime: performance.now(), timer: null, code };
  heldKeys.set(code, state);

  function tick() {
    const elapsed = (performance.now() - state.startTime) / 1000;
    const progress = Math.min(elapsed / HOLD_BUILDUP, 1);
    const intensity = 1 + progress * 1.6;
    pressKey(code, intensity);
    const interval = HOLD_START * Math.pow(HOLD_PEAK / HOLD_START, progress) * 1000;
    state.timer = setTimeout(tick, interval);
  }
  tick();
}

function endHold(code) {
  const state = heldKeys.get(code);
  if (!state) return;
  clearTimeout(state.timer);
  heldKeys.delete(code);
  const elapsed = (performance.now() - state.startTime) / 1000;
  if (elapsed >= DROP_MIN_HOLD) {
    const k = KEY_ORDER.find((x) => x.code === code);
    if (!k) return;
    const seg = segments.find((s) => s.id === k.segId);
    if (seg) {
      playSegmentById(k.segId);
      fx.drop(seg.color, seg.jamo);
    }
  }
}

function flashKey(code) {
  const el = document.getElementById('key-' + code);
  if (!el) return;
  el.classList.add('active');
  setTimeout(() => el.classList.remove('active'), 120);
}

const JAMO_TO_CODE = { 'ㅜ': 'KeyN', 'ㅣ': 'KeyL', 'ㅏ': 'KeyK' };

document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
    e.preventDefault();
    undoSegments();
    return;
  }
  if (e.repeat) return;
  if (e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT') return;
  if (e.code === 'Space') {
    e.preventDefault();
    playAll();
    return;
  }
  if (e.code === 'Tab') {
    e.preventDefault();
    const next = (activeSegIndex + (e.shiftKey ? -1 : 1) + segments.length) % segments.length;
    setActiveSegment(next);
    return;
  }
  if (/^Digit[1-9]$/.test(e.code)) {
    e.preventDefault();
    const n = parseInt(e.code.slice(5)) - 1;
    playDjSlot(n);
    return;
  }
  if (e.code === 'Digit0') {
    e.preventDefault();
    playDjSlot(Math.floor(Math.random() * 9));
    return;
  }
  if (e.code === 'KeyT' && !e.metaKey && !e.ctrlKey) {
    e.preventDefault();
    tapBeat();
    return;
  }
  if (e.code === 'Escape') {
    if (loopPlaying || loopRecording) {
      loopPlaying = false;
      loopRecording = false;
      loopTimeouts.forEach((id) => clearTimeout(id));
      loopTimeouts = [];
      if (loopIterTimer) clearTimeout(loopIterTimer);
      const btn = document.getElementById('loop-btn');
      btn.textContent = '🔁 루프';
      btn.classList.remove('on', 'rec');
    }
    stopAllDj();
    toast('정지');
    return;
  }
  let code = e.code;
  if (!KEY_ORDER.find((k) => k.code === code) && JAMO_TO_CODE[e.key]) {
    code = JAMO_TO_CODE[e.key];
  }
  if (KEY_ORDER.find((k) => k.code === code)) {
    startHold(code);
  }
});

document.addEventListener('keyup', (e) => {
  let code = e.code;
  if (!KEY_ORDER.find((k) => k.code === code) && JAMO_TO_CODE[e.key]) {
    code = JAMO_TO_CODE[e.key];
  }
  endHold(code);
});

window.addEventListener('blur', () => {
  for (const code of Array.from(heldKeys.keys())) endHold(code);
});

let playheadStartT = 0;
let playheadDur = 0;
let playheadAnim = 0;
function playAll() {
  if (audioCtx?.state === 'suspended') audioCtx.resume();
  const src = audioCtx.createBufferSource();
  src.buffer = buffer;
  src.connect(masterOut);
  src.start();
  playheadStartT = performance.now();
  playheadDur = buffer.duration * 1000;
  if (!playheadAnim) tickPlayhead();
}
function tickPlayhead() {
  const elapsed = performance.now() - playheadStartT;
  if (elapsed > playheadDur + 100) {
    playheadAnim = 0;
    drawWaveform();
    return;
  }
  drawWaveform();
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  ctx.save();
  ctx.scale(dpr, dpr);
  const x = (elapsed / playheadDur) * canvas.clientWidth;
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x, canvas.clientHeight);
  ctx.stroke();
  ctx.restore();
  playheadAnim = requestAnimationFrame(tickPlayhead);
}

function playOiiaSequence() {
  const order = ['o', 'i', 'i', 'a'];
  let t = 0;
  order.forEach((id) => {
    const s = segments.find((x) => x.id === id);
    if (!s) return;
    const dur = s.end - s.start;
    setTimeout(() => playSegmentById(id), t);
    t += dur * 1000 + 30;
  });
}

let recorder = null;
let recChunks = [];
let recStart = 0;

function setupRecorder() {
  if (recorder || !audioCtx || !masterOut) return;
  const streamDest = audioCtx.createMediaStreamDestination();
  masterOut.connect(streamDest);
  const audioStream = streamDest.stream;

  let mixed = audioStream;
  let mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
    ? 'audio/webm;codecs=opus' : 'audio/webm';

  try {
    if (fx.canvas && fx.canvas.captureStream) {
      const canvasStream = fx.canvas.captureStream(30);
      mixed = new MediaStream();
      canvasStream.getVideoTracks().forEach((t) => mixed.addTrack(t));
      audioStream.getAudioTracks().forEach((t) => mixed.addTrack(t));
      const videoMimes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
      ];
      const picked = videoMimes.find((m) => MediaRecorder.isTypeSupported(m));
      if (picked) mime = picked;
    }
  } catch {}

  recorder = new MediaRecorder(mixed, { mimeType: mime });
  recorder.ondataavailable = (e) => { if (e.data && e.data.size) recChunks.push(e.data); };
  recorder.__isVideo = mime.startsWith('video');
}

function toggleRec() {
  const btn = document.getElementById('rec');
  if (!btn) return;
  if (!recorder || recorder.state !== 'recording') {
    if (audioCtx?.state === 'suspended') audioCtx.resume();
    setupRecorder();
    if (!recorder) return;
    recChunks = [];
    recStart = performance.now();
    recorder.start();
    btn.textContent = '⏹ 녹음 중…';
    btn.classList.add('recording');
    startRecTimer();
  } else {
    recorder.onstop = () => {
      const blob = new Blob(recChunks, { type: recorder.mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      a.download = `oiiai-${ts}.webm`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      btn.textContent = '⏺ 녹음';
      btn.classList.remove('recording');
      stopRecTimer();
    };
    recorder.stop();
  }
}

let recTimerId = null;
function startRecTimer() {
  stopRecTimer();
  const btn = document.getElementById('rec');
  recTimerId = setInterval(() => {
    if (!recorder || recorder.state !== 'recording') return stopRecTimer();
    const s = Math.floor((performance.now() - recStart) / 1000);
    const mm = String(Math.floor(s / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    btn.textContent = `⏹ ${mm}:${ss}`;
  }, 250);
}
function stopRecTimer() {
  if (recTimerId) { clearInterval(recTimerId); recTimerId = null; }
}

let tapTimes = [];
let currentBpm = null;
let bpmPulseTimer = null;

function tapBeat() {
  const now = performance.now();
  if (tapTimes.length && now - tapTimes[tapTimes.length - 1] > 2500) tapTimes = [];
  tapTimes.push(now);
  if (tapTimes.length > 8) tapTimes.shift();
  const btn = document.getElementById('tap');
  btn.classList.remove('tap-pulse');
  void btn.offsetWidth;
  btn.classList.add('tap-pulse');
  if (tapTimes.length >= 2) {
    const diffs = [];
    for (let i = 1; i < tapTimes.length; i++) diffs.push(tapTimes[i] - tapTimes[i - 1]);
    const avg = diffs.reduce((a, b) => a + b, 0) / diffs.length;
    const raw = 60000 / avg;
    currentBpm = Math.round(Math.max(40, Math.min(240, raw)));
    document.getElementById('bpm-value').textContent = currentBpm + ' BPM';
    schedulePulse();
  }
}

function schedulePulse() {
  if (bpmPulseTimer) { clearInterval(bpmPulseTimer); bpmPulseTimer = null; }
  if (!currentBpm) return;
  const period = 60000 / currentBpm;
  const el = document.getElementById('tap');
  bpmPulseTimer = setInterval(() => {
    el.classList.remove('tap-tick');
    void el.offsetWidth;
    el.classList.add('tap-tick');
    if (fx.beatRing) fx.beatRing('#5aaaff');
  }, period);
}

window.__getBpm = () => currentBpm;

let metroTimer = null;
let metroCount = 0;
function toggleMetro() {
  const btn = document.getElementById('metro');
  if (metroTimer) {
    clearInterval(metroTimer);
    metroTimer = null;
    btn.classList.remove('on');
    btn.textContent = '🥁 Metro';
    return;
  }
  if (!currentBpm) { toast('먼저 BPM 설정'); return; }
  if (audioCtx?.state === 'suspended') audioCtx.resume();
  if (!masterOut) return;
  metroCount = 0;
  btn.classList.add('on');
  btn.textContent = '🥁 …';
  function click() {
    const downbeat = metroCount % 4 === 0;
    const t = audioCtx.currentTime;
    const o = audioCtx.createOscillator();
    o.type = 'square';
    o.frequency.value = downbeat ? 1600 : 1100;
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(downbeat ? 0.4 : 0.22, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    o.connect(g).connect(masterOut);
    o.start(t);
    o.stop(t + 0.08);
    metroCount++;
  }
  click();
  metroTimer = setInterval(click, 60000 / currentBpm);
}

document.getElementById('bpm-value').addEventListener('dblclick', (e) => {
  e.stopPropagation();
  e.preventDefault();
  const input = prompt('BPM 입력 (40–240)', currentBpm || '');
  if (input === null) return;
  const n = parseInt(input);
  if (!isNaN(n) && n >= 40 && n <= 240) {
    currentBpm = n;
    tapTimes = [];
    document.getElementById('bpm-value').textContent = n + ' BPM';
    schedulePulse();
    toast('BPM ' + n + '으로 설정');
  }
});
document.getElementById('tap').onclick = tapBeat;
document.getElementById('rec').onclick = toggleRec;

function toast(msg, ms = 1800) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.hidden = false;
  el.classList.remove('show');
  void el.offsetWidth;
  el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { el.classList.remove('show'); el.hidden = true; }, ms);
}

function encodePreset() {
  const data = {
    s: segments.map((x) => ({ id: x.id, s: +x.start.toFixed(4), e: +x.end.toFixed(4), c: x.color })),
    d: djMapping,
    b: currentBpm || undefined,
  };
  const json = JSON.stringify(data);
  return btoa(unescape(encodeURIComponent(json)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodePreset(hash) {
  try {
    const b64 = hash.replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64.length % 4 ? '='.repeat(4 - (b64.length % 4)) : '';
    const json = decodeURIComponent(escape(atob(b64 + pad)));
    return JSON.parse(json);
  } catch { return null; }
}

function applyPreset(p) {
  if (!p) return false;
  if (Array.isArray(p.s)) {
    p.s.forEach((ps) => {
      const seg = segments.find((x) => x.id === ps.id);
      if (seg) {
        if (typeof ps.s === 'number') seg.start = ps.s;
        if (typeof ps.e === 'number') seg.end = ps.e;
        if (typeof ps.c === 'string' && /^#[0-9a-f]{6}$/i.test(ps.c)) seg.color = ps.c;
      }
    });
    clampSegments();
    saveSegments();
  }
  if (Array.isArray(p.d) && p.d.length === 9) {
    djMapping = p.d.map((id) => (DJ_EFFECTS.find((e) => e.id === id) ? id : DEFAULT_DJ_MAPPING[0]));
    saveDjMapping();
  }
  if (typeof p.b === 'number' && p.b >= 40 && p.b <= 240) {
    currentBpm = p.b;
    const bv = document.getElementById('bpm-value');
    if (bv) bv.textContent = p.b + ' BPM';
    schedulePulse();
  }
  return true;
}

function shareLink() {
  const b64 = encodePreset();
  const url = location.origin + location.pathname + '#p=' + b64;
  try {
    navigator.clipboard.writeText(url);
    toast('링크가 클립보드에 복사됨');
  } catch {
    prompt('링크를 복사하세요', url);
  }
  history.replaceState(null, '', '#p=' + b64);
}

function loadFromHash() {
  if (!location.hash.startsWith('#p=')) return;
  const p = decodePreset(location.hash.slice(3));
  if (applyPreset(p)) {
    renderActiveBar();
    renderSegments();
    renderDjSlots();
    drawWaveform();
    toast('공유된 세팅 불러옴');
  }
}

let autoBeatTimer = null;
function autoBeat() {
  if (autoBeatTimer) { clearTimeout(autoBeatTimer); autoBeatTimer = null; }
  if (audioCtx?.state === 'suspended') audioCtx.resume();
  const codes = ['KeyN', 'KeyL', 'KeyK', 'KeyA', 'KeyB'];
  const bpm = currentBpm || 128;
  const step = (60 / bpm) * 500; // 8th note ms
  const patterns = [
    [0,1,2,1, 0,1,2,1, 0,2,1,2, 3,1,2,1],
    [0,2,1,2, 0,2,1,2, 3,1,2,1, 0,2,1,0],
    [2,1,0,1, 2,1,0,1, 4,1,2,1, 3,2,1,0],
    [0,0,1,2, 1,1,0,2, 0,0,1,2, 3,2,1,4],
  ];
  const pat = patterns[Math.floor(Math.random() * patterns.length)];
  const djAt = [4, 8, 12].concat([pat.length]);
  let offset = 0;
  pat.forEach((ki, i) => {
    offset = i * step;
    setTimeout(() => pressKey(codes[ki]), offset);
  });
  djAt.forEach((i, idx) => {
    setTimeout(() => playDjSlot(idx % 9), i * step + 40);
  });
}
const REPLAY_WINDOW_MS = 10000;
let replayBuffer = [];
function replayRec(type, arg) {
  const now = performance.now();
  replayBuffer.push({ t: now, type, arg });
  while (replayBuffer.length && now - replayBuffer[0].t > REPLAY_WINDOW_MS) replayBuffer.shift();
  tickerPush(type, arg);
}

function tickerPush(type, arg) {
  const el = document.getElementById('ticker');
  if (!el) return;
  let label, color;
  if (type === 'key') {
    const k = KEY_ORDER.find((x) => x.code === arg);
    const seg = k && segments.find((s) => s.id === k.segId);
    label = k ? k.jamo : '?';
    color = seg ? seg.color : '#5af';
  } else {
    const id = djMapping[arg];
    const eff = DJ_EFFECTS.find((e) => e.id === id);
    label = eff ? eff.name : '?';
    color = eff ? eff.color : '#5af';
  }
  const chip = document.createElement('span');
  chip.className = 'ticker-chip ' + (type === 'dj' ? 'ticker-dj' : 'ticker-key');
  chip.style.setProperty('--c', color);
  chip.textContent = label;
  el.appendChild(chip);
  while (el.childElementCount > 16) el.firstElementChild.remove();
  setTimeout(() => chip.remove(), 4000);
}
function replayLast() {
  if (!replayBuffer.length) { toast('재생할 이벤트 없음 — 키를 먼저 눌러보세요'); return; }
  const t0 = replayBuffer[0].t;
  toast(`🎞 마지막 ${Math.round((replayBuffer[replayBuffer.length - 1].t - t0) / 1000)}초 리플레이`);
  replayBuffer.forEach((e) => {
    setTimeout(() => {
      if (e.type === 'key') pressKey(e.arg, 1);
      else if (e.type === 'dj') playDjSlot(e.arg);
    }, e.t - t0);
  });
}

let loopEvents = [];
let loopRecording = false;
let loopStartT = 0;
let loopPlaying = false;
let loopTimeouts = [];
let loopIterTimer = null;
let loopSpeed = 1;
const LOOP_SPEEDS = [0.5, 1, 2];

function loopRec(type, arg) {
  if (!loopRecording) return;
  loopEvents.push({ t: performance.now() - loopStartT, type, arg });
  const btn = document.getElementById('loop-btn');
  if (btn && btn.classList.contains('rec')) {
    btn.textContent = `⏺ 녹음 ${loopEvents.length}개`;
  }
}

function loopRunIteration() {
  if (!loopPlaying) return;
  const last = loopEvents[loopEvents.length - 1];
  if (!last) return;
  const total = (last.t + 150) / loopSpeed;
  loopTimeouts.forEach((id) => clearTimeout(id));
  loopTimeouts = [];
  loopEvents.forEach((e) => {
    const id = setTimeout(() => {
      if (!loopPlaying) return;
      if (e.type === 'key') pressKey(e.arg, 1);
      else if (e.type === 'dj') playDjSlot(e.arg);
    }, e.t / loopSpeed);
    loopTimeouts.push(id);
  });
  loopIterTimer = setTimeout(loopRunIteration, total);
}

function loopToggle() {
  const btn = document.getElementById('loop-btn');
  if (loopPlaying) {
    loopPlaying = false;
    loopTimeouts.forEach((id) => clearTimeout(id));
    loopTimeouts = [];
    if (loopIterTimer) clearTimeout(loopIterTimer);
    btn.textContent = '🔁 루프';
    btn.classList.remove('on', 'rec');
    toast('루프 정지');
    return;
  }
  if (loopRecording) {
    loopRecording = false;
    btn.classList.remove('rec');
    if (loopEvents.length === 0) {
      btn.textContent = '🔁 루프';
      toast('녹음된 이벤트 없음');
      return;
    }
    loopPlaying = true;
    btn.textContent = `🔁 × ${loopEvents.length}`;
    btn.classList.add('on');
    toast(`${loopEvents.length}개 이벤트 루프 재생`);
    loopRunIteration();
    return;
  }
  // start recording
  loopEvents = [];
  loopStartT = performance.now();
  loopRecording = true;
  btn.textContent = '⏺ 녹음 중 (다시 눌러 종료)';
  btn.classList.add('rec');
  toast('루프 녹음 중…');
}

async function countdown(steps = ['3', '2', '1', 'REC']) {
  const el = document.getElementById('countdown');
  if (!el) return;
  el.hidden = false;
  for (const s of steps) {
    el.textContent = s;
    el.classList.remove('tick');
    void el.offsetWidth;
    el.classList.add('tick');
    await new Promise((r) => setTimeout(r, 650));
  }
  el.hidden = true;
  el.classList.remove('tick');
}

async function makeClip() {
  const mk = document.getElementById('make-clip');
  if (mk.disabled) return;
  mk.disabled = true;
  mk.textContent = '🎬 준비 중…';
  if (audioCtx?.state === 'suspended') await audioCtx.resume();
  await countdown();
  setupRecorder();
  if (!recorder) { mk.disabled = false; mk.textContent = '🎬 Make Clip'; return; }
  if (recorder.state === 'recording') recorder.stop();
  recChunks = [];
  recStart = performance.now();
  recorder.start();
  const recBtn = document.getElementById('rec');
  recBtn.textContent = '⏹ 녹음 중…';
  recBtn.classList.add('recording');
  startRecTimer();
  mk.textContent = '🎬 녹음 중…';
  autoBeat();
  const bpm = currentBpm || 128;
  const step = (60 / bpm) * 500;
  const clipMs = step * 18 + 600;
  await new Promise((r) => setTimeout(r, clipMs));
  toggleRec();
  mk.textContent = '🎬 저장됨!';
  toast('클립 저장됨 (WebM)');
  setTimeout(() => { mk.disabled = false; mk.textContent = '🎬 Make Clip'; }, 1600);
}
function shuffleDj() {
  const ids = DJ_EFFECTS.map((e) => e.id);
  const picked = new Set();
  djMapping = [];
  while (djMapping.length < 9) {
    const pick = ids[Math.floor(Math.random() * ids.length)];
    if (!picked.has(pick) || picked.size === ids.length) {
      picked.add(pick);
      djMapping.push(pick);
    }
  }
  saveDjMapping();
  renderDjSlots();
  toast('DJ 슬롯 랜덤 셔플됨');
}
document.getElementById('dj-filter').addEventListener('input', (e) => {
  djFilter = e.target.value;
  renderDjSlots();
  document.getElementById('dj-filter').focus();
});
document.getElementById('shuffle-dj').onclick = shuffleDj;
document.getElementById('reset-dj').onclick = () => {
  djMapping = [...DEFAULT_DJ_MAPPING];
  saveDjMapping();
  renderDjSlots();
  toast('DJ 슬롯 기본값 복원');
};
document.getElementById('make-clip').onclick = makeClip;
document.getElementById('loop-btn').addEventListener('click', (e) => {
  if (e.shiftKey) {
    loopEvents = [];
    loopPlaying = false;
    loopRecording = false;
    loopTimeouts.forEach((id) => clearTimeout(id));
    loopTimeouts = [];
    if (loopIterTimer) clearTimeout(loopIterTimer);
    const btn = document.getElementById('loop-btn');
    btn.textContent = '🔁 루프';
    btn.classList.remove('on', 'rec');
    toast('루프 클리어');
    return;
  }
  loopToggle();
});
document.getElementById('metro').onclick = toggleMetro;
document.getElementById('replay-btn').onclick = replayLast;
document.getElementById('randomize-segs').onclick = () => {
  if (!buffer) return;
  segments.forEach((s) => {
    const len = s.end - s.start;
    const maxStart = Math.max(0, buffer.duration - len);
    s.start = Math.random() * maxStart;
    s.end = s.start + len;
  });
  clampSegments();
  saveSegments();
  aSubBufferCache = null;
  renderSegments();
  renderActiveBar();
  drawWaveform();
  toast('세그먼트 랜덤 이동');
};
document.getElementById('loop-speed').onclick = () => {
  const i = LOOP_SPEEDS.indexOf(loopSpeed);
  loopSpeed = LOOP_SPEEDS[(i + 1) % LOOP_SPEEDS.length];
  document.getElementById('loop-speed').textContent = loopSpeed + '×';
  if (loopPlaying) loopRunIteration();
};
document.getElementById('auto-beat').onclick = autoBeat;
document.getElementById('share').onclick = shareLink;
document.getElementById('share-x').onclick = () => {
  const b64 = encodePreset();
  const url = location.origin + location.pathname + '#p=' + b64;
  const text = encodeURIComponent('oiiai keyboard 내 세팅 🎧🐱');
  window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}`, '_blank', 'noopener,noreferrer');
};
document.getElementById('play-all').onclick = playAll;
document.getElementById('play-oiia').onclick = playOiiaSequence;
document.getElementById('reset').onclick = () => {
  segments = structuredClone(DEFAULT_SEGMENTS);
  clampSegments();
  saveSegments();
  renderActiveBar();
  renderSegments();
  drawWaveform();
};
document.getElementById('export').onclick = () => {
  const data = segments.map((s) => ({
    id: s.id, jamo: s.jamo, start: +s.start.toFixed(3), end: +s.end.toFixed(3),
  }));
  const text = JSON.stringify(data, null, 2);
  navigator.clipboard.writeText(text).catch(() => {});
  console.log(text);
  toast('타임스탬프 JSON이 클립보드 · 콘솔에 복사됨');
};

const PRESETS = [
  { name: '🚀 Basics',  dj: ['distort', 'reverse', 'deep', 'chip', 'sweep', 'stutter', 'wubwub', 'scratch', 'riser'], bpm: null },
  { name: '🎧 Club',    dj: ['wubwub', 'deep', 'stutter', 'distort', 'drive', 'pingpong', 'echo', 'sweep', 'crush'],  bpm: 128 },
  { name: '✨ Ether',   dj: ['hall', 'phaser', 'swell', 'chord', 'revecho', 'flanger', 'echo', 'siren', 'vinyl'],       bpm: 96 },
  { name: '🔥 Chaos',   dj: ['glitch', 'tapestop', 'robot', 'drumroll', 'laser', 'scratch', 'backspin', 'chip', 'lofi'], bpm: 145 },
];

function applyNamedPreset(p) {
  djMapping = p.dj.map((id) => DJ_EFFECTS.find((e) => e.id === id) ? id : DEFAULT_DJ_MAPPING[0]);
  saveDjMapping();
  renderDjSlots();
  if (p.bpm) {
    currentBpm = p.bpm;
    tapTimes = [];
    const bv = document.getElementById('bpm-value');
    if (bv) bv.textContent = p.bpm + ' BPM';
    schedulePulse();
  }
  toast('프리셋: ' + p.name);
}

function renderPresets() {
  const el = document.getElementById('presets');
  if (!el) return;
  el.innerHTML = PRESETS.map((p, i) =>
    `<button class="preset-btn" data-preset="${i}">${p.name}${p.bpm ? ` · ${p.bpm}` : ''}</button>`
  ).join('');
  el.querySelectorAll('[data-preset]').forEach((b) => {
    b.addEventListener('click', () => applyNamedPreset(PRESETS[+b.dataset.preset]));
  });
}

function setActiveSegment(i) {
  activeSegIndex = i;
  document.querySelectorAll('.seg').forEach((el, idx) => {
    el.classList.toggle('active', idx === i);
  });
  renderActiveBar();
  drawWaveform();
}

function renderActiveBar() {
  const bar = document.getElementById('active-bar');
  if (!bar) return;
  bar.innerHTML = segments.map((s, i) => `
    <button class="active-chip${i === activeSegIndex ? ' on' : ''}" data-sel="${i}" style="--c:${s.color}">
      <span class="num">${i + 1}</span>
      <span class="jamo">${s.jamo}</span>
      <span class="sub">${s.id}</span>
    </button>
  `).join('');
  bar.querySelectorAll('button[data-sel]').forEach((b) => {
    b.addEventListener('click', () => setActiveSegment(+b.dataset.sel));
  });
}

function timeFromX(clientX) {
  const rect = canvas.getBoundingClientRect();
  const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
  return (x / rect.width) * buffer.duration;
}

function pxPerSec() {
  return canvas.clientWidth / buffer.duration;
}

function hitTest(t, clientY) {
  const rect = canvas.getBoundingClientRect();
  const relY = (clientY - rect.top) / rect.height;
  const edgeTolSec = 8 / pxPerSec();
  let activeHit = null;
  let otherHit = null;
  for (let i = 0; i < segments.length; i++) {
    const s = segments[i];
    const near = (Math.abs(t - s.start) < edgeTolSec) ? 'start'
               : (Math.abs(t - s.end) < edgeTolSec) ? 'end'
               : (t >= s.start && t <= s.end) ? 'body'
               : null;
    if (!near) continue;
    const hit = { i, where: near };
    if (i === activeSegIndex) { activeHit = hit; break; }
    if (!otherHit) otherHit = hit;
  }
  return activeHit || otherHit;
}

function updateCursor(hit) {
  if (!hit) { canvas.style.cursor = 'crosshair'; return; }
  if (hit.where === 'start' || hit.where === 'end') canvas.style.cursor = 'ew-resize';
  else canvas.style.cursor = 'grab';
}

canvas.addEventListener('pointermove', (e) => {
  if (dragState || !buffer) return;
  const t = timeFromX(e.clientX);
  updateCursor(hitTest(t, e.clientY));
});

canvas.addEventListener('pointerdown', (e) => {
  if (!buffer) return;
  if (audioCtx?.state === 'suspended') audioCtx.resume();
  const t = timeFromX(e.clientX);
  const hit = hitTest(t, e.clientY);
  if (hit && (hit.where === 'start' || hit.where === 'end')) {
    dragState = { kind: 'resize', i: hit.i, edge: hit.where, startX: e.clientX, moved: false };
    setActiveSegment(hit.i);
  } else if (hit && hit.where === 'body') {
    const s = segments[hit.i];
    dragState = { kind: 'move', i: hit.i, anchorT: t, origStart: s.start, origEnd: s.end, startX: e.clientX, moved: false };
    setActiveSegment(hit.i);
  } else {
    dragState = { kind: 'range', anchor: t, startX: e.clientX, moved: false };
  }
  canvas.setPointerCapture(e.pointerId);
});

canvas.addEventListener('pointermove', (e) => {
  if (!dragState || !buffer) return;
  const t = timeFromX(e.clientX);
  const moved = Math.abs(e.clientX - dragState.startX) > 3;
  if (!moved && !dragState.moved) return;
  dragState.moved = true;

  if (dragState.kind === 'resize') {
    const s = segments[dragState.i];
    if (dragState.edge === 'start') s.start = Math.max(0, Math.min(t, s.end - 0.01));
    else s.end = Math.min(buffer.duration, Math.max(t, s.start + 0.01));
    updateSegmentInputs(dragState.i);
  } else if (dragState.kind === 'move') {
    const s = segments[dragState.i];
    const delta = t - dragState.anchorT;
    const dur = dragState.origEnd - dragState.origStart;
    let newStart = dragState.origStart + delta;
    newStart = Math.max(0, Math.min(buffer.duration - dur, newStart));
    s.start = newStart;
    s.end = newStart + dur;
    updateSegmentInputs(dragState.i);
  } else if (dragState.kind === 'range') {
    const s = segments[activeSegIndex];
    s.start = Math.max(0, Math.min(dragState.anchor, t));
    s.end = Math.min(buffer.duration, Math.max(dragState.anchor, t));
    if (s.end - s.start < 0.01) s.end = s.start + 0.01;
    updateSegmentInputs(activeSegIndex);
  }
  drawWaveform();
});

canvas.addEventListener('pointerup', (e) => {
  if (!dragState) return;
  canvas.releasePointerCapture(e.pointerId);
  const moved = dragState.moved;
  const kind = dragState.kind;
  const idx = dragState.i ?? activeSegIndex;
  const ds = dragState;
  dragState = null;

  if (!moved) {
    if (kind === 'range') {
      const t = timeFromX(e.clientX);
      const src = audioCtx.createBufferSource();
      src.buffer = buffer;
      src.connect(masterOut);
      src.start(0, t, 0.3);
    }
    return;
  }
  saveSegments();
  if (kind === 'range' || kind === 'move' || kind === 'resize') {
    playSegmentByIndex(idx);
  }
});

function updateSegmentInputs(i) {
  const s = segments[i];
  const card = segsEl.children[i];
  if (!card) return;
  const inputs = card.querySelectorAll('input[type=range]');
  inputs[0].value = s.start;
  inputs[1].value = s.end;
  document.getElementById(`v-${i}-start`).textContent = s.start.toFixed(3) + 's';
  document.getElementById(`v-${i}-end`).textContent = s.end.toFixed(3) + 's';
  card.querySelector('.seg-meta').textContent = (s.end - s.start).toFixed(3) + 's';
}

window.addEventListener('resize', () => buffer && drawWaveform());

init();
