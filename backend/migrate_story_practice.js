const pool = require("./db");

async function migrate() {
  const sql = `
  -- 1. Create story_reading_sessions table for tracking each account's story readings and Gemma practice
  CREATE TABLE IF NOT EXISTS story_reading_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES userss(id) ON DELETE CASCADE,
    story_id INTEGER REFERENCES stories(id) ON DELETE CASCADE,
    story_title VARCHAR(255) NOT NULL,
    accuracy INTEGER NOT NULL,
    words_read INTEGER DEFAULT 0,
    total_words INTEGER DEFAULT 0,
    speech_transcript TEXT,
    errors JSONB DEFAULT '[]'::jsonb,
    tricky_words TEXT[] DEFAULT '{}',
    gemma_practice JSONB DEFAULT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_story_sessions_user ON story_reading_sessions(user_id, completed_at DESC);
  CREATE INDEX IF NOT EXISTS idx_story_sessions_story ON story_reading_sessions(story_id, user_id);
  `;

  try {
    await pool.query(sql);
    console.log("SUCCESS: story_reading_sessions table created and migrated successfully.");
    process.exit(0);
  } catch (err) {
    console.error("MIGRATION ERROR in migrate_story_practice.js:", err);
    process.exit(1);
  }
}

migrate();
