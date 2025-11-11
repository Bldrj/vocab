import { assertSupabaseConfigured, createSupabaseClient } from "./client";
import type { VocabEntry } from "../types";

export type VocabFilters = {
  partOfSpeech?: string;
  startDate?: string; // ISO string (YYYY-MM-DD)
  endDate?: string; // ISO string (YYYY-MM-DD)
  ids?: number[];
};

export const fetchVocabEntries = async (
  filters: VocabFilters = {}
): Promise<VocabEntry[]> => {
  assertSupabaseConfigured();
  const supabase = createSupabaseClient();
  let query = supabase.from("vocab_entries").select("*").order("created_at", {
    ascending: false,
  });

  if (filters.partOfSpeech) {
    query = query.eq("part_of_speech", filters.partOfSpeech);
  }

  if (filters.ids?.length) {
    query = query.in("id", filters.ids);
  }

  if (filters.startDate) {
    query = query.gte("created_at", filters.startDate);
  }

  if (filters.endDate) {
    query = query.lte("created_at", filters.endDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to fetch vocab entries", error);
    throw error;
  }

  return data ?? [];
};
