import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { PLAN_LIMITS } from "@/lib/plans";
import { getEffectivePlan } from "@/lib/pro-overrides";
import { getRootDomain } from "@/lib/rank-utils";
import { runSerpRankCheck } from "@/lib/serp-checks";
import { PlanTier } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const maxDuration = 300;

type Body = {
  projectId?: string;
  keywordId?: string;
};

type AiCitationPayload = {
  aiCited: boolean;
  aiResponse: string;
  aiConfidence: number;
  aiReason: string;
  aiCheckedAt: string;
  aiCitationStatus: "cited" | "not_found";
};

export async function POST(request: NextRequest) {
  try {
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();
    const authHeader = request.headers.get("authorization");
    const idToken = authHeader?.replace("Bearer ", "");
    if (!idToken) {
      return NextResponse.json({ error: "Missing auth token." }, { status: 401 });
    }

    const decoded = await adminAuth.verifyIdToken(idToken);
    const userId = decoded.uid;
    const authUser = await adminAuth.getUser(userId);
    const effectiveEmail = decoded.email ?? authUser.email ?? null;

    const body = (await request.json()) as Body;
    if (!body.projectId || !body.keywordId) {
      return NextResponse.json(
        { error: "projectId and keywordId are required." },
        { status: 400 }
      );
    }

    const projectRef = adminDb
      .collection("users")
      .doc(userId)
      .collection("projects")
      .doc(body.projectId);
    const projectSnap = await projectRef.get();
    if (!projectSnap.exists) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    const projectData = projectSnap.data();
    if (!projectData?.domain) {
      return NextResponse.json(
        { error: "Project domain is missing." },
        { status: 400 }
      );
    }

    const keywordRef = projectRef.collection("keywords").doc(body.keywordId);
    const keywordSnap = await keywordRef.get();
    if (!keywordSnap.exists) {
      return NextResponse.json({ error: "Keyword not found." }, { status: 404 });
    }

    const keywordData = keywordSnap.data();
    if (!keywordData || keywordData.userId !== userId) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const userSnap = await adminDb.collection("users").doc(userId).get();
    const storedPlan = ((userSnap.data()?.plan ?? "free") as PlanTier) || "free";
    const plan = getEffectivePlan(storedPlan, effectiveEmail) as PlanTier;
    const limit = PLAN_LIMITS[plan];
    const skipCooldownForUser =
      effectiveEmail?.toLowerCase() === "rajhirvate@gmail.com";

    if (!skipCooldownForUser && keywordData.lastCheckedAt) {
      const previousCheck = new Date(keywordData.lastCheckedAt).getTime();
      const minWaitMs = limit.cooldownHours * 60 * 60 * 1000;
      const elapsed = Date.now() - previousCheck;
      if (elapsed < minWaitMs) {
        return NextResponse.json(
          {
            error: `Check available in ${Math.ceil(
              (minWaitMs - elapsed) / (60 * 60 * 1000)
            )} hour(s).`,
          },
          { status: 429 }
        );
      }
    }

    const token = process.env.APIFY_API_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: "APIFY_API_TOKEN is not configured." },
        { status: 500 }
      );
    }

    const currentRank = await runSerpRankCheck(
      token,
      keywordData.keyword as string,
      projectData.domain as string
    );
    const previousRank =
      typeof keywordData.currentRank === "number" ? keywordData.currentRank : null;
    const rankChange =
      previousRank !== null && currentRank !== null ? previousRank - currentRank : null;
    const nowIso = new Date().toISOString();
    let aiPayload: AiCitationPayload | null = null;

    if (plan === "pro") {
      try {
        const openAiKey = process.env.OPENAI_API_KEY;
        if (!openAiKey) {
          throw new Error("OPENAI_API_KEY not configured.");
        }

        const openai = new OpenAI({ apiKey: openAiKey });
        const targetDomain = getRootDomain(String(projectData.domain));
        const keyword = String(keywordData.keyword);

        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are an AI search visibility analyst. When asked about a keyword and domain, assess whether the domain would likely be cited by AI search engines like ChatGPT, Perplexity, or Google AI Overviews. Base your assessment on topical relevance, domain authority signals, and content expertise. Respond with JSON only — no markdown, no explanation outside the JSON.",
            },
            {
              role: "user",
              content: `Keyword: "${keyword}"\nDomain: "${targetDomain}"\n\nWould this domain likely appear as a cited source when someone searches this keyword on an AI search engine?\n\nRespond with this exact JSON format:\n{"cited": true, "confidence": 85, "reason": "brief explanation"}`,
            },
          ],
          temperature: 0,
        });

        const raw = completion.choices[0]?.message?.content ?? "";
        const firstBrace = raw.indexOf("{");
        const lastBrace = raw.lastIndexOf("}");
        const jsonStr =
          firstBrace !== -1 && lastBrace !== -1
            ? raw.slice(firstBrace, lastBrace + 1)
            : raw;

        const parsed = JSON.parse(jsonStr) as {
          cited?: unknown;
          confidence?: unknown;
          reason?: unknown;
        };

        const aiCited = Boolean(parsed.cited);
        const aiConfidence =
          typeof parsed.confidence === "number" ? parsed.confidence : 0;
        const aiReason =
          typeof parsed.reason === "string"
            ? parsed.reason
            : aiCited
              ? "Domain likely cited."
              : "Domain not likely cited.";

        aiPayload = {
          aiCited,
          aiResponse: raw,
          aiConfidence,
          aiReason,
          aiCheckedAt: nowIso,
          aiCitationStatus: aiCited ? "cited" : "not_found",
        };
      } catch (openAiError) {
        console.error("[ai-citation]", openAiError);
        aiPayload = {
          aiCited: false,
          aiResponse: "",
          aiConfidence: 0,
          aiReason: "Check failed",
          aiCheckedAt: nowIso,
          aiCitationStatus: "not_found",
        };
      }
    }

    await keywordRef.update({
      previousRank,
      currentRank,
      rankChange,
      aiCitationStatus:
        plan === "pro"
          ? aiPayload?.aiCitationStatus ?? "not_found"
          : "locked",
      lastCheckedAt: nowIso,
      updatedAt: nowIso,
      ...(aiPayload ?? {}),
    });

    await keywordRef.collection("history").add({
      rank: currentRank,
      checkedAt: nowIso,
    });

    return NextResponse.json({ ok: true, currentRank, rankChange });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
