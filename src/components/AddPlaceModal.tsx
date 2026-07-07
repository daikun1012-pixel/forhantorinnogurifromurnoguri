import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { categoryEmoji, categoryLabels, categoryList } from "@/lib/format";
import type { PlaceCategory, PlaceWithReactions } from "@/types";
import { Modal } from "./Modal";

export function AddPlaceModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (place: PlaceWithReactions) => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<PlaceCategory>("cafe");
  const [address, setAddress] = useState("");
  const [mapUrl, setMapUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("장소 이름을 입력해 주세요");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const place = await api.createPlace({
        name: name.trim(),
        category,
        address: address.trim(),
        mapUrl: mapUrl.trim(),
      });
      onCreated(place);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "저장에 실패했습니다");
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <h2 className="mb-4 text-lg font-bold text-zinc-800">장소 추가</h2>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">장소 이름</label>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예) 연남동 감성 카페"
            autoFocus
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

        <div>
          <label className="label">주소 (선택)</label>
          <input
            className="input"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="예) 서울 마포구 연남동"
          />
        </div>

        <div>
          <label className="label">지도 링크 (선택)</label>
          <input
            className="input"
            value={mapUrl}
            onChange={(e) => setMapUrl(e.target.value)}
            placeholder="네이버/카카오 지도 링크"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

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
