export const WAYFINDER_STOPWORDS = [
  "a", "am", "an", "and", "are", "as", "at", "be", "but", "by", "can", "do", "for", "from",
  "help", "how", "i", "if", "in", "is", "it", "looking", "me", "my", "need", "of", "on", "or",
  "our", "that", "the", "this", "to", "want", "we", "with", "you", "your",
] as const;

const stopwords = new Set<string>(WAYFINDER_STOPWORDS);

export type SearchableWayfinderPath = {
  id: string;
  label: string;
  keywords: string[];
  [key: string]: unknown;
};

export type IndexedWayfinderPath<T extends SearchableWayfinderPath = SearchableWayfinderPath> = T & {
  normalizedId: string;
  normalizedLabel: string;
  labelTerms: string[];
  keywordTerms: string[];
};

export function normalizeWayfinderText(value: string): string {
  return String(value ?? "").normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

export function wayfinderTerms(value: string, limit = 16): string[] {
  return [...new Set(normalizeWayfinderText(value).split(" ")
    .filter((term) => (term.length > 1 || /^\d$/.test(term)) && !stopwords.has(term)))].slice(0, limit);
}

export function indexWayfinderPaths<T extends SearchableWayfinderPath>(paths: T[]): IndexedWayfinderPath<T>[] {
  return paths.map((path) => ({
    ...path,
    normalizedId: normalizeWayfinderText(path.id),
    normalizedLabel: normalizeWayfinderText(path.label),
    labelTerms: wayfinderTerms(`${path.id} ${path.label}`, 64),
    keywordTerms: [...new Set(path.keywords.flatMap((keyword) => wayfinderTerms(keyword, 16)))],
  }));
}

export function rankWayfinderPaths<T extends SearchableWayfinderPath>(paths: T[], query: string, limit = 3): Array<{
  path: T;
  score: number;
  matchedTerms: string[];
}> {
  const normalized = normalizeWayfinderText(query);
  const queryTerms = wayfinderTerms(query);
  if (!normalized || !queryTerms.length) return [];

  return indexWayfinderPaths(paths).map((path) => {
    if (normalized === path.normalizedId) return { path, score: 1_100, matchedTerms: queryTerms };
    if (normalized === path.normalizedLabel) return { path, score: 1_000, matchedTerms: queryTerms };
    const labels = new Set(path.labelTerms);
    const keywords = new Set(path.keywordTerms);
    let score = 0;
    const matchedTerms: string[] = [];
    for (const term of queryTerms) {
      let matched = false;
      if (keywords.has(term)) { score += 16; matched = true; }
      if (labels.has(term)) { score += 11; matched = true; }
      if (matched) matchedTerms.push(term);
    }
    return { path, score, matchedTerms };
  }).filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || (a.path.label < b.path.label ? -1 : a.path.label > b.path.label ? 1 : 0))
    .slice(0, Math.max(1, limit));
}
