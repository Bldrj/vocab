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
      } catch (fetchError) {
        console.error(fetchError);
        setError("Unable to load words. Try again later.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [ids, typeParam, dayParam]);

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
    <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-6 bg-background px-4 py-6">
      <header className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleBack}
          className="text-sm font-medium text-indigo-600"
        >
          &larr; Word list
        </button>
        <span className="text-xs uppercase tracking-wide text-zinc-400">
          {progressLabel}
        </span>
      </header>

      <div className="rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm">
        {loading && (
          <p className="text-center text-sm text-zinc-500">Loading words…</p>
        )}
        {error && !loading && (
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-sm text-red-600">{error}</p>
            <button
              type="button"
              onClick={handleBack}
              className="rounded-full border border-indigo-200 px-4 py-2 text-sm font-medium text-indigo-600"
            >
              Back to list
            </button>
          </div>
        )}
        {!loading && !error && currentWord && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-wide text-zinc-400">
                {currentWord.part_of_speech}
              </span>
              <h1 className="text-3xl font-semibold text-foreground">
                {currentWord.english}
              </h1>
              {currentWord.pronunciation && (
                <span className="text-sm text-zinc-500">
                  /{currentWord.pronunciation}/
                </span>
              )}
              <p className="text-xs text-zinc-400">
                Added {formatDisplayDate(currentWord.created_at)}
              </p>
            </div>

            <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
              {showExplanation ? (
                <div className="flex flex-col gap-3">
                  <p className="text-base font-medium text-indigo-900">
                    {currentWord.mongolian}
                  </p>
                  {currentWord.usage_en && (
                    <div className="text-sm text-indigo-900">
                      <p className="font-semibold uppercase tracking-wide text-xs text-indigo-500">
                        Usage
                      </p>
                      <p>{currentWord.usage_en}</p>
                      {currentWord.usage_mn && (
                        <p className="text-indigo-700">{currentWord.usage_mn}</p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-center text-sm text-indigo-600">
                  Tap show to reveal the translation.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <footer className="mt-auto flex gap-3">
        <button
          type="button"
          onClick={handleReveal}
          disabled={loading || !!error || !queue.length || showExplanation}
          className="w-1/3 rounded-xl border border-indigo-200 bg-white px-4 py-3 text-sm font-medium text-indigo-600 transition disabled:border-zinc-100 disabled:text-zinc-300"
        >
          Show
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={loading || !!error || !queue.length}
          className="w-2/3 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white transition disabled:bg-indigo-200"
        >
          Next
        </button>
      </footer>
    </div>
  );
}
