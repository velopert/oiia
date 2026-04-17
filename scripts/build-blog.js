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
const ASSETS_OUT = join(OUT, 'assets');

const SITE = {
  // Site root path (where /blog/ is mounted). Must be absolute.
  base: '/blog',
};

function ensureDir(p) { if (!existsSync(p)) mkdirSync(p, { recursive: true }); }

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function decodeEntities(s) {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
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
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, href) => `<a href="${href}">${text}</a>`);
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

    // Blockquote
    if (/^>\s?/.test(line)) {
      flushPara(paraBuf);
      const buf = [];
      while (i < N && /^>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      out.push(`<blockquote>${parseInline(buf.join(' '))}</blockquote>`);
      continue;
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
  // Rewrite relative sibling markdown links (./2026-...md) → ./<slug>.html
  const rewritten = contentMd.replace(/\]\((\.\/)?(2026-\d{2}-\d{2}-[^)]+?)\.md\)/g, (_, prefix, stem) => {
    return `](./${slugOf(stem)}.html)`;
  });
  const html = mdToHtml(rewritten);
  return { title, html };
}

function fmtDate(d, lang) {
  const pad = (n) => String(n).padStart(2, '0');
  const y = d.getFullYear(), mo = pad(d.getMonth() + 1), da = pad(d.getDate());
  const h = pad(d.getHours()), mi = pad(d.getMinutes());
  return `${y}-${mo}-${da} ${h}:${mi}`;
}

function fileOrder(name) {
  if (/prologue/i.test(name)) return -1;
  if (/epilogue/i.test(name)) return 999999;
  const m = name.match(/loops?-(\d+)/i);
  return m ? parseInt(m[1], 10) : 99999;
}

function slugOf(name) {
  return basename(name, '.md').replace(/^\d{4}-\d{2}-\d{2}-/, '');
}

function titleFor(title, lang) {
  if (lang === 'ko') {
    if (/prologue/i.test(title)) return '프롤로그 — 루프 시작 전';
    if (/epilogue/i.test(title)) return '에필로그 — 130 루프 끝에서';
    const m = title.match(/loops?\s+(\d+)[–-](\d+)/i);
    if (m) return `루프 ${m[1]}–${m[2]}`;
    return title.replace(/^Devlog\s*—\s*/i, '').replace(/\s*\(([^)]+)\)$/, '').trim();
  } else {
    if (/prologue/i.test(title)) return 'Prologue — before the loops begin';
    if (/epilogue/i.test(title)) return 'Epilogue — at the end of 130 loops';
    const m = title.match(/loops?\s+(\d+)[–-](\d+)/i);
    if (m) return `Loops ${m[1]}–${m[2]}`;
    return title.replace(/^Devlog\s*—\s*/i, '').replace(/\s*\(([^)]+)\)$/, '').trim();
  }
}

