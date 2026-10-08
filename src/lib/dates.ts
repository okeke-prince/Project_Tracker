export function formatEventDate(date: string) {
  // Plain YYYY-MM-DD dates are calendar days; parse them as UTC so they don't shift a day.
  const d = /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T00:00:00Z`) : new Date(date);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
}

function parseEventDate(date: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T00:00:00Z`) : new Date(date);
}

/** "Mar 20". The timeline shows the year once, as a heading, so entries only need the day. */
export function formatMonthDay(date: string) {
  return parseEventDate(date).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

/** The event's year, in UTC like the other helpers. */
export function eventYear(date: string) {
  return String(parseEventDate(date).getUTCFullYear());
}
