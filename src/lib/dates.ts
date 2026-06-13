const CEST_TIMEZONE = "Europe/Warsaw";

const kickoffFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: CEST_TIMEZONE,
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const kickoffShortFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: CEST_TIMEZONE,
  month: "short",
  day: "numeric",
});

export function formatKickoffCEST(date: string | Date): string {
  return `${kickoffFormatter.format(new Date(date))} CEST`;
}

export function formatKickoffDateShortCEST(date: string | Date): string {
  return kickoffShortFormatter.format(new Date(date));
}
