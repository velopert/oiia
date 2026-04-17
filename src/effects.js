export function createFX() {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;mix-blend-mode:screen';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  let items = [];
  let last = performance.now();

  function resize() {
    const dpr = Math.min(1.5, window.devicePixelRatio || 1);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  function rand(a, b) { return a + Math.random() * (b - a); }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  const MAX_ITEMS = 900;

  function burst(color, label, intensity = 1) {
    const I = Math.max(0.6, Math.min(2.6, intensity));
    const w = window.innerWidth;
    const h = window.innerHeight;
    const x = rand(w * 0.15, w * 0.85);
    const y = rand(h * 0.2, h * 0.8);

    const nP = 36;
    for (let i = 0; i < nP; i++) {
      const a = (i / nP) * Math.PI * 2 + rand(-0.2, 0.2);
      const speed = rand(280, 780) * I;
      items.push({
        kind: 'p', x, y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        life: 0, max: rand(0.9, 1.5),
        color, size: rand(4, 12) * Math.sqrt(I),
      });
    }
    for (let i = 0; i < 14; i++) {
      const a = Math.random() * Math.PI * 2;
      const speed = rand(700, 1400) * I;
      items.push({
        kind: 's', x, y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        life: 0, max: rand(0.22, 0.45),
        color: '#fff', size: rand(2, 4),
      });
    }
    for (let i = 0; i < 8; i++) {
      const a = rand(-Math.PI, 0);
      const speed = rand(200, 500) * I;
      items.push({
        kind: 'c', x, y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        rot: 0, rotSpd: rand(-8, 8),
        life: 0, max: rand(1.2, 2.0),
        color, size: rand(6, 14) * Math.sqrt(I),
      });
    }
    for (let r = 0; r < 3; r++) {
      items.push({ kind: 'r', x, y, life: -r * 0.08, max: 0.8, color, scale: I });
    }
    items.push({
      kind: 't', x, y, life: 0, max: 1.3, text: label, color,
      rot: rand(-0.35, 0.35), scale: I,
    });
    items.push({ kind: 'f', life: 0, max: 0.3 * Math.min(1.5, I), color, alphaMul: I });
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + rand(0, Math.PI * 2);
      items.push({
        kind: 'beam', x, y, angle: a,
        life: 0, max: 0.45, color, scale: I,
      });
    }

    if (items.length > MAX_ITEMS) {
      items.splice(0, items.length - MAX_ITEMS);
    }
  }

  function drop(color, label) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const cx = w / 2, cy = h / 2;

    for (let i = 0; i < 120; i++) {
      const a = (i / 120) * Math.PI * 2 + rand(-0.1, 0.1);
      const speed = rand(700, 1800);
      items.push({
        kind: 'p', x: cx, y: cy,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        life: 0, max: rand(1.2, 2.2),
        color, size: rand(6, 18),
      });
    }
    for (let i = 0; i < 40; i++) {
      const a = Math.random() * Math.PI * 2;
      const speed = rand(1400, 2600);
      items.push({
        kind: 's', x: cx, y: cy,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        life: 0, max: rand(0.3, 0.6),
        color: '#fff', size: rand(3, 6),
      });
    }
    for (let r = 0; r < 6; r++) {
      items.push({ kind: 'r', x: cx, y: cy, life: -r * 0.12, max: 1.2, color, scale: 2.2 });
    }
    const maxTextW = w * 0.85;
    const estW = (label.length || 1) * 100;
    const textScale = Math.min(3.2, maxTextW / estW);
    items.push({ kind: 't', x: cx, y: cy, life: 0, max: 1.8, text: label, color, rot: 0, scale: textScale });
    items.push({ kind: 'f', life: 0, max: 0.6, color, alphaMul: 2.5 });
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      items.push({ kind: 'beam', x: cx, y: cy, angle: a, life: 0, max: 0.7, color, scale: 1.8 });
    }

    document.body.classList.add('fx-shake');
    setTimeout(() => document.body.classList.remove('fx-shake'), 500);

    if (items.length > MAX_ITEMS) {
      items.splice(0, items.length - MAX_ITEMS);
    }
  }

  function draw(dt) {
    const w = window.innerWidth;
    const h = window.innerHeight;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(0, 0, w, h);

    ctx.globalCompositeOperation = 'lighter';

    const groups = new Map();
    let write = 0;

    for (let idx = 0; idx < items.length; idx++) {
      const it = items[idx];
      it.life += dt;
      if (it.life < 0) { items[write++] = it; continue; }
      const t = it.life / it.max;
      if (t >= 1) continue;
      const a = 1 - t;

      if (it.kind === 'p' || it.kind === 's') {
        it.x += it.vx * dt;
        it.y += it.vy * dt;
        it.vy += 1300 * dt;
        it.vx *= 0.985;
        it.vy *= 0.985;
        if (it.x < -40 || it.x > w + 40 || it.y > h + 60) continue;
        const size = it.size * (0.3 + a * 0.7);
        let g = groups.get(it.color);
        if (!g) { g = []; groups.set(it.color, g); }
        g.push(it.x, it.y, size, a);
      } else if (it.kind === 'c') {
        it.x += it.vx * dt;
        it.y += it.vy * dt;
        it.vy += 900 * dt;
        it.vx *= 0.99;
        it.rot += it.rotSpd * dt;
        if (it.x < -40 || it.x > w + 40 || it.y > h + 60) continue;
        ctx.globalAlpha = a;
        ctx.fillStyle = it.color;
        ctx.save();
        ctx.translate(it.x, it.y);
        ctx.rotate(it.rot);
        ctx.fillRect(-it.size / 2, -it.size / 4, it.size, it.size / 2);
        ctx.restore();
      } else if (it.kind === 'r') {
        const r = easeOut(t) * 420 * (it.scale || 1);
        ctx.globalAlpha = a * 0.9;
        ctx.strokeStyle = it.color;
        ctx.lineWidth = (1 - t) * 12 + 1;
        ctx.shadowColor = it.color;
        ctx.shadowBlur = 30;
        ctx.beginPath();
        ctx.arc(it.x, it.y, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else if (it.kind === 't') {
        const baseScale = (0.3 + easeOut(t) * 2.2) * (it.scale || 1);
        ctx.font = 'bold 140px -apple-system, BlinkMacSystemFont, sans-serif';
        if (it._natW == null) it._natW = ctx.measureText(it.text).width;
        const maxScale = (w * 0.88) / Math.max(1, it._natW);
        const scale = Math.min(baseScale, maxScale);
        const halfW = (it._natW * scale) / 2;
        const drawX = Math.max(halfW + 6, Math.min(w - halfW - 6, it.x));
        const drawY = Math.max(60 * scale, Math.min(h - 60 * scale, it.y));
        const alpha = t < 0.18 ? t / 0.18 : Math.pow(1 - (t - 0.18) / 0.82, 1.5);
        ctx.globalAlpha = alpha;
        ctx.save();
        ctx.translate(drawX, drawY);
        ctx.rotate(it.rot * (1 + t));
        ctx.scale(scale, scale);
        ctx.fillStyle = it.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = it.color;
        ctx.shadowBlur = 40;
        ctx.fillText(it.text, 0, 0);
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#ffffff';
        ctx.shadowBlur = 0;
        ctx.strokeText(it.text, 0, 0);
        ctx.restore();
      } else if (it.kind === 'f') {
        ctx.globalAlpha = Math.min(0.85, Math.pow(1 - t, 2) * 0.28 * (it.alphaMul || 1));
        ctx.fillStyle = it.color;
        ctx.fillRect(0, 0, w, h);
      } else if (it.kind === 'br') {
        const r = 18 + easeOut(t) * 110;
        ctx.globalAlpha = Math.pow(1 - t, 1.4) * 0.8;
        ctx.strokeStyle = it.color;
        ctx.lineWidth = (1 - t) * 8 + 1.2;
        ctx.beginPath();
        ctx.arc(it.x, it.y, r, 0, Math.PI * 2);
        ctx.stroke();
      } else if (it.kind === 'beam') {
        const len = easeOut(t) * 900 * (it.scale || 1);
        ctx.globalAlpha = a * 0.6;
        ctx.strokeStyle = it.color;
        ctx.lineWidth = (1 - t) * 40 * (it.scale || 1);
        ctx.beginPath();
        ctx.moveTo(it.x, it.y);
        ctx.lineTo(it.x + Math.cos(it.angle) * len, it.y + Math.sin(it.angle) * len);
        ctx.stroke();
      }
      items[write++] = it;
    }
    items.length = write;

    for (const [color, buf] of groups) {
      ctx.fillStyle = color;
      for (let i = 0; i < buf.length; i += 4) {
        ctx.globalAlpha = buf[i + 3];
        ctx.beginPath();
        ctx.arc(buf[i], buf[i + 1], buf[i + 2], 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
  }

  function loop() {
    const now = performance.now();
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    draw(dt);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  let qualityMul = 1;
  let userIntensity = 1;
  function setQuality(m) { qualityMul = Math.max(0.3, Math.min(1, m)); }
  function setIntensity(i) { userIntensity = Math.max(0.2, Math.min(1.8, i)); }

  const origBurst = burst;
  function burstWithQ(color, label, intensity = 1) {
    origBurst(color, label, intensity * qualityMul * userIntensity);
  }

  function beatRing(color = '#5af') {
    const w = window.innerWidth;
    const h = window.innerHeight;
    items.push({ kind: 'br', x: w / 2, y: h - 60, life: 0, max: 0.55, color });
  }

  const origDraw = draw;

  return { burst: burstWithQ, drop, setQuality, setIntensity, beatRing, canvas };
}

export function createCatSpawner(url) {
  const layer = document.createElement('div');
  layer.className = 'cat-layer';
  document.body.appendChild(layer);

  const MAX_CATS = 14;
  const pool = [];

  function purge() {
    while (layer.childElementCount >= MAX_CATS && layer.firstElementChild) {
      layer.firstElementChild.remove();
    }
  }
  function makeCat(cls, styleStr, lifeMs) {
    purge();
    const img = new Image();
    img.src = url;
    img.className = 'cat-pop ' + cls;
    img.style.cssText = styleStr;
    layer.appendChild(img);
    setTimeout(() => { if (img.parentNode) img.remove(); }, lifeMs);
    return img;
  }

  function spawn() {
    while (layer.childElementCount >= MAX_CATS && layer.firstElementChild) {
      layer.firstElementChild.remove();
    }
    const img = pool.pop() || new Image();
    img.src = url;
    img.className = 'cat-pop cat-pop-v' + (1 + Math.floor(Math.random() * 3));
    const minS = 110, maxS = 300;
    const size = minS + Math.random() * (maxS - minS);
    const w = window.innerWidth;
    const h = window.innerHeight;
    const x = Math.random() * Math.max(0, w - size);
    const y = Math.random() * Math.max(0, h - size);
    const rot = (Math.random() - 0.5) * 36;
    const hue = Math.floor(Math.random() * 360);
    img.style.cssText = `
      position:absolute;
      left:${x}px;top:${y}px;
      width:${size}px;height:auto;
      --rot:${rot}deg;
      --glow:${hue};
      transform: translate3d(0,0,0);
    `;
    layer.appendChild(img);
    const lifetime = 1500 + Math.random() * 400;
    setTimeout(() => {
      if (img.parentNode) img.remove();
      if (pool.length < MAX_CATS) pool.push(img);
    }, lifetime);
  }

  function spawnBig() {
    while (layer.childElementCount >= MAX_CATS && layer.firstElementChild) {
      layer.firstElementChild.remove();
    }
    const img = new Image();
    img.src = url;
    img.className = 'cat-pop cat-pop-slow';
    const w = window.innerWidth;
    const h = window.innerHeight;
    const size = Math.min(w, h) * 0.72;
    const x = (w - size) / 2 + (Math.random() - 0.5) * w * 0.08;
    const y = (h - size) / 2 + (Math.random() - 0.5) * h * 0.04;
    const rot = (Math.random() - 0.5) * 14;
    img.style.cssText = `
      position:absolute;
      left:${x}px;top:${y}px;
      width:${size}px;height:auto;
      --rot:${rot}deg;
      z-index: 2;
    `;
    layer.appendChild(img);
    setTimeout(() => { if (img.parentNode) img.remove(); }, 3200);
  }

  function spawnRotate() {
    while (layer.childElementCount >= MAX_CATS && layer.firstElementChild) {
      layer.firstElementChild.remove();
    }
    const img = new Image();
    img.src = url;
    img.className = 'cat-pop cat-pop-rotate';
    const w = window.innerWidth;
    const h = window.innerHeight;
    const size = 140 + Math.random() * 140;
    const x = Math.random() * Math.max(0, w - size);
    const y = Math.random() * Math.max(0, h - size);
    const dir = Math.random() < 0.5 ? 1 : -1;
    const spinSec = 2.2 + Math.random() * 1.4;
    img.style.cssText = `
      position:absolute;
      left:${x}px;top:${y}px;
      width:${size}px;height:auto;
      --spin-dir:${dir};
      --spin-sec:${spinSec.toFixed(2)}s;
    `;
    layer.appendChild(img);
    setTimeout(() => { if (img.parentNode) img.remove(); }, 2800);
  }

  function spawnBurst() {
    while (layer.childElementCount >= MAX_CATS && layer.firstElementChild) {
      layer.firstElementChild.remove();
    }
    const w = window.innerWidth;
    const h = window.innerHeight;
    const cx = w / 2 + (Math.random() - 0.5) * w * 0.12;
    const cy = h / 2 + (Math.random() - 0.5) * h * 0.12;
    const count = 8;
    const size = Math.max(70, Math.min(w, h) * 0.11);
    const radius = Math.min(w, h) * 0.42;
    const baseAngle = Math.random() * Math.PI * 2;
    const dur = 1400;
    for (let i = 0; i < count; i++) {
      const img = new Image();
      img.src = url;
      img.className = 'cat-pop cat-pop-burst';
      const a = baseAngle + (i / count) * Math.PI * 2;
      const jitter = (Math.random() - 0.5) * 0.25;
      const dx = Math.cos(a + jitter) * radius * (0.85 + Math.random() * 0.3);
      const dy = Math.sin(a + jitter) * radius * (0.85 + Math.random() * 0.3);
      const spin = (Math.random() < 0.5 ? -1 : 1) * (360 + Math.random() * 540);
      img.style.cssText = `
        position:absolute;
        left:${cx - size / 2}px;top:${cy - size / 2}px;
        width:${size}px;height:auto;
        --dx:${dx.toFixed(1)}px;
        --dy:${dy.toFixed(1)}px;
        --spin:${spin.toFixed(0)}deg;
        --delay:${(i * 18).toFixed(0)}ms;
        animation-delay: ${(i * 18).toFixed(0)}ms;
      `;
      layer.appendChild(img);
      const el = img;
      setTimeout(() => { if (el.parentNode) el.remove(); }, dur + i * 18 + 80);
    }
  }

  function setVars(el, vars) {
    for (const k in vars) el.style.setProperty(k, vars[k]);
  }

  function spawnRain() {
    const w = window.innerWidth, h = window.innerHeight;
    const n = 5;
    const size = Math.max(110, Math.min(w, h) * 0.16);
    for (let i = 0; i < n; i++) {
      const x = (w / (n + 1)) * (i + 1) + (Math.random() - 0.5) * 40;
      const delay = i * 60 + Math.random() * 80;
      const dur = 1100 + Math.random() * 300;
      const el = makeCat('cat-pop-rain', `position:absolute;left:${x - size / 2}px;top:${-size - 20}px;width:${size}px;height:auto;animation-delay:${delay}ms;animation-duration:${dur}ms;`, dur + delay + 80);
      setVars(el, { '--fall': (h + size + 40) + 'px', '--rot': ((Math.random() - 0.5) * 80).toFixed(1) + 'deg' });
    }
  }

  function spawnRise() {
    const w = window.innerWidth, h = window.innerHeight;
    const n = 3;
    const size = Math.max(150, Math.min(w, h) * 0.22);
    for (let i = 0; i < n; i++) {
      const x = w * (0.2 + i * 0.3) + (Math.random() - 0.5) * 60;
      const dur = 1500 + i * 120;
      const delay = i * 80;
      const liftNeg = -(h + size + 80);
      const sway = (Math.random() - 0.5) * 120;
      const el = makeCat('cat-pop-rise', `position:absolute;left:${x - size / 2}px;top:${h + 20}px;width:${size}px;height:auto;animation-delay:${delay}ms;animation-duration:${dur}ms;`, dur + delay + 80);
      setVars(el, { '--ly': liftNeg.toFixed(0) + 'px', '--sx': sway.toFixed(0) + 'px' });
    }
  }

  function spawnStreak() {
    const w = window.innerWidth, h = window.innerHeight;
    const size = Math.max(200, Math.min(w, h) * 0.34);
    const y = h * (0.3 + Math.random() * 0.4);
    const dir = Math.random() < 0.5 ? 1 : -1;
    const dur = 900;
    const dist = (w + size * 2 + 40) * dir;
    const el = makeCat('cat-pop-streak', `position:absolute;left:${dir > 0 ? -size - 20 : w + 20}px;top:${y - size / 2}px;width:${size}px;height:auto;animation-duration:${dur}ms;`, dur + 60);
    setVars(el, { '--dist': dist.toFixed(0) + 'px' });
  }

  function spawnCorners() {
    const w = window.innerWidth, h = window.innerHeight;
    const size = Math.max(140, Math.min(w, h) * 0.18);
    const cx = w / 2, cy = h / 2;
    const corners = [[-size - 20, -size - 20], [w + 20, -size - 20], [-size - 20, h + 20], [w + 20, h + 20]];
    const dur = 1100;
    corners.forEach(([sx, sy], i) => {
      const tx = cx - sx - size / 2;
      const ty = cy - sy - size / 2;
      const spin = (Math.random() < 0.5 ? -1 : 1) * (360 + Math.random() * 360);
      const spinMid = spin * 0.55;
      const el = makeCat('cat-pop-corners', `position:absolute;left:${sx}px;top:${sy}px;width:${size}px;height:auto;animation-delay:${i * 40}ms;animation-duration:${dur}ms;`, dur + 120);
      setVars(el, {
        '--tx': tx.toFixed(0) + 'px',
        '--ty': ty.toFixed(0) + 'px',
        '--spin': spin.toFixed(0) + 'deg',
        '--spin-mid': spinMid.toFixed(0) + 'deg',
      });
    });
  }

  function spawnOrbit() {
    const w = window.innerWidth, h = window.innerHeight;
    const size = Math.max(130, Math.min(w, h) * 0.16);
    const r = Math.min(w, h) * 0.32;
    const cx = w / 2 - size / 2, cy = h / 2 - size / 2;
    const n = 4;
    const dur = 1400;
    const dir = Math.random() < 0.5 ? 1 : -1;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2;
      const a1 = a0 + dir * Math.PI * 2;
      const midA = a0 + dir * Math.PI;
      const el = makeCat('cat-pop-orbit', `position:absolute;left:${cx}px;top:${cy}px;width:${size}px;height:auto;animation-delay:${i * 30}ms;animation-duration:${dur}ms;`, dur + 120);
      setVars(el, {
        '--x0': (Math.cos(a0) * r).toFixed(0) + 'px',
        '--y0': (Math.sin(a0) * r).toFixed(0) + 'px',
        '--xm': (Math.cos(midA) * r).toFixed(0) + 'px',
        '--ym': (Math.sin(midA) * r).toFixed(0) + 'px',
        '--x1': (Math.cos(a1) * r).toFixed(0) + 'px',
        '--y1': (Math.sin(a1) * r).toFixed(0) + 'px',
      });
    }
  }

  function spawnPulse() {
    const w = window.innerWidth, h = window.innerHeight;
    const size = Math.max(280, Math.min(w, h) * 0.5);
    const cx = w / 2 - size / 2, cy = h / 2 - size / 2;
    const dur = 1300;
    makeCat('cat-pop-pulse', `position:absolute;left:${cx}px;top:${cy}px;width:${size}px;height:auto;animation-duration:${dur}ms;`, dur + 60);
  }

  function spawnShake() {
    const w = window.innerWidth, h = window.innerHeight;
    const size = Math.max(230, Math.min(w, h) * 0.38);
    const cx = w / 2 - size / 2, cy = h / 2 - size / 2;
    const dur = 900;
    makeCat('cat-pop-shake', `position:absolute;left:${cx}px;top:${cy}px;width:${size}px;height:auto;animation-duration:${dur}ms;`, dur + 60);
  }

  function spawnZigzag() {
    const w = window.innerWidth, h = window.innerHeight;
    const size = Math.max(150, Math.min(w, h) * 0.2);
    const startX = Math.random() * (w - size);
    const startY = h + 20;
    const dur = 1500;
    const up = h + size + 80;
    const zig = 60 + Math.random() * 60;
    const el = makeCat('cat-pop-zigzag', `position:absolute;left:${startX}px;top:${startY}px;width:${size}px;height:auto;animation-duration:${dur}ms;`, dur + 60);
    setVars(el, {
      '--u1': (-up * 0.2).toFixed(0) + 'px',
      '--u2': (-up * 0.45).toFixed(0) + 'px',
      '--u3': (-up * 0.72).toFixed(0) + 'px',
      '--u4': (-up).toFixed(0) + 'px',
      '--zig': zig.toFixed(0) + 'px',
      '--zigN': (-zig).toFixed(0) + 'px',
    });
  }

  function spawnMirror() {
    const w = window.innerWidth, h = window.innerHeight;
    const size = Math.max(180, Math.min(w, h) * 0.26);
    const cy = h / 2 - size / 2;
    const cx = w / 2 - size / 2;
    const dist = w * 0.35;
    const dur = 1200;
    const elL = makeCat('cat-pop-mirror-l', `position:absolute;left:${cx}px;top:${cy}px;width:${size}px;height:auto;animation-duration:${dur}ms;`, dur + 60);
    setVars(elL, { '--dN': (-dist).toFixed(0) + 'px', '--dMid': (-dist * 0.5).toFixed(0) + 'px' });
    const elR = makeCat('cat-pop-mirror-r', `position:absolute;left:${cx}px;top:${cy}px;width:${size}px;height:auto;animation-duration:${dur}ms;`, dur + 60);
    setVars(elR, { '--d': dist.toFixed(0) + 'px', '--dMid': (dist * 0.5).toFixed(0) + 'px' });
  }

  const DJ_SPAWNERS = [spawnRain, spawnRise, spawnStreak, spawnCorners, spawnOrbit, spawnPulse, spawnShake, spawnZigzag, spawnMirror];
  function spawnDjFx(idx) {
    const fn = DJ_SPAWNERS[idx % DJ_SPAWNERS.length];
    if (fn) fn();
  }

  return { spawn, spawnBig, spawnRotate, spawnBurst, spawnDjFx };
}

