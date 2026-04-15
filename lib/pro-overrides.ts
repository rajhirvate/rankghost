const PRO_OVERRIDE_EMAILS = new Set(["rajhirvate@gmail.com"]);

import { PlanTier } from "@/lib/types";

export function getEffectivePlan(basePlan: PlanTier, email?: string | null): PlanTier {
  if (email && PRO_OVERRIDE_EMAILS.has(email.toLowerCase())) {
    return "agency";
  }

  return basePlan;
}
