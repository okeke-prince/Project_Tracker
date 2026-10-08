// Messages the sign-in form shows. Shared so the form can tell which one it got.
export const AUTH_MESSAGES = {
  invalid: "Invalid email or password.",
  unverified: "Confirm your email address first. We sent you a link when you signed up.",
  suspended: "This account has been suspended.",
  rateLimited: "Too many sign-in attempts. Wait 15 minutes and try again.",
  unknown: "Something went wrong.",
} as const;
