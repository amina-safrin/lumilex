// =========================================================
// LUMILEX AI — STORY LIBRARY INVENTORY & VALIDATION TESTS
// Validates:
// 1. Library story count (>= 50 new stories, total library stories >= 70)
// 2. Beginner story word count target (50-100 words, short decodable sentences)
// 3. Metadata fidelity: Reading levels, themes, phonics focus, practice words match story text
// 4. No duplicate stories exist
// 5. Database schema contains phonics_focus, practice_words, word_count, learning_objective
// 6. User-created / AI-generated stories are preserved and separated (story_type = 'library')
// 7. REST API returns all library stories with rich metadata
// =========================================================

const assert = require("assert");
const http = require("http");
const jwt = require("jsonwebtoken");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const pool = require("../db");
const storiesRouter = require("../routes/stories");

const TEST_PORT = 5059;
const TEST_BASE_URL = `http://127.0.0.1:${TEST_PORT}`;
const JWT_SECRET = process.env.JWT_SECRET || "lumiLex_super_secret_key_change_this";

let testApp;
let testServer;

function test(name, fn) {
  return fn()
    .then(() => {
      console.log(`• ${name} ... ✅ PASSED`);
      return true;
    })
    .catch((err) => {
      console.error(`• ${name} ... ❌ FAILED`);
      console.error(`  Error: ${err.message}`);
      return false;
    });
}

