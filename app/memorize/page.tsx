import { Suspense } from "react";
import { MemorizationSession } from "./memorization-session";

export default function MemorizePage() {
  return (
    <Suspense fallback={<div className="px-4 py-6 text-sm text-zinc-500">Loading session…</div>}>
      <MemorizationSession />
    </Suspense>
  );
}
