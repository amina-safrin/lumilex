// =========================================================
// LUMILEX DYSLEXIA ERROR TRACKER & ADAPTIVE DIFFICULTY ENGINE
// - Per-child isolation: Scoped by userId from PostgreSQL
// - Tracks specific letters, words, and sounds the individual child struggles with
// - Generates personalized practice sessions targeting those errors
// - Adapts lesson intensity based on real-time mastery
// - Syncs to PostgreSQL backend (/api/learning) with offline fallback
// =========================================================

const BASE_ERROR_STORAGE_KEY = "lumilex_child_errors_v1";

function errorKey(userId) {
  return userId ? `${BASE_ERROR_STORAGE_KEY}_${userId}` : BASE_ERROR_STORAGE_KEY;
}

const defaultErrorState = () => ({
  mistakes: {}, // key: itemIdentifier -> { count, lastSeen, category, questionData, mastered }
  streakDays: 1,
  lastPracticeDate: new Date().toISOString().split("T")[0],
  perfectLessonsCount: 0,
  gems: 10,
  recentAccuracies: [],
});

export function getErrorTrackerState(userId = null) {
  if (typeof window === "undefined") return defaultErrorState();
  try {
    const raw = localStorage.getItem(errorKey(userId));
    return raw ? { ...defaultErrorState(), ...JSON.parse(raw) } : defaultErrorState();
  } catch (e) {
    return defaultErrorState();
  }
}

export function saveErrorTrackerState(state, userId = null) {
  if (typeof window === "undefined") return state;
  try {
    localStorage.setItem(errorKey(userId), JSON.stringify(state));
  } catch (e) {}
  return state;
}

/**
 * Record a mistake on a specific question/letter/word for this child
 */
export function recordChildMistake(question, levelId, userId = null) {
  const state = getErrorTrackerState(userId);
  const key = question.letter || question.answer || question.prompt.slice(0, 30);
  const category = identifyCategory(question);

  const prev = state.mistakes[key] || {
    key,
    count: 0,
    levelId,
    category,
    questionData: question,
    mastered: false,
    history: [],
  };

  prev.count += 1;
  prev.lastSeen = new Date().toISOString();
  prev.mastered = false;
  prev.history.push({ correct: false, date: new Date().toISOString() });

  state.mistakes[key] = prev;
  saveErrorTrackerState(state, userId);

  // Sync to PostgreSQL database in background
  if (typeof window !== "undefined") {
    fetch("http://localhost:5000/api/learning/mistake", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        itemKey: key,
        levelId,
        category,
        questionData: question,
      }),
    }).catch((err) => console.warn("Background mistake sync skipped:", err.message));
  }

  return state;
}

/**
 * Record success on a question (reduces error weight if previously tricky)
 */
export function recordChildSuccess(question, levelId, userId = null) {
  const state = getErrorTrackerState(userId);
  const key = question.letter || question.answer || question.prompt.slice(0, 30);

  if (state.mistakes[key]) {
    state.mistakes[key].history.push({ correct: true, date: new Date().toISOString() });
    // If answered correctly 2 times in a row, mark as mastered!
    const recent = state.mistakes[key].history.slice(-2);
    if (recent.length >= 2 && recent.every((h) => h.correct)) {
      state.mistakes[key].mastered = true;
    }
  }

  saveErrorTrackerState(state, userId);

  // Sync to PostgreSQL database in background
  if (typeof window !== "undefined") {
    fetch("http://localhost:5000/api/learning/success", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ itemKey: key }),
    }).catch((err) => console.warn("Background success sync skipped:", err.message));
  }

  return state;
}

/**
 * Categorize error for dyslexia-tailored scaffolding
 */
function identifyCategory(question) {
  if (question.type === "compound") return "compound_word";
  if (["B", "D", "P", "Q"].includes(question.letter || question.answer)) return "letter_reversal";
  if (question.blendParts) return "sound_blending";
  if (question.family) return "rhyme_family";
  return "phoneme_sound";
}

/**
 * Get tricky items for targeted review game sessions for this child
 */
export function getTrickyItems(levelId = null, userId = null) {
  const state = getErrorTrackerState(userId);
  const allTricky = Object.values(state.mistakes).filter((m) => !m.mastered && m.count > 0);

  if (levelId) {
    return allTricky.filter((m) => m.levelId === levelId);
  }
  return allTricky.sort((a, b) => b.count - a.count);
}

/**
 * Complete a lesson & check for Perfect Lesson reward
 */
export function completeLessonSession({ accuracy, levelId, mistakesCount, userId = null }) {
  const state = getErrorTrackerState(userId);
  const today = new Date().toISOString().split("T")[0];

  // Update streak
  if (state.lastPracticeDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    if (state.lastPracticeDate === yesterday) {
      state.streakDays += 1;
    } else {
      state.streakDays = 1;
    }
    state.lastPracticeDate = today;
  }

  // Track recent accuracy to adapt difficulty
  state.recentAccuracies.push(accuracy);
  if (state.recentAccuracies.length > 5) {
    state.recentAccuracies.shift();
  }

  const isPerfect = accuracy === 100 && mistakesCount === 0;
  if (isPerfect) {
    state.perfectLessonsCount += 1;
    state.gems += 5; // Bonus gems for perfection!
  } else {
    state.gems += 1;
  }

  saveErrorTrackerState(state, userId);

  // Sync to PostgreSQL in background
  if (typeof window !== "undefined") {
    fetch("http://localhost:5000/api/learning/complete-lesson", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ accuracy, mistakesCount }),
    }).catch((err) => console.warn("Background lesson sync skipped:", err.message));
  }

  return {
    isPerfect,
    gemsEarned: isPerfect ? 5 : 1,
    streakDays: state.streakDays,
    totalGems: state.gems,
    perfectLessonsCount: state.perfectLessonsCount,
    intensity: getAdaptiveIntensity(state),
  };
}

/**
 * Adaptive intensity level:
 * - 'supported': adds extra picture hints & slower audio if accuracy < 70%
 * - 'standard': balanced practice (70% - 88%)
 * - 'boost': richer challenges if accuracy >= 90%
 */
export function getAdaptiveIntensity(state = getErrorTrackerState()) {
  const recents = state?.recentAccuracies || [];
  if (!recents || recents.length === 0) return "standard";

  const avg = recents.reduce((a, b) => a + b, 0) / recents.length;
  if (avg >= 90) return "boost";
  if (avg < 70) return "supported";
  return "standard";
}
