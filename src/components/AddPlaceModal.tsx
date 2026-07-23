import { useState } from "react";
import { api, ApiError, type SearchResult } from "@/lib/api";
import { useSession } from "@/lib/session";
import {
  categoryEmoji,
  categoryLabels,
  categoryList,
  isExperience,
} from "@/lib/format";
import type { PlaceCategory, PlaceWithReactions } from "@/types";
import { Modal } from "./Modal";

export function AddPlaceModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (place: PlaceWithReactions) => void;
}) {
  const { config } = useSession();
  const searchEnabled = config?.searchEnabled ?? false;

  const [name, setName] = useState("");
  const [category, setCategory] = useState<PlaceCategory>("cafe");
  const [address, setAddress] = useState("");
  const [mapUrl, setMapUrl] = useState("");
  const [coords, setCoords] = useState<{ lat: number | null; lng: number | null }>(
    { lat: null, lng: null },
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dupMsg, setDupMsg] = useState<string | null>(null);

  // Naver search state.
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const runSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setSearchError(null);
    try {
      setResults(await api.search(query.trim()));
    } catch (err) {
      setSearchError(err instanceof ApiError ? err.message : "검색 실패");
      setResults(null);
    } finally {
      setSearching(false);
    }
  };

  const pick = (r: SearchResult) => {
    setName(r.name);
    setCategory(r.category as PlaceCategory);
    setAddress(r.address);
    setMapUrl(r.mapUrl);
    setCoords({ lat: r.latitude, lng: r.longitude });
    setResults(null);
    setQuery("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("장소 이름을 입력해 주세요");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const exp = isExperience(category);
      const place = await api.createPlace({
        name: name.trim(),
        category,
        address: exp ? "" : address.trim(),
        mapUrl: mapUrl.trim(),
        latitude: exp ? null : coords.lat,
        longitude: exp ? null : coords.lng,
      });
      if (place.duplicate) {
        setDupMsg(
          "이미 등록된 곳이에요! 내 '가고 싶어'로 표시해 두 사람의 후보로 매칭했어요 💞",
        );
        onCreated(place);
        setTimeout(onClose, 1600);
        return;
      }
      onCreated(place);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "저장에 실패했습니다");
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <h2 className="mb-4 text-lg font-bold text-zinc-800">위시 추가</h2>

      {/* Naver place search (location-bound wishes only) */}
      {searchEnabled && !isExperience(category) && (
        <div className="mb-4 rounded-2xl bg-blush-50/60 p-3">
          <form onSubmit={runSearch} className="flex gap-2">
            <input
              className="input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="🔍 네이버로 장소 검색 (예: 연남동 카페)"
            />
            <button
              type="submit"
              disabled={searching}
              className="btn-primary shrink-0 px-4 py-2"
            >
              {searching ? "…" : "검색"}
            </button>
          </form>
          {searchError && (
            <p className="mt-2 text-sm text-red-500">{searchError}</p>
          )}
          {results && (
            <div className="mt-2 space-y-1.5">
              {results.length === 0 && (
                <p className="text-sm text-zinc-400">검색 결과가 없어요</p>
              )}
              {results.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => pick(r)}
                  className="block w-full rounded-xl bg-white px-3 py-2 text-left ring-1 ring-blush-50 hover:ring-blush-200"
                >
                  <div className="text-sm font-semibold text-zinc-800">
                    {categoryEmoji[r.category as PlaceCategory]} {r.name}
                  </div>
                  <div className="truncate text-xs text-zinc-400">
                    {r.address}
                  </div>
                </button>
              ))}
            </div>
          )}
          <p className="mt-2 text-[11px] text-zinc-400">
            검색 결과를 선택하면 아래 항목이 자동으로 채워지고 지도에 표시돼요.
          </p>
        </div>
      )}

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">
            {isExperience(category) ? "이름" : "장소 이름"}
          </label>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={
              isExperience(category)
                ? "예) 영화 <듄3> 같이 보기, 딸기 케이크 맛보기"
                : "예) 연남동 감성 카페"
            }
          />
        </div>

        <div>
          <label className="label">카테고리</label>
          <div className="flex flex-wrap gap-2">
            {categoryList.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`chip ring-1 ${
                  category === c
                    ? "bg-blush-400 text-white ring-blush-400"
                    : "bg-white text-zinc-500 ring-blush-100"
                }`}
              >
                {categoryEmoji[c]} {categoryLabels[c]}
              </button>
            ))}
          </div>
        </div>

        {!isExperience(category) && (
          <div>
            <label className="label">주소 (선택)</label>
            <input
              className="input"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="예) 서울 마포구 연남동"
            />
          </div>
        )}

        <div>
          <label className="label">정보 링크 (사이트·블로그, 선택)</label>
          <input
            className="input"
            value={mapUrl}
            onChange={(e) => setMapUrl(e.target.value)}
            placeholder={
              isExperience(category)
                ? "예고편·리뷰 등 참고 링크"
                : "블로그·홈페이지 등 참고 링크"
            }
          />
          {!isExperience(category) && (
            <p className="mt-1 text-[11px] text-zinc-400">
              길찾기는 상세 화면의 "네이버 지도" 버튼으로 열 수 있어요.
            </p>
          )}
        </div>

        {coords.lat != null && coords.lng != null && (
          <p className="text-xs text-emerald-600">
            📍 좌표 저장됨 · 지도에 표시됩니다
          </p>
        )}
        {error && <p className="text-sm text-red-500">{error}</p>}
        {dupMsg && (
          <p className="rounded-2xl bg-blush-50 px-3 py-2 text-sm font-medium text-blush-500">
            {dupMsg}
          </p>
        )}

        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-ghost flex-1">
            취소
          </button>
          <button type="submit" disabled={saving} className="btn-primary flex-1">
            {saving ? "저장 중…" : "저장"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
