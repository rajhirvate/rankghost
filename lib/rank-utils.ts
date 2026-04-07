export function normalizeDomain(domain: string) {
  return domain
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .toLowerCase();
}

export function extractRankFromApifyResults(
  data: unknown,
  targetDomain: string
): number | null {
  if (!Array.isArray(data)) {
    return null;
  }

  const normalizedTarget = normalizeDomain(targetDomain);

  for (const page of data) {
    const organicResults =
      page && typeof page === "object" && "organicResults" in page
        ? (page as { organicResults?: Array<{ url?: string }> }).organicResults
        : undefined;

    if (!organicResults || !Array.isArray(organicResults)) {
      continue;
    }

    for (let i = 0; i < organicResults.length; i += 1) {
      const item = organicResults[i];
      if (!item?.url) {
        continue;
      }

      const rankDomain = normalizeDomain(item.url);
      if (rankDomain.includes(normalizedTarget)) {
        return i + 1;
      }
    }
  }

  return null;
}
