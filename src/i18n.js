const DICT = {
  ko: {
    'start.button': '시작하기',
    'start.hint': '또는 아무 키나 눌러서 시작',
    'dj.toggle.off': '🎛 DJ',
    'dj.toggle.on': '⚙ Advanced',
    'dj.toggle.title.off': 'DJ 모드로 (키 + 1–9 슬롯)',
    'dj.toggle.title.on': '고급 모드로 (파형·세그먼트·녹음)',
    'dj.shuffle': '🎲 이펙트 셔플',
    'dj.shuffle.title': '9개 슬롯을 랜덤 이펙트로',
    'tap.label': 'TAP',
    'tap.bpm.empty': '— BPM',
    'tap.title': 'TAP: BPM 탭 (T)',
    'quantize.label': '🧲 비트보완',
    'quantize.title': '비트 보완 (1/16 스냅)',
    'quantize.on': '비트 보완 ON (1/16)',
    'quantize.off': '비트 보완 OFF',
    'quantize.needsBpm': '먼저 BPM 설정 (T로 탭)',
    'dj.mode.on.toast': 'DJ 모드',
    'dj.mode.off.toast': 'Advanced 모드',
    'toast.stop': '정지',
    'toast.bpm.set': 'BPM {n}으로 설정',
    'toast.bpm.needFirst': '먼저 BPM 설정',
    'lang.toggle.title': 'Language / 언어',
    'tour.skip': '건너뛰기',
    'tour.next': '다음 →',
    'tour.1.title': '오이아이 키 6개',
    'tour.1.body': 'ㅜ ㅣ ㅏ A B C 자모 키를 탭(또는 N/L/K/Q/W/E). 꾹 누르면 EDM 빌드업 → 드롭 폭발!',
    'tour.2.title': '1–9 DJ 이펙트 패드',
    'tour.2.body': '숫자패드를 탭하거나 키보드 1–9로 9가지 DJ 이펙트를 발사하세요.',
    'tour.3.title': '🎲 이펙트 셔플',
    'tour.3.body': '패드 아래 셔플 버튼 한 번으로 9개 슬롯을 전부 랜덤 이펙트로 교체.',
    'tour.4.title': '⚙ Advanced 모드',
    'tour.4.body': '우측 상단 버튼으로 파형·세그먼트 편집·녹음·루프 등 고급 기능 전환.',
    'keyhelp.title': '단축키',
    'keyhelp.o': 'o 음절',
    'keyhelp.i': 'i 음절',
    'keyhelp.a': 'a 음절',
    'keyhelp.ka': 'A 샘플 + 고양이 팝',
    'keyhelp.kb': 'B 샘플 + 슬로우모션 고양이',
    'keyhelp.kc': 'C 샘플 + 회전 고양이',
    'keyhelp.dj': 'DJ 이펙트 슬롯',
    'keyhelp.djRandom': '랜덤 DJ 슬롯',
    'keyhelp.playAll': '원곡 전체 재생',
    'keyhelp.tab': '구간 순환 선택',
    'keyhelp.hold': 'EDM 빌드업 → 드롭',
    'keyhelp.holdLabel': '꾹 누르기',
    'keyhelp.undo': '세그먼트 편집 되돌리기',
    'keyhelp.help': '이 창 토글',
    'keyhelp.esc': '이 창 닫기 / 루프·DJ 전체 정지',
    'keyhelp.close': '클릭/Esc/? 로 닫기',
    'keyhelp.tour': '🎯 튜토리얼 다시 보기',
    'keyhelp.reset': '🗑 전체 초기화',
    'keyhelp.resetTitle': '모든 설정 초기화',
    'keyhelp.fxIntensity': 'FX 강도',
    'hint.body.ko': '<code>ㅜ</code><code>ㅣ</code><code>ㅣ</code><code>ㅏ</code> (물리키 N/L/K) · 추가 슬롯 <code>A</code><code>B</code><code>C</code> (Q/W/E) · <code>1</code>–<code>9</code> = 🎧 DJ 이펙트 슬롯 · 꾹 누르기 = EDM 빌드업 + 드롭',
    'hint.body.en': '<code>N</code> <code>I</code> <code>A</code> jamo keys · extra slots <code>A</code><code>B</code><code>C</code> (Q/W/E) · <code>1</code>–<code>9</code> = 🎧 DJ effect slots · hold a key = EDM build-up → drop',
    'hint.wave': '파형 조작: 구간 <b>클릭=선택</b> · 바디 <b>드래그=이동</b> · 경계선 <b>드래그=리사이즈</b> · 빈영역 <b>드래그=선택된 구간 범위 재지정</b> · 빈영역 클릭=미리듣기',
    'hint.shortcuts': '단축키: Space=전체재생 · <code>Tab</code>=구간 순환 · 파형 드래그로 구간 튜닝',
    'ctrl.playAll': '▶ 전체 재생 (Space)',
    'ctrl.playOiia': '▶ ㅜㅣㅣㅏ 순서로',
    'ctrl.rec': '⏺ 녹음',
    'ctrl.recStop': '⏹ 녹음 중…',
    'ctrl.metro': '🥁 Metro',
    'ctrl.metroOn': '🥁 …',
    'ctrl.makeClip': '🎬 Make Clip',
    'ctrl.replay': '🎞 리플레이',
    'ctrl.loop': '🔁 루프',
    'ctrl.share': '🔗 링크 공유',
    'ctrl.shareX': '𝕏 트윗',
    'ctrl.reset': '↺ 기본값',
    'ctrl.export': '⬇ 타임스탬프 복사',
    'ctrl.masterVol': '🔊',
    'toast.seg.undo': '세그먼트 되돌림',
    'toast.share.copied': '링크가 클립보드에 복사됨',
    'toast.share.loaded': '공유된 세팅 불러옴',
    'toast.replay.empty': '재생할 이벤트 없음 — 키를 먼저 눌러보세요',
    'toast.replay.window': '🎞 마지막 {sec}초 리플레이',
    'toast.loop.stop': '루프 정지',
    'toast.loop.empty': '녹음된 이벤트 없음',
    'toast.loop.rec': '루프 녹음 중…',
    'toast.loop.clear': '루프 클리어',
    'toast.clip.saved': '클립 저장됨 (WebM)',
    'toast.dj.shuffled': 'DJ 슬롯 랜덤 셔플됨',
    'toast.dj.reset': 'DJ 슬롯 기본값 복원',
    'toast.export.copied': '타임스탬프 JSON이 클립보드 · 콘솔에 복사됨',
    'toast.preset': '프리셋: {name}',
    'toast.loop.play': '{n}개 이벤트 루프 재생',
    'toast.celebrate': '🎉 {n} 프레스 달성!',
  },
  en: {
    'start.button': 'Start',
    'start.hint': 'Or press any key to begin',
    'dj.toggle.off': '🎛 DJ',
    'dj.toggle.on': '⚙ Advanced',
    'dj.toggle.title.off': 'Switch to DJ mode (keys + 1–9 pads)',
    'dj.toggle.title.on': 'Switch to Advanced (waveform, segments, record)',
    'dj.shuffle': '🎲 Shuffle FX',
    'dj.shuffle.title': 'Randomize all 9 slot effects',
    'tap.label': 'TAP',
    'tap.bpm.empty': '— BPM',
    'tap.title': 'TAP: press T to set BPM',
    'quantize.label': '🧲 Quantize',
    'quantize.title': 'Beat quantize (snap to 1/16)',
    'quantize.on': 'Quantize ON (1/16)',
    'quantize.off': 'Quantize OFF',
    'quantize.needsBpm': 'Set BPM first (tap T)',
    'dj.mode.on.toast': 'DJ mode',
    'dj.mode.off.toast': 'Advanced mode',
    'toast.stop': 'Stopped',
    'toast.bpm.set': 'BPM set to {n}',
    'toast.bpm.needFirst': 'Set BPM first',
    'lang.toggle.title': 'Language / 언어',
    'tour.skip': 'Skip',
    'tour.next': 'Next →',
    'tour.1.title': '6 Oiiai keys',
    'tour.1.body': 'Tap N I A + A B C (or N/I/A/Q/W/E). Hold a key for EDM build-up → drop!',
    'tour.2.title': '1–9 DJ FX pads',
    'tour.2.body': 'Tap the number pad or press 1–9 to fire 9 DJ effects.',
    'tour.3.title': '🎲 Shuffle FX',
    'tour.3.body': 'One tap of the shuffle button randomizes all 9 slot effects.',
    'tour.4.title': '⚙ Advanced mode',
    'tour.4.body': 'Top-right toggle opens waveform, segment edit, recording, loops, and more.',
    'keyhelp.title': 'Shortcuts',
    'keyhelp.o': 'O sound',
    'keyhelp.i': 'I sound',
    'keyhelp.a': 'A sound',
    'keyhelp.ka': 'A sample + cat pop',
    'keyhelp.kb': 'B sample + slow-mo cat',
    'keyhelp.kc': 'C sample + rotating cat',
    'keyhelp.dj': 'DJ effect slot',
    'keyhelp.djRandom': 'Random DJ slot',
    'keyhelp.playAll': 'Play original',
    'keyhelp.tab': 'Cycle segments',
    'keyhelp.hold': 'EDM build-up → drop',
    'keyhelp.holdLabel': 'Hold',
    'keyhelp.undo': 'Undo segment edit',
    'keyhelp.help': 'Toggle this window',
    'keyhelp.esc': 'Close / stop loops & DJ',
    'keyhelp.close': 'Click / Esc / ? to close',
    'keyhelp.tour': '🎯 Replay tutorial',
    'keyhelp.reset': '🗑 Reset all',
    'keyhelp.resetTitle': 'Reset all settings',
    'keyhelp.fxIntensity': 'FX intensity',
    'hint.body.ko': '<code>ㅜ</code><code>ㅣ</code><code>ㅣ</code><code>ㅏ</code> (physical N/L/K) · slots <code>A</code><code>B</code><code>C</code> (Q/W/E) · <code>1</code>–<code>9</code> = 🎧 DJ FX · hold a key = EDM build-up → drop',
    'hint.body.en': '<code>N</code> <code>I</code> <code>A</code> jamo keys · extra slots <code>A</code><code>B</code><code>C</code> (Q/W/E) · <code>1</code>–<code>9</code> = 🎧 DJ effect slots · hold a key = EDM build-up → drop',
    'hint.wave': 'Waveform: click=select · body drag=move · edge drag=resize · empty drag=reshape · empty click=preview',
    'hint.shortcuts': 'Keys: Space=play original · <code>Tab</code>=cycle segments · drag waveform to tune',
    'ctrl.playAll': '▶ Play all (Space)',
    'ctrl.playOiia': '▶ Play OIIAI',
    'ctrl.rec': '⏺ Record',
    'ctrl.recStop': '⏹ Recording…',
    'ctrl.metro': '🥁 Metro',
    'ctrl.metroOn': '🥁 …',
    'ctrl.makeClip': '🎬 Make clip',
    'ctrl.replay': '🎞 Replay',
    'ctrl.loop': '🔁 Loop',
    'ctrl.share': '🔗 Share link',
    'ctrl.shareX': '𝕏 Tweet',
    'ctrl.reset': '↺ Defaults',
    'ctrl.export': '⬇ Copy timestamps',
    'ctrl.masterVol': '🔊',
    'toast.seg.undo': 'Segment undone',
    'toast.share.copied': 'Link copied to clipboard',
    'toast.share.loaded': 'Shared setting loaded',
    'toast.replay.empty': 'No events to replay — press a key first',
    'toast.replay.window': '🎞 Last {sec}s replay',
    'toast.loop.stop': 'Loop stopped',
    'toast.loop.empty': 'No recorded events',
    'toast.loop.rec': 'Loop recording…',
    'toast.loop.clear': 'Loop cleared',
    'toast.clip.saved': 'Clip saved (WebM)',
    'toast.dj.shuffled': 'DJ slots shuffled',
    'toast.dj.reset': 'DJ slots reset to default',
    'toast.export.copied': 'Timestamps JSON copied to clipboard / console',
    'toast.preset': 'Preset: {name}',
    'toast.loop.play': 'Loop: {n} events playing',
    'toast.celebrate': '🎉 {n} presses!',
  },
};

