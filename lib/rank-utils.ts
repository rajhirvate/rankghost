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

/**
 * Parse results from apify/google-search-scraper.
 * Each dataset item has an organicResults array.
 * Each organic result has a url field.
 * Returns 1-based position of the first match, or null if not in top 100.
 */
export function extractRankFromApifyResults(
  data: unknown,
  targetDomain: string
): number | null {
  if (!Array.isArray(data)) {
    return null;
  }

  const normalizedTarget = getRootDomain(targetDomain);
  let position = 0;

  for (const page of data) {
    if (!page || typeof page !== "object") {
      continue;
    }

    const organicResults = (page as { organicResults?: Array<{ url?: string }> })
      .organicResults;

    if (!Array.isArray(organicResults)) {
      continue;
    }

    for (const item of organicResults) {
      if (!item?.url) {
        continue;
      }

      position += 1;

      if (getRootDomain(item.url) === normalizedTarget) {
        return position;
      }
    }
  }

  return null;
}
