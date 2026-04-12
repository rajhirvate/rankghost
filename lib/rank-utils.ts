import { SerpResult } from "@/lib/types";

function getHostname(input: string): string {
  const trimmed = input.trim().toLowerCase();
  const withProtocol = /^https?:\/\//.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    return new URL(withProtocol).hostname;
  } catch {
    return trimmed
      .replace(/^https?:\/\//, "")
      .split("/")[0]
      .split("?")[0]
      .split("#")[0];
  }
}

export function getRootDomain(input: string): string {
  const hostname = getHostname(input).replace(/^www\./, "");
  const parts = hostname.split(".").filter(Boolean);

  if (parts.length <= 2) {
    return hostname;
  }

  return `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
}

function cleanDisplayUrl(url: string): string {
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    return (u.hostname + u.pathname).replace(/\/$/, "");
  } catch {
    return url;
  }
}

type ApifyOrganic = {
  url?: string;
  title?: string;
  description?: string;
  displayedUrl?: string;
};

export type RankCheckResult = {
  rank: number | null;
  topResults: SerpResult[];
};

/**
 * Parse results from apify/google-search-scraper.
 * Returns the 1-based rank of the target domain AND the top 10 organic results.
 */
export function extractRankAndResultsFromApifyData(
  data: unknown,
  targetDomain: string
): RankCheckResult {
  if (!Array.isArray(data)) {
    return { rank: null, topResults: [] };
  }

  const normalizedTarget = getRootDomain(targetDomain);
  let rank: number | null = null;
  let position = 0;
  const topResults: SerpResult[] = [];

  for (const page of data) {
    if (!page || typeof page !== "object") continue;

    const organicResults = (page as { organicResults?: ApifyOrganic[] })
      .organicResults;

    if (!Array.isArray(organicResults)) continue;

    for (const item of organicResults) {
      if (!item?.url) continue;

      position += 1;
      const isTarget = getRootDomain(item.url) === normalizedTarget;

      if (isTarget && rank === null) {
        rank = position;
      }

      if (topResults.length < 10) {
        topResults.push({
          position,
          title: item.title ?? item.url,
          url: item.url,
          displayUrl: item.displayedUrl ?? cleanDisplayUrl(item.url),
          snippet: item.description ?? "",
          isTarget,
        });
      }

      // Once we have top 10 AND found rank, no need to keep going
      if (topResults.length >= 10 && rank !== null) break;
    }

    if (topResults.length >= 10 && rank !== null) break;
  }

  return { rank, topResults };
}

/** Legacy wrapper — kept for any callers that only need the rank number */
export function extractRankFromApifyResults(
  data: unknown,
  targetDomain: string
): number | null {
  return extractRankAndResultsFromApifyData(data, targetDomain).rank;
}
