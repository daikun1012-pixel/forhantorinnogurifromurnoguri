import { useState } from "react";
import { useStore } from "@/lib/store";
import { Avatar } from "@/components/Avatar";
import { formatDate } from "@/lib/format";

export function InvitePage() {
  const { couple, members, getUser } = useStore();
  const [copied, setCopied] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinMsg, setJoinMsg] = useState<string | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(couple.inviteCode);
    } catch {
      /* clipboard unavailable in some contexts */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.trim().toUpperCase() === couple.inviteCode) {
      setJoinMsg("🎉 이미 연결된 커플이에요!");
    } else {
      setJoinMsg("코드를 확인해 주세요 (목업)");
    }
  };

  return (
    <div className="space-y-6">
      <section className="card text-center">
        <h2 className="text-lg font-bold text-zinc-800">{couple.name}</h2>
        <p className="mt-1 text-xs text-zinc-400">
          {formatDate(couple.createdAt)}부터 함께
        </p>

        <div className="mt-4 flex items-center justify-center gap-3">
          {members.map((m) => {
            const user = getUser(m.userId);
            if (!user) return null;
            return (
              <div key={m.userId} className="flex flex-col items-center gap-1">
                <Avatar user={user} size={48} />
                <span className="text-sm font-medium text-zinc-600">
                  {user.name}
                </span>
                <span className="text-[11px] text-zinc-300">
                  {m.role === "owner" ? "개설자" : "파트너"}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="card">
        <h3 className="text-sm font-semibold text-zinc-500">초대 코드</h3>
        <div className="mt-2 flex items-center gap-2">
          <code className="flex-1 rounded-2xl bg-blush-50 px-4 py-3 text-center text-lg font-bold tracking-widest text-blush-500">
            {couple.inviteCode}
          </code>
          <button type="button" onClick={handleCopy} className="btn-primary">
            {copied ? "복사됨!" : "복사"}
          </button>
        </div>
        <p className="mt-2 text-xs text-zinc-400">
          파트너에게 이 코드를 공유하면 같은 위시리스트를 볼 수 있어요.
        </p>
      </section>

      <section className="card">
        <h3 className="text-sm font-semibold text-zinc-500">코드로 참여하기</h3>
        <form onSubmit={handleJoin} className="mt-2 flex gap-2">
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="LOVE-0000"
            className="flex-1 rounded-2xl bg-white px-4 py-3 text-sm uppercase tracking-widest ring-1 ring-blush-100 outline-none focus:ring-blush-300"
          />
          <button type="submit" className="btn-ghost">
            참여
          </button>
        </form>
        {joinMsg && (
          <p className="mt-2 text-center text-sm text-blush-500">{joinMsg}</p>
        )}
      </section>
    </div>
  );
}
