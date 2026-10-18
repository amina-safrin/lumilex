import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  LockKeyhole,
  RotateCcw,
  Sparkles,
  Star,
  Trophy,
  Volume2,
  VolumeX,
  Plus,
  Flame,
  Crown,
  Mic,
  MicOff,
  Zap,
  Heart,
  Smile,
  Wand2,
  Gem,
  Dumbbell
} from "lucide-react";
import "./LearningJourney.css";

import {
  getLearningState,
  LEARNING_LEVELS,
  recordPracticeSession
} from "../utils/learningRewards";

import {
  playSuccessChime,
  playRetryGentleSound,
  playTapSound,
  playCombineSound,
  playHintSound,
  playCelebrationFanfare,
  playGemEarnedSound,
  speakText,
  speakLetterMnemonic,
  speakCompoundWord,
  toggleMuteSounds,
  isSoundsMuted
} from "../utils/childAudio";

import {
  getErrorTrackerState,
  recordChildMistake,
  recordChildSuccess,
  getTrickyItems,
  completeLessonSession,
  getAdaptiveIntensity
} from "../utils/errorTracker";
import { useChild } from "../context/ChildContext";

export default function Practice() {
  const navigate = useNavigate();
  const { userId, childName } = useChild();

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        try { mediaRecorderRef.current.stop(); } catch (e) {}
      }
      if (microphoneStreamRef.current) {
        microphoneStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const [learningState, setLearningState] = useState(() => getLearningState(userId));
  const [errorTracker, setErrorTracker] = useState(() => getErrorTrackerState(userId));

  useEffect(() => {
    setLearningState(getLearningState(userId));
    setErrorTracker(getErrorTrackerState(userId));
  }, [userId]);

  const [activeLevel, setActiveLevel] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [answers, setAnswers] = useState([]);
  const [showHint, setShowHint] = useState(false);
  const [speakingText, setSpeakingText] = useState("");
  const [sessionResult, setSessionResult] = useState(null);
  const [isMuted, setIsMuted] = useState(() => isSoundsMuted());
  const [combinedSuccess, setCombinedSuccess] = useState(false);

  // Voice recording state
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [voiceHeardText, setVoiceHeardText] = useState("");
  const [voiceFeedback, setVoiceFeedback] = useState("");

  // Review round
  const [isReviewRound, setIsReviewRound] = useState(false);
  const [mistakesInCurrentLesson, setMistakesInCurrentLesson] = useState([]);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const microphoneStreamRef = useRef(null);

  const trickyItems = useMemo(() => getTrickyItems(null, userId), [errorTracker, userId]);
  const currentIntensity = useMemo(() => getAdaptiveIntensity(errorTracker), [errorTracker]);

  const handleToggleMute = () => {
    const muted = toggleMuteSounds();
    setIsMuted(muted);
    if (muted && typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  };

  const startLevel = (level, isReviewMode = false, reviewItemsList = null) => {
    if (isReviewMode && reviewItemsList && reviewItemsList.length > 0) {
      setIsReviewRound(true);
      setActiveLevel({
        id: 99,
        title: "Tricky Friends Practice",
        subtitle: "Conquer the friendly sounds that challenged you!",
        icon: "🪄",
        skill: "Targeted error review & confidence booster",
        description: "Let's review these tricky friends together. You can do it!",
        questions: reviewItemsList.map((m) => m.questionData),
      });
    } else {
      setIsReviewRound(false);
      setActiveLevel(level);
    }

    setQuestionIndex(0);
    setSelectedAnswer("");
    setAnswers([]);
    setShowHint(false);
    setSessionResult(null);
    setCombinedSuccess(false);
    setMistakesInCurrentLesson([]);
    setVoiceHeardText("");
    setVoiceFeedback("");

    playTapSound();
    speakText(`Let's practice!`, {
      onStart: () => setSpeakingText("Starting practice..."),
      onEnd: () => setSpeakingText(""),
    });
  };

  const currentQuestionsList = activeLevel?.questions || [];
  const currentQuestion = currentQuestionsList[questionIndex];

  const handleSelectChoice = (choice) => {
    playTapSound();
    setSelectedAnswer(choice);

    if (currentQuestion?.type === "compound") {
      playCombineSound();
      setCombinedSuccess(true);
      speakCompoundWord(currentQuestion.part1, currentQuestion.part2, choice);
      setSpeakingText(`${currentQuestion.part1} + ${currentQuestion.part2} = ${choice}`);
    } else {
      speakText(choice, {
        onStart: () => setSpeakingText(choice),
        onEnd: () => setSpeakingText(""),
      });
    }
  };

  const submitAnswer = () => {
    if (!selectedAnswer || !activeLevel) return;

    const isCorrect = selectedAnswer === currentQuestion.answer;

    if (isCorrect) {
      playSuccessChime();
      recordChildSuccess(currentQuestion, activeLevel.id, userId);
    } else {
      playRetryGentleSound();
      recordChildMistake(currentQuestion, activeLevel.id, userId);
      setMistakesInCurrentLesson((prev) => [...prev, currentQuestion]);
    }

    setErrorTracker(getErrorTrackerState(userId));

    const nextAnswers = [...answers, isCorrect];
    setAnswers(nextAnswers);
    setShowHint(false);
    setCombinedSuccess(false);

    if (questionIndex < currentQuestionsList.length - 1) {
      setQuestionIndex(questionIndex + 1);
      setSelectedAnswer("");
      return;
    }

    const correctCount = nextAnswers.filter(Boolean).length;
    const accuracy = Math.round((correctCount / currentQuestionsList.length) * 100);

    const lessonRewardData = completeLessonSession({
      accuracy,
      levelId: activeLevel.id,
      mistakesCount: mistakesInCurrentLesson.length + (isCorrect ? 0 : 1),
      userId,
    });

    const rewardResult = recordPracticeSession(
      activeLevel.id,
      correctCount,
      currentQuestionsList.length,
      userId
    );

    setLearningState(rewardResult.state);
    setErrorTracker(getErrorTrackerState(userId));

    setSessionResult({
      ...rewardResult,
      correct: correctCount,
      total: currentQuestionsList.length,
      accuracy,
      isPerfect: lessonRewardData.isPerfect,
      gemsEarned: lessonRewardData.gemsEarned,
      streakDays: lessonRewardData.streakDays,
      intensity: lessonRewardData.intensity,
    });

    if (lessonRewardData.isPerfect) {
      playCelebrationFanfare();
      playGemEarnedSound();
      speakText("Perfect lesson! You earned a golden crown!");
    } else if (rewardResult.levelCompleted) {
      playCelebrationFanfare();
      speakText("Awesome work! You passed this level!");
    }
  };

  const closePractice = () => {
    setActiveLevel(null);
    setSessionResult(null);
    setCombinedSuccess(false);
    setIsReviewRound(false);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  };

  return (
    <div className="learning-page duolingo-theme practice-page">
      <header className="duo-topbar">
        <button className="duo-back-btn" onClick={() => navigate("/dashboard")}>
          <ArrowLeft size={18} /> <span>Dashboard</span>
        </button>

        <div className="duo-stats-row">
          <div className="duo-stat-pill streak">
            <Flame size={18} fill="#ff7a00" color="#ff7a00" />
            <span>{errorTracker.streakDays} Day</span>
          </div>

          <div className="duo-stat-pill gems">
            <Gem size={17} fill="#1cb0f6" color="#1cb0f6" />
            <span>{errorTracker.gems}</span>
          </div>

          <div className="duo-stat-pill stars">
            <Star size={17} fill="#ffc800" color="#ffc800" />
            <span>{learningState.stars}</span>
          </div>

          <div className="duo-stat-pill crowns">
            <Crown size={17} fill="#e5a100" color="#e5a100" />
            <span>{errorTracker.perfectLessonsCount}</span>
          </div>

          <button
            type="button"
            className="duo-sound-btn"
            onClick={handleToggleMute}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </div>
      </header>

      <main className="duo-main-container">
        {!activeLevel ? (
          <>
            {/* HERO BANNER FOR PRACTICE */}
            <section className="duo-hero-card">
              <div className="hero-content">
                <div className="intensity-badge">
                  <Zap size={14} />{" "}
                  <span>
                    Practice Intensity: <strong>{currentIntensity.toUpperCase()}</strong>
                  </span>
                </div>
                <h1>{childName}'s Practice Arena</h1>
                <p>
                  Reinforce sounds, conquer tricky letters, and build confident reading muscles!
                </p>

                {trickyItems.length > 0 && (
                  <div className="tricky-friends-banner">
                    <div className="tricky-banner-text">
                      <Wand2 size={22} className="magic-wand-icon" />
                      <div>
                        <strong>
                          🪄 {trickyItems.length} Tricky {trickyItems.length === 1 ? "Friend" : "Friends"} Waiting!
                        </strong>
                        <p>Special review games targeted to your child's recent tricky letters.</p>
                      </div>
                    </div>
                    <button
                      className="tricky-start-btn"
                      onClick={() => startLevel(null, true, trickyItems)}
                    >
                      Play Targeted Review ✨
                    </button>
                  </div>
                )}
              </div>

              <div className="duo-hero-mascot">
                <div className="mascot-avatar">🎯</div>
                <div className="mascot-speech-bubble">
                  <span>Pick a practice stone and strengthen your skills!</span>
                </div>
              </div>
            </section>

            {/* DUOLINGO STEPPING STONES PATH */}
            <section className="duo-learning-path">
              <div className="path-title">
                <h2>Skill Practice Stepping Stones</h2>
                <p>Tap any unlocked level to begin a practice set</p>
              </div>

              <div className="stepping-stones-container">
                {LEARNING_LEVELS.map((level, index) => {
                  const progress = learningState.levels[level.id] || {};
                  const unlocked = level.id <= learningState.currentLevel;
                  const mastered = Boolean(progress.completed);
                  const offsetClasses = ["offset-center", "offset-left", "offset-right"];
                  const pathOffset = offsetClasses[index % 3];

                  return (
                    <div
                      key={level.id}
                      className={`stepping-stone-node ${pathOffset} ${
                        unlocked ? "unlocked" : "locked"
                      } ${mastered ? "mastered" : ""}`}
                    >
                      <button
                        className="stone-circle-btn"
                        disabled={!unlocked}
                        onClick={() => startLevel(level)}
                        title={unlocked ? level.title : "Locked level"}
                      >
                        <span className="stone-emoji">{level.icon}</span>
                        {mastered && (
                          <div className="mastered-crown-badge">
                            <Crown size={14} fill="#fff" />
                          </div>
                        )}
                        {!unlocked && (
                          <div className="stone-lock-badge">
                            <LockKeyhole size={14} />
                          </div>
                        )}
                      </button>

                      <div className="stone-info-card">
                        <span className="stone-level-tag">Level {level.id}</span>
                        <h4>{level.title}</h4>
                        <p>{level.subtitle}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        ) : (
          /* ACTIVE PRACTICE RUNNER */
          <div className="duo-lesson-card">
            <div className="lesson-header-bar">
              <button className="lesson-close-btn" onClick={closePractice}>
                ✕ Quit
              </button>
              <div className="lesson-progress-bar">
                <div
                  className="lesson-progress-fill"
                  style={{
                    width: `${((questionIndex + 1) / currentQuestionsList.length) * 100}%`,
                  }}
                ></div>
              </div>
              <span className="lesson-counter">
                {questionIndex + 1} / {currentQuestionsList.length}
              </span>
            </div>

            {!sessionResult ? (
              <div className="lesson-body">
                <div className="lesson-prompt-box">
                  <h3>{currentQuestion.prompt}</h3>
                  {currentQuestion.picture && (
                    <div className="lesson-picture-anchor">
                      <span className="big-anchor-emoji">{currentQuestion.picture}</span>
                      {currentQuestion.pictureLabel && (
                        <span className="anchor-label">{currentQuestion.pictureLabel}</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="lesson-choices-grid">
                  {currentQuestion.choices.map((choice) => (
                    <button
                      key={choice}
                      type="button"
                      className={`duo-choice-btn ${selectedAnswer === choice ? "selected" : ""}`}
                      onClick={() => handleSelectChoice(choice)}
                    >
                      {choice}
                    </button>
                  ))}
                </div>

                <div className="lesson-footer">
                  <button
                    className="duo-submit-btn"
                    disabled={!selectedAnswer}
                    onClick={submitAnswer}
                  >
                    Check Answer →
                  </button>
                </div>
              </div>
            ) : (
              /* RESULTS CELEBRATION */
              <div className="lesson-result-card">
                <div className="result-crown-icon">
                  {sessionResult.isPerfect ? "👑" : "🎉"}
                </div>
                <h2>
                  {sessionResult.isPerfect ? "Perfect Practice!" : "Great Practice Session!"}
                </h2>
                <p>
                  You answered {sessionResult.correct} of {sessionResult.total} questions correctly ({sessionResult.accuracy}%).
                </p>
                <div className="result-gems-earned">
                  +{sessionResult.gemsEarned} Gems Earned! 💎
                </div>
                <button className="duo-submit-btn" onClick={closePractice}>
                  Continue ➔
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
