import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import {
  categoryEmoji,
  categoryLabels,
  categoryList,
  doneLabel,
  formatDateTime,
  isExperience,
  naverMapUrl,
  priorityClasses,
  priorityLabels,
  wantLabel,
} from "@/lib/format";
import type {
  CoupleMember,
  PlaceCategory,
  PlaceComment,
  PlaceDetail,
  PlaceReaction,
  Priority,
} from "@/types";
import { Modal } from "./Modal";
import { Avatar, ErrorState, Spinner } from "./ui";
import { VisitPhotos } from "./VisitPhotos";

const PRIORITIES: Priority[] = ["low", "medium", "high"];

export function PlaceDetailModal({
  placeId,
  members,
  currentUserId,
  onClose,
  onChanged,
}: {
  placeId: string;
  members: CoupleMember[];
  currentUserId: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [detail, setDetail] = useState<PlaceDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setDetail(await api.getPlace(placeId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "불러오지 못했습니다");
    }
  }, [placeId]);

  useEffect(() => {
    void load();
  }, [load]);

  const memberName = (userId: string) =>
    members.find((m) => m.userId === userId)?.user.name ?? "알 수 없음";
  const memberColor = (userId: string) =>
    members.find((m) => m.userId === userId)?.user.avatarColor ?? "#a1a1aa";

  return (
    <Modal onClose={onClose}>
      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !detail ? (
        <Spinner label="불러오는 중…" />
      ) : (
        <DetailBody
          detail={detail}
          members={members}
          currentUserId={currentUserId}
          memberName={memberName}
          memberColor={memberColor}
          onClose={onClose}
          reload={load}
          onChanged={onChanged}
        />
      )}
    </Modal>
  );
}

