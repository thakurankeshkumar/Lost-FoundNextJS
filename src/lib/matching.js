const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "is", "are", "was", "were",
  "with", "for", "of", "in", "on", "at", "to", "my", "it",
  "this", "that", "near", "found", "lost", "item"
]);

function normalizeText(value = "") {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 1 && !STOP_WORDS.has(word));
}

function calculateTextSimilarity(reportA, reportB) {
  const wordsA = new Set(
    normalizeText(`${reportA.title} ${reportA.description}`)
  );

  const wordsB = new Set(
    normalizeText(`${reportB.title} ${reportB.description}`)
  );

  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  const intersection = [...wordsA].filter((word) => wordsB.has(word)).length;
  const union = new Set([...wordsA, ...wordsB]).size;

  return intersection / union;
}

function calculateDateScore(dateA, dateB) {
  const difference = Math.abs(
    new Date(dateA).getTime() - new Date(dateB).getTime()
  );

  const days = difference / (1000 * 60 * 60 * 24);

  if (days <= 1) return 15;
  if (days <= 3) return 12;
  if (days <= 7) return 9;
  if (days <= 14) return 6;
  if (days <= 30) return 3;

  return 0;
}

export function calculateMatch(reportA, reportB) {
  let score = 0;
  const reasons = [];

  if (reportA.category === reportB.category) {
    score += 30;
    reasons.push("Same item category");
  }

  const cityA = reportA.city?.trim().toLowerCase();
  const cityB = reportB.city?.trim().toLowerCase();

  if (cityA && cityB && cityA === cityB) {
    score += 25;
    reasons.push("Same city");
  }

  const similarity = calculateTextSimilarity(reportA, reportB);
  const textScore = Math.round(similarity * 30);

  if (textScore > 0) {
    score += textScore;
    reasons.push("Similar title or description");
  }

  const dateScore = calculateDateScore(
    reportA.incidentDate,
    reportB.incidentDate
  );

  if (dateScore > 0) {
    score += dateScore;
    reasons.push("Incident dates are close");
  }

  return {
    score: Math.min(score, 100),
    reasons,
  };
}
