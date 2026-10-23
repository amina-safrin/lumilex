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
import { analyzeStoryReadingErrors } from "../utils/storyErrorAnalyzer";
import { submitStoryReadingCompletion } from "../utils/gemmaAdaptive";
import LessonPlayerModal from "../components/LessonPlayerModal";

// =========================================================
// DYSLEXIA-FRIENDLY PHONETIC & LEVENSHTEIN MATCHER
// Accommodates common dyslexia pronunciation stumbles,
// letter transpositions (b <-> d, p <-> q, m <-> w),
// and slight vowel shifts without frustrating the child.
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

function normalizeWord(word) {
  if (!word) return "";
  return word
    .toLowerCase()
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035']/g, "") // smart single quotes/apostrophes
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036"]/g, "") // smart double quotes
    .replace(/[\u2013\u2014\-–—]/g, "") // hyphens and dashes
    .replace(/[.,!?;:()[\]{}…*~_`#/\\]/g, "") // punctuation
    .trim();
}

function isDyslexiaMatch(spoken, expected) {
  if (!spoken || !expected) return false;
  const s = normalizeWord(spoken);
  const e = normalizeWord(expected);
  if (!s || !e) return false;
  if (s === e) return true;

  // 1. Common dyslexia letter transpositions check (b <-> d, p <-> q, m <-> w, n <-> u)
  const normSpoken = s
    .replace(/d/g, "b")
    .replace(/q/g, "p")
    .replace(/w/g, "m")
    .replace(/u/g, "n");
  const normExpected = e
    .replace(/d/g, "b")
    .replace(/q/g, "p")
    .replace(/w/g, "m")
    .replace(/u/g, "n");
  if (normSpoken === normExpected) return true;

  // 2. Inflection / Stemming match (running -> run, cats -> cat, jumped -> jump)
  const stripEndings = (w) => w.replace(/(ing|tion|sion|ed|er|est|ly|es|s)$/i, "");
  const stemS = stripEndings(s);
  const stemE = stripEndings(e);
  if (stemS && stemE && stemS === stemE) return true;

  // 3. Levenshtein edit distance for minor pronunciation stumbles or accents
  const dist = levenshteinDistance(s, e);
  if (e.length <= 3 && dist <= 1) return true;
  if (e.length > 3 && dist <= 2) return true;

  // 4. Substring / compound prefix match
  if (e.length >= 4 && (s.startsWith(e) || e.startsWith(s))) {
    return true;
  }

  return false;
}

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
  const accumulatedTranscriptRef = useRef("");

  // ==========================================
  // REFS
  // ==========================================
  const speechRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const speechRecognitionRef = useRef(null);
  const listeningRef = useRef(false);
  const completionRef = useRef(false);
  const expectedWordIndexRef = useRef(0);
  const readWordIndexesRef = useRef(new Set());
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
  // PROCESS SPOKEN TEXT (ACCURATE + DYSLEXIA MATCHER)
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

      // Generous lookahead (up to 16 words) to tolerate pauses or skipped small articles
      let matchedIndex = -1;
      const LOOK_AHEAD = 16;
      const searchEnd = Math.min(expectedIndex + LOOK_AHEAD, storyWords.length);

      for (let i = expectedIndex; i < searchEnd; i++) {
        const expectedWord = normalizeWord(storyWords[i].word);
        if (isDyslexiaMatch(spokenWord, expectedWord)) {
          matchedIndex = i;
          break;
        }
      }

      // Word found
      if (matchedIndex !== -1) {
        newlyCaught = true;
        latestWord = storyWords[matchedIndex].word;
        latestIndex = storyWords[matchedIndex].uniqueIndex;

        // Contiguous forward progression: mark all words up to matchedIndex as read
        for (let fillIdx = expectedIndex; fillIdx <= matchedIndex; fillIdx++) {
          readWordIndexesRef.current.add(storyWords[fillIdx].uniqueIndex);
        }

        expectedIndex = matchedIndex + 1;
        expectedWordIndexRef.current = expectedIndex;
        setCurrentWordIndex(expectedIndex);

        setReadingProgress(
          Math.round((expectedIndex / storyWords.length) * 100)
        );

        // Story finished!
        if (expectedIndex >= storyWords.length) {
          expectedWordIndexRef.current = expectedIndex;
          setReadWordIndexes(Array.from(readWordIndexesRef.current));
          setReadingProgress(100);
          completeStory();
          return;
        }
      }
    }

    if (newlyCaught) {
      setReadWordIndexes(Array.from(readWordIndexesRef.current));
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
  };

  // ==========================================
  // SEND AUDIO TO ACCURATE WHISPER SERVICE
  // ==========================================
  const sendAudioToWhisper = async (audioBlob) => {
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
          recognition.interimResults = true;
          recognition.lang = "en-US";

          recognition.onresult = (event) => {
            let transcriptChunk = "";
            for (let i = event.resultIndex; i < event.results.length; i++) {
              if (event.results[i].isFinal) {
                transcriptChunk += event.results[i][0].transcript + " ";
              }
            }
            if (transcriptChunk.trim()) {
              setPauseMessage("");
              startPauseTimer();
              processSpokenText(transcriptChunk);
            }
          };

          recognition.onerror = (err) => {
            console.log("Speech recognition notification:", err);
          };

          recognition.start();
          speechRecognitionRef.current = recognition;
        } catch (e) {
          console.log("Browser recognition fallback active.");
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
    setReadingProgress(100);

    // 1. Analyze reading errors (substitutions, mispronunciations, omissions)
    const analysis = analyzeStoryReadingErrors({
      storyWords,
      spokenTranscript: accumulatedTranscriptRef.current,
      readWordIndexes: Array.from(readWordIndexesRef.current),
    });
    setReadingAnalysis(analysis);

    recordStoryCompletion(userId);
    setStarsEarned(3);
    playSuccessChime();
    setShowCompletion(true);

    // 2. Request Gemma Cloud to generate personalized practice session targeting caught errors
    setIsGemmaAnalyzing(true);
    try {
      const gemmaRes = await submitStoryReadingCompletion({
        storyId: id,
        storyTitle: content?.title || "Story Adventure",
        storyTopic: content?.topic || "General",
        accuracy: analysis.accuracy,
        wordsRead: analysis.wordsReadCount,
        totalWords: analysis.totalWords,
        speechTranscript: accumulatedTranscriptRef.current,
        expectedText: content?.paragraphs?.join(" ") || "",
        errors: analysis.errors,
        trickyWords: analysis.trickyWords,
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
  };

  const startReading = () => {
    setHasStartedReading(true);
    setReadingProgress(0);
    setReadWordIndexes([]);
    setCurrentWordIndex(0);
    expectedWordIndexRef.current = 0;
    completionRef.current = false;
    setShowCompletion(false);
    setReadingAnalysis(null);
    setGemmaPracticeSession(null);
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
          <div className="completion-icon">🎉</div>
          <h1>Splendid Reading, {childName}!</h1>
          <h2>You explored the whole story!</h2>
          <p className="completion-story-title">{content.title}</p>

          <div className="completion-stars">⭐ ⭐ ⭐</div>
          <div className="stars-reward">+3 Stars • +15 Garden Points 🌿</div>

          {/* Reading Metrics Grid */}
          {readingAnalysis && (
            <div className="story-metrics-grid">
              <div className="story-metric-stat">
                <span className="metric-num">{readingAnalysis.accuracy}%</span>
                <span className="metric-label">Accuracy</span>
              </div>
              <div className="story-metric-stat">
                <span className="metric-num">
                  {readingAnalysis.wordsReadCount} / {readingAnalysis.totalWords}
                </span>
                <span className="metric-label">Words Caught</span>
              </div>
              <div className="story-metric-stat">
                <span className="metric-num">{readingAnalysis.trickyWords?.length || 0}</span>
                <span className="metric-label">Tricky Words</span>
              </div>
            </div>
          )}

          {/* Tricky Words Caught Pills */}
          {readingAnalysis && readingAnalysis.trickyWords?.length > 0 && (
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

          {/* Gemma AI Story Reading Coach Card */}
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
            className="finish-reading-btn"
            onClick={completeStory}
            title="Finish reading and analyze with Gemma AI"
          >
            <Sparkles size={16} />
            <span>Finish & Analyze 🌟</span>
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
                  const isRead = readWordIndexes.includes(uniqueIndex);
                  const isJustCaught = justCaughtIndex === uniqueIndex;
                  const isCurrent =
                    currentWordIndex ===
                    storyWords.findIndex(
                      (item) => item.uniqueIndex === uniqueIndex
                    );

                  let wordClass = "story-word";
                  if (isRead) wordClass += " read";
                  if (isJustCaught) wordClass += " just-caught";
                  if (isCurrent && isListening) wordClass += " current";
                  if (activeWord === uniqueIndex) wordClass += " active";

                  const displayWord = showSyllables
                    ? splitSyllables(word)
                    : word;

                  return (
                    <span
                      key={uniqueIndex}
                      className={wordClass}
                      onClick={() => speakWord(word, uniqueIndex)}
                      title="Tap to hear this word"
                    >
                      {displayWord}{" "}
                    </span>
                  );
                })}
              </p>
            );
          })}
        </article>

        {/* FOOTER HELPER */}
        <div className="reading-companion-footer">
          {isListening ? (
            <>
              <span>🌱</span>
              <p>LumiLex is following along with your voice. No rush!</p>
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