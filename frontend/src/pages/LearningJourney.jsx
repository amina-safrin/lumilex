import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Flame,
  Gem,
  Star,
  Crown,
  Volume2,
  VolumeX,
  Dumbbell,
  BookOpen,
  Award,
  Sparkles,
  Sprout
} from "lucide-react";
import "./LearningJourney.css";

import { getLearningState } from "../utils/learningRewards";
import { getErrorTrackerState } from "../utils/errorTracker";
import { toggleMuteSounds, isSoundsMuted, playTapSound, speakText } from "../utils/childAudio";
import { useChild } from "../context/ChildContext";
import VirtualTree from "../components/VirtualTree";

export default function LearningJourney() {
  const navigate = useNavigate();
  const { userId, childName } = useChild();

  const [learningState, setLearningState] = useState(() => getLearningState(userId));
  const [errorTracker, setErrorTracker] = useState(() => getErrorTrackerState(userId));
  const [isMuted, setIsMuted] = useState(() => isSoundsMuted());

  useEffect(() => {
    setLearningState(getLearningState(userId));
    setErrorTracker(getErrorTrackerState(userId));
  }, [userId]);

  const handleToggleMute = () => {
    const muted = toggleMuteSounds();
    setIsMuted(muted);
    if (muted && typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  };

  const handleGoToPractice = () => {
    playTapSound();
    navigate("/practice");
  };

  const handleGoToStories = () => {
    playTapSound();
    navigate("/stories");
  };

  return (
    <div className="learning-page duolingo-theme">
      {/* ===================================================
          TOP BAR & STATS
      =================================================== */}
      <header className="duo-topbar">
        <button
          className="duo-back-btn"
          onClick={() => {
            playTapSound();
            navigate("/dashboard");
          }}
        >
          <ArrowLeft size={18} />
          <span>Dashboard</span>
        </button>

        <div className="duo-stats-row">
          {/* STREAK */}
          <div className="duo-stat-pill streak" title="Daily Reading Streak">
            <Flame size={18} fill="#ff7a00" color="#ff7a00" />
            <span>{errorTracker.streakDays} Day</span>
          </div>

          {/* GEMS */}
          <div className="duo-stat-pill gems" title="Collected Gems">
            <Gem size={17} fill="#1cb0f6" color="#1cb0f6" />
            <span>{errorTracker.gems}</span>
          </div>

          {/* STARS */}
          <div className="duo-stat-pill stars" title="Effort Stars">
            <Star size={17} fill="#ffc800" color="#ffc800" />
            <span>{learningState.stars}</span>
          </div>

          {/* CROWNS */}
          <div className="duo-stat-pill crowns" title="Perfect Lesson Crowns">
            <Crown size={17} fill="#e5a100" color="#e5a100" />
            <span>{errorTracker.perfectLessonsCount}</span>
          </div>

          {/* SOUND TOGGLE */}
          <button
            type="button"
            className="duo-sound-btn"
            onClick={handleToggleMute}
            title={isMuted ? "Unmute sounds" : "Mute sounds"}
            aria-label={isMuted ? "Unmute sounds" : "Mute sounds"}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </div>
      </header>

      {/* ===================================================
          MAIN CONTENT AREA (FOCUSED ON VIRTUAL TREE GROWTH)
      =================================================== */}
      <main className="duo-main-container">
        {/* HERO BANNER */}
        <section className="duo-hero-card">
          <div className="hero-content">
            <div className="intensity-badge">
              <Sprout size={15} />
              <span>Magical Tree Sanctuary</span>
            </div>

            <h1>{childName || "Reader"}'s Learning Tree</h1>

            <p>
              Every story you read and every practice session you complete nurtures
              your magical reading tree. Watch it sprout, grow lush branches, bloom
              flowers, and produce golden wisdom apples!
            </p>

            <div style={{ display: "flex", gap: "12px", marginTop: "18px", flexWrap: "wrap" }}>
              <button
                type="button"
                className="duo-mic-btn"
                onClick={handleGoToPractice}
                style={{ padding: "12px 22px", fontSize: "15px", gap: "10px" }}
              >
                <Dumbbell size={18} />
                <span>Go to Practice Levels 🎯</span>
              </button>

              <button
                type="button"
                className="duo-word-pill"
                onClick={handleGoToStories}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 18px",
                  borderRadius: "14px",
                  background: "#ffffff",
                  border: "2px solid #d4e4d2",
                  color: "#274a30",
                  fontWeight: "800",
                  textDecoration: "none"
                }}
              >
                <BookOpen size={16} />
                <span>Read Story Books 📚</span>
              </button>
            </div>
          </div>

          <div className="duo-hero-mascot">
            <div className="mascot-avatar">🌳</div>
            <div className="mascot-speech-bubble">
              <span>Water your tree with reading adventures!</span>
            </div>
          </div>
        </section>

        {/* ===================================================
            VIRTUAL READING TREE GROWTH COMPONENT
        =================================================== */}
        <VirtualTree
          gardenPoints={learningState.gardenPoints}
          completedStories={learningState.completedStories}
          completedSessions={learningState.completedSessions}
          stars={learningState.stars}
          childName={childName}
        />

        {/* ===================================================
            GROWTH ACTION CARD
        =================================================== */}
        <section
          style={{
            marginTop: "30px",
            padding: "26px 30px",
            background: "linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%)",
            border: "2px solid #bbf7d0",
            borderRadius: "26px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "20px",
            flexWrap: "wrap"
          }}
        >
          <div>
            <span
              style={{
                fontSize: "12px",
                fontWeight: "900",
                color: "#166534",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}
            >
              🌱 Help Your Tree Grow
            </span>
            <h3 style={{ margin: "6px 0 4px", fontSize: "20px", fontWeight: "900", color: "#14532d" }}>
              Practice levels with pictures & sounds
            </h3>
            <p style={{ margin: 0, color: "#15803d", fontSize: "14px" }}>
              Every completed practice session awards +1 Garden Growth Point and sparkling gems!
            </p>
          </div>

          <button
            type="button"
            className="duo-submit-btn"
            onClick={handleGoToPractice}
            style={{ padding: "14px 28px", fontSize: "16px", whiteSpace: "nowrap" }}
          >
            <span>Play Practice Levels</span>
            <ArrowRight size={18} />
          </button>
        </section>
      </main>
    </div>
  );
}