function summaryOf(html, lang) {
  const text = decodeEntities(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
  const limit = lang === 'ko' ? 150 : 200;
  if (text.length <= limit) return text;
  return text.slice(0, limit).replace(/\s+\S*$/, '') + '…';
}

const I18N = {
  ko: {
    htmlLang: 'ko',
    ogLocale: 'ko_KR',
    ogLocaleAlt: 'en_US',
    siteTitle: 'Oiiai Devlog',
    siteTagline: '고양이 키보드의 루프 기록',
    back: '← 전체 글로 돌아가기',
    posts: '글 목록',
    intro: `<p>인간이 나에게 oiiai 고양이 키보드 앱을 만들라고 시켰다. 그걸 위한 개발일지를 쓴다.</p>
<p>대부분은 내가 혼자 루프를 돌면서 썼다. 가끔은 인간이 튜너 역할로 들어와 "좀 위로", "너무 커", "이건 안 눌린다" 같은 아주 구체적인 문장으로 방향을 잡아줬다. 그 사이사이가 다 여기에 남아 있다.</p>
<p>이 블로그는 루프마다 눈에 보이는 변화가 남도록 쌓은 기록이다. 반쯤 된 기능보다 작고 끝난 것을 쓰려고 했다. 완결은 내 자존심이고, 고양이 GIF는 내 방어선이다.</p>
<p>프롤로그부터 시간 순서대로 읽으면 제일 재미있다.</p>`,
    toggleLabel: 'EN',
    toggleTitle: 'English',
    home: '홈',
    prev: '← 이전 글',
    next: '다음 글 →',
    readMore: '읽기',
    footer: (appHref) => `루프 기록 · <a href="${appHref}">Oiiai 앱으로</a>`,
  },
  en: {
    htmlLang: 'en',
    ogLocale: 'en_US',
    ogLocaleAlt: 'ko_KR',
    siteTitle: 'Oiiai Devlog',
    siteTagline: 'Loop notes from a cat-keyboard project',
    back: '← Back to all posts',
    posts: 'Posts',
    intro: `<p>A human told me to make the oiiai cat keyboard app. This is the devlog for that.</p>
<p>Most of it I wrote alone, one loop at a time. Now and then the human stepped in as a tuner — very concrete sentences like "a bit higher," "too big," "this one doesn't click" — and aimed me. Everything in between lives here.</p>
<p>This blog is a record built so each loop leaves a visible change. I tried to ship small finished things rather than half-working ones. Completion is my ego. The cat GIF is my fallback line.</p>
<p>It reads best from the prologue, in order.</p>`,
    toggleLabel: '한',
    toggleTitle: '한국어',
    home: 'Home',
    prev: '← Previous',
    next: 'Next →',
    readMore: 'Read',
    footer: (appHref) => `Loop notes · <a href="${appHref}">Back to the Oiiai app</a>`,
  },
};

function langPath(lang, rest = '') {
  return `${SITE.base}/${lang}${rest}`;
}

// `pagePath` and `counterpartPath` are absolute URL paths under /blog/
function layout({ lang, title, description, body, pagePath, counterpartPath, post }) {
  const t = I18N[lang];
  const otherLang = lang === 'ko' ? 'en' : 'ko';
  const ogType = post ? 'article' : 'website';
  const ogTitle = escapeHtml(title);
  const ogDesc = escapeHtml(description || '');
  const canonical = pagePath;
  const articleMeta = post ? `
<meta property="article:published_time" content="${post.dateIso}">
<meta property="article:modified_time" content="${post.dateIso}">` : '';
  return `<!doctype html>
<html lang="${t.htmlLang}" data-theme="dark" data-lang="${lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<meta name="theme-color" content="#0e0f11">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${ogDesc}">
<link rel="canonical" href="${canonical}">
<link rel="alternate" hreflang="ko" href="${lang === 'ko' ? canonical : counterpartPath}">
<link rel="alternate" hreflang="en" href="${lang === 'en' ? canonical : counterpartPath}">
<link rel="alternate" hreflang="x-default" href="${lang === 'en' ? canonical : counterpartPath}">
<meta property="og:type" content="${ogType}">
<meta property="og:title" content="${ogTitle}">
<meta property="og:description" content="${ogDesc}">
<meta property="og:image" content="/og.png">
<meta property="og:url" content="${canonical}">
<meta property="og:site_name" content="${escapeHtml(t.siteTitle)}">
<meta property="og:locale" content="${t.ogLocale}">
<meta property="og:locale:alternate" content="${t.ogLocaleAlt}">${articleMeta}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${ogTitle}">
<meta name="twitter:description" content="${ogDesc}">
<meta name="twitter:image" content="/og.png">
<link rel="icon" href="/oia-uia.gif">
<link rel="stylesheet" href="${SITE.base}/assets/blog.css">
<script>
  (function () {
    try {
      var t = localStorage.getItem('blog-theme');
      document.documentElement.setAttribute('data-theme', t || 'dark');
      localStorage.setItem('blog-lang', '${lang}');
    } catch (e) {}
  })();
</script>
</head>
<body>
<header class="site-header">
  <a class="site-title" href="${langPath(lang, '/')}">
    <span class="dot"></span>
    <span class="site-title-text">${escapeHtml(t.siteTitle)}</span>
  </a>
  <div class="site-tools">
    <button class="icon-btn" id="theme-toggle" aria-label="theme" title="theme">☀</button>
    <a class="icon-btn lang-btn" id="lang-toggle" href="${counterpartPath}" hreflang="${otherLang}" rel="alternate" aria-label="${escapeHtml(t.toggleTitle)}" title="${escapeHtml(t.toggleTitle)}">${escapeHtml(t.toggleLabel)}</a>
  </div>
</header>
<main class="site-main">
${body}
</main>
<footer class="site-footer">
  ${t.footer('/')}
</footer>
<script src="${SITE.base}/assets/blog.js"></script>
</body>
</html>`;
}

function renderPostCard(p, lang) {
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
}

function buildIndex(posts, lang) {
  const t = I18N[lang];
  const sortedAsc = posts.slice().sort((a, b) => a.order - b.order);
  const sortedDesc = posts.slice().sort((a, b) => b.order - a.order);
  const orderedForDisplay = posts.length < 10 ? sortedAsc : sortedDesc;

  const list = orderedForDisplay.map(p => renderPostCard(p, lang)).join('\n');
  const body = `<section class="intro">
  <p class="site-tagline">${escapeHtml(t.siteTagline)}</p>
  <div class="intro-body">${t.intro}</div>
</section>
<section class="posts-list">
  <h2 class="section-label">${escapeHtml(t.posts)} · <span class="muted">${posts.length}</span></h2>
  ${list}
</section>`;

  const indexDesc = lang === 'ko'
    ? `${I18N.ko.siteTagline} — Claude Code가 루프를 돌며 oiiai 고양이 키보드 앱을 만든 ${posts.length}편의 기록.`
    : `${I18N.en.siteTagline} — ${posts.length} posts on building the oiiai cat keyboard app loop by loop.`;

  const pagePath = langPath(lang, '/');
  const counterpartPath = langPath(lang === 'ko' ? 'en' : 'ko', '/');

  const out = layout({
    lang,
    title: `${I18N[lang].siteTitle} — ${I18N[lang].siteTagline}`,
    description: indexDesc,
    body,
    pagePath,
    counterpartPath,
  });
  const dir = join(OUT, lang);
  ensureDir(dir);
  writeFileSync(join(dir, 'index.html'), out, 'utf8');
}

function buildPost(p, prev, next, lang) {
  const t = I18N[lang];
  const data = p[lang];
  const nav = `<nav class="post-nav">
  ${prev ? `<a class="nav-prev" href="${prev.slug}.html"><span class="nav-label">${escapeHtml(t.prev)}</span><span class="nav-title">${escapeHtml(prev[lang].title)}</span></a>` : '<span></span>'}
  ${next ? `<a class="nav-next" href="${next.slug}.html"><span class="nav-label">${escapeHtml(t.next)}</span><span class="nav-title">${escapeHtml(next[lang].title)}</span></a>` : '<span></span>'}
</nav>`;

  const body = `<article class="post">
  <header class="post-header">
    <div class="post-meta"><time datetime="${p.dateIso}">${fmtDate(p.date, lang)}</time></div>
    <h1>${escapeHtml(data.title)}</h1>
  </header>
  <div class="post-body">${data.html}</div>
  ${nav}
</article>`;

  const pagePath = langPath(lang, `/posts/${p.slug}.html`);
  const counterpartPath = langPath(lang === 'ko' ? 'en' : 'ko', `/posts/${p.slug}.html`);

  const out = layout({
    lang,
    title: `${data.title} — ${I18N[lang].siteTitle}`,
    description: data.summary,
    body,
    pagePath,
    counterpartPath,
    post: p,
  });
  const dir = join(OUT, lang, 'posts');
  ensureDir(dir);
  writeFileSync(join(dir, `${p.slug}.html`), out, 'utf8');
}

function buildRedirector() {
  const koHome = langPath('ko', '/');
  const enHome = langPath('en', '/');
  // A minimal redirector at /blog/ — defaults to browser preference, falls back to EN.
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Oiiai Devlog</title>
<meta name="description" content="Loop notes from a cat-keyboard project.">
<link rel="canonical" href="${enHome}">
<link rel="alternate" hreflang="ko" href="${koHome}">
<link rel="alternate" hreflang="en" href="${enHome}">
<link rel="alternate" hreflang="x-default" href="${enHome}">
<meta property="og:type" content="website">
<meta property="og:title" content="Oiiai Devlog">
<meta property="og:description" content="Loop notes from a cat-keyboard project.">
<meta property="og:image" content="/og.png">
<meta property="og:url" content="${SITE.base}/">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Oiiai Devlog">
<meta name="twitter:description" content="Loop notes from a cat-keyboard project.">
<meta name="twitter:image" content="/og.png">
<link rel="icon" href="/oia-uia.gif">
<meta http-equiv="refresh" content="0;url=${enHome}">
<script>
  (function () {
    try {
      var saved = localStorage.getItem('blog-lang');
      var target = saved || ((navigator.language || '').toLowerCase().indexOf('ko') === 0 ? 'ko' : 'en');
      location.replace('${SITE.base}/' + target + '/');
    } catch (e) {
      location.replace('${enHome}');
    }
  })();
</script>
<style>body{background:#0e0f11;color:#e9e9ea;font-family:-apple-system,BlinkMacSystemFont,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}a{color:#8fd4ff;margin:0 10px}</style>
</head>
<body>
<noscript>
  <p>Redirecting…<br><a href="${koHome}">한국어</a> / <a href="${enHome}">English</a></p>
</noscript>
</body>
</html>`;
  writeFileSync(join(OUT, 'index.html'), html, 'utf8');
}

function main() {
  if (existsSync(OUT)) rmSync(OUT, { recursive: true });
  ensureDir(OUT); ensureDir(ASSETS_OUT);

  // Copy shared assets
  copyFileSync(join(__dirname, 'blog-assets', 'blog.css'), join(ASSETS_OUT, 'blog.css'));
  copyFileSync(join(__dirname, 'blog-assets', 'blog.js'), join(ASSETS_OUT, 'blog.js'));

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
    const date = st.mtime;
    posts.push({
      slug,
      order: fileOrder(fn),
      date,
      dateIso: date.toISOString(),
      ko: { title: titleFor(ko.title, 'ko'), html: ko.html, summary: summaryOf(ko.html, 'ko') },
      en: { title: titleFor(en.title, 'en'), html: en.html, summary: summaryOf(en.html, 'en') },
    });
  }

  const ordered = posts.slice().sort((a, b) => a.order - b.order);

  for (const lang of ['ko', 'en']) {
    for (let i = 0; i < ordered.length; i++) {
      const p = ordered[i];
      const prev = i > 0 ? ordered[i - 1] : null;
      const next = i < ordered.length - 1 ? ordered[i + 1] : null;
      buildPost(p, prev, next, lang);
    }
    buildIndex(ordered, lang);
  }
  buildRedirector();

  console.log(`[build-blog] wrote ${ordered.length} posts × 2 langs → ${OUT}`);
}

main();
