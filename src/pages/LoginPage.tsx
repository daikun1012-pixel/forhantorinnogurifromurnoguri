import { useState } from "react";
import { ApiError } from "@/lib/api";
import { useSession } from "@/lib/session";

export function LoginPage() {
  const { login, loginWithCode } = useSession();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRecover, setShowRecover] = useState(false);
  const [code, setCode] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("이름을 입력해 주세요");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await login(name.trim());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "로그인에 실패했습니다");
      setBusy(false);
    }
  };

  const recover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await loginWithCode(code.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "복구에 실패했습니다");
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col items-center justify-center px-6 py-12">
      <div className="mb-10 text-center">
        <div className="text-5xl">💗</div>
        <h1 className="mt-4 text-2xl font-bold text-zinc-800">
          우리 데이트 위시리스트
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          둘이 함께 가고 싶은 곳을 모아보세요
        </p>
      </div>

      <form onSubmit={submit} className="w-full space-y-3">
        <div>
          <label className="label">이름 또는 닉네임</label>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예) 다이키"
            autoFocus
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? "시작하는 중…" : "시작하기"}
        </button>
      </form>

      <div className="mt-6 w-full">
        {!showRecover ? (
          <button
            type="button"
            onClick={() => {
              setShowRecover(true);
              setError(null);
            }}
            className="mx-auto block text-xs font-medium text-blush-400 underline"
          >
            이미 쓰던 계정이 있어요 · 복구 코드로 로그인
          </button>
        ) : (
          <form onSubmit={recover} className="space-y-2">
            <label className="label">복구 코드</label>
            <div className="flex gap-2">
              <input
                className="input"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="user_xxxxxxxx"
                autoFocus
              />
              <button type="submit" disabled={busy} className="btn-soft shrink-0">
                로그인
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowRecover(false)}
              className="text-xs text-zinc-400"
            >
              ← 새로 시작하기
            </button>
          </form>
        )}
      </div>

      <p className="mt-8 text-center text-[11px] text-zinc-300">
        복잡한 회원가입 없이 이름만으로 시작해요.<br />
        기기를 바꿔도 <b>복구 코드</b>로 이어서 쓸 수 있어요 (커플 탭에서 확인).
      </p>
    </div>
  );
}
