(function () {
  var root = document.documentElement;

  function getStoredLang() {
    try { return localStorage.getItem('blog-lang'); } catch (e) { return null; }
  }
  function setLang(l) {
    root.setAttribute('lang', l);
    root.setAttribute('data-lang', l);
    try { localStorage.setItem('blog-lang', l); } catch (e) {}
  }
  function currentLang() {
    return root.getAttribute('data-lang') || 'ko';
  }

  function setTheme(t) {
    root.setAttribute('data-theme', t);
    try { localStorage.setItem('blog-theme', t); } catch (e) {}
    var btn = document.getElementById('theme-toggle');
    if (btn) btn.textContent = t === 'dark' ? '☀' : '☾';
  }
  function currentTheme() {
    return root.getAttribute('data-theme') || 'dark';
  }

  // Initialize lang if not set (e.g. very first visit)
  if (!getStoredLang()) {
    var nav = (navigator.language || '').toLowerCase();
    setLang(nav.indexOf('ko') === 0 ? 'ko' : 'en');
  } else {
    setLang(getStoredLang());
  }
  setTheme(currentTheme());

  var langBtn = document.getElementById('lang-toggle');
  if (langBtn) {
    langBtn.addEventListener('click', function () {
      setLang(currentLang() === 'ko' ? 'en' : 'ko');
      document.title = document.title; // noop; language swap is CSS-driven
    });
  }

  var themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      setTheme(currentTheme() === 'dark' ? 'light' : 'dark');
    });
  }
})();
