import type { CandidateSearchInput } from "./candidate-types";

type FitmentCandidate = {
  vendor?: string;
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

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

function evaluateYearText(text: string, targetYear: number) {
  const ranges = extractYearRanges(text);

  if (ranges.length > 0) {
    return ranges.some((r) => targetYear >= r.start && targetYear <= r.end);
  }

  const years = extractStandaloneYears(text);
  if (years.length > 0) {
    return years.includes(targetYear);
  }

  return null;
}

function getModelLocalSegments(text: string, model: string) {
  const normalizedText = normalize(text);
  const normalizedModel = normalize(model);

  if (!normalizedText || !normalizedModel) return [];

  const pattern = new RegExp(`\\b${escapeRegex(normalizedModel)}\\b`, "gi");
  const segments: string[] = [];
  const radius = 60;

  for (const match of normalizedText.matchAll(pattern)) {
    const index = match.index ?? -1;
    if (index < 0) continue;

    const start = Math.max(0, index - radius);
    const end = Math.min(normalizedText.length, index + normalizedModel.length + radius);
    segments.push(normalizedText.slice(start, end));
  }

  return segments;
}

function yearLooksCompatible(text: string, model: string, targetYear: number) {
  const normalizedText = normalize(text);

  const modelLocalSegments = getModelLocalSegments(normalizedText, model);
  let sawModelLocalYearEvidence = false;

  for (const segment of modelLocalSegments) {
    const segmentResult = evaluateYearText(segment, targetYear);
    if (segmentResult === true) return true;
    if (segmentResult === false) sawModelLocalYearEvidence = true;
  }

  if (sawModelLocalYearEvidence) return false;

  return evaluateYearText(normalizedText, targetYear);
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
  const matches =
    raw.match(
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

function isEngineSensitivePart(partType: string) {
  const p = normalize(partType);

  return (
    p.includes("alternator") ||
    p.includes("starter") ||
    p.includes("ac compressor") ||
    p.includes("compressor") ||
    p.includes("ignition coil") ||
    p.includes("ignition coils") ||
    p.includes("fuel pump") ||
    p.includes("water pump")
  );
}

function hasConfirmedFit(text: string) {
  return (
    contains(text, "confirmed fit") ||
    contains(text, "this fits your") ||
    contains(text, "amazonconfirmedfit") ||
    contains(text, "fitmentconfirmed=true")
  );
}

function hasCannotConfirmFit(text: string) {
  return (
    contains(text, "cannot confirm fit") ||
    contains(text, "does not fit") ||
    contains(text, "this does not fit") ||
    contains(text, "not fit") ||
    contains(text, "cannotconfirmfit=true")
  );
}

function hasRequiredPartTypeText(text: string, partType: string) {
  const p = normalize(partType);

  if (p.includes("alternator")) {
    return contains(text, "alternator");
  }

  if (p.includes("starter")) {
    return containsAny(text, ["starter", "starter motor"]);
  }

  if (p.includes("brake pad")) {
    return containsAny(text, ["brake pad", "brake pads"]);
  }

  if (p.includes("rotor")) {
    return containsAny(text, ["rotor", "rotors"]);
  }

  if (p.includes("fuel tank")) {
    return containsAny(text, ["fuel tank", "gas tank"]);
  }

  return contains(text, p);
}

function hasWrongPartTypeSignals(text: string, partType: string) {
  const p = normalize(partType);

  if (p.includes("alternator")) {
    return (
      (containsAny(text, ["voltage regulator", "brush"]) &&
        !contains(text, "alternator")) ||
      (contains(text, "starter") && !contains(text, "alternator"))
    );
  }

  if (p.includes("starter")) {
    return contains(text, "alternator");
  }

  if (p.includes("brake pad")) {
    return containsAny(text, ["shoe", "rotor only", "caliper"]);
  }

  if (p.includes("rotor")) {
    return containsAny(text, ["pad only", "shoe", "caliper"]);
  }

  if (p.includes("fuel tank")) {
    return containsAny(text, [
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
    ]);
  }

  return false;
}

function isPreferredSupplierCandidate(text: string) {
  return (
    contains(text, "sellerstore=logel") ||
    contains(text, "sellerstore=logels") ||
    contains(text, "sellerstore=logel's") ||
    contains(text, "preferredsupplier=true") ||
    contains(text, "visit the logel") ||
    contains(text, "logel's auto parts store") ||
    contains(text, "logels auto parts store")
  );
}

export function explainCandidateFailure(
  input: CandidateSearchInput,
  candidate: FitmentCandidate
): string[] {
  const text = normalize(`${candidate.title ?? ""} ${candidate.rawText ?? ""}`);
  const reasons: string[] = [];

  const yearCompatibility = yearLooksCompatible(text, input.model, input.year);
  const engineCompatibility = engineLooksCompatible(text, input.engine ?? "");
  const confirmedFit = hasConfirmedFit(text);
  const cannotConfirmFit = hasCannotConfirmFit(text);
  const refMatches = matchingReferenceCount(input, candidate);

  if (cannotConfirmFit) reasons.push("negative_fit_signal");
  if (!contains(text, input.make)) reasons.push("make_missing");
  if (!contains(text, input.model)) reasons.push("model_missing");
  if (!hasRequiredPartTypeText(text, input.partType)) reasons.push("part_type_missing");
  if (hasWrongPartTypeSignals(text, input.partType)) reasons.push("wrong_part_type_terms");

  if (yearCompatibility === false) reasons.push("year_mismatch");

  if (isEngineSensitivePart(input.partType) && engineCompatibility === false) {
    reasons.push("engine_mismatch");
  }

  if (yearCompatibility !== true && !confirmedFit && refMatches === 0) {
    reasons.push("year_not_confirmed");
  }

  if (
    isEngineSensitivePart(input.partType) &&
    engineCompatibility !== true &&
    refMatches === 0 &&
    !confirmedFit
  ) {
    reasons.push("engine_not_confirmed");
  }

  return [...new Set(reasons)];
}

export function candidatePassesHardFitment(
  input: CandidateSearchInput,
  candidate: FitmentCandidate
) {
  const text = normalize(`${candidate.title ?? ""} ${candidate.rawText ?? ""}`);

  const yearCompatibility = yearLooksCompatible(text, input.model, input.year);
  const engineCompatibility = engineLooksCompatible(text, input.engine ?? "");
  const confirmedFit = hasConfirmedFit(text);
  const cannotConfirmFit = hasCannotConfirmFit(text);
  const refMatches = matchingReferenceCount(input, candidate);

  if (cannotConfirmFit) return false;
  if (!contains(text, input.make)) return false;
  if (!contains(text, input.model)) return false;
  if (!hasRequiredPartTypeText(text, input.partType)) return false;
  if (hasWrongPartTypeSignals(text, input.partType)) return false;

  if (yearCompatibility === false) return false;

  if (isEngineSensitivePart(input.partType) && engineCompatibility === false) {
    return false;
  }

  if (yearCompatibility === true) {
    if (!isEngineSensitivePart(input.partType)) return true;
    if (engineCompatibility === true) return true;
  }

  if (refMatches > 0) {
    if (!isEngineSensitivePart(input.partType)) return true;
    return engineCompatibility !== false;
  }

  if (confirmedFit) {
    if (!isEngineSensitivePart(input.partType)) return true;
    return engineCompatibility !== false;
  }

  return false;
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
  if (input.engine && contains(text, input.engine)) score += 15;

  const yearCompatibility = yearLooksCompatible(text, input.model, input.year);
  if (yearCompatibility === true) score += 30;
  else if (yearCompatibility === false) score -= 260;
  else score -= 20;

  const engineCompatibility = engineLooksCompatible(text, input.engine ?? "");
  if (isEngineSensitivePart(input.partType)) {
    if (engineCompatibility === true) score += 20;
    else if (engineCompatibility === false) score -= 180;
    else score -= 20;
  }

  const p = normalize(input.partType);

  if (p.includes("alternator")) {
    if (contains(text, "alternator")) score += 40;

    if (
      containsAny(text, ["voltage regulator", "brush"]) &&
      !contains(text, "alternator")
    ) {
      score -= 180;
    }

    if (contains(text, "starter") && !contains(text, "alternator")) {
      score -= 180;
    }
  }

  if (p.includes("starter")) {
    if (containsAny(text, ["starter", "starter motor"])) score += 40;
    if (contains(text, "alternator")) score -= 160;
  }

  if (p.includes("brake pad")) {
    if (containsAny(text, ["brake pad", "brake pads"])) score += 35;
    if (containsAny(text, ["rotor only", "shoe", "caliper"])) score -= 80;
  }

  if (p.includes("rotor")) {
    if (containsAny(text, ["rotor", "rotors"])) score += 35;
    if (containsAny(text, ["pad only", "shoe", "caliper"])) score -= 80;
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

  if (contains(text, "fits")) score += 6;
  if (contains(text, "compatible")) score += 4;
  if (contains(text, "replacement")) score += 3;

  if (hasConfirmedFit(text)) score += 35;
  if (contains(text, "cannot confirm fit")) score -= 80;
  if (contains(text, "does not fit")) score -= 150;
  if (contains(text, "this does not fit")) score -= 150;

  if (candidate.inStock === true) score += 5;
  if (candidate.inStock === false) score -= 10;
  if (candidate.priceCents !== null && candidate.priceCents !== undefined) {
    score += 5;
  }

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

  if (isPreferredSupplierCandidate(text)) {
    score += 120;
  }

  const refMatches = matchingReferenceCount(input, candidate);
  if (refMatches > 0) {
    score += refMatches * 80;
  }

  return score;
}