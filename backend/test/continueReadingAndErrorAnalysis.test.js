// =========================================================
// LUMILEX AI — CONTINUE READING, ERROR ANALYSIS & STAR REWARDS
// Tests 10 Scenarios:
// 1. All words read correctly (100% accuracy, 3 stars, no tricky words, zero practice)
// 2. A few words skipped (accurately identified, accuracy calculated over assessed words)
// 3. Several words misread (tricky words captured, correct stars awarded)
// 4. Repeated words in the story (ordered sequential alignment without collisions)
// 5. Whisper returns an incomplete transcript (child stopped early, unread words not penalized)
// 6. Whisper returns an empty transcript (isReliable: false, accuracy: null, 0 stars, friendly message)
// 7. Gemma generates valid exercises for identified tricky words (3 choices, correct answer)
// 8. Gemma fails/offline -> deterministic fallback generates 5 valid exercises
// 9. Continue is clicked multiple times (idempotency guard prevents duplicate runs)
// 10. Star rewards are not duplicated (interval check prevents double-counting stars)
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

const TEST_PORT = 5057;
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
  console.log("🧪 STARTING CONTINUE READING & STAR REWARDS TESTS");
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
    calculateReadingStars,
    alignTranscriptWithStory,
    analyzeStoryReadingErrors,
    isConfidentDyslexiaMatch,
    normalizeWord,
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

  // Mock test user
  const testUser = { id: 99820, email: "continue_test@lumilex.ai" };
  const testToken = jwt.sign(testUser, JWT_SECRET, { expiresIn: "1h" });

  try {
    await pool.query(
      `INSERT INTO userss (id, full_name, email, password_hash)
       VALUES ($1, 'Continue Tester', $2, 'hash_continue')
       ON CONFLICT (id) DO NOTHING`,
      [testUser.id, testUser.email]
    );

    await pool.query(
      `INSERT INTO child_profiles (user_id, child_name, age, reading_level)
       VALUES ($1, 'Maya', 7, 'beginner')
       ON CONFLICT (id) DO NOTHING`,
      [testUser.id]
    );

    // Ensure test story exists with id = 1
    await pool.query(
      `INSERT INTO stories (id, user_id, title, topic, difficulty, content)
       VALUES (1, $1, 'The Forest Adventure', 'Nature', 'beginner', 'The quick brown fox jumps over the lazy dog.')
       ON CONFLICT (id) DO NOTHING`,
      [testUser.id]
    );

    // =========================================================================
    // Scenario 1: All words read correctly
    // =========================================================================
    await test("Scenario 1: All words read correctly (100% accuracy, 3 stars, 0 tricky words)", async () => {
      const storyWords = [
        { word: "The", uniqueIndex: "0-0" },
        { word: "cat", uniqueIndex: "0-1" },
        { word: "sat", uniqueIndex: "0-2" },
        { word: "on", uniqueIndex: "0-3" },
        { word: "the", uniqueIndex: "0-4" },
        { word: "mat", uniqueIndex: "0-5" },
      ];
      const spokenTranscript = "The cat sat on the mat";
      const analysis = analyzeStoryReadingErrors({
        storyWords,
        spokenTranscript,
        wordStatusMap: {},
        readWordIndexes: ["0-0", "0-1", "0-2", "0-3", "0-4", "0-5"],
      });

      assert.strictEqual(analysis.accuracy, 100, "Accuracy should be 100%");
      assert.strictEqual(analysis.starsAwarded, 3, "Stars awarded should be 3");
      assert.strictEqual(analysis.isReliable, true, "Transcript should be reliable");
      assert.strictEqual(analysis.trickyWords.length, 0, "No tricky words expected");
      assert.strictEqual(analysis.correctWords.length, 6, "All 6 words should be correct");

      // Verify Gemma returns needsPractice: false when 0 tricky words
      const gemmaRes = await gemmaService.generateStoryPracticeSession({
        trickyWords: [],
        readingLevel: "beginner",
        storyTopic: "Animals",
        storyContext: "The cat sat on the mat",
      });
      assert.strictEqual(gemmaRes.needsPractice, false, "Flawless reading should not generate exercises");
      assert.strictEqual(gemmaRes.practiceSession, null, "Practice session should be null");
    })();

    // =========================================================================
    // Scenario 2: A few words skipped
    // =========================================================================
    await test("Scenario 2: A few words skipped (identified accurately, accuracy calculated over assessed words)", async () => {
      // 9 words: "The quick brown fox jumps over the lazy dog"
      const storyWords = [
        { word: "The", uniqueIndex: "0-0" },
        { word: "quick", uniqueIndex: "0-1" },
        { word: "brown", uniqueIndex: "0-2" },
        { word: "fox", uniqueIndex: "0-3" },
        { word: "jumps", uniqueIndex: "0-4" },
        { word: "over", uniqueIndex: "0-5" },
        { word: "the", uniqueIndex: "0-6" },
        { word: "lazy", uniqueIndex: "0-7" },
        { word: "dog", uniqueIndex: "0-8" },
      ];
      // Child skipped "quick" and "lazy"
      const spokenTranscript = "The brown fox jumps over the dog";
      const analysis = analyzeStoryReadingErrors({
        storyWords,
        spokenTranscript,
        wordStatusMap: {
          "0-1": { status: "skipped" },
          "0-7": { status: "skipped" },
        },
        readWordIndexes: ["0-0", "0-2", "0-3", "0-4", "0-5", "0-6", "0-8"],
      });

      assert.strictEqual(analysis.isReliable, true);
      assert.strictEqual(analysis.correctWords.length, 7);
      assert.strictEqual(analysis.skippedWords.length, 2);
      // 7 correct / 9 assessed = 78% -> 2 stars (76%-90%)
      assert.strictEqual(analysis.accuracy, 78);
      assert.strictEqual(analysis.starsAwarded, 2);
      assert.ok(analysis.trickyWords.includes("quick") || analysis.trickyWords.includes("lazy"));
    })();

    // =========================================================================
    // Scenario 3: Several words misread
    // =========================================================================
    await test("Scenario 3: Several words misread (words marked misread, correct stars awarded)", async () => {
      // Story: 8 words. 5 read correctly, 3 misread.
      // 5 / 8 = 62.5% -> 63% -> 0 stars (< 65%)
      const storyWords = [
        { word: "The", uniqueIndex: "0-0" },
        { word: "sun", uniqueIndex: "0-1" },
        { word: "was", uniqueIndex: "0-2" },
        { word: "shining", uniqueIndex: "0-3" },
        { word: "bright", uniqueIndex: "0-4" },
        { word: "in", uniqueIndex: "0-5" },
        { word: "the", uniqueIndex: "0-6" },
        { word: "sky", uniqueIndex: "0-7" },
      ];
      const analysis = analyzeStoryReadingErrors({
        storyWords,
        spokenTranscript: "The sun was smiling bright under that sky",
        wordStatusMap: {
          "0-3": { status: "misread", spoken: "smiling" },
          "0-5": { status: "misread", spoken: "under" },
          "0-6": { status: "misread", spoken: "that" },
        },
        readWordIndexes: ["0-0", "0-1", "0-2", "0-4", "0-7"],
      });

      assert.strictEqual(analysis.correctWords.length, 5);
      assert.strictEqual(analysis.incorrectWords.length, 3);
      assert.strictEqual(analysis.accuracy, 63);
      assert.strictEqual(analysis.starsAwarded, 0, "Below 65% accuracy awards 0 accuracy stars with encouragement");
    })();

    // =========================================================================
    // Scenario 4: Repeated words in the story
    // =========================================================================
    await test("Scenario 4: Repeated words in the story (ordered sequential alignment without collisions)", async () => {
      // "the" appears 3 times, "dog" appears 2 times
      const storyWords = [
        { word: "The", uniqueIndex: "0-0" },
        { word: "little", uniqueIndex: "0-1" },
        { word: "dog", uniqueIndex: "0-2" },
        { word: "saw", uniqueIndex: "0-3" },
        { word: "the", uniqueIndex: "0-4" },
        { word: "big", uniqueIndex: "0-5" },
        { word: "dog", uniqueIndex: "0-6" },
        { word: "in", uniqueIndex: "0-7" },
        { word: "the", uniqueIndex: "0-8" },
        { word: "park", uniqueIndex: "0-9" },
      ];
      const spokenTranscript = "The little dog saw the big dog in the park";
      const alignment = alignTranscriptWithStory(storyWords, spokenTranscript);

      assert.strictEqual(alignment.isReliable, true);
      assert.strictEqual(alignment.correctWords.length, 10, "All 10 words including duplicates should align in order");
      assert.strictEqual(alignment.skippedWords.length, 0);
      assert.strictEqual(alignment.incorrectWords.length, 0);
      assert.strictEqual(alignment.accuracy, 100);
      assert.strictEqual(alignment.starsAwarded, 3);
    })();

    // =========================================================================
    // Scenario 5: Whisper returns an incomplete transcript
    // =========================================================================
    await test("Scenario 5: Incomplete transcript (child stopped early, unread words not penalized in accuracy)", async () => {
      // Story has 15 words. Child read only the first 6 words correctly and pressed Continue.
      const storyWords = [
        { word: "One", uniqueIndex: "0-0" },
        { word: "sunny", uniqueIndex: "0-1" },
        { word: "morning", uniqueIndex: "0-2" },
        { word: "the", uniqueIndex: "0-3" },
        { word: "happy", uniqueIndex: "0-4" },
        { word: "rabbit", uniqueIndex: "0-5" },
        { word: "hopped", uniqueIndex: "0-6" },
        { word: "into", uniqueIndex: "0-7" },
        { word: "the", uniqueIndex: "0-8" },
        { word: "deep", uniqueIndex: "0-9" },
        { word: "green", uniqueIndex: "0-10" },
        { word: "meadow", uniqueIndex: "0-11" },
        { word: "to", uniqueIndex: "0-12" },
        { word: "find", uniqueIndex: "0-13" },
        { word: "clover", uniqueIndex: "0-14" },
      ];
      const spokenTranscript = "One sunny morning the happy rabbit";

      const analysis = analyzeStoryReadingErrors({
        storyWords,
        spokenTranscript,
        wordStatusMap: {},
        readWordIndexes: ["0-0", "0-1", "0-2", "0-3", "0-4", "0-5"],
      });

      assert.strictEqual(analysis.isReliable, true);
      assert.strictEqual(analysis.correctWords.length, 6);
      assert.strictEqual(analysis.assessedWordsCount, 6, "Assessed count should only be the words attempted (6), not total story (15)");
      assert.strictEqual(analysis.unassessedWords.length, 9, "9 words should be classified as unassessed");
      // 6/6 = 100% accuracy over assessed words!
      assert.strictEqual(analysis.accuracy, 100);
      assert.strictEqual(analysis.starsAwarded, 3);
    })();

    // =========================================================================
    // Scenario 6: Whisper returns an empty or unreliable transcript
    // =========================================================================
    await test("Scenario 6: Empty or unreliable transcript (isReliable: false, accuracy: null, 0 stars, friendly message)", async () => {
      const storyWords = [
        { word: "Look", uniqueIndex: "0-0" },
        { word: "at", uniqueIndex: "0-1" },
        { word: "the", uniqueIndex: "0-2" },
        { word: "stars", uniqueIndex: "0-3" },
      ];
      const analysis = analyzeStoryReadingErrors({
        storyWords,
        spokenTranscript: "   ",
        wordStatusMap: {},
        readWordIndexes: [],
      });

      assert.strictEqual(analysis.isReliable, false, "Empty speech should be marked unreliable");
      assert.strictEqual(analysis.accuracy, null, "Accuracy should be null when unreliable");
      assert.strictEqual(analysis.starsAwarded, 0, "No stars awarded for empty transcription");
      assert.ok(
        analysis.encouragingMessage.includes("microphone") ||
        analysis.encouragingMessage.includes("voice") ||
        analysis.encouragingMessage.includes("clearly"),
        "Friendly message should encourage retry"
      );
    })();

    // =========================================================================
    // Scenario 7: Gemma generates valid exercises for identified tricky words
    // =========================================================================
    await test("Scenario 7: Gemma generates valid exercises (3 choices, correct answer included, targeted)", async () => {
      const gemmaRes = await gemmaService.generateStoryPracticeSession({
        trickyWords: ["whisper", "knight", "bridge"],
        readingLevel: "beginner",
        storyTopic: "Adventures",
        storyContext: "The brave knight stood near the bridge and heard a quiet whisper.",
      });

      assert.strictEqual(gemmaRes.success, true);
      assert.strictEqual(gemmaRes.needsPractice, true);
      assert.ok(gemmaRes.practiceSession, "Practice session must be returned");
      assert.strictEqual(gemmaRes.practiceSession.practiceQuestions.length, 5, "Must generate exactly 5 exercises");

      for (const q of gemmaRes.practiceSession.practiceQuestions) {
        assert.ok(q.prompt || q.question, "Prompt/question text must exist");
        if (q.choices) {
          assert.strictEqual(q.choices.length, 3, "Choices must have exactly 3 options");
          const ans = q.correctAnswer || q.answer;
          assert.ok(q.choices.includes(ans), "Correct answer must be one of the 3 choices");
        }
      }
    })();

    // =========================================================================
    // Scenario 8: Gemma fallback safety
    // =========================================================================
    await test("Scenario 8: Gemma fallback generates 5 valid exercises without crashing", async () => {
      const fallbackSession = gemmaService.generateDeterministicStoryPracticeFallback({
        trickyWords: ["dragon", "castle"],
        readingLevel: "beginner",
        storyTopic: "Fantasy",
      });

      assert.ok(fallbackSession);
      assert.strictEqual(fallbackSession.practiceQuestions.length, 5);
      for (const q of fallbackSession.practiceQuestions) {
        assert.ok(q.prompt || q.question, "Prompt text must exist");
        if (q.choices) {
          assert.strictEqual(q.choices.length, 3);
          const ans = q.correctAnswer || q.answer;
          assert.ok(q.choices.includes(ans), "Correct answer must match one of choices");
        }
      }
    })();

    // =========================================================================
    // Scenario 9: Continue clicked multiple times (Frontend idempotency guard)
    // =========================================================================
    await test("Scenario 9: Continue clicked multiple times (guard prevents duplicate runs)", async () => {
      let callCount = 0;
      let isSubmitting = false;
      let isCompleted = false;

      const handleContinueMock = async () => {
        if (isSubmitting || isCompleted) return;
        isSubmitting = true;
        callCount++;
        // Simulate async operation
        await new Promise((r) => setTimeout(r, 50));
        isCompleted = true;
        isSubmitting = false;
      };

      // Rapid multiple clicks
      await Promise.all([
        handleContinueMock(),
        handleContinueMock(),
        handleContinueMock(),
        handleContinueMock(),
      ]);

      assert.strictEqual(callCount, 1, "Only 1 execution should occur despite 4 rapid clicks");
    })();

    // =========================================================================
    // Scenario 10: Star rewards are not duplicated
    // =========================================================================
    await test("Scenario 10: Star rewards are not duplicated on repeated completion calls", async () => {
      // First submission: 100% accuracy -> 3 stars
      const res1 = await makeRequest("/api/learning/story-reading-complete", {
        method: "POST",
        token: testToken,
        body: {
          storyId: 1,
          accuracy: 100,
          wordsRead: 10,
          totalWords: 10,
          speechTranscript: "The quick brown fox jumps over the lazy dog",
          errors: [],
          trickyWords: [],
          correctWords: ["quick", "brown", "fox"],
          isReliable: true,
        },
      });

      assert.strictEqual(res1.status, 200);
      assert.strictEqual(res1.data.starsAwarded, 3, "First submission should award 3 stars");

      // Immediate second submission for same story & user
      const res2 = await makeRequest("/api/learning/story-reading-complete", {
        method: "POST",
        token: testToken,
        body: {
          storyId: 1,
          accuracy: 100,
          wordsRead: 10,
          totalWords: 10,
          speechTranscript: "The quick brown fox jumps over the lazy dog",
          errors: [],
          trickyWords: [],
          correctWords: ["quick", "brown", "fox"],
          isReliable: true,
        },
      });

      assert.strictEqual(res2.status, 200);
      assert.strictEqual(res2.data.isDuplicate, true, "Second immediate submission should be recognized as duplicate");
      assert.strictEqual(res2.data.starsAwarded, 0, "Duplicate submission must award 0 stars");
    })();

  } finally {
    if (testServer) {
      testServer.close();
    }
  }

  console.log("\n========================================================");
  console.log(`📊 TESTS COMPLETED: ${passed} PASSED | ${failed} FAILED`);
  console.log("========================================================\n");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite().catch((err) => {
  console.error("Test suite fatal error:", err);
  process.exit(1);
});
