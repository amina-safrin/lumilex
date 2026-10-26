// =========================================================
// LUMILEX STORY READING ERROR ANALYZER
// Compares expected story text against child reading:
// - Phonetic & dyslexia-tolerant letter matching (b/d, p/q, m/w reversals)
// - Catches correctly read words, misread words, and skipped words
// - Distinguishes confirmed skipped words from unread words
// - Extracts high-priority tricky words for Gemma practice
// =========================================================

export function normalizeWord(token) {
  if (!token) return "";
  return String(token)
    .toLowerCase()
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035']/g, "")
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036"]/g, "")
    .replace(/[\u2013\u2014\-–—]/g, "")
    .replace(/[.,!?;:()[\]{}…*~_`#/\\]/g, "")
    .trim();
}

export function levenshteinDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= a.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a.charAt(i - 1) === b.charAt(j - 1)) {
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
  return matrix[a.length][b.length];
}

/**
 * Confident, dyslexia-friendly word matcher.
 * - Confirms exact word matches.
 * - Tolerates common mirror letter reversals (b/d, p/q, m/w, n/u).
 * - Matches child inflection variations (only when base stem >= 3 chars).
 * - Matches number words ("1" <-> "one").
 * - STRICT FOR SHORT WORDS (<= 3 chars): Rejects arbitrary Levenshtein distance 1
 *   (e.g., "cat" vs "bat", "he" vs "the", "in" vs "on" are distinct words).
 * - Allows minor pronunciation variation on medium/long words (length >= 4)
 *   ONLY if the initial letter matches.
 */
export function isConfidentDyslexiaMatch(spoken, expected) {
  if (!spoken || !expected) return false;
  const s = normalizeWord(spoken);
  const e = normalizeWord(expected);
  if (!s || !e) return false;

  // 1. Exact match
  if (s === e) return true;

  // 2. Common dyslexia mirror letter transpositions (b <-> d, p <-> q, m <-> w, n <-> u)
  const normS = s
    .replace(/d/g, "b")
    .replace(/q/g, "p")
    .replace(/w/g, "m")
    .replace(/u/g, "n");
  const normE = e
    .replace(/d/g, "b")
    .replace(/q/g, "p")
    .replace(/w/g, "m")
    .replace(/u/g, "n");
  if (normS === normE) return true;

  // 3. Child inflection matching (only when base stem >= 3 characters)
  const stripEndings = (w) => {
    if (w.length <= 3) return w;
    return w.replace(/(ing|tion|sion|ed|er|est|ly|es|s)$/i, "");
  };
  const stemS = stripEndings(s);
  const stemE = stripEndings(e);
  if (stemS.length >= 3 && stemE.length >= 3 && stemS === stemE) return true;

  // 4. Number words
  const NUM_WORDS = {
    "1": "one", "2": "two", "3": "three", "4": "four", "5": "five",
    "6": "six", "7": "seven", "8": "eight", "9": "nine", "10": "ten",
    "one": "1", "two": "2", "three": "3", "four": "4", "five": "5",
    "six": "6", "seven": "7", "eight": "8", "nine": "9", "ten": "10",
  };
  if (NUM_WORDS[s] === e || NUM_WORDS[e] === s) return true;

  // 5. Short words (length <= 3): Strict check!
  // Prevent "cat" matching "bat", "the" matching "he", "in" matching "on", etc.
  if (e.length <= 3) {
    return false;
  }

  // 6. Medium & Long words (length >= 4): allow distance <= 1 only if both initial and terminal characters match
  // This permits slight pronunciation variances (e.g. "fluter" <-> "flutter", "beutiful" <-> "beautiful")
  // while strictly rejecting actual word substitutions like "wimper" for "whisper" or "butter" for "flutter".
  const dist = levenshteinDistance(s, e);
  if (dist <= 1 && s[0] === e[0] && s[s.length - 1] === e[e.length - 1]) {
    return true;
  }

  return false;
}

// Backward compatibility
export const isDyslexiaMatch = isConfidentDyslexiaMatch;

// Common stop words deprioritized for tricky practice if substantive words exist
const COMMON_TRIVIAL_WORDS = new Set([
  "a", "an", "the", "in", "on", "at", "to", "of", "and", "is", "it", "he", "she", "his", "her"
]);

/**
 * Calculates star awards according to LumiLex accuracy tiers:
 * - 91%–100%: 3 stars
 * - 76%–90%:  2 stars
 * - 65%–75%:  1 star
 * - Below 65%: 0 stars (gentle encouragement)
 * Awarded only when reading is reliable.
 */
export function calculateReadingStars(accuracy, isReliable = true) {
  if (!isReliable || accuracy === null || accuracy === undefined || isNaN(accuracy)) {
    return 0;
  }
  const acc = Number(accuracy);
  if (acc >= 91) return 3;
  if (acc >= 76) return 2;
  if (acc >= 65) return 1;
  return 0;
}

/**
 * Robust sequential word-alignment engine.
 * Compares actual story tokens with the spoken transcript in order:
 * - Detects exact & dyslexia-friendly matches in sequence.
 * - Handles repeated words without colliding across sentences.
 * - Identifies skipped words (within lookahead gap) and misreads (substitutions).
 * - Distinguishes attempted words from unassessed/unread words (words past the child's reading position).
 * - Detects empty or unreliable transcripts without falsely claiming all words were wrong.
 */
export function alignTranscriptWithStory(storyWords = [], spokenTranscript = "") {
  const spokenTokens = String(spokenTranscript || "")
    .trim()
    .split(/\s+/)
    .map(normalizeWord)
    .filter((tok) => tok && !["um", "uh", "hmm", "er", "ah"].includes(tok));

  const totalWords = storyWords.length;
  if (totalWords === 0) {
    return {
      isReliable: false,
      reliabilityReason: "empty_story",
      accuracy: 100,
      starsAwarded: 0,
      wordsReadCount: 0,
      assessedWordsCount: 0,
      totalWords: 0,
      correctWords: [],
      incorrectWords: [],
      skippedWords: [],
      unassessedWords: [],
      errors: [],
      trickyWords: [],
    };
  }

  // 1. Unreliable / Empty Transcript Check
  // If the transcript is empty or has fewer than 2 tokens when the story has >= 5 words
  const isSpeechTooSparse = spokenTokens.length === 0 || (spokenTokens.length < 2 && totalWords >= 5);
  if (isSpeechTooSparse) {
    return {
      isReliable: false,
      reliabilityReason: spokenTokens.length === 0 ? "empty_transcript" : "insufficient_speech",
      accuracy: null,
      starsAwarded: 0,
      wordsReadCount: 0,
      assessedWordsCount: 0,
      totalWords,
      correctWords: [],
      incorrectWords: [],
      skippedWords: [],
      unassessedWords: storyWords.map((item) => (typeof item === "string" ? item : item.word)),
      errors: [],
      trickyWords: [],
      encouragingMessage: "LumiLex couldn't hear your voice clearly this time. Check your microphone and try reading out loud to LumiLex! 🎙️",
    };
  }

  const correctWords = [];
  const incorrectWords = [];
  const skippedWords = [];
  const trickyWordsSet = new Set();
  const matchedStoryIndices = new Set();

  let storyPtr = 0;
  let spokenPtr = 0;
  const LOOK_AHEAD_MAX = 3;

  while (spokenPtr < spokenTokens.length && storyPtr < storyWords.length) {
    const spoken = spokenTokens[spokenPtr];
    const currStory = storyWords[storyPtr];
    const storyWordStr = typeof currStory === "string" ? currStory : currStory.word;

    // A. Direct sequential match
    if (isConfidentDyslexiaMatch(spoken, storyWordStr)) {
      correctWords.push(storyWordStr);
      matchedStoryIndices.add(storyPtr);
      storyPtr++;
      spokenPtr++;
      continue;
    }

    // B. Lookahead in storyWords: did the child skip 1 to 3 words?
    let lookaheadStoryOffset = -1;
    for (let offset = 1; offset <= LOOK_AHEAD_MAX && (storyPtr + offset) < storyWords.length; offset++) {
      const aheadWord = typeof storyWords[storyPtr + offset] === "string"
        ? storyWords[storyPtr + offset]
        : storyWords[storyPtr + offset].word;
      if (isConfidentDyslexiaMatch(spoken, aheadWord)) {
        lookaheadStoryOffset = offset;
        break;
      }
    }

    if (lookaheadStoryOffset > 0) {
      // Mark intermediate skipped words
      for (let skipIdx = storyPtr; skipIdx < storyPtr + lookaheadStoryOffset; skipIdx++) {
        const skippedItem = storyWords[skipIdx];
        const skippedStr = typeof skippedItem === "string" ? skippedItem : skippedItem.word;
        skippedWords.push({
          word: skippedStr,
          expected: skippedStr,
          type: "skipped",
          context: getSurroundingContext(storyWords, skipIdx),
        });
        const norm = normalizeWord(skippedStr);
        if (!COMMON_TRIVIAL_WORDS.has(norm) || trickyWordsSet.size === 0) {
          trickyWordsSet.add(norm);
        }
      }

      // Mark the matched word
      const targetItem = storyWords[storyPtr + lookaheadStoryOffset];
      const targetStr = typeof targetItem === "string" ? targetItem : targetItem.word;
      correctWords.push(targetStr);
      matchedStoryIndices.add(storyPtr + lookaheadStoryOffset);

      storyPtr = storyPtr + lookaheadStoryOffset + 1;
      spokenPtr++;
      continue;
    }

    // C. Lookahead in spokenTokens: did the child repeat a word, stutter, or say a filler?
    let lookaheadSpokenOffset = -1;
    for (let sOffset = 1; sOffset <= 2 && (spokenPtr + sOffset) < spokenTokens.length; sOffset++) {
      if (isConfidentDyslexiaMatch(spokenTokens[spokenPtr + sOffset], storyWordStr)) {
        lookaheadSpokenOffset = sOffset;
        break;
      }
    }

    if (lookaheadSpokenOffset > 0) {
      // Child had a false start/filler word, then read the story word correctly!
      spokenPtr += lookaheadSpokenOffset;
      correctWords.push(storyWordStr);
      matchedStoryIndices.add(storyPtr);
      storyPtr++;
      spokenPtr++;
      continue;
    }

    // D. Misread / Substitution at current position
    incorrectWords.push({
      word: storyWordStr,
      expected: storyWordStr,
      spoken,
      type: "misread",
      context: getSurroundingContext(storyWords, storyPtr),
    });
    const norm = normalizeWord(storyWordStr);
    if (!COMMON_TRIVIAL_WORDS.has(norm) || trickyWordsSet.size === 0) {
      trickyWordsSet.add(norm);
    }
    storyPtr++;
    spokenPtr++;
  }

  // 2. Unassessed words: words remaining in the story that were never reached
  const unassessedWords = [];
  for (let i = storyPtr; i < storyWords.length; i++) {
    const unreadItem = storyWords[i];
    unassessedWords.push(typeof unreadItem === "string" ? unreadItem : unreadItem.word);
  }

  const assessedWordsCount = correctWords.length + incorrectWords.length + skippedWords.length;
  const isReliable = assessedWordsCount >= 1;
  const accuracy = isReliable
    ? Math.min(100, Math.max(0, Math.round((correctWords.length / assessedWordsCount) * 100)))
    : null;
  const starsAwarded = calculateReadingStars(accuracy, isReliable);

  let encouragingMessage = "Brave reading! Every adventure makes your reading stronger! 🌟";
  if (accuracy !== null) {
    if (accuracy >= 91) {
      encouragingMessage = "Outstanding reading! You mastered this story with flying colors! 🌟";
    } else if (accuracy >= 76) {
      encouragingMessage = "Great reading adventure! You're making wonderful progress! 🚀";
    } else if (accuracy >= 65) {
      encouragingMessage = "Good reading effort! Practicing tricky words will make your reading shine! 🌱";
    } else {
      encouragingMessage = "Brave effort reading! Every time you read with LumiLex, your superpowers grow! Let's practice together! 💚";
    }
  }

  const allErrors = [...incorrectWords, ...skippedWords];

  return {
    isReliable,
    reliabilityReason: isReliable ? "confirmed" : "insufficient_speech",
    accuracy,
    starsAwarded,
    wordsReadCount: correctWords.length,
    assessedWordsCount,
    totalWords,
    correctWords,
    incorrectWords,
    skippedWords,
    unassessedWords,
    errors: allErrors,
    substitutions: incorrectWords,
    omissions: skippedWords,
    trickyWords: Array.from(trickyWordsSet).slice(0, 5),
    encouragingMessage,
  };
}

/**
 * Analyzes full story reading results.
 * Tracks correct words, misread words, confirmed skipped words, and unassessed words.
 * Combines real-time word status map with full transcript sequence alignment.
 * Supports both named object arguments and positional arguments.
 */
export function analyzeStoryReadingErrors(inputOrStoryWords, maybeTranscript, maybeWordStatusMap, maybeReadWordIndexes) {
  let storyWords = [];
  let spokenTranscript = "";
  let wordStatusMap = {};
  let readWordIndexes = [];

  if (typeof inputOrStoryWords === "string") {
    // String story text passed
    const rawTokens = inputOrStoryWords.trim().split(/\s+/).filter(Boolean);
    storyWords = rawTokens.map((w, idx) => ({ word: w, uniqueIndex: idx }));
    spokenTranscript = typeof maybeTranscript === "string" ? maybeTranscript : "";
    wordStatusMap = maybeWordStatusMap || {};
    readWordIndexes = maybeReadWordIndexes || [];
  } else if (Array.isArray(inputOrStoryWords)) {
    // Array of words passed
    storyWords = inputOrStoryWords.map((item, idx) => {
      if (typeof item === "string") return { word: item, uniqueIndex: idx };
      return { word: item.word || String(item), uniqueIndex: item.uniqueIndex !== undefined ? item.uniqueIndex : idx };
    });
    spokenTranscript = typeof maybeTranscript === "string" ? maybeTranscript : "";
    wordStatusMap = maybeWordStatusMap || {};
    readWordIndexes = maybeReadWordIndexes || [];
  } else if (inputOrStoryWords && typeof inputOrStoryWords === "object") {
    // Named object passed
    if (typeof inputOrStoryWords.storyText === "string") {
      const rawTokens = inputOrStoryWords.storyText.trim().split(/\s+/).filter(Boolean);
      storyWords = rawTokens.map((w, idx) => ({ word: w, uniqueIndex: idx }));
    } else if (Array.isArray(inputOrStoryWords.storyWords)) {
      storyWords = inputOrStoryWords.storyWords.map((item, idx) => {
        if (typeof item === "string") return { word: item, uniqueIndex: idx };
        return { word: item.word || String(item), uniqueIndex: item.uniqueIndex !== undefined ? item.uniqueIndex : idx };
      });
    }
    spokenTranscript = inputOrStoryWords.spokenTranscript || "";
    wordStatusMap = inputOrStoryWords.wordStatusMap || {};
    readWordIndexes = inputOrStoryWords.readWordIndexes || [];
  }

  const totalWords = storyWords.length;
  if (totalWords === 0) {
    return {
      isReliable: false,
      accuracy: 100,
      starsAwarded: 0,
      wordsReadCount: 0,
      assessedWordsCount: 0,
      totalWords: 0,
      correctWords: [],
      incorrectWords: [],
      skippedWords: [],
      unreadWords: [],
      unassessedWords: [],
      errors: [],
      substitutions: [],
      omissions: [],
      trickyWords: [],
      encouragingMessage: "Story ready to read!",
    };
  }

  // Run sequence alignment against full transcript
  const alignment = alignTranscriptWithStory(storyWords, spokenTranscript);

  // If real-time wordStatusMap is provided, merge verified live successes
  const correctWordsSet = new Set(alignment.correctWords);
  const legacyReadSet = new Set(readWordIndexes || []);
  const hasWordStatusMap = wordStatusMap && Object.keys(wordStatusMap).length > 0;

  if (hasWordStatusMap || legacyReadSet.size > 0) {
    for (let i = 0; i < storyWords.length; i++) {
      const item = storyWords[i];
      const entry = wordStatusMap[item.uniqueIndex];
      const status = (typeof entry === "string" ? entry : entry?.status) || (legacyReadSet.has(item.uniqueIndex) ? "correct" : null);

      if (status === "correct" && !correctWordsSet.has(item.word)) {
        correctWordsSet.add(item.word);
        alignment.correctWords.push(item.word);
      }
    }
  }

  // Recalculate metrics if live status augmented the results
  const assessedWordsCount = alignment.correctWords.length + alignment.incorrectWords.length + alignment.skippedWords.length;
  const isReliable = alignment.isReliable || assessedWordsCount >= 1;
  const accuracy = isReliable && assessedWordsCount > 0
    ? Math.min(100, Math.max(0, Math.round((alignment.correctWords.length / assessedWordsCount) * 100)))
    : alignment.accuracy;
  const starsAwarded = calculateReadingStars(accuracy, isReliable);

  return {
    ...alignment,
    isReliable,
    accuracy,
    starsAwarded,
    wordsReadCount: alignment.correctWords.length,
    assessedWordsCount,
    totalWords,
    unreadWords: alignment.unassessedWords,
  };
}

function getSurroundingContext(words, index) {
  const start = Math.max(0, index - 2);
  const end = Math.min(words.length, index + 3);
  return words.slice(start, end).map((w) => (typeof w === "string" ? w : w.word)).join(" ");
}
