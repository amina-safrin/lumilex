const pool = require("./db");

async function migrate() {
  const sql = `
  -- 1. Add latest_recommendation to learning_progress if not already present
  ALTER TABLE learning_progress 
  ADD COLUMN IF NOT EXISTS latest_recommendation JSONB DEFAULT NULL;

  -- 2. Create history table for adaptive recommendations
  CREATE TABLE IF NOT EXISTS adaptive_recommendations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES userss(id) ON DELETE CASCADE,
    level_id INTEGER,
    accuracy INTEGER,
    progression_decision VARCHAR(50),
    recommendation JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_adaptive_rec_user ON adaptive_recommendations(user_id, created_at DESC);
  `;

  try {
    await pool.query(sql);
    console.log("SUCCESS: Adaptive learning database migration completed successfully.");
    process.exit(0);
  } catch (err) {
    console.error("MIGRATION ERROR in migrate_adaptive.js:", err);
    process.exit(1);
  }
}

migrate();
