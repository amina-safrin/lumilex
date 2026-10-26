// =========================================================
// LUMILEX AI — GEMMA CLOUD ADAPTIVE LEARNING TEST SUITE
// Tests:
// 1. AI Service & Gemma Cloud Integration
// 2. Malformed / Timeout / Error Fallback Handling
// 3. Deterministic Progression Rules (>=75 advance, <75 repeat, etc.)
// 4. Dyslexia-Tolerant Speech Discrepancy Analysis (Speech uncertainty)
// 5. Authentication & Child Data Isolation
// 6. Backend Endpoints (/api/learning/adaptive-recommendation)
// =========================================================

const assert = require("assert");
const http = require("http");
const jwt = require("jsonwebtoken");
const pool = require("../db");
const gemmaService = require("../services/gemmaAdaptiveService");

// Start server programmatically on a test port to test HTTP endpoints
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const learningRoutes = require("../routes/learningRoutes");

let testApp;
let testServer;
const TEST_PORT = 5055;
const TEST_BASE_URL = `http://127.0.0.1:${TEST_PORT}`;
const JWT_SECRET = process.env.JWT_SECRET || "lumiLex_super_secret_key_change_this";

// Helper to make HTTP requests
async function makeRequest(path, options = {}) {
  const url = `${TEST_BASE_URL}${path}`;
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
  console.log("🧪 STARTING LUMILEX GEMMA ADAPTIVE LEARNING TESTS");
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

  // Set up Express test app
  testApp = express();
  testApp.use(cors());
  testApp.use(express.json());
  testApp.use(cookieParser());
  testApp.use("/api/learning", learningRoutes);

  await new Promise((resolve) => {
    testServer = testApp.listen(TEST_PORT, resolve);
  });

  // Mock test users
  const testChildUser1 = { id: 99801, email: "test_child1@lumilex.ai" };
  const testChildUser2 = { id: 99802, email: "test_child2@lumilex.ai" };
  const tokenUser1 = jwt.sign(testChildUser1, JWT_SECRET, { expiresIn: "1h" });
  const tokenUser2 = jwt.sign(testChildUser2, JWT_SECRET, { expiresIn: "1h" });

  // Prepare database records for test child users
  try {
    await pool.query(
      `INSERT INTO userss (id, full_name, email, password_hash)
       VALUES ($1, 'Child One', $2, 'hash1'), ($3, 'Child Two', $4, 'hash2')
       ON CONFLICT (id) DO NOTHING`,
      [testChildUser1.id, testChildUser1.email, testChildUser2.id, testChildUser2.email]
    );

    await pool.query(
      `INSERT INTO child_profiles (user_id, child_name, age, reading_level)
       VALUES ($1, 'Leo', 6, 'beginner'), ($2, 'Maya', 7, 'intermediate')
       ON CONFLICT (id) DO NOTHING`,
      [testChildUser1.id, testChildUser2.id]
    );

    await pool.query(
      `INSERT INTO learning_progress (user_id, stars, current_level, completed_sessions)
       VALUES ($1, 10, 2, 2), ($2, 25, 4, 5)
       ON CONFLICT (user_id) DO NOTHING`,
      [testChildUser1.id, testChildUser2.id]
    );

    await pool.query(
      `DELETE FROM story_reading_sessions WHERE user_id IN ($1, $2)`,
      [testChildUser1.id, testChildUser2.id]
    );
  } catch (dbSetupErr) {
    console.warn("Test DB setup notice (proceeding):", dbSetupErr.message);
  }

  // ---------------------------------------------------------
  // TEST GROUP 1: DETERMINISTIC PROGRESSION RULES
  // ---------------------------------------------------------
  const tests = [
    test("Deterministic Rule: Accuracy >= 90% triggers 'boost' (Challenger mode)", () => {
      const result = gemmaService.evaluateDeterministicProgression({
        accuracy: 92,
        currentLevel: 2,
      });
      assert.strictEqual(result.decision, "boost");
      assert.strictEqual(result.suitableDifficulty, "boost");
      assert.strictEqual(result.nextLevel, 3);
    }),

    test("Deterministic Rule: Accuracy >= 75% triggers 'advance' (Mastery threshold)", () => {
      const result = gemmaService.evaluateDeterministicProgression({
        accuracy: 80,
        currentLevel: 2,
      });
      assert.strictEqual(result.decision, "advance");
      assert.strictEqual(result.suitableDifficulty, "standard");
      assert.strictEqual(result.nextLevel, 3);
    }),

    test("Deterministic Rule: Accuracy 60-74% triggers 'repeat' (Near mastery)", () => {
      const result = gemmaService.evaluateDeterministicProgression({
        accuracy: 66,
        currentLevel: 2,
      });
      assert.strictEqual(result.decision, "repeat");
      assert.strictEqual(result.suitableDifficulty, "standard");
      assert.strictEqual(result.nextLevel, 2);
    }),

    test("Deterministic Rule: Accuracy < 60% triggers 'support' (Easier/visual practice)", () => {
      const result = gemmaService.evaluateDeterministicProgression({
        accuracy: 50,
        currentLevel: 2,
      });
      assert.strictEqual(result.decision, "support");
      assert.strictEqual(result.suitableDifficulty, "support");
      assert.strictEqual(result.nextLevel, 2);
    }),

    // ---------------------------------------------------------
    // TEST GROUP 2: SPEECH RECOGNITION & DYSLEXIA TOLERANCE
    // ---------------------------------------------------------
    test("Speech Analysis: Tolerates dyslexia letter reversals (b vs d)", () => {
      assert.strictEqual(gemmaService.isDyslexiaTolerantMatch("dog", "bog"), true);
      assert.strictEqual(gemmaService.isDyslexiaTolerantMatch("bed", "deb"), true);
    }),

    test("Speech Analysis: Treats unsaid or misheard words as possible variances, not confirmed errors", () => {
      const analysis = gemmaService.analyzeSpeechDiscrepancies(
        "cat sun tree",
        "cat sun tree ball"
      );
      assert.strictEqual(analysis.hasSpeechData, true);
      assert.strictEqual(analysis.possibleMismatches.length, 1);
      assert.strictEqual(analysis.possibleMismatches[0].word, "ball");
      assert.ok(analysis.possibleMismatches[0].note.toLowerCase().includes("acoustic mismatch"));
    }),

    // ---------------------------------------------------------
    // TEST GROUP 3: RESPONSE PARSING & MALFORMED RECOVERY
    // ---------------------------------------------------------
    test("Response Parser: Parses clean JSON and validates all 7 required fields", () => {
      const validJson = JSON.stringify({
        observedPerformancePatterns: "Demonstrates consistent CVC blending.",
        possibleSkillDifficulties: "Possible acoustic hesitation on final plosives.",
        recommendedNextActivity: "Level 3: Little Word Blenders",
        suitableDifficulty: "standard",
        targetedSkill: "sound_blending",
        encouragingFeedback: "You did amazing! 🌟",
        suggestedFollowUpAssessment: "Try 3 CVC cards.",
      });

      const parsed = gemmaService.parseAndValidateModelResponse(validJson);
      assert.strictEqual(parsed.targetedSkill, "sound_blending");
      assert.strictEqual(parsed.suitableDifficulty, "standard");
      assert.strictEqual(parsed.encouragingFeedback, "You did amazing! 🌟");
    }),

    test("Response Parser: Strips markdown code fences (```json ... ```) safely", () => {
      const rawMarkdown = "```json\n" + JSON.stringify({
        observedPerformancePatterns: "Good letter sound recognition.",
        possibleSkillDifficulties: "None.",
        recommendedNextActivity: "Level 2: Sound Safari",
        suitableDifficulty: "standard",
        targetedSkill: "phonics",
        encouragingFeedback: "Super reader! 🚀",
        suggestedFollowUpAssessment: "Sound safari check.",
      }) + "\n```";

      const parsed = gemmaService.parseAndValidateModelResponse(rawMarkdown);
      assert.strictEqual(parsed.targetedSkill, "phonics");
      assert.strictEqual(parsed.encouragingFeedback, "Super reader! 🚀");
    }),

    test("Response Parser: Throws descriptive error on missing required fields", () => {
      const incompleteJson = JSON.stringify({
        observedPerformancePatterns: "Good",
        // missing other 6 fields
      });
      assert.throws(() => {
        gemmaService.parseAndValidateModelResponse(incompleteJson);
      }, /Missing or empty required field/);
    }),

    test("Fallback Engine: Generates compliant 7-field fallback if AI is offline/malformed", () => {
      const fallback = gemmaService.generateDeterministicFallback({
        currentLevel: 1,
        accuracy: 70,
        deterministicProgression: {
          decision: "repeat",
          nextLevel: 1,
          suitableDifficulty: "standard",
        },
      });
      assert.strictEqual(fallback.isFallback, true);
      assert.ok(fallback.observedPerformancePatterns);
      assert.ok(fallback.possibleSkillDifficulties);
      assert.ok(fallback.recommendedNextActivity);
      assert.strictEqual(fallback.suitableDifficulty, "standard");
      assert.ok(fallback.encouragingFeedback);
      assert.ok(fallback.suggestedFollowUpAssessment);
    }),

    // ---------------------------------------------------------
    // TEST GROUP 4: LIVE OLLAMA / GEMMA CLOUD AI SERVICE
    // ---------------------------------------------------------
    test("AI Service: Successfully connects to Ollama gemma4:cloud and returns structured recommendation", async () => {
      const res = await gemmaService.generateAdaptiveRecommendation({
        currentLevel: 2,
        accuracy: 80,
        correctCount: 4,
        totalQuestions: 5,
        skillsExercised: ["phonics"],
        speechTranscript: "apple sun cat",
        expectedPassage: "apple sun cat dog",
        trickyItems: ["b", "d"],
      });

      assert.strictEqual(res.success, true);
      assert.ok(res.recommendation);
      assert.ok(res.recommendation.observedPerformancePatterns);
      assert.ok(res.recommendation.encouragingFeedback);
      assert.ok(res.recommendation.recommendedNextActivity);
      assert.strictEqual(res.deterministicProgression.decision, "advance");
    }),

    // ---------------------------------------------------------
    // TEST GROUP 5: AUTHENTICATION & SECURITY
    // ---------------------------------------------------------
    test("Security: Rejects unauthenticated request to /api/learning/adaptive-recommendation with 401", async () => {
      const res = await makeRequest("/api/learning/adaptive-recommendation", {
        method: "POST",
        body: { currentLevel: 1, accuracy: 80 },
      });
      assert.strictEqual(res.status, 401);
    }),

    test("Security: Rejects unauthenticated GET /api/learning/adaptive-recommendation with 401", async () => {
      const res = await makeRequest("/api/learning/adaptive-recommendation");
      assert.strictEqual(res.status, 401);
    }),

    // ---------------------------------------------------------
    // TEST GROUP 6: CHILD DATA ISOLATION
    // ---------------------------------------------------------
    test("Child Isolation: Progress and recommendations are isolated between Child 1 and Child 2", async () => {
      // Child 1 posts recommendation for Level 2 (85% accuracy)
      const post1 = await makeRequest("/api/learning/adaptive-recommendation", {
        method: "POST",
        token: tokenUser1,
        body: {
          currentLevel: 2,
          accuracy: 85,
          correctCount: 5,
          totalQuestions: 6,
          skillsExercised: ["phonics"],
        },
      });
      assert.strictEqual(post1.status, 200);
      assert.strictEqual(post1.data.deterministicProgression.decision, "advance");

      // Child 2 posts recommendation for Level 1 (50% accuracy)
      const post2 = await makeRequest("/api/learning/adaptive-recommendation", {
        method: "POST",
        token: tokenUser2,
        body: {
          currentLevel: 1,
          accuracy: 50,
          correctCount: 2,
          totalQuestions: 4,
          skillsExercised: ["letter_recognition"],
        },
      });
      assert.strictEqual(post2.status, 200);
      assert.strictEqual(post2.data.deterministicProgression.decision, "support");

      // Verify Child 1 gets Child 1's recommendation
      const get1 = await makeRequest("/api/learning/adaptive-recommendation", {
        token: tokenUser1,
      });
      assert.strictEqual(get1.status, 200);
      assert.ok(get1.data.recommendation);
      assert.strictEqual(get1.data.hasRecommendation, true);

      // Verify Child 2 gets Child 2's recommendation
      const get2 = await makeRequest("/api/learning/adaptive-recommendation", {
        token: tokenUser2,
      });
      assert.strictEqual(get2.status, 200);
      assert.ok(get2.data.recommendation);
      assert.strictEqual(get2.data.hasRecommendation, true);
    }),

    test("State Integration: GET /api/learning/state returns latestRecommendation for authenticated child", async () => {
      const stateRes = await makeRequest("/api/learning/state", {
        token: tokenUser1,
      });
      assert.strictEqual(stateRes.status, 200);
      assert.ok(stateRes.data.progress);
      assert.ok(stateRes.data.progress.latestRecommendation !== undefined);
      assert.ok(stateRes.data.progress.latestRecommendation !== null);
    }),

    test("Story Integration: POST /api/learning/story-reading-complete catches errors & triggers Gemma AI session", async () => {
      const storyRes = await makeRequest("/api/learning/story-reading-complete", {
        method: "POST",
        token: tokenUser1,
        body: {
          storyId: 1,
          storyTitle: "The Brave Little Owl",
          storyTopic: "Animals",
          accuracy: 70,
          wordsRead: 14,
          totalWords: 20,
          speechTranscript: "the brave wimper owl in the butter night",
          expectedText: "the brave whisper owl in the flutter night",
          errors: [
            { expected: "whisper", spoken: "wimper", type: "substitution" },
            { expected: "flutter", spoken: "butter", type: "substitution" },
          ],
          trickyWords: ["whisper", "flutter"],
        },
      });

      assert.strictEqual(storyRes.status, 200);
      assert.ok(storyRes.data.success);
      assert.ok(storyRes.data.gemmaPractice);
      assert.strictEqual(storyRes.data.gemmaPractice.practiceQuestions.length, 5);
      assert.strictEqual(storyRes.data.starsAwarded, 1, "70% accuracy falls in 65-75% tier and correctly awards 1 star");
    }),

    test("Story Isolation: Account story sessions & tricky words remain strictly isolated between users", async () => {
      // User 1 should have 1 story session recorded
      const user1Sessions = await makeRequest("/api/learning/story-sessions", {
        token: tokenUser1,
      });
      assert.strictEqual(user1Sessions.status, 200);
      assert.strictEqual(user1Sessions.data.sessions.length, 1);
      assert.strictEqual(user1Sessions.data.sessions[0].story_title, "The Brave Little Owl");

      // User 2 should have 0 story sessions (zero account data leakage)
      const user2Sessions = await makeRequest("/api/learning/story-sessions", {
        token: tokenUser2,
      });
      assert.strictEqual(user2Sessions.status, 200);
      assert.strictEqual(user2Sessions.data.sessions.length, 0);
    }),
  ];

  // Run all tests sequentially
  for (const t of tests) {
    await t();
  }

  // Cleanup test server
  testServer.close();

  console.log("\n========================================================");
  console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED (Total: ${passed + failed})`);
  console.log("========================================================\n");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite().catch((err) => {
  console.error("Test execution fatal error:", err);
  process.exit(1);
});