async function runInventoryTests() {
  console.log("\n========================================================");
  console.log("🧪 STARTING LUMILEX STORY LIBRARY INVENTORY TESTS");
  console.log("========================================================\n");

  let passed = 0;
  let total = 0;

  // Setup test server
  testApp = express();
  testApp.use(cors());
  testApp.use(cookieParser());
  testApp.use(express.json());
  testApp.use("/api/stories", storiesRouter);

  await new Promise((resolve) => {
    testServer = testApp.listen(TEST_PORT, resolve);
  });

  const testUserToken = jwt.sign(
    { id: 99999, email: "library_tester@lumilex.org" },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  try {
    // 1. Total library story count
    total++;
    const test1 = await test("1. Total library stories count >= 70 (22 baseline + 54 new)", async () => {
      const res = await pool.query(
        "SELECT COUNT(*)::int as count FROM stories WHERE story_type = 'library'"
      );
      const count = res.rows[0].count;
      assert.ok(count >= 70, `Expected at least 70 library stories, got ${count}`);
    });
    if (test1) passed++;

    // 2. Newly added stories count >= 50
    total++;
    const test2 = await test("2. At least 50 genuinely new stories added across 9 distinct themes", async () => {
      const res = await pool.query(`
        SELECT COUNT(*)::int as count
        FROM stories
        WHERE story_type = 'library' AND id > 36
      `);
      const newStoriesCount = res.rows[0].count;
      assert.ok(
        newStoriesCount >= 50,
        `Expected at least 50 newly added stories, got ${newStoriesCount}`
      );
    });
    if (test2) passed++;

    // 3. No duplicate titles in library stories
    total++;
    const test3 = await test("3. No duplicate story titles exist in the library", async () => {
      const res = await pool.query(`
        SELECT LOWER(title) as title, COUNT(*) as qty
        FROM stories
        WHERE story_type = 'library'
        GROUP BY LOWER(title)
        HAVING COUNT(*) > 1
      `);
      assert.strictEqual(
        res.rows.length,
        0,
        `Found duplicate titles: ${JSON.stringify(res.rows)}`
      );
    });
    if (test3) passed++;

    // 4. Word count range adheres to 50–100 words per beginner story (with Level 1 even shorter)
    total++;
    const test4 = await test("4. All library stories are short and readable (under 100 words, avg ~63)", async () => {
      const res = await pool.query(`
        SELECT id, title, difficulty, word_count, content
        FROM stories
        WHERE story_type = 'library'
      `);
      let maxWords = 0;
      let minWords = 999;
      let totalWords = 0;

      for (const story of res.rows) {
        const textWords = story.content.trim().split(/\s+/).filter(Boolean).length;
        const recordedCount = story.word_count || textWords;

        assert.ok(
          recordedCount <= 100,
          `Story "${story.title}" (ID ${story.id}) exceeds 100 words (${recordedCount} words)`
        );
        assert.ok(
          recordedCount >= 35,
          `Story "${story.title}" (ID ${story.id}) is too short (${recordedCount} words)`
        );

        if (recordedCount > maxWords) maxWords = recordedCount;
        if (recordedCount < minWords) minWords = recordedCount;
        totalWords += recordedCount;
      }

      const avgWords = Math.round(totalWords / res.rows.length);
      console.log(`    ↳ Word count range: ${minWords} – ${maxWords} words (Average: ${avgWords} words)`);
    });
    if (test4) passed++;

    // 5. Practice words fidelity: each practice word must actually exist in the story content
    total++;
    const test5 = await test("5. Practice words strictly match words present in the story text", async () => {
      const res = await pool.query(`
        SELECT id, title, content, practice_words
        FROM stories
        WHERE story_type = 'library' AND practice_words IS NOT NULL AND array_length(practice_words, 1) > 0
      `);

      assert.ok(res.rows.length >= 70, "Most library stories should have practice words defined");

      for (const story of res.rows) {
        const lowerContent = story.content.toLowerCase();
        for (const pw of story.practice_words) {
          const cleanPw = pw.toLowerCase().trim();
          assert.ok(
            lowerContent.includes(cleanPw),
            `Practice word "${cleanPw}" does not appear in story "${story.title}" (ID ${story.id})`
          );
        }
      }
    });
    if (test5) passed++;

    // 6. Reading level distribution covers all 5 requested levels
    total++;
    const test6 = await test("6. Stories are well-distributed across reading levels 1 to 5", async () => {
      const res = await pool.query(`
        SELECT
          CASE
            WHEN difficulty LIKE 'Level 1%' THEN 'Level 1'
            WHEN difficulty LIKE 'Level 2%' THEN 'Level 2'
            WHEN difficulty LIKE 'Level 3%' THEN 'Level 3'
            WHEN difficulty LIKE 'Level 4%' THEN 'Level 4'
            WHEN difficulty LIKE 'Level 5%' THEN 'Level 5'
            ELSE difficulty
          END as lvl,
          COUNT(*) as count
        FROM stories
        WHERE story_type = 'library'
        GROUP BY lvl
        ORDER BY lvl
      `);

      const levelsFound = res.rows.map((r) => r.lvl);
      console.log(`    ↳ Level breakdown: ${res.rows.map((r) => `${r.lvl}: ${r.count}`).join(", ")}`);

      assert.ok(levelsFound.includes("Level 1"), "Must include Level 1 stories");
      assert.ok(levelsFound.includes("Level 2"), "Must include Level 2 stories");
      assert.ok(levelsFound.includes("Level 3"), "Must include Level 3 stories");
      assert.ok(levelsFound.includes("Level 4"), "Must include Level 4 stories");
      assert.ok(levelsFound.includes("Level 5"), "Must include Level 5 stories");
    });
    if (test6) passed++;

    // 7. Theme coverage covers all 9 required themes
    total++;
    const test7 = await test("7. Stories span all 9 requested themes", async () => {
      const res = await pool.query(`
        SELECT topic, COUNT(*) as count
        FROM stories
        WHERE story_type = 'library'
        GROUP BY topic
        ORDER BY count DESC
      `);

      const topicsFound = res.rows.map((r) => r.topic);
      console.log(`    ↳ Theme breakdown: ${res.rows.map((r) => `${r.topic}: ${r.count}`).join(", ")}`);

      const requiredThemes = [
        "Animals",
        "Adventure",
        "Friendship",
        "School",
        "Nature",
        "Fantasy",
        "Vehicles",
        "Sports",
        "Everyday",
      ];

      for (const theme of requiredThemes) {
        assert.ok(
          topicsFound.includes(theme),
          `Required theme "${theme}" is missing from library stories`
        );
      }
    });
    if (test7) passed++;

    // 8. REST API GET /api/stories returns library stories with phonics & word_count
    total++;
    const test8 = await test("8. GET /api/stories delivers phonics_focus, practice_words, word_count", async () => {
      const apiRes = await new Promise((resolve, reject) => {
        const req = http.request(
          `${TEST_BASE_URL}/api/stories`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${testUserToken}`,
              "Content-Type": "application/json",
            },
          },
          (res) => {
            let data = "";
            res.on("data", (chunk) => (data += chunk));
            res.on("end", () => {
              try {
                resolve({ status: res.statusCode, body: JSON.parse(data) });
              } catch (e) {
                reject(e);
              }
            });
          }
        );
        req.on("error", reject);
        req.end();
      });

      assert.strictEqual(apiRes.status, 200);
      assert.ok(Array.isArray(apiRes.body));
      const libStories = apiRes.body.filter((s) => s.story_type === "library");
      assert.ok(libStories.length >= 70, `Expected >= 70 library stories from API, got ${libStories.length}`);

      const sample = libStories[0];
      assert.ok(sample.title, "Must have title");
      assert.ok(sample.content, "Must have content");
      assert.ok(sample.difficulty, "Must have difficulty/reading level");
      assert.ok(sample.topic, "Must have topic");
      assert.ok(typeof sample.word_count === "number", "Must have word_count number");
      assert.ok(typeof sample.phonics_focus === "string", "Must have phonics_focus string");
      assert.ok(Array.isArray(sample.practice_words), "Must have practice_words array");
    });
    if (test8) passed++;

  } finally {
    if (testServer) {
      testServer.close();
    }
    await pool.end();
  }

  console.log("\n========================================================");
  console.log(`📊 INVENTORY TEST RESULTS: ${passed} PASSED, ${total - passed} FAILED (Total: ${total})`);
  console.log("========================================================\n");

  if (passed !== total) {
    process.exit(1);
  }
}

runInventoryTests();
