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
  Gem
} from "lucide-react";
import "./LearningJourney.css";

import {
  getGardenStage,
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

export default function LearningJourney() {
  const navigate = useNavigate();

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        try { mediaRecorderRef.current.stop(); } catch (error) { /* already stopped */ }
      }
      if (microphoneStreamRef.current) {
        microphoneStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // =========================================================
  // STATE
  // =========================================================
  const [learningState, setLearningState] = useState(() => getLearningState());
  const [errorTracker, setErrorTracker] = useState(() => getErrorTrackerState());

  const [activeLevel, setActiveLevel] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [answers, setAnswers] = useState([]);
  const [showHint, setShowHint] = useState(false);
  const [speakingText, setSpeakingText] = useState("");
  const [sessionResult, setSessionResult] = useState(null);
  const [isMuted, setIsMuted] = useState(() => isSoundsMuted());
  const [combinedSuccess, setCombinedSuccess] = useState(false);

  // Voice recording state in lessons
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [voiceHeardText, setVoiceHeardText] = useState("");
  const [voiceFeedback, setVoiceFeedback] = useState("");

  // Targeted Error Review Round
  const [isReviewRound, setIsReviewRound] = useState(false);
  const [mistakesInCurrentLesson, setMistakesInCurrentLesson] = useState([]);
  const [reviewIndex, setReviewIndex] = useState(0);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const microphoneStreamRef = useRef(null);

  const garden = useMemo(() => getGardenStage(learningState), [learningState]);
  const trickyItems = useMemo(() => getTrickyItems(), [errorTracker]);
  const currentIntensity = useMemo(() => getAdaptiveIntensity(errorTracker), [errorTracker]);

  const handleToggleMute = () => {
    const muted = toggleMuteSounds();
    setIsMuted(muted);
    if (muted && typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  };

  // =========================================================
  // START LESSON
  // =========================================================
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
        questions: reviewItemsList.map((m) => m.questionData)
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

    speakText(`Let's start! Listen, tap, or speak!`, {
      onStart: () => setSpeakingText("Starting lesson..."),
      onEnd: () => setSpeakingText("")
    });
  };

  const currentQuestionsList = activeLevel?.questions || [];
  const currentQuestion = currentQuestionsList[questionIndex];

  // =========================================================
  // TOUCH & SPEAK WORD
  // =========================================================
  const renderSpeakableQuestion = (text) =>
    String(text)
      .split(/(\s+)/)
      .map((part, index) => {
        if (!part || /^\s+$/.test(part)) return part;
        const spokenWord = part.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}'’-]+$/gu, "");
        if (!spokenWord) return part;
        return (
          <button
            type="button"
            className="duo-word-pill"
            key={`${index}-${part}`}
            onClick={() => {
              playTapSound();
              speakText(spokenWord, {
                onStart: () => setSpeakingText(spokenWord),
                onEnd: () => setSpeakingText("")
              });
            }}
            aria-label={`Hear the word ${spokenWord}`}
            title={`Hear “${spokenWord}”`}
          >
            {part}
          </button>
        );
      });

  // Handle image or sound tap
  const handleItemAudio = (item) => {
    playTapSound();
    if (!currentQuestion) return;

    if (currentQuestion.type === "compound" && currentQuestion.combined) {
      speakCompoundWord(
        currentQuestion.part1,
        currentQuestion.part2,
        currentQuestion.combined
      );
      setSpeakingText(currentQuestion.combined);
      setTimeout(() => setSpeakingText(""), 2200);
      return;
    }

    if (currentQuestion.letter && currentQuestion.pictureLabel) {
      speakLetterMnemonic(
        currentQuestion.letter,
        currentQuestion.pictureLabel,
        currentQuestion.picture
      );
      setSpeakingText(`${currentQuestion.letter} is for ${currentQuestion.pictureLabel}`);
      setTimeout(() => setSpeakingText(""), 2200);
      return;
    }

    const textToSpeak = String(item || currentQuestion.pictureLabel || "word");
    speakText(textToSpeak, {
      onStart: () => setSpeakingText(textToSpeak),
      onEnd: () => setSpeakingText("")
    });
  };

  // =========================================================
  // VOICE READING & CAPTURE IN LESSONS
  // Child can speak the letter/word into the microphone!
  // =========================================================
  const toggleVoiceCapture = async () => {
    // Pressing the microphone again stops recording and sends the audio to Whisper.
    if (isVoiceListening) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      setIsVoiceListening(false);
      setVoiceFeedback("Checking your reading... 🎧");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setVoiceFeedback("Audio recording is not supported here. Please use Chrome or Edge on localhost.");
      return;
    }

    try {
      window.speechSynthesis.cancel();
      playTapSound();
      setVoiceHeardText("");
      setVoiceFeedback("Listening... say the word, then tap the microphone again. 🎤");

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      microphoneStreamRef.current = stream;
      audioChunksRef.current = [];

      const preferredType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : (MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "");
      const recorder = preferredType
        ? new MediaRecorder(stream, { mimeType: preferredType })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      recorder.onerror = () => {
        setIsVoiceListening(false);
        setVoiceFeedback("The recording had a problem. Please try again.");
        stream.getTracks().forEach((track) => track.stop());
        microphoneStreamRef.current = null;
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        microphoneStreamRef.current = null;
        mediaRecorderRef.current = null;

        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        audioChunksRef.current = [];
        if (!audioBlob.size) {
          setVoiceFeedback("I couldn't hear any audio. Try speaking a little louder.");
          return;
        }

        try {
          const formData = new FormData();
          const extension = (audioBlob.type || "").includes("mp4") ? "m4a" : "webm";
          formData.append("audio", audioBlob, `reading.${extension}`);
          const expectedWords = [currentQuestion?.question, currentQuestion?.answer, currentQuestion?.pictureLabel]
            .filter(Boolean).join(" ");
          if (expectedWords) formData.append("prompt", expectedWords);

          const response = await fetch("http://localhost:5000/api/speech/transcribe", {
            method: "POST",
            body: formData,
            credentials: "include"
          });
          const result = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(result.details || result.error || "Whisper transcription failed");
          const spoken = String(result.text || "").toLowerCase().trim();
          if (!spoken) {
            setVoiceFeedback("I couldn't catch that word. No worries — try once more!");
            return;
          }
          setVoiceHeardText(spoken);
          evaluateSpokenWord(spoken);
        } catch (error) {
          console.error("Whisper transcription request failed:", error);
          setVoiceFeedback("I couldn't check the audio. Make sure both the LumiLex backend and Whisper server are running.");
        }
      };

      recorder.start();
      setIsVoiceListening(true);
    } catch (error) {
      console.error("Microphone setup failed:", error);
      setIsVoiceListening(false);
      setVoiceFeedback(error?.name === "NotAllowedError"
        ? "Please allow microphone access in your browser, then try again."
        : "I couldn't start the microphone. Please check your microphone and try again.");
    }
  };

  const stopVoiceCapture = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try { mediaRecorderRef.current.stop(); } catch (error) { console.warn(error); }
    }
    if (microphoneStreamRef.current) {
      microphoneStreamRef.current.getTracks().forEach((track) => track.stop());
      microphoneStreamRef.current = null;
    }
    setIsVoiceListening(false);
  };

  const evaluateSpokenWord = (spoken) => {
    if (!currentQuestion) return;
    const cleanSpoken = spoken.toLowerCase().replace(/[.,!?]/g, "").trim();
    const cleanTarget = String(currentQuestion.answer).toLowerCase().trim();
    const cleanLabel = String(currentQuestion.pictureLabel || "").toLowerCase().trim();

    // Check if spoken text matches answer or picture label
    const isMatch =
      cleanSpoken === cleanTarget ||
      cleanSpoken === cleanLabel ||
      cleanSpoken.includes(cleanTarget) ||
      cleanTarget.includes(cleanSpoken);

    if (isMatch) {
      playSuccessChime();
      setVoiceFeedback(`🌟 Fantastic! You said "${spoken}"!`);
      setSelectedAnswer(currentQuestion.answer);
      recordChildSuccess(currentQuestion, activeLevel.id);
      setErrorTracker(getErrorTrackerState());
    } else {
      playRetryGentleSound();
      setVoiceFeedback(`Heard "${spoken}". Let's try once more, or tap below! 💚`);
      recordChildMistake(currentQuestion, activeLevel.id);
      setErrorTracker(getErrorTrackerState());
    }
  };

  // Option selection
  const handleSelectChoice = (choice) => {
    playTapSound();
    setSelectedAnswer(choice);

    if (currentQuestion?.type === "compound") {
      playCombineSound();
      setCombinedSuccess(true);
      speakCompoundWord(
        currentQuestion.part1,
        currentQuestion.part2,
        choice
      );
      setSpeakingText(`${currentQuestion.part1} + ${currentQuestion.part2} = ${choice}`);
    } else {
      speakText(choice, {
        onStart: () => setSpeakingText(choice),
        onEnd: () => setSpeakingText("")
      });
    }
  };

  // Submit Answer
  const submitAnswer = () => {
    if (!selectedAnswer || !activeLevel) return;

    const isCorrect = selectedAnswer === currentQuestion.answer;

    if (isCorrect) {
      playSuccessChime();
      recordChildSuccess(currentQuestion, activeLevel.id);
    } else {
      playRetryGentleSound();
      recordChildMistake(currentQuestion, activeLevel.id);
      setMistakesInCurrentLesson((prev) => [...prev, currentQuestion]);
    }

    setErrorTracker(getErrorTrackerState());

    const nextAnswers = [...answers, isCorrect];
    setAnswers(nextAnswers);
    setShowHint(false);
    setCombinedSuccess(false);
    setVoiceHeardText("");
    setVoiceFeedback("");

    if (questionIndex < currentQuestionsList.length - 1) {
      setQuestionIndex(questionIndex + 1);
      setSelectedAnswer("");
      return;
    }

    // Finished all regular questions in lesson
    const correctCount = nextAnswers.filter(Boolean).length;
    const accuracy = Math.round((correctCount / currentQuestionsList.length) * 100);

    const lessonRewardData = completeLessonSession({
      accuracy,
      levelId: activeLevel.id,
      mistakesCount: mistakesInCurrentLesson.length + (isCorrect ? 0 : 1)
    });

    const rewardResult = recordPracticeSession(
      activeLevel.id,
      correctCount,
      currentQuestionsList.length
    );

    setLearningState(rewardResult.state);
    setErrorTracker(getErrorTrackerState());

    setSessionResult({
      ...rewardResult,
      correct: correctCount,
      total: currentQuestionsList.length,
      accuracy,
      isPerfect: lessonRewardData.isPerfect,
      gemsEarned: lessonRewardData.gemsEarned,
      streakDays: lessonRewardData.streakDays,
      intensity: lessonRewardData.intensity
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
    stopVoiceCapture();
    setActiveLevel(null);
    setSessionResult(null);
    setCombinedSuccess(false);
    setIsReviewRound(false);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  };

  return (
    <div className="learning-page duolingo-theme">
      {/* ===================================================
          DUOLINGO TOPBAR (STREAK, GEMS, STARS, SOUND)
      =================================================== */}
      <header className="duo-topbar">
        <button className="duo-back-btn" onClick={() => navigate("/dashboard")}>
          <ArrowLeft size={18} /> <span>Dashboard</span>
        </button>

        <div className="duo-stats-row">
          {/* STREAK */}
          <div className="duo-stat-pill streak" title="Daily Reading Streak">
            <Flame size={18} fill="#ff7a00" color="#ff7a00" />
            <span>{errorTracker.streakDays} Day</span>
          </div>

          {/* GEMS */}
          <div className="duo-stat-pill gems" title="Star Crystals">
            <Gem size={17} fill="#1cb0f6" color="#1cb0f6" />
            <span>{errorTracker.gems}</span>
          </div>

          {/* STARS */}
          <div className="duo-stat-pill stars" title="Learning Stars">
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
          MAIN CONTENT AREA
      =================================================== */}
      <main className="duo-main-container">
        {!activeLevel ? (
          <>
            {/* HERO BANNER */}
            <section className="duo-hero-card">
              <div className="hero-content">
                <div className="intensity-badge">
                  <Zap size={14} />{" "}
                  <span>
                    Intensity:{" "}
                    <strong>{currentIntensity.toUpperCase()}</strong>
                  </span>
                </div>
                <h1>Your Dyslexia Reading Quest</h1>
                <p>
                  Level by level, sound by sound. Earn crowns, unlock new word powers,
                  and turn tricky letters into lifelong friends!
                </p>

                {/* TARGETED REVIEW CALLOUT (IF ERRORS DETECTED) */}
                {trickyItems.length > 0 && (
                  <div className="tricky-friends-banner">
                    <div className="tricky-banner-text">
                      <Wand2 size={22} className="magic-wand-icon" />
                      <div>
                        <strong>
                          🪄 {trickyItems.length} Tricky{" "}
                          {trickyItems.length === 1 ? "Friend" : "Friends"} Waiting!
                        </strong>
                        <p>
                          Practice sessions tailored to the exact letters and sounds that tripped you up.
                        </p>
                      </div>
                    </div>
                    <button
                      className="tricky-start-btn"
                      onClick={() => startLevel(null, true, trickyItems)}
                    >
                      Play Review Game ✨
                    </button>
                  </div>
                )}
              </div>

              <div className="duo-hero-mascot">
                <div className="mascot-avatar">🌱</div>
                <div className="mascot-speech-bubble">
                  <span>Ready to read? Let's hop on the path!</span>
                </div>
              </div>
            </section>

            {/* DUOLINGO STEPPING STONES PATH */}
            <section className="duo-learning-path">
              <div className="path-title">
                <h2>Reading Adventure Path</h2>
                <p>Tap a stepping stone to begin your lesson</p>
              </div>

              <div className="stepping-stones-container">
                {LEARNING_LEVELS.map((level, index) => {
                  const progress = learningState.levels[level.id] || {};
                  const unlocked = level.id <= learningState.currentLevel;
                  const mastered = Boolean(progress.completed);
                  // Alternating winding offset for Duolingo serpentine effect
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
                          <div className="locked-badge">
                            <LockKeyhole size={16} />
                          </div>
                        )}
                      </button>

                      <div className="stone-info-box">
                        <span className="stone-level-number">
                          LEVEL {level.id}
                        </span>
                        <strong>{level.title}</strong>
                        <small>{level.subtitle}</small>
                      </div>

                      {/* Connecting winding dotted bridge */}
                      {index < LEARNING_LEVELS.length - 1 && (
                        <div className="path-bridge-line">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* LEARNING GARDEN SHOWCASE */}
            <section className="duo-garden-card">
              <div className="garden-visual">{garden.emoji}</div>
              <div className="garden-details">
                <span className="garden-eyebrow">YOUR GROWING GARDEN</span>
                <h3>{garden.name}</h3>
                <p>{garden.description}</p>
                <div className="duo-progress-bar">
                  <div
                    className="duo-progress-fill"
                    style={{
                      width: `${Math.min(
                        100,
                        ((learningState.gardenPoints % 3) / 3) * 100 ||
                          (learningState.gardenPoints ? 100 : 0)
                      )}%`
                    }}
                  />
                </div>
              </div>
            </section>
          </>
        ) : (
          /* ===================================================
              DUOLINGO ACTIVE LESSON RUNNER
          =================================================== */
          <section className="duo-lesson-card">
            {/* LESSON TOP BAR */}
            <div className="lesson-runner-header">
              <button className="lesson-close-btn" onClick={closePractice}>
                ✕
              </button>

              <div className="lesson-progress-track">
                <div
                  className="lesson-progress-fill"
                  style={{
                    width: `${
                      ((questionIndex + 1) / currentQuestionsList.length) * 100
                    }%`
                  }}
                />
              </div>

              <div className="lesson-heart-badge">
                <Heart size={18} fill="#ff4b4b" color="#ff4b4b" />
                <span>Practice</span>
              </div>
            </div>

            {!sessionResult ? (
              <div className="lesson-body">
                {/* QUESTION TITLE & PROMPT */}
                <div className="lesson-question-header">
                  <span className="lesson-badge">
                    {activeLevel.icon} {activeLevel.title}
                  </span>
                  <h2 className="speakable-question">
                    {renderSpeakableQuestion(currentQuestion.prompt)}
                  </h2>
                </div>

                {/* VOICE READING OPTION */}
                <div className="voice-reading-bar">
                  <button
                    type="button"
                    className={`duo-mic-btn ${isVoiceListening ? "listening" : ""}`}
                    onClick={toggleVoiceCapture}
                  >
                    {isVoiceListening ? <MicOff size={18} /> : <Mic size={18} />}
                    <span>
                      {isVoiceListening
                        ? "Listening... Tap to stop"
                        : "🎤 Say it with your voice!"}
                    </span>
                  </button>

                  {voiceFeedback && (
                    <div className="voice-feedback-pill">
                      {voiceFeedback}
                    </div>
                  )}
                </div>

                {/* SPECIAL LEVEL 5: COMBINATION WORD VISUALIZER */}
                {currentQuestion.type === "compound" ? (
                  <div className="compound-word-builder" aria-label="Combination Word Builder">
                    <div className="compound-cards-row">
                      <button
                        type="button"
                        className="compound-part-card"
                        onClick={() => {
                          playTapSound();
                          speakText(currentQuestion.part1);
                          setSpeakingText(currentQuestion.part1);
                        }}
                        aria-label={`Hear ${currentQuestion.part1}`}
                      >
                        <span className="part-emoji">{currentQuestion.emoji1}</span>
                        <span className="part-text">{currentQuestion.part1}</span>
                        <span className="part-hint"><Volume2 size={14} /> Hear</span>
                      </button>

                      <div className="compound-plus-icon" aria-hidden="true">
                        <Plus size={26} />
                      </div>

                      <button
                        type="button"
                        className="compound-part-card"
                        onClick={() => {
                          playTapSound();
                          speakText(currentQuestion.part2);
                          setSpeakingText(currentQuestion.part2);
                        }}
                        aria-label={`Hear ${currentQuestion.part2}`}
                      >
                        <span className="part-emoji">{currentQuestion.emoji2}</span>
                        <span className="part-text">{currentQuestion.part2}</span>
                        <span className="part-hint"><Volume2 size={14} /> Hear</span>
                      </button>

                      <div className="compound-equals-sign" aria-hidden="true">
                        =
                      </div>

                      <div
                        className={`compound-result-card ${
                          combinedSuccess ? "combined" : "waiting"
                        }`}
                      >
                        <span className="part-emoji">
                          {combinedSuccess ? currentQuestion.picture : "✨"}
                        </span>
                        <span className="part-text">
                          {selectedAnswer || "?"}
                        </span>
                        <span className="part-hint">
                          {selectedAnswer ? "Together!" : "Choose below"}
                        </span>
                      </div>
                    </div>

                    <p className="compound-instruction">
                      Tap each word to hear its sound, then select the new combination word below!
                    </p>
                  </div>
                ) : (
                  /* REGULAR PICTURE ANCHOR CARD */
                  currentQuestion.picture && (
                    <button
                      type="button"
                      className="duo-picture-card"
                      onClick={() => handleItemAudio(currentQuestion.pictureLabel)}
                      aria-label={`Hear ${currentQuestion.pictureLabel || currentQuestion.picture}`}
                    >
                      <span className="picture-emoji">{currentQuestion.picture}</span>
                      <div className="picture-text-meta">
                        <strong>{currentQuestion.pictureLabel || "Tap to hear"}</strong>
                        <span className="listen-chip">
                          <Volume2 size={15} /> Tap to hear
                        </span>
                      </div>
                    </button>
                  )
                )}

                {/* SOUND EXAMPLES (PURE PHONEMES) */}
                {currentQuestion.soundExamples?.length > 0 && (
                  <div className="sound-example-row" aria-label="Hear sound examples">
                    {currentQuestion.soundExamples.map((item) => (
                      <button
                        type="button"
                        key={`${item.label}-${item.word}`}
                        className="sound-example-button"
                        onClick={() => {
                          playTapSound();
                          speakText(item.word);
                          setSpeakingText(item.word);
                        }}
                        aria-label={`Hear ${item.label} in ${item.word}`}
                      >
                        <span className="sound-example-label">{item.label}</span>
                        <span className="sound-example-word">
                          <Volume2 size={14} /> {item.word}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* ANSWER OPTIONS (DUOLINGO TACTILE 3D BUTTONS) */}
                <div className="duo-options-grid">
                  {currentQuestion.choices.map((choice) => (
                    <button
                      type="button"
                      key={choice}
                      className={`duo-choice-btn ${
                        selectedAnswer === choice ? "selected" : ""
                      }`}
                      onClick={() => handleSelectChoice(choice)}
                    >
                      <span className="choice-text">{choice}</span>
                      <span className="choice-action">
                        <Volume2 size={18} />
                        {selectedAnswer === choice && <Check size={18} />}
                      </span>
                    </button>
                  ))}
                </div>

                {/* HINT */}
                {showHint && (
                  <div className="duo-hint-box">
                    💚 Friendly Clue: {currentQuestion.hint}
                  </div>
                )}

                {/* BOTTOM ACTION BAR */}
                <div className="duo-bottom-bar">
                  <button
                    className="duo-hint-btn"
                    onClick={() => {
                      playHintSound();
                      setShowHint(!showHint);
                      if (!showHint) speakText(currentQuestion.hint);
                    }}
                  >
                    💡 Need a clue?
                  </button>

                  <button
                    className="duo-continue-btn"
                    disabled={!selectedAnswer}
                    onClick={submitAnswer}
                  >
                    <span>
                      {questionIndex === currentQuestionsList.length - 1
                        ? "Finish Lesson"
                        : "Check & Continue"}
                    </span>
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            ) : (
              /* ===================================================
                  LESSON CELEBRATION (PERFECT LESSON REWARD SCREEN)
              =================================================== */
              <div className="lesson-result-screen">
                <div className="celebration-animation">
                  {sessionResult.isPerfect ? "👑" : "🎉"}
                </div>

                {sessionResult.isPerfect ? (
                  <div className="perfect-lesson-ribbon">
                    <Sparkles size={20} />
                    <span>PERFECT LESSON! 100% ACCURACY!</span>
                    <Sparkles size={20} />
                  </div>
                ) : (
                  <span className="lesson-complete-tag">LESSON COMPLETE!</span>
                )}

                <h1>
                  {sessionResult.isPerfect
                    ? "Flawless Reading Champion!"
                    : "Fantastic Effort!"}
                </h1>
                <p>
                  {sessionResult.isPerfect
                    ? "You made zero mistakes and conquered every sound! Here are your bonus rewards."
                    : "You gave it your best effort! Every lesson strengthens your reading superpowers."}
                </p>

                {/* REWARD SUMMARY CARDS */}
                <div className="reward-cards-grid">
                  <div className="reward-stat-card stars">
                    <Star size={28} fill="#ffc800" color="#ffc800" />
                    <strong>+{sessionResult.starsEarned}</strong>
                    <span>Stars Earned</span>
                  </div>

                  <div className="reward-stat-card gems">
                    <Gem size={28} fill="#1cb0f6" color="#1cb0f6" />
                    <strong>+{sessionResult.gemsEarned}</strong>
                    <span>Gems Earned</span>
                  </div>

                  <div className="reward-stat-card streak">
                    <Flame size={28} fill="#ff7a00" color="#ff7a00" />
                    <strong>{sessionResult.streakDays} Day</strong>
                    <span>Streak 🔥</span>
                  </div>
                </div>

                <div className="result-actions-row">
                  <button
                    className="duo-retry-btn"
                    onClick={() => startLevel(activeLevel)}
                  >
                    <RotateCcw size={17} /> Practice Again
                  </button>

                  <button className="duo-continue-btn large" onClick={closePractice}>
                    Continue Quest <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
