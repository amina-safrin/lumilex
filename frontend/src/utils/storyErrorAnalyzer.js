// =========================================================
// LUMILEX STORY READING ERROR ANALYZER
// Compares expected story text against Whisper audio transcript:
// - Catches substituted/replaced words (e.g. said "crown" instead of "brown")
// - Catches pronunciation/dyslexia letter reversals (e.g. b/d, p/q)
// - Catches omitted/skipped words
// - Extracts high-priority tricky words for Gemma Cloud practice
// =========================================================

function normalize(token) {
  if (!token) return "";
  return String(token)
    .toLowerCase()
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035']/g, "")
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036"]/g, "")
    .replace(/[\u2013\u2014\-–—]/g, "")
    .replace(/[.,!?;:()[\]{}…*~_`#/\\]/g, "")
    .trim();
}

function levenshtein(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

export function isDyslexiaMatch(spoken, expected) {
  if (!spoken || !expected) return false;
  const s = normalize(spoken);
  const e = normalize(expected);
  if (!s || !e) return false;
  if (s === e) return true;

  // 1. Common dyslexia letter transpositions check (b <-> d, p <-> q, m <-> w)
  const normS = s.replace(/d/g, "b").replace(/q/g, "p").replace(/w/g, "m");
  const normE = e.replace(/d/g, "b").replace(/q/g, "p").replace(/w/g, "m");
  if (normS === normE) return true;

  // 2. Inflection endings
  const strip = (w) => w.replace(/(ing|tion|sion|ed|er|est|ly|es|s)$/i, "");
  const stemS = strip(s);
  const stemE = strip(e);
  if (stemS && stemE && stemS === stemE) return true;

  // 3. Edit distance
  const dist = levenshtein(s, e);
  if (e.length <= 3 && dist <= 1) return true;
  if (e.length > 3 && dist <= 2) return true;
  if (e.length >= 4 && (s.startsWith(e) || e.startsWith(s))) return true;

  return false;
}

// Stop words we prefer not to prioritize as "tricky words" unless nothing else exists
const COMMON_TRIVIAL_WORDS = new Set([
  "a", "an", "the", "in", "on", "at", "to", "of", "and", "is", "it", "he", "she", "his", "her"
]);

/**
 * Analyzes full story reading against Whisper transcript.
 * Returns accuracy, recognized words, caught substitutions, and priority tricky words.
 */
export function analyzeStoryReadingErrors({
  storyWords = [],
  spokenTranscript = "",
  readWordIndexes = [],
}) {
  const readSet = new Set(readWordIndexes || []);
  const spokenTokens = (spokenTranscript || "")
    .split(/\s+/)
    .map(normalize)
    .filter((tok) => tok && !["um", "uh", "hmm", "er", "ah"].includes(tok));

  const totalWords = storyWords.length;
  if (totalWords === 0) {
    return {
      accuracy: 100,
      wordsReadCount: 0,
      totalWords: 0,
      errors: [],
      trickyWords: [],
      substitutions: [],
      omissions: [],
    };
  }

  const substitutions = [];
  const omissions = [];
  const trickyWordsSet = new Set();
  let correctCount = 0;

  // Align story words with spoken tokens
  let spokenCursor = 0;

  for (let i = 0; i < storyWords.length; i++) {
    const item = storyWords[i];
    const expected = normalize(item.word);
    const wasMarkedRead = readSet.has(item.uniqueIndex);

    // Look ahead in spoken tokens
    let foundIndex = -1;
    const windowEnd = Math.min(spokenCursor + 12, spokenTokens.length);

    for (let j = spokenCursor; j < windowEnd; j++) {
      if (isDyslexiaMatch(spokenTokens[j], expected)) {
        foundIndex = j;
        break;
      }
    }

    if (foundIndex !== -1 || wasMarkedRead) {
      correctCount++;
      if (foundIndex !== -1) {
        // If child spoke words before finding this expected word, those could be substitutions
        if (foundIndex > spokenCursor) {
          const insertedSpoken = spokenTokens.slice(spokenCursor, foundIndex);
          if (insertedSpoken.length > 0 && !COMMON_TRIVIAL_WORDS.has(expected)) {
            substitutions.push({
              type: "substitution",
              expected: item.word,
              spoken: insertedSpoken.join(" "),
              context: getSurroundingContext(storyWords, i),
            });
            trickyWordsSet.add(expected);
          }
        }
        spokenCursor = foundIndex + 1;
      }
    } else {
      // Word was skipped or misread
      if (!COMMON_TRIVIAL_WORDS.has(expected) && expected.length > 2) {
        omissions.push({
          type: "omission",
          expected: item.word,
          spoken: spokenTokens[spokenCursor] || "unsaid",
          context: getSurroundingContext(storyWords, i),
        });
        trickyWordsSet.add(expected);
      }
    }
  }

  // Calculate final accuracy (tolerant to reading flow)
  const accuracy = Math.min(100, Math.max(10, Math.round((correctCount / totalWords) * 100)));

  // If no tricky words detected (e.g. perfect reading), pick 2-3 longest story words for fun challenger practice
  let priorityTricky = Array.from(trickyWordsSet);
  if (priorityTricky.length === 0) {
    priorityTricky = storyWords
      .map((w) => normalize(w.word))
      .filter((w) => w.length >= 4 && !COMMON_TRIVIAL_WORDS.has(w))
      .slice(0, 3);
  }

  const allErrors = [...substitutions, ...omissions];

  return {
    accuracy,
    wordsReadCount: correctCount,
    totalWords,
    errors: allErrors,
    substitutions,
    omissions,
    trickyWords: priorityTricky.slice(0, 5),
  };
}

function getSurroundingContext(words, index) {
  const start = Math.max(0, index - 2);
  const end = Math.min(words.length, index + 3);
  return words.slice(start, end).map((w) => w.word).join(" ");
}
