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

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-6 bg-background px-4 py-6">
      <header className="flex flex-col gap-2 text-center sm:text-left">
        <h1 className="text-2xl font-semibold text-foreground">
          Vocabulary Tracker
        </h1>
        <p className="text-sm text-zinc-500">
          Filter by date or part of speech, then start a memorization session on
          the go.
        </p>
      </header>

      <section className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-zinc-700">
              Part of speech
            </label>
            <select
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-zinc-400 focus:outline-none"
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
            <label className="text-sm font-medium text-zinc-700">Exact day</label>
            <input
              type="date"
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-zinc-400 focus:outline-none"
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

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-500">
            {loading
              ? "Loading words…"
              : `${entries.length} word${entries.length === 1 ? "" : "s"}`}
          </span>
          <button
            type="button"
            onClick={handleToggleSelectAll}
            disabled={!entries.length}
            className="text-xs font-medium text-indigo-600 disabled:text-zinc-300"
          >
            {selectedIds.length === entries.length ? "Clear selection" : "Select all"}
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          {!loading && !entries.length && !error && (
            <p className="text-sm text-zinc-400">
              No words match your filters yet.
            </p>
          )}

          <div className="flex flex-col gap-4">
            {Object.keys(groupedByDate)
              .sort((a, b) => (a > b ? -1 : 1))
              .map((dateKey) => {
                const group = groupedByDate[dateKey];
                return (
                  <div key={dateKey} className="flex flex-col gap-2">
                    <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                      {formatDisplayDate(`${dateKey}T00:00:00`)}
                    </div>
                    <div className="flex flex-col gap-2">
                      {group.map((entry) => {
                        const isSelected = selectedIds.includes(entry.id);
                        return (
                          <button
                            key={entry.id}
                            type="button"
                            onClick={() => handleToggleSelect(entry.id)}
                            className={`flex flex-col items-start gap-1 rounded-2xl border px-3 py-3 text-left transition ${
                              isSelected
                                ? "border-indigo-400 bg-indigo-50"
                                : "border-zinc-100 bg-white"
                            }`}
                          >
                            <div className="flex w-full items-center justify-between">
                              <span className="text-base font-semibold text-foreground">
                                {entry.english}
                              </span>
                              <span className="text-xs uppercase text-zinc-400">
                                {entry.part_of_speech}
                              </span>
                            </div>
                            <p className="text-sm text-zinc-500">
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

      <footer className="mt-auto flex flex-col gap-2 rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
        <div className="flex items-center justify-between text-sm text-indigo-800">
          <span>{totalSelected} selected</span>
          <span>Ready for memorization</span>
        </div>
        <button
          type="button"
          onClick={handleStartMemorization}
          disabled={!totalSelected}
          className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white transition disabled:bg-indigo-200 disabled:text-indigo-100"
        >
          Start memorization
        </button>
      </footer>
    </div>
  );
}
