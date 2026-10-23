// =========================================================
// LUMILEX AI — GEMMA CLOUD ADAPTIVE LEARNING CLIENT
// Client utility to request and display Gemma Cloud recommendations
// following lesson checkpoints and practice sessions.
// =========================================================

const BASE_REC_KEY = "lumilex_gemma_recommendation_v1";

function recKey(userId) {
  return userId ? `${BASE_REC_KEY}_${userId}` : BASE_REC_KEY;
}

export function getCachedRecommendation(userId = null) {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(recKey(userId));
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function saveCachedRecommendation(recommendation, userId = null) {
  if (typeof window === "undefined" || !recommendation) return;
  try {
    localStorage.setItem(recKey(userId), JSON.stringify(recommendation));
    window.dispatchEvent(new Event("storage"));
  } catch (e) {}
}

/**
 * Requests an adaptive learning recommendation from Gemma Cloud via the backend.
 * Uses checkpoints (session completion) to prevent excessive API calls.
 */
export async function requestAdaptiveRecommendation({
  currentLevel = 1,
  accuracy = 0,
  correctCount = 0,
  totalQuestions = 0,
  skillsExercised = [],
  speechTranscript = "",
  expectedPassage = "",
  trickyItems = [],
  completedSessions = 0,
  userId = null,
}) {
  try {
    const response = await fetch("http://localhost:5000/api/learning/adaptive-recommendation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        currentLevel,
        accuracy,
        correctCount,
        totalQuestions,
        skillsExercised,
        speechTranscript,
        expectedPassage,
        trickyItems,
        completedSessions,
      }),
    });

    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}`);
    }

    const data = await response.json();
    if (data.recommendation) {
      saveCachedRecommendation(data.recommendation, userId);
    }
    return data;
  } catch (err) {
    console.warn("Gemma adaptive recommendation client notice:", err.message);
    const cached = getCachedRecommendation(userId);
    if (cached) {
      return { success: true, recommendation: cached, isCached: true };
    }
    return null;
  }
}

/**
 * Retrieves the authenticated child's latest recommendation from PostgreSQL.
 */
export async function fetchLatestRecommendation(userId = null) {
  try {
    const response = await fetch("http://localhost:5000/api/learning/adaptive-recommendation", {
      credentials: "include",
    });

    if (!response.ok) return getCachedRecommendation(userId);

    const data = await response.json();
    if (data.recommendation) {
      saveCachedRecommendation(data.recommendation, userId);
      return data.recommendation;
    }
    return getCachedRecommendation(userId);
  } catch (err) {
    return getCachedRecommendation(userId);
  }
}
