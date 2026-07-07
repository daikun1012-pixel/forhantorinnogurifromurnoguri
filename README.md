# 우리의 위시리스트 (Couple Place Wishlist)

두 사람을 위한 프라이빗 장소 위시리스트 웹앱. 가고 싶은 곳을 저장하고,
가고 싶은 마음·메모·우선순위를 남기고, 나중에 지도에서 확인합니다.

현재는 **목업 데이터**로만 동작합니다.

## 기술 스택
- React + Vite + TypeScript
- React Router
- Tailwind CSS
- Cloudflare Pages 배포 대응 구조 (`public/_redirects`)

## 스크립트
```bash
npm install
npm run dev        # 개발 서버
npm run build      # 타입체크 + 프로덕션 빌드
npm run preview    # 빌드 미리보기
npm run typecheck  # 타입 검사만
```

## 화면
- 로그인 (목업 로그인 버튼)
- 커플 초대 (초대 코드 · 참여 플로우)
- 위시리스트 목록 (카드 · 카테고리 필터)
- 장소 상세 모달 (반응 · 메모 · 댓글)
- 지도 (플레이스홀더 — 네이버 지도 추후 연동)

## 폴더 구조
```
src/
  components/   재사용 UI
  data/         목업 데이터
  layouts/      앱 레이아웃 (하단 탭)
  lib/          스토어 · 포맷 유틸
  pages/        페이지
  types/        핵심 타입
```

## Cloudflare D1

프론트엔드는 아직 목업 데이터로 동작하지만, D1 스키마 기반이 준비되어 있습니다.

- 바인딩 이름: `DB` (`wrangler.toml`)
- 런타임 접근: Pages Functions 내부에서 `env.DB`
- 타입: `functions/types.ts`의 `Env` 인터페이스
- 마이그레이션: `migrations/` (SQLite)

### 초기 설정
```bash
# 1) D1 데이터베이스 생성 (최초 1회)
npx wrangler d1 create couple-place-wishlist
#    출력된 database_id 를 wrangler.toml 의 database_id 에 붙여넣기

# 2) 마이그레이션 적용
npm run db:migrate:local    # 로컬(.wrangler) DB에 적용
npm run db:migrate:remote   # 원격 D1에 적용

# 새 마이그레이션 추가
npx wrangler d1 migrations create DB <name>
```

스키마 요약: `users`, `couples`, `couple_members`, `places`,
`place_reactions`, `place_comments` (외래키 · 인덱스 포함).
시드 데이터(`0002_seed.sql`): `user_daiki`, `user_partner`, `couple_demo`.

### Pages D1 바인딩
Cloudflare Pages 프로젝트 설정 → Functions → D1 database bindings 에서
변수 이름 `DB` 로 D1 데이터베이스를 연결하세요. 런타임에서는 `env.DB` 로
접근합니다 (`functions/types.ts`의 `Env`).

## API (Cloudflare Pages Functions)

임시 목업 인증 사용: `currentUserId = user_daiki`,
`currentCoupleId = couple_demo`. 응답 형식은 `{ ok, data }` 또는
`{ ok, error }`. **프론트엔드는 아직 이 API에 연결되어 있지 않습니다
(계속 목업 데이터로 동작).**

| Method | Path | 설명 |
| ------ | ---- | ---- |
| GET | `/api/health` | 헬스 체크 |
| GET | `/api/places` | 커플의 장소 목록 |
| POST | `/api/places` | 장소 추가 |
| GET | `/api/places/:placeId` | 장소 + 반응 + 댓글 |
| PATCH | `/api/places/:placeId` | 장소 수정 |
| DELETE | `/api/places/:placeId` | 장소 삭제 |
| PUT | `/api/places/:placeId/reaction` | 내 반응 upsert |
| GET | `/api/places/:placeId/comments` | 댓글 목록 |
| POST | `/api/places/:placeId/comments` | 댓글 추가 |
| DELETE | `/api/comments/:commentId` | 댓글 삭제 |

로컬에서 Functions + D1 실행:
```bash
npm run build
npx wrangler pages dev dist --d1 DB
```

## 아직 구현하지 않은 것 (의도적)
Cloudflare Workers API 라우트, 네이버 지도·지역검색, 실제 인증,
AI 추천, 사진 업로드.
