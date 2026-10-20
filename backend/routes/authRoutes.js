const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const pool = require("../db");

const router = express.Router();

// ======================================================
// CREATE JWT TOKEN
// ======================================================

function createToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
}

// ======================================================
// SET AUTH COOKIE
// ======================================================

function setAuthCookie(res, token) {
  res.cookie("token", token, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

// ======================================================
// SIGN UP
// ======================================================

router.post("/signup", async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    // Check required fields
    if (!fullName || !email || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // Check password length
    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if account already exists
    // IMPORTANT: LumiLex uses userss, NOT users
    const existingUser = await pool.query(
      "SELECT id FROM userss WHERE email = $1",
      [normalizedEmail]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        message: "An account with this email already exists",
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create account
    const result = await pool.query(
      `INSERT INTO userss
       (full_name, email, password_hash, auth_provider)
       VALUES ($1, $2, $3, 'email')
       RETURNING id, full_name, email`,
      [fullName.trim(), normalizedEmail, passwordHash]
    );

    const user = result.rows[0];

    // Initialize individual learning progress (stars initially zero)
    await pool.query(
      `INSERT INTO learning_progress (user_id, stars, current_level, garden_points, completed_stories, completed_sessions)
       VALUES ($1, 0, 1, 0, 0, 0)
       ON CONFLICT (user_id) DO NOTHING`,
      [user.id]
    );

    // Initialize child preferences (gems initially 0, welcome reward unclaimed, streak is 0 on day 1)
    await pool.query(
      `INSERT INTO child_preferences (user_id, theme, streak_days, last_practice_date, last_daily_bonus_date, gems, perfect_lessons, welcome_reward_claimed)
       VALUES ($1, 'forest', 0, NULL, NULL, 0, 0, FALSE)
       ON CONFLICT (user_id) DO NOTHING`,
      [user.id]
    );

    // Create login token
    const token = createToken(user);

    // Store token in cookie
    setAuthCookie(res, token);

    return res.status(201).json({
      message: "Account created successfully",
      user,
    });
  } catch (error) {
    console.error("Signup error:", error);

    return res.status(500).json({
      message: "Server error during signup",
    });
  }
});

// ======================================================
// LOGIN
// ======================================================

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check required fields
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find account
    const result = await pool.query(
      "SELECT * FROM userss WHERE email = $1",
      [normalizedEmail]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const user = result.rows[0];

    // Google account doesn't have a password
    if (!user.password_hash) {
      return res.status(401).json({
        message: "This account uses Google login",
      });
    }

    // Compare password
    const passwordMatch = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Create token
    const token = createToken(user);

    // Store token
    setAuthCookie(res, token);

    return res.json({
      message: "Login successful",
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Server error during login",
    });
  }
});

// ======================================================
// CURRENT USER
// ======================================================

router.get("/me", async (req, res) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        message: "Not authenticated",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const result = await pool.query(
      `SELECT id, full_name, email
       FROM userss
       WHERE id = $1`,
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    return res.json({
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Authentication error:", error);

    return res.status(401).json({
      message: "Invalid session",
    });
  }
});

// ======================================================
// LOGOUT
// ======================================================

router.post("/logout", (req, res) => {
  res.clearCookie("token");

  return res.json({
    message: "Logged out successfully",
  });
});

// ======================================================
// DELETE ACCOUNT
// ======================================================

router.delete("/account", async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // Delete user (CASCADE deletes child_profiles, stories, learning_progress, learning_mistakes, child_preferences)
    await pool.query("DELETE FROM userss WHERE id = $1", [userId]);

    res.clearCookie("token");
    return res.json({ message: "Account and all reading progress deleted successfully" });
  } catch (error) {
    console.error("Account deletion error:", error);
    return res.status(500).json({ message: "Failed to delete account" });
  }
});

// ======================================================
// GOOGLE AUTHENTICATION
// ======================================================

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:
        "http://localhost:5000/api/auth/google/callback",
    },

    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;

        if (!email) {
          return done(null, false);
        }

        const normalizedEmail = email.toLowerCase().trim();

        // ------------------------------------------------
        // Check if Google account already exists
        // ------------------------------------------------

        let result = await pool.query(
          `SELECT *
           FROM userss
           WHERE google_id = $1`,
          [profile.id]
        );

        if (result.rows.length > 0) {
          return done(null, result.rows[0]);
        }

        // ------------------------------------------------
        // Check if email already exists
        // ------------------------------------------------

        result = await pool.query(
          `SELECT *
           FROM userss
           WHERE email = $1`,
          [normalizedEmail]
        );

        if (result.rows.length > 0) {
          const existingUser = result.rows[0];

          // Link Google account to existing account
          await pool.query(
            `UPDATE userss
             SET google_id = $1,
                 auth_provider = 'google'
             WHERE id = $2`,
            [profile.id, existingUser.id]
          );

          existingUser.google_id = profile.id;
          existingUser.auth_provider = "google";

          return done(null, existingUser);
        }

        // ------------------------------------------------
        // Create new Google account
        // ------------------------------------------------

        const newUser = await pool.query(
          `INSERT INTO userss
           (full_name, email, google_id, auth_provider)
           VALUES ($1, $2, $3, 'google')
           RETURNING *`,
          [
            profile.displayName,
            normalizedEmail,
            profile.id,
          ]
        );

        const createdUser = newUser.rows[0];

        // Initialize progress & preferences (stars = 0, streak = 0, gems = 0, welcome reward unclaimed)
        await pool.query(
          `INSERT INTO learning_progress (user_id, stars, current_level, garden_points, completed_stories, completed_sessions)
           VALUES ($1, 0, 1, 0, 0, 0)
           ON CONFLICT (user_id) DO NOTHING`,
          [createdUser.id]
        );

        await pool.query(
          `INSERT INTO child_preferences (user_id, theme, streak_days, last_practice_date, last_daily_bonus_date, gems, perfect_lessons, welcome_reward_claimed)
           VALUES ($1, 'forest', 0, NULL, NULL, 0, 0, FALSE)
           ON CONFLICT (user_id) DO NOTHING`,
          [createdUser.id]
        );

        return done(null, createdUser);
      } catch (error) {
        console.error(
          "Google authentication error:",
          error
        );

        return done(error, null);
      }
    }
  )
);

// ======================================================
// GOOGLE LOGIN
// ======================================================

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

// ======================================================
// GOOGLE CALLBACK
// ======================================================

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login`,
  }),

  (req, res) => {
    const token = createToken(req.user);

    setAuthCookie(res, token);

    res.redirect(
      `${process.env.FRONTEND_URL}/dashboard`
    );
  }
);

// ======================================================
// EXPORT ROUTER
// ======================================================

module.exports = router;