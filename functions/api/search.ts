import type { Env } from "../types";
import { HttpError, handle, success } from "../_lib/http";
import { requireUser } from "../_lib/session";
import type { PlaceCategory } from "../../src/types";

interface NaverLocalItem {
  title: string;
  category: string;
  address: string;
  roadAddress: string;
  link: string;
  mapx: string;
  mapy: string;
}

function stripTags(s: string): string {
  return s.replace(/<[^>]*>/g, "").trim();
}

function guessCategory(naverCategory: string): PlaceCategory {
  const c = naverCategory;
  if (/카페|커피|디저트|베이커리|빵/.test(c)) return "cafe";
  if (/음식점|한식|일식|중식|양식|분식|치킨|고기|식당|맛집|술집|주점/.test(c))
    return "restaurant";
  if (/전시|미술관|박물관|갤러리|공연|영화/.test(c)) return "exhibition";
  if (/공원|산|둘레길|산책|해수욕장|하천/.test(c)) return "walk";
  if (/숙박|호텔|펜션|리조트|여행|관광/.test(c)) return "travel";
  if (/쇼핑|백화점|마트|아울렛|소품|편집샵/.test(c)) return "shopping";
  return "etc";
}

// GET /api/search?query=... — proxy Naver Local Search (keeps secret server-side).
export const onRequestGet: PagesFunction<Env> = ({ env, request }) =>
  handle(async () => {
    await requireUser(env, request);

    const clientId = env.NAVER_SEARCH_CLIENT_ID;
    const clientSecret = env.NAVER_SEARCH_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      throw new HttpError("장소 검색이 설정되지 않았습니다", 503);
    }

    const query = new URL(request.url).searchParams.get("query")?.trim();
    if (!query) throw new HttpError("검색어를 입력해 주세요", 422);

    const naverUrl = new URL("https://openapi.naver.com/v1/search/local.json");
    naverUrl.searchParams.set("query", query);
    naverUrl.searchParams.set("display", "5");
    naverUrl.searchParams.set("sort", "random");

    const res = await fetch(naverUrl.toString(), {
      headers: {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret,
      },
    });
    if (!res.ok) {
      throw new HttpError("네이버 검색에 실패했습니다", 502);
    }
    const data = (await res.json()) as { items?: NaverLocalItem[] };

    const results = (data.items ?? []).map((it) => {
      const lng = Number(it.mapx) / 1e7;
      const lat = Number(it.mapy) / 1e7;
      return {
        name: stripTags(it.title),
        category: guessCategory(it.category),
        naverCategory: it.category,
        address: it.roadAddress || it.address,
        mapUrl: it.link || "",
        latitude: Number.isFinite(lat) ? lat : null,
        longitude: Number.isFinite(lng) ? lng : null,
      };
    });

    return success(results);
  });
