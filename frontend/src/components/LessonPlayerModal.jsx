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

// =========================================================
// DYSLEXIA-FRIENDLY PHONETIC & LEVENSHTEIN MATCHER
// Supports common letter transpositions (b <-> d, p <-> q, m <-> w)
// and slight young-child pronunciation variations
// =========================================================

function levenshteinDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function isDyslexiaMatch(spoken, expected) {
  if (!spoken || !expected) return false;
  const s = spoken.toLowerCase().replace(/[.,!?;:"'()[\]{}]/g, "").trim();
  const e = expected.toLowerCase().replace(/[.,!?;:"'()[\]{}]/g, "").trim();
  if (s === e) return true;

  // 1. Common dyslexia letter transpositions (b <-> d, p <-> q, m <-> w)
  const normSpoken = s.replace(/d/g, "b").replace(/q/g, "p").replace(/w/g, "m");
  const normExpected = e.replace(/d/g, "b").replace(/q/g, "p").replace(/w/g, "m");
  if (normSpoken === normExpected) return true;

  // 2. Levenshtein edit distance for young speech or minor accents
  const dist = levenshteinDistance(s, e);
  if (e.length <= 3 && dist <= 1) return true;
  if (e.length > 3 && dist <= 2) return true;

  // 3. Substring match
  if (e.length >= 4 && (s.startsWith(e) || e.startsWith(s) || s.includes(e) || e.includes(s))) {
    return true;
  }

  return false;
}

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
  const [wordsReadCount, setWordsReadCount] = useState(0);

  // 3-Tries and Orange State for Speech / Reading Questions
  const [attemptCount, setAttemptCount] = useState(0);
  const [isOrangeExhausted, setIsOrangeExhausted] = useState(false);

  // Whisper AI & Voice Recognition state
  const [isListening, setIsListening] = useState(false);
  const [isWhisperProcessing, setIsWhisperProcessing] = useState(false);
  const [heardTranscript, setHeardTranscript] = useState("");
  const [speechError, setSpeechError] = useState("");
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const isListeningRef = useRef(false);

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
      setIsWhisperProcessing(false);
      setAttemptCount(0);
      setIsOrangeExhausted(false);
      setIsWhisperProcessing(false);
      setAttemptCount(0);
      setIsOrangeExhausted(false);

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
  // SEND AUDIO TO WHISPER MODEL (SAME AS STORY READING)
  // -------------------------------------------------------
  const sendAudioToWhisper = async (audioBlob) => {
    if (!audioBlob || audioBlob.size === 0) {
      evaluateSpokenReading(heardTranscript || "", true);
      return;
    }

    try {
      setIsWhisperProcessing(true);
      const formData = new FormData();
      formData.append("audio", audioBlob, "lesson_reading.webm");

      // Prime Whisper decoder with target word or sentence for pinpoint child accuracy
      const promptContext = currentQ.targetWord || currentQ.sentence || currentQ.answer || "";
      if (promptContext) {
        formData.append("prompt", promptContext);
      }

      const response = await fetch("http://localhost:5000/api/speech/transcribe", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await response.json();
      setIsWhisperProcessing(false);

      if (!response.ok) {
        console.warn("Whisper speech route notice:", data.error || response.statusText);
        evaluateSpokenReading(heardTranscript || "", true);
        return;
      }

      if (data.text && data.text.trim()) {
        const transcript = data.text.trim();
        setHeardTranscript(transcript);
        evaluateSpokenReading(transcript, true);
      } else {
        evaluateSpokenReading(heardTranscript || "", true);
      }
    } catch (err) {
      console.warn("Whisper connection notice:", err.message);
      setIsWhisperProcessing(false);
      evaluateSpokenReading(heardTranscript || "", true);
    }
  };

  // -------------------------------------------------------
  // FAILED SPEECH ATTEMPT HANDLER (3 TRIES THEN ORANGE CARD)
  // -------------------------------------------------------
  const handleFailedAttempt = (spokenText = "") => {
    stopSpeechRecognition();
    const nextAttempts = attemptCount + 1;
    setAttemptCount(nextAttempts);

    if (nextAttempts < 3) {
      playGentleEncouragement();
      const triesLeft = 3 - nextAttempts;
      setSpeechError(
        `Almost! Try saying it again (${triesLeft} ${triesLeft === 1 ? "try" : "tries"} left) 🎙️`
      );
    } else {
      // 3 attempts reached! Turn orange and reveal CONTINUE button
      playGentleEncouragement();
      setIsOrangeExhausted(true);
      setIsCorrect(false);
      setIsAnswerChecked(true);
      setSelectedAnswer(spokenText || "Practiced 3 times");
      setSpeechError("");
      setMistakesList((prev) => [...prev, currentQ]);
      recordChildMistake(currentQ, unit?.id || 1, userId);
    }
  };

  // -------------------------------------------------------
  // EVALUATE SPOKEN READING (DYSLEXIA & YOUNG CHILD MATCHING)
  // -------------------------------------------------------
  const evaluateSpokenReading = (spokenText, isFinal = false) => {
    if (isAnswerChecked) return;

    const cleanSpoken = (spokenText || "")
      .toLowerCase()
      .replace(/[.,!?;:"'()[\]{}]/g, "")
      .trim();

    if (!cleanSpoken) {
      if (isFinal) {
        handleFailedAttempt("");
      }
      return;
    }

    if (currentQ.type === "sentence_read") {
      const sentenceTarget = (currentQ.sentence || "")
        .toLowerCase()
        .replace(/[.,!?;:"'()[\]{}]/g, "")
        .trim();
      const targetWords = sentenceTarget.split(/\s+/).filter(Boolean);
      const spokenWords = cleanSpoken.split(/\s+/).filter(Boolean);

      let matchedWords = 0;
      targetWords.forEach((tw) => {
        if (spokenWords.some((sw) => isDyslexiaMatch(sw, tw))) {
          matchedWords++;
        }
      });

      // Valid if child read at least 50% of the sentence words or significant spoken content
      const isMatch =
        matchedWords >= Math.max(1, Math.ceil(targetWords.length * 0.5)) ||
        (cleanSpoken.length >= 4 && targetWords.some((tw) => cleanSpoken.includes(tw)));

      if (isMatch) {
        handleSpeakSuccess(spokenText);
      } else if (isFinal) {
        handleFailedAttempt(spokenText);
      }
    } else {
      // Single word / phonics sound
      const targetWord = (currentQ.targetWord || currentQ.answer || "")
        .toLowerCase()
        .replace(/[.,!?;:"'()[\]{}]/g, "")
        .trim();
      const spokenWords = cleanSpoken.split(/\s+/).filter(Boolean);

      const hasMatch =
        isDyslexiaMatch(cleanSpoken, targetWord) ||
        spokenWords.some((sw) => isDyslexiaMatch(sw, targetWord)) ||
        cleanSpoken.includes(targetWord) ||
        targetWord.includes(cleanSpoken) ||
        (cleanSpoken.length >= 1 && targetWord.length === 1 && cleanSpoken[0] === targetWord[0]);

      if (hasMatch) {
        handleSpeakSuccess(spokenText);
      } else if (isFinal) {
        handleFailedAttempt(spokenText);
      }
    }
  };

  // -------------------------------------------------------
  // START MICROPHONE RECORDING WITH WHISPER AI
  // -------------------------------------------------------
  const startSpeechRecognition = async () => {
    if (isAnswerChecked) return;
    playPopSound();
    setSpeechError("");
    setHeardTranscript("");
    setIsWhisperProcessing(false);

    if (recordingTimerRef.current) {
      clearTimeout(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    // 1. Browser Speech Recognition (instant interim streaming preview)
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event) => {
          let transcript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          if (transcript.trim()) {
            setHeardTranscript(transcript.trim());
            // Only evaluate for early correct match; do not count attempts during live speaking
            evaluateSpokenReading(transcript.trim(), false);
          }
        };

        recognition.onerror = (err) => {
          console.log("Browser speech notice:", err.error);
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch (e) {
        console.log("Browser recognition fallback active.");
      }
    }

    // 2. MediaRecorder stream for accurate local Whisper AI model
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      isListeningRef.current = true;
      setIsListening(true);

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: recorder.mimeType || "audio/webm",
          });
          audioChunksRef.current = [];
          await sendAudioToWhisper(audioBlob);
        } else {
          evaluateSpokenReading(heardTranscript || "", true);
        }
      };

      recorder.onerror = () => {
        setSpeechError("Microphone error occurred. Please try again or tap 'I Read It!'.");
        stopSpeechRecognition();
      };

      recorder.start();

      // Generous reading time: 15 seconds for sentence, 7.5 seconds for single word
      const recordingDuration = currentQ.type === "sentence_read" ? 15000 : 7500;
      recordingTimerRef.current = setTimeout(() => {
        if (recorder.state === "recording") {
          stopAndTranscribe();
        }
      }, recordingDuration);
    } catch (err) {
      console.warn("Microphone access error:", err);
      setIsListening(false);
      isListeningRef.current = false;
      if (err.name === "NotAllowedError") {
        setSpeechError("Microphone permission was not allowed. Tap 'I Read It!' to continue.");
      } else {
        setSpeechError("Could not access microphone. Tap 'I Read It!' to continue.");
      }
    }
  };

  const stopAndTranscribe = () => {
    isListeningRef.current = false;
    setIsListening(false);

    if (recordingTimerRef.current) {
      clearTimeout(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }
  };

  const stopSpeechRecognition = () => {
    isListeningRef.current = false;
    setIsListening(false);

    if (recordingTimerRef.current) {
      clearTimeout(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current) {
      try {
        if (mediaRecorderRef.current.state === "recording") {
          mediaRecorderRef.current.stop();
        }
      } catch (e) {}
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      }
      mediaRecorderRef.current = null;
    }
    audioChunksRef.current = [];
  };

  const handleSpeakSuccess = (spokenText = "") => {
    stopSpeechRecognition();
    setIsCorrect(true);
    setIsOrangeExhausted(false);
    setIsAnswerChecked(true);
    setSelectedAnswer(spokenText || currentQ.targetWord || currentQ.sentence || "Spoken");
    setWordsReadCount((prev) => prev + 1);
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
    } else if (currentQ.type === "speak_loud" || currentQ.type === "sentence_read") {
      // For speech/reading cards, clicking check/read confirms completion & advances
      correct = true;
      const targetText = selectedAnswer || currentQ.targetWord || currentQ.sentence || "Read!";
      setSelectedAnswer(targetText);
      setWordsReadCount((prev) => prev + 1);
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

    const nextIdx = currentIndex + 1;
    if (nextIdx < questions.length) {
      // Synchronously reset all card states so next card is fresh & interactive
      setSelectedAnswer(null);
      setIsAnswerChecked(false);
      setIsCorrect(false);
      setHeardTranscript("");
      setSpeechError("");
      setIsListening(false);
      setIsWhisperProcessing(false);
      setAttemptCount(0);
      setIsOrangeExhausted(false);

      const nextQ = questions[nextIdx];
      if (nextQ?.type === "letter_build" && nextQ?.letterBank) {
        setAvailableBank(nextQ.letterBank.map((letter, idx) => ({ id: `${letter}-${idx}`, letter })));
        setPlacedLetters([]);
      } else {
        setAvailableBank([]);
        setPlacedLetters([]);
      }

      setCurrentIndex(nextIdx);
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
      : currentQ.type === "speak_loud" || currentQ.type === "sentence_read"
      ? true
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

          <div className="duo-words-read-pill" title="Words read aloud in this lesson">
            <span className="read-pill-icon">🗣️</span>
            <span className="read-pill-count">{wordsReadCount}</span>
            <span className="read-pill-label">read</span>
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
          <div className="duo-question-container" key={currentIndex}>
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
                <div className={`target-word-card ${isOrangeExhausted ? "orange-text-card" : ""}`}>
                  {currentQ.picture && (
                    <span className="target-word-emoji">{currentQ.picture}</span>
                  )}
                  <h1 className="target-word-text">{currentQ.targetWord || currentQ.answer}</h1>
                  {currentQ.phoneticHint && (
                    <span className="target-phonetic-badge">{currentQ.phoneticHint}</span>
                  )}
                  {isOrangeExhausted && (
                    <span className="target-orange-note">Good try! Practice makes progress 🧡</span>
                  )}
                  {currentQ.syllables && currentQ.syllables.length > 0 && (
                    <div className="syllable-blend-container">
                      <span className="syllable-blend-label">Tap sounds to blend:</span>
                      <div className="syllable-chips-row">
                        {currentQ.syllables.map((syl, i) => (
                          <button
                            key={i}
                            type="button"
                            className="syllable-chip-btn"
                            onClick={() => {
                              playPopSound();
                              speakText(syl, { rate: 0.82, pitch: 1.38 });
                            }}
                            title={`Hear ${syl}`}
                          >
                            <Volume2 size={13} />
                            <span>{syl}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="speak-mic-center">
                  <button
                    type="button"
                    className={`speak-mic-hero-btn ${isListening ? "listening-pulse" : ""} ${isCorrect ? "heard-success" : ""} ${isOrangeExhausted ? "heard-orange" : ""}`}
                    onClick={isListening ? stopAndTranscribe : startSpeechRecognition}
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
                    {isWhisperProcessing
                      ? "Listening with Whisper AI... 🧠"
                      : isListening
                      ? "Listening... say it out loud! 🎙️"
                      : isCorrect
                      ? "Great reading! 🎉"
                      : isOrangeExhausted
                      ? "Good effort! Let's continue 🧡"
                      : "Tap the microphone and read out loud!"}
                  </span>

                  {/* 3-Tries Progress Indicator */}
                  {!isCorrect && !isOrangeExhausted && (
                    <div className="reading-tries-indicator">
                      <span className={`try-pip ${attemptCount >= 1 ? "used" : ""}`} />
                      <span className={`try-pip ${attemptCount >= 2 ? "used" : ""}`} />
                      <span className={`try-pip ${attemptCount >= 3 ? "used" : ""}`} />
                      <span className="tries-label-text">
                        {attemptCount === 0
                          ? "3 tries"
                          : attemptCount === 1
                          ? "2 tries left"
                          : "1 try left"}
                      </span>
                    </div>
                  )}

                  {heardTranscript && (
                    <div className="heard-transcript-pill">
                      <span>✨ Whisper heard: "<strong>{heardTranscript}</strong>"</span>
                    </div>
                  )}

                  {speechError && (
                    <p className="speech-error-note">{speechError}</p>
                  )}

                  {/* Encouraging I-Read-It button so child is never stuck */}
                  {!isCorrect && !isOrangeExhausted && (
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
                <div className={`sentence-card ${isOrangeExhausted ? "orange-text-card" : ""}`}>
                  <div className="sentence-tokens-row">
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

                  {isOrangeExhausted && (
                    <span className="target-orange-note">Good try! Keep going 🧡</span>
                  )}

                  <button
                    type="button"
                    className="sentence-listen-full-btn"
                    onClick={() => {
                      playPopSound();
                      speakText(currentQ.sentence, { rate: 0.88, pitch: 1.38 });
                    }}
                    title="Hear entire sentence"
                  >
                    <Volume2 size={16} />
                    <span>Hear full sentence</span>
                  </button>
                </div>

                <div className="speak-mic-center">
                  <button
                    type="button"
                    className={`speak-mic-hero-btn ${isListening ? "listening-pulse" : ""} ${isCorrect ? "heard-success" : ""} ${isOrangeExhausted ? "heard-orange" : ""}`}
                    onClick={isListening ? stopAndTranscribe : startSpeechRecognition}
                    disabled={isAnswerChecked && isCorrect}
                  >
                    {isListening ? (
                      <Mic size={34} color="#ffffff" className="mic-listening-icon" />
                    ) : isCorrect ? (
                      <Check size={34} color="#ffffff" />
                    ) : (
                      <Mic size={34} color="#ffffff" />
                    )}
                  </button>
                  <span className="speak-instruction-text">
                    {isWhisperProcessing
                      ? "Listening with Whisper AI... 🧠"
                      : isListening
                      ? "Listening... take your time to read the sentence! 🎙️"
                      : isCorrect
                      ? "Great reading! 🎉"
                      : isOrangeExhausted
                      ? "Good effort! Let's continue 🧡"
                      : "Tap mic and read the sentence out loud!"}
                  </span>

                  {/* 3-Tries Progress Indicator */}
                  {!isCorrect && !isOrangeExhausted && (
                    <div className="reading-tries-indicator">
                      <span className={`try-pip ${attemptCount >= 1 ? "used" : ""}`} />
                      <span className={`try-pip ${attemptCount >= 2 ? "used" : ""}`} />
                      <span className={`try-pip ${attemptCount >= 3 ? "used" : ""}`} />
                      <span className="tries-label-text">
                        {attemptCount === 0
                          ? "3 tries"
                          : attemptCount === 1
                          ? "2 tries left"
                          : "1 try left"}
                      </span>
                    </div>
                  )}

                  {heardTranscript && (
                    <div className="heard-transcript-pill">
                      <span>✨ Whisper heard: "<strong>{heardTranscript}</strong>"</span>
                    </div>
                  )}

                  {speechError && (
                    <p className="speech-error-note">{speechError}</p>
                  )}

                  {!isCorrect && !isOrangeExhausted && (
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
          <div className="duo-lesson-finished-wrapper">
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
                  <Star size={20} fill="#ffc800" color="#ffc800" />
                  <strong>+{finishStats?.starsEarned || 3} Stars</strong>
                  <span>Effort</span>
                </div>

                <div className="finish-stat-card gems">
                  <Gem size={20} fill="#1cb0f6" color="#1cb0f6" />
                  <strong>+{finishStats?.gemsAwarded || 5} Gems</strong>
                  <span>Crystals</span>
                </div>

                <div className="finish-stat-card accuracy">
                  <Award size={20} color="#10b981" />
                  <strong>{finishStats?.accuracy || 100}%</strong>
                  <span>Accuracy</span>
                </div>

                <div className="finish-stat-card words-read">
                  <span className="finish-stat-icon" style={{ fontSize: 18, lineHeight: 1 }}>🗣️</span>
                  <strong>{wordsReadCount}</strong>
                  <span>Read Aloud</span>
                </div>
              </div>

              <div className="finish-birdbrain-card">
                <div className="birdbrain-header">
                  <Brain size={16} color="#8b5cf6" />
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
            </div>

            <div className="duo-finish-footer">
              <button
                type="button"
                className="duo-finish-continue-btn"
                onClick={handleFinishAndReturn}
              >
                <span>Continue Learning Path 🚀</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ===================================================
            DUOLINGO INSTANT BOTTOM FEEDBACK DRAWER
        =================================================== */}
        {!isFinished && (
          <div
            className={`duo-bottom-feedback-bar ${
              isAnswerChecked
                ? isOrangeExhausted
                  ? "state-orange"
                  : isCorrect
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
                  disabled={!isCheckEnabled}
                >
                  {currentQ.type === "speak_loud" || currentQ.type === "sentence_read"
                    ? "I READ IT! 👍"
                    : "CHECK ANSWER"}
                </button>
              </div>
            ) : isOrangeExhausted ? (
              <div className="feedback-result-row orange-state">
                <div className="feedback-msg">
                  <span className="feedback-orange-emoji" style={{ fontSize: 28, lineHeight: 1 }}>🧡</span>
                  <div>
                    <strong style={{ color: "#c2410c" }}>Good Try! Keep Going</strong>
                    <span style={{ color: "#9a3412" }}>
                      You gave it 3 great tries! Let's move to the next one.
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="duo-continue-btn orange-continue-btn"
                  onClick={handleNextQuestion}
                >
                  CONTINUE
                </button>
              </div>
            ) : isCorrect ? (
              <div className="feedback-result-row correct">
                <div className="feedback-msg">
                  <CheckCircle2 size={26} color="#15803d" />
                  <div>
                    <strong>Awesome Job! 🌟</strong>
                    {currentQ.type !== "speak_loud" && currentQ.type !== "sentence_read" && (currentQ.targetWord || currentQ.answer || selectedAnswer) ? (
                      <span className="feedback-mini-read">
                        You read: <strong>{String(currentQ.targetWord || currentQ.answer || selectedAnswer)}</strong>
                      </span>
                    ) : (
                      <span>+1 Gem earned</span>
                    )}
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
                  <AlertCircle size={26} color="#b91c1c" />
                  <div>
                    <strong>Friendly Hint:</strong>
                    <span>{currentQ.hint || `Answer is ${currentQ.answer || currentQ.targetWord}`}</span>
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
