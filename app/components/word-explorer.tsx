'use client';

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  formatDisplayDate,
  toEndOfDayIso,
  toStartOfDayIso,
} from "@/lib/date";
import { fetchVocabEntries, type VocabFilters } from "@/lib/supabase/queries";
import type { VocabEntry } from "@/lib/types";

const TYPE_OPTIONS = [
  { label: "All types", value: "" },
  { label: "Verb", value: "verb" },
  { label: "Adjective", value: "adj" },
];

export function WordExplorer() {
  const router = useRouter();
  const [entries, setEntries] = useState<VocabEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const [filters, setFilters] = useState<{
    partOfSpeech: string;
    exactDate: string;
  }>({
    partOfSpeech: "",
    exactDate: "",
  });

  useEffect(() => {
    const loadEntries = async () => {
      setLoading(true);
      setError(null);
      try {
        const queryFilters: VocabFilters = {
          partOfSpeech: filters.partOfSpeech || undefined,
          startDate: filters.exactDate
            ? toStartOfDayIso(filters.exactDate)
            : undefined,
          endDate: filters.exactDate ? toEndOfDayIso(filters.exactDate) : undefined,
        };
        const data = await fetchVocabEntries(queryFilters);
        setEntries(data);
        setSelectedIds([]);
      } catch (fetchError) {
        console.error(fetchError);
        setError("Failed to load words. Please refresh.");
      } finally {
        setLoading(false);
      }
    };

    loadEntries();
  }, [
    filters.partOfSpeech,
    filters.exactDate,
  ]);

  const totalSelected = selectedIds.length;

  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    setSelectedIds((prev) =>
      prev.length === entries.length ? [] : entries.map((entry) => entry.id)
    );
  };

  const handleStartMemorization = () => {
    if (!selectedIds.length) return;
    const params = new URLSearchParams();
    params.set("ids", selectedIds.join(","));
    if (filters.partOfSpeech) {
      params.set("type", filters.partOfSpeech);
    }
    if (filters.exactDate) {
      params.set("day", filters.exactDate);
    }
    router.push(`/memorize?${params.toString()}`);
  };

  const groupedByDate = useMemo(() => {
    return entries.reduce<Record<string, VocabEntry[]>>((acc, entry) => {
      const key = entry.created_at.split("T")[0];
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(entry);
      return acc;
    }, {});
  }, [entries]);

  const skeletonCards = new Array(4).fill(null);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-8 px-4 py-10">
      <header className="flex flex-col gap-4 rounded-3xl bg-gradient-to-b from-[#1c1f2a] to-[#11141b] p-6 text-center shadow-[0_30px_90px_-60px_rgba(0,0,0,0.85)] backdrop-blur sm:text-left">
        <div className="flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-indigo-300 sm:justify-start">
          <span className="h-2 w-2 rounded-full bg-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.6)]" />
          Daily Vocabulary
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold text-[#f3f4f6]">
            Keep words sharp and memorable
          </h1>
          <p className="text-sm text-zinc-400">
            Select the focus you need today, then build a batch for mindful memorization.
          </p>
        </div>
      </header>

      <section className="rounded-3xl border border-[#252834] bg-[#16171d] p-5 shadow-[0_40px_100px_-70px_rgba(0,0,0,0.9)]">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
              Part of speech
            </label>
            <select
              className="rounded-2xl border border-[#2e313f] bg-[#0f1117] px-4 py-3 text-sm font-medium text-[#e5e7eb] shadow-[0_24px_80px_-60px_rgba(99,102,241,0.65)] transition focus:border-[#6366f1] focus:outline-none"
              value={filters.partOfSpeech}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  partOfSpeech: event.target.value,
                }))
              }
            >
              {TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
              Exact day
            </label>
            <input
              type="date"
              className="rounded-2xl border border-[#2e313f] bg-[#0f1117] px-4 py-3 text-sm font-medium text-[#e5e7eb] shadow-[0_24px_80px_-60px_rgba(99,102,241,0.65)] transition focus:border-[#6366f1] focus:outline-none"
              value={filters.exactDate}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  exactDate: event.target.value,
                }))
              }
            />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
          <span className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-500/40 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-400" />
            </span>
            {loading
              ? "Syncing with Supabase…"
              : `${entries.length} word${entries.length === 1 ? "" : "s"}`}
          </span>
          <button
            type="button"
            onClick={handleToggleSelectAll}
            disabled={!entries.length}
            className="rounded-full bg-[#1f2230] px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-indigo-200 transition hover:bg-[#242736] disabled:bg-transparent disabled:text-zinc-600"
          >
            {selectedIds.length === entries.length ? "Clear selection" : "Select all"}
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {error && (
            <p className="rounded-3xl border border-[#3a1f28] bg-[#261218] px-4 py-3 text-sm text-rose-300 shadow-[0_28px_70px_-52px_rgba(244,63,94,0.52)]">
              {error}
            </p>
          )}

          {!loading && !entries.length && !error && (
            <div className="rounded-3xl border border-dashed border-[#2e313f] bg-[#151720]/70 px-6 py-12 text-center text-sm text-zinc-500 shadow-inner shadow-black/40">
              No words match your filters yet. Try adjusting your focus.
            </div>
          )}

          <div className="flex flex-col gap-4">
            {loading
              ? skeletonCards.map((_, index) => (
                  <div
                    key={`skeleton-${index}`}
                    className="h-[92px] animate-pulse rounded-3xl bg-[#1b1e2b] px-5 py-4 shadow-[0_38px_100px_-65px_rgba(99,102,241,0.6)]"
                  />
                ))
              : Object.keys(groupedByDate)
                  .sort((a, b) => (a > b ? -1 : 1))
                  .map((dateKey) => {
                    const group = groupedByDate[dateKey];
                    return (
                      <div key={dateKey} className="flex flex-col gap-3">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.35em] text-zinc-500">
                          {formatDisplayDate(`${dateKey}T00:00:00`)}
                        </div>
                        <div className="flex flex-col gap-3">
                          {group.map((entry) => {
                            const isSelected = selectedIds.includes(entry.id);
                            return (
                              <button
                                key={entry.id}
                                type="button"
                                onClick={() => handleToggleSelect(entry.id)}
                                className={`group flex flex-col gap-2 rounded-3xl border px-5 py-4 text-left shadow-[0_30px_90px_-70px_rgba(0,0,0,0.85)] transition-all duration-300 ${
                                  isSelected
                                    ? "border-transparent bg-gradient-to-br from-[#2f2b55] via-[#3b3580] to-[#4b55a6] text-[#f4f4f5]"
                                    : "border-[#232634] bg-[#14161d] hover:-translate-y-1 hover:border-[#3a3f56] hover:bg-[#181b24]"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-lg font-semibold text-[#f3f4f6]">
                                    {entry.english}
                                  </span>
                                  <span
                                    className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                                      isSelected
                                        ? "bg-[#f3f4f6]/15 text-[#e0e7ff]"
                                        : "bg-[#1f2230] text-indigo-200"
                                    }`}
                                  >
                                    {entry.part_of_speech}
                                  </span>
                                </div>
                                <p
                                  className={`text-sm ${
                                    isSelected ? "text-indigo-100/90" : "text-zinc-400"
                                  }`}
                                >
                                  {entry.mongolian}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
          </div>
        </div>
      </section>

      <footer className="mt-auto flex flex-col gap-3 rounded-3xl border border-[#2e313f] bg-[#16171d] p-5 shadow-[0_40px_100px_-70px_rgba(0,0,0,0.9)]">
        <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.32em] text-zinc-500">
          <span>{totalSelected} Selected</span>
          <span>Session ready</span>
        </div>
        <button
          type="button"
          onClick={handleStartMemorization}
          disabled={!totalSelected}
          className="w-full rounded-2xl bg-gradient-to-r from-[#303458] via-[#3f4673] to-[#4f5a8f] px-6 py-3 text-sm font-semibold uppercase tracking-wide text-[#f3f4f6] transition hover:brightness-110 disabled:bg-[#1f2230] disabled:text-zinc-600"
        >
          Start memorization
        </button>
      </footer>
    </div>
  );
}
