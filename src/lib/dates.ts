export function formatEventDate(date: string) {
  // Plain YYYY-MM-DD dates are calendar days; parse them as UTC so they don't shift a day.
  const d = /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T00:00:00Z`) : new Date(date);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
}
