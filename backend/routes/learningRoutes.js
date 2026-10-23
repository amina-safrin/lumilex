const express = require("express");
const pool = require("../db");
const authenticateToken = require("../middleware/authMiddleware");
const gemmaAdaptiveService = require("../services/gemmaAdaptiveService");

const router = express.Router();

// =========================================================
// GET /api/learning/state
// Returns individual learning progress, streak, gems, theme & tricky items
// =========================================================
// GET /api/learning/state
// Returns individual learning progress, streak, gems, theme & tricky items
// for the authenticated child (via req.user.id)
// =========================================================
router.get("/state", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    // 1. Fetch or initialize learning progress (stars initially zero)
    let progressRes = await pool.query(
      `SELECT stars, current_level, garden_points, completed_stories, completed_sessions, badges, levels, latest_recommendation
       FROM learning_progress WHERE user_id = $1`,
      [userId]
    );

    if (progressRes.rows.length === 0) {
      const init = await pool.query(
        `INSERT INTO learning_progress (user_id, stars, current_level, garden_points, completed_stories, completed_sessions, badges, levels, latest_recommendation)
         VALUES ($1, 0, 1, 0, 0, 0, '[]'::jsonb, '{}'::jsonb, NULL)
         RETURNING stars, current_level, garden_points, completed_stories, completed_sessions, badges, levels, latest_recommendation`,
        [userId]
      );
      progressRes = init;
    }

    // 2. Fetch or initialize preferences (gems initially zero, streak 0 on day 1)
    let prefRes = await pool.query(
      `SELECT theme, streak_days, last_practice_date, last_daily_bonus_date, perfect_lessons, gems, recent_accuracies, welcome_reward_claimed
       FROM child_preferences WHERE user_id = $1`,
      [userId]
    );

    if (prefRes.rows.length === 0) {
      const initPref = await pool.query(
        `INSERT INTO child_preferences (user_id, theme, streak_days, last_practice_date, last_daily_bonus_date, perfect_lessons, gems, recent_accuracies, welcome_reward_claimed)
         VALUES ($1, 'forest', 0, NULL, NULL, 0, 0, '[]'::jsonb, FALSE)
         RETURNING theme, streak_days, last_practice_date, last_daily_bonus_date, perfect_lessons, gems, recent_accuracies, welcome_reward_claimed`,
        [userId]
      );
      prefRes = initPref;
    }

    const pref = prefRes.rows[0];

    // Evaluate active streak:
    // If last_practice_date is older than yesterday, the active streak has lapsed
    let activeStreak = pref.streak_days ?? 0;
    if (pref.last_practice_date && pref.last_practice_date !== today && pref.last_practice_date !== yesterday) {
      activeStreak = 0;
    }

    // Determine rewards:
    // 1. Welcome Gift: For newly created accounts (gems initially 0 until claimed)
    // 2. Daily Learning Reward: For coming to learn daily, just like the streak
    let welcomeReward = null;
    let dailyReward = null;

    if (!pref.welcome_reward_claimed) {
      welcomeReward = {
        available: true,
        type: "welcome",
        gems: 20,
        title: "Welcome to LumiLex! 🎉",
        subtitle: "New Explorer Gift",
        message: "We're so glad you joined! Here is your special Welcome Gift of 20 Star Gems to kickstart your reading journey.",
      };
    } else if (pref.last_daily_bonus_date !== today) {
      dailyReward = {
        available: true,
        type: "daily",
        gems: 5,
        streak: activeStreak,
        title: activeStreak > 0 ? "Daily Learning Streak! 🔥" : "Daily Learning Gift! 🌟",
        subtitle: activeStreak > 0 ? `${activeStreak}-Day Learning Streak` : "Daily Login Gift",
        message: activeStreak > 0
          ? `You came to learn today! Keep your ${activeStreak}-day learning streak glowing and claim your daily gems.`
          : `You showed up to learn today! Claim your daily star gems and start your learning streak.`,
      };
    }

    // 3. Fetch active mistakes for personalized practice sessions
    const mistakesRes = await pool.query(
      `SELECT item_key, level_id, category, mistake_count, mastered, question_data, history, last_seen
       FROM learning_mistakes WHERE user_id = $1
       ORDER BY mistake_count DESC, last_seen DESC`,
      [userId]
    );

    const mistakesMap = {};
    mistakesRes.rows.forEach((row) => {
      mistakesMap[row.item_key] = {
        key: row.item_key,
        count: row.mistake_count,
        levelId: row.level_id,
        category: row.category,
        questionData: row.question_data,
        mastered: row.mastered,
        history: row.history || [],
        lastSeen: row.last_seen,
      };
    });

    const progress = progressRes.rows[0];

    return res.json({
      userId,
      progress: {
        stars: progress.stars ?? 0,
        currentLevel: progress.current_level || 1,
        gardenPoints: progress.garden_points ?? 0,
        completedStories: progress.completed_stories ?? 0,
        completedSessions: progress.completed_sessions ?? 0,
        badges: progress.badges || [],
        levels: progress.levels || {},
        latestRecommendation: progress.latest_recommendation || null,
      },
      preferences: {
        theme: pref.theme || "forest",
        streakDays: activeStreak,
        lastPracticeDate: pref.last_practice_date,
        perfectLessonsCount: pref.perfect_lessons ?? 0,
        gems: pref.gems ?? 0,
        recentAccuracies: pref.recent_accuracies || [],
        welcomeRewardClaimed: pref.welcome_reward_claimed ?? false,
      },
      welcomeReward,
      dailyReward,
      mistakes: mistakesMap,
    });
  } catch (error) {
    console.error("Error fetching child learning state:", error);
    return res.status(500).json({ message: "Failed to fetch learning state" });
  }
});

