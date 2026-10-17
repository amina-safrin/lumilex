-- =========================================================
-- LUMILEX AI DATABASE SCHEMA (POSTGRESQL)
-- =========================================================

-- 1. Users Table (named 'userss' to prevent keyword collision)
CREATE TABLE IF NOT EXISTS userss (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    auth_provider VARCHAR(50) DEFAULT 'email',
    google_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Child Profiles Table
CREATE TABLE IF NOT EXISTS child_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES userss(id) ON DELETE CASCADE,
    child_name VARCHAR(100) NOT NULL,
    age INTEGER NOT NULL,
    interests TEXT[] DEFAULT '{}',
    reading_level VARCHAR(50) DEFAULT 'beginner',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Stories Table
CREATE TABLE IF NOT EXISTS stories (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES userss(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    difficulty VARCHAR(50) DEFAULT 'Beginner',
    topic VARCHAR(100) DEFAULT 'General',
    story_type VARCHAR(50) DEFAULT 'ai_generated', -- 'library' or 'ai_generated'
    character_type VARCHAR(100),
    character_name VARCHAR(100),
    mood VARCHAR(50),
    story_length VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sample starter library stories for young readers with dyslexia
INSERT INTO stories (title, content, difficulty, topic, story_type)
VALUES 
(
  'The Sunny Cat',
  E'Sam is a little orange cat.\n\nSam loves the warm sun.\n\nHe hops on the soft green rug.\n\nPurr, purr, purr!\n\nSam takes a happy nap.',
  'Beginner',
  'Animals',
  'library'
),
(
  'The Busy Honeybee',
  E'Buzzy is a tiny honeybee.\n\nBuzzy has yellow and black stripes.\n\nHe flies to a tall yellow sunflower.\n\nBuzz, buzz, buzz!\n\nBuzzy sips sweet nectar and flies home.',
  'Beginner',
  'Nature',
  'library'
),
(
  'A Star in the Night',
  E'Mia looked up at the quiet night sky.\n\nShe saw one bright little star.\n\nTwinkle, twinkle, little star!\n\nMia waved her hand and smiled.\n\nThe star twinkled back at Mia.',
  'Beginner',
  'Space',
  'library'
)
ON CONFLICT DO NOTHING;
