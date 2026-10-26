import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  Type,
  Split,
  Eye,
  Check,
  RotateCcw,
  Sparkles,
  BookOpen,
  Brain,
  Award,
  Target,
  ArrowRight,
  Flame,
  HelpCircle,
} from "lucide-react";
import "./StoryReader.css";

import { recordStoryCompletion } from "../utils/learningRewards";
import { useChild } from "../context/ChildContext";
import {
  playSuccessChime,
  playTapSound,
  playHintSound,
  getFriendlyVoice,
  speakText,
} from "../utils/childAudio";
import {
  analyzeStoryReadingErrors,
  isConfidentDyslexiaMatch,
  normalizeWord,
} from "../utils/storyErrorAnalyzer";
import { submitStoryReadingCompletion } from "../utils/gemmaAdaptive";
import LessonPlayerModal from "../components/LessonPlayerModal";

// Simple English syllable splitter for visual reading aid
function splitSyllables(word) {
  const clean = word.replace(/[.,!?;:"'()]/g, "");
  if (clean.length <= 4) return word;

  const withSyllables = clean
    .replace(/(ing|tion|sion|ed|er|est|ly|ful|ness|ment|able|ible)$/i, "·$1")
    .replace(/^(un|re|in|dis|pre|mis)/i, "$1·")
    .replace(/([bcdfghjklmnpqrstvwxyz])([bcdfghjklmnpqrstvwxyz])/gi, "$1·$2");

  return word.replace(clean, withSyllables);
}

export default function StoryReader() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { userId, childName = "Reader" } = useChild();

  // ==========================================
  // STORY
  // ==========================================
  const [content, setContent] = useState(null);
  const [storyLoading, setStoryLoading] = useState(true);
  const [storyError, setStoryError] = useState("");

  // ==========================================
  // READ ALOUD
  // ==========================================
  const [isReading, setIsReading] = useState(false);
  const [activeWord, setActiveWord] = useState(null);

  // ==========================================
  // DYSLEXIA ASSISTANCE CONTROLS
  // ==========================================
  const [dyslexiaFont, setDyslexiaFont] = useState(true);
  const [showSyllables, setShowSyllables] = useState(false);
  const [showReadingRuler, setShowReadingRuler] = useState(true);

  // ==========================================
  // LUMILEX LIVE READING
  // ==========================================
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(
    typeof MediaRecorder !== "undefined"
  );
  const [speechError, setSpeechError] = useState("");
  const [pauseMessage, setPauseMessage] = useState("");

  // Live catching speech & Whisper status
  const [heardTranscript, setHeardTranscript] = useState("");
  const [lastCaughtWord, setLastCaughtWord] = useState("");
  const [justCaughtIndex, setJustCaughtIndex] = useState(null);
  const [isWhisperProcessing, setIsWhisperProcessing] = useState(false);

  // Words that LumiLex has recognized
  const [readWordIndexes, setReadWordIndexes] = useState([]);
  const [wordStatuses, setWordStatuses] = useState({});

  // Current word LumiLex expects
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  const [hasStartedReading, setHasStartedReading] = useState(false);

  // ==========================================
  // PROGRESS & COMPLETION
  // ==========================================
  const [readingProgress, setReadingProgress] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);
  const [starsEarned, setStarsEarned] = useState(0);

  // ==========================================
  // GEMMA CLOUD AI PRACTICE & ERROR ANALYSIS
  // ==========================================
  const [readingAnalysis, setReadingAnalysis] = useState(null);
  const [gemmaPracticeSession, setGemmaPracticeSession] = useState(null);
  const [isGemmaAnalyzing, setIsGemmaAnalyzing] = useState(false);
  const [activePracticeModal, setActivePracticeModal] = useState(null);
  const [isSubmittingCompletion, setIsSubmittingCompletion] = useState(false);
  const accumulatedTranscriptRef = useRef("");
  const isSubmittingRef = useRef(false);

  // ==========================================
  // STORY COMPREHENSION QUIZ
  // ==========================================
  const [isComprehensionLoading, setIsComprehensionLoading] = useState(false);
  const [comprehensionError, setComprehensionError] = useState("");
  const [cachedComprehension, setCachedComprehension] = useState(null);

  // ==========================================
  // REFS
  // ==========================================
  const speechRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const speechRecognitionRef = useRef(null);
  const speechRecognitionActiveRef = useRef(false);
  const listeningRef = useRef(false);
  const completionRef = useRef(false);
  const expectedWordIndexRef = useRef(0);
  const readWordIndexesRef = useRef(new Set());
  const wordDetailsRef = useRef({});
  const justCaughtTimerRef = useRef(null);
  const pauseTimerRef = useRef(null);
  const recordingTimerRef = useRef(null);

  // ==========================================
  // LOAD STORY
  // ==========================================
  useEffect(() => {
    const fetchStory = async () => {
      try {
        setStoryLoading(true);
        setStoryError("");

        const response = await fetch(`http://localhost:5000/api/stories/${id}`, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch story");
        }

        const selectedStory = await response.json();

        setContent({
          id: selectedStory.id,
          title: selectedStory.title,
          topic: selectedStory.topic || "General",
          difficulty: selectedStory.difficulty || "Beginner",
          paragraphs: selectedStory.content
            .split(/\n\s*\n/)
            .map((paragraph) => paragraph.trim())
            .filter(Boolean),
        });
      } catch (error) {
        console.error("Error loading story:", error);
        setStoryError("Unable to load this story.");
        setContent(null);
      } finally {
        setStoryLoading(false);
      }
    };

    fetchStory();
  }, [id]);

  // ==========================================
  // GET ALL STORY WORDS
  // ==========================================
  const getStoryWords = () => {
    if (!content) return [];
    const words = [];
    content.paragraphs.forEach((paragraph, paragraphIndex) => {
      const paragraphWords = paragraph.split(/\s+/);
      paragraphWords.forEach((word, wordIndex) => {
        words.push({
          word,
          paragraphIndex,
          wordIndex,
          uniqueIndex: `${paragraphIndex}-${wordIndex}`,
        });
      });
    });
    return words;
  };

  // ==========================================
  // PAUSE TIMER
  // ==========================================
  const clearPauseTimer = () => {
    if (pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = null;
    }
  };

  const startPauseTimer = () => {
    clearPauseTimer();
    setPauseMessage("");

    pauseTimerRef.current = setTimeout(() => {
      if (listeningRef.current) {
        setPauseMessage(
          "Take your time! No worries — continue reading whenever you are ready. 💚"
        );
      }
    }, 4500);
  };

  // ==========================================
  // PROCESS SPOKEN TEXT (RELIABLE WORD-BY-WORD MATCHER)
  // ==========================================
  const processSpokenText = (spokenText) => {
    if (!content || !spokenText) return;

    const trimmedSpeech = spokenText.trim();
    if (!trimmedSpeech) return;

    // Display live transcript caught by Whisper / WebSpeech
    setHeardTranscript(trimmedSpeech);

    const storyWords = getStoryWords();
    if (storyWords.length === 0) return;

    const spokenTokens = trimmedSpeech
      .split(/\s+/)
      .map(normalizeWord)
      .filter(Boolean);

    let expectedIndex = expectedWordIndexRef.current;
    let newlyCaught = false;
    let latestWord = "";
    let latestIndex = null;

    for (const spokenWord of spokenTokens) {
      if (expectedIndex >= storyWords.length) break;

      // Ignore common filler sounds
      if (["um", "uh", "erm", "hmm", "hm", "like", "ah", "er"].includes(spokenWord)) {
        continue;
      }

      const currentExpected = storyWords[expectedIndex];
      const expectedNorm = normalizeWord(currentExpected.word);

      // 1. CONFIDENT DIRECT MATCH with current expected word
      if (isConfidentDyslexiaMatch(spokenWord, expectedNorm)) {
        newlyCaught = true;
        latestWord = currentExpected.word;
        latestIndex = currentExpected.uniqueIndex;

        readWordIndexesRef.current.add(currentExpected.uniqueIndex);
        wordDetailsRef.current[currentExpected.uniqueIndex] = {
          status: "correct",
          spoken: spokenWord,
          attempts: (wordDetailsRef.current[currentExpected.uniqueIndex]?.attempts || 0) + 1,
        };

        expectedIndex++;
        continue;
      }

      // 2. SMALL STRICT LOOKAHEAD (1 or 2 words ahead max)
      // If child skipped 1 or 2 words and read the next word, mark skipped words as "skipped"
      // NEVER mark skipped words green!
      let lookaheadMatchedIndex = -1;
      const LOOK_AHEAD_MAX = 2;
      const searchEnd = Math.min(expectedIndex + 1 + LOOK_AHEAD_MAX, storyWords.length);

      for (let i = expectedIndex + 1; i < searchEnd; i++) {
        const lookaheadNorm = normalizeWord(storyWords[i].word);
        if (isConfidentDyslexiaMatch(spokenWord, lookaheadNorm)) {
          lookaheadMatchedIndex = i;
          break;
        }
      }

      if (lookaheadMatchedIndex !== -1) {
        newlyCaught = true;
        latestWord = storyWords[lookaheadMatchedIndex].word;
        latestIndex = storyWords[lookaheadMatchedIndex].uniqueIndex;

        // Mark intermediate words as SKIPPED — NOT GREEN
        for (let skipIdx = expectedIndex; skipIdx < lookaheadMatchedIndex; skipIdx++) {
          const skippedUnique = storyWords[skipIdx].uniqueIndex;
          readWordIndexesRef.current.delete(skippedUnique);
          const prevStatus = wordDetailsRef.current[skippedUnique]?.status;
          if (prevStatus !== "correct" && prevStatus !== "misread") {
            wordDetailsRef.current[skippedUnique] = {
              status: "skipped",
              spoken: "",
              attempts: wordDetailsRef.current[skippedUnique]?.attempts || 0,
            };
          }
        }

        // Mark the matched word as CORRECT
        readWordIndexesRef.current.add(storyWords[lookaheadMatchedIndex].uniqueIndex);
        wordDetailsRef.current[storyWords[lookaheadMatchedIndex].uniqueIndex] = {
          status: "correct",
          spoken: spokenWord,
          attempts: (wordDetailsRef.current[storyWords[lookaheadMatchedIndex].uniqueIndex]?.attempts || 0) + 1,
        };

        expectedIndex = lookaheadMatchedIndex + 1;
        continue;
      }

      // 3. LOOKBACK FOR SELF-CORRECTION (up to 2 words back)
      // If child backs up and says a previously skipped or misread word, upgrade to correct!
      let lookbackMatchedIndex = -1;
      const searchStart = Math.max(0, expectedIndex - 2);
      for (let i = expectedIndex - 1; i >= searchStart; i--) {
        const prevUnique = storyWords[i].uniqueIndex;
        const prevStatus = wordDetailsRef.current[prevUnique]?.status;
        if (prevStatus === "skipped" || prevStatus === "misread") {
          if (isConfidentDyslexiaMatch(spokenWord, normalizeWord(storyWords[i].word))) {
            lookbackMatchedIndex = i;
            break;
          }
        }
      }

      if (lookbackMatchedIndex !== -1) {
        newlyCaught = true;
        latestWord = storyWords[lookbackMatchedIndex].word;
        latestIndex = storyWords[lookbackMatchedIndex].uniqueIndex;

        readWordIndexesRef.current.add(latestIndex);
        wordDetailsRef.current[latestIndex] = {
          status: "correct",
          spoken: spokenWord,
          attempts: (wordDetailsRef.current[latestIndex]?.attempts || 0) + 1,
        };
        continue;
      }

      // 4. NO MATCH: Potential misread attempt on the current word
      const currUnique = currentExpected.uniqueIndex;
      const prevAttempts = wordDetailsRef.current[currUnique]?.attempts || 0;
      if (wordDetailsRef.current[currUnique]?.status !== "correct") {
        readWordIndexesRef.current.delete(currUnique);
        wordDetailsRef.current[currUnique] = {
          status: "misread",
          spoken: spokenWord,
          attempts: prevAttempts + 1,
        };
        newlyCaught = true;
      }
    }

    expectedWordIndexRef.current = expectedIndex;
    setCurrentWordIndex(expectedIndex);

    // Sync state maps
    const newStatuses = {};
    const correctList = [];
    Object.keys(wordDetailsRef.current).forEach((key) => {
      const st = wordDetailsRef.current[key]?.status;
      newStatuses[key] = st;
      if (st === "correct") correctList.push(key);
    });

    setWordStatuses(newStatuses);
    setReadWordIndexes(correctList);

    const progress = Math.min(
      100,
      Math.round((correctList.length / storyWords.length) * 100)
    );
    setReadingProgress(progress);

    if (newlyCaught) {
      if (latestWord) {
        setLastCaughtWord(latestWord);
      }
      if (latestIndex) {
        setJustCaughtIndex(latestIndex);
        if (justCaughtTimerRef.current) clearTimeout(justCaughtTimerRef.current);
        justCaughtTimerRef.current = setTimeout(() => {
          setJustCaughtIndex(null);
        }, 1200);
      }
    }

    // Only complete if ALL words have been reached and attempted
    if (expectedIndex >= storyWords.length) {
      completeStory();
    }
  };

  // ==========================================
  // SEND AUDIO TO ACCURATE WHISPER SERVICE
  // ==========================================
  const sendAudioToWhisper = async (audioBlob) => {
    // If WebSpeech is actively streaming, Whisper does not duplicate recognition
    if (speechRecognitionActiveRef.current) {
      return;
    }

    try {
      setIsWhisperProcessing(true);
      const formData = new FormData();
      formData.append("audio", audioBlob, "reading.webm");

      // Prime Whisper with upcoming story vocabulary for maximum accuracy
      const storyWords = getStoryWords();
      const currentIdx = expectedWordIndexRef.current || 0;
      const promptContext = storyWords
        .slice(currentIdx, currentIdx + 25)
        .map((w) => w.word)
        .join(" ");

      if (promptContext) {
        formData.append("prompt", promptContext);
      }

      const response = await fetch(
        "http://localhost:5000/api/speech/transcribe",
        {
          method: "POST",
          body: formData,
          credentials: "include",
        }
      );

      const data = await response.json();
      setIsWhisperProcessing(false);

      if (!response.ok) {
        throw new Error(data.error || "Whisper transcription failed");
      }

      if (data.text && data.text.trim()) {
        setPauseMessage("");
        startPauseTimer();
        accumulatedTranscriptRef.current = (
          accumulatedTranscriptRef.current + " " + data.text.trim()
        ).trim();
        processSpokenText(data.text);
      }
    } catch (error) {
      setIsWhisperProcessing(false);
      console.error("Whisper request failed:", error);
    }
  };

  // ==========================================
  // START MICROPHONE LISTENING (HYBRID ACCURACY)
  // ==========================================
  const startListening = async () => {
    if (!speechSupported) {
      setSpeechError(
        "Microphone recording is not supported in this browser. Please try Google Chrome."
      );
      return;
    }

    if (!content || isListening) return;

    try {
      window.speechSynthesis.cancel();
      setIsReading(false);
      setActiveWord(null);
      setSpeechError("");
      setPauseMessage("");
      accumulatedTranscriptRef.current = "";

      readWordIndexesRef.current = new Set();
      setReadWordIndexes([]);
      setWordStatuses({});
      wordDetailsRef.current = {};
      setCurrentWordIndex(0);
      setReadingProgress(0);
      setHeardTranscript("");
      setLastCaughtWord("");
      setJustCaughtIndex(null);
      setIsWhisperProcessing(false);
      expectedWordIndexRef.current = 0;
      completionRef.current = false;

      // 1. Browser Speech Recognition (Instant streaming feedback)
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = false;
          recognition.lang = "en-US";

          recognition.onresult = (event) => {
            speechRecognitionActiveRef.current = true;
            let transcriptChunk = "";
            for (let i = event.resultIndex; i < event.results.length; i++) {
              if (event.results[i].isFinal) {
                transcriptChunk += event.results[i][0].transcript + " ";
              }
            }
            if (transcriptChunk.trim()) {
              setPauseMessage("");
              startPauseTimer();
              accumulatedTranscriptRef.current = (
                accumulatedTranscriptRef.current + " " + transcriptChunk.trim()
              ).trim();
              processSpokenText(transcriptChunk);
            }
          };

          recognition.onerror = (err) => {
            console.log("Speech recognition notification:", err);
            speechRecognitionActiveRef.current = false;
          };

          recognition.start();
          speechRecognitionRef.current = recognition;
        } catch (e) {
          console.log("Browser recognition fallback active.");
          speechRecognitionActiveRef.current = false;
        }
      }

      // 2. MediaRecorder stream for accurate local Whisper service
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });

      mediaRecorderRef.current = recorder;
      listeningRef.current = true;
      setIsListening(true);
      startPauseTimer();

      let audioChunks = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        if (audioChunks.length === 0) return;

        const audioBlob = new Blob(audioChunks, {
          type: recorder.mimeType || "audio/webm",
        });
        audioChunks = [];

        // 1. IMMEDIATELY restart the recorder so 0 milliseconds of speech are lost!
        if (listeningRef.current && !completionRef.current) {
          try {
            recorder.start();
            recordingTimerRef.current = setTimeout(() => {
              if (recorder.state === "recording" && listeningRef.current) {
                recorder.stop();
              }
            }, 3000);
          } catch (error) {
            console.error("Could not restart recorder:", error);
          }
        }

        // 2. Transcribe in the background without blocking the microphone
        sendAudioToWhisper(audioBlob);
      };

      recorder.onerror = () => {
        setSpeechError("Microphone error occurred. Please try again.");
        stopAllListening();
      };

      recorder.start();
      recordingTimerRef.current = setTimeout(() => {
        if (recorder.state === "recording" && listeningRef.current) {
          recorder.stop();
        }
      }, 3000);
    } catch (error) {
      console.error("Microphone error:", error);
      stopAllListening();
      if (error.name === "NotAllowedError") {
        setSpeechError(
          "Microphone access was blocked. Please allow microphone access in your browser."
        );
      } else {
        setSpeechError("Could not start listening. Please try again.");
      }
    }
  };

  const stopAllListening = () => {
    listeningRef.current = false;
    speechRecognitionActiveRef.current = false;
    setIsListening(false);
    setIsWhisperProcessing(false);
    clearPauseTimer();

    if (justCaughtTimerRef.current) {
      clearTimeout(justCaughtTimerRef.current);
      justCaughtTimerRef.current = null;
    }

    if (recordingTimerRef.current) {
      clearTimeout(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (mediaRecorderRef.current) {
      try {
        if (mediaRecorderRef.current.state === "recording") {
          mediaRecorderRef.current.stop();
        }
      } catch (e) {}
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      }
      mediaRecorderRef.current = null;
    }

    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (e) {}
      speechRecognitionRef.current = null;
    }
  };

  // ==========================================
  // TAP TO HEAR INDIVIDUAL WORD (DYSLEXIA PRONUNCIATION)
  // ==========================================
  const speakWord = (word, index) => {
    if (isListening) return;

    window.speechSynthesis.cancel();
    playTapSound();

    const cleanWord = word.replace(/[.,!?;:"'()]/g, "");
    if (!cleanWord.trim()) return;

    const utterance = new SpeechSynthesisUtterance(cleanWord);
    utterance.lang = "en-US";
    utterance.rate = 0.65; // Slower, clear pronunciation
    utterance.pitch = 1.08;
    utterance.volume = 1;

    const voice = getFriendlyVoice();
    if (voice) utterance.voice = voice;

    setActiveWord(index);
    utterance.onend = () => setActiveWord(null);
    utterance.onerror = () => setActiveWord(null);

    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // ==========================================
  // READ ENTIRE STORY ALOUD
  // ==========================================
  const readStoryAloud = () => {
    if (!content || isListening) return;

    window.speechSynthesis.cancel();
    setIsReading(true);
    setActiveWord(null);

    let paragraphIndex = 0;

    const speakParagraph = () => {
      if (paragraphIndex >= content.paragraphs.length) {
        setIsReading(false);
        setActiveWord(null);
        return;
      }

      const paragraph = content.paragraphs[paragraphIndex];
      const words = paragraph.split(/\s+/);

      const utterance = new SpeechSynthesisUtterance(paragraph);
      utterance.lang = "en-US";
      utterance.rate = 0.72;
      utterance.pitch = 1.08;

      const voice = getFriendlyVoice();
      if (voice) utterance.voice = voice;

      utterance.onboundary = (event) => {
        const position = event.charIndex;
        if (typeof position !== "number") return;

        let characterPosition = 0;
        for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
          const word = words[wordIndex];
          const start = characterPosition;
          const end = characterPosition + word.length;

          if (position >= start && position < end) {
            setActiveWord(`${paragraphIndex}-${wordIndex}`);
            break;
          }
          characterPosition = end + 1;
        }
      };

      utterance.onend = () => {
        paragraphIndex++;
        setTimeout(() => {
          if (!isListening) speakParagraph();
        }, 500);
      };

      utterance.onerror = () => {
        setIsReading(false);
        setActiveWord(null);
      };

      speechRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    };

    speakParagraph();
  };

  const stopReadingAloud = () => {
    window.speechSynthesis.cancel();
    setIsReading(false);
    setActiveWord(null);
  };

  // ==========================================
  // COMPLETE STORY & GEMMA ERROR ANALYSIS
  // ==========================================
  const handleContinueReading = async () => {
    if (isSubmittingRef.current || completionRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmittingCompletion(true);

    // Safely stop microphone and speech synthesis
    stopAllListening();
    window.speechSynthesis.cancel();
    setIsReading(false);
    setActiveWord(null);
    setPauseMessage("");

    // Small delay to let final audio chunk buffer settle safely
    await new Promise((resolve) => setTimeout(resolve, 250));

    await completeStory(true);
  };

  const completeStory = async (forceFinish = false) => {
    if (completionRef.current) return;

    const storyWords = getStoryWords();
    if (!forceFinish && expectedWordIndexRef.current < storyWords.length) return;

    completionRef.current = true;
    stopAllListening();
    window.speechSynthesis.cancel();
    setIsReading(false);
    setActiveWord(null);
    setPauseMessage("");

    // 1. Analyze reading results (sequential alignment + live status map)
    const analysis = analyzeStoryReadingErrors({
      storyWords,
      spokenTranscript: accumulatedTranscriptRef.current,
      wordStatusMap: wordDetailsRef.current,
      readWordIndexes: Array.from(readWordIndexesRef.current),
    });
    setReadingAnalysis(analysis);

    const starsAwarded =
      typeof analysis.starsAwarded === "number" ? analysis.starsAwarded : 0;
    setStarsEarned(starsAwarded);

    // Record rewards using existing reward system
    recordStoryCompletion(userId, starsAwarded);
    if (starsAwarded > 0) {
      playSuccessChime();
    }

    setShowCompletion(true);
    setIsSubmittingCompletion(false);

    // 2. Request Gemma Cloud only if tricky words exist. Flawless reading needs no extra practice!
    if (analysis.trickyWords && analysis.trickyWords.length > 0) {
      setIsGemmaAnalyzing(true);
      try {
        const gemmaRes = await submitStoryReadingCompletion({
          storyId: id,
          storyTitle: content?.title || "Story Adventure",
          storyTopic: content?.topic || "General",
          readingLevel: content?.difficulty || "Beginner",
          accuracy: analysis.accuracy,
          wordsRead: analysis.wordsReadCount,
          totalWords: analysis.totalWords,
          speechTranscript: accumulatedTranscriptRef.current,
          expectedText: content?.paragraphs?.join(" ") || "",
          errors: analysis.errors,
          trickyWords: analysis.trickyWords,
          correctWords: analysis.correctWords,
          incorrectWords: analysis.incorrectWords,
          skippedWords: analysis.skippedWords,
          unreadWords: analysis.unreadWords,
          isReliable: analysis.isReliable,
          userId,
        });

        if (gemmaRes && gemmaRes.gemmaPractice) {
          setGemmaPracticeSession(gemmaRes.gemmaPractice);
        }
      } catch (err) {
        console.warn("Gemma story practice fetch error:", err);
      } finally {
        setIsGemmaAnalyzing(false);
      }
    } else {
      setGemmaPracticeSession(null);
      setIsGemmaAnalyzing(false);
    }
  };

  // ==========================================
  // LAUNCH COMPREHENSION QUIZ
  // ==========================================
  const handleStartComprehensionQuiz = async () => {
    playTapSound();
    setComprehensionError("");

    if (cachedComprehension && cachedComprehension.length > 0) {
      setActivePracticeModal({
        lesson: {
          id: `story-comp-${id}`,
          title: `Quiz: ${content?.title || "Story Adventure"}`,
          subtitle: "Story Comprehension",
          icon: "🧩",
          xp: 25,
          gemsReward: 10,
        },
        unit: {
          id: 6,
          unitNumber: 1,
          title: content?.title || "Story Adventure",
          icon: "📖",
        },
        questions: cachedComprehension,
      });
      return;
    }

    setIsComprehensionLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/stories/${id}/comprehension`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Could not load comprehension questions.");
      }

      const data = await response.json();
      if (!data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error("No comprehension questions available for this story.");
      }

      setCachedComprehension(data.questions);

      setActivePracticeModal({
        lesson: {
          id: `story-comp-${id}`,
          title: `Quiz: ${content?.title || "Story Adventure"}`,
          subtitle: "Story Comprehension",
          icon: "🧩",
          xp: 25,
          gemsReward: 10,
        },
        unit: {
          id: 6,
          unitNumber: 1,
          title: content?.title || "Story Adventure",
          icon: "📖",
        },
        questions: data.questions,
      });
    } catch (err) {
      console.warn("Comprehension quiz fetch error:", err);
      setComprehensionError("Unable to load comprehension questions right now. Please try again!");
    } finally {
      setIsComprehensionLoading(false);
    }
  };

  const startReading = () => {
    isSubmittingRef.current = false;
    setIsSubmittingCompletion(false);
    setHasStartedReading(true);
    setReadingProgress(0);
    setReadWordIndexes([]);
    setWordStatuses({});
    wordDetailsRef.current = {};
    setCurrentWordIndex(0);
    expectedWordIndexRef.current = 0;
    completionRef.current = false;
    setShowCompletion(false);
    setReadingAnalysis(null);
    setGemmaPracticeSession(null);
    setComprehensionError("");
    accumulatedTranscriptRef.current = "";

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const backToStories = () => {
    stopAllListening();
    window.speechSynthesis.cancel();
    navigate("/stories");
  };

  useEffect(() => {
    return () => {
      stopAllListening();
      window.speechSynthesis.cancel();
    };
  }, []);

  if (storyLoading) {
    return (
      <div className="story-error">
        <div className="story-error-card">
          <h2>Opening your story...</h2>
          <p>Getting your adventure ready 🌱</p>
        </div>
      </div>
    );
  }

  if (storyError || !content) {
    return (
      <div className="story-error">
        <div className="story-error-card">
          <h2>Story not found</h2>
          <p>{storyError || "We couldn't find this story."}</p>
          <button onClick={backToStories} className="back-button">
            Back to Stories
          </button>
        </div>
      </div>
    );
  }

  // Completion screen with Gemma AI Practice Session
  if (showCompletion) {
    return (
      <div className="completion-screen">
        <div className="completion-card gemma-story-completion-card">
          <div className="completion-icon">
            {starsEarned >= 2 ? "🎉" : starsEarned === 1 ? "🌟" : "🌱"}
          </div>
          <h1>
            {starsEarned === 3
              ? `Superstar Reading, ${childName}!`
              : starsEarned >= 1
              ? `Great Effort, ${childName}!`
              : `Nice Try, ${childName}!`}
          </h1>
          <h2>
            {starsEarned >= 2
              ? "You explored the story brilliantly!"
              : "Every word you read helps you grow stronger!"}
          </h2>
          <p className="completion-story-title">{content.title}</p>

          {/* Dynamic Stars Based on Accuracy */}
          <div className="completion-stars" aria-label={`${starsEarned} out of 3 stars`}>
            {starsEarned === 3 && <>⭐ ⭐ ⭐</>}
            {starsEarned === 2 && <>⭐ ⭐ <span className="star-faded">☆</span></>}
            {starsEarned === 1 && <>⭐ <span className="star-faded">☆ ☆</span></>}
            {starsEarned === 0 && <><span className="star-faded">☆ ☆ ☆</span></>}
          </div>

          <div className="stars-reward">
            {starsEarned > 0 ? (
              `+${starsEarned} Reading Star${starsEarned > 1 ? "s" : ""} • +15 Garden Points 🌿`
            ) : (
              "Keep practicing! Every word makes you a better reader 🌱"
            )}
          </div>

          {/* Reading Metrics Grid */}
          {readingAnalysis && (
            <div className="story-metrics-grid">
              <div className="story-metric-stat">
                <span className="metric-num">
                  {readingAnalysis.isReliable && readingAnalysis.accuracy !== null
                    ? `${readingAnalysis.accuracy}%`
                    : "Voice Check"}
                </span>
                <span className="metric-label">
                  {readingAnalysis.isReliable ? "Accuracy" : "Status"}
                </span>
              </div>
              <div className="story-metric-stat">
                <span className="metric-num">
                  {readingAnalysis.wordsReadCount} / {readingAnalysis.assessedWordsCount || readingAnalysis.totalWords}
                </span>
                <span className="metric-label">Words Caught</span>
              </div>
              <div className="story-metric-stat">
                <span className="metric-num">{readingAnalysis.trickyWords?.length || 0}</span>
                <span className="metric-label">Tricky Words</span>
              </div>
            </div>
          )}

          {/* Microphone Reliability Note if Speech was Incomplete or Empty */}
          {readingAnalysis && !readingAnalysis.isReliable && (
            <div className="unreliable-voice-box">
              <div className="unreliable-voice-header">
                <Volume2 size={20} color="#059669" />
                <strong>Microphone Note</strong>
              </div>
              <p>
                We couldn't catch enough clear speech this time. That is completely okay!
                Microphones can be tricky. You can practice words below or tap <strong>Read Story Again</strong> with your microphone! 🎙️
              </p>
            </div>
          )}

          {/* Unassessed Words Note if Child Pressed Continue Early */}
          {readingAnalysis && readingAnalysis.unassessedWords?.length > 0 && (
            <p className="unassessed-words-note">
              🌱 <em>Note: {readingAnalysis.unassessedWords.length} words later in the story were left unread and were not counted against your score.</em>
            </p>
          )}

          {/* Words Read Correctly Pills */}
          {readingAnalysis && readingAnalysis.correctWords?.length > 0 && (
            <div className="story-correct-box">
              <div className="story-correct-title">
                <span>✨ Words Read Correctly ({readingAnalysis.correctWords.length}):</span>
              </div>
              <div className="story-correct-chips">
                {readingAnalysis.correctWords.slice(0, 16).map((word, idx) => (
                  <span key={idx} className="correct-word-pill">
                    ✓ {word}
                  </span>
                ))}
                {readingAnalysis.correctWords.length > 16 && (
                  <span className="more-words-badge">
                    +{readingAnalysis.correctWords.length - 16} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Tricky Words Caught Pills or Flawless Celebration Card */}
          {readingAnalysis && readingAnalysis.trickyWords?.length > 0 ? (
            <div className="story-tricky-box">
              <div className="story-tricky-title">
                <span>🔍 Words Caught for Gentle Practice:</span>
              </div>
              <div className="story-tricky-chips">
                {readingAnalysis.trickyWords.map((word, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="tricky-word-pill"
                    onClick={() => speakWord(word, null)}
                    title="Tap to hear pronunciation"
                  >
                    <Volume2 size={13} />
                    <span>{word}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="celebration-perfect-card">
              <div className="celebration-icon">🌟</div>
              <h3>Fantastic Reading!</h3>
              <p>
                You read every assessed word like a reading champion! No extra practice needed today!
              </p>
            </div>
          )}

          {/* Substituted Words Detail (Whisper Comparison) */}
          {readingAnalysis && readingAnalysis.substitutions?.length > 0 && (
            <div className="story-substitutions-note">
              <small>
                🗣️ Caught word sound variations:{" "}
                {readingAnalysis.substitutions.slice(0, 3).map((sub, i) => (
                  <span key={i} className="sub-item">
                    "{sub.expected}" (Whisper heard: "{sub.spoken}")
                    {i < Math.min(readingAnalysis.substitutions.length, 3) - 1 ? ", " : ""}
                  </span>
                ))}
              </small>
            </div>
          )}

          {/* Gemma AI Story Reading Coach Card - Only if tricky words exist or while analyzing */}
          {readingAnalysis && (readingAnalysis.trickyWords?.length > 0 || isGemmaAnalyzing) && (
            <div className="gemma-story-coach-container">
              <div className="gemma-coach-card-header">
                <div className="gemma-badge-icon">
                  <Brain size={18} color="#7c3aed" />
                </div>
                <div>
                  <strong>Gemma AI Reading Coach</strong>
                  <p>Personalized from your reading of this story</p>
                </div>
              </div>

              {isGemmaAnalyzing ? (
                <div className="gemma-loading-state">
                  <div className="gemma-pulse-ring"></div>
                  <p>
                    Gemma Cloud is analyzing your reading stumbles and crafting your custom practice session... 🧠✨
                  </p>
                </div>
              ) : gemmaPracticeSession ? (
                <div className="gemma-coach-content">
                  <p className="gemma-feedback-bubble">
                    {gemmaPracticeSession.coachFeedback ||
                      "Awesome job reading out loud! Practice these tricky words to make your reading fluency shine."}
                  </p>
                  {gemmaPracticeSession.errorAnalysis && (
                    <p className="gemma-phonics-note">
                      💡 <strong>Coach Tip:</strong> {gemmaPracticeSession.errorAnalysis}
                    </p>
                  )}

                  <button
                    type="button"
                    className="gemma-launch-practice-btn"
                    onClick={() => {
                      playTapSound();
                      setActivePracticeModal({
                        lesson: {
                          id: `story-practice-${id}`,
                          title: `Story Practice: ${content.title}`,
                          subtitle: "Crafted by Gemma AI",
                          icon: "📖",
                          xp: 20,
                          gemsReward: 8,
                        },
                        unit: {
                          id: 1,
                          unitNumber: 1,
                          title: content.title,
                          icon: "📖",
                        },
                        questions: gemmaPracticeSession.practiceQuestions || [],
                      });
                    }}
                  >
                    <Sparkles size={18} />
                    <span>Start Gemma Practice Session (5 Questions) 🎯</span>
                  </button>
                </div>
              ) : null}
            </div>
          )}

          {/* Story Comprehension Quiz Card */}
          <div className="story-comprehension-container">
            <div className="comprehension-card-header">
              <div className="comprehension-badge-icon">
                <HelpCircle size={18} color="#059669" />
              </div>
              <div>
                <strong>Story Comprehension Quiz</strong>
                <p>Gentle 3–4 questions about what happened in this story 🌱</p>
              </div>
            </div>

            <div className="comprehension-card-body">
              <p className="comprehension-feedback-bubble">
                Check your understanding of <strong>"{content.title}"</strong>! Tap each choice to hear it out loud with friendly speech.
              </p>

              {comprehensionError && (
                <p className="comprehension-error-note">⚠️ {comprehensionError}</p>
              )}

              <button
                type="button"
                className="comprehension-launch-btn"
                onClick={handleStartComprehensionQuiz}
                disabled={isComprehensionLoading}
              >
                <Sparkles size={18} />
                <span>
                  {isComprehensionLoading
                    ? "Preparing questions... ⏳"
                    : "Start Comprehension Quiz (3-4 Questions) 🧩"}
                </span>
              </button>
            </div>
          </div>

          <div className="completion-buttons">
            <button
              className="continue-reading-button"
              onClick={() => {
                setShowCompletion(false);
                startReading();
              }}
            >
              Read Story Again
            </button>
            <button className="completion-back-button" onClick={backToStories}>
              Back to Story Library
            </button>
          </div>
        </div>

        {/* Interactive Practice Modal with Gemma's generated questions */}
        {activePracticeModal && (
          <LessonPlayerModal
            lessonSession={activePracticeModal}
            onClose={() => setActivePracticeModal(null)}
            onCompleted={(stats) => {
              setActivePracticeModal(null);
              playSuccessChime();
            }}
            userId={userId}
            childName={childName}
          />
        )}
      </div>
    );
  }

  // Welcome / start reading screen
  if (!hasStartedReading) {
    return (
      <div className="start-reading-screen">
        <div className="start-reading-card">
          <div className="start-reading-icon">📖</div>
          <h1>Ready for an adventure?</h1>
          <h2>{content.title}</h2>
          <p>
            Read at your own pace. Tap any word if you want LumiLex to read it aloud.
          </p>
          <button className="start-reading-button" onClick={startReading}>
            Start Reading 🌟
          </button>
          <button className="back-button secondary" onClick={backToStories}>
            Back to Stories
          </button>
        </div>
      </div>
    );
  }

  // Active Story Reader
  return (
    <div
      className={`story-reader ${dyslexiaFont ? "dyslexia-font" : "standard-font"}`}
    >
      {/* HEADER */}
      <header className="story-header">
        <button className="back-button" onClick={backToStories}>
          ← Stories
        </button>

        {/* DYSLEXIA COMPANION TOOLBAR */}
        <div className="dyslexia-toolbar" aria-label="Reading accessibility tools">
          <button
            type="button"
            className={`tool-pill ${dyslexiaFont ? "active" : ""}`}
            onClick={() => setDyslexiaFont(!dyslexiaFont)}
            title="Toggle OpenDyslexic font for easier reading"
          >
            <Type size={15} />
            <span>Dyslexia Font</span>
          </button>

          <button
            type="button"
            className={`tool-pill ${showSyllables ? "active" : ""}`}
            onClick={() => setShowSyllables(!showSyllables)}
            title="Split words into syllables to read easily"
          >
            <Split size={15} />
            <span>Syllables</span>
          </button>

          <button
            type="button"
            className={`tool-pill ${showReadingRuler ? "active" : ""}`}
            onClick={() => setShowReadingRuler(!showReadingRuler)}
            title="Highlight active reading line"
          >
            <Eye size={15} />
            <span>Line Ruler</span>
          </button>
        </div>
      </header>

      {/* STORY MAIN */}
      <main className="story-container">
        <div className="story-title-section">
          <h1>{content.title}</h1>
          <p>Gentle reading companion for dyslexia 🌱</p>
        </div>

        {/* READING PROGRESS */}
        <div className="reading-progress">
          <div className="progress-header">
            <span>Reading Progress</span>
            <strong>{readingProgress}%</strong>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${readingProgress}%` }}
            />
          </div>
        </div>

        {/* CONTROLS */}
        <div className="reading-controls">
          {!isReading ? (
            <button
              className="read-aloud-button"
              onClick={readStoryAloud}
              disabled={isListening}
            >
              🔊 Listen with LumiLex
            </button>
          ) : (
            <button
              className="read-aloud-button stop"
              onClick={stopReadingAloud}
              disabled={isListening}
            >
              ⏹ Stop Listening
            </button>
          )}

          {!isListening ? (
            <button
              className="voice-reading-button"
              onClick={startListening}
              disabled={!speechSupported}
            >
              🎤 Read to LumiLex
            </button>
          ) : (
            <button
              className="voice-reading-button stop"
              onClick={stopAllListening}
            >
              ⏹ Stop Mic
            </button>
          )}

          <button
            type="button"
            className="comprehension-quick-btn"
            onClick={handleStartComprehensionQuiz}
            disabled={isComprehensionLoading}
            title="Check your story comprehension"
          >
            <HelpCircle size={16} />
            <span>Story Quiz 🧩</span>
          </button>

          <button
            type="button"
            className="finish-reading-btn"
            onClick={handleContinueReading}
            disabled={isSubmittingCompletion}
            title="Finish reading and analyze with Gemma AI"
          >
            <Sparkles size={16} />
            <span>{isSubmittingCompletion ? "Analyzing... ⏳" : "Continue 🌟"}</span>
          </button>
        </div>

        {/* VOICE STATUS & LIVE CATCHING TRACKER */}
        <div className="voice-reading-section">
          {isListening && (
            <div className="live-speech-tracker-card" role="status" aria-live="polite">
              <div className="tracker-header">
                <div className="tracker-badge">
                  <span className={`live-pulse-dot ${isWhisperProcessing ? "processing" : "listening"}`}></span>
                  <strong>
                    {isWhisperProcessing
                      ? "Listening with Whisper AI... 🧠"
                      : "LumiLex is listening to your reading... 🎙️"}
                  </strong>
                </div>

                {lastCaughtWord && (
                  <div className="last-caught-pill">
                    <span className="last-caught-label">Caught:</span>
                    <span className="last-caught-word">"{lastCaughtWord}"</span>
                    <Check size={14} className="caught-check" />
                  </div>
                )}
              </div>

              <div className="tracker-transcript-bubble">
                <span className="transcript-lead">Whisper Heard:</span>
                <span className="transcript-text">
                  {heardTranscript
                    ? `"${heardTranscript}"`
                    : "Speak out loud — Whisper and LumiLex will catch your words here 🌱"}
                </span>
              </div>
            </div>
          )}

          {speechError && (
            <div className="speech-error-card">
              <strong>Note:</strong>
              <p>{speechError}</p>
            </div>
          )}

          {pauseMessage && (
            <div className="pause-help-card">
              <span>💚</span>
              <p>{pauseMessage}</p>
            </div>
          )}
        </div>

        {/* STORY CARD */}
        <article className="story-card">
          {content.paragraphs.map((paragraph, paragraphIndex) => {
            const words = paragraph.split(/\s+/);
            const storyWords = getStoryWords();
            const currentExpected = storyWords[currentWordIndex];
            const isParagraphActive =
              currentExpected?.paragraphIndex === paragraphIndex;

            return (
              <p
                key={paragraphIndex}
                className={`story-paragraph ${
                  showReadingRuler && isParagraphActive ? "ruler-active" : ""
                }`}
              >
                {words.map((word, wordIndex) => {
                  const uniqueIndex = `${paragraphIndex}-${wordIndex}`;
                  const status = wordStatuses[uniqueIndex] || (readWordIndexes.includes(uniqueIndex) ? "correct" : "unconfirmed");
                  const isCorrect = status === "correct";
                  const isSkipped = status === "skipped";
                  const isMisread = status === "misread";
                  const isJustCaught = justCaughtIndex === uniqueIndex;
                  const isCurrent =
                    currentWordIndex ===
                    storyWords.findIndex(
                      (item) => item.uniqueIndex === uniqueIndex
                    );

                  let wordClass = "story-word";
                  if (isCorrect) wordClass += " correct read";
                  else if (isSkipped) wordClass += " skipped";
                  else if (isMisread) wordClass += " misread";

                  if (isJustCaught) wordClass += " just-caught";
                  if (isCurrent && isListening) wordClass += " current";
                  if (activeWord === uniqueIndex) wordClass += " active";

                  const displayWord = showSyllables
                    ? splitSyllables(word)
                    : word;

                  let titleText = "Tap to hear this word";
                  if (isCorrect) titleText = "Read correctly! 🌟 Tap to hear";
                  else if (isSkipped) titleText = "Skipped word. Tap to hear";
                  else if (isMisread) titleText = "Tricky word. Tap to hear";

                  return (
                    <span
                      key={uniqueIndex}
                      className={wordClass}
                      onClick={() => speakWord(word, uniqueIndex)}
                      title={titleText}
                    >
                      {displayWord}{" "}
                    </span>
                  );
                })}
              </p>
            );
          })}
        </article>

        {/* CHILD-FRIENDLY CONTINUE BUTTON BELOW STORY */}
        <div className="story-continue-section">
          <button
            type="button"
            className="story-continue-action-btn"
            onClick={handleContinueReading}
            disabled={isSubmittingCompletion}
            aria-label="Continue and see how you did"
          >
            {isSubmittingCompletion ? (
              <>
                <span className="continue-pulse-spinner" />
                <span>Let's see how you did! ✨</span>
              </>
            ) : (
              <>
                <span>Continue</span>
                <ArrowRight size={22} className="continue-arrow-icon" />
              </>
            )}
          </button>
          <p className="continue-hint-text">
            Read at your own pace! Click <strong>Continue</strong> whenever you are ready to see your stars. 🌟
          </p>
        </div>

        {/* FOOTER HELPER */}
        <div className="reading-companion-footer">
          {isListening ? (
            <>
              <div className="reading-legend-pill">
                <span className="legend-item"><span className="legend-dot green"></span> Read Correctly</span>
                <span className="legend-item"><span className="legend-line orange"></span> Skipped / Tricky</span>
              </div>
              <p>LumiLex is following along with your voice. No rush! 🌱</p>
            </>
          ) : (
            <>
              <span>💚</span>
              <p>Tap any word if you want LumiLex to say it for you.</p>
            </>
          )}
        </div>
      </main>

      <footer className="story-footer">
        <p>💚 Designed with patience and care for children with dyslexia.</p>
      </footer>
    </div>
  );
}