import { useState } from "react";
import { ApiError } from "@/lib/api";
import { useSession } from "@/lib/session";

export function LoginPage() {
  const { login } = useSession();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      <p className="mt-8 text-center text-[11px] text-zinc-300">
        복잡한 회원가입 없이 이름만으로 시작해요.<br />
        같은 기기에서는 로그인 상태가 유지됩니다.
      </p>
    </div>
  );
}
