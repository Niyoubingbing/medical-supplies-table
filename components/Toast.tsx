"use client";

/** 轻量顶部提示条（自动由父级控制消失）。 */
export default function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="fixed top-4 inset-x-0 z-[80] flex justify-center px-6 pointer-events-none">
      <div className="toast-pop max-w-full truncate rounded-full bg-ink-800/95 text-paper-50 text-sm px-4 py-2.5 shadow-card">
        {message}
      </div>
    </div>
  );
}
