export const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$/;

// Profiles live at the site root (/<username>), so names that clash with app routes,
// or that would look official, are off limits.
export const RESERVED = new Set([
  "admin", "api", "app", "about", "auth", "books", "concepts", "dashboard", "help", "home",
  "login", "logout", "manage", "me", "privacy", "profile", "projects", "read", "register",
  "settings", "signin", "signup", "support", "terms", "u", "uploads",
]);

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