function DetailBody({
  detail,
  members,
  currentUserId,
  memberName,
  memberColor,
  onClose,
  reload,
  onChanged,
}: {
  detail: PlaceDetail;
  members: CoupleMember[];
  currentUserId: string;
  memberName: (id: string) => string;
  memberColor: (id: string) => string;
  onClose: () => void;
  reload: () => Promise<void>;
  onChanged: () => void;
}) {
  const mine = detail.reactions.find((r) => r.userId === currentUserId);
  const partnerReactions = detail.reactions.filter(
    (r) => r.userId !== currentUserId,
  );
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <EditPlaceForm
        detail={detail}
        onCancel={() => setEditing(false)}
        onSaved={async () => {
          setEditing(false);
          await reload();
          onChanged();
        }}
      />
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="chip bg-blush-50 text-blush-500">
            {categoryEmoji[detail.category]} {categoryLabels[detail.category]}
          </span>
          <h2 className="mt-2 text-xl font-bold text-zinc-800">{detail.name}</h2>
          {detail.address && (
            <p className="mt-1 text-sm text-zinc-500">{detail.address}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-white p-2 text-zinc-400 ring-1 ring-blush-50"
          aria-label="닫기"
        >
          ✕
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {!isExperience(detail.category) && (
          <a
            href={naverMapUrl(detail)}
            target="_blank"
            rel="noreferrer"
            className="btn-primary px-3 py-2 text-sm"
          >
            🗺️ 네이버 지도 · 길찾기
          </a>
        )}
        {detail.mapUrl && (
          <a
            href={detail.mapUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-ghost px-3 py-2 text-sm"
          >
            🔗 정보 링크
          </a>
        )}
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="btn-soft px-3 py-2 text-sm"
        >
          ✏️ 정보 수정
        </button>
      </div>

      {/* Partner reaction */}
      <section className="mt-5">
        <h3 className="mb-2 text-sm font-semibold text-zinc-500">상대방의 반응</h3>
        {partnerReactions.length === 0 ? (
          <p className="rounded-2xl bg-white px-3 py-3 text-sm text-zinc-300 ring-1 ring-blush-50">
            아직 반응이 없어요
          </p>
        ) : (
          partnerReactions.map((r) => (
            <ReactionView
              key={r.id}
              reaction={r}
              category={detail.category}
              name={memberName(r.userId)}
              color={memberColor(r.userId)}
            />
          ))
        )}
      </section>

      {/* My reaction editor */}
      <section className="mt-5">
        <h3 className="mb-2 text-sm font-semibold text-zinc-500">내 반응</h3>
        <MyReactionEditor
          placeId={detail.id}
          category={detail.category}
          reaction={mine}
          onSaved={async () => {
            await reload();
            onChanged();
          }}
        />
      </section>

      {/* Visits */}
      <VisitsSection
        detail={detail}
        currentUserId={currentUserId}
        memberName={memberName}
        reload={async () => {
          await reload();
          onChanged();
        }}
      />

      {/* Comments */}
      <CommentsSection
        detail={detail}
        currentUserId={currentUserId}
        memberName={memberName}
        memberColor={memberColor}
        reload={reload}
      />

      {/* Danger */}
      <DeletePlace
        placeId={detail.id}
        canDelete={detail.createdBy === currentUserId}
        onDeleted={() => {
          onChanged();
          onClose();
        }}
      />
      <p className="mt-4 text-center text-[11px] text-zinc-300">
        {members.length}명이 이 공간을 함께 쓰고 있어요
      </p>
    </div>
  );
}

function ReactionView({
  reaction,
  category,
  name,
  color,
}: {
  reaction: PlaceReaction;
  category: PlaceCategory;
  name: string;
  color: string;
}) {
  return (
    <div className="card mb-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar name={name} color={color} />
          <span className="font-semibold text-zinc-700">{name}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="chip bg-blush-50 text-blush-500">
            {reaction.wantToGo ? `💖 ${wantLabel(category)}` : "🤍 글쎄"}
          </span>
          <span className={`chip ${priorityClasses[reaction.priority]}`}>
            {priorityLabels[reaction.priority]}
          </span>
          {reaction.visited && (
            <span className="chip bg-emerald-50 text-emerald-600">
              ✓ {doneLabel(category)}
            </span>
          )}
        </div>
      </div>
      {reaction.memo && (
        <p className="mt-2 rounded-2xl bg-blush-50/60 px-3 py-2 text-sm text-zinc-600">
          {reaction.memo}
        </p>
      )}
    </div>
  );
}

function MyReactionEditor({
  placeId,
  category,
  reaction,
  onSaved,
}: {
  placeId: string;
  category: PlaceCategory;
  reaction: PlaceReaction | undefined;
  onSaved: () => Promise<void>;
}) {
  const [wantToGo, setWantToGo] = useState(reaction?.wantToGo ?? false);
  const [visited, setVisited] = useState(reaction?.visited ?? false);
  const [priority, setPriority] = useState<Priority>(
    reaction?.priority ?? "medium",
  );
  const [memo, setMemo] = useState(reaction?.memo ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.setReaction(placeId, { wantToGo, visited, priority, memo });
      await onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card space-y-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setWantToGo((v) => !v)}
          className={`chip flex-1 justify-center py-2 ring-1 ${
            wantToGo
              ? "bg-blush-400 text-white ring-blush-400"
              : "bg-white text-zinc-500 ring-blush-100"
          }`}
        >
          {wantToGo ? `💖 ${wantLabel(category)}` : `🤍 ${wantLabel(category)}`}
        </button>
        <button
          type="button"
          onClick={() => setVisited((v) => !v)}
          className={`chip flex-1 justify-center py-2 ring-1 ${
            visited
              ? "bg-emerald-500 text-white ring-emerald-500"
              : "bg-white text-zinc-500 ring-blush-100"
          }`}
        >
          {visited ? `✓ ${doneLabel(category)}` : doneLabel(category)}
        </button>
      </div>

      <div className="flex gap-2">
        {PRIORITIES.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPriority(p)}
            className={`chip flex-1 justify-center py-2 ring-1 ${
              priority === p
                ? "bg-amber-400 text-white ring-amber-400"
                : "bg-white text-zinc-500 ring-blush-100"
            }`}
          >
            {priorityLabels[p]}
          </button>
        ))}
      </div>

      <textarea
        className="input min-h-[72px] resize-none"
        placeholder="메모 (예: 비 오는 날 가면 좋을 듯)"
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
      />

      {error && <p className="text-sm text-red-500">{error}</p>}
      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="btn-primary w-full"
      >
        {saving ? "저장 중…" : "내 반응 저장"}
      </button>
    </div>
  );
}

