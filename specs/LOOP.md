# LOOP.md — Oiiai Keyboard

## Vision
바이럴하게 퍼질 수 있고, 실제 DJ가 재밌게 쓸 만하고, 데스크탑·모바일 양쪽 모두 매끄러운 oiiai keyboard.

## Principles
- **Every loop = visible user-facing improvement.** 리팩터링만 한 루프는 실패.
- **Ship tight.** 반쯤 된 기능 대신 작게 완결된 변경.
- **Shareable by default.** 멋진 건 보여주기 쉬워야 바이럴됨.
- **Desktop + mobile parity.** 키보드 전용 기능은 터치 대안 필수.
- **Low friction.** 첫 탭/첫 키프레스에서 바로 "오" 소리가 나와야 함.
- **No copyrighted content added.** `public/oiia.mp3`는 유저가 직접 넣은 것. 가사/신규 저작권 콘텐츠 생성 금지.
- **Performance budget.** 키 홀드 가속 중에도 60fps·오디오 글리치 없음.

## Loop protocol (매 반복마다 이걸 따름)
1. 이 파일 먼저 읽기 — 현재 상태와 Backlog 확인.
2. Backlog에서 **하나**만 고르기. 우선순위:
   - (a) 유저가 눈으로 보거나 들을 수 있는 변화인가
   - (b) viral / DJ / mobile 축 중 하나를 실질적으로 진전시키는가
   - (c) 한 루프 안에 깔끔히 끝낼 수 있는가
3. 구현.
4. **Playwright 검수** (아래 섹션 참조). smoke + 관련 spec 통과해야 Done 자격.
5. Backlog 체크리스트에서 해당 항목을 `- [x]`로 체크하고, 그대로 Done 섹션으로 이동 (한 줄 요약 + 날짜 + 스크린샷 경로).
6. 만들면서 발견한 아이디어 1~3개 Backlog에 `- [ ]` 로 추가.
7. `blocked` / `deferred` 표시된 항목은 이유 없이 건드리지 않기.
8. 다음 루프에서 자연스럽게 이어지도록 코드/스펙 정리.
9. **커밋**: `git add -A && git commit -m "loop N: <한 줄 요약>"` 루프 단위로 원자적으로.
10. **이 루프로 Done 카운트가 10의 배수에 도달했다면** `devlogs/` 작성 (아래 Devlog 섹션 참조).

## Verification (Playwright)
AppleScript 대신 Playwright 사용 — 크로스 플랫폼, 콘솔 에러 캡처, 스크린샷, DOM 평가 가능.

### 실행 명령
- `npm run test` — desktop + mobile 전부.
- `npm run test:desktop` — 빠른 iteration (1280×800 Chromium).
- `npm run test:mobile` — iPhone 14 viewport, 터치 시뮬레이션.
- `npm run test:headed` — 브라우저 띄워서 눈으로 확인하며 디버그.
- `npx playwright show-trace test-results/.../trace.zip` — 실패 시 타임트래블 디버깅.

### 루프 검수 체크리스트
매 구현 후 최소:
1. `npm run test:desktop` 통과 (기본 smoke 4개 + 새 기능 spec).
2. 새 기능이 시각·청각 변화라면 **새 spec을 `tests/`에 추가**하고 스크린샷 저장.
3. 스크린샷은 `specs/screenshots/<feature>.png` 로 저장, 파일 경로를 Done 엔트리에 남김.
4. 모바일에 영향 있는 변경이면 `npm run test:mobile`도 통과시켜야 Done.
5. 콘솔 에러 0 — `attachConsoleGuard(page)` 헬퍼가 잡음.

### 신규 spec 작성 패턴
```js
import { test, expect } from '@playwright/test';
test('feature X does Y', async ({ page }) => {
  const errors = attachConsoleGuard(page);
  await page.goto('/');
  // 상호작용 (키보드, 클릭, 터치)
  // DOM/스타일 검증 + 스크린샷
  expect(errors).toEqual([]);
});
```
`attachConsoleGuard`는 `tests/smoke.spec.js`에서 복붙하거나 공통 헬퍼로 추출.

