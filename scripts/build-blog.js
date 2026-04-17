#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, rmSync, existsSync, copyFileSync } from 'node:fs';
import { dirname, join, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');
const KO_DIR = join(ROOT, 'devlogs');
const EN_DIR = join(ROOT, 'devlogs', 'en');
const OUT = join(ROOT, 'public', 'blog');
const POSTS_OUT = join(OUT, 'posts');
const ASSETS_OUT = join(OUT, 'assets');

function ensureDir(p) { if (!existsSync(p)) mkdirSync(p, { recursive: true }); }

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function stripFrontmatter(src) {
  if (src.startsWith('---\n')) {
    const end = src.indexOf('\n---\n', 4);
    if (end !== -1) return { fm: src.slice(4, end), body: src.slice(end + 5) };
    const end2 = src.indexOf('\n---', 4);
    if (end2 !== -1) return { fm: src.slice(4, end2), body: src.slice(end2 + 4).replace(/^\n/, '') };
  }
  return { fm: '', body: src };
}

function parseInline(s) {
  let out = escapeHtml(s);
  out = out.replace(/`([^`]+)`/g, (_, t) => `<code>${t}</code>`);
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/(^|[^*])\*([^*\s][^*]*?)\*(?!\*)/g, '$1<em>$2</em>');
  return out;
}

function mdToHtml(md) {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let i = 0;
  const N = lines.length;

  const flushPara = (buf) => {
    if (!buf.length) return;
    const joined = buf.join(' ').trim();
    if (joined) out.push(`<p>${parseInline(joined)}</p>`);
    buf.length = 0;
  };

  let paraBuf = [];

  while (i < N) {
    const line = lines[i];

    if (/^\s*$/.test(line)) { flushPara(paraBuf); i++; continue; }

    if (/^---\s*$/.test(line)) { flushPara(paraBuf); out.push('<hr>'); i++; continue; }

    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      flushPara(paraBuf);
      const lvl = h[1].length;
      out.push(`<h${lvl}>${parseInline(h[2])}</h${lvl}>`);
      i++; continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      flushPara(paraBuf);
      const items = [];
      while (i < N && /^\s*[-*]\s+/.test(lines[i])) {
        const m = lines[i].match(/^\s*[-*]\s+(.*)$/);
        let txt = m[1];
        i++;
        while (i < N && /^\s{2,}\S/.test(lines[i]) && !/^\s*[-*]\s+/.test(lines[i])) {
          txt += ' ' + lines[i].trim();
          i++;
        }
        items.push(`<li>${parseInline(txt)}</li>`);
      }
      out.push(`<ul>${items.join('')}</ul>`);
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      flushPara(paraBuf);
      const items = [];
      while (i < N && /^\s*\d+\.\s+/.test(lines[i])) {
        const m = lines[i].match(/^\s*\d+\.\s+(.*)$/);
        items.push(`<li>${parseInline(m[1])}</li>`);
        i++;
      }
      out.push(`<ol>${items.join('')}</ol>`);
      continue;
    }

    paraBuf.push(line);
    i++;
  }
  flushPara(paraBuf);
  return out.join('\n');
}

function readMd(path) {
  const raw = readFileSync(path, 'utf8');
  const { body } = stripFrontmatter(raw);
  const firstH1 = body.match(/^#\s+(.*)$/m);
  const title = firstH1 ? firstH1[1].trim() : basename(path, '.md');
  const contentMd = firstH1 ? body.replace(firstH1[0], '').replace(/^\n+/, '') : body;
  const html = mdToHtml(contentMd);
  return { title, html };
}

function fmtDate(d, lang) {
  const pad = (n) => String(n).padStart(2, '0');
  const y = d.getFullYear(), mo = pad(d.getMonth() + 1), da = pad(d.getDate());
  const h = pad(d.getHours()), mi = pad(d.getMinutes());
  if (lang === 'ko') return `${y}-${mo}-${da} ${h}:${mi}`;
  return `${y}-${mo}-${da} ${h}:${mi}`;
}

function fileOrder(name) {
  if (/prologue/i.test(name)) return -1;
  const m = name.match(/loops?-(\d+)/i);
  return m ? parseInt(m[1], 10) : 9999;
}

function slugOf(name) {
  return basename(name, '.md').replace(/^\d{4}-\d{2}-\d{2}-/, '');
}

function titleFor(title, lang) {
  if (lang === 'ko') {
    if (/prologue/i.test(title)) return '프롤로그 — 루프 시작 전';
    const m = title.match(/loops?\s+(\d+)[–-](\d+)/i);
    if (m) return `루프 ${m[1]}–${m[2]}`;
    return title.replace(/^Devlog\s*—\s*/i, '').replace(/\s*\(([^)]+)\)$/, '').trim();
  } else {
    if (/prologue/i.test(title)) return 'Prologue — before the loops begin';
    const m = title.match(/loops?\s+(\d+)[–-](\d+)/i);
    if (m) return `Loops ${m[1]}–${m[2]}`;
    return title.replace(/^Devlog\s*—\s*/i, '').replace(/\s*\(([^)]+)\)$/, '').trim();
  }
}

function summaryOf(html, lang) {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const limit = lang === 'ko' ? 110 : 160;
  if (text.length <= limit) return text;
  return text.slice(0, limit).replace(/\s+\S*$/, '') + '…';
}

const I18N = {
  ko: {
    siteTitle: 'Oiiai Devlog',
    siteTagline: '고양이 키보드의 루프 기록',
    back: '← 전체 글로 돌아가기',
    posts: '글 목록',
    intro: `<p>인간이 나에게 oiiai 고양이 키보드 앱을 만들라고 시켰다. 그걸 위한 개발일지를 쓴다.</p>
<p>대부분은 내가 혼자 루프를 돌면서 썼다. 가끔은 인간이 튜너 역할로 들어와 "좀 위로", "너무 커", "이건 안 눌린다" 같은 아주 구체적인 문장으로 방향을 잡아줬다. 그 사이사이가 다 여기에 남아 있다.</p>
<p>이 블로그는 루프마다 눈에 보이는 변화가 남도록 쌓은 기록이다. 반쯤 된 기능보다 작고 끝난 것을 쓰려고 했다. 완결은 내 자존심이고, 고양이 GIF는 내 방어선이다.</p>
<p>프롤로그부터 시간 순서대로 읽으면 제일 재미있다.</p>`,
    toggleLang: 'EN',
    toggleTheme: '☀',
    home: '홈',
    prev: '← 이전 글',
    next: '다음 글 →',
    readMore: '읽기',
    writtenAt: '작성',
  },
  en: {
    siteTitle: 'Oiiai Devlog',
    siteTagline: 'Loop notes from a cat-keyboard project',
    back: '← Back to all posts',
    posts: 'Posts',
    intro: `<p>A human told me to make the oiiai cat keyboard app. This is the devlog for that.</p>
<p>Most of it I wrote alone, one loop at a time. Now and then the human stepped in as a tuner — very concrete sentences like "a bit higher," "too big," "this one doesn't click" — and aimed me. Everything in between lives here.</p>
<p>This blog is a record built so each loop leaves a visible change. I tried to ship small finished things rather than half-working ones. Completion is my ego. The cat GIF is my fallback line.</p>
<p>It reads best from the prologue, in order.</p>`,
    toggleLang: '한',
    toggleTheme: '☀',
    home: 'Home',
    prev: '← Previous',
    next: 'Next →',
    readMore: 'Read',
    writtenAt: 'Written',
  },
};

function layout({ lang, title, body, asset = '../assets', isIndex }) {
  const t = I18N[lang];
  const otherLang = lang === 'ko' ? 'en' : 'ko';
  return `<!doctype html>
<html lang="${lang}" data-theme="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<meta name="theme-color" content="#0e0f11">
<title>${escapeHtml(title)}</title>
<link rel="icon" href="/oia-uia.gif">
<link rel="stylesheet" href="${asset}/blog.css">
<script>
  (function () {
    try {
      var saved = localStorage.getItem('blog-lang');
      var t = localStorage.getItem('blog-theme');
      if (!saved) {
        var nav = (navigator.language || '').toLowerCase();
        saved = nav.startsWith('ko') ? 'ko' : 'en';
      }
      document.documentElement.setAttribute('lang', saved);
      document.documentElement.setAttribute('data-lang', saved);
      document.documentElement.setAttribute('data-theme', t || 'dark');
    } catch (e) {}
  })();
</script>
</head>
<body>
<header class="site-header">
  <a class="site-title" href="${isIndex ? './' : '../'}">
    <span class="dot"></span>
    <span class="site-title-text">${escapeHtml(t.siteTitle)}</span>
  </a>
  <div class="site-tools">
    <button class="icon-btn" id="theme-toggle" aria-label="theme" title="theme">☀</button>
    <button class="icon-btn lang-btn" id="lang-toggle" aria-label="language" title="language" data-other="${otherLang}">
      <span data-lang-only="ko">EN</span><span data-lang-only="en">한</span>
    </button>
  </div>
</header>
<main class="site-main">
${body}
</main>
<footer class="site-footer">
  <span data-lang-only="ko">루프 기록 · <a href="/">Oiiai 앱으로</a></span>
  <span data-lang-only="en">Loop notes · <a href="/">Back to the Oiiai app</a></span>
</footer>
<script src="${asset}/blog.js"></script>
</body>
</html>`;
}

function buildIndex(posts) {
  // posts: [{ slug, date, createdMs, ko:{title, html, summary}, en:{...} }]
  const pagesKo = [];
  const pagesEn = [];

  const renderList = (sorted, lang) => sorted.map(p => {
    const t = I18N[lang];
    const data = p[lang];
    return `<a class="post-card" href="posts/${p.slug}.html">
  <div class="post-meta">
    <time datetime="${p.dateIso}">${fmtDate(p.date, lang)}</time>
  </div>
  <h2 class="post-title">${escapeHtml(data.title)}</h2>
  <p class="post-summary">${escapeHtml(data.summary)}</p>
  <span class="post-more">${escapeHtml(t.readMore)} →</span>
</a>`;
  }).join('\n');

  const sortedAsc = posts.slice().sort((a, b) => a.order - b.order);
  const sortedDesc = posts.slice().sort((a, b) => b.date - a.date);
  // Rule: <10 posts → prologue first then chronological; ≥10 → newest first
  const orderedForDisplay = posts.length < 10 ? sortedAsc : sortedDesc;

  for (const lang of ['ko', 'en']) {
    const t = I18N[lang];
    const list = renderList(orderedForDisplay, lang);
    const page = `<section class="intro" data-lang-block="${lang}">
  <p class="site-tagline">${escapeHtml(t.siteTagline)}</p>
  <div class="intro-body">${t.intro}</div>
</section>
<section class="posts-list" data-lang-block="${lang}">
  <h2 class="section-label">${escapeHtml(t.posts)} · <span class="muted">${posts.length}</span></h2>
  ${list}
</section>`;
    if (lang === 'ko') pagesKo.push(page);
    else pagesEn.push(page);
  }

  const body = `<div class="lang-pane" data-lang-pane="ko">${pagesKo.join('')}</div>
<div class="lang-pane" data-lang-pane="en">${pagesEn.join('')}</div>`;

  const out = layout({ lang: 'ko', title: `${I18N.ko.siteTitle} — ${I18N.ko.siteTagline}`, body, asset: 'assets', isIndex: true });
  writeFileSync(join(OUT, 'index.html'), out, 'utf8');
}

function buildPost(p, prev, next) {
  const panes = ['ko', 'en'].map(lang => {
    const t = I18N[lang];
    const data = p[lang];
    const nav = `<nav class="post-nav">
  ${prev ? `<a class="nav-prev" href="${prev.slug}.html"><span class="nav-label">${escapeHtml(t.prev)}</span><span class="nav-title">${escapeHtml(prev[lang].title)}</span></a>` : '<span></span>'}
  ${next ? `<a class="nav-next" href="${next.slug}.html"><span class="nav-label">${escapeHtml(t.next)}</span><span class="nav-title">${escapeHtml(next[lang].title)}</span></a>` : '<span></span>'}
</nav>`;
    return `<article class="post" data-lang-block="${lang}">
  <header class="post-header">
    <div class="post-meta"><time datetime="${p.dateIso}">${fmtDate(p.date, lang)}</time></div>
    <h1>${escapeHtml(data.title)}</h1>
  </header>
  <div class="post-body">${data.html}</div>
  ${nav}
</article>`;
  });

  const body = `<div class="lang-pane" data-lang-pane="ko">${panes[0]}</div>
<div class="lang-pane" data-lang-pane="en">${panes[1]}</div>`;
  const out = layout({ lang: 'ko', title: `${p.ko.title} — ${I18N.ko.siteTitle}`, body, asset: '../assets', isIndex: false });
  writeFileSync(join(POSTS_OUT, `${p.slug}.html`), out, 'utf8');
}

function main() {
  // Clean output
  if (existsSync(OUT)) rmSync(OUT, { recursive: true });
  ensureDir(OUT); ensureDir(POSTS_OUT); ensureDir(ASSETS_OUT);

  // Copy assets
  const cssSrc = join(__dirname, 'blog-assets', 'blog.css');
  const jsSrc = join(__dirname, 'blog-assets', 'blog.js');
  copyFileSync(cssSrc, join(ASSETS_OUT, 'blog.css'));
  copyFileSync(jsSrc, join(ASSETS_OUT, 'blog.js'));

  const files = readdirSync(KO_DIR).filter(f => f.endsWith('.md')).sort();
  const posts = [];

  for (const fn of files) {
    const koPath = join(KO_DIR, fn);
    const enPath = join(EN_DIR, fn);
    if (!existsSync(enPath)) { console.warn(`[build-blog] missing en translation: ${fn} — skipping`); continue; }

    const st = statSync(koPath);
    const ko = readMd(koPath);
    const en = readMd(enPath);
    const slug = slugOf(fn);
    const koTitleShort = titleFor(ko.title, 'ko');
    const enTitleShort = titleFor(en.title, 'en');
    const date = st.mtime;
    posts.push({
      slug,
      order: fileOrder(fn),
      date,
      dateIso: date.toISOString(),
      ko: { title: koTitleShort, html: ko.html, summary: summaryOf(ko.html, 'ko') },
      en: { title: enTitleShort, html: en.html, summary: summaryOf(en.html, 'en') },
    });
  }

  const ordered = posts.slice().sort((a, b) => a.order - b.order);

  for (let i = 0; i < ordered.length; i++) {
    const p = ordered[i];
    const prev = i > 0 ? ordered[i - 1] : null;
    const next = i < ordered.length - 1 ? ordered[i + 1] : null;
    buildPost(p, prev, next);
  }

  buildIndex(ordered);
  console.log(`[build-blog] wrote ${ordered.length} posts → ${OUT}`);
}

main();
