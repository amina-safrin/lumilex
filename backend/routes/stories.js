const express = require("express");
const jwt = require("jsonwebtoken");
const { GoogleGenAI } = require("@google/genai");

const router = express.Router();
const pool = require("../db");
const comprehensionService = require("../services/comprehensionService");
const storyFallbackService = require("../services/storyFallbackService");

// ============================================
// GEMINI AI SETUP
// ============================================

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    retryOptions: { attempts: 1 },
    timeout: 10000,
  },
});

// ============================================
// SAFE LOGGING & ERROR CLASSIFICATION
// ============================================

function safeLogError(label, error) {
  const secretKey = process.env.GEMINI_API_KEY;
  let msg = error?.message || String(error);
  if (secretKey && typeof msg === "string" && msg.includes(secretKey)) {
    msg = msg.split(secretKey).join("[REDACTED_API_KEY]");
  }
  if (typeof msg === "string") {
    msg = msg.replace(/AIza[0-9A-Za-z-_]{10,}/gi, "[REDACTED_API_KEY]");
  }
  const status = error?.status || error?.code || error?.error?.code || error?.response?.status;
  console.warn(`${label} (status: ${status || "N/A"}): ${msg}`);
}

function isTransientError(error) {
  if (!error) return false;

  const status = error.status || error.code || error.error?.code || error.response?.status;

  // Permanent client errors (400 Bad Request, 401 Unauthorized / Invalid Key, 403 Forbidden, 404 Not Found)
  if (status === 400 || status === 401 || status === 403 || status === 404) {
    return false;
  }

  // Temporary HTTP status codes (503 Service Unavailable, 429 Rate Limit, 500 Internal, 502 Bad Gateway, 504 Gateway Timeout)
  if (status === 429 || status === 503 || status === 500 || status === 502 || status === 504) {
    return true;
  }

  // Error message inspection
  const msg = String(error.message || error.status || error.error?.message || error.error?.status || "").toLowerCase();
  if (
    msg.includes("503") ||
    msg.includes("429") ||
    msg.includes("504") ||
    msg.includes("unavailable") ||
    msg.includes("high demand") ||
    msg.includes("overloaded") ||
    msg.includes("spikes in demand") ||
    msg.includes("rate limit") ||
    msg.includes("quota") ||
    msg.includes("deadline") ||
    msg.includes("econnreset") ||
    msg.includes("etimedout") ||
    msg.includes("fetch failed") ||
    msg.includes("timeout")
  ) {
    return true;
  }

  return false;
}

// ============================================
// AUTHENTICATION MIDDLEWARE
// ============================================

