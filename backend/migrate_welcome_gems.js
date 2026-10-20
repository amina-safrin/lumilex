require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const pool = require("./db");

async function run() {
  try {
    console.log("Checking and updating database schema for welcome gems & daily rewards...");

    // 1. Add welcome_reward_claimed column to child_preferences if not exists
    await pool.query(`
      ALTER TABLE child_preferences 
      ADD COLUMN IF NOT EXISTS welcome_reward_claimed BOOLEAN DEFAULT FALSE;
    `);

    // 2. Add last_daily_bonus_date column if not exists
    await pool.query(`
      ALTER TABLE child_preferences 
      ADD COLUMN IF NOT EXISTS last_daily_bonus_date VARCHAR(20);
    `);

    // 3. Ensure gems default is 0
    await pool.query(`
      ALTER TABLE child_preferences 
      ALTER COLUMN gems SET DEFAULT 0;
    `);

    // 4. Ensure streak_days default is 0
    await pool.query(`
      ALTER TABLE child_preferences 
      ALTER COLUMN streak_days SET DEFAULT 0;
    `);

    console.log("Database schema successfully updated!");
    process.exit(0);
  } catch (err) {
    console.error("Migration error:", err);
    process.exit(1);
  }
}

run();
