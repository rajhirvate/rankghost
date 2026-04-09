const PRO_OVERRIDE_EMAILS = new Set(["rajhirvate@gmail.com"]);

export function getEffectivePlan(basePlan: "free" | "pro", email?: string | null) {
  if (email && PRO_OVERRIDE_EMAILS.has(email.toLowerCase())) {
    return "pro";
  }

  return basePlan;
}