// =========================================================
// POST /api/learning/claim-welcome-reward
// Claims the +20 gems welcome gift for newly created accounts
// =========================================================
router.post("/claim-welcome-reward", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split("T")[0];

    const prefRes = await pool.query(
      `SELECT gems, welcome_reward_claimed FROM child_preferences WHERE user_id = $1`,
      [userId]
    );

    let currentGems = 0;
    let alreadyClaimed = false;
    if (prefRes.rows.length > 0) {
      currentGems = prefRes.rows[0].gems ?? 0;
      alreadyClaimed = !!prefRes.rows[0].welcome_reward_claimed;
    }

    if (alreadyClaimed) {
      return res.json({
        alreadyClaimed: true,
        gems: currentGems,
        message: "Welcome gift already claimed!",
      });
    }

    const rewardGems = 20;
    const newGems = currentGems + rewardGems;

    await pool.query(
      `INSERT INTO child_preferences (user_id, gems, welcome_reward_claimed, last_daily_bonus_date, updated_at)
       VALUES ($1, $2, TRUE, $3, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id) DO UPDATE SET
         gems = EXCLUDED.gems,
         welcome_reward_claimed = TRUE,
         last_daily_bonus_date = EXCLUDED.last_daily_bonus_date,
         updated_at = CURRENT_TIMESTAMP`,
      [userId, newGems, today]
    );

    return res.json({
      success: true,
      gemsClaimed: rewardGems,
      totalGems: newGems,
    });
  } catch (error) {
    console.error("Error claiming welcome reward:", error);
    return res.status(500).json({ message: "Failed to claim welcome reward" });
  }
});

// =========================================================
// POST /api/learning/claim-daily-reward
// Claims the +5 gems daily reward for coming to learn daily
// =========================================================
router.post("/claim-daily-reward", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split("T")[0];

    const prefRes = await pool.query(
      `SELECT gems, last_daily_bonus_date FROM child_preferences WHERE user_id = $1`,
      [userId]
    );

    let currentGems = 0;
    let lastBonusDate = null;
    if (prefRes.rows.length > 0) {
      currentGems = prefRes.rows[0].gems ?? 0;
      lastBonusDate = prefRes.rows[0].last_daily_bonus_date;
    }

    if (lastBonusDate === today) {
      return res.json({
        alreadyClaimed: true,
        gems: currentGems,
        message: "Daily reward already claimed today!",
      });
    }

    const rewardGems = 5;
    const newGems = currentGems + rewardGems;

    await pool.query(
      `INSERT INTO child_preferences (user_id, gems, last_daily_bonus_date, updated_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id) DO UPDATE SET
         gems = EXCLUDED.gems,
         last_daily_bonus_date = EXCLUDED.last_daily_bonus_date,
         updated_at = CURRENT_TIMESTAMP`,
      [userId, newGems, today]
    );

    return res.json({
      success: true,
      gemsClaimed: rewardGems,
      totalGems: newGems,
    });
  } catch (error) {
    console.error("Error claiming daily reward:", error);
    return res.status(500).json({ message: "Failed to claim daily reward" });
  }
});

