export type VocabEntry = {
  id: number;
  english: string;
  mongolian: string;
  pronunciation: string | null;
  part_of_speech: string;
  collocations: string[] | null;
  usage_en: string | null;
  usage_mn: string | null;
  created_word: boolean;
  created_at: string;
  updated_at: string;
};
