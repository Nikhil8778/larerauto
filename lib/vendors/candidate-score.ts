import type { CandidateSearchInput } from "./candidate-types";

type FitmentCandidate = {
  title?: string | null;
  rawText?: string | null;
  badge?: string | null;
  inStock?: boolean | null;
  priceCents?: number | null;
  referenceNumbers?: string[];
};

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function contains(text: string, value: string) {
  return text.includes(normalize(value));
}

function containsAny(text: string, values: string[]) {
  return values.some((v) => text.includes(normalize(v)));
}

function extractRating(text: string) {
  const m = text.match(/rating:\s*([0-9.]+)/i);
  if (!m) return null;

  const value = Number(m[1]);
  return Number.isFinite(value) ? value : null;
}

function extractReviewCount(text: string) {
  const m = text.match(/reviews:\s*([\d,]+)/i);
  if (!m) return null;

  const value = Number(m[1].replace(/,/g, ""));
  return Number.isFinite(value) ? value : null;
}

function extractYearRanges(text: string) {
  const normalized = normalize(text);
  const matches = [
    ...normalized.matchAll(/\b((?:19|20)\d{2})\s*[-–]\s*((?:19|20)\d{2})\b/g),
  ];

  return matches
    .map((m) => {
      const start = Number(m[1]);
      const end = Number(m[2]);

      if (!Number.isFinite(start) || !Number.isFinite(end)) return null;

      return {
        start: Math.min(start, end),
        end: Math.max(start, end),
      };
    })
    .filter((v): v is { start: number; end: number } => v !== null);
}

function extractStandaloneYears(text: string) {
  const normalized = normalize(text);
  return [...new Set((normalized.match(/\b(?:19|20)\d{2}\b/g) ?? []).map(Number))];
}

function yearLooksCompatible(text: string, targetYear: number) {
  const ranges = extractYearRanges(text);

  if (ranges.length > 0) {
    const insideAnyRange = ranges.some(
      (r) => targetYear >= r.start && targetYear <= r.end
    );
    return insideAnyRange;
  }

  const years = extractStandaloneYears(text);
  if (years.length > 0) {
    return years.includes(targetYear);
  }

  return null;
}

function extractLiterToken(value: string) {
  const normalized = normalize(value);
  const match = normalized.match(/\d+(?:\.\d+)?l/);
  return match ? match[0] : null;
}

function engineLooksCompatible(text: string, engine: string) {
  const normalizedText = normalize(text);
  const normalizedEngine = normalize(engine);

  if (!normalizedEngine) return null;

  if (normalizedText.includes(normalizedEngine)) return true;

  const targetLiter = extractLiterToken(normalizedEngine);
  if (!targetLiter) return null;

  const litersInText = normalizedText.match(/\d+(?:\.\d+)?l/g) ?? [];
  if (litersInText.length === 0) return null;

  return litersInText.some((item) => item === targetLiter);
}

