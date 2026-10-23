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
import { requestAdaptiveRecommendation } from "../utils/gemmaAdaptive";
import GemmaAdaptiveCoachCard from "./GemmaAdaptiveCoachCard";
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

const LETTER_PHONICS = {
  a: ["a", "ay", "ah", "ey", "apple"],
  b: ["b", "be", "bee", "buh", "ball", "b"],
  c: ["c", "see", "sea", "kuh", "cat"],
  d: ["d", "de", "dee", "duh", "dog"],
  e: ["e", "ee", "eh", "egg"],
  f: ["f", "ef", "eff", "fuh", "fish"],
  g: ["g", "jee", "guh", "go"],
  h: ["h", "aitch", "ha", "huh", "hat"],
  i: ["i", "eye", "ih", "igloo"],
  j: ["j", "jay", "juh", "jump"],
  k: ["k", "kay", "kuh", "kite"],
  l: ["l", "el", "ell", "luh", "lion"],
  m: ["m", "em", "muh", "moon"],
  n: ["n", "en", "nuh", "nest"],
  o: ["o", "oh", "ox"],
  p: ["p", "pee", "puh", "pig"],
  q: ["q", "cue", "kyu", "queen"],
  r: ["r", "ar", "are", "er", "ruh", "ring"],
  s: ["s", "es", "ess", "suh", "sun"],
  t: ["t", "tee", "tuh", "top"],
  u: ["u", "you", "uh", "up"],
  v: ["v", "vee", "vuh", "van"],
  w: ["w", "double you", "wuh", "web"],
  x: ["x", "ex", "fox"],
  y: ["y", "why", "yuh", "yo-yo"],
  z: ["z", "zee", "zed", "zuh", "zebra"],
};

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
  const [gemmaRecommendation, setGemmaRecommendation] = useState(null);
  const [isGemmaLoading, setIsGemmaLoading] = useState(false);

  // Quiet attempt counter & Orange State
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
  const chunkTimerRef = useRef(null);
  const sessionTimerRef = useRef(null);
  const isListeningRef = useRef(false);
  const isAnswerCheckedRef = useRef(false);
  const accumulatedTranscriptRef = useRef("");

  // Letter Building state (type: "letter_build")
  const [placedLetters, setPlacedLetters] = useState([]);
  const [availableBank, setAvailableBank] = useState([]);

  const currentQ = questions[currentIndex] || {};
  const progressPercent = Math.round(((currentIndex) / questions.length) * 100);

  // Sync isAnswerCheckedRef with state
  useEffect(() => {
    isAnswerCheckedRef.current = isAnswerChecked;
  }, [isAnswerChecked]);

  // Initialize question state whenever currentIndex changes
  useEffect(() => {
    if (currentQ?.prompt) {
      setSelectedAnswer(null);
      setIsAnswerChecked(false);
      isAnswerCheckedRef.current = false;
      setIsCorrect(false);
      setHeardTranscript("");
      setSpeechError("");
      setIsListening(false);
      isListeningRef.current = false;
      setIsWhisperProcessing(false);
      setAttemptCount(0);
      setIsOrangeExhausted(false);
      accumulatedTranscriptRef.current = "";

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
  // SEND AUDIO CHUNK TO ACCURATE WHISPER SERVICE
  // -------------------------------------------------------
  const sendAudioToWhisper = async (audioBlob) => {
    if (!audioBlob || audioBlob.size === 0) return;

    try {
      setIsWhisperProcessing(true);
      const formData = new FormData();
      formData.append("audio", audioBlob, "reading.webm");

      // Prime Whisper decoder with upcoming lesson vocabulary for accuracy
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
        return;
      }

      if (data.text && data.text.trim()) {
        const transcriptChunk = data.text.trim();
        // Append to accumulated transcript for this attempt
        accumulatedTranscriptRef.current = (
          accumulatedTranscriptRef.current + " " + transcriptChunk
        ).trim();
        setHeardTranscript(accumulatedTranscriptRef.current);
        evaluateSpokenReading(accumulatedTranscriptRef.current, false);
      }
    } catch (err) {
      console.warn("Whisper connection notice:", err.message);
      setIsWhisperProcessing(false);
    }
  };

  // -------------------------------------------------------
  // FAILED SPEECH ATTEMPT HANDLER (QUIET 3 ATTEMPTS)
  // -------------------------------------------------------
  const handleFailedAttempt = (spokenText = "") => {
    stopSpeechRecognition();
    const nextAttempts = attemptCount + 1;
    setAttemptCount(nextAttempts);

    if (nextAttempts < 3) {
      playGentleEncouragement();
      // Friendly, encouraging prompt without mentioning "chances" or "tries left"
      setSpeechError("Take a breath and try once more! 🎙️");
    } else {
      // 3 attempts reached! Turn orange and reveal CONTINUE button
      playGentleEncouragement();
      setIsOrangeExhausted(true);
      setIsCorrect(false);
      setIsAnswerChecked(true);
      isAnswerCheckedRef.current = true;
      setSelectedAnswer(spokenText || "Practiced");
      setSpeechError("");
      setMistakesList((prev) => [...prev, currentQ]);
      recordChildMistake(currentQ, unit?.id || 1, userId);
    }
  };

  // -------------------------------------------------------
  // EVALUATE SPOKEN READING (DYSLEXIA & YOUNG CHILD MATCHING)
  // -------------------------------------------------------
  const evaluateSpokenReading = (spokenText, isSessionEnd = false) => {
    if (isAnswerCheckedRef.current || isAnswerChecked) return;

    const cleanSpoken = (spokenText || "")
      .toLowerCase()
      .replace(/[.,!?;:"'()[\]{}]/g, "")
      .trim();

    if (!cleanSpoken) {
      if (isSessionEnd) {
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
        if (
          spokenWords.some(
            (sw) => isDyslexiaMatch(sw, tw) || sw.includes(tw) || tw.includes(sw)
          )
        ) {
          matchedWords++;
        }
      });

      // Child read at least 35% of the sentence words, or significant substring, or matched at least 2 words
      const isMatch =
        matchedWords >= Math.max(1, Math.floor(targetWords.length * 0.35)) ||
        cleanSpoken.includes(sentenceTarget) ||
        (targetWords.length <= 3 && matchedWords >= 1);

      if (isMatch) {
        handleSpeakSuccess(spokenText);
      } else if (isSessionEnd) {
        handleFailedAttempt(spokenText);
      }
    } else {
      // Single word / phonics sound
      const targetWord = (currentQ.targetWord || currentQ.answer || "")
        .toLowerCase()
        .replace(/[.,!?;:"'()[\]{}]/g, "")
        .trim();
      const spokenWords = cleanSpoken.split(/\s+/).filter(Boolean);

      let hasMatch = false;

      if (targetWord.length === 1) {
        // Phonics letters: 'B' -> 'bee', 'buh', 'b', 'ball', etc.
        const acceptable = LETTER_PHONICS[targetWord] || [targetWord];
        hasMatch =
          acceptable.some((p) => cleanSpoken.includes(p)) ||
          spokenWords.some(
            (tok) =>
              acceptable.includes(tok) ||
              tok.startsWith(targetWord) ||
              tok === targetWord
          ) ||
          cleanSpoken.startsWith(targetWord);
      } else {
        hasMatch =
          isDyslexiaMatch(cleanSpoken, targetWord) ||
          spokenWords.some((sw) => isDyslexiaMatch(sw, targetWord)) ||
          cleanSpoken.includes(targetWord) ||
          targetWord.includes(cleanSpoken);
      }

      if (hasMatch) {
        handleSpeakSuccess(spokenText);
      } else if (isSessionEnd) {
        handleFailedAttempt(spokenText);
      }
    }
  };

  // -------------------------------------------------------
  // START MICROPHONE RECORDING (HYBRID CONTINUOUS RECOGNITION)
  // -------------------------------------------------------
  const startSpeechRecognition = async () => {
    if (isAnswerCheckedRef.current) return;
    playPopSound();
    setSpeechError("");
    setHeardTranscript("");
    accumulatedTranscriptRef.current = "";
    setIsWhisperProcessing(false);

    stopSpeechRecognition();

    isListeningRef.current = true;
    setIsListening(true);

    // 1. Browser Speech Recognition (Continuous streaming feedback)
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event) => {
          let interimChunk = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            interimChunk += event.results[i][0].transcript + " ";
          }
          if (interimChunk.trim()) {
            const combined = (accumulatedTranscriptRef.current + " " + interimChunk).trim();
            setHeardTranscript(combined);
            evaluateSpokenReading(combined, false);
          }
        };

        recognition.onerror = (err) => {
          console.log("Browser speech notice:", err.error || err);
        };

        recognition.onend = () => {
          // Keep continuous if still listening and not completed
          if (isListeningRef.current && !isAnswerCheckedRef.current) {
            try {
              recognition.start();
            } catch (e) {}
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch (e) {
        console.log("Browser recognition fallback active.");
      }
    }

    // 2. MediaRecorder stream with 3.5s rolling chunks to Whisper
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: recorder.mimeType || "audio/webm",
          });
          audioChunksRef.current = [];
          await sendAudioToWhisper(audioBlob);
        }

        // Loop next chunk continuously if still listening
        if (isListeningRef.current && !isAnswerCheckedRef.current) {
          try {
            recorder.start();
            chunkTimerRef.current = setTimeout(() => {
              if (recorder.state === "recording" && isListeningRef.current) {
                recorder.stop();
              }
            }, 3500);
          } catch (e) {
            console.error("Could not loop recorder chunk:", e);
          }
        }
      };

      recorder.onerror = () => {
        setSpeechError("Microphone error occurred. Tap mic to retry or tap 'I Read It!'.");
        stopSpeechRecognition();
      };

      recorder.start();

      // Trigger first rolling chunk after 3.5s
      chunkTimerRef.current = setTimeout(() => {
        if (recorder.state === "recording" && isListeningRef.current) {
          recorder.stop();
        }
      }, 3500);

      // Total session window: 16s for sentences, 10s for single words
      const totalSessionDuration = currentQ.type === "sentence_read" ? 16000 : 10000;
      sessionTimerRef.current = setTimeout(() => {
        if (isListeningRef.current && !isAnswerCheckedRef.current) {
          stopListeningAndEvaluateSession();
        }
      }, totalSessionDuration);
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

  // Stop listening when child manually taps mic or when session timer expires
  const stopListeningAndEvaluateSession = () => {
    isListeningRef.current = false;
    setIsListening(false);

    if (sessionTimerRef.current) {
      clearTimeout(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
    if (chunkTimerRef.current) {
      clearTimeout(chunkTimerRef.current);
      chunkTimerRef.current = null;
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

    // Evaluate whatever was accumulated during this attempt
    evaluateSpokenReading(accumulatedTranscriptRef.current, true);
  };

  const stopSpeechRecognition = () => {
    isListeningRef.current = false;
    setIsListening(false);

    if (sessionTimerRef.current) {
      clearTimeout(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
    if (chunkTimerRef.current) {
      clearTimeout(chunkTimerRef.current);
      chunkTimerRef.current = null;
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
    isAnswerCheckedRef.current = true;
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
      isAnswerCheckedRef.current = false;
      setIsCorrect(false);
      setHeardTranscript("");
      setSpeechError("");
      setIsListening(false);
      isListeningRef.current = false;
      setIsWhisperProcessing(false);
      setAttemptCount(0);
      setIsOrangeExhausted(false);
      accumulatedTranscriptRef.current = "";

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

        // Checkpoint: Request Gemma Cloud Adaptive Recommendation
        setIsGemmaLoading(true);
        const expectedPassage = questions
          .map((q) => q.targetWord || q.sentence || q.answer || q.prompt || "")
          .join(" ");
        const trickyKeys = mistakesList
          .map((m) => m.targetWord || m.answer || m.id)
          .filter(Boolean);

        const skillByUnit =
          unit?.id === 1
            ? "letter_recognition"
            : unit?.id === 2
            ? "phonics"
            : unit?.id === 3
            ? "sound_blending"
            : unit?.id === 4
            ? "word_reading"
            : "comprehension";

        requestAdaptiveRecommendation({
          currentLevel: unit?.id || 1,
          accuracy: finalAccuracy,
          correctCount,
          totalQuestions: totalQ,
          skillsExercised: [skillByUnit],
          speechTranscript: accumulatedTranscriptRef.current || "",
          expectedPassage,
          trickyItems: trickyKeys,
          userId,
        })
          .then((res) => {
            if (res && res.recommendation) {
              setGemmaRecommendation(res.recommendation);
            }
          })
          .catch((err) => {
            console.warn("Gemma recommendation fetch error:", err);
          })
          .finally(() => {
            setIsGemmaLoading(false);
          });
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
                    onClick={isListening ? stopListeningAndEvaluateSession : startSpeechRecognition}
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
                    onClick={isListening ? stopListeningAndEvaluateSession : startSpeechRecognition}
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

              {/* Gemma Cloud Adaptive Coach Card */}
              <GemmaAdaptiveCoachCard
                recommendation={gemmaRecommendation}
                isLoading={isGemmaLoading}
                childName={childName}
                onActionClick={handleFinishAndReturn}
                actionButtonText="Continue Learning Path 🚀"
                title="Gemma AI Reading Coach"
              />
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
                    <strong style={{ color: "#c2410c" }}>Good Effort! Let's Keep Going 🧡</strong>
                    <span style={{ color: "#9a3412" }}>
                      Practice makes progress! Tap continue to move forward.
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