const LOCALE_KEY = 'oiia-locale-v1';

function detectBrowserLocale() {
  const langs = (navigator.languages && navigator.languages.length)
    ? navigator.languages
    : [navigator.language || 'en'];
  for (const raw of langs) {
    const code = (raw || '').toLowerCase();
    if (code.startsWith('ko')) return 'ko';
  }
  return 'en';
}

let currentLocale = (() => {
  const stored = localStorage.getItem(LOCALE_KEY);
  if (stored === 'ko' || stored === 'en') return stored;
  return detectBrowserLocale();
})();

const listeners = new Set();

export function t(key, vars) {
  const table = DICT[currentLocale] || DICT.en;
  let str = table[key] ?? DICT.en[key] ?? key;
  if (vars) {
    for (const k of Object.keys(vars)) {
      str = str.replace(`{${k}}`, String(vars[k]));
    }
  }
  return str;
}

export function getLocale() { return currentLocale; }

export function setLocale(code) {
  if (code !== 'ko' && code !== 'en') return;
  if (code === currentLocale) return;
  currentLocale = code;
  localStorage.setItem(LOCALE_KEY, code);
  document.documentElement.setAttribute('lang', code);
  listeners.forEach((fn) => { try { fn(code); } catch {} });
}

export function onLocaleChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

document.documentElement.setAttribute('lang', currentLocale);
