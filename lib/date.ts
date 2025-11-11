export const toStartOfDayIso = (value?: string) =>
  value ? new Date(`${value}T00:00:00`).toISOString() : undefined;

export const toEndOfDayIso = (value?: string) =>
  value ? new Date(`${value}T23:59:59`).toISOString() : undefined;

export const formatDisplayDate = (value: string) =>
  new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(value));