### 검수 범위 가이드
- DOM 존재·개수 (`toHaveCount`, `toBeVisible`).
- CSS 상태 (shake 애니메이션, active 클래스 등).
- 캔버스 그려졌는지 (`canvas.width > 0` 같은 단순 체크).
- 오디오 동작 직접 검증은 어려움 — WebAudio 노드 수 / `audioCtx.state` 평가로 간접 확인 가능 (`page.evaluate`).
- 전체 스크린샷으로 회귀 감지 (픽셀 diff는 아직 안 함, 눈으로 확인).

## Devlog (10루프마다 작성)
사람(유저)에게 보고하는 느낌의 개발일지. 솔직하고 간결하게.

### 언제 쓰는가
- **Done 섹션 엔트리가 10개 늘어날 때마다** 한 번.
- 루프 번호가 10, 20, 30 … 에 도달하면 직후 iteration 끝에 작성.

### 어디에 쓰는가
`devlogs/YYYY-MM-DD-loops-N-to-M.md` — 예: `devlogs/2026-04-20-loops-1-to-10.md`.

### 무엇을 쓰는가
```md
# Devlog — YYYY-MM-DD (loops N–M)

## 이번 10루프에 한 일
- [루프 N] 항목명 — 한 줄 결과
- …

## 내 생각
이번 블록에서 무엇이 잘 흘러갔고 무엇이 뻐근했는지.
놀라운 발견이나 코드베이스에 대해 새로 알게 된 것.

## 느낌 / 퀄리티 셀프평가
이 10루프가 실제로 프로덕트를 얼마나 전진시켰는지 솔직하게.
바이럴/DJ/모바일 축 중 어디에 기여했는지 한 줄씩.

## 다음에 하고 싶은 것
다음 10루프에서 우선순위로 밀고 싶은 2~3가지 + 이유.
Backlog에 새로 넣은 항목이 있으면 언급.

## 메모
코드 구조·세팅·성능 등 다음 루프에서 참고할 사항.
```

### 작성 규칙
- 사람한테 보고하듯이 — 문어체·감정·발견을 담아서. 기계적인 리스트만 나열하지 않기.
- 날짜는 절대 날짜 (루프 완료 시점 기준).
- Done 엔트리를 그대로 복붙하지 말고, **묶어서 내러티브**로 — "시리즈 A는 A, B, C를 쳐냈다" 같은.
- 모르는 건 모른다고, 찝찝한 건 찝찝하다고 쓸 것. 다음 사람(미래의 Claude)을 위한 자료.
- 이후 이 파일 자체를 다음 루프에서 참고해서 방향 조정.

## Current state (baseline — 2026-04-17)
- Vite + vanilla JS (port 5174)
- 5개 key-mapped segments (ㅜ ㅣ ㅏ + bonus A/B) — 파형 드래그 튜닝, localStorage persist
- 24개 DJ effects, 9개 슬롯에 select로 매핑 (키 1–9), localStorage persist
- Hold-to-accelerate: 350ms→40ms 지수 감소 + 1초 이상 홀드 시 EDM drop
- 전체화면 FX: particles, rings, text burst, screen shake, 컬러별 batching + DPR 1.5 cap
- DJ 효과는 A 세그먼트 서브 버퍼를 소스로 사용 (A 튜닝하면 DJ 톤도 바뀜)
- 트리거 중복 방지: activeDjNodes Set으로 이전 재생 정지 후 새 재생
- A키 = oiiai cat GIF 랜덤 팝 (위치·크기·회전·애니메이션 3종 랜덤)
- **Playwright 검수 파이프라인**: desktop + mobile 프로젝트, smoke 4 spec 녹색

## Backlog

### Viral (공유·기록·전파)
- [ ] **Session recording**: 오디오(WebAudio → MediaRecorder) + 캔버스를 묶어 WebM/MP4로 녹화·다운로드.
- [ ] **URL-encoded presets**: 세그먼트·DJ 매핑을 URL에 인코딩 → "이 세팅 그대로 열기" 링크.
- [ ] **Replay mode**: 마지막 N초 키 입력 기록 → 재생 버튼으로 다시 트리거.
- [ ] **"Auto-beat" 버튼**: 랜덤 DJ 한방 + 자동 시퀀스로 15초짜리 히트 생성 (공유용 데모).
- [ ] **Session stats** 화면 끝에: 가장 많이 쓴 키, 총 drop 횟수 ("당신의 메인은 ㅣ입니다").

