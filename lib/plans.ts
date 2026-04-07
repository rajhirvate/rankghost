import { PlanTier } from "@/lib/types";

export const PLAN_LIMITS: Record<PlanTier, { keywords: number; cooldownHours: number }> =
  {
    free: { keywords: 5, cooldownHours: 24 },
    pro: { keywords: 60, cooldownHours: 24 },
  };