// =========================================================
// POST /api/learning/sync-progress
// Saves updated progress (stars, level, garden, sessions, badges, levels)
// =========================================================
router.post("/sync-progress", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { stars, currentLevel, gardenPoints, completedStories, completedSessions, badges, levels } = req.body;

    const result = await pool.query(
      `INSERT INTO learning_progress
       (user_id, stars, current_level, garden_points, completed_stories, completed_sessions, badges, levels, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id) DO UPDATE SET
         stars = EXCLUDED.stars,
         current_level = EXCLUDED.current_level,
         garden_points = EXCLUDED.garden_points,
         completed_stories = EXCLUDED.completed_stories,
         completed_sessions = EXCLUDED.completed_sessions,
         badges = EXCLUDED.badges,
         levels = EXCLUDED.levels,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [
        userId,
        stars || 0,
        currentLevel || 1,
        gardenPoints || 0,
        completedStories || 0,
        completedSessions || 0,
        JSON.stringify(badges || []),
        JSON.stringify(levels || {}),
      ]
    );

    return res.json({ success: true, progress: result.rows[0] });
  } catch (error) {
    console.error("Error saving learning progress:", error);
    return res.status(500).json({ message: "Failed to save progress" });
  }
});

// =========================================================
// POST /api/learning/mistake
// Records a mistake for the specific child
// =========================================================
router.post("/mistake", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemKey, levelId, category, questionData } = req.body;

    if (!itemKey) {
      return res.status(400).json({ message: "itemKey is required" });
    }

    const result = await pool.query(
      `INSERT INTO learning_mistakes (user_id, item_key, level_id, category, mistake_count, mastered, question_data, history, last_seen)
       VALUES ($1, $2, $3, $4, 1, FALSE, $5::jsonb, jsonb_build_array(jsonb_build_object('correct', false, 'date', CURRENT_TIMESTAMP)), CURRENT_TIMESTAMP)
       ON CONFLICT (user_id, item_key) DO UPDATE SET
         mistake_count = learning_mistakes.mistake_count + 1,
         mastered = FALSE,
         level_id = COALESCE(EXCLUDED.level_id, learning_mistakes.level_id),
         category = COALESCE(EXCLUDED.category, learning_mistakes.category),
         question_data = COALESCE(EXCLUDED.question_data, learning_mistakes.question_data),
         history = learning_mistakes.history || jsonb_build_object('correct', false, 'date', CURRENT_TIMESTAMP)::jsonb,
         last_seen = CURRENT_TIMESTAMP
       RETURNING *`,
      [userId, itemKey, levelId || 1, category || "phoneme_sound", JSON.stringify(questionData || {})]
    );

    return res.json({ success: true, mistake: result.rows[0] });
  } catch (error) {
    console.error("Error recording mistake:", error);
    return res.status(500).json({ message: "Failed to record mistake" });
  }
});

// =========================================================
// POST /api/learning/success
// Records a correct answer (marks mastered if 2 correct in row)
// =========================================================
router.post("/success", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemKey } = req.body;

    if (!itemKey) {
      return res.status(400).json({ message: "itemKey is required" });
    }

    const check = await pool.query(
      `SELECT id, history FROM learning_mistakes WHERE user_id = $1 AND item_key = $2`,
      [userId, itemKey]
    );

    if (check.rows.length > 0) {
      const history = check.rows[0].history || [];
      const newEntry = { correct: true, date: new Date().toISOString() };
      const updatedHistory = [...history, newEntry];
      const recent = updatedHistory.slice(-2);
      const isMastered = recent.length >= 2 && recent.every((h) => h.correct);

      await pool.query(
        `UPDATE learning_mistakes
         SET history = $1::jsonb, mastered = $2, last_seen = CURRENT_TIMESTAMP
         WHERE user_id = $3 AND item_key = $4`,
        [JSON.stringify(updatedHistory), isMastered, userId, itemKey]
      );
    }

    return res.json({ success: true });
  } catch (error) {
    console.error("Error recording success:", error);
    return res.status(500).json({ message: "Failed to record success" });
  }
});

// =========================================================
// POST /api/learning/complete-lesson
// Updates streak, gems, perfect lesson counts & recent accuracy
// =========================================================
router.post("/complete-lesson", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { accuracy, mistakesCount } = req.body;

    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    const prefRes = await pool.query(
      `SELECT streak_days, last_practice_date, perfect_lessons, gems, recent_accuracies
       FROM child_preferences WHERE user_id = $1`,
      [userId]
    );

    let streakDays = 0;
    let perfectLessons = 0;
    let gems = 0;
    let recentAccuracies = [];

    if (prefRes.rows.length > 0) {
      const row = prefRes.rows[0];
      streakDays = row.streak_days ?? 0;
      perfectLessons = row.perfect_lessons ?? 0;
      gems = row.gems ?? 0;
      recentAccuracies = row.recent_accuracies || [];

      if (row.last_practice_date !== today) {
        if (row.last_practice_date === yesterday) {
          // Returning on the consecutive second day (or subsequent consecutive days)
          streakDays += 1;
        } else {
          // First day ever or after a break: streak is 0 on the first day
          streakDays = 0;
        }
      }
    }

    recentAccuracies.push(Number(accuracy) || 0);
    if (recentAccuracies.length > 5) recentAccuracies.shift();

    const isPerfect = Number(accuracy) === 100 && Number(mistakesCount) === 0;
    if (isPerfect) {
      perfectLessons += 1;
      gems += 5; // Bonus gems for perfection!
    } else {
      gems += 1;
    }

    const updated = await pool.query(
      `INSERT INTO child_preferences (user_id, streak_days, last_practice_date, perfect_lessons, gems, recent_accuracies, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id) DO UPDATE SET
         streak_days = EXCLUDED.streak_days,
         last_practice_date = EXCLUDED.last_practice_date,
         perfect_lessons = EXCLUDED.perfect_lessons,
         gems = EXCLUDED.gems,
         recent_accuracies = EXCLUDED.recent_accuracies,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [userId, streakDays, today, perfectLessons, gems, JSON.stringify(recentAccuracies)]
    );

    return res.json({
      success: true,
      isPerfect,
      gemsEarned: isPerfect ? 5 : 1,
      streakDays,
      totalGems: gems,
      perfectLessonsCount: perfectLessons,
    });
  } catch (error) {
    console.error("Error completing lesson:", error);
    return res.status(500).json({ message: "Failed to record lesson completion" });
  }
});

