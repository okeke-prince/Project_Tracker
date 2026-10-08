// Stand-in for @/lib/session. Tests pick who is signed in with signInAs() / signOutUser().
// Use it with: vi.mock("@/lib/session", () => import("../helpers/session"));

let currentUserId: string | null = null;

export function signInAs(userId: string | null) {
  currentUserId = userId;
}

export function signOutUser() {
  currentUserId = null;
}

export async function getCurrentUserId(): Promise<string | null> {
  return currentUserId;
}

export async function requireUserId(): Promise<string> {
  if (!currentUserId) throw new Error("redirect:/login");
  return currentUserId;
}

export async function getActionUserId(): Promise<string> {
  if (!currentUserId) throw new Error("You need to be signed in to do that.");
  return currentUserId;
}
