import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { useSession } from "@/lib/session";
import { Avatar } from "@/components/ui";

export function CouplePage() {
  const { session, refresh, logout } = useSession();
  if (!session) return null;

  return session.couple ? (
    <CoupleSettings />
  ) : (
    <CoupleOnboarding onDone={refresh} onLogout={logout} />
  );
}

function CoupleOnboarding({
  onDone,
  onLogout,
}: {
  onDone: () => Promise<void>;
  onLogout: () => void;
}) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState<"create" | "join" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const create = async () => {
    setBusy("create");
    setError(null);
    try {
      await api.createCouple();
      await onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "실패했습니다");
      setBusy(null);
    }
  };

  const join = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setBusy("join");
    setError(null);
    try {
      await api.joinCouple(code.trim());
      await onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "실패했습니다");
      setBusy(null);
    }
  };

  return (
    <div className="space-y-5 py-6">
      <div className="text-center">
        <div className="text-4xl">💞</div>
        <h1 className="mt-3 text-xl font-bold text-zinc-800">커플 공간 시작하기</h1>
        <p className="mt-1 text-sm text-zinc-400">
          공간을 새로 만들거나, 상대방의 초대코드로 참여하세요.
        </p>
      </div>

      <div className="card">
        <h2 className="text-sm font-semibold text-zinc-600">새 공간 만들기</h2>
        <p className="mt-1 text-xs text-zinc-400">
          공간을 만들면 초대코드가 생성돼요. 상대방에게 공유하세요.
        </p>
        <button
          type="button"
          onClick={create}
          disabled={busy !== null}
          className="btn-primary mt-3 w-full"
        >
          {busy === "create" ? "만드는 중…" : "새 커플 공간 만들기"}
        </button>
      </div>

      <div className="card">
        <h2 className="text-sm font-semibold text-zinc-600">초대코드로 참여</h2>
        <form onSubmit={join} className="mt-3 flex gap-2">
          <input
            className="input uppercase tracking-widest"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABC123"
            maxLength={12}
          />
          <button
            type="submit"
            disabled={busy !== null}
            className="btn-soft shrink-0"
          >
            {busy === "join" ? "참여 중…" : "참여"}
          </button>
        </form>
      </div>

      {error && <p className="text-center text-sm text-red-500">{error}</p>}

      <button
        type="button"
        onClick={onLogout}
        className="mx-auto block text-xs text-zinc-300 hover:text-zinc-500"
      >
        로그아웃
      </button>
    </div>
  );
}

function CoupleSettings() {
  const { session, logout, refresh } = useSession();
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [kicking, setKicking] = useState<string | null>(null);
  const [confirmKick, setConfirmKick] = useState<string | null>(null);
  if (!session?.couple) return null;
  const { couple, members, user } = session;
  const isOwner =
    members.find((m) => m.userId === user.id)?.role === "owner";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(couple.inviteCode);
    } catch {
      /* ignore */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(user.id);
    } catch {
      /* ignore */
    }
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 1500);
  };

  const kick = async (userId: string) => {
    setKicking(userId);
    try {
      await api.kickMember(userId);
      setConfirmKick(null);
      await refresh();
    } finally {
      setKicking(null);
    }
  };

  return (
    <div className="space-y-5">
      <section className="card text-center">
        <h2 className="text-lg font-bold text-zinc-800">{couple.name}</h2>
        <div className="mt-4 flex items-center justify-center gap-4">
          {members.map((m) => (
            <div key={m.userId} className="flex flex-col items-center gap-1">
              <Avatar name={m.user.name} color={m.user.avatarColor} size={48} />
              <span className="text-sm font-medium text-zinc-600">
                {m.user.name}
              </span>
              <span className="text-[11px] text-zinc-300">
                {m.role === "owner" ? "개설자" : "파트너"}
              </span>
              {isOwner && m.role !== "owner" && (
                <button
                  type="button"
                  onClick={() => setConfirmKick(m.userId)}
                  className="mt-1 text-[11px] text-zinc-300 hover:text-red-400"
                >
                  내보내기
                </button>
              )}
            </div>
          ))}
          {members.length < 2 && (
            <div className="flex flex-col items-center gap-1 opacity-50">
              <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed border-blush-200 text-blush-300">
                ?
              </span>
              <span className="text-xs text-zinc-400">초대 대기중</span>
            </div>
          )}
        </div>
      </section>

      <section className="card">
        <h3 className="text-sm font-semibold text-zinc-500">초대 코드</h3>
        <div className="mt-2 flex items-center gap-2">
          <code className="flex-1 rounded-2xl bg-blush-50 px-4 py-3 text-center text-lg font-bold tracking-widest text-blush-500">
            {couple.inviteCode}
          </code>
          <button type="button" onClick={copy} className="btn-primary">
            {copied ? "복사됨!" : "복사"}
          </button>
        </div>
        <p className="mt-2 text-xs text-zinc-400">
          {members.length >= 2
            ? "두 사람이 모두 참여했어요 💗"
            : "이 코드를 상대방에게 공유하면 같은 공간을 함께 쓸 수 있어요."}
        </p>
      </section>

      {confirmKick && (
        <section className="card ring-1 ring-red-100">
          <p className="text-sm text-zinc-600">
            <b>
              {members.find((m) => m.userId === confirmKick)?.user.name}
            </b>
            님을 커플 공간에서 내보낼까요? 이 사람의 반응·메모·댓글도 함께
            삭제됩니다.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setConfirmKick(null)}
              className="btn-ghost flex-1"
            >
              취소
            </button>
            <button
              type="button"
              onClick={() => kick(confirmKick)}
              disabled={kicking !== null}
              className="btn flex-1 bg-red-500 text-white"
            >
              {kicking ? "내보내는 중…" : "내보내기"}
            </button>
          </div>
        </section>
      )}

      <section className="card">
        <h3 className="text-sm font-semibold text-zinc-500">내 복구 코드</h3>
        <p className="mt-1 text-xs text-zinc-400">
          기기를 바꾸거나 다른 브라우저에서 로그인 화면의 "복구 코드"에 이 값을
          입력하면 지금 계정으로 이어서 쓸 수 있어요. 남에게 공유하지 마세요.
        </p>
        <div className="mt-2 flex items-center gap-2">
          <code className="flex-1 overflow-x-auto rounded-2xl bg-zinc-50 px-3 py-2.5 text-xs text-zinc-600">
            {user.id}
          </code>
          <button type="button" onClick={copyCode} className="btn-soft shrink-0">
            {codeCopied ? "복사됨!" : "복사"}
          </button>
        </div>
      </section>

      <button
        type="button"
        onClick={logout}
        className="mx-auto block text-xs text-zinc-300 hover:text-zinc-500"
      >
        로그아웃
      </button>
    </div>
  );
}
