import { PlanTier } from "@/lib/types";

export const PLAN_LIMITS: Record<PlanTier, { keywords: number; cooldownHours: number }> =
  {
    free:    { keywords: 10,        cooldownHours: 168 },
    starter: { keywords: 100,       cooldownHours: 24  },
    pro:     { keywords: 500,       cooldownHours: 24  },
    agency:  { keywords: 2000,       cooldownHours: 24  },
  };
