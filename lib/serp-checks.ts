import { extractRankFromApifyResults } from "@/lib/rank-utils";

const APIFY_ACTOR = "apify~google-search-scraper";
const APIFY_BASE = "https://api.apify.com/v2/acts";

async function runApifyActor(
  token: string,
  input: Record<string, unknown>
): Promise<unknown> {
  const url = `${APIFY_BASE}/${APIFY_ACTOR}/run-sync-get-dataset-items?token=${token}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(
      `Apify actor failed with status ${response.status}: ${await response.text()}`
    );
  }

  return response.json();
}

export async function runSerpRankCheck(
  token: string,
  keyword: string,
  targetDomain: string
): Promise<number | null> {
  const data = await runApifyActor(token, {
    queries: keyword,
    maxPagesPerQuery: 10,
    resultsPerPage: 10,
    countryCode: "us",
    languageCode: "en",
  });

  return extractRankFromApifyResults(data, targetDomain);
}
