import { useMemo } from "react";
import {
  Sparkles,
  Lock,
  Check,
  Star,
  Brain,
  ArrowRight,
  Flame,
  Award,
  ChevronRight,
  Play
} from "lucide-react";
import { playPopSound } from "../utils/childAudio";
import { getChildUnitProgress } from "../utils/birdbrainEngine";
import "./DuolingoPath.css";

// Horizontal stepping-stone offsets to mimic Duolingo's iconic winding path
const NODE_OFFSETS = [0, -45, -75, -45, 0, 45, 75, 45];

export default function DuolingoPath({
  learningState,
  errorTracker,
  onStartLesson,
  childName = "Reader",
  activeUnitFilter = null,
}) {
  const unitProgress = useMemo(() => {
    return getChildUnitProgress(learningState);
  }, [learningState]);

  const { units, overallPercent, currentActiveLesson } = unitProgress;

  // Filter units if requested (e.g. showing active unit on Dashboard)
  const displayUnits = useMemo(() => {
    if (activeUnitFilter) {
      return units.filter((u) => u.id === activeUnitFilter);
    }
    return units;
  }, [units, activeUnitFilter]);

  const handleNodeClick = (lesson, unit) => {
    if (!lesson.isUnlocked) {
      playPopSound();
      return;
    }
    playPopSound();
    if (onStartLesson) {
      onStartLesson(lesson.id, unit.id);
    }
  };

  return (
    <div className="duo-path-wrapper">
      {/* ===================================================
          BIRDBRAIN AI ADAPTIVE COMPANION CARD
      =================================================== */}
      <div className="birdbrain-path-card">
        <div className="birdbrain-avatar-box">
          <div className="birdbrain-owl-icon">🦉</div>
          <div className="birdbrain-pulse-ring"></div>
        </div>

        <div className="birdbrain-info">
          <div className="birdbrain-tag">
            <Brain size={14} color="#8b5cf6" />
            <span>BIRDBRAIN ADAPTIVE ENGINE</span>
          </div>

          <h3>Level-by-Level Lessons for {childName}</h3>

          <p>
            Birdbrain customizes each lesson to your child's exact reading pace,
            starting from friendly alphabet shapes and phoneme sounds.
          </p>

          <div className="birdbrain-stats-bar">
            <div className="stat-pill">
              <Sparkles size={14} color="#10b981" />
              <span>{unitProgress.completedCount} of {unitProgress.totalLessons} Lessons Mastered</span>
            </div>
            <div className="stat-pill">
              <Star size={14} fill="#f59e0b" color="#f59e0b" />
              <span>{overallPercent}% Curriculum Progress</span>
            </div>
          </div>
        </div>

        {currentActiveLesson && (
          <div className="birdbrain-cta-box">
            <button
              type="button"
              className="birdbrain-start-hero-btn"
              onClick={() => handleNodeClick(currentActiveLesson, { id: currentActiveLesson.unitId })}
            >
              <Play size={18} fill="#ffffff" />
              <span>CONTINUE PATH</span>
            </button>
            <span className="cta-lesson-title">Next: {currentActiveLesson.title}</span>
          </div>
        )}
      </div>

      {/* ===================================================
          WINDING UNITS & LESSON STEPPING STONES
      =================================================== */}
      <div className="duo-units-container">
        {displayUnits.map((unit) => {
          return (
            <section key={unit.id} className="duo-unit-section">
              {/* Unit Header Banner */}
              <div
                className="duo-unit-header-card"
                style={{
                  background: `linear-gradient(135deg, ${unit.color} 0%, #047857 100%)`,
                }}
              >
                <div className="unit-header-info">
                  <div className="unit-badge">UNIT {unit.unitNumber}</div>
                  <h2>{unit.title}</h2>
                  <p>{unit.subtitle}</p>
                </div>

                <div className="unit-header-trophy">
                  <span className="unit-icon">{unit.icon}</span>
                </div>
              </div>

              {/* Stepping Stones Path */}
              <div className="duo-stepping-stones-lane">
                {unit.lessons.map((lesson, idx) => {
                  const offset = NODE_OFFSETS[idx % NODE_OFFSETS.length];
                  const isCurrent = lesson.isCurrent;
                  const isDone = lesson.isCompleted;
                  const isLocked = !lesson.isUnlocked;

                  let nodeClass = "duo-path-node";
                  if (isDone) nodeClass += " node-completed";
                  else if (isCurrent) nodeClass += " node-active";
                  else if (isLocked) nodeClass += " node-locked";

                  return (
                    <div
                      key={lesson.id}
                      className="duo-node-slot"
                      style={{ transform: `translateX(${offset}px)` }}
                    >
                      {/* Floating 'START' or Crown Banner for current active node */}
                      {isCurrent && (
                        <div className="duo-active-floating-banner">
                          <span>START</span>
                          <div className="banner-pointer"></div>
                        </div>
                      )}

                      {/* Interactive 3D Circular Node */}
                      <button
                        type="button"
                        className={nodeClass}
                        onClick={() => handleNodeClick(lesson, unit)}
                        title={
                          isLocked
                            ? "Complete earlier lessons to unlock!"
                            : `${lesson.title} - ${lesson.subtitle}`
                        }
                        aria-label={`${lesson.title}: ${lesson.isCompleted ? "Completed" : lesson.isUnlocked ? "Available" : "Locked"}`}
                      >
                        <div className="node-inner-circle">
                          {isDone ? (
                            <Check size={28} strokeWidth={3.5} color="#ffffff" />
                          ) : isLocked ? (
                            <Lock size={22} color="#94a3b8" />
                          ) : (
                            <span className="node-emoji">{lesson.icon || unit.icon}</span>
                          )}
                        </div>

                        {/* Ripple waves for active node */}
                        {isCurrent && (
                          <>
                            <div className="node-glow-ring ring-1"></div>
                            <div className="node-glow-ring ring-2"></div>
                          </>
                        )}
                      </button>

                      {/* Stars Earned indicator below completed nodes */}
                      {isDone && (
                        <div className="node-stars-badge">
                          <Star size={12} fill="#ffc800" color="#ffc800" />
                          <Star size={12} fill="#ffc800" color="#ffc800" />
                          <Star size={12} fill="#ffc800" color="#ffc800" />
                        </div>
                      )}

                      {/* Lesson title caption */}
                      <span className="node-label-caption">
                        {lesson.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