// =========================================================
// POST /api/learning/theme
// Updates the child's comfort theme (forest, ocean, space, candy, night)
// =========================================================
router.post("/theme", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { theme } = req.body;

    const validThemes = ["forest", "ocean", "space", "candy"];
    const chosenTheme = validThemes.includes(theme) ? theme : "forest";

    const result = await pool.query(
      `INSERT INTO child_preferences (user_id, theme, updated_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id) DO UPDATE SET
         theme = EXCLUDED.theme,
         updated_at = CURRENT_TIMESTAMP
       RETURNING theme`,
      [userId, chosenTheme]
    );

    return res.json({ success: true, theme: result.rows[0].theme });
  } catch (error) {
    console.error("Error saving theme:", error);
    return res.status(500).json({ message: "Failed to save theme" });
  }
});

// =========================================================
// POST /api/learning/adaptive-recommendation
// Generates a structured Gemma Cloud recommendation for the authenticated child.
// Enforces deterministic progression and treats speech mismatches as potential variances.
// =========================================================
router.post("/adaptive-recommendation", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      currentLevel = 1,
      accuracy = 0,
      correctCount = 0,
      totalQuestions = 0,
      skillsExercised = [],
      speechTranscript = "",
      expectedPassage = "",
      trickyItems = [],
      completedSessions = 0,
    } = req.body;

    // 1. Fetch child profile for personalized friendly feedback
    let childName = "Reader";
    try {
      const profRes = await pool.query("SELECT child_name FROM child_profiles WHERE user_id = $1", [userId]);
      if (profRes.rows.length > 0 && profRes.rows[0].child_name) {
        childName = profRes.rows[0].child_name;
      }
    } catch (e) {
      // Non-fatal, fallback to generic
    }

    // 2. Fetch known tricky items from database if not supplied in body
    let activeTrickyKeys = Array.isArray(trickyItems) ? [...trickyItems] : [];
    if (activeTrickyKeys.length === 0) {
      try {
        const trickyRes = await pool.query(
          "SELECT item_key FROM learning_mistakes WHERE user_id = $1 AND mastered = FALSE ORDER BY mistake_count DESC LIMIT 5",
          [userId]
        );
        activeTrickyKeys = trickyRes.rows.map((r) => r.item_key);
      } catch (e) {}
    }

    // 3. Generate adaptive recommendation via Gemma Cloud / Ollama
    const result = await gemmaAdaptiveService.generateAdaptiveRecommendation({
      currentLevel: Number(currentLevel) || 1,
      accuracy: Number(accuracy) || 0,
      correctCount: Number(correctCount) || 0,
      totalQuestions: Number(totalQuestions) || 0,
      skillsExercised,
      speechTranscript: String(speechTranscript || ""),
      expectedPassage: String(expectedPassage || ""),
      trickyItems: activeTrickyKeys,
      completedSessions: Number(completedSessions) || 0,
    });

    // Replace child name placeholder if present
    if (result.recommendation && result.recommendation.encouragingFeedback) {
      result.recommendation.encouragingFeedback = result.recommendation.encouragingFeedback.replace(/the learner|the child/gi, childName);
    }

    // 4. Persist recommendation in learning_progress
    try {
      await pool.query(
        `UPDATE learning_progress
         SET latest_recommendation = $1::jsonb, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $2`,
        [JSON.stringify(result.recommendation), userId]
      );

      // Log into history table
      await pool.query(
        `INSERT INTO adaptive_recommendations (user_id, level_id, accuracy, progression_decision, recommendation)
         VALUES ($1, $2, $3, $4, $5::jsonb)`,
        [
          userId,
          Number(currentLevel) || 1,
          Number(accuracy) || 0,
          result.deterministicProgression.decision,
          JSON.stringify(result.recommendation),
        ]
      );
    } catch (dbErr) {
      console.warn("Failed to persist adaptive recommendation in DB:", dbErr.message);
    }

    return res.json({
      success: true,
      modelUsed: result.modelUsed,
      recommendation: result.recommendation,
      deterministicProgression: result.deterministicProgression,
      speechAnalysis: result.speechAnalysis,
      generatedAt: result.generatedAt,
    });
  } catch (error) {
    console.error("Adaptive recommendation route error:", error);
    return res.status(500).json({
      message: "Failed to generate adaptive recommendation",
      details: error.message,
    });
  }
});

