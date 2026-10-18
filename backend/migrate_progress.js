const pool = require("./db");

async function migrate() {
  const sql = `
  CREATE TABLE IF NOT EXISTS learning_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES userss(id) ON DELETE CASCADE,
    stars INTEGER DEFAULT 0,
    current_level INTEGER DEFAULT 1,
    garden_points INTEGER DEFAULT 0,
    completed_stories INTEGER DEFAULT 0,
    completed_sessions INTEGER DEFAULT 0,
    badges JSONB DEFAULT '[]'::jsonb,
    levels JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS learning_mistakes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES userss(id) ON DELETE CASCADE,
    item_key VARCHAR(100) NOT NULL,
    level_id INTEGER,
    category VARCHAR(50),
    mistake_count INTEGER DEFAULT 1,
    mastered BOOLEAN DEFAULT FALSE,
    question_data JSONB DEFAULT '{}'::jsonb,
    history JSONB DEFAULT '[]'::jsonb,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_item UNIQUE(user_id, item_key)
  );

  CREATE TABLE IF NOT EXISTS child_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES userss(id) ON DELETE CASCADE,
    theme VARCHAR(50) DEFAULT 'forest',
    streak_days INTEGER DEFAULT 1,
    last_practice_date VARCHAR(20),
    perfect_lessons INTEGER DEFAULT 0,
    gems INTEGER DEFAULT 10,
    recent_accuracies JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
  `;

  try {
    await pool.query(sql);
    console.log("SUCCESS: Created learning_progress, learning_mistakes, and child_preferences tables");
    process.exit(0);
  } catch (err) {
    console.error("MIGRATION ERROR:", err);
    process.exit(1);
  }
}

migrate();
