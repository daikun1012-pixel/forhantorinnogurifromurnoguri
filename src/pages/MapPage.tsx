import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { useSession } from "@/lib/session";
import { loadNaverMaps } from "@/lib/naver";
import { categoryEmoji, categoryLabels, categoryList, naverMapUrl } from "@/lib/format";
import { PlaceDetailModal } from "@/components/PlaceDetailModal";
import { EmptyState, ErrorState, Spinner } from "@/components/ui";
import type { PlaceCategory, PlaceWithReactions } from "@/types";

const CATEGORY_COLORS: Record<string, string> = {
  cafe: "#a16207",
  restaurant: "#f97316",
  exhibition: "#8b5cf6",
  walk: "#22c55e",
  travel: "#3b82f6",
  shopping: "#ec4899",
  etc: "#fb7185",
};

function MapChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`chip shrink-0 ring-1 ${
        active
          ? "bg-blush-400 text-white ring-blush-400"
          : "bg-white text-zinc-500 ring-blush-100"
      }`}
    >
      {children}
    </button>
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function MapPage() {
  const { session, config } = useSession();
  const members = session?.members ?? [];
  const currentUserId = session?.user.id ?? "";

  const [places, setPlaces] = useState<PlaceWithReactions[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [cat, setCat] = useState<"all" | PlaceCategory>("all");
  const [onlyBoth, setOnlyBoth] = useState(false);
  const [hideVisited, setHideVisited] = useState(false);

  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoRef = useRef<any>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setPlaces(await api.listPlaces());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "불러오지 못했습니다");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const hasKey = Boolean(config?.naverMapClientId);

  // Apply the filter chips to both the markers and the list below.
  const filtered = useMemo(() => {
    if (!places) return null;
    return places.filter((p) => {
      if (cat !== "all" && p.category !== cat) return false;
      const wanters = p.reactions
        .filter((r) => r.wantToGo)
        .map((r) => r.userId);
      const bothWant =
        members.length === 2 && members.every((m) => wanters.includes(m.userId));
      if (onlyBoth && !bothWant) return false;
      const visited =
        p.reactions.length > 0 && p.reactions.every((r) => r.visited);
      if (hideVisited && visited) return false;
      return true;
    });
  }, [places, cat, onlyBoth, hideVisited, members]);

  const located = (filtered ?? []).filter(
    (p) => p.latitude != null && p.longitude != null,
  );

  // Initialise / update the Naver map.
  useEffect(() => {
    if (!hasKey || !config || !mapEl.current || !filtered) return;
    let cancelled = false;
    const located = filtered.filter(
      (p) => p.latitude != null && p.longitude != null,
    );

    loadNaverMaps(config.naverMapClientId, config.naverMapKeyParam)
      .then((naver) => {
        if (cancelled || !mapEl.current) return;

        const center =
          located.length > 0
            ? new naver.maps.LatLng(located[0].latitude, located[0].longitude)
            : new naver.maps.LatLng(37.5665, 126.978); // Seoul

        if (!mapRef.current) {
          mapRef.current = new naver.maps.Map(mapEl.current, {
            center,
            zoom: 12,
          });
        }

        markersRef.current.forEach((m) => m.setMap(null));
        markersRef.current = [];
        if (!infoRef.current) {
          infoRef.current = new naver.maps.InfoWindow({ content: "" });
        }

        const bounds =
          located.length > 0 ? new naver.maps.LatLngBounds() : null;
        located.forEach((p) => {
          const pos = new naver.maps.LatLng(p.latitude, p.longitude);
          const marker = new naver.maps.Marker({
            position: pos,
            map: mapRef.current,
            title: p.name,
            icon: {
              content: `<div style="display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.25))">
                  <div style="width:34px;height:34px;border-radius:50%;background:#fff;border:2.5px solid ${
                    CATEGORY_COLORS[p.category] ?? "#fb7185"
                  };display:flex;align-items:center;justify-content:center;font-size:17px">${
                    categoryEmoji[p.category]
                  }</div>
                  <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid ${
                    CATEGORY_COLORS[p.category] ?? "#fb7185"
                  };margin-top:-1px"></div>
                </div>`,
              anchor: new naver.maps.Point(17, 42),
            },
          });
          naver.maps.Event.addListener(marker, "click", () => {
            const url = naverMapUrl(p);
            infoRef.current.setContent(
              `<div style="padding:10px 12px;max-width:220px;font-size:13px;line-height:1.5">
                 <div style="font-weight:700;color:#27272a;margin-bottom:6px">${escapeHtml(
                   p.name,
                 )}</div>
                 <a href="${url}" target="_blank" rel="noreferrer" style="color:#f43f5e;font-weight:600;text-decoration:none">🗺️ 길찾기</a>
                 <span style="color:#d4d4d8"> · </span>
                 <a href="#" id="iw-detail-${p.id}" style="color:#71717a;text-decoration:none">상세</a>
               </div>`,
            );
            infoRef.current.open(mapRef.current, marker);
            setTimeout(() => {
              const el = document.getElementById(`iw-detail-${p.id}`);
              if (el) {
                el.onclick = (e) => {
                  e.preventDefault();
                  infoRef.current.close();
                  setOpenId(p.id);
                };
              }
            }, 0);
          });
          markersRef.current.push(marker);
          bounds?.extend(pos);
        });
        if (bounds && located.length > 1) mapRef.current.fitBounds(bounds);
        else mapRef.current.setCenter(center);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setMapError(err instanceof Error ? err.message : "지도 로드 실패");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [hasKey, config, filtered]);

  return (
    <div>
      <h1 className="mb-3 text-xl font-bold text-zinc-800">지도</h1>

      {/* Filters */}
      <div className="-mx-4 mb-2 flex gap-2 overflow-x-auto px-4 pb-1">
        <MapChip active={cat === "all"} onClick={() => setCat("all")}>
          전체
        </MapChip>
        {categoryList.map((c) => (
          <MapChip key={c} active={cat === c} onClick={() => setCat(c)}>
            {categoryEmoji[c]} {categoryLabels[c]}
          </MapChip>
        ))}
      </div>
      <div className="mb-3 flex gap-2">
        <MapChip active={onlyBoth} onClick={() => setOnlyBoth((v) => !v)}>
          💞 둘 다 가고 싶어
        </MapChip>
        <MapChip active={hideVisited} onClick={() => setHideVisited((v) => !v)}>
          다녀온 곳 숨기기
        </MapChip>
      </div>

      {!hasKey ? (
        <MapPlaceholder />
      ) : mapError ? (
        <ErrorState message={mapError} />
      ) : (
        <div
          ref={mapEl}
          className="relative isolate h-72 w-full overflow-hidden rounded-3xl ring-1 ring-blush-100"
        />
      )}

      <div className="mt-4">
        {error ? (
          <ErrorState message={error} onRetry={load} />
        ) : !filtered ? (
          <Spinner />
        ) : filtered.length === 0 ? (
          <EmptyState
            emoji="📍"
            title={
              (places?.length ?? 0) === 0
                ? "아직 저장된 장소가 없어요"
                : "조건에 맞는 곳이 없어요"
            }
          />
        ) : (
          <>
            <h3 className="mb-2 text-sm font-semibold text-zinc-500">
              장소 {filtered.length} · 지도 표시 {located.length}
            </h3>
            <div className="space-y-2">
              {filtered.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setOpenId(p.id)}
                  className="flex w-full items-center gap-3 rounded-2xl bg-white px-3 py-2.5 text-left ring-1 ring-blush-50 hover:ring-blush-200"
                >
                  <span className="text-lg">{categoryEmoji[p.category]}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-zinc-700">
                      {p.name}
                    </div>
                    {p.address && (
                      <div className="truncate text-xs text-zinc-400">
                        {p.address}
                      </div>
                    )}
                  </div>
                  {p.latitude == null && (
                    <span className="chip bg-zinc-50 text-zinc-400">좌표 없음</span>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {openId && (
        <PlaceDetailModal
          placeId={openId}
          members={members}
          currentUserId={currentUserId}
          onClose={() => setOpenId(null)}
          onChanged={load}
        />
      )}
    </div>
  );
}

function MapPlaceholder() {
  return (
    <div className="overflow-hidden rounded-3xl ring-1 ring-blush-100">
      <div
        className="flex h-64 flex-col items-center justify-center bg-blush-50 text-center"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, rgba(253,164,179,0.25) 0, transparent 40%), radial-gradient(circle at 80% 70%, rgba(96,165,250,0.2) 0, transparent 40%)",
        }}
      >
        <div className="text-5xl">🗺️</div>
        <h2 className="mt-3 text-base font-semibold text-zinc-700">
          지도를 사용하려면 설정이 필요해요
        </h2>
        <p className="mt-1 max-w-xs px-6 text-sm text-zinc-400">
          네이버 지도 Client ID가 아직 설정되지 않았습니다. 설정되면 저장된
          장소가 지도에 표시됩니다.
        </p>
      </div>
    </div>
  );
}
