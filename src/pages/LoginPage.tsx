import { useNavigate } from "react-router-dom";
import { useStore } from "@/lib/store";
import { Avatar } from "@/components/Avatar";

export function LoginPage() {
  const { users, login } = useStore();
  const navigate = useNavigate();

  const handleLogin = (userId: string) => {
    login(userId);
    navigate("/places", { replace: true });
  };

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col items-center justify-center bg-cream px-6 py-12">
      <div className="mb-10 text-center">
        <div className="text-5xl">💗</div>
        <h1 className="mt-4 text-2xl font-bold text-zinc-800">
          우리의 위시리스트
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          둘이 함께 가고 싶은 곳을 모아보세요
        </p>
      </div>

      <div className="w-full space-y-3">
        <p className="text-center text-xs font-medium text-zinc-400">
          누구로 로그인할까요? (목업)
        </p>
        {users.map((user) => (
          <button
            key={user.id}
            type="button"
            onClick={() => handleLogin(user.id)}
            className="card flex w-full items-center gap-3 transition hover:-translate-y-0.5"
          >
            <Avatar user={user} size={44} />
            <div className="text-left">
              <div className="font-semibold text-zinc-800">{user.name}</div>
              <div className="text-xs text-zinc-400">{user.email}</div>
            </div>
            <span className="ml-auto text-blush-300">→</span>
          </button>
        ))}
      </div>

      <p className="mt-8 text-center text-[11px] text-zinc-300">
        실제 인증은 이후 연동 예정입니다
      </p>
    </div>
  );
}
