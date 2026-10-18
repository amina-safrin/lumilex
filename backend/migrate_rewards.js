require("dotenv").config();
const pool = require("./db");

async function migrate() {
  try {
    console.log("Starting rewards & streak migration...");

    // 1. Add last_daily_bonus_date column if not exists
    await pool.query(`
      ALTER TABLE child_preferences 
      ADD COLUMN IF NOT EXISTS last_daily_bonus_date VARCHAR(20);
    `);

    // 2. Change column defaults: streak_days -> 0, gems -> 0
    await pool.query(`
      ALTER TABLE child_preferences 
      ALTER COLUMN streak_days SET DEFAULT 0;
    `);

    await pool.query(`
      ALTER TABLE child_preferences 
      ALTER COLUMN gems SET DEFAULT 0;
    `);

    // 3. For any accounts that have 0 practice sessions or created today with no history, set streak to 0
    await pool.query(`
      UPDATE child_preferences
      SET streak_days = 0
      WHERE user_id IN (
        SELECT user_id FROM learning_progress WHERE completed_sessions = 0
      ) OR streak_days = 1 AND last_practice_date = CURRENT_DATE::text AND (
        SELECT completed_sessions FROM learning_progress WHERE learning_progress.user_id = child_preferences.user_id
      ) <= 1;
    `);

    // 4. Ensure all users in learning_progress with no completed stories/sessions have stars = 0
    await pool.query(`
      UPDATE learning_progress
      SET stars = 0
      WHERE completed_stories = 0 AND completed_sessions = 0;
    `);

    console.log("Migration completed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Migration error:", err);
    process.exit(1);
  }
}

migrate();
