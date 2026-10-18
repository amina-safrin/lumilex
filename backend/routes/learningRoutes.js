const express = require("express");
const pool = require("../db");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

// =========================================================
// GET /api/learning/state
// Returns individual learning progress, streak, gems, theme & tricky items
// for the authenticated child (via req.user.id)
// =========================================================
router.get("/state", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Fetch or initialize learning progress
    let progressRes = await pool.query(
      `SELECT stars, current_level, garden_points, completed_stories, completed_sessions, badges, levels
       FROM learning_progress WHERE user_id = $1`,
      [userId]
    );

    if (progressRes.rows.length === 0) {
      const init = await pool.query(
        `INSERT INTO learning_progress (user_id, stars, current_level, garden_points, completed_stories, completed_sessions, badges, levels)
         VALUES ($1, 0, 1, 0, 0, 0, '[]'::jsonb, '{}'::jsonb)
         RETURNING stars, current_level, garden_points, completed_stories, completed_sessions, badges, levels`,
        [userId]
      );
      progressRes = init;
    }

    // 2. Fetch or initialize preferences & error tracker stats
    let prefRes = await pool.query(
      `SELECT theme, streak_days, last_practice_date, perfect_lessons, gems, recent_accuracies
       FROM child_preferences WHERE user_id = $1`,
      [userId]
    );

    if (prefRes.rows.length === 0) {
      const today = new Date().toISOString().split("T")[0];
      const initPref = await pool.query(
        `INSERT INTO child_preferences (user_id, theme, streak_days, last_practice_date, perfect_lessons, gems, recent_accuracies)
         VALUES ($1, 'forest', 1, $2, 0, 10, '[]'::jsonb)
         RETURNING theme, streak_days, last_practice_date, perfect_lessons, gems, recent_accuracies`,
        [userId, today]
      );
      prefRes = initPref;
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
    const pref = prefRes.rows[0];

    return res.json({
      userId,
      progress: {
        stars: progress.stars,
        currentLevel: progress.current_level,
        gardenPoints: progress.garden_points,
        completedStories: progress.completed_stories,
        completedSessions: progress.completed_sessions,
        badges: progress.badges || [],
        levels: progress.levels || {},
      },
      preferences: {
        theme: pref.theme || "forest",
        streakDays: pref.streak_days || 1,
        lastPracticeDate: pref.last_practice_date,
        perfectLessonsCount: pref.perfect_lessons || 0,
        gems: pref.gems || 10,
        recentAccuracies: pref.recent_accuracies || [],
      },
      mistakes: mistakesMap,
    });
  } catch (error) {
    console.error("Error fetching child learning state:", error);
    return res.status(500).json({ message: "Failed to fetch learning state" });
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
    const prefRes = await pool.query(
      `SELECT streak_days, last_practice_date, perfect_lessons, gems, recent_accuracies
       FROM child_preferences WHERE user_id = $1`,
      [userId]
    );

    let streakDays = 1;
    let perfectLessons = 0;
    let gems = 10;
    let recentAccuracies = [];

    if (prefRes.rows.length > 0) {
      const row = prefRes.rows[0];
      streakDays = row.streak_days || 1;
      perfectLessons = row.perfect_lessons || 0;
      gems = row.gems || 10;
      recentAccuracies = row.recent_accuracies || [];

      if (row.last_practice_date !== today) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
        if (row.last_practice_date === yesterday) {
          streakDays += 1;
        } else {
          streakDays = 1;
        }
      }
    }

    recentAccuracies.push(Number(accuracy) || 0);
    if (recentAccuracies.length > 5) recentAccuracies.shift();

    const isPerfect = Number(accuracy) === 100 && Number(mistakesCount) === 0;
    if (isPerfect) {
      perfectLessons += 1;
      gems += 5;
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

    const validThemes = ["forest", "ocean", "space", "candy", "night"];
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

module.exports = router;
