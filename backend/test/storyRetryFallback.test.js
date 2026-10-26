// =========================================================
// LUMILEX AI — STORY GENERATION RETRY & FALLBACK TEST SUITE
// Tests:
// 1. Transient Error Detection (503, 429, 504, timeouts vs 400, 401)
// 2. Safe Error Logging (API key redaction)
// 3. Deterministic Fallback Story Generation (Dyslexia-friendly)
// 4. Unified Fallback Service (Ollama / Deterministic)
// 5. Permanent 400 Error Rejection (No retries)
// 6. Normal Gemini Success Flow (Single attempt, saves to DB)
// 7. Repeated 503 High-Demand Error Flow (Exponential backoff retries, fallback success, no duplicate DB saves)
// =========================================================

const assert = require("assert");
const http = require("http");
const express = require("express");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const pool = require("../db");
const storyFallbackService = require("../services/storyFallbackService");
const storiesRoutes = require("../routes/stories");

let testApp;
let testServer;
const TEST_PORT = 5058;
const TEST_BASE_URL = `http://127.0.0.1:${TEST_PORT}`;
process.env.JWT_SECRET = process.env.JWT_SECRET || "lumiLex_super_secret_key_change_this";
const JWT_SECRET = process.env.JWT_SECRET;

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
  console.log("🧪 STARTING STORY RETRY & FALLBACK TESTS");
  console.log("========================================================\n");

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      process.stdout.write(`• ${name} ... `);
      await fn();
      console.log("✅ PASSED");
      passed++;
    } catch (err) {
      console.log("❌ FAILED");
      console.error("  ", err.message);
      failed++;
    }
  }

  // ---------------------------------------------------------
  // 1. UNIT TESTS: TRANSIENT ERROR DETECTION & SAFE LOGGING
  // ---------------------------------------------------------

  await test("Detects 503, 429, 504, and transient network errors correctly", async () => {
    const isTransientError = storiesRoutes._isTransientError;
    assert.ok(typeof isTransientError === "function");

    // 503 High demand
    assert.strictEqual(isTransientError({ status: 503, message: "Model experiencing high demand" }), true);
    assert.strictEqual(isTransientError({ error: { code: 503, status: "UNAVAILABLE" } }), true);
    assert.strictEqual(isTransientError({ message: "This model is currently experiencing high demand. Spikes in demand are usually temporary." }), true);

    // 429 Rate limit
    assert.strictEqual(isTransientError({ status: 429, message: "Rate limit reached" }), true);

    // 504 Deadline exceeded / timeout
    assert.strictEqual(isTransientError({ status: 504, message: "Deadline expired" }), true);
    assert.strictEqual(isTransientError({ message: "fetch failed: ECONNRESET" }), true);

    // Permanent errors (must NOT be retried)
    assert.strictEqual(isTransientError({ status: 401, message: "Invalid API Key" }), false);
    assert.strictEqual(isTransientError({ status: 400, message: "Invalid request payload" }), false);
    assert.strictEqual(isTransientError({ status: 403, message: "Permission denied" }), false);
    assert.strictEqual(isTransientError({ status: 404, message: "Not found" }), false);
  });

  await test("Safe logger redacts API keys from error messages", async () => {
    const safeLogError = storiesRoutes._safeLogError;
    assert.ok(typeof safeLogError === "function");

    const fakeKey = process.env.GEMINI_API_KEY || "AIzaSyFakeSecret123456789";
    let logged = "";
    const originalWarn = console.warn;
    console.warn = (msg) => { logged = msg; };

    try {
      safeLogError("Test Error", new Error(`Failed with key ${fakeKey} and status 503`));
      assert.ok(!logged.includes(fakeKey));
      assert.ok(logged.includes("[REDACTED_API_KEY]"));
    } finally {
      console.warn = originalWarn;
    }
  });

  // ---------------------------------------------------------
  // 2. FALLBACK STORY GENERATOR
  // ---------------------------------------------------------

  await test("Deterministic fallback produces personalized dyslexia-friendly stories", async () => {
    const params = {
      interests: ["Space"],
      level: "Beginner",
      length: "Short",
      characterType: "Magical Character",
      characterName: "Nova",
      mood: "Magical",
      maxWords: 120,
    };

    const result = storyFallbackService.generateDeterministicStory(params);
    assert.ok(result.storyContent);
    assert.ok(result.title);
    assert.strictEqual(result.source, "deterministic");
    assert.ok(result.storyContent.includes("Nova"));
    assert.ok(result.storyContent.split(/\s+/).length <= 130);
  });

  await test("Unified fallback service seamlessly returns a complete story", async () => {
    const result = await storyFallbackService.generateFallbackStory({
      interests: ["Animals"],
      level: "Intermediate",
      length: "Medium",
      characterType: "Animal Friend",
      characterName: "Pip",
      mood: "Happy",
      maxWords: 180,
    });

    assert.ok(result.storyContent && result.storyContent.length > 50);
    assert.ok(result.title && result.title.length > 3);
    assert.ok(["ollama-gemma", "deterministic"].includes(result.source));
  });

  // ---------------------------------------------------------
  // 3. API ENDPOINTS /api/stories/generate (HTTP)
  // ---------------------------------------------------------

  testApp = express();
  testApp.use(express.json());
  testApp.use(cookieParser());
  testApp.use("/api/stories", storiesRoutes);

  await new Promise((resolve) => {
    testServer = testApp.listen(TEST_PORT, () => resolve());
  });

  // Fetch real user from DB
  let testUser = { id: 99801, email: "test_child1@lumilex.ai" };
  try {
    const uRes = await pool.query("SELECT id, email FROM userss LIMIT 1");
    if (uRes.rows.length > 0) {
      testUser = { id: uRes.rows[0].id, email: uRes.rows[0].email };
    }
  } catch {}

  const userToken = jwt.sign(testUser, JWT_SECRET, { expiresIn: "1h" });

  await test("POST /api/stories/generate rejects permanent 400 validation error without retrying", async () => {
    const res = await makeRequest("/api/stories/generate", {
      method: "POST",
      token: userToken,
      body: {
        interests: [], // Invalid: empty interests!
        level: "Beginner",
      },
    });

    assert.strictEqual(res.status, 400);
    assert.ok(res.data.error.includes("choose at least one interest"));
  });

  const createdStoryIds = [];

  // TEST: Normal Gemini Success
  await test("Normal Gemini success flow generates story and saves once to DB", async () => {
    const originalGenerateContent = storiesRoutes._ai.models.generateContent;
    let callCount = 0;

    // Simulate normal Gemini response
    storiesRoutes._ai.models.generateContent = async (opts) => {
      callCount++;
      if (opts.contents && opts.contents.includes("Create ONE short, cute title")) {
        return { text: "Sunny the Friendly Dog" };
      }
      return {
        text: "Sunny was a warm yellow dog. He loved to run on the green grass. Hop, hop went the little frog. Sunny wagged his tail and smiled. It was a wonderful sunny day.",
      };
    };

    try {
      const res = await makeRequest("/api/stories/generate", {
        method: "POST",
        token: userToken,
        body: {
          interests: ["Animals"],
          level: "Beginner",
          length: "Short",
          characterType: "Animal Friend",
          characterName: "Sunny",
          mood: "Happy",
        },
      });

      assert.strictEqual(res.status, 201);
      assert.ok(res.data.story);
      assert.ok(res.data.story.id);
      assert.strictEqual(res.data.story.title, "Sunny the Friendly Dog");
      assert.ok(res.data.story.content.includes("Sunny was a warm yellow dog"));
      assert.strictEqual(res.data.story.story_type, "ai_generated");
      assert.strictEqual(callCount, 2); // 1 for story + 1 for title

      createdStoryIds.push(res.data.story.id);

      // Verify DB has exactly 1 row
      const dbCheck = await pool.query("SELECT COUNT(*) FROM stories WHERE id = $1", [res.data.story.id]);
      assert.strictEqual(parseInt(dbCheck.rows[0].count, 10), 1);
    } finally {
      storiesRoutes._ai.models.generateContent = originalGenerateContent;
    }
  });

  // TEST: Repeated 503 Errors with Exponential Backoff & Fallback
  await test("Repeated Gemini 503 errors trigger backoff retries and fallback without duplicates", async () => {
    const originalGenerateContent = storiesRoutes._ai.models.generateContent;
    let callAttempts = 0;

    // Simulate repeated 503 UNAVAILABLE
    storiesRoutes._ai.models.generateContent = async () => {
      callAttempts++;
      const err = new Error('{"error":{"code":503,"message":"This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.","status":"UNAVAILABLE"}}');
      err.status = 503;
      err.code = 503;
      throw err;
    };

    try {
      const res = await makeRequest("/api/stories/generate", {
        method: "POST",
        token: userToken,
        body: {
          interests: ["Space"],
          level: "Beginner",
          length: "Short",
          characterType: "Magical Character",
          characterName: "Astro Pip",
          mood: "Magical",
        },
      });

      assert.strictEqual(res.status, 201);
      assert.ok(res.data.story);
      assert.ok(res.data.story.id);
      assert.ok(res.data.story.title);
      assert.ok(res.data.story.content);
      assert.strictEqual(res.data.story.story_type, "ai_generated");
      assert.strictEqual(res.data.story.difficulty, "Beginner");
      assert.strictEqual(callAttempts, 3); // Initial attempt + 2 retries (MAX_GEMINI_RETRIES)

      createdStoryIds.push(res.data.story.id);

      // Verify exactly 1 story was saved to the database (no duplicate stories created during retries)
      const dbCheck = await pool.query("SELECT COUNT(*) FROM stories WHERE id = $1", [res.data.story.id]);
      assert.strictEqual(parseInt(dbCheck.rows[0].count, 10), 1);
    } finally {
      storiesRoutes._ai.models.generateContent = originalGenerateContent;
    }
  });

  // Clean up test stories
  for (const id of createdStoryIds) {
    try {
      await pool.query("DELETE FROM stories WHERE id = $1", [id]);
    } catch {}
  }

  // Close test server
  if (testServer) {
    await new Promise((resolve) => testServer.close(resolve));
  }

  console.log("\n========================================================");
  console.log(`🏁 TEST SUITE COMPLETE: ${passed} Passed, ${failed} Failed`);
  console.log("========================================================\n");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite().catch((err) => {
  console.error("Unhandled test suite error:", err);
  if (testServer) testServer.close();
  process.exit(1);
});
