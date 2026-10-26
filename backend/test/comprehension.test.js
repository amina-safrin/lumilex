// =========================================================
// LUMILEX AI — STORY COMPREHENSION TEST SUITE
// Tests:
// 1. Question Schema Validation (3 choices, exact match, uniqueness)
// 2. Unsupported / Missing Answers Detection
// 3. Rule-Based NLP Generation & Fallback Behavior
// 4. API Endpoint Access Controls & Ownership Checks
// =========================================================

const assert = require("assert");
const http = require("http");
const express = require("express");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const pool = require("../db");
const comprehensionService = require("../services/comprehensionService");
const storiesRoutes = require("../routes/stories");

let testApp;
let testServer;
const TEST_PORT = 5057;
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
  console.log("🧪 STARTING LUMILEX STORY COMPREHENSION TESTS");
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
  // 1. UNIT TESTS: QUESTION SCHEMA VALIDATION
  // ---------------------------------------------------------

  await test("Validation accepts properly structured 3-choice questions", async () => {
    const validQuestions = [
      {
        id: "q1",
        type: "comprehension",
        prompt: "Who is Sam?",
        choices: ["A little orange cat", "A playful puppy", "A tiny honeybee"],
        answer: "A little orange cat",
        hint: "Look at the first line!",
        picture: "🐱",
      },
      {
        id: "q2",
        type: "comprehension",
        prompt: "Where did Sam hop?",
        choices: ["On the soft green rug", "On a wooden bench", "In a puddle"],
        answer: "On the soft green rug",
        hint: "Look for the rug!",
        picture: "🧶",
      },
      {
        id: "q3",
        type: "comprehension",
        prompt: "What did Sam do at the end?",
        choices: ["Took a happy nap", "Ran outside", "Ate lunch"],
        answer: "Took a happy nap",
        hint: "Look at the ending!",
        picture: "😴",
      },
    ];

    const result = comprehensionService.validateQuestions(
      validQuestions,
      "Sam is a little orange cat. He hops on the soft green rug. Sam takes a happy nap."
    );
    assert.strictEqual(result.isValid, true);
  });

  await test("Validation rejects questions with fewer or more than 3 choices", async () => {
    const invalidQuestions = [
      {
        id: "q1",
        type: "comprehension",
        prompt: "Who is Sam?",
        choices: ["A little orange cat", "A playful puppy"], // Only 2 choices!
        answer: "A little orange cat",
      },
      {
        id: "q2",
        type: "comprehension",
        prompt: "Where did Sam hop?",
        choices: ["On the rug", "On the bench", "In the mud", "On the bed"], // 4 choices!
        answer: "On the rug",
      },
      {
        id: "q3",
        type: "comprehension",
        prompt: "What did Sam do?",
        choices: ["Nap", "Play", "Eat"],
        answer: "Nap",
      },
    ];

    const result = comprehensionService.validateQuestions(invalidQuestions, "Sam rug nap");
    assert.strictEqual(result.isValid, false);
    assert.ok(result.reason.includes("3 choices"));
  });

  await test("Validation rejects duplicate choices in a question", async () => {
    const duplicateChoicesQuestions = [
      {
        id: "q1",
        type: "comprehension",
        prompt: "Who is Sam?",
        choices: ["A little orange cat", "A little orange cat", "A tiny honeybee"],
        answer: "A little orange cat",
      },
      {
        id: "q2",
        type: "comprehension",
        prompt: "Where did Sam hop?",
        choices: ["Rug", "Bench", "Grass"],
        answer: "Rug",
      },
      {
        id: "q3",
        type: "comprehension",
        prompt: "What did Sam do?",
        choices: ["Nap", "Play", "Eat"],
        answer: "Nap",
      },
    ];

    const result = comprehensionService.validateQuestions(duplicateChoicesQuestions, "Sam rug nap");
    assert.strictEqual(result.isValid, false);
    assert.ok(result.reason.includes("duplicate choices"));
  });

  await test("Validation rejects when answer does not match any choice", async () => {
    const mismatchedQuestions = [
      {
        id: "q1",
        type: "comprehension",
        prompt: "Who is Sam?",
        choices: ["A green frog", "A playful puppy", "A tiny honeybee"],
        answer: "A little orange cat", // Not in choices!
      },
      {
        id: "q2",
        type: "comprehension",
        prompt: "Where did Sam hop?",
        choices: ["Rug", "Bench", "Grass"],
        answer: "Rug",
      },
      {
        id: "q3",
        type: "comprehension",
        prompt: "What did Sam do?",
        choices: ["Nap", "Play", "Eat"],
        answer: "Nap",
      },
    ];

    const result = comprehensionService.validateQuestions(mismatchedQuestions, "Sam rug nap");
    assert.strictEqual(result.isValid, false);
    assert.ok(result.reason.includes("does not match any of its choices"));
  });

  await test("Validation detects unsupported answers not grounded in the story", async () => {
    const unsupportedQuestions = [
      {
        id: "q1",
        type: "comprehension",
        prompt: "What did the alien fly?",
        choices: ["A giant radioactive submarine", "A spaceship", "A helicopter"],
        answer: "A giant radioactive submarine", // Nowhere in story!
      },
      {
        id: "q2",
        type: "comprehension",
        prompt: "Where did Sam hop?",
        choices: ["Rug", "Bench", "Grass"],
        answer: "Rug",
      },
      {
        id: "q3",
        type: "comprehension",
        prompt: "What did Sam do?",
        choices: ["Nap", "Play", "Eat"],
        answer: "Nap",
      },
    ];

    const result = comprehensionService.validateQuestions(
      unsupportedQuestions,
      "Sam is a cat. He hops on the rug. Sam takes a nap."
    );
    assert.strictEqual(result.isValid, false);
    assert.ok(result.reason.includes("could not be verified against story text"));
  });

  // ---------------------------------------------------------
  // 2. RULE-BASED GENERATOR & RESILIENT FALLBACK
  // ---------------------------------------------------------

  await test("Rule-based generator rejects empty content", async () => {
    assert.throws(() => {
      comprehensionService.generateRuleBasedQuestions({
        title: "Empty Story",
        content: "",
      });
    }, /Cannot generate questions from empty story content/);
  });

  await test("Rule-based generator produces 3-4 validated questions for Sunny Cat", async () => {
    const sunnyCatContent =
      "Sam is a little orange cat.\n\nSam loves the warm sun.\n\nHe hops on the soft green rug.\n\nPurr, purr, purr!\n\nSam takes a happy nap.";

    const res = comprehensionService.generateRuleBasedQuestions({
      storyId: 1,
      title: "The Sunny Cat",
      content: sunnyCatContent,
    });

    assert.ok(res.questions.length >= 3 && res.questions.length <= 4);
    assert.strictEqual(res.source, "rule-based");

    const val = comprehensionService.validateQuestions(res.questions, sunnyCatContent);
    assert.strictEqual(val.isValid, true);

    // Verify every question has 3 unique choices and answer matches one of them
    for (const q of res.questions) {
      assert.strictEqual(q.choices.length, 3);
      assert.ok(q.choices.includes(q.answer));
      assert.strictEqual(new Set(q.choices).size, 3);
    }
  });

  await test("Rule-based generator handles arbitrary short custom stories gracefully", async () => {
    const customStory = {
      storyId: 999,
      title: "Leo and the River",
      content:
        "Leo is a brave little tiger.\n\nLeo packed sweet red apples for lunch.\n\nHe walked to the sparkling blue river.\n\nLeo smiled and shared his apples with a friendly duck.",
    };

    const res = comprehensionService.generateRuleBasedQuestions(customStory);
    assert.ok(res.questions.length >= 3);
    const val = comprehensionService.validateQuestions(res.questions, customStory.content);
    assert.strictEqual(val.isValid, true);
  });

  // ---------------------------------------------------------
  // 3. API ENDPOINT & ACCESS CONTROLS (HTTP)
  // ---------------------------------------------------------

  testApp = express();
  testApp.use(express.json());
  testApp.use(cookieParser());
  testApp.use("/api/stories", storiesRoutes);

  await new Promise((resolve) => {
    testServer = testApp.listen(TEST_PORT, () => resolve());
  });

  // Fetch real users from database to respect foreign key constraints
  let user1 = { id: 99801, email: "test_child1@lumilex.ai" };
  let user2 = { id: 99802, email: "test_child2@lumilex.ai" };

  try {
    const usersRes = await pool.query("SELECT id, email FROM userss ORDER BY id ASC LIMIT 2");
    if (usersRes.rows.length >= 2) {
      user1 = { id: usersRes.rows[0].id, email: usersRes.rows[0].email };
      user2 = { id: usersRes.rows[1].id, email: usersRes.rows[1].email };
    }
  } catch (e) {
    console.warn("DB user fetch note:", e.message);
  }

  const user1Token = jwt.sign(user1, JWT_SECRET, { expiresIn: "1h" });
  const user2Token = jwt.sign(user2, JWT_SECRET, { expiresIn: "1h" });

  await test("POST /api/stories/:id/comprehension returns 401 without auth", async () => {
    const res = await makeRequest("/api/stories/1/comprehension", {
      method: "POST",
    });
    assert.strictEqual(res.status, 401);
  });

  await test("POST /api/stories/:id/comprehension returns 401 with invalid token", async () => {
    const res = await makeRequest("/api/stories/1/comprehension", {
      method: "POST",
      token: "invalid.jwt.token.string",
    });
    assert.strictEqual(res.status, 401);
  });

  await test("POST /api/stories/:id/comprehension returns 404 for non-existent story", async () => {
    const res = await makeRequest("/api/stories/9999999/comprehension", {
      method: "POST",
      token: user1Token,
    });
    assert.strictEqual(res.status, 404);
  });

  let libraryStoryId = null;
  let user1PrivateStoryId = null;

  try {
    const libRes = await pool.query(
      "SELECT id FROM stories WHERE story_type = 'library' LIMIT 1"
    );
    if (libRes.rows.length > 0) {
      libraryStoryId = libRes.rows[0].id;
    }

    const privRes = await pool.query(
      `INSERT INTO stories (user_id, title, content, difficulty, topic, story_type)
       VALUES ($1, $2, $3, $4, $5, 'ai_generated')
       RETURNING id`,
      [
        user1.id,
        "User 1 Secret Adventure",
        "Pip is a tiny mouse. Pip found a golden acorn in the leaves. Pip danced with joy.",
        "Beginner",
        "Animals",
      ]
    );
    user1PrivateStoryId = privRes.rows[0].id;
  } catch (dbErr) {
    console.warn("DB setup note for test:", dbErr.message);
  }

  if (libraryStoryId) {
    await test("POST /api/stories/:id/comprehension succeeds for library story for any authenticated user", async () => {
      const res = await makeRequest(`/api/stories/${libraryStoryId}/comprehension`, {
        method: "POST",
        token: user1Token,
      });

      assert.strictEqual(res.status, 200);
      assert.ok(res.data.questions);
      assert.ok(Array.isArray(res.data.questions));
      assert.ok(res.data.questions.length >= 3 && res.data.questions.length <= 4);

      for (const q of res.data.questions) {
        assert.strictEqual(q.choices.length, 3);
        assert.ok(q.choices.includes(q.answer));
      }
    });
  }

  if (user1PrivateStoryId) {
    await test("POST /api/stories/:id/comprehension allows creator (user 1) to access their own story", async () => {
      const res = await makeRequest(`/api/stories/${user1PrivateStoryId}/comprehension`, {
        method: "POST",
        token: user1Token,
      });

      assert.strictEqual(res.status, 200);
      assert.ok(res.data.questions.length >= 3);
    });

    await test("POST /api/stories/:id/comprehension blocks other users (user 2) from accessing user 1's private story", async () => {
      const res = await makeRequest(`/api/stories/${user1PrivateStoryId}/comprehension`, {
        method: "POST",
        token: user2Token,
      });

      assert.strictEqual(res.status, 404);
    });

    // Clean up temporary story
    try {
      await pool.query("DELETE FROM stories WHERE id = $1", [user1PrivateStoryId]);
    } catch {}
  }

  // Close server
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
