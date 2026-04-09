export type PlanTier = "free" | "pro";

export type UserPlan = {
  plan: PlanTier;
};

export type ProjectDoc = {
  name: string;
  domain: string;
  createdAt: string;
};

export type KeywordDoc = {
  userId: string;
  keyword: string;
  currentRank: number | null;
  previousRank: number | null;
  rankChange: number | null;
  aiCitationStatus: "locked" | "not_found" | "cited";
  aiCited?: boolean;
  aiConfidence?: number;
  aiReason?: string;
  aiCheckedAt?: string;
  lastCheckedAt: string | null;
  createdAt: string;
};
