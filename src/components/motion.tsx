"use client";

import type { ReactNode } from "react";
import { MotionConfig } from "framer-motion";

/** Wrap the app once so every animation respects the OS "reduce motion" setting. */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
