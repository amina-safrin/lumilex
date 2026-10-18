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
  Lightbulb,
  Play
} from "lucide-react";
import "./LearningJourney.css";
import "./Practice.css";

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
  speakPhonemeBlend,
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

// =========================================================
// CHOICE IMAGE & ILLUSTRATION DIRECTORY
// Provides pictures for EVERY choice across all practice levels!
// =========================================================
const CHOICE_VISUALS = {
  // Letters
  "A": { icon: "🍎", label: "Apple", bg: "#fee2e2" },
  "B": { icon: "⚽", label: "Ball", bg: "#e0f2fe" },
  "C": { icon: "🐱", label: "Cat", bg: "#fef3c7" },
  "D": { icon: "🐶", label: "Dog", bg: "#ffedd5" },
  "E": { icon: "🐘", label: "Elephant", bg: "#ede9fe" },
  "F": { icon: "🐠", label: "Fish", bg: "#e0f2fe" },
  "L": { icon: "🦁", label: "Lion", bg: "#fef3c7" },
  "M": { icon: "🌙", label: "Moon", bg: "#ede9fe" },
  "N": { icon: "🪺", label: "Nest", bg: "#f5f5f4" },
  "O": { icon: "🐙", label: "Octopus", bg: "#ffe4e6" },
  "P": { icon: "🐷", label: "Pig", bg: "#fce7f3" },
  "S": { icon: "☀️", label: "Sun", bg: "#fef08a" },
  "T": { icon: "🌳", label: "Tree", bg: "#dcfce7" },
  "W": { icon: "🐳", label: "Whale", bg: "#e0f2fe" },
  "Z": { icon: "🦓", label: "Zebra", bg: "#f1f5f9" },

  // Level 1 & 2 Words
  "Apple": { icon: "🍎", label: "Apple", bg: "#fee2e2" },
  "Ball": { icon: "⚽", label: "Ball", bg: "#e0f2fe" },
  "Cat": { icon: "🐱", label: "Cat", bg: "#fef3c7" },
  "Dog": { icon: "🐶", label: "Dog", bg: "#ffedd5" },
  "Pig": { icon: "🐷", label: "Pig", bg: "#fce7f3" },
  "Fish": { icon: "🐠", label: "Fish", bg: "#e0f2fe" },
  "Leaf": { icon: "🍃", label: "Leaf", bg: "#dcfce7" },
  "Sun": { icon: "☀️", label: "Sun", bg: "#fef08a" },
  "Moon": { icon: "🌙", label: "Moon", bg: "#ede9fe" },

  // Level 3 CVC Blends
  "Cup": { icon: "🥤", label: "Cup", bg: "#fce7f3" },
  "Cot": { icon: "🛏️", label: "Cot", bg: "#ede9fe" },
  "Sit": { icon: "🪑", label: "Sit", bg: "#e0f2fe" },
  "Sap": { icon: "🌲", label: "Sap", bg: "#dcfce7" },
  "Dig": { icon: "⛏️", label: "Dig", bg: "#ffedd5" },
  "Dot": { icon: "🔴", label: "Dot", bg: "#fee2e2" },
  "Bed": { icon: "🛏️", label: "Bed", bg: "#ede9fe" },
  "Bad": { icon: "❌", label: "Bad", bg: "#fee2e2" },
  "Bug": { icon: "🐞", label: "Bug", bg: "#fee2e2" },
  "Peg": { icon: "🪵", label: "Peg", bg: "#fef3c7" },
  "Pug": { icon: "🐶", label: "Pug", bg: "#ffedd5" },
  "Bag": { icon: "🎒", label: "Bag", bg: "#e0f2fe" },
  "Big": { icon: "🐘", label: "Big", bg: "#ede9fe" },

  // Level 4 Rhyme Safari
  "Bat": { icon: "🦇", label: "Bat", bg: "#f1f5f9" },
  "Run": { icon: "🏃", label: "Run", bg: "#fef08a" },
  "Map": { icon: "🗺️", label: "Map", bg: "#e0f2fe" },
  "Frog": { icon: "🐸", label: "Frog", bg: "#dcfce7" },
  "Mug": { icon: "☕", label: "Mug", bg: "#ffedd5" },
  "Mop": { icon: "🧹", label: "Mop", bg: "#f5f5f4" },
  "Car": { icon: "🚗", label: "Car", bg: "#fee2e2" },
  "Tree": { icon: "🌳", label: "Tree", bg: "#dcfce7" },

  // Level 5 Compound Words
  "Honeybee": { icon: "🍯🐝", label: "Honeybee", bg: "#fef3c7" },
  "Sunbee": { icon: "☀️🐝", label: "Sunbee", bg: "#fef08a" },
  "Honeycat": { icon: "🍯🐱", label: "Honeycat", bg: "#ffedd5" },
  "Rainbow": { icon: "🌧️🌈", label: "Rainbow", bg: "#ede9fe" },
  "Raindrop": { icon: "💧", label: "Raindrop", bg: "#e0f2fe" },
  "Sunbow": { icon: "☀️🏹", label: "Sunbow", bg: "#fef08a" },
  "Sunflower": { icon: "🌻", label: "Sunflower", bg: "#fef08a" },
  "Sunrain": { icon: "☀️🌧️", label: "Sunrain", bg: "#e0f2fe" },
  "Moonflower": { icon: "🌙🌸", label: "Moonflower", bg: "#fce7f3" },
  "Starfish": { icon: "⭐🐟", label: "Starfish", bg: "#e0f2fe" },
  "Goldfish": { icon: "🐠", label: "Goldfish", bg: "#ffedd5" },
  "Jellyfish": { icon: "🪼", label: "Jellyfish", bg: "#ede9fe" },
  "Butterfly": { icon: "🦋", label: "Butterfly", bg: "#fce7f3" },
  "Dragonfly": { icon: "🪰", label: "Dragonfly", bg: "#dcfce7" },
  "Firefly": { icon: "✨", label: "Firefly", bg: "#fef08a" },
  "Cupcake": { icon: "🧁", label: "Cupcake", bg: "#fce7f3" },
  "Pancake": { icon: "🥞", label: "Pancake", bg: "#ffedd5" },
  "Cheesecake": { icon: "🍰", label: "Cheesecake", bg: "#fef3c7" },
  "Snowman": { icon: "⛄", label: "Snowman", bg: "#e0f2fe" },
  "Rainman": { icon: "🌧️", label: "Rainman", bg: "#f1f5f9" },
  "Iceman": { icon: "🧊", label: "Iceman", bg: "#e0f2fe" },
  "Sandcastle": { icon: "🏖️🏰", label: "Sandcastle", bg: "#fef3c7" },
  "Sandhouse": { icon: "🏖️🏠", label: "Sandhouse", bg: "#ffedd5" },
  "Beachhouse": { icon: "🏠🌊", label: "Beachhouse", bg: "#e0f2fe" },

  // Level 6 Sentences
  "In the sun": { icon: "☀️", label: "In the sun", bg: "#fef08a" },
  "In the car": { icon: "🚗", label: "In the car", bg: "#fee2e2" },
  "In a tree": { icon: "🌳", label: "In a tree", bg: "#dcfce7" },
  "Red": { icon: "🔴", label: "Red", bg: "#fee2e2" },
  "Blue": { icon: "🔵", label: "Blue", bg: "#e0f2fe" },
  "Green": { icon: "🟢", label: "Green", bg: "#dcfce7" },
  "A honeybee": { icon: "🐝", label: "A honeybee", bg: "#fef3c7" },
  "A sleepy frog": { icon: "🐸💤", label: "A sleepy frog", bg: "#dcfce7" },
  "A big whale": { icon: "🐳", label: "A big whale", bg: "#e0f2fe" },
  "Rainy": { icon: "🌧️", label: "Rainy", bg: "#e0f2fe" },
  "Very hot": { icon: "☀️", label: "Very hot", bg: "#ffedd5" },
  "Snowy": { icon: "❄️", label: "Snowy", bg: "#ede9fe" },
  "Kindness": { icon: "💖", label: "Kindness", bg: "#fce7f3" },
  "Anger": { icon: "😠", label: "Anger", bg: "#fee2e2" },
  "Sleepiness": { icon: "😴", label: "Sleepiness", bg: "#ede9fe" }
};

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

  // =========================================================
  // CHOICE SELECTION & AUDIO
  // =========================================================
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
        rate: 0.76,
        pitch: 1.1,
        onStart: () => setSpeakingText(choice),
        onEnd: () => setSpeakingText(""),
      });
    }
  };

  const handleHearChoice = (choice, e) => {
    e.stopPropagation();
    speakText(choice, { rate: 0.75, pitch: 1.1 });
  };

  const handleHearPicture = () => {
    if (!currentQuestion) return;
    playTapSound();

    if (currentQuestion.type === "compound") {
      speakCompoundWord(
        currentQuestion.part1,
        currentQuestion.part2,
        currentQuestion.combined || currentQuestion.answer
      );
      return;
    }

    if (currentQuestion.letter && currentQuestion.pictureLabel) {
      speakLetterMnemonic(
        currentQuestion.letter,
        currentQuestion.pictureLabel,
        currentQuestion.picture
      );
      return;
    }

    if (currentQuestion.blendParts) {
      speakPhonemeBlend(currentQuestion.blendParts, currentQuestion.answer);
      return;
    }

    const textToSpeak = currentQuestion.pictureLabel || currentQuestion.prompt;
    speakText(textToSpeak, { rate: 0.74, pitch: 1.1 });
  };

  const handleHearPrompt = () => {
    if (!currentQuestion) return;
    playTapSound();
    speakText(currentQuestion.prompt, { rate: 0.75, pitch: 1.08 });
  };

  const handleHearWord = (word, e) => {
    e.stopPropagation();
    const clean = word.replace(/[^a-zA-Z0-9/]/g, "");
    if (clean) {
      speakText(clean, { rate: 0.72, pitch: 1.1 });
    }
  };

  const handleToggleHint = () => {
    const next = !showHint;
    setShowHint(next);
    if (next && currentQuestion?.hint) {
      playHintSound();
      speakText(currentQuestion.hint, { rate: 0.74, pitch: 1.1 });
    }
  };

  // =========================================================
  // SUBMIT ANSWER
  // =========================================================
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

  // Helper to get image for choice
  const getChoiceVisual = (choiceText) => {
    if (CHOICE_VISUALS[choiceText]) {
      return CHOICE_VISUALS[choiceText];
    }
    // Fallback: check case-insensitive match
    const foundKey = Object.keys(CHOICE_VISUALS).find(
      (k) => k.toLowerCase() === String(choiceText).toLowerCase()
    );
    if (foundKey) return CHOICE_VISUALS[foundKey];

    // Generic friendly badge
    return { icon: "🌟", label: choiceText, bg: "#f0fdf4" };
  };

  return (
    <div className="practice-page">
      {/* =========================================================
          TOP STATS & SOUND BAR
      ========================================================= */}
      <header className="practice-topbar">
        <button className="practice-back-btn" onClick={() => navigate("/dashboard")}>
          <ArrowLeft size={18} /> <span>Dashboard</span>
        </button>

        <div className="practice-stats-row">
          <div className="practice-stat-pill streak">
            <Flame size={18} fill="#ff7a00" color="#ff7a00" />
            <span>{errorTracker.streakDays} Day</span>
          </div>

          <div className="practice-stat-pill gems">
            <Gem size={17} fill="#1cb0f6" color="#1cb0f6" />
            <span>{errorTracker.gems}</span>
          </div>

          <div className="practice-stat-pill stars">
            <Star size={17} fill="#ffc800" color="#ffc800" />
            <span>{learningState.stars}</span>
          </div>

          <div className="practice-stat-pill crowns">
            <Crown size={17} fill="#e5a100" color="#e5a100" />
            <span>{errorTracker.perfectLessonsCount}</span>
          </div>

          <button
            type="button"
            className="practice-sound-btn"
            onClick={handleToggleMute}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
        </div>
      </header>

      <main className="practice-runner-container">
        {!activeLevel ? (
          <>
            {/* HERO BANNER */}
            <section className="duo-hero-card">
              <div className="hero-content">
                <div className="intensity-badge">
                  <Zap size={14} />{" "}
                  <span>
                    Practice Intensity: <strong>{currentIntensity.toUpperCase()}</strong>
                  </span>
                </div>
                <h1>{childName || "Reader"}'s Practice Arena</h1>
                <p>
                  Reinforce sounds, conquer tricky letters with picture helpers, and build strong reading confidence!
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
                  <span>Pick a practice stone and see friendly picture clues!</span>
                </div>
              </div>
            </section>

            {/* STEPPING STONES PATH */}
            <section className="duo-learning-path">
              <div className="path-title">
                <h2>Skill Practice Stepping Stones</h2>
                <p>Tap any unlocked level to begin a practice set with pictures</p>
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
          /* =========================================================
             ACTIVE PRACTICE SESSION RUNNER (PROPERLY ARRANGED WITH IMAGES)
             ========================================================= */
          <div className="practice-card">
            {/* Header: Quit, Progress, Counter */}
            <div className="practice-runner-header">
              <button
                className="practice-close-btn"
                onClick={closePractice}
                title="Quit practice"
              >
                ✕
              </button>

              <div className="practice-progress-track">
                <div
                  className="practice-progress-fill"
                  style={{
                    width: `${((questionIndex + 1) / currentQuestionsList.length) * 100}%`,
                  }}
                ></div>
              </div>

              <span className="practice-counter-pill">
                {questionIndex + 1} / {currentQuestionsList.length}
              </span>
            </div>

            {!sessionResult ? (
              <div className="practice-body">
                {/* 1. Level Category & Prompt Header */}
                <div className="practice-prompt-area">
                  <div className="practice-level-badge">
                    <span>{activeLevel.icon}</span>
                    <span>{activeLevel.title}</span>
                  </div>

                  <div className="practice-prompt-row">
                    <h3 className="practice-prompt-title">
                      {currentQuestion.prompt.split(" ").map((word, wIdx) => (
                        <button
                          key={wIdx}
                          type="button"
                          className="prompt-interactive-word"
                          onClick={(e) => handleHearWord(word, e)}
                          title="Click to hear word"
                        >
                          {word}
                        </button>
                      ))}
                    </h3>

                    <button
                      type="button"
                      className="listen-prompt-btn"
                      onClick={handleHearPrompt}
                      title="Listen to full question"
                    >
                      <Volume2 size={22} />
                    </button>
                  </div>
                </div>

                {/* 2. Visual Scene Card & Image Anchors */}
                {currentQuestion.type === "compound" ? (
                  /* Compound Word Formula Visualizer */
                  <div className="compound-formula-box">
                    <div className="compound-formula-title">
                      <span>🍯 Combination Word Machine</span>
                    </div>

                    <div className="compound-tiles-row">
                      <div
                        className="compound-tile"
                        onClick={() => {
                          playTapSound();
                          speakText(currentQuestion.part1);
                        }}
                      >
                        <span className="compound-tile-emoji">{currentQuestion.emoji1}</span>
                        <span className="compound-tile-text">{currentQuestion.part1}</span>
                      </div>

                      <span className="compound-math-operator">+</span>

                      <div
                        className="compound-tile"
                        onClick={() => {
                          playTapSound();
                          speakText(currentQuestion.part2);
                        }}
                      >
                        <span className="compound-tile-emoji">{currentQuestion.emoji2}</span>
                        <span className="compound-tile-text">{currentQuestion.part2}</span>
                      </div>

                      <span className="compound-math-operator">=</span>

                      <div className="compound-mystery-tile">
                        <span>❓ Choose below!</span>
                      </div>
                    </div>
                  </div>
                ) : currentQuestion.blendParts ? (
                  /* Sound Blending Phoneme Tiles */
                  <div className="blend-tiles-box">
                    {currentQuestion.blendParts.map((part, pIdx) => {
                      const cleanPart = String(part).replace(/\//g, "");
                      return (
                        <div key={pIdx} style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
                          <button
                            type="button"
                            className="blend-phoneme-tile"
                            onClick={() => {
                              playTapSound();
                              speakText(cleanPart);
                            }}
                            title={`Hear ${cleanPart}`}
                          >
                            {cleanPart}
                          </button>
                          {pIdx < currentQuestion.blendParts.length - 1 && (
                            <span className="blend-arrow">➔</span>
                          )}
                        </div>
                      );
                    })}
                    <span className="blend-arrow">➔</span>
                    <button
                      type="button"
                      className="scene-listen-pill"
                      onClick={handleHearPicture}
                      style={{ cursor: "pointer" }}
                    >
                      <span style={{ fontSize: "24px" }}>{currentQuestion.picture}</span>
                      <span>Blend sounds!</span>
                    </button>
                  </div>
                ) : (
                  /* Standard Rich Scene Picture Card */
                  currentQuestion.picture && (
                    <div
                      className="practice-scene-card"
                      onClick={handleHearPicture}
                      title="Tap to hear picture description"
                    >
                      <div className="scene-left">
                        <div className="scene-image-frame">
                          <span>{currentQuestion.picture}</span>
                        </div>
                        <div className="scene-meta">
                          {currentQuestion.pictureLabel && (
                            <strong>{currentQuestion.pictureLabel}</strong>
                          )}
                          {currentQuestion.family && (
                            <span className="rhyme-family-ribbon">
                              🎈 Word Family: {currentQuestion.family}
                            </span>
                          )}
                          <small>Tap picture to hear its friendly sound!</small>
                        </div>
                      </div>

                      <div className="scene-listen-pill">
                        <Volume2 size={16} />
                        <span>Tap to Hear</span>
                      </div>
                    </div>
                  )
                )}

                {/* 3. Choices Grid with IMAGES for every option */}
                <div className="practice-choices-grid">
                  {currentQuestion.choices.map((choice, cIdx) => {
                    const visual = getChoiceVisual(choice);
                    const isSelected = selectedAnswer === choice;
                    const letterIndex = String.fromCharCode(65 + cIdx); // 'A', 'B', 'C'

                    return (
                      <button
                        key={choice}
                        type="button"
                        className={`practice-choice-card ${isSelected ? "selected" : ""}`}
                        onClick={() => handleSelectChoice(choice)}
                      >
                        {/* Choice Index Badge (A, B, C) */}
                        <span className="choice-index-badge">{letterIndex}</span>

                        {/* Image Frame with Icon/Emoji */}
                        <div
                          className="choice-image-frame"
                          style={{ backgroundColor: visual.bg || "#f8fafc" }}
                        >
                          <span>{visual.icon}</span>
                        </div>

                        {/* Choice text in clear dyslexia-friendly bold typography */}
                        <span className="choice-text">{choice}</span>

                        {/* Optional sublabel */}
                        {visual.label && visual.label !== choice && (
                          <span className="choice-sublabel">{visual.label}</span>
                        )}

                        {/* Audio speaker on choice */}
                        <button
                          type="button"
                          className="choice-speaker-btn"
                          onClick={(e) => handleHearChoice(choice, e)}
                          title={`Hear ${choice}`}
                        >
                          <Volume2 size={13} />
                        </button>

                        {/* Selected Checkmark */}
                        {isSelected && (
                          <div className="choice-check-badge">
                            <Check size={14} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* 4. Gentle Hint Drawer */}
                {showHint && currentQuestion.hint && (
                  <div className="practice-hint-box">
                    <span className="hint-icon">💡</span>
                    <span>{currentQuestion.hint}</span>
                  </div>
                )}

                {/* 5. Footer Actions: Hint Toggle & Check Answer */}
                <div className="practice-footer-bar">
                  {currentQuestion.hint ? (
                    <button
                      type="button"
                      className="practice-hint-btn"
                      onClick={handleToggleHint}
                    >
                      <Lightbulb size={17} />
                      <span>{showHint ? "Hide Hint" : "Need a Hint?"}</span>
                    </button>
                  ) : (
                    <div></div>
                  )}

                  <button
                    type="button"
                    className="practice-submit-btn"
                    disabled={!selectedAnswer}
                    onClick={submitAnswer}
                  >
                    <span>Check Answer</span>
                    <ArrowRight size={20} />
                  </button>
                </div>
              </div>
            ) : (
              /* =========================================================
                 RESULTS CELEBRATION MODAL
                 ========================================================= */
              <div className="practice-result-card">
                <div className="result-celebration-avatar">
                  {sessionResult.isPerfect ? "👑" : "🎉"}
                </div>

                <h2>
                  {sessionResult.isPerfect
                    ? "Perfect Practice!"
                    : "Great Practice Session!"}
                </h2>

                <p>
                  You answered {sessionResult.correct} of {sessionResult.total} questions
                  correctly ({sessionResult.accuracy}% accuracy).
                </p>

                <div className="result-stats-row">
                  <div className="result-badge-pill gems">
                    💎 +{sessionResult.gemsEarned} Gems Earned!
                  </div>
                  <div className="result-badge-pill">
                    ⭐ +{sessionResult.earnedStars || 2} Stars Earned!
                  </div>
                  <div className="result-badge-pill">
                    🔥 {sessionResult.streakDays} Day Streak!
                  </div>
                </div>

                <button
                  type="button"
                  className="practice-submit-btn"
                  onClick={closePractice}
                  style={{ margin: "0 auto" }}
                >
                  <span>Continue Practice</span>
                  <ArrowRight size={20} />
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
