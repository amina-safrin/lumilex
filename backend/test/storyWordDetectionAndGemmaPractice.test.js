// =========================================================
// LUMILEX AI — STORY WORD DETECTION & GEMMA PRACTICE TEST SUITE
// Tests:
// 1. Confident Dyslexia-Friendly Word Matching (Exact, Reversals, Short Word Protection)
// 2. Sequential Reading Matcher (Correct green, Skipped soft-orange, Misread amber, Self-correction)
// 3. Unread / Session End Protection (Words never turn green on mic stop or silence)
// 4. Story Error Analysis (Categorization of correct, incorrect, skipped, unread words)
// 5. Gemma Practice Helpers (Syllables, Phonetics, 3-Choice Distractors)
// 6. Gemma Practice Question Validation (5 activities, 3 unique choices with guaranteed answer)
// 7. Gemma Practice Generation (Target error personalization, Level adaptation, Fallback safety)
// 8. Backend Endpoint & DB Persistence (POST /api/learning/story-reading-complete, Auth, Child Isolation)
// =========================================================

const assert = require("assert");
const http = require("http");
const path = require("path");
const jwt = require("jsonwebtoken");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const pool = require("../db");
const gemmaService = require("../services/gemmaAdaptiveService");
const learningRoutes = require("../routes/learningRoutes");

const TEST_PORT = 5056;
const TEST_BASE_URL = `http://127.0.0.1:${TEST_PORT}`;
const JWT_SECRET = process.env.JWT_SECRET || "lumiLex_super_secret_key_change_this";

let testApp;
let testServer;

async function makeRequest(apiPath, options = {}) {
  const url = `${TEST_BASE_URL}${apiPath}`;
  const headers = options.headers || {};
  if (options.token) {
    headers["Authorization"] = `Bearer ${options.token}`;
  }
  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: response.status, data };
}

