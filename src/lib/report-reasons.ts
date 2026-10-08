export const REPORT_REASONS = {
  impersonation: "Pretending to be someone else",
  copyright: "Uses someone else's work without permission",
  harassment: "Harassment or hateful content",
  spam: "Spam or misleading",
  other: "Something else",
} as const;

export type ReportReason = keyof typeof REPORT_REASONS;