// =========================================================
// GET /api/learning/adaptive-recommendation
// Retrieves the latest adaptive recommendation for the authenticated child.
// =========================================================
router.get("/adaptive-recommendation", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT latest_recommendation, current_level
       FROM learning_progress WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length > 0 && result.rows[0].latest_recommendation) {
      return res.json({
        success: true,
        hasRecommendation: true,
        recommendation: result.rows[0].latest_recommendation,
      });
    }

    // Check history table as secondary source
    const histResult = await pool.query(
      `SELECT recommendation, created_at
       FROM adaptive_recommendations
       WHERE user_id = $1
       ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );

    if (histResult.rows.length > 0) {
      return res.json({
        success: true,
        hasRecommendation: true,
        recommendation: histResult.rows[0].recommendation,
        createdAt: histResult.rows[0].created_at,
      });
    }

    // Default welcoming initial guidance
    const currentLvl = result.rows[0]?.current_level || 1;
    const defaultRec = gemmaAdaptiveService.generateDeterministicFallback({
      currentLevel: currentLvl,
      accuracy: 0,
      deterministicProgression: {
        decision: "advance",
        nextLevel: 1,
        suitableDifficulty: "standard",
        rationale: "Welcome! Start your quest at Level 1.",
      },
    });

    return res.json({
      success: true,
      hasRecommendation: false,
      recommendation: defaultRec,
    });
  } catch (error) {
    console.error("Error fetching latest adaptive recommendation:", error);
    return res.status(500).json({ message: "Failed to fetch recommendation" });
  }
});

// =========================================================
// POST /api/learning/story-reading-complete
// Records story reading completion, catches errors, invokes Gemma Cloud
// to create a tailored practice session, and updates personal account progress.
// =========================================================
router.post("/story-reading-complete", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      storyId,
      storyTitle = "Story Adventure",
      storyTopic = "General",
      accuracy = 100,
      wordsRead = 0,
      totalWords = 0,
      speechTranscript = "",
      expectedText = "",
      errors = [],
      trickyWords = [],
    } = req.body;

    // 1. Fetch child profile for personalization
    let childName = "Reader";
    try {
      const profRes = await pool.query(
        "SELECT child_name FROM child_profiles WHERE user_id = $1",
        [userId]
      );
      if (profRes.rows.length > 0 && profRes.rows[0].child_name) {
        childName = profRes.rows[0].child_name;
      }
    } catch (e) {}

    // 2. Generate customized Orton-Gillingham practice session with Gemma Cloud
    const gemmaResult = await gemmaAdaptiveService.generateStoryPracticeSession({
      storyTitle,
      storyTopic,
      expectedText,
      speechTranscript,
      identifiedErrors: errors,
      trickyWords,
      childName,
      accuracy,
    });

    const gemmaPractice = gemmaResult.practiceSession;

    // 3. Save into story_reading_sessions (isolated per user account)
    let savedSession = null;
    try {
      const insertRes = await pool.query(
        `INSERT INTO story_reading_sessions (
          user_id, story_id, story_title, accuracy, words_read, total_words,
          speech_transcript, errors, tricky_words, gemma_practice
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10::jsonb)
        RETURNING *`,
        [
          userId,
          storyId ? Number(storyId) : null,
          storyTitle,
          Number(accuracy) || 0,
          Number(wordsRead) || 0,
          Number(totalWords) || 0,
          String(speechTranscript || ""),
          JSON.stringify(errors || []),
          trickyWords || [],
          JSON.stringify(gemmaPractice),
        ]
      );
      savedSession = insertRes.rows[0];
    } catch (dbErr) {
      console.warn("Could not save to story_reading_sessions:", dbErr.message);
    }

    // 4. Update individual child's learning_progress (+3 stars, +15 garden points)
    try {
      await pool.query(
        `UPDATE learning_progress
         SET completed_stories = completed_stories + 1,
             stars = stars + 3,
             garden_points = garden_points + 15,
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $1`,
        [userId]
      );
    } catch (progErr) {
      console.warn("Could not increment completed_stories:", progErr.message);
    }

    // 5. Update learning_mistakes with tricky words caught during reading
    if (Array.isArray(trickyWords) && trickyWords.length > 0) {
      for (const word of trickyWords.slice(0, 5)) {
        const cleanWord = String(word).trim().toLowerCase();
        if (!cleanWord) continue;
        try {
          await pool.query(
            `INSERT INTO learning_mistakes (user_id, item_key, category, mistake_count, mastered, question_data, last_seen)
             VALUES ($1, $2, 'story_reading', 1, FALSE, $3::jsonb, CURRENT_TIMESTAMP)
             ON CONFLICT (user_id, item_key)
             DO UPDATE SET mistake_count = learning_mistakes.mistake_count + 1,
                           last_seen = CURRENT_TIMESTAMP`,
            [
              userId,
              cleanWord,
              JSON.stringify({
                source: "story_reading",
                storyTitle,
                word: cleanWord,
              }),
            ]
          );
        } catch (mistakeErr) {
          console.warn("Could not record story mistake:", mistakeErr.message);
        }
      }
    }

    return res.json({
      success: true,
      session: savedSession,
      gemmaPractice,
      starsEarned: 3,
      starsAwarded: 3,
      gardenPointsEarned: 15,
    });
  } catch (error) {
    console.error("Story reading complete route error:", error);
    return res.status(500).json({
      message: "Failed to process story reading completion",
      details: error.message,
    });
  }
});

// =========================================================
// GET /api/learning/story-practice-latest
// Retrieves the latest Gemma story-driven practice session for the account
// =========================================================
router.get("/story-practice-latest", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT id, story_id, story_title, accuracy, gemma_practice, completed_at
       FROM story_reading_sessions
       WHERE user_id = $1 AND gemma_practice IS NOT NULL
       ORDER BY completed_at DESC
       LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.json({
        hasPractice: false,
        message: "No story practice sessions found yet. Read a story to create one!",
      });
    }

    const row = result.rows[0];
    return res.json({
      hasPractice: true,
      sessionId: row.id,
      storyId: row.story_id,
      storyTitle: row.story_title,
      accuracy: row.accuracy,
      gemmaPractice: row.gemma_practice,
      completedAt: row.completed_at,
    });
  } catch (error) {
    console.error("Error fetching latest story practice:", error);
    return res.status(500).json({ message: "Failed to fetch story practice" });
  }
});

// =========================================================
// GET /api/learning/story-sessions
// Returns history of story readings for the authenticated user
// =========================================================
router.get("/story-sessions", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT id, story_id, story_title, accuracy, words_read, total_words, tricky_words, completed_at
       FROM story_reading_sessions
       WHERE user_id = $1
       ORDER BY completed_at DESC`,
      [userId]
    );

    return res.json({
      success: true,
      sessions: result.rows,
    });
  } catch (error) {
    console.error("Error fetching story sessions:", error);
    return res.status(500).json({ message: "Failed to fetch story sessions" });
  }
});

module.exports = router;

