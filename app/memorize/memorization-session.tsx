'use client';

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatDisplayDate, toEndOfDayIso, toStartOfDayIso } from "@/lib/date";
import { fetchVocabEntries, type VocabFilters } from "@/lib/supabase/queries";
import type { VocabEntry } from "@/lib/types";

const shuffle = <T,>(items: T[]): T[] => {
  const clone = [...items];
  for (let index = clone.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [clone[index], clone[randomIndex]] = [clone[randomIndex], clone[index]];
  }
  return clone;
};

export function MemorizationSession() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idsParam = searchParams.get("ids") ?? "";
  const typeParam = searchParams.get("type") ?? "";
  const dayParam = searchParams.get("day") ?? "";

  const [queue, setQueue] = useState<VocabEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [justLoaded, setJustLoaded] = useState(true);

  const ids = useMemo(
    () =>
      idsParam
        .split(",")
        .map((value) => Number.parseInt(value, 10))
        .filter((value) => !Number.isNaN(value)),
    [idsParam]
  );

  useEffect(() => {
    const load = async () => {
      if (!ids.length) {
        setError("Select at least one word on the list page to start memorizing.");
        setQueue([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const filters: VocabFilters = {
          ids,
          partOfSpeech: typeParam || undefined,
          startDate: dayParam ? toStartOfDayIso(dayParam) : undefined,
          endDate: dayParam ? toEndOfDayIso(dayParam) : undefined,
        };
        const data = await fetchVocabEntries(filters);
        if (!data.length) {
          setError("No words found. Adjust your filters on the list page.");
          setQueue([]);
          setLoading(false);
          return;
        }
        setQueue(shuffle(data));
        setCurrentIndex(0);
        setShowExplanation(false);
        setJustLoaded(true);
      } catch (fetchError) {
        console.error(fetchError);
        setError("Unable to load words. Try again later.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [ids, typeParam, dayParam]);

  useEffect(() => {
    if (!loading) {
      const timer = window.setTimeout(() => setJustLoaded(false), 200);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [loading, currentIndex]);

  const currentWord = queue[currentIndex];
  const progressLabel = queue.length
    ? `Word ${currentIndex + 1} of ${queue.length}`
    : "Waiting for words…";

  const handleNext = () => {
    if (!queue.length) return;
    setShowExplanation(false);
    setCurrentIndex((prev) => {
      if (prev === queue.length - 1) {
        setQueue((prevQueue) => shuffle(prevQueue));
        return 0;
      }
      return prev + 1;
    });
  };

  const handleReveal = () => setShowExplanation(true);

  const handleBack = () => {
    const params = new URLSearchParams();
    if (typeParam) params.set("type", typeParam);
    if (dayParam) {
      params.set("day", dayParam);
    }
    router.push(`/?${params.toString()}`);
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-8 px-4 py-10">
      <header className="flex items-center justify-between rounded-3xl border border-[#2b2e3a] bg-[#16171d]/80 px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-zinc-500 shadow-[0_30px_90px_-60px_rgba(0,0,0,0.85)] backdrop-blur">
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-2 rounded-full bg-[#1f2230] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-indigo-200 transition hover:bg-[#242736]"
        >
          <span>&larr;</span>
          Back
        </button>
        <span>{progressLabel}</span>
      </header>

      <div className="overflow-hidden rounded-3xl border border-[#303345] bg-gradient-to-br from-[#1e2130] via-[#151720] to-[#0f1117] p-[1px] shadow-[0_45px_120px_-70px_rgba(0,0,0,0.9)]">
        <div className="rounded-[calc(1.5rem-1px)] bg-[#13151c] px-6 py-8">
          {loading && (
            <div className="flex flex-col gap-6">
              <div className="h-6 w-32 animate-pulse rounded-full bg-[#1f2230]" />
              <div className="space-y-3">
                <div className="h-12 w-3/4 animate-pulse rounded-2xl bg-[#1f2230]" />
                <div className="h-4 w-1/2 animate-pulse rounded-full bg-[#1f2230]" />
              </div>
              <div className="h-36 animate-pulse rounded-3xl bg-[#1f2230]/80" />
            </div>
          )}
          {error && !loading && (
            <div className="flex flex-col items-center gap-4 text-center">
              <p className="rounded-3xl border border-[#3a1f28] bg-[#261218] px-6 py-4 text-sm text-rose-300 shadow-[0_28px_70px_-52px_rgba(244,63,94,0.52)]">
                {error}
              </p>
              <button
                type="button"
                onClick={handleBack}
                className="rounded-full border border-[#3f4570] px-4 py-2 text-sm font-medium text-indigo-200 transition hover:bg-[#1f2230]"
              >
                Back to list
              </button>
            </div>
          )}
          {!loading && !error && currentWord && (
            <div
              className={`flex flex-col gap-8 transition-opacity duration-300 ${
                justLoaded ? "opacity-0" : "opacity-100"
              }`}
            >
              <div className="flex flex-col gap-3">
                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#1f2230] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-indigo-200">
                  {currentWord.part_of_speech}
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-300" />
                </span>
                <h1 className="text-4xl font-semibold text-[#f3f4f6]">
                  {currentWord.english}
                </h1>
                {currentWord.pronunciation && (
                  <span className="text-sm text-zinc-500">
                    /{currentWord.pronunciation}/
                  </span>
                )}
                <p className="text-xs text-zinc-500">
                  Added {formatDisplayDate(currentWord.created_at)}
                </p>
              </div>

              <div className="relative overflow-hidden rounded-3xl border border-[#363b58] bg-gradient-to-br from-[#262a3f] via-[#1b1f2e] to-[#141720] p-6 shadow-[0_35px_100px_-70px_rgba(99,102,241,0.55)]">
                <div className="absolute -top-24 right-0 h-56 w-56 rounded-full bg-[#3f4673]/40 blur-3xl" />
                {showExplanation ? (
                  <div className="relative flex flex-col gap-4 text-indigo-100">
                    <p className="text-lg font-semibold text-indigo-100">
                      {currentWord.mongolian}
                    </p>
                    {currentWord.usage_en && (
                      <div className="space-y-2 text-sm">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-indigo-300/70">
                          Usage
                        </p>
                        <p className="text-indigo-100/90">{currentWord.usage_en}</p>
                        {currentWord.usage_mn && (
                          <p className="text-indigo-200/80">{currentWord.usage_mn}</p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="relative flex flex-col items-center gap-3 text-center text-indigo-200">
                    <span className="text-sm font-medium">
                      Tap show to reveal the translation.
                    </span>
                    <span className="h-1 w-16 rounded-full bg-indigo-300/40" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <footer className="mt-auto grid grid-cols-3 gap-3">
        <button
          type="button"
          onClick={handleReveal}
          disabled={loading || !!error || !queue.length || showExplanation}
          className="col-span-1 rounded-2xl border border-[#2b2e3a] bg-[#16171d] px-4 py-3 text-sm font-semibold uppercase tracking-wide text-indigo-200 transition hover:border-[#3f4570] hover:bg-[#1b1f2c] disabled:border-[#2b2e3a] disabled:text-zinc-600"
        >
          Show
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={loading || !!error || !queue.length}
          className="col-span-2 rounded-2xl bg-gradient-to-r from-[#303458] via-[#3f4673] to-[#4f5a8f] px-4 py-3 text-sm font-semibold uppercase tracking-wide text-[#f3f4f6] shadow-[0_35px_90px_-70px_rgba(99,102,241,0.65)] transition hover:brightness-110 disabled:bg-[#1f2230] disabled:text-zinc-600"
        >
          Next
        </button>
      </footer>
    </div>
  );
}