const authenticateUser = (req, res, next) => {
  try {
    const authHeader = req.headers?.authorization;
    const token =
      req.cookies?.token ||
      (authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null);

    if (!token) {
      return res.status(401).json({
        error: "You must be logged in.",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "lumiLex_super_secret_key_change_this"
    );

    req.user = decoded;

    next();
  } catch (error) {
    console.error("Authentication error:", error);

    return res.status(401).json({
      error: "Invalid or expired login session.",
    });
  }
};

// ============================================
// STORY LENGTH SETTINGS
// ============================================
//
// Designed specifically for children around
// 4–5 years old.
//
// Quick Story       → 80–120 words
// Little Adventure  → 120–180 words
// Big Adventure     → 180–250 words
//
// ============================================

const getLengthInstructions = (length) => {
  switch (length) {
    case "Short":
      return `
Create a very short story.

Target length: 80–120 words.

Keep the story simple and focused on ONE small event or adventure.
Use short sentences.
Do not add extra scenes or subplots.
`;

    case "Medium":
      return `
Create a short children's story.

Target length: 120–180 words.

The story may have a small adventure with a simple beginning,
middle, and happy ending.

Use short sentences and simple vocabulary.
Do not add multiple storylines.
`;

    case "Long":
      return `
Create a slightly longer children's story.

Target length: 180–250 words.

The story may contain a few simple events, but it must still
be easy for a 4–5-year-old child to follow.

Keep sentences short.
Use simple vocabulary.
Do not create multiple complicated plotlines.
`;

    default:
      return `
Create a short story of approximately 80–120 words.
`;
  }
};

// ============================================
// READING LEVEL INSTRUCTIONS
// ============================================

const getReadingLevelInstructions = (level) => {
  switch (level) {
    case "Beginner":
      return `
READING LEVEL: BEGINNER

The child is approximately 4–5 years old.

Use:
- Very simple words
- Short sentences
- Common everyday vocabulary
- Repeated words and phrases
- Simple dialogue
- Clear actions
- Familiar objects and animals

Most sentences should contain approximately 3–8 words.

Avoid difficult vocabulary.
Avoid long descriptive sentences.
Avoid complicated sentence structures.
`;

    case "Intermediate":
      return `
READING LEVEL: INTERMEDIATE

The child is still around 4–5 years old, but can handle
slightly more challenging vocabulary.

Use:
- Short sentences
- Familiar vocabulary
- A few new words
- Simple descriptions
- Simple dialogue
- Repetition where helpful

Do not use advanced vocabulary or complicated grammar.
The story must still feel appropriate for a preschool child.
`;

    case "Advanced":
      return `
READING LEVEL: ADVANCED

The child is still approximately 4–5 years old.

Use slightly richer vocabulary than Beginner level,
but keep sentences short and easy to understand.

Introduce only a few new words.
Explain unfamiliar ideas naturally through the story.

Do NOT make the story suitable for older children.
It must remain preschool-friendly.
`;

    default:
      return `
The story must be suitable for a 4–5-year-old beginner reader.
`;
  }
};

// ============================================
// CHARACTER INSTRUCTIONS
// ============================================

const getCharacterInstructions = (
  characterType,
  characterName
) => {
  switch (characterType) {
    case "Me":
      return `
The main character should represent the child.

Use the child's chosen name "${characterName || "the child"}"
as the main character's name.

Make the child the main character of the adventure.
`;

    case "Animal Friend":
      return `
The main character should be a friendly animal.

The animal should have a simple, lovable personality.

The animal's name can be "${characterName || "a friendly animal"}"
if a name was provided.
`;

    case "Magical Character":
      return `
The main character should be a friendly magical character.

The character may be a fairy, tiny dragon, unicorn,
friendly wizard, magical creature, or another gentle character.

Avoid scary magic or frightening situations.

The character's name can be
"${characterName || "a magical friend"}"
if a name was provided.
`;

    case "Custom":
      return `
Use the following custom character:

Name: ${characterName || "a friendly character"}

Make the character friendly, safe, and appropriate
for a 4–5-year-old child.
`;

    default:
      return `
Create a friendly main character suitable for a 4–5-year-old.
`;
  }
};

// ============================================
// MOOD INSTRUCTIONS
// ============================================

const getMoodInstructions = (mood) => {
  switch (mood) {
    case "Happy":
      return `
The story should feel cheerful, warm, playful, and happy.
`;

    case "Funny":
      return `
Include a few gentle and silly moments that can make
a young child smile or laugh.

Keep the humor simple.
`;

    case "Calm":
      return `
Create a peaceful and gentle story.

Use a comforting atmosphere and avoid stressful events.
`;

    case "Exciting":
      return `
Create a small, exciting adventure.

Keep the excitement gentle and safe for a 4–5-year-old.
Avoid danger, fear, violence, or frightening situations.
`;

    case "Magical":
      return `
Give the story a gentle magical feeling.

Use friendly magic, sparkles, imagination, and wonder.

Avoid anything frightening.
`;

    default:
      return `
Make the story warm, positive, playful, and child-friendly.
`;
  }
};

// ============================================
// CLEAN GENERATED STORY
// ============================================

const cleanGeneratedStory = (text) => {
  if (!text) {
    return "";
  }

  let cleaned = text.trim();

  // Remove accidental markdown code fences
  cleaned = cleaned
    .replace(/^```[\w]*\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  // Remove accidental "Story:" heading
  cleaned = cleaned.replace(
    /^story\s*:\s*/i,
    ""
  );

  return cleaned.trim();
};

// ============================================
// LIMIT STORY LENGTH AS A SAFETY NET
// ============================================
//
// The prompt tells Gemini the desired length.
// This function provides a second layer of protection
// if the model generates significantly more text.
//
// ============================================

const enforceWordLimit = (text, maxWords) => {
  const words = text.split(/\s+/);

  if (words.length <= maxWords) {
    return text;
  }

  return words
    .slice(0, maxWords)
    .join(" ")
    .replace(/[,:;]$/, "")
    .trim();
};

// ============================================
// GENERATE STORY
// ============================================

router.post(
  "/generate",
  authenticateUser,
  async (req, res) => {
    try {
      const {
        interests,
        level = "Beginner",
        length = "Short",
        characterType = "Animal Friend",
        characterName = "",
        mood = "Happy",
      } = req.body;

      // ==========================================
      // VALIDATION
      // ==========================================

      if (
        !interests ||
        !Array.isArray(interests) ||
        interests.length === 0
      ) {
        return res.status(400).json({
          error: "Please choose at least one interest.",
        });
      }

      const allowedLevels = [
        "Beginner",
        "Intermediate",
        "Advanced",
      ];

      const allowedLengths = [
        "Short",
        "Medium",
        "Long",
      ];

      const allowedCharacterTypes = [
        "Me",
        "Animal Friend",
        "Magical Character",
        "Custom",
      ];

      const allowedMoods = [
        "Happy",
        "Funny",
        "Calm",
        "Exciting",
        "Magical",
      ];

      if (!allowedLevels.includes(level)) {
        return res.status(400).json({
          error: "Invalid reading level.",
        });
      }

      if (!allowedLengths.includes(length)) {
        return res.status(400).json({
          error: "Invalid story length.",
        });
      }

      if (
        !allowedCharacterTypes.includes(
          characterType
        )
      ) {
        return res.status(400).json({
          error: "Invalid character type.",
        });
      }

      if (!allowedMoods.includes(mood)) {
        return res.status(400).json({
          error: "Invalid story mood.",
        });
      }

      // ==========================================
      // CHARACTER NAME VALIDATION
      // ==========================================

      let safeCharacterName =
        characterName?.trim() || "";

      if (safeCharacterName.length > 50) {
        return res.status(400).json({
          error:
            "Character name must be 50 characters or less.",
        });
      }

      // ==========================================
      // STORY SETTINGS
      // ==========================================

      const lengthInstructions =
        getLengthInstructions(length);

      const levelInstructions =
        getReadingLevelInstructions(level);

      const characterInstructions =
        getCharacterInstructions(
          characterType,
          safeCharacterName
        );

      const moodInstructions =
        getMoodInstructions(mood);

      const interestText =
        interests.join(", ");

      // ==========================================
      // WORD LIMIT
      // ==========================================

      let maxWords = 120;

      if (length === "Medium") {
        maxWords = 180;
      }

      if (length === "Long") {
        maxWords = 250;
      }

      // ==========================================
      // GEMINI PROMPT
      // ==========================================

      const prompt = `
You are creating a very short picture-book style story
for LumiLex AI.

IMPORTANT:
The target reader is a YOUNG CHILD WITH DYSLEXIA (aged 4–6).

This is a reading companion specifically tailored to support children with dyslexia:
- Use clear, phonetically decodable words and familiar vocabulary.
- Keep sentences short (3–8 words) and easy to track visually.
- Avoid long clauses, tricky inversions, or visually confusing word patterns.
- Use natural repetition of key words so the child feels confident and successful.
- Warm, joyful, gentle tone with zero scary elements.


========================================
CHILD'S INTERESTS
========================================

${interestText}

========================================
READING LEVEL
========================================

${levelInstructions}

========================================
STORY LENGTH
========================================

${lengthInstructions}

ABSOLUTE MAXIMUM:
Do not exceed ${maxWords} words.

========================================
CHARACTER
========================================

${characterInstructions}

========================================
MOOD
========================================

${moodInstructions}

========================================
STORY STRUCTURE
========================================

Use a very simple structure:

1. Introduce the character.
2. Give the character ONE small goal,
   discovery, or problem.
3. Let the character experience a small adventure.
4. End with a warm, happy, satisfying ending.

Do NOT create multiple plotlines.

Do NOT add unnecessary background information.

========================================
LANGUAGE RULES
========================================

Use very simple language.

Prefer:
"I see a bird."

Instead of:
"She noticed a beautiful bird sitting quietly
upon the nearby branch."

Use short sentences.

Most sentences should be 3–8 words long.

Use common words that a 4–5-year-old may know.

Use repetition when it feels natural.

Example:

"Hop, hop, hop!
The bunny went home."

Avoid:
- complicated words
- long sentences
- complex grammar
- long descriptions
- abstract ideas
- scary situations
- violence
- death
- frightening characters
- dangerous situations
- sad endings
- complicated moral lessons
- multiple characters with confusing names
- multiple storylines

========================================
READING-FRIENDLY FORMAT
========================================

Use short paragraphs.

Keep paragraphs separated by blank lines.

Dialogue is welcome.

Example:

"Mia saw a tiny bird.

'Hello, Bird!' she said.

The bird hopped closer.

Mia smiled."

Do not use markdown headings.

Do not use bullet points.

Do not include explanations before or after the story.

Return ONLY the story.

========================================
LUMILEX STYLE
========================================

The story should feel like a tiny interactive
picture-book adventure.

Make it:
- warm
- playful
- imaginative
- safe
- encouraging
- easy to read aloud

The child should feel successful while reading it.

The ending should feel positive and satisfying.

Generate the story now.
`;

      // ==========================================
      // STORY GENERATION WITH RETRY & FALLBACK
      // ==========================================

      let storyContent = "";
      let title = "";
      let geminiSuccess = false;

      const MAX_GEMINI_RETRIES = 2; // Total of 3 attempts
      let attempt = 0;

      while (attempt <= MAX_GEMINI_RETRIES && !geminiSuccess) {
        attempt++;
        try {
          const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: prompt,
            config: {
              temperature: 0.8,
              maxOutputTokens: 1200,
            },
          });

          const rawText = response?.text || "";
          const cleaned = cleanGeneratedStory(rawText);

          if (cleaned && cleaned.length > 20) {
            storyContent = cleaned;
            geminiSuccess = true;
            break;
          } else {
            throw new Error("Gemini returned empty or incomplete story content");
          }
        } catch (geminiError) {
          safeLogError(`Gemini generation attempt ${attempt} failed`, geminiError);

          const isTransient = isTransientError(geminiError);

          // If error is permanent (400, 401, 403, 404) or retries exhausted, exit loop
          if (!isTransient || attempt > MAX_GEMINI_RETRIES) {
            break;
          }

          // Exponential backoff: 1000ms, then 2000ms (+ small jitter)
          const backoffMs = Math.pow(2, attempt - 1) * 1000 + Math.floor(Math.random() * 200);
          console.log(`Retrying Gemini generation in ${backoffMs}ms (attempt ${attempt}/${MAX_GEMINI_RETRIES})...`);
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
        }
      }

      // If Gemini did not succeed after retries (e.g. 503 high demand), use reliable fallback
      if (!geminiSuccess || !storyContent) {
        console.log("Using reliable child-friendly fallback story generator...");
        const fallbackResult = await storyFallbackService.generateFallbackStory({
          interests,
          level,
          length,
          characterType,
          characterName: safeCharacterName,
          mood,
          maxWords,
        });

        storyContent = fallbackResult.storyContent;
        title = fallbackResult.title;
      }

      // Clean & enforce word limit
      storyContent = cleanGeneratedStory(storyContent);
      storyContent = enforceWordLimit(storyContent, maxWords);

      // Create title if not yet generated
      if (!title) {
        if (geminiSuccess) {
          try {
            const titleResponse = await ai.models.generateContent({
              model: "gemini-3.8-flash",
              contents: `
Create ONE short, cute title for this children's story.
The reader is 4–5 years old.
Title rules:
- 2–6 words
- very easy words
- playful
- child-friendly
- no punctuation
- no quotation marks
- no explanation

Story:
${storyContent}

Return ONLY the title.
`,
              config: {
                temperature: 0.8,
                maxOutputTokens: 30,
              },
            });

            const generatedTitle = titleResponse?.text
              ?.trim()
              .replace(/^["']|["']$/g, "")
              .replace(/[.!?]$/, "");

            if (generatedTitle && generatedTitle.length <= 80) {
              title = generatedTitle;
            }
          } catch (titleError) {
            safeLogError("Title generation notice", titleError);
          }
        }

        // Guaranteed fallback title
        if (!title) {
          title = storyFallbackService.generateCuteTitle({
            characterName: safeCharacterName,
            characterType,
            interest: interests[0] || "Adventure",
            mood,
          });
        }
      }

      // ==========================================
      // SAVE STORY TO DATABASE
      // ==========================================

      const userId = req.user.id;

      const result = await pool.query(
        `
        INSERT INTO stories (
          user_id,
          title,
          content,
          difficulty,
          topic,
          story_type,
          character_type,
          character_name,
          mood,
          story_length
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          'ai_generated',
          $6,
          $7,
          $8,
          $9
        )
        RETURNING *
        `,
        [
          userId,
          title,
          storyContent,
          level,
          interestText,
          characterType,
          safeCharacterName || null,
          mood,
          length,
        ]
      );

      // ==========================================
      // SUCCESS
      // ==========================================

      return res.status(201).json({
        message:
          "Your story was created successfully!",
        story: result.rows[0],
      });
    } catch (error) {
      console.error(
        "Story generation failed:",
        error
      );

      return res.status(500).json({
        error:
          "We couldn't create your story right now. Please try again.",
      });
    }
  }
);

// ============================================
// CREATE STORY MANUALLY
// ============================================
//
// This keeps your existing POST /api/stories
// functionality available.
//
// ============================================

router.post(
  "/",
  authenticateUser,
  async (req, res) => {
    try {
      const {
        title,
        content,
        difficulty = "Beginner",
        topic = "General",
        characterType = null,
        characterName = null,
        mood = null,
        storyLength = null,
      } = req.body;

      if (!title || !content) {
        return res.status(400).json({
          error:
            "Title and content are required.",
        });
      }

      const result = await pool.query(
        `
        INSERT INTO stories (
          user_id,
          title,
          content,
          difficulty,
          topic,
          story_type,
          character_type,
          character_name,
          mood,
          story_length
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          'ai_generated',
          $6,
          $7,
          $8,
          $9
        )
        RETURNING *
        `,
        [
          req.user.id,
          title,
          content,
          difficulty,
          topic,
          characterType,
          characterName,
          mood,
          storyLength,
        ]
      );

      return res.status(201).json(
        result.rows[0]
      );
    } catch (error) {
      console.error(
        "Manual story creation error:",
        error
      );

      return res.status(500).json({
        error: "Failed to save story.",
      });
    }
  }
);

// ============================================
// GET STORIES FOR CURRENT USER
// ============================================
//
// Includes:
// 1. Public library stories
// 2. AI-generated stories belonging to user
//
// ============================================

router.get(
  "/",
  authenticateUser,
  async (req, res) => {
    try {
      const result = await pool.query(
        `
        SELECT *
        FROM stories
        WHERE
          story_type = 'library'
          OR user_id = $1
        ORDER BY created_at DESC
        `,
        [req.user.id]
      );

      return res.json(result.rows);
    } catch (error) {
      console.error(
        "Error fetching stories:",
        error
      );

      return res.status(500).json({
        error: "Failed to fetch stories.",
      });
    }
  }
);

// ============================================
// GET SINGLE STORY
// ============================================
//
// Library stories can be read by anyone.
// AI-generated stories can only be read by
// the user who created them.
//
// ============================================

router.get(
  "/:id",
  authenticateUser,
  async (req, res) => {
    try {
      const storyId = req.params.id;

      const result = await pool.query(
        `
        SELECT *
        FROM stories
        WHERE
          id = $1
          AND (
            story_type = 'library'
            OR user_id = $2
          )
        LIMIT 1
        `,
        [
          storyId,
          req.user.id,
        ]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: "Story not found.",
        });
      }

      return res.json(
        result.rows[0]
      );
    } catch (error) {
      console.error(
        "Error fetching story:",
        error
      );

      return res.status(500).json({
        error: "Failed to fetch story.",
      });
    }
  }
);

// ============================================
// GENERATE STORY COMPREHENSION QUESTIONS
// ============================================
//
// Generates 3-4 gentle, dyslexia-friendly comprehension
// questions grounded in the story's actual text.
// Library stories can be read by anyone logged in.
// AI-generated stories can only be read by their owner.
//
// ============================================

router.post(
  "/:id/comprehension",
  authenticateUser,
  async (req, res) => {
    try {
      const storyId = req.params.id;

      const result = await pool.query(
        `
        SELECT *
        FROM stories
        WHERE
          id = $1
          AND (
            story_type = 'library'
            OR user_id = $2
          )
        LIMIT 1
        `,
        [
          storyId,
          req.user.id,
        ]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: "Story not found.",
        });
      }

      const story = result.rows[0];

      const questionsData = await comprehensionService.generateStoryQuestions({
        storyId: story.id,
        title: story.title,
        content: story.content,
        difficulty: story.difficulty,
        topic: story.topic,
      });

      return res.json(questionsData);
    } catch (error) {
      console.error(
        "Error generating comprehension questions:",
        error
      );

      return res.status(500).json({
        error: "Failed to generate comprehension questions.",
      });
    }
  }
);

router._ai = ai;
router._isTransientError = isTransientError;
router._safeLogError = safeLogError;

module.exports = router;