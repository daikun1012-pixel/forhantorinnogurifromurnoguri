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

## 아직 구현하지 않은 것 (의도적)
Cloudflare D1 / Workers API, 네이버 지도·지역검색, 실제 인증,
AI 추천, 사진 업로드.