function normalizeRef(value: string) {
  return value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

function extractReferenceNumbersFromText(text: string) {
  const raw = text ?? "";
  const matches = raw.match(
    /\b[A-Z0-9]{2,6}-[A-Z0-9]{2,6}-?[A-Z0-9]{0,6}\b|\b[A-Z]{1,4}\d{4,8}[A-Z]?\b|\b\d{5}-\d{5}\b|\b\d{5,10}[A-Z]?\b/gi
  ) ?? [];

  const cleaned = matches
    .map((m) => normalizeRef(m))
    .filter((m) => m.length >= 5);

  return [...new Set(cleaned)];
}

function candidateReferenceNumbers(candidate: FitmentCandidate) {
  const explicit = (candidate.referenceNumbers ?? []).map(normalizeRef);
  const extracted = extractReferenceNumbersFromText(
    `${candidate.title ?? ""} ${candidate.rawText ?? ""}`
  );
  return [...new Set([...explicit, ...extracted])];
}

function matchingReferenceCount(
  input: CandidateSearchInput,
  candidate: FitmentCandidate
) {
  const targetRefs = (input.referenceNumbers ?? []).map(normalizeRef);
  if (targetRefs.length === 0) return 0;

  const candidateRefs = candidateReferenceNumbers(candidate);
  if (candidateRefs.length === 0) return 0;

  const set = new Set(candidateRefs);
  return targetRefs.filter((r) => set.has(r)).length;
}

export function candidatePassesHardFitment(
  input: CandidateSearchInput,
  candidate: FitmentCandidate
) {
  const text = normalize(`${candidate.title ?? ""} ${candidate.rawText ?? ""}`);

  const yearCompatibility = yearLooksCompatible(text, input.year);
  if (yearCompatibility === false) return false;

  const engineCompatibility = engineLooksCompatible(text, input.engine ?? "");
  const partType = normalize(input.partType);

  const skipEngineHardReject =
    partType.includes("rotor") ||
    partType.includes("brake pad") ||
    partType.includes("fuel tank");

  if (engineCompatibility === false && !skipEngineHardReject) {
    return false;
  }

  if (!contains(text, input.make)) return false;
  if (!contains(text, input.model)) return false;

  if (contains(text, "cannot confirm fit")) return false;
  if (contains(text, "does not fit")) return false;
  if (contains(text, "this does not fit")) return false;

  if (partType.includes("alternator")) {
    if (!contains(text, "alternator")) return false;
    if (
      containsAny(text, [
        "regulator",
        "voltage regulator",
        "brush",
        "starter",
      ])
    ) {
      return false;
    }
  }

  if (partType.includes("starter")) {
    if (!containsAny(text, ["starter", "starter motor"])) return false;
    if (contains(text, "alternator")) return false;
  }

  if (partType.includes("brake pad")) {
    if (!containsAny(text, ["brake pad", "brake pads"])) return false;
    if (containsAny(text, ["shoe", "rotor only", "caliper"])) return false;
  }

  if (partType.includes("rotor")) {
    if (!containsAny(text, ["rotor", "rotors"])) return false;
    if (containsAny(text, ["pad only", "shoe", "caliper"])) return false;
  }

  if (partType.includes("fuel tank")) {
    if (!containsAny(text, ["fuel tank", "gas tank"])) return false;
    if (
      containsAny(text, [
        "fuel cap",
        "gas cap",
        "filler",
        "filler neck",
        "strap",
        "sensor",
        "pressure sensor",
        "level sensor",
        "pump",
        "sending unit",
        "reservoir",
        "coolant",
      ])
    ) {
      return false;
    }
  }

  return true;
}

export function scoreCandidate(
  input: CandidateSearchInput,
  candidate: FitmentCandidate
) {
  const title = normalize(candidate.title ?? "");
  const raw = normalize(candidate.rawText ?? "");
  const text = `${title} ${raw}`;

  let score = 0;

  if (contains(text, input.make)) score += 20;
  if (contains(text, input.model)) score += 24;
  if (input.engine && contains(text, input.engine)) score += 10;

  const yearCompatibility = yearLooksCompatible(text, input.year);
  if (yearCompatibility === true) score += 20;
  else if (yearCompatibility === false) score -= 160;

  const engineCompatibility = engineLooksCompatible(text, input.engine ?? "");
  if (engineCompatibility === true) score += 12;
  else if (engineCompatibility === false) score -= 100;

  const p = normalize(input.partType);

  if (p.includes("alternator")) {
    if (contains(text, "alternator")) score += 40;
    if (containsAny(text, ["regulator", "voltage regulator", "brush", "starter"])) {
      score -= 140;
    }
  }

  if (p.includes("starter")) {
    if (containsAny(text, ["starter", "starter motor"])) score += 40;
    if (contains(text, "alternator")) score -= 120;
  }

  if (p.includes("brake pad")) {
    if (containsAny(text, ["brake pad", "brake pads"])) score += 35;
    if (containsAny(text, ["rotor only", "shoe", "caliper"])) score -= 60;
  }

  if (p.includes("rotor")) {
    if (containsAny(text, ["rotor", "rotors"])) score += 35;
    if (containsAny(text, ["pad only", "shoe", "caliper"])) score -= 60;
  }

  if (p.includes("fuel tank")) {
    if (containsAny(text, ["fuel tank", "gas tank"])) score += 40;
    if (
      containsAny(text, [
        "fuel cap",
        "gas cap",
        "filler",
        "filler neck",
        "strap",
        "sensor",
        "pressure sensor",
        "level sensor",
        "pump",
        "sending unit",
        "reservoir",
        "coolant",
      ])
    ) {
      score -= 180;
    }
  }

  if (contains(text, "fits")) score += 4;
  if (contains(text, "compatible")) score += 4;
  if (contains(text, "replacement")) score += 3;

  if (contains(text, "confirmed fit")) score += 10;
  if (contains(text, "cannot confirm fit")) score -= 40;
  if (contains(text, "does not fit")) score -= 80;
  if (contains(text, "this does not fit")) score -= 80;

  if (candidate.inStock === true) score += 5;
  if (candidate.inStock === false) score -= 10;
  if (candidate.priceCents !== null && candidate.priceCents !== undefined) score += 5;

  const rating = extractRating(candidate.rawText ?? "");
  const reviewCount = extractReviewCount(candidate.rawText ?? "");

  if (rating !== null) {
    if (rating >= 4.5) score += 15;
    else if (rating >= 4.0) score += 10;
    else if (rating >= 3.5) score += 4;
    else score -= 12;
  }

  if (reviewCount !== null) {
    if (reviewCount >= 100) score += 15;
    else if (reviewCount >= 30) score += 10;
    else if (reviewCount >= 10) score += 5;
    else if (reviewCount <= 2) score -= 5;
  }

  if ((candidate.badge ?? "").toLowerCase().includes("best seller")) {
    score += 10;
  }

  const refMatches = matchingReferenceCount(input, candidate);
  if (refMatches > 0) {
    score += refMatches * 60;
  }

  return score;
}