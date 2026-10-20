import { useState, useEffect, useRef } from "react";
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
  Mic,
  MicOff,
  RotateCcw,
  Check,
  Brain,
  ThumbsUp
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
  const { lesson, unit, questions = [] } = lessonSession;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [mistakesList, setMistakesList] = useState([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [finishStats, setFinishStats] = useState(null);

  // Read Out Loud (Voice Recognition) state
  const [isListening, setIsListening] = useState(false);
  const [heardTranscript, setHeardTranscript] = useState("");
  const [speechError, setSpeechError] = useState("");
  const recognitionRef = useRef(null);

  // Letter Building state (type: "letter_build")
  const [placedLetters, setPlacedLetters] = useState([]);
  const [availableBank, setAvailableBank] = useState([]);

  const currentQ = questions[currentIndex] || {};
  const progressPercent = Math.round(((currentIndex) / questions.length) * 100);

  // Initialize question state whenever currentIndex changes
  useEffect(() => {
    if (currentQ?.prompt) {
      setSelectedAnswer(null);
      setIsAnswerChecked(false);
      setIsCorrect(false);
      setHeardTranscript("");
      setSpeechError("");
      setIsListening(false);

      // Setup letter building bank if letter_build type
      if (currentQ.type === "letter_build" && currentQ.letterBank) {
        setAvailableBank(currentQ.letterBank.map((letter, idx) => ({ id: `${letter}-${idx}`, letter })));
        setPlacedLetters([]);
      }

      // Read only the question prompt in child's voice without overly explaining
      const speech = currentQ.prompt;
      const timer = setTimeout(() => {
        speakText(speech, { rate: 0.88, pitch: 1.38 });
      }, 350);

      return () => {
        clearTimeout(timer);
        stopSpeechRecognition();
      };
    }
  }, [currentIndex]);

  // Clean up recognition on unmount
  useEffect(() => {
    return () => {
      stopSpeechRecognition();
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // -------------------------------------------------------
  // Web Speech Recognition for "Read Out Loud" Exercises
  // -------------------------------------------------------
  const startSpeechRecognition = () => {
    playPopSound();
    setSpeechError("");
    setHeardTranscript("");

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError("Microphone not supported in this browser. You can tap 'I Read It!' below.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        const cleaned = transcript.trim().toLowerCase();
        setHeardTranscript(transcript);

        // Check if spoken text matches target word/letter
        const target = (currentQ.targetWord || currentQ.answer || "").trim().toLowerCase();
        if (target && (cleaned.includes(target) || target.includes(cleaned) || cleaned.length >= 1)) {
          // If child said target word, auto-validate!
          handleSpeakSuccess(transcript);
        }
      };

      recognition.onerror = (err) => {
        console.warn("Speech recognition notice:", err.error);
        setIsListening(false);
        if (err.error === "not-allowed") {
          setSpeechError("Microphone permission was not allowed. Tap 'I Read It!' to continue.");
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {
      console.warn("Speech recognition error:", e);
      setIsListening(false);
      setSpeechError("Microphone unavailable. Tap 'I Read It!' to continue.");
    }
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const handleSpeakSuccess = (spokenText = "") => {
    stopSpeechRecognition();
    setIsCorrect(true);
    setIsAnswerChecked(true);
    setSelectedAnswer(spokenText || currentQ.targetWord || "Spoken");
    playSuccessChime();
    setCorrectCount((prev) => prev + 1);
    recordChildSuccess(currentQ, unit?.id || 1, userId);
  };

  // -------------------------------------------------------
  // Standard Choice & Image Card Selection
  // -------------------------------------------------------
  const handleSelectChoice = (choice) => {
    if (isAnswerChecked) return;
    playPopSound();
    setSelectedAnswer(choice);
  };

  const handlePlayVoiceAudio = (e, text) => {
    e.stopPropagation();
    playPopSound();
    speakText(text, { rate: 0.88, pitch: 1.38 });
  };

  // -------------------------------------------------------
  // Letter Building (type: "letter_build") Handlers
  // -------------------------------------------------------
  const handleBankTileClick = (tile) => {
    if (isAnswerChecked) return;
    playPopSound();
    setAvailableBank((prev) => prev.filter((item) => item.id !== tile.id));
    setPlacedLetters((prev) => [...prev, tile]);
  };

  const handlePlacedTileClick = (tile) => {
    if (isAnswerChecked) return;
    playPopSound();
    setPlacedLetters((prev) => prev.filter((item) => item.id !== tile.id));
    setAvailableBank((prev) => [...prev, tile]);
  };

  // -------------------------------------------------------
  // Check Answer Handler
  // -------------------------------------------------------
  const handleCheckAnswer = () => {
    if (isAnswerChecked) return;

    let correct = false;

    if (currentQ.type === "letter_build") {
      const builtWord = placedLetters.map((p) => p.letter).join("").toUpperCase();
      const target = (currentQ.targetWord || currentQ.answer).toUpperCase();
      correct = builtWord === target;
      setSelectedAnswer(builtWord);
    } else {
      if (!selectedAnswer) return;
      const target = String(currentQ.answer || "").trim().toLowerCase();
      correct = String(selectedAnswer).trim().toLowerCase() === target;
    }

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
    }
  };

  // -------------------------------------------------------
  // Next Question / Completion Handler
  // -------------------------------------------------------
  const handleNextQuestion = async () => {
    playPopSound();
    stopSpeechRecognition();

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Completed all questions in the short bite-sized lesson!
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

  // Check if check button can be enabled
  const isCheckEnabled =
    currentQ.type === "letter_build"
      ? placedLetters.length > 0
      : !!selectedAnswer;

  return (
    <div className="duo-lesson-overlay" role="dialog" aria-modal="true">
      <div className="duo-lesson-modal-card">
        {/* ===================================================
            TOP BAR & PROGRESS
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
            BIRDBRAIN ADAPTIVE PILL
        =================================================== */}
        {currentQ?.isBirdbrainReview && (
          <div className="birdbrain-adaptive-pill">
            <Brain size={14} color="#8b5cf6" />
            <span>{currentQ.birdbrainBadge || "Birdbrain Spaced-Repetition"}</span>
          </div>
        )}

        {/* ===================================================
            MAIN ACTIVE QUESTION VIEW
        =================================================== */}
        {!isFinished ? (
          <div className="duo-question-container">
            {/* Prompt with Child Voice Speaker */}
            <div className="duo-prompt-row">
              <h2>{currentQ.prompt}</h2>
              <button
                type="button"
                className="duo-speaker-btn"
                onClick={() => {
                  playPopSound();
                  speakText(currentQ.prompt, { rate: 0.88, pitch: 1.38 });
                }}
                title="Hear question in child's voice"
              >
                <Volume2 size={22} />
              </button>
            </div>

            {/* ===============================================
                QUESTION TYPE 1: READ OUT LOUD CHALLENGE 🎙️
            =============================================== */}
            {currentQ.type === "speak_loud" && (
              <div className="speak-loud-exercise">
                <div className="target-word-card">
                  {currentQ.picture && (
                    <span className="target-word-emoji">{currentQ.picture}</span>
                  )}
                  <h1 className="target-word-text">{currentQ.targetWord || currentQ.answer}</h1>
                  {currentQ.phoneticHint && (
                    <span className="target-phonetic-badge">{currentQ.phoneticHint}</span>
                  )}
                </div>

                <div className="speak-mic-center">
                  <button
                    type="button"
                    className={`speak-mic-hero-btn ${isListening ? "listening-pulse" : ""} ${isCorrect ? "heard-success" : ""}`}
                    onClick={isListening ? stopSpeechRecognition : startSpeechRecognition}
                    disabled={isAnswerChecked && isCorrect}
                  >
                    {isListening ? (
                      <Mic size={36} color="#ffffff" className="mic-listening-icon" />
                    ) : isCorrect ? (
                      <Check size={36} color="#ffffff" />
                    ) : (
                      <Mic size={36} color="#ffffff" />
                    )}
                  </button>

                  <span className="speak-instruction-text">
                    {isListening
                      ? "Listening... say it out loud! 🎙️"
                      : isCorrect
                      ? "Great reading! 🎉"
                      : "Tap the microphone and read out loud!"}
                  </span>

                  {heardTranscript && (
                    <div className="heard-transcript-pill">
                      <span>I heard: "<strong>{heardTranscript}</strong>"</span>
                    </div>
                  )}

                  {speechError && (
                    <p className="speech-error-note">{speechError}</p>
                  )}

                  {/* Encouraging I-Read-It button so child is never stuck */}
                  {!isCorrect && (
                    <button
                      type="button"
                      className="speak-pass-btn"
                      onClick={() => handleSpeakSuccess(currentQ.targetWord)}
                    >
                      <ThumbsUp size={16} />
                      <span>I read it out loud! 👍</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ===============================================
                QUESTION TYPE 2: SELECT THE MATCHING IMAGE 🖼️
            =============================================== */}
            {currentQ.type === "image_select" && currentQ.imageChoices && (
              <div className="image-select-grid">
                {currentQ.imageChoices.map((choice, idx) => {
                  const isSelected = selectedAnswer === choice.label;
                  let cardClass = "image-choice-card";
                  if (isSelected) cardClass += " selected";
                  if (isAnswerChecked) {
                    if (choice.label.toLowerCase() === String(currentQ.answer).toLowerCase()) {
                      cardClass += " correct-revealed";
                    } else if (isSelected && !isCorrect) {
                      cardClass += " incorrect-revealed";
                    }
                  }

                  return (
                    <div
                      key={`${choice.label}-${idx}`}
                      className={cardClass}
                      onClick={() => handleSelectChoice(choice.label)}
                    >
                      <button
                        type="button"
                        className="image-card-speaker"
                        onClick={(e) => handlePlayVoiceAudio(e, choice.audio || choice.label)}
                        title={`Hear ${choice.label}`}
                      >
                        <Volume2 size={16} />
                      </button>

                      <span className="image-card-emoji">{choice.emoji}</span>
                      <strong className="image-card-label">{choice.label}</strong>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ===============================================
                QUESTION TYPE 3: TAP LETTERS TO BUILD WORD 🧱
            =============================================== */}
            {currentQ.type === "letter_build" && (
              <div className="letter-build-exercise">
                {/* Word Target Illustration */}
                {currentQ.picture && (
                  <div className="build-target-banner">
                    <span className="build-emoji">{currentQ.picture}</span>
                    <span className="build-label">{currentQ.pictureLabel || "Build the word"}</span>
                  </div>
                )}

                {/* Placed Letter Slots */}
                <div className="build-slots-row">
                  {placedLetters.length === 0 ? (
                    <div className="empty-slot-hint">Tap letter tiles below in order...</div>
                  ) : (
                    placedLetters.map((tile, idx) => (
                      <button
                        key={tile.id}
                        type="button"
                        className="placed-letter-tile"
                        onClick={() => handlePlacedTileClick(tile)}
                        title="Tap to remove"
                        disabled={isAnswerChecked}
                      >
                        <span>{tile.letter}</span>
                      </button>
                    ))
                  )}
                </div>

                {/* Available Letter Bank */}
                <div className="build-bank-row">
                  {availableBank.map((tile) => (
                    <button
                      key={tile.id}
                      type="button"
                      className="bank-letter-tile"
                      onClick={() => handleBankTileClick(tile)}
                      disabled={isAnswerChecked}
                    >
                      <span>{tile.letter}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ===============================================
                QUESTION TYPE 4: READ SENTENCE ALOUD 🗣️
            =============================================== */}
            {currentQ.type === "sentence_read" && (
              <div className="sentence-read-exercise">
                <div className="sentence-card">
                  {(currentQ.tokens || currentQ.sentence?.split(" ") || []).map((token, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="sentence-word-token"
                      onClick={() => {
                        playPopSound();
                        speakText(token, { rate: 0.85, pitch: 1.38 });
                      }}
                      title="Tap to hear word in child's voice"
                    >
                      {token}
                    </button>
                  ))}
                </div>

                <div className="speak-mic-center">
                  <button
                    type="button"
                    className={`speak-mic-hero-btn ${isListening ? "listening-pulse" : ""} ${isCorrect ? "heard-success" : ""}`}
                    onClick={isListening ? stopSpeechRecognition : startSpeechRecognition}
                  >
                    <Mic size={34} color="#ffffff" />
                  </button>
                  <span className="speak-instruction-text">
                    {isListening ? "Listening... read the sentence! 🎙️" : "Tap mic and read the sentence out loud!"}
                  </span>

                  {!isCorrect && (
                    <button
                      type="button"
                      className="speak-pass-btn"
                      onClick={() => handleSpeakSuccess(currentQ.sentence)}
                    >
                      <ThumbsUp size={16} />
                      <span>I read the sentence! 👍</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ===============================================
                QUESTION TYPE 5: STANDARD CHOICES / WORD SELECT 📖
            =============================================== */}
            {(!["speak_loud", "image_select", "letter_build", "sentence_read"].includes(currentQ.type)) && (
              <>
                {currentQ.picture && (
                  <div className="duo-mnemonic-card">
                    <span className="mnemonic-emoji">{currentQ.picture}</span>
                    {currentQ.pictureLabel && (
                      <span className="mnemonic-label">{currentQ.pictureLabel}</span>
                    )}
                  </div>
                )}

                <div className="duo-choices-grid">
                  {(currentQ.choices || []).map((choice, idx) => {
                    const isSelected = selectedAnswer === choice;
                    let choiceClass = "duo-choice-card";

                    if (isSelected) choiceClass += " selected";
                    if (isAnswerChecked) {
                      if (choice.trim().toLowerCase() === String(currentQ.answer).trim().toLowerCase()) {
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
              </>
            )}
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
              You read and mastered <strong>{lesson.title}</strong> in {unit?.title || "Phonics"}!
            </p>

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

            <div className="finish-birdbrain-card">
              <div className="birdbrain-header">
                <Brain size={18} color="#8b5cf6" />
                <strong>Birdbrain AI Speech & Reading Summary</strong>
              </div>
              <p>
                {finishStats?.isPerfect
                  ? "Flawless reading! You pronounced each letter sound with confidence and earned bonus Challenger diamonds!"
                  : finishStats?.accuracy >= 75
                  ? "Awesome reading out loud! Birdbrain unlocked your next stepping stone on the path."
                  : "Great effort reading aloud! Birdbrain will continue encouraging these friendly sounds in your next session."}
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
                  disabled={!isCheckEnabled && currentQ.type !== "speak_loud"}
                >
                  CHECK ANSWER
                </button>
              </div>
            ) : isCorrect ? (
              <div className="feedback-result-row correct">
                <div className="feedback-msg">
                  <CheckCircle2 size={32} color="#15803d" />
                  <div>
                    <strong>Awesome Job! 🌟</strong>
                    <span>You read and answered correctly! +1 Gem</span>
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
                    <span>{currentQ.hint || `Correct answer is ${currentQ.answer || currentQ.targetWord}`}</span>
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
