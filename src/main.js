import './style.css';
import oiiaUrl from '/oiia.mp3?url';
import catGifUrl from '/oia-uia.gif?url';
import { createFX, createCatSpawner } from './effects.js';

const fx = createFX();
const catFx = createCatSpawner(catGifUrl);

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

function setupKeyhelp() {
  const el = document.getElementById('keyhelp');
  if (!el) return;
  function toggle(show) {
    if (show === undefined) show = el.hidden;
    el.hidden = !show;
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
  <canvas id="waveform"></canvas>
  <div class="keys" id="keys"></div>
  <div class="segments" id="segments"></div>
  <h3 style="margin:24px 0 8px;font-size:14px;color:#888;">🎧 DJ 슬롯 (1–9 키)</h3>
  <div class="dj-slots" id="dj-slots"></div>
  <div class="controls">
    <button id="play-all">▶ 전체 재생 (Space)</button>
    <button id="play-oiia" class="secondary">▶ ㅜㅣㅣㅏ 순서로</button>
    <button id="rec" class="rec-btn">⏺ 녹음</button>
    <button id="tap" class="tap-btn" title="t 키로도 탭">
      <span class="tap-label">TAP</span>
      <span id="bpm-value" class="bpm-value">— BPM</span>
    </button>
    <button id="share" class="secondary">🔗 링크 공유</button>
    <button id="reset" class="secondary">↺ 기본값</button>
    <button id="export" class="secondary">⬇ 타임스탬프 복사</button>
  </div>
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

function saveSegments() {
  localStorage.setItem('oiia-segments-v7', JSON.stringify(segments));
}

let masterOut;

async function init() {
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterOut = audioCtx.createDynamicsCompressor();
    masterOut.threshold.value = -8;
    masterOut.knee.value = 18;
    masterOut.ratio.value = 6;
    masterOut.attack.value = 0.003;
    masterOut.release.value = 0.18;
    masterOut.connect(audioCtx.destination);
    const res = await fetch(oiiaUrl);
    const arr = await res.arrayBuffer();
    buffer = await audioCtx.decodeAudioData(arr);
    clampSegments();
    renderKeys();
    renderActiveBar();
    renderSegments();
    renderDjSlots();
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
    const el = document.createElement('div');
    el.className = 'key';
    el.id = 'key-' + k.code;
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
  const k = KEY_ORDER.find((x) => x.code === code);
  if (!k) return;
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
  ws.connect(g).connect(masterOut);
  const s = djBufferSource();
  s.connect(ws);
  s.start();
}

function dj_reverse() {
  const s = djBufferSource(reverseBuffer(getDjBuffer()));
  s.connect(masterOut);
  s.start();
}

function dj_deep() {
  const s = djBufferSource();
  s.playbackRate.value = 0.55;
  const g = audioCtx.createGain();
  g.gain.value = 1.2;
  s.connect(g).connect(masterOut);
  s.start();
}

function dj_chipmunk() {
  const s = djBufferSource();
  s.playbackRate.value = 1.9;
  s.connect(masterOut);
  s.start();
}

function dj_sweep() {
  const f = audioCtx.createBiquadFilter();
  f.type = 'lowpass';
  f.Q.value = 10;
  f.connect(masterOut);
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
  f.connect(masterOut);
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
    s.connect(masterOut);
    s.start(base + i * (segLen + gap), startT, segLen);
  }
}

function dj_scratch() {
  const s = djBufferSource();
  s.connect(masterOut);
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
  f.connect(masterOut);
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
  delay.connect(wet).connect(masterOut);
  const s = djBufferSource();
  s.connect(masterOut);
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
  ws.connect(f).connect(masterOut);
  const s = djBufferSource();
  s.connect(ws);
  s.start();
}

function dj_tremolo() {
  const g = audioCtx.createGain();
  g.connect(masterOut);
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
  delay.connect(masterOut);
  const s = djBufferSource();
  s.connect(masterOut);
  s.connect(delay);
  s.start();
  s.onended = () => lfo.stop();
}

function dj_autowah() {
  const f = audioCtx.createBiquadFilter();
  f.type = 'bandpass';
  f.Q.value = 8;
  f.frequency.value = 1500;
  f.connect(masterOut);
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
  hp.connect(lp).connect(ws).connect(masterOut);
  const s = djBufferSource();
  s.connect(hp);
  s.start();
}

function dj_gate() {
  const g = audioCtx.createGain();
  g.gain.value = 0.5;
  g.connect(masterOut);
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
  s.connect(masterOut);
  const t = audioCtx.currentTime;
  s.playbackRate.setValueAtTime(1.0, t);
  s.playbackRate.exponentialRampToValueAtTime(0.08, t + 0.8);
  s.start();
  s.stop(t + 1);
}

function dj_powerup() {
  const s = djBufferSource();
  s.connect(masterOut);
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
  f.connect(g).connect(masterOut);
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
  out.connect(masterOut);
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
  ws.connect(g).connect(masterOut);
  const s = djBufferSource();
  s.connect(ws);
  s.start();
}

function dj_laser() {
  const s = djBufferSource();
  s.connect(masterOut);
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
  merger.connect(masterOut);
  const s = djBufferSource();
  s.connect(masterOut);
  s.connect(splitL);
  s.start();
}

function dj_reverse_echo() {
  const rev = reverseBuffer(getDjBuffer());
  const delay = audioCtx.createDelay(2);
  delay.delayTime.value = 0.18;
  const fb = audioCtx.createGain();
  fb.gain.value = 0.5;
  delay.connect(fb).connect(delay);
  delay.connect(masterOut);
  const s = djBufferSource(rev);
  s.playbackRate.value = 0.9;
  s.connect(masterOut);
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

function playDjSlot(idx) {
  if (!buffer) return;
  if (audioCtx?.state === 'suspended') audioCtx.resume();
  stopAllDj();
  const id = djMapping[idx];
  const eff = DJ_EFFECTS.find((e) => e.id === id);
  if (!eff) return;
  try { eff.play(); } catch (err) { console.error(err); }
  fx.drop(eff.color, eff.name);
  haptic([30, 20, 40]);
}

function renderDjSlots() {
  const el = document.getElementById('dj-slots');
  if (!el) return;
  el.innerHTML = djMapping.map((id, i) => {
    const opts = DJ_EFFECTS.map((e) =>
      `<option value="${e.id}" title="${e.desc || ''}"${e.id === id ? ' selected' : ''}>${e.name}</option>`
    ).join('');
    const curr = DJ_EFFECTS.find((e) => e.id === id) || DJ_EFFECTS[0];
    return `
      <div class="dj-slot-wrap" style="--c:${curr.color}">
        <div class="dj-slot" title="${curr.desc || ''}">
          <span class="dj-num">${i + 1}</span>
          <select data-slot="${i}" title="${curr.desc || ''}">${opts}</select>
          <button data-test="${i}" title="${curr.desc || '테스트'}">▶</button>
        </div>
        <div class="dj-desc">${curr.desc || ''}</div>
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
  if (e.code === 'KeyT' && !e.metaKey && !e.ctrlKey) {
    e.preventDefault();
    tapBeat();
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

function playAll() {
  if (audioCtx?.state === 'suspended') audioCtx.resume();
  const src = audioCtx.createBufferSource();
  src.buffer = buffer;
  src.connect(masterOut);
  src.start();
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
  const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
    ? 'audio/webm;codecs=opus' : 'audio/webm';
  recorder = new MediaRecorder(streamDest.stream, { mimeType: mime });
  recorder.ondataavailable = (e) => { if (e.data && e.data.size) recChunks.push(e.data); };
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
  }, period);
}

window.__getBpm = () => currentBpm;

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
    s: segments.map((x) => ({ id: x.id, s: +x.start.toFixed(4), e: +x.end.toFixed(4) })),
    d: djMapping,
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
      }
    });
    clampSegments();
    saveSegments();
  }
  if (Array.isArray(p.d) && p.d.length === 9) {
    djMapping = p.d.map((id) => (DJ_EFFECTS.find((e) => e.id === id) ? id : DEFAULT_DJ_MAPPING[0]));
    saveDjMapping();
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

document.getElementById('share').onclick = shareLink;
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
  alert('타임스탬프가 클립보드에 복사됨 (콘솔에도 출력)');
};

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
