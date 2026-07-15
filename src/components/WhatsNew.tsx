import { useEffect, useState } from "react";
import { changelog, latestVersion } from "@/data/changelog";
import { Modal } from "./Modal";

const SEEN_KEY = "cdw_seen_version";

export function getUnseen(): boolean {
  return localStorage.getItem(SEEN_KEY) !== latestVersion;
}

function markSeen(): void {
  localStorage.setItem(SEEN_KEY, latestVersion);
}

/** Auto-popup shown once per new version (only for logged-in users). */
export function WhatsNewPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (getUnseen()) setOpen(true);
  }, []);

  if (!open) return null;
  const latest = changelog[0];

  const close = () => {
    markSeen();
    setOpen(false);
  };

  return (
    <Modal onClose={close}>
      <div className="text-center">
        <div className="text-4xl">🎁</div>
        <p className="mt-2 text-xs font-semibold tracking-wide text-blush-400">
          패치 {latest.version} · {latest.date}
        </p>
        <h2 className="mt-1 text-lg font-bold text-zinc-800">{latest.title}</h2>
      </div>
      <ul className="mt-4 space-y-2">
        {latest.items.map((item, i) => (
          <li
            key={i}
            className="rounded-2xl bg-white px-4 py-2.5 text-sm text-zinc-600 ring-1 ring-blush-50"
          >
            ✨ {item}
          </li>
        ))}
      </ul>
      <button type="button" onClick={close} className="btn-primary mt-5 w-full">
        좋아요!
      </button>
    </Modal>
  );
}

/** Full history, opened from the couple tab. */
export function ChangelogModal({ onClose }: { onClose: () => void }) {
  useEffect(markSeen, []);

  return (
    <Modal onClose={onClose}>
      <h2 className="mb-4 text-lg font-bold text-zinc-800">업데이트 소식</h2>
      <div className="space-y-5">
        {changelog.map((entry) => (
          <section key={entry.version}>
            <div className="flex items-baseline gap-2">
              <span className="chip bg-blush-400 text-white">
                패치 {entry.version}
              </span>
              <span className="text-[11px] text-zinc-300">{entry.date}</span>
            </div>
            <h3 className="mt-1.5 text-sm font-bold text-zinc-700">
              {entry.title}
            </h3>
            <ul className="mt-1 space-y-1">
              {entry.items.map((item, i) => (
                <li key={i} className="text-sm text-zinc-500">
                  · {item}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <button type="button" onClick={onClose} className="btn-ghost mt-5 w-full">
        닫기
      </button>
    </Modal>
  );
}
