-- Ашигтай өргөтгөлүүд
create extension if not exists pg_trgm;
create extension if not exists unaccent;

-- ☑️ Үндсэн хүснэгт (GENERATED биш, энгийн баганууд)
drop table if exists vocab_entries cascade;
create table vocab_entries (
  id               bigserial primary key,
  english          text        not null,               -- English headword
  mongolian        text        not null,               -- Орчуулга
  pronunciation    text,                               -- Mongolian pronunciation/phonetic
  part_of_speech   text        not null,               -- verb, adj, noun …
  collocations     text[]      default '{}',           -- ["make a decision","strong tea"]
  usage_en         text,                               -- Жишээ өгүүлбэр(үүд) EN
  usage_mn         text,                               -- Жишээ өгүүлбэр(үүд) MN
  created_word     boolean     default false,          -- шинээр зохио/нэвтрүүлсэн эсэх
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  -- 🔎 FTS талбаруудыг триггерээр дүүргэнэ
  en_fts           tsvector,
  mn_fts           tsvector
);

-- 🧠 updated_at автоматаар шинэчилнэ
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_vocab_set_updated on vocab_entries;
create trigger trg_vocab_set_updated
before update on vocab_entries
for each row execute function set_updated_at();

-- 🔧 FTS багануудыг тооцоолж бичих триггер
create or replace function vocab_entries_update_fts() returns trigger as $$
begin
  -- Англи талын FTS (IMMUTABLE асуудалгүй)
  new.en_fts :=
    to_tsvector('english', coalesce(new.english,'') || ' ' || coalesce(new.usage_en,''));

  -- Монгол талын FTS (unaccent орно, гэхдээ триггер тул OK)
  new.mn_fts :=
    to_tsvector('simple', unaccent(coalesce(new.mongolian,'') || ' ' || coalesce(new.usage_mn,'')));

  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_vocab_update_fts_ins on vocab_entries;
drop trigger if exists trg_vocab_update_fts_upd on vocab_entries;

create trigger trg_vocab_update_fts_ins
before insert on vocab_entries
for each row execute function vocab_entries_update_fts();

create trigger trg_vocab_update_fts_upd
before update of english, mongolian, usage_en, usage_mn on vocab_entries
for each row execute function vocab_entries_update_fts();

-- ⚡ Индексүүд
create index if not exists idx_vocab_en_fts on vocab_entries using gin (en_fts);
create index if not exists idx_vocab_mn_fts on vocab_entries using gin (mn_fts);
create index if not exists idx_vocab_english_trgm on vocab_entries using gin (english gin_trgm_ops);



insert into vocab_entries
  (english, mongolian, pronunciation, part_of_speech, collocations, usage_en, usage_mn, created_word)
values
  ('commit', 'амлалт өгөх; хийж гүйцэтгэх', 'komit', 'verb',
   array['commit a crime','commit to memory'],
   'I will commit this poem to memory.',
   'Энэ шүлгийг би цээжилнэ.',
   false);

-- Англи талын хайлт
select id, english from vocab_entries
where en_fts @@ to_tsquery('english', 'memory & commit');

-- Монгол талын хайлт
select id, mongolian from vocab_entries
where mn_fts @@ plainto_tsquery('simple', unaccent('цээжилнэ'));
