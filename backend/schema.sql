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

-- 4. Individual Child Learning Progress
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

-- 5. Individual Child Mistakes Tracker (for personalized practice sessions)
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

-- 6. Child Themes & Habits Preferences
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
),
(
  'Oliver the Owl Who Loved Books',
  E'Oliver is a fluffy brown barn owl.\n\nWhile other owls sleep all morning, Oliver sits on a mossy branch and reads tiny picture books.\n\n"Twit, twoo!" says Mama Owl. "What is your favorite story today?"\n\nOliver points to a page with shining stars.\n\n"Reading takes me on adventures all around the wide world," hooted Oliver with a proud smile.',
  'Beginner',
  'Animals',
  'library'
),
(
  'The Friendly Cloud That Rained Lemonade',
  E'High above the green rolling hills floated Puff, a cheerful round cloud.\n\nOne warm summer afternoon, the woodland animals were feeling thirsty.\n\nPuff spun around three times and tickled the sunshine.\n\nInstead of plain rain, Puff sprinkled sweet, cool lemonade drops on the meadow!\n\nThe bunny and squirrel cheered and caught the yummy drops on their tongues.',
  'Beginner',
  'Fantasy',
  'library'
),
(
  'Barnaby Bear Bakes a Honey Pie',
  E'Barnaby Bear woke up with a very rumbly tummy.\n\n"Today is the great Honey Pie day!" said Barnaby in a cheerful booming voice.\n\nHe rolled sweet flour dough on his wooden kitchen table.\n\nNext, his friend Buzzy the Bee brought a pot of golden blossom honey.\n\nTogether they stirred, baked, and shared a warm, delicious slice under the shady oak tree.',
  'Beginner',
  'Friendship',
  'library'
),
(
  'The Little Moon Rocket and the Star Fairies',
  E'Nova was a friendly silver spaceship with shiny red tail fins.\n\nNova loved flying through the dark purple galaxy to visit her friends, the twinkling star fairies.\n\n"Hold on tight!" cheered Nova as she zoomed past a ring of blue ice pebbles.\n\nThe star fairies danced in the cosmic breeze and dusted Nova''s windows with sparkling glitter.\n\nNova smiled and said, "Space is full of magic when we explore together!"',
  'Beginner',
  'Space',
  'library'
),
(
  'Coral the Seahorse Finds a Hidden Pearl',
  E'Down in the calm turquoise ocean lived Coral, a tiny orange seahorse.\n\nCoral curled her tail gently around a wavy green sea-grass ribbon.\n\nSuddenly, she spotted a soft pink shell resting on the white sand.\n\nThe shell opened slowly, revealing a glowing pearl that hummed a peaceful ocean melody.\n\nCoral invited all the baby fish to swim around the pearl and listen to the song of the deep sea.',
  'Beginner',
  'Animals',
  'library'
),
(
  'The Magic Forest Picnic',
  E'Penny the hedgehog and Pip the squirrel packed a basket full of crunchy red apples and walnut treats.\n\nThey walked along the winding trail lined with soft fern fronds and bluebell flowers.\n\nThey spread a checkered cloth under the gentle shade of the giant weeping willow.\n\nA family of friendly ladybugs joined in to share tiny berry crumbs.\n\n"A picnic with friends makes every sunny afternoon the happiest day," chirped Pip.',
  'Beginner',
  'Nature',
  'library'
),
(
  'Kip the Kangaroo''s Great Big Hop',
  E'Kip was a spunky little kangaroo with extra springy brown feet.\n\nEvery morning, Kip hopped over blooming wildflowers and babbling crystal brooks.\n\n"Boing, boing, boing!" went Kip''s bouncy paws across the sandy red path.\n\nHe hopped so high he gave a gentle high-five to a passing green parrot in the eucalyptus tree!\n\n"Practice makes my legs strong and my heart happy," giggled Kip as he took another giant joyful leap.',
  'Beginner',
  'Animals',
  'library'
),
(
  'The Dancing Rainbow Dragon',
  E'Deep inside Whisper Valley lived Spark, a kind little dragon with rainbow-colored scales.\n\nSpark did not blow scary fire. Instead, Spark blew soft bubbles filled with lavender and peppermint scents!\n\nWhenever the meadow bunnies felt sad, Spark danced a gentle waltz and popped fragrant bubbles for them.\n\nThe woodland smiled, and colorful sparkles filled the twilight sky.\n\nEveryone agreed that Spark was the gentlest, most magical dragon in all the enchanted kingdoms.',
  'Beginner',
  'Fantasy',
  'library'
),
(
  'The Whispering Brook and the Pebble Boat',
  E'Lily stood beside the sparkling brook watching clear water dance over smooth stones.\n\nShe carefully folded a bright yellow leaf into a tiny woodland boat.\n\n"Sail safely, little boat!" whispered Lily as she placed it on the bubbling water.\n\nThe yellow boat glided smoothly past green mossy banks and sleeping water lilies.\n\nA friendly dragonfly guided the boat along its voyage toward the calm, sunny pond.',
  'Beginner',
  'Nature',
  'library'
),
(
  'Captain Finley and the Treasure of Kindness',
  E'Finley was a brave little otter with a tiny wooden pirate hat.\n\nHe sailed his sturdy raft across Mirror Lake searching for ancient pirate treasure.\n\nUnder the roots of a giant birch tree, he found an old polished wooden chest.\n\nInside was not gold or jewels, but notes of kindness written by forest friends long ago!\n\nFinley wrote a new note that said: "A true friend is the greatest treasure of all."',
  'Beginner',
  'Adventure',
  'library'
)
ON CONFLICT DO NOTHING;
