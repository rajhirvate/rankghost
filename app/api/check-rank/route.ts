import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { PLAN_LIMITS } from "@/lib/plans";
import { extractRankFromApifyResults } from "@/lib/rank-utils";
import { PlanTier } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

type Body = {
  keywordId?: string;
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

    const body = (await request.json()) as Body;
    if (!body.keywordId) {
      return NextResponse.json({ error: "keywordId is required." }, { status: 400 });
    }

    const keywordRef = adminDb.collection("keywords").doc(body.keywordId);
    const keywordSnap = await keywordRef.get();
    if (!keywordSnap.exists) {
      return NextResponse.json({ error: "Keyword not found." }, { status: 404 });
    }

    const keywordData = keywordSnap.data();
    if (!keywordData || keywordData.userId !== userId) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const userSnap = await adminDb.collection("users").doc(userId).get();
    const plan = ((userSnap.data()?.plan ?? "free") as PlanTier) || "free";
    const limit = PLAN_LIMITS[plan];

    if (keywordData.lastCheckedAt) {
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

    const apifyResponse = await fetch(
      `https://api.apify.com/v2/acts/apify~google-search-scraper/run-sync-get-dataset-items?token=${token}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          queries: keywordData.keyword,
          maxPagesPerQuery: 1,
          resultsPerPage: 10,
          languageCode: "en",
        }),
      }
    );

    if (!apifyResponse.ok) {
      return NextResponse.json(
        { error: "Apify request failed." },
        { status: apifyResponse.status }
      );
    }

    const apifyData = (await apifyResponse.json()) as unknown;
    const currentRank = extractRankFromApifyResults(apifyData, keywordData.domain);
    const previousRank =
      typeof keywordData.currentRank === "number" ? keywordData.currentRank : null;
    const rankChange =
      previousRank !== null && currentRank !== null ? previousRank - currentRank : null;

    await keywordRef.update({
      previousRank,
      currentRank,
      rankChange,
      aiCitationStatus: plan === "pro" ? "not_found" : "locked",
      lastCheckedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, currentRank, rankChange });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
