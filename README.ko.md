# Oiiai Keyboard

[🇺🇸 English README](./README.md)

![Oiiai Keyboard](./public/og.png)

> 세상에 전하는 안부: 폐업 1년 후, 잘 지내고 있습니다.
> AI와 같이 즐기며 만든 장난감입니다.

**라이브 → [oiia.velopert.com](https://oiia.velopert.com)**

---

Oiiai Keyboard는 바이럴 밈 *oiiai 고양이*를 가지고 만든 브라우저 기반 뮤지컬 토이입니다. 키보드를 두드리면 음절이 터지고, DJ 이펙트가 쏘고, 화면 여기저기로 고양이가 흩뿌려집니다. 키보드를 작은 DJ 패드로 바꿔놓은 듯한 물건 — 60개 넘는 DJ 이펙트, BPM 퀀타이즈, 세션 녹화, 프리셋 공유, 그리고 누를 때마다 터지는 고양이 불꽃놀이.

## 기능

- **샘플 키 7개** — `o` / `i` / `a` (짧은 음절) + `q` / `w` / `e` / `r` (긴 샘플, 각각 다른 고양이 연출)
- **DJ 슬롯 9개** (1–9) — 60개 이상의 오디오 이펙트 중에서 고르기: distort, vinyl, siren, reverb, chop, drumroll, sub drop, granular, …
- **Tap-tempo BPM** + 16분음표 기준 FX 퀀타이즈
- **Loop layer** — 연주를 녹음해서 배경에 깔고, 그 위에 live 연주
- **원클릭 Make Clip** — ~10초짜리 WebM 비디오로 FX 캔버스 + 오디오를 함께 저장
- **공유 가능한 URL 프리셋** — BPM + DJ 매핑 + 세그먼트 튜닝을 해시에 인코딩
- **모바일 우선 DJ 패드 모드** — 3×3 그리드, 터치 최적화, 페이지 스크롤 잠금
- **Advanced 모드** — 파형 세그먼트 편집, 슬롯별 볼륨, 마스터 리미터, 프리셋 갤러리
- **다크 / 라이트 테마**, **한글 / 영문 전환**, 키보드 접근성, `prefers-reduced-motion` 대응

## Claude Code가 `/loop` 방식으로 만든 프로젝트

이 앱은 전부 **[Claude Code](https://www.anthropic.com/claude-code)** 가 자율 **`/loop` 모드**로 작성했습니다. Claude가 130번의 루프를 돌면서, 매 루프마다 눈에 보이는 작고 끝난 변화 하나를 남깁니다. 사람(저)은 짧은 한 줄 피드백으로 방향만 잡고, Claude가 구현 → Playwright 검증 → 커밋 → 다음 루프로 이어가는 구조.

전체 개발 기록은 **[oiia.velopert.com/blog](https://oiia.velopert.com/blog)** 에서 읽을 수 있습니다 — 프롤로그, 9개 루프 블록, 에필로그까지 총 11편. 한국어/영어 동시 제공. 특히 에필로그("130 루프 끝에서")는 이 작업 방식의 한계에 대한 Claude의 회고라서 한 번 읽어볼 만합니다.

## 스택

- **Vite** + 바닐라 JS — 프레임워크 없음
- **Web Audio API** 로 모든 합성 · 이펙트 · 녹음
- **Canvas** 로 시각 FX
- **Playwright** 로 E2E 회귀 테스트 (데스크탑 + 모바일 뷰포트)
- **Cloudflare Pages** 로 호스팅
- 개발일지용 정적 블로그 빌더 (`scripts/build-blog.js`)

## 개발

```bash
npm install
npm run dev          # http://localhost:5174
npm run build        # 블로그 + 앱 → dist/
npm run build:blog   # 블로그만 → public/blog/
npm run test         # Playwright 회귀
```

## 배포

```bash
npm run build
npx wrangler pages deploy dist --project-name oiiai --branch main
```

`.env`에 `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` 필요.

## 크레딧

- **Oiiai Cat** — 인터넷
- **Human** — 방향 지시, 피드백, 큐레이션, 배포, 그리고 고양이 GIF 튜닝
- **Claude Code (Opus 4.7, 1M context)** — 코드 작성, 한 번에 한 루프씩

## 라이선스

MIT. 고양이는 제 것이 아닙니다.
