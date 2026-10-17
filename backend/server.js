const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const passport = require("passport");
require("dotenv").config();

const storiesRoutes = require("./routes/stories");

const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const speechRoutes = require("./routes/speech");

const app = express();


// ==============================
// MIDDLEWARE
// ==============================

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json());

app.use(cookieParser());

app.use(passport.initialize());


// ==============================
// ROUTES
// ==============================

app.get("/", (req, res) => {
  res.json({
    message: "LumiLex AI backend is running!",
  });
});

app.use("/api/auth", authRoutes);

app.use("/api/profile", profileRoutes);

app.use("/api/stories", storiesRoutes);

app.use("/api/speech", speechRoutes);


// ==============================
// SERVER
// ==============================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`LumiLex backend running on port ${PORT}`);
});