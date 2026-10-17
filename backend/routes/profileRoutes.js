const express = require("express");

const pool = require("../db");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();


// ==============================
// CREATE CHILD PROFILE
// ==============================

router.post("/", authenticateToken, async (req, res) => {
  try {
    const {
      childName,
      age,
      interests,
      readingLevel,
    } = req.body;

    if (!childName || !age) {
      return res.status(400).json({
        message: "Child name and age are required",
      });
    }

    const existingProfile = await pool.query(
      "SELECT id FROM child_profiles WHERE user_id = $1",
      [req.user.id]
    );

    if (existingProfile.rows.length > 0) {
      return res.status(409).json({
        message: "Child profile already exists",
      });
    }

    const result = await pool.query(
      `INSERT INTO child_profiles
       (user_id, child_name, age, interests, reading_level)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        req.user.id,
        childName,
        age,
        interests || [],
        readingLevel || "beginner",
      ]
    );

    res.status(201).json({
      message: "Child profile created successfully",
      profile: result.rows[0],
    });

  } catch (error) {
    console.error("Profile creation error:", error);

    res.status(500).json({
      message: "Server error while creating profile",
    });
  }
});


// ==============================
// GET CHILD PROFILE
// ==============================

router.get("/", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT *
       FROM child_profiles
       WHERE user_id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Child profile not found",
      });
    }

    res.json({
      profile: result.rows[0],
    });

  } catch (error) {
    console.error("Profile fetch error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});


module.exports = router;