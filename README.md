## VOC Memorizer

Mobile-first vocabulary tracker connected to Supabase. Browse words with filters, pick a batch, and step through a memorization flow that reveals Mongolian explanations on demand.

### Prerequisites

- Node.js 18.17+ (Next.js 16 requirement)
- A Supabase project exposing the `vocab_entries` table described in `docs/db.md`

### Environment

Create a `.env.local` file with your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

The client uses these values for every request; make sure they match the project that contains the `vocab_entries` data.

### Develop

Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

Open http://localhost:3000 on a mobile device or emulator.

### Usage

- **Word list** – filter by part of speech or an exact day, then tap items to build a batch. Use “Start memorization” to jump into study mode.
- **Memorization** – words appear in random order. Reveal the Mongolian explanation with **Show**, and advance with **Next** (the list reshuffles automatically when you reach the end).

### Notes

- Data fetches are client-side via the Supabase JS SDK.
- Tailwind CSS v4 powers the responsive styling.
  