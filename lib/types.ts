export type PlanTier = "free" | "pro";

export type UserPlan = {
  plan: PlanTier;
};

export type KeywordDoc = {
  userId: string;
  keyword: string;
  domain: string;
  currentRank: number | null;
  previousRank: number | null;
  rankChange: number | null;
  aiCitationStatus: "locked" | "not_found" | "cited";
  lastCheckedAt: string | null;
  createdAt: string;
};
