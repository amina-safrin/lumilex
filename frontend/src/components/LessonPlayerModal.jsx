import { useState, useEffect } from "react";
import {
  X,
  Volume2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Star,
  Gem,
  Award,
  Sprout,
  Flame,
  Brain
} from "lucide-react";
import {
  speakText,
  playPopSound,
  playSuccessChime,
  playGentleEncouragement,
  playCelebrationFanfare,
  playGemEarnedSound,
} from "../utils/childAudio";
import { recordChildMistake, recordChildSuccess } from "../utils/errorTracker";
import { finishBirdbrainLesson } from "../utils/birdbrainEngine";
import "./LessonPlayerModal.css";

export default function LessonPlayerModal({
  lessonSession,
  onClose,
  onCompleted,
  userId = null,
  childName = "Reader",
}) {
  const { lesson, unit, questions = [], adaptiveMode, birdbrainMessage } = lessonSession;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [mistakesList, setMistakesList] = useState([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [finishStats, setFinishStats] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const currentQ = questions[currentIndex] || {};
  const progressPercent = Math.round(((currentIndex) / questions.length) * 100);

  // Play prompt audio automatically or when question changes
  useEffect(() => {
    if (currentQ?.prompt) {
      setSelectedAnswer(null);
      setIsAnswerChecked(false);
      setIsCorrect(false);

      const speech = currentQ.audioPrompt || currentQ.prompt;
      // Slight delay for smooth modal mount
      const timer = setTimeout(() => {
        speakText(speech, 0.9, 1.05);
      }, 350);

      return () => clearTimeout(timer);
    }
  }, [currentIndex]);

  const handleSelectChoice = (choice) => {
    if (isAnswerChecked) return;
    playPopSound();
    setSelectedAnswer(choice);
  };

  const handleCheckAnswer = () => {
    if (!selectedAnswer || isAnswerChecked) return;

    const correct = selectedAnswer.trim().toLowerCase() === currentQ.answer.trim().toLowerCase();
    setIsCorrect(correct);
    setIsAnswerChecked(true);

    if (correct) {
      playSuccessChime();
      setCorrectCount((prev) => prev + 1);
      recordChildSuccess(currentQ, unit?.id || 1, userId);
    } else {
      playGentleEncouragement();
      setMistakesList((prev) => [...prev, currentQ]);
      recordChildMistake(currentQ, unit?.id || 1, userId);
      // Read gentle hint aloud to help the child
      if (currentQ.hintSpeech || currentQ.hint) {
        setTimeout(() => {
          speakText(currentQ.hintSpeech || currentQ.hint, 0.88, 1.0);
        }, 300);
      }
    }
  };

  const handleNextQuestion = async () => {
    playPopSound();
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Completed all questions in the short lesson!
      setIsSaving(true);
      const totalQ = questions.length;
      const finalAccuracy = Math.round((correctCount / totalQ) * 100);
      const finalMistakesCount = mistakesList.length;

      try {
        const stats = await finishBirdbrainLesson({
          lessonId: lesson.id,
          unitId: unit?.id || 1,
          accuracy: finalAccuracy,
          mistakesCount: finalMistakesCount,
          userId,
        });

        setFinishStats({
          accuracy: finalAccuracy,
          mistakesCount: finalMistakesCount,
          starsEarned: stats.starsEarned,
          gemsAwarded: stats.gemsAwarded,
          isPerfect: stats.isPerfect,
        });

        setIsFinished(true);
        playCelebrationFanfare();
      } catch (err) {
        console.warn("Error finishing lesson:", err);
        setIsFinished(true);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleFinishAndReturn = () => {
    playGemEarnedSound();
    if (onCompleted) {
      onCompleted(finishStats);
    }
    onClose();
  };

  return (
    <div className="duo-lesson-overlay" role="dialog" aria-modal="true">
      <div className="duo-lesson-modal-card">
        {/* ===================================================
            HEADER / PROGRESS BAR
        =================================================== */}
        <header className="duo-lesson-header">
          <button
            type="button"
            className="duo-lesson-close-btn"
            onClick={() => {
              playPopSound();
              onClose();
            }}
            title="Exit Lesson"
          >
            <X size={20} />
          </button>

          {/* Duolingo-style Green Progress Bar */}
          <div className="duo-lesson-progress-track">
            <div
              className="duo-lesson-progress-fill"
              style={{ width: `${progressPercent}%` }}
            >
              <div className="duo-progress-shine"></div>
            </div>
          </div>

          <div className="duo-lesson-meta-badge">
            <Sparkles size={14} color="#10b981" />
            <span>Q{currentIndex + 1}/{questions.length}</span>
          </div>
        </header>

        {/* ===================================================
            BIRDBRAIN ADAPTIVE BANNER
        =================================================== */}
        {currentQ?.isBirdbrainReview && (
          <div className="birdbrain-adaptive-pill">
            <Brain size={14} color="#8b5cf6" />
            <span>{currentQ.birdbrainBadge || "Birdbrain Review: Spaced Repetition"}</span>
          </div>
        )}

        {/* ===================================================
            MAIN QUESTION VIEW
        =================================================== */}
        {!isFinished ? (
          <div className="duo-question-container">
            {/* Prompt with Audio Speaker */}
            <div className="duo-prompt-row">
              <h2>{currentQ.prompt}</h2>
              <button
                type="button"
                className="duo-speaker-btn"
                onClick={() => {
                  playPopSound();
                  speakText(currentQ.audioPrompt || currentQ.prompt, 0.88, 1.05);
                }}
                title="Hear question aloud"
              >
                <Volume2 size={22} />
              </button>
            </div>

            {/* Picture Mnemonic Anchor */}
            {currentQ.picture && (
              <div className="duo-mnemonic-card">
                <span className="mnemonic-emoji">{currentQ.picture}</span>
                {currentQ.pictureLabel && (
                  <span className="mnemonic-label">{currentQ.pictureLabel}</span>
                )}
              </div>
            )}

            {/* Choice Buttons */}
            <div className="duo-choices-grid">
              {(currentQ.choices || []).map((choice, idx) => {
                const isSelected = selectedAnswer === choice;
                let choiceClass = "duo-choice-card";

                if (isSelected) {
                  choiceClass += " selected";
                }
                if (isAnswerChecked) {
                  if (choice.trim().toLowerCase() === currentQ.answer.trim().toLowerCase()) {
                    choiceClass += " correct-revealed";
                  } else if (isSelected && !isCorrect) {
                    choiceClass += " incorrect-revealed";
                  }
                }

                return (
                  <button
                    key={`${choice}-${idx}`}
                    type="button"
                    className={choiceClass}
                    onClick={() => handleSelectChoice(choice)}
                    disabled={isAnswerChecked}
                  >
                    <span className="choice-number">{idx + 1}</span>
                    <span className="choice-text">{choice}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* ===================================================
              CELEBRATORY COMPLETION SCREEN (DUOLINGO STYLE)
          =================================================== */
          <div className="duo-lesson-finished-view">
            <div className="finish-trophy-ring">
              <span className="finish-trophy-emoji">🏆</span>
            </div>

            <h2>Lesson Complete, {childName}! 🎉</h2>
            <p className="finish-subtitle">
              You finished <strong>{lesson.title}</strong> in {unit?.title || "Phonics"}!
            </p>

            {/* Rewards Grid */}
            <div className="finish-rewards-grid">
              <div className="finish-stat-card stars">
                <Star size={24} fill="#ffc800" color="#ffc800" />
                <strong>+{finishStats?.starsEarned || 3} Stars</strong>
                <span>Effort Points</span>
              </div>

              <div className="finish-stat-card gems">
                <Gem size={24} fill="#1cb0f6" color="#1cb0f6" />
                <strong>+{finishStats?.gemsAwarded || 5} Gems</strong>
                <span>Star Crystals</span>
              </div>

              <div className="finish-stat-card accuracy">
                <Award size={24} color="#10b981" />
                <strong>{finishStats?.accuracy || 100}%</strong>
                <span>Accuracy</span>
              </div>

              <div className="finish-stat-card tree">
                <Sprout size={24} color="#16a34a" />
                <strong>+15 Points</strong>
                <span>Tree Water</span>
              </div>
            </div>

            {/* Birdbrain Diagnostics */}
            <div className="finish-birdbrain-card">
              <div className="birdbrain-header">
                <Brain size={18} color="#8b5cf6" />
                <strong>Birdbrain AI Report</strong>
              </div>
              <p>
                {finishStats?.isPerfect
                  ? "Flawless score! Birdbrain upgraded your learning path with bonus Challenger diamonds!"
                  : finishStats?.accuracy >= 75
                  ? "Great phonetic retention! Next stepping stone unlocked on your dashboard path."
                  : "Good effort! Birdbrain will gently reinforce these letter friends in your upcoming practice."}
              </p>
            </div>

            <button
              type="button"
              className="duo-finish-continue-btn"
              onClick={handleFinishAndReturn}
            >
              <span>Continue Learning Path 🚀</span>
              <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* ===================================================
            DUOLINGO INSTANT BOTTOM FEEDBACK DRAWER
        =================================================== */}
        {!isFinished && (
          <div
            className={`duo-bottom-feedback-bar ${
              isAnswerChecked
                ? isCorrect
                  ? "state-correct"
                  : "state-incorrect"
                : "state-pending"
            }`}
          >
            {!isAnswerChecked ? (
              <div className="feedback-pending-row">
                <button
                  type="button"
                  className="duo-check-btn"
                  onClick={handleCheckAnswer}
                  disabled={!selectedAnswer}
                >
                  CHECK ANSWER
                </button>
              </div>
            ) : isCorrect ? (
              <div className="feedback-result-row correct">
                <div className="feedback-msg">
                  <CheckCircle2 size={32} color="#15803d" />
                  <div>
                    <strong>Nicely Done! 🌟</strong>
                    <span>You nailed this sound! +1 Gem</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="duo-continue-btn correct-btn"
                  onClick={handleNextQuestion}
                >
                  CONTINUE
                </button>
              </div>
            ) : (
              <div className="feedback-result-row incorrect">
                <div className="feedback-msg">
                  <AlertCircle size={32} color="#b91c1c" />
                  <div>
                    <strong>Friendly Hint:</strong>
                    <span>{currentQ.hint || `Correct answer is ${currentQ.answer}`}</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="duo-continue-btn incorrect-btn"
                  onClick={handleNextQuestion}
                >
                  GOT IT
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
