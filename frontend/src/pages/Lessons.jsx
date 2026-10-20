import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Flame,
  Gem,
  Star,
  Crown,
  Volume2,
  VolumeX,
  Brain,
  Sparkles,
  BookOpen
} from "lucide-react";
import DuolingoPath from "../components/DuolingoPath";
import LessonPlayerModal from "../components/LessonPlayerModal";
import { getLearningState } from "../utils/learningRewards";
import { getErrorTrackerState } from "../utils/errorTracker";
import { generateBirdbrainLesson, DUO_UNITS } from "../utils/birdbrainEngine";
import { toggleMuteSounds, isSoundsMuted, playPopSound } from "../utils/childAudio";
import { useChild } from "../context/ChildContext";
import "./Lessons.css";

export default function Lessons() {
  const navigate = useNavigate();
  const { userId, childName } = useChild();

  const [learningState, setLearningState] = useState(() => getLearningState(userId));
  const [errorTracker, setErrorTracker] = useState(() => getErrorTrackerState(userId));
  const [isMuted, setIsMuted] = useState(() => isSoundsMuted());
  const [activeLessonSession, setActiveLessonSession] = useState(null);
  const [selectedUnitFilter, setSelectedUnitFilter] = useState(null);

  useEffect(() => {
    const refresh = () => {
      setLearningState(getLearningState(userId));
      setErrorTracker(getErrorTrackerState(userId));
    };
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [userId]);

  const handleToggleMute = () => {
    const muted = toggleMuteSounds();
    setIsMuted(muted);
    if (muted && typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  };

  const handleStartLesson = (lessonId, unitId) => {
    playPopSound();
    const session = generateBirdbrainLesson({
      targetLessonId: lessonId,
      userId,
      mistakesMap: errorTracker.mistakes,
      errorTracker,
    });
    setActiveLessonSession(session);
  };

  const handleLessonCompleted = (stats) => {
    // Refresh learning state immediately
    setLearningState(getLearningState(userId));
    setErrorTracker(getErrorTrackerState(userId));
  };

  return (
    <div className="lessons-page-container">
      {/* ===================================================
          TOP BAR & STATS (DUOLINGO STYLE)
      =================================================== */}
      <header className="lessons-topbar">
        <button
          type="button"
          className="lessons-back-btn"
          onClick={() => {
            playPopSound();
            navigate("/dashboard");
          }}
        >
          <ArrowLeft size={18} />
          <span>Dashboard</span>
        </button>

        <div className="lessons-stats-strip">
          {/* STREAK */}
          <div className="lessons-stat-pill streak" title="Daily Learning Streak">
            <Flame size={17} fill="#ff7a00" color="#ff7a00" />
            <span>{errorTracker.streakDays} Day</span>
          </div>

          {/* GEMS */}
          <div className="lessons-stat-pill gems" title="Star Gems">
            <Gem size={17} fill="#1cb0f6" color="#1cb0f6" />
            <span>{errorTracker.gems}</span>
          </div>

          {/* STARS */}
          <div className="lessons-stat-pill stars" title="Effort Stars">
            <Star size={17} fill="#ffc800" color="#ffc800" />
            <span>{learningState.stars}</span>
          </div>

          {/* PERFECT LESSON CROWNS */}
          <div className="lessons-stat-pill crowns" title="Perfect Crowns">
            <Crown size={17} fill="#e5a100" color="#e5a100" />
            <span>{errorTracker.perfectLessonsCount}</span>
          </div>

          {/* MUTE TOGGLE */}
          <button
            type="button"
            className="lessons-sound-btn"
            onClick={handleToggleMute}
            title={isMuted ? "Unmute sounds" : "Mute sounds"}
          >
            {isMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
          </button>
        </div>
      </header>

      {/* ===================================================
          MAIN CONTENT AREA
      =================================================== */}
      <main className="lessons-main-content">
        <div className="lessons-content-column">
          {/* Unit Filter Navigation Tabs */}
          <div className="lessons-unit-tabs">
            <button
              type="button"
              className={`unit-tab-pill ${selectedUnitFilter === null ? "active" : ""}`}
              onClick={() => {
                playPopSound();
                setSelectedUnitFilter(null);
              }}
            >
              All Units 🌈
            </button>
            {DUO_UNITS.map((u) => (
              <button
                key={u.id}
                type="button"
                className={`unit-tab-pill ${selectedUnitFilter === u.id ? "active" : ""}`}
                onClick={() => {
                  playPopSound();
                  setSelectedUnitFilter(u.id);
                }}
              >
                <span>{u.icon}</span>
                <span>Unit {u.unitNumber}</span>
              </button>
            ))}
          </div>

          {/* Duolingo Winding Stepping Stones Path */}
          <DuolingoPath
            learningState={learningState}
            errorTracker={errorTracker}
            onStartLesson={handleStartLesson}
            childName={childName}
            activeUnitFilter={selectedUnitFilter}
          />
        </div>
      </main>

      {/* ===================================================
          MODAL LESSON PLAYER (ACTIVE SHORT BITE-SIZED SESSION)
      =================================================== */}
      {activeLessonSession && (
        <LessonPlayerModal
          lessonSession={activeLessonSession}
          onClose={() => setActiveLessonSession(null)}
          onCompleted={handleLessonCompleted}
          userId={userId}
          childName={childName}
        />
      )}
    </div>
  );
}
