export const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$/;

// Paths under /u/ are free, but keep obviously confusing names out.
export const RESERVED = new Set(["admin", "api", "login", "logout", "register", "manage", "settings", "u"]);

export function normalizeUsername(raw: string): string {
  return raw.toLowerCase().trim().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 30);
}

export function validateUsername(username: string): string | null {
  if (!USERNAME_PATTERN.test(username)) {
    return "Usernames are 3-30 characters: lowercase letters, numbers and dashes.";
  }
  if (RESERVED.has(username)) return "That username is reserved.";
  return null;
}

