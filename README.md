# 우리 데이트 위시리스트

커플이 함께 가고 싶은 장소를 저장하고, 서로의 "가고 싶어" 반응과 메모·댓글을
모아 다음 데이트 장소를 쉽게 정하는 프라이빗 웹앱. **Cloudflare Pages +
D1** 로 실제 동작합니다.

## 기술 스택
- React + Vite + TypeScript + React Router + Tailwind CSS
- Cloudflare Pages Functions (`functions/`) + D1 (바인딩 이름 `DB`)

## 주요 기능 (MVP)
- 이름 기반 간편 로그인 (localStorage 세션)
- 커플 공간 생성 / 초대코드로 참여 (최대 2명)
- 장소 추가 · 목록 · 상세
- 각자 "가고 싶어" 체크 · 우선순위 · 메모
- 둘 다 가고 싶은 곳만 모아보기 / 다녀온 곳 숨기기
- 장소별 댓글
- 방문 완료 표시
- 지도 자리(플레이스홀더)

## 개발
```bash
npm install
npm run dev        # 프론트엔드 개발 서버 (API는 배포 환경/wrangler 필요)
npm run typecheck  # 앱 + functions 타입 검사
npm run build      # 타입체크 + 프로덕션 빌드
```

Functions + D1 을 로컬에서 함께 실행:
```bash
npm run build
npx wrangler pages dev dist --d1 DB
```

## D1 / 데이터베이스
- 바인딩 이름: `DB` (Cloudflare Pages → Settings → Functions → D1 bindings)
- 런타임 접근: `env.DB` (`functions/types.ts` 의 `Env`)
- 스키마는 **첫 요청 시 자동 생성**됩니다(`functions/_lib/db.ts`, idempotent).
  별도의 수동 마이그레이션 없이 배포 후 바로 동작합니다.
- 동일 DDL 이 `migrations/0001_init.sql` 에도 있어 원하면 wrangler 로 적용 가능:
  ```bash
  # wrangler.toml 의 database_id 를 채운 뒤
  npm run db:migrate:local    # 로컬
  npm run db:migrate:remote   # 원격
  ```

테이블: `users`, `couples`, `couple_members`, `places`,
`place_reactions`, `place_comments`.

## API (Pages Functions)
임시 인증: 클라이언트가 `X-User-Id` 헤더로 사용자 식별(실제 인증 아님).
응답 형식은 `{ ok, data }` 또는 `{ ok, error }`.

| Method | Path | 설명 |
| ------ | ---- | ---- |
| GET | `/api/health` | 헬스 체크 |
| GET | `/api/config` | 프론트 공개 설정(지도 client id 등) |
| GET | `/api/search?query=` | 네이버 장소 검색 프록시 |
| POST | `/api/auth/login` | 이름으로 사용자 생성 |
| GET | `/api/me` | 현재 사용자·커플·멤버 |
| POST | `/api/couples` | 커플 공간 생성 |
| POST | `/api/couples/join` | 초대코드로 참여 |
| GET | `/api/places` | 장소 목록(+반응) |
| POST | `/api/places` | 장소 추가 |
| GET | `/api/places/:id` | 장소 상세(+반응·댓글) |
| PATCH | `/api/places/:id` | 장소 수정 |
| DELETE | `/api/places/:id` | 장소 삭제 |
| PUT | `/api/places/:id/reaction` | 내 반응 저장(upsert) |
| GET | `/api/places/:id/comments` | 댓글 목록 |
| POST | `/api/places/:id/comments` | 댓글 추가 |
| DELETE | `/api/comments/:id` | 댓글 삭제 |

## 네이버 지도 / 장소검색 설정

지도와 장소검색은 아래 환경 변수가 설정되면 자동으로 켜집니다(없으면 앱은
정상 동작하고 해당 기능만 안내 문구로 대체). Cloudflare Pages →
Settings → **Environment variables** 에서 **Production/Preview 각각** 등록:

| 변수 | 용도 | 발급처 | 비고 |
| ---- | ---- | ------ | ---- |
| `NAVER_MAP_CLIENT_ID` | 지도 표시 | 네이버 클라우드 플랫폼(NCP) → Maps | 공개값 |
| `NAVER_MAP_KEY_PARAM` | 스크립트 파라미터명 | — | 선택. 기본 `ncpClientId`, 신규 키면 `ncpKeyId` |
| `NAVER_SEARCH_CLIENT_ID` | 장소검색 | 네이버 개발자센터(Developers) → 검색 API | |
| `NAVER_SEARCH_CLIENT_SECRET` | 장소검색 | 위와 동일 | **Secret 으로 등록** |

추가 설정:
- **NCP Maps**: Web 서비스 URL 화이트리스트에 배포 도메인(`*.pages.dev`,
  커스텀 도메인)을 등록해야 지도가 로드됩니다.
- **검색 API**: 애플리케이션에서 "검색" 사용 설정.
- 검색 결과의 좌표(`mapx`/`mapy`, WGS84×10⁷)는 서버에서 위·경도로 변환해
  장소에 저장하고 지도 마커로 표시합니다.

변수 저장 후 재배포하면 적용됩니다.

## 이후 확장
데이트 코스 만들기, 날짜별 계획, 사진 첨부, 방문 기록, AI 추천 등.
