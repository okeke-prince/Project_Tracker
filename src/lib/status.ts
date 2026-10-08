/** "want-to-read" -> "Want to read", "in-progress" -> "In progress". */
export function statusLabel(status: string) {
  const text = status.replace(/-/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** "1 concept", "3 concepts". */
export function plural(count: number, word: string) {
  return `${count} ${count === 1 ? word : `${word}s`}`;
}