function CommentsSection({
  detail,
  currentUserId,
  memberName,
  memberColor,
  reload,
}: {
  detail: PlaceDetail;
  currentUserId: string;
  memberName: (id: string) => string;
  memberColor: (id: string) => string;
  reload: () => Promise<void>;
}) {
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    try {
      await api.addComment(detail.id, body.trim());
      setBody("");
      await reload();
    } finally {
      setBusy(false);
    }
  };

  const remove = async (c: PlaceComment) => {
    await api.deleteComment(c.id);
    await reload();
  };

  return (
    <section className="mt-5">
      <h3 className="mb-2 text-sm font-semibold text-zinc-500">댓글</h3>
      {detail.comments.length === 0 ? (
        <p className="rounded-2xl bg-white px-3 py-3 text-center text-sm text-zinc-300 ring-1 ring-blush-50">
          이 장소에 대한 첫 댓글을 남겨보세요
        </p>
      ) : (
        <div className="space-y-2">
          {detail.comments.map((c) => (
            <div key={c.id} className="flex gap-2">
              <Avatar name={memberName(c.userId)} color={memberColor(c.userId)} size={28} />
              <div className="flex-1 rounded-2xl bg-white px-3 py-2 ring-1 ring-blush-50">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-semibold text-zinc-700">
                    {memberName(c.userId)}
                  </span>
                  <span className="text-[11px] text-zinc-300">
                    {formatDateTime(c.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-zinc-600">{c.body}</p>
                {c.userId === currentUserId && (
                  <button
                    type="button"
                    onClick={() => remove(c)}
                    className="mt-1 text-[11px] text-zinc-300 hover:text-red-400"
                  >
                    삭제
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={add} className="mt-3 flex gap-2">
        <input
          className="input"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="댓글 남기기…"
        />
        <button type="submit" disabled={busy} className="btn-soft shrink-0">
          등록
        </button>
      </form>
    </section>
  );
}

function DeletePlace({
  placeId,
  canDelete,
  onDeleted,
}: {
  placeId: string;
  canDelete: boolean;
  onDeleted: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!canDelete) return null;

  const remove = async () => {
    setBusy(true);
    try {
      await api.deletePlace(placeId);
      onDeleted();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-6 text-center">
      {confirming ? (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="btn-ghost flex-1"
          >
            취소
          </button>
          <button
            type="button"
            onClick={remove}
            disabled={busy}
            className="btn flex-1 bg-red-500 text-white"
          >
            {busy ? "삭제 중…" : "정말 삭제"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="text-xs text-zinc-300 hover:text-red-400"
        >
          이 장소 삭제
        </button>
      )}
    </div>
  );
}

function EditPlaceForm({
  detail,
  onCancel,
  onSaved,
}: {
  detail: PlaceDetail;
  onCancel: () => void;
  onSaved: () => Promise<void>;
}) {
  const [name, setName] = useState(detail.name);
  const [category, setCategory] = useState<PlaceCategory>(detail.category);
  const [address, setAddress] = useState(detail.address);
  const [mapUrl, setMapUrl] = useState(detail.mapUrl);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("장소 이름을 입력해 주세요");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.updatePlace(detail.id, {
        name: name.trim(),
        category,
        address: address.trim(),
        mapUrl: mapUrl.trim(),
      });
      await onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "저장에 실패했습니다");
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 className="mb-4 text-lg font-bold text-zinc-800">장소 정보 수정</h2>
      <form onSubmit={save} className="space-y-4">
        <div>
          <label className="label">장소 이름</label>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
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
          <label className="label">주소</label>
          <input
            className="input"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="예) 서울 마포구 연남동"
          />
        </div>
        <div>
          <label className="label">정보 링크 (사이트·블로그)</label>
          <input
            className="input"
            value={mapUrl}
            onChange={(e) => setMapUrl(e.target.value)}
            placeholder="블로그·홈페이지 등 참고 링크"
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onCancel} className="btn-ghost flex-1">
            취소
          </button>
          <button type="submit" disabled={saving} className="btn-primary flex-1">
            {saving ? "저장 중…" : "저장"}
          </button>
        </div>
      </form>
    </div>
  );
}

function VisitsSection({
  detail,
  currentUserId,
  memberName,
  reload,
}: {
  detail: PlaceDetail;
  currentUserId: string;
  memberName: (id: string) => string;
  reload: () => Promise<void>;
}) {
  const [adding, setAdding] = useState(false);
  const [visitedAt, setVisitedAt] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.addVisit(detail.id, { visitedAt, note: note.trim() });
      setAdding(false);
      setNote("");
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "저장 실패");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-5">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-500">
          {isExperience(detail.category) ? "함께한 기록" : "방문 기록"}
        </h3>
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="chip bg-blush-50 text-blush-500"
          >
            + 기록 남기기
          </button>
        )}
      </div>

      {adding && (
        <form onSubmit={save} className="card mb-2 space-y-2">
          <input
            type="date"
            className="input"
            value={visitedAt}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setVisitedAt(e.target.value)}
          />
          <textarea
            className="input min-h-[64px] resize-none"
            placeholder="한 줄 후기 (예: 분위기 최고, 다음엔 평일에!)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="btn-ghost flex-1 py-2"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={busy}
              className="btn-primary flex-1 py-2"
            >
              {busy ? "저장 중…" : "저장"}
            </button>
          </div>
        </form>
      )}

      {detail.visits.length === 0 && !adding ? (
        <p className="rounded-2xl bg-white px-3 py-3 text-sm text-zinc-300 ring-1 ring-blush-50">
          아직 기록이 없어요
        </p>
      ) : (
        <div className="space-y-2">
          {detail.visits.map((v) => (
            <div
              key={v.id}
              className="rounded-2xl bg-white px-3 py-2.5 ring-1 ring-blush-50"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-semibold text-blush-400">
                  📖 {v.visitedAt}
                </span>
                <span className="text-[11px] text-zinc-300">
                  {memberName(v.createdBy)}
                  {v.createdBy === currentUserId && (
                    <button
                      type="button"
                      onClick={async () => {
                        await api.deleteVisit(v.id);
                        await reload();
                      }}
                      className="ml-2 text-zinc-300 hover:text-red-400"
                    >
                      삭제
                    </button>
                  )}
                </span>
              </div>
              {v.note && (
                <p className="mt-1 text-sm text-zinc-600">{v.note}</p>
              )}
              <VisitPhotos
                visitId={v.id}
                photoIds={v.photos}
                canEdit={v.createdBy === currentUserId}
                onChanged={reload}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