### DJ (프로가 쓸 만한 컨트롤)
- [ ] **BPM 락 + 퀀타이즈**: Tap-tempo 또는 입력값, STUTTER/GATE/ECHO 딜레이 시간을 BPM에 스냅.
- [ ] **Loop layer**: 현재 키 입력 시퀀스를 루프 레이어에 녹음 → 계속 반복, 그 위에 즉흥 연주.
- [ ] **MIDI input**: Web MIDI API로 물리 패드/키보드 바인딩.
- [ ] **FX dry/wet**: 각 DJ 슬롯 카드에 wet knob (마우스 휠 또는 슬라이더).
- [ ] **Velocity-like 강도**: 홀드 시간에 따라 drop뿐 아니라 일반 재생도 음색이 변하도록.
- [ ] **Crossfader**: clean buffer ↔ A sub-buffer 를 실시간 블렌드.

### Mobile & cross-device
- [ ] **터치 패드 레이아웃**: 하단에 큰 컬러 패드, multi-touch (`Touch.identifier` 추적).
- [ ] **Orientation-aware**: portrait = 하단 패드, landscape = 좌우 분리.
- [ ] **Haptic**: 터치 시 `navigator.vibrate(15)` 짧은 버즈.
- [ ] **PWA**: manifest + service worker, 홈 추가 가능.
- [ ] **iOS audio unlock**: 최초 터치에 `audioCtx.resume()` + 무음 버퍼로 wake (이미 부분 구현, 모바일 검증).
- [ ] **Wake lock**: 재생 중 화면 꺼짐 방지 (Screen Wake Lock API).

### Onboarding / polish
- [ ] **First-run tour**: 1회 한정 툴팁 3스텝 (키 눌러보기 → 홀드해보기 → 1키 DJ).
- [ ] **DJ 효과 툴팁**: 각 옵션에 한 줄 설명 (DISTORT = 찌그러진 하드클립, WUBWUB = 덥스텝 LFO …).
- [ ] **`?` 키 → 전체 단축키 오버레이**.
- [ ] **다크/라이트 테마 토글** (기본 다크 유지).

### Audio quality
- [ ] **Segment click 제거**: start/end에 5~10ms 페이드 인/아웃 envelope.
- [ ] **고배속 playback anti-alias**: CHIP/LASER에서 pre-lowpass 적용.

### 기존 기능 폴리싱
- [ ] **FPS 모니터 + 자동 품질 저감**: 50fps 아래 떨어지면 파티클 수 절반.
- [ ] **세그먼트 편집 undo** (Cmd/Ctrl+Z, 10단계).
- [ ] **파형 줌 인/아웃** (휠 + 드래그 팬).
- [ ] **DJ 효과 search/filter** select 위에 검색창.

## Done
- [x] **[2026-04-17] Loop 1 — "눌러서 시작" 초기 배너**: 자모 그라디언트 텍스트 + 펄스, 첫 키다운/클릭에 자동 dismiss. `specs/screenshots/smoke-desktop.png`
- [x] **[2026-04-17] Loop 2 — Master limiter**: `DynamicsCompressorNode`(threshold -8dB, ratio 6, knee 18) 마스터 체인. 모든 노드 라우팅을 `masterOut` 경유로 전환.

## Notes
- dev server: `npm run dev` → http://localhost:5174/
- 주요 파일: `src/main.js` (로직), `src/effects.js` (FX + cat spawner), `src/style.css`, `public/oiia.mp3`, `public/oia-uia.gif`.
- 테스트: `tests/smoke.spec.js`, config는 `playwright.config.js` — webServer가 Vite를 자동 기동/재사용.
- 스크린샷: `specs/screenshots/` (test-results는 일회성, specs/는 영구).
- 개발일지: `devlogs/` 10루프마다 누적.
- localStorage 키: `oiia-segments-v7`, `oiia-dj-mapping-v1`. 데이터 구조 바꾸면 버전 올릴 것.
- 새 feature는 기존 튜닝(사용자의 localStorage)을 파괴하지 말 것. 마이그레이션 또는 버전 올리기로 대응.
- Playwright 브라우저 재설치: `npx playwright install chromium`. CI 환경 추가 시 `--with-deps`.