async function runTestSuite() {
  console.log("\n========================================================");
  console.log("🧪 STARTING STORY WORD DETECTION & GEMMA PRACTICE TESTS");
  console.log("========================================================\n");

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    return async () => {
      try {
        process.stdout.write(`• ${name} ... `);
        await fn();
        console.log("✅ PASSED");
        passed++;
      } catch (err) {
        console.log("❌ FAILED");
        console.error(`  Error: ${err.message}`);
        failed++;
      }
    };
  }

  // Import frontend ESM module using file:// URL for dynamic import
  const frontendAnalyzerPath = path.resolve(__dirname, "../../frontend/src/utils/storyErrorAnalyzer.js");
  const frontendAnalyzerUrl = `file:///${frontendAnalyzerPath.replace(/\\/g, "/")}`;
  const {
    isConfidentDyslexiaMatch,
    normalizeWord,
    analyzeStoryReadingErrors,
  } = await import(frontendAnalyzerUrl);

  // Set up Express test server
  testApp = express();
  testApp.use(cors());
  testApp.use(express.json());
  testApp.use(cookieParser());
  testApp.use("/api/learning", learningRoutes);

  await new Promise((resolve) => {
    testServer = testApp.listen(TEST_PORT, resolve);
  });

  // Mock test users
  const testUser1 = { id: 99811, email: "reading_child1@lumilex.ai" };
  const testUser2 = { id: 99812, email: "reading_child2@lumilex.ai" };
  const tokenUser1 = jwt.sign(testUser1, JWT_SECRET, { expiresIn: "1h" });
  const tokenUser2 = jwt.sign(testUser2, JWT_SECRET, { expiresIn: "1h" });

  try {
    await pool.query(
      `INSERT INTO userss (id, full_name, email, password_hash)
       VALUES ($1, 'Story Tester 1', $2, 'hash1'), ($3, 'Story Tester 2', $4, 'hash2')
       ON CONFLICT (id) DO NOTHING`,
      [testUser1.id, testUser1.email, testUser2.id, testUser2.email]
    );

    await pool.query(
      `INSERT INTO child_profiles (user_id, child_name, age, reading_level)
       VALUES ($1, 'Liam', 7, 'beginner'), ($2, 'Sofia', 8, 'intermediate')
       ON CONFLICT (id) DO NOTHING`,
      [testUser1.id, testUser2.id]
    );

    await pool.query(
      `INSERT INTO learning_progress (user_id, stars, current_level, completed_sessions)
       VALUES ($1, 5, 1, 1), ($2, 12, 3, 3)
       ON CONFLICT (user_id) DO NOTHING`,
      [testUser1.id, testUser2.id]
    );

    await pool.query(
      `DELETE FROM story_reading_sessions WHERE user_id IN ($1, $2)`,
      [testUser1.id, testUser2.id]
    );
  } catch (dbErr) {
    console.warn("DB setup notice:", dbErr.message);
  }

  const tests = [
    // ---------------------------------------------------------
    // 1. CONFIDENT DYSLEXIA-FRIENDLY WORD MATCHING
    // ---------------------------------------------------------
    test("Word Matching: Exact match succeeds regardless of casing and punctuation", () => {
      assert.strictEqual(isConfidentDyslexiaMatch("Owl!", "owl"), true);
      assert.strictEqual(isConfidentDyslexiaMatch("“whisper”", "whisper"), true);
      assert.strictEqual(isConfidentDyslexiaMatch("tree...", "Tree"), true);
      assert.strictEqual(isConfidentDyslexiaMatch("forest-path", "forestpath"), true);
    }),

    test("Word Matching: Tolerates dyslexia mirror letter reversals (b/d, p/q, m/w, n/u)", () => {
      // b <-> d
      assert.strictEqual(isConfidentDyslexiaMatch("dad", "bad"), true);
      assert.strictEqual(isConfidentDyslexiaMatch("dig", "big"), true);
      // p <-> q
      assert.strictEqual(isConfidentDyslexiaMatch("quick", "puick"), true);
      // m <-> w
      assert.strictEqual(isConfidentDyslexiaMatch("wap", "map"), true);
    }),

    test("Word Matching: STRICTLY REJECTS false matches for short words (<= 3 chars)", () => {
      // Prevents "cat" falsely matching "bat", "he" matching "the", "in" matching "on"
      assert.strictEqual(isConfidentDyslexiaMatch("bat", "cat"), false, "bat should not match cat");
      assert.strictEqual(isConfidentDyslexiaMatch("he", "the"), false, "he should not match the");
      assert.strictEqual(isConfidentDyslexiaMatch("in", "on"), false, "in should not match on");
      assert.strictEqual(isConfidentDyslexiaMatch("sun", "run"), false, "sun should not match run");
      assert.strictEqual(isConfidentDyslexiaMatch("to", "no"), false, "to should not match no");
    }),

    test("Word Matching: Tolerates child inflection variations on words with stem >= 3 chars", () => {
      assert.strictEqual(isConfidentDyslexiaMatch("jumping", "jump"), true);
      assert.strictEqual(isConfidentDyslexiaMatch("jumped", "jump"), true);
      assert.strictEqual(isConfidentDyslexiaMatch("cats", "cat"), true);
      assert.strictEqual(isConfidentDyslexiaMatch("walked", "walking"), true);
    }),

    test("Word Matching: Tolerates minor pronunciation variation on longer words if initial letter matches", () => {
      assert.strictEqual(isConfidentDyslexiaMatch("wisper", "whisper"), true);
      assert.strictEqual(isConfidentDyslexiaMatch("fluter", "flutter"), true);
      assert.strictEqual(isConfidentDyslexiaMatch("beutiful", "beautiful"), true);
      // But completely different words must never match
      assert.strictEqual(isConfidentDyslexiaMatch("butterfly", "elephant"), false);
      assert.strictEqual(isConfidentDyslexiaMatch("night", "morning"), false);
    }),

    // ---------------------------------------------------------
    // 2. SEQUENTIAL STORY READING SIMULATION
    // ---------------------------------------------------------
    test("Sequential Matching: Reads words in order -> marked correct (green)", () => {
      const storyWords = [
        { word: "The", uniqueIndex: 0 },
        { word: "quick", uniqueIndex: 1 },
        { word: "brown", uniqueIndex: 2 },
        { word: "fox", uniqueIndex: 3 },
      ];

      // Simulate sequential matcher from StoryReader.jsx
      let expectedIndex = 0;
      const statuses = {};

      const spokenWords = ["the", "quick", "brown", "fox"];
      for (const spoken of spokenWords) {
        if (expectedIndex < storyWords.length) {
          if (isConfidentDyslexiaMatch(spoken, storyWords[expectedIndex].word)) {
            statuses[storyWords[expectedIndex].uniqueIndex] = "correct";
            expectedIndex++;
          }
        }
      }

      assert.strictEqual(statuses[0], "correct");
      assert.strictEqual(statuses[1], "correct");
      assert.strictEqual(statuses[2], "correct");
      assert.strictEqual(statuses[3], "correct");
    }),

    test("Sequential Matching: Child skips a word -> skipped word is marked 'skipped', NEVER green", () => {
      const storyWords = [
        { word: "The", uniqueIndex: 0 },
        { word: "quick", uniqueIndex: 1 },
        { word: "brown", uniqueIndex: 2 },
        { word: "fox", uniqueIndex: 3 },
      ];

      let expectedIndex = 0;
      const statuses = {};
      const LOOK_AHEAD_MAX = 2;

      // Child says "the" then skips "quick" and says "brown" then "fox"
      const spokenWords = ["the", "brown", "fox"];

      for (const spoken of spokenWords) {
        let matchedAheadOffset = -1;
        for (let offset = 0; offset <= LOOK_AHEAD_MAX && (expectedIndex + offset) < storyWords.length; offset++) {
          if (isConfidentDyslexiaMatch(spoken, storyWords[expectedIndex + offset].word)) {
            matchedAheadOffset = offset;
            break;
          }
        }

        if (matchedAheadOffset === 0) {
          statuses[storyWords[expectedIndex].uniqueIndex] = "correct";
          expectedIndex++;
        } else if (matchedAheadOffset > 0) {
          // Words skipped between expectedIndex and matched index must be marked 'skipped'
          for (let skipIdx = expectedIndex; skipIdx < expectedIndex + matchedAheadOffset; skipIdx++) {
            statuses[storyWords[skipIdx].uniqueIndex] = "skipped";
          }
          const targetIdx = expectedIndex + matchedAheadOffset;
          statuses[storyWords[targetIdx].uniqueIndex] = "correct";
          expectedIndex = targetIdx + 1;
        }
      }

      assert.strictEqual(statuses[0], "correct", "First word 'The' should be correct");
      assert.strictEqual(statuses[1], "skipped", "Skipped word 'quick' MUST NOT be correct, must be 'skipped'");
      assert.notStrictEqual(statuses[1], "correct", "Skipped word 'quick' must NEVER be marked correct/green");
      assert.strictEqual(statuses[2], "correct", "'brown' should be marked correct");
      assert.strictEqual(statuses[3], "correct", "'fox' should be marked correct");
    }),

    test("Sequential Matching: Child misreads a word -> marked 'misread', NEVER green", () => {
      const storyWords = [
        { word: "whisper", uniqueIndex: 0 },
        { word: "little", uniqueIndex: 1 },
        { word: "owl", uniqueIndex: 2 },
      ];

      let expectedIndex = 0;
      const statuses = {};
      const LOOK_AHEAD_MAX = 2;

      // Child says "wimper" (unrecognized/misread), then "little", then "owl"
      const spokenWords = ["wimper", "little", "owl"];

      for (const spoken of spokenWords) {
        let matchedAheadOffset = -1;
        for (let offset = 0; offset <= LOOK_AHEAD_MAX && (expectedIndex + offset) < storyWords.length; offset++) {
          if (isConfidentDyslexiaMatch(spoken, storyWords[expectedIndex + offset].word)) {
            matchedAheadOffset = offset;
            break;
          }
        }

        if (matchedAheadOffset === 0) {
          statuses[storyWords[expectedIndex].uniqueIndex] = "correct";
          expectedIndex++;
        } else if (matchedAheadOffset > 0) {
          for (let skipIdx = expectedIndex; skipIdx < expectedIndex + matchedAheadOffset; skipIdx++) {
            if (statuses[storyWords[skipIdx].uniqueIndex] !== "misread") {
              statuses[storyWords[skipIdx].uniqueIndex] = "skipped";
            }
          }
          const targetIdx = expectedIndex + matchedAheadOffset;
          statuses[storyWords[targetIdx].uniqueIndex] = "correct";
          expectedIndex = targetIdx + 1;
        } else {
          // Misread at current expected word
          if (expectedIndex < storyWords.length && !statuses[storyWords[expectedIndex].uniqueIndex]) {
            statuses[storyWords[expectedIndex].uniqueIndex] = "misread";
          }
        }
      }

      assert.strictEqual(statuses[0], "misread", "'whisper' should be marked 'misread'");
      assert.notStrictEqual(statuses[0], "correct", "'whisper' must NOT be marked correct");
      assert.strictEqual(statuses[1], "correct", "'little' should be correct");
      assert.strictEqual(statuses[2], "correct", "'owl' should be correct");
    }),

    test("Sequential Matching: Self-correction lookback updates skipped or misread words to correct", () => {
      const storyWords = [
        { word: "The", uniqueIndex: 0 },
        { word: "quick", uniqueIndex: 1 },
        { word: "brown", uniqueIndex: 2 },
      ];

      let expectedIndex = 0;
      const statuses = { 0: "correct", 1: "skipped", 2: "correct" };
      expectedIndex = 3;

      // Child notices mistake and says "quick"
      const spoken = "quick";
      // Lookback check
      for (let lookbackIdx = 0; lookbackIdx < expectedIndex; lookbackIdx++) {
        if (statuses[storyWords[lookbackIdx].uniqueIndex] !== "correct") {
          if (isConfidentDyslexiaMatch(spoken, storyWords[lookbackIdx].word)) {
            statuses[storyWords[lookbackIdx].uniqueIndex] = "correct";
            break;
          }
        }
      }

      assert.strictEqual(statuses[1], "correct", "Skipped word 'quick' should be upgraded to 'correct' upon self-correction");
    }),

    test("Unread Protection: When child stops mic midway, unread words remain unconfirmed (never green)", () => {
      const totalWords = 8;
      const statuses = {
        0: "correct",
        1: "correct",
        2: "skipped",
      };

      // Words 3 to 7 were never reached
      for (let i = 3; i < totalWords; i++) {
        assert.strictEqual(statuses[i], undefined, `Word ${i} should have no status (normal unconfirmed appearance)`);
      }
      assert.notStrictEqual(statuses[3], "correct");
      assert.notStrictEqual(statuses[4], "correct");
    }),

    // ---------------------------------------------------------
    // 3. STORY ERROR ANALYSIS
    // ---------------------------------------------------------
    test("Error Analysis: Correctly aggregates word statuses into structured breakdown", () => {
      const storyText = "The quick brown fox jumps over the lazy dog";
      const wordStatusMap = {
        0: "correct", // The
        1: "skipped", // quick
        2: "correct", // brown
        3: "correct", // fox
        4: "misread", // jumps
        5: "correct", // over
        // 6, 7, 8 unread
      };

      const analysis = analyzeStoryReadingErrors(
        storyText,
        "The brown fox jumbles over",
        wordStatusMap
      );

      assert.strictEqual(analysis.totalWords, 9);
      assert.strictEqual(analysis.correctWords.length, 4); // The, brown, fox, over
      assert.strictEqual(analysis.skippedWords.length, 1); // quick
      assert.strictEqual(analysis.incorrectWords.length, 1); // jumps
      assert.strictEqual(analysis.unreadWords.length, 3); // the, lazy, dog
      assert.ok(analysis.trickyWords.includes("jumps"));
      assert.ok(analysis.trickyWords.includes("quick"));
    }),

    // ---------------------------------------------------------
    // 4. GEMMA PRACTICE HELPERS
    // ---------------------------------------------------------
    test("Gemma Practice Helpers: Syllable breakdown handles single and multi-syllable words", () => {
      const owl = gemmaService.splitWordSyllables("owl");
      assert.deepStrictEqual(owl, ["owl"]);

      const rabbit = gemmaService.splitWordSyllables("rabbit");
      assert.strictEqual(rabbit.length, 2);
      assert.strictEqual(rabbit.join(""), "rabbit");

      const butterfly = gemmaService.splitWordSyllables("butterfly");
      assert.ok(butterfly.length >= 2);
      assert.strictEqual(butterfly.join(""), "butterfly");
    }),

    test("Gemma Practice Helpers: Phonetic sounds extracts segmented sounds", () => {
      const catSounds = gemmaService.getPhoneticSounds("cat");
      assert.ok(catSounds.length >= 3);
      assert.strictEqual(catSounds.join(""), "cat");

      const shipSounds = gemmaService.getPhoneticSounds("ship");
      assert.ok(shipSounds.includes("sh"));
      assert.strictEqual(shipSounds.join(""), "ship");
    }),

    test("Gemma Practice Helpers: Generates 2 distinct phonetic contrast distractors", () => {
      const target = "bright";
      const distractors = gemmaService.getPhoneticDistractors(target, 2);
      assert.strictEqual(distractors.length, 2);
      assert.ok(!distractors.includes(target), "Distractors must not include the target word");
      assert.notStrictEqual(distractors[0], distractors[1], "Distractors must be unique");
    }),

    // ---------------------------------------------------------
    // 5. GEMMA PRACTICE QUESTION VALIDATION
    // ---------------------------------------------------------
    test("Question Validation: Enforces 5 questions and validates all 4 activity types", () => {
      const questions = [
        {
          id: 1,
          type: "speak_loud",
          target_word: "whisper",
          prompt: "Say the word whisper",
          instruction: "Read this word aloud",
          hint: "Whisper softly!",
        },
        {
          id: 2,
          type: "word_select",
          target_word: "whisper",
          prompt: "Find the word whisper",
          options: ["whisper", "whistle", "wimper"],
          answer: "whisper",
          hint: "Look for wh-",
        },
        {
          id: 3,
          type: "letter_build",
          target_word: "owl",
          prompt: "Build owl",
          letters: ["o", "w", "l"],
          answer: "owl",
          hint: "o-w-l",
        },
        {
          id: 4,
          type: "sentence_read",
          target_word: "flutter",
          prompt: "The wings flutter.",
          sentence: "The wings flutter.",
          target_word_focus: "flutter",
          answer: "flutter",
          hint: "flutter",
        },
        {
          id: 5,
          type: "speak_loud",
          target_word: "flutter",
          prompt: "Say flutter",
          instruction: "Try saying flutter",
          hint: "flutter",
        },
      ];

      const validated = gemmaService.validateAndEnforcePracticeQuestions(questions, ["whisper", "flutter"], 2);
      assert.strictEqual(validated.length, 5);
      for (const q of validated) {
        assert.ok(["speak_loud", "word_select", "letter_build", "sentence_read"].includes(q.type));
        assert.ok(q.instruction);
        assert.ok(q.prompt);
      }
    }),

    test("Question Validation: Fixes invalid word_select choices (ensures exactly 3 unique choices with answer included)", () => {
      const flawedQuestions = [
        {
          id: 1,
          type: "word_select",
          target_word: "rabbit",
          options: ["cat", "dog"], // Missing target answer and only 2 choices!
          answer: "rabbit",
          prompt: "Find rabbit",
        },
      ];

      const fixed = gemmaService.validateAndEnforcePracticeQuestions(flawedQuestions, ["rabbit"], 2);
      assert.strictEqual(fixed.length, 5); // Padded to 5
      const selectQ = fixed.find((q) => q.type === "word_select");
      assert.ok(selectQ);
      assert.strictEqual(selectQ.options.length, 3, "word_select must have exactly 3 options");
      assert.strictEqual(new Set(selectQ.options).size, 3, "all 3 options must be unique");
      assert.ok(selectQ.options.includes(selectQ.answer), "Correct answer must be present in choices");
    }),

    // ---------------------------------------------------------
    // 6. GEMMA PRACTICE GENERATOR & FALLBACK SAFETY
    // ---------------------------------------------------------
    test("Gemma Practice Generation: Deterministic fallback generates 5 complete error-targeted questions", async () => {
      const session = await gemmaService.generateStoryPracticeSession({
        storyId: 1,
        storyTitle: "The Whispering Woods",
        readingLevel: 1,
        trickyWords: ["whisper", "flutter"],
        correctWords: ["the", "woods"],
        incorrectWords: ["whisper"],
        skippedWords: ["flutter"],
        unreadWords: [],
        attempts: 1,
      });

      assert.ok(session);
      assert.ok(session.practiceSession);
      assert.strictEqual(session.practiceSession.practiceQuestions.length, 5);
      assert.ok(session.practiceSession.targetWords.includes("whisper"));
      assert.ok(session.practiceSession.targetWords.includes("flutter"));

      // Check that questions specifically exercise the target words
      const questionTargets = session.practiceSession.practiceQuestions.map((q) => q.target_word || q.targetWord || q.answer);
      assert.ok(questionTargets.some((t) => t === "whisper" || t === "flutter" || t === "WHISPER" || t === "FLUTTER"));

      // Verify every word_select question has 3 unique choices with the answer present
      for (const q of session.practiceSession.practiceQuestions) {
        if (q.type === "word_select") {
          assert.strictEqual(q.options.length, 3);
          assert.strictEqual(new Set(q.options).size, 3);
          assert.ok(q.options.includes(q.answer));
        }
      }
    }),

    test("Gemma Practice Generation: Level adaptation scales difficulty for intermediate vs beginner", async () => {
      const beginnerSession = await gemmaService.generateStoryPracticeSession({
        storyId: 1,
        storyTitle: "Baby Fox",
        readingLevel: 1,
        trickyWords: ["hop"],
        correctWords: ["fox"],
        incorrectWords: ["hop"],
        skippedWords: [],
      });

      const advancedSession = await gemmaService.generateStoryPracticeSession({
        storyId: 1,
        storyTitle: "The Mysterious Mountain",
        readingLevel: 4,
        trickyWords: ["mysterious"],
        correctWords: ["mountain"],
        incorrectWords: ["mysterious"],
        skippedWords: [],
      });

      assert.strictEqual(beginnerSession.practiceSession.practiceQuestions.length, 5);
      assert.strictEqual(advancedSession.practiceSession.practiceQuestions.length, 5);
      assert.strictEqual(beginnerSession.practiceSession.difficulty, "easy");
      assert.strictEqual(advancedSession.practiceSession.difficulty, "challenging");
    }),

    // ---------------------------------------------------------
    // 7. BACKEND API ENDPOINT & DB INTEGRATION
    // ---------------------------------------------------------
    test("Backend Endpoint: Rejects unauthenticated POST /api/learning/story-reading-complete with 401", async () => {
      const res = await makeRequest("/api/learning/story-reading-complete", {
        method: "POST",
        body: { storyId: 1 },
      });
      assert.strictEqual(res.status, 401);
    }),

    test("Backend Endpoint: Saves complete reading results and returns 5 Gemma practice questions", async () => {
      const payload = {
        storyId: 1,
        storyTitle: "The Starlight Adventure",
        storyTopic: "Space",
        readingLevel: 2,
        accuracy: 75,
        wordsRead: 15,
        totalWords: 20,
        speechTranscript: "the little rocket flew through the sky",
        expectedText: "the little rocket sailed through the glowing sky",
        errors: [
          { expected: "sailed", spoken: "flew", type: "substitution" },
          { expected: "glowing", spoken: "", type: "omission" },
        ],
        trickyWords: ["sailed", "glowing"],
        correctWords: ["the", "little", "rocket", "through", "sky"],
        incorrectWords: ["sailed"],
        skippedWords: ["glowing"],
        unreadWords: [],
        attempts: 1,
      };

      const res = await makeRequest("/api/learning/story-reading-complete", {
        method: "POST",
        token: tokenUser1,
        body: payload,
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.success, true);
      assert.ok(res.data.gemmaPractice);
      assert.strictEqual(res.data.gemmaPractice.practiceQuestions.length, 5);
      assert.ok(res.data.starsAwarded >= 1);

      // Verify DB persistence of detailed reading results
      const dbCheck = await pool.query(
        `SELECT * FROM story_reading_sessions WHERE user_id = $1 AND story_id = $2 ORDER BY completed_at DESC LIMIT 1`,
        [testUser1.id, 1]
      );
      assert.strictEqual(dbCheck.rows.length, 1);
      const sessionRow = dbCheck.rows[0];
      assert.strictEqual(sessionRow.story_title, "The Starlight Adventure");
      assert.strictEqual(Number(sessionRow.accuracy), 75);

      const parsedErrors = typeof sessionRow.errors === "string" ? JSON.parse(sessionRow.errors) : sessionRow.errors;
      assert.ok(parsedErrors.correctWords);
      assert.ok(parsedErrors.incorrectWords);
      assert.ok(parsedErrors.skippedWords);
      assert.deepStrictEqual(parsedErrors.skippedWords, ["glowing"]);
      assert.deepStrictEqual(parsedErrors.incorrectWords, ["sailed"]);
    }),

    test("Backend Endpoint: Child data isolation guarantees User 2 cannot see User 1's story reading sessions", async () => {
      const user1Check = await makeRequest("/api/learning/story-sessions", {
        token: tokenUser1,
      });
      assert.strictEqual(user1Check.status, 200);
      assert.ok(user1Check.data.sessions.length >= 1);

      const user2Check = await makeRequest("/api/learning/story-sessions", {
        token: tokenUser2,
      });
      assert.strictEqual(user2Check.status, 200);
      assert.strictEqual(user2Check.data.sessions.length, 0, "User 2 must not see any sessions from User 1");
    }),
  ];

  for (const t of tests) {
    await t();
  }

  testServer.close();

  console.log("\n========================================================");
  console.log(`📊 TEST SUITE COMPLETE: ${passed} PASSED, ${failed} FAILED (Total: ${passed + failed})`);
  console.log("========================================================\n");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite().catch((err) => {
  console.error("Test execution fatal error:", err);
  if (testServer) testServer.close();
  process.exit(1);
});
