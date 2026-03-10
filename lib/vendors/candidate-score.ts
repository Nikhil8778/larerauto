import type { CandidateSearchInput, VendorSearchCandidate } from "./candidate-types";

function has(text: string, value: string) {
  return text.includes(value.toLowerCase());
}

export function scoreCandidate(
  input: CandidateSearchInput,
  candidate: VendorSearchCandidate
) {
  const text = `${candidate.title} ${candidate.rawText ?? ""}`.toLowerCase();

  let score = 0;

  if (has(text, input.make)) score += 20;
  if (has(text, input.model)) score += 20;
  if (has(text, String(input.year))) score += 15;
  if (has(text, input.engine)) score += 20;

  const normalizedPart = input.partType.toLowerCase();
  if (has(text, normalizedPart)) score += 20;

  // Amazon badge bonus, but not final truth
  if (candidate.badge?.toLowerCase().includes("best seller")) score += 10;

  if (candidate.inStock === true) score += 5;
  if (candidate.priceCents !== null) score += 5;

  // Mild preference for cheaper items among valid matches
  if (candidate.priceCents !== null) {
    if (candidate.priceCents < 5000) score += 8;
    else if (candidate.priceCents < 15000) score += 6;
    else if (candidate.priceCents < 30000) score += 4;
    else score += 2;
  }

  // mismatch penalties
  const mismatchWords = [
    "universal",
    "accessory",
    "tool",
    "sticker",
    "shirt",
    "poster",
    "keychain",
    "for toy",
    "cover only",
    "kit only",
  ];

  for (const word of mismatchWords) {
    if (text.includes(word)) score -= 20;
  }

  return score;
}