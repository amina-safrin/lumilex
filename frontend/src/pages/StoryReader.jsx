import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import "./StoryReader.css";

import { recordStoryCompletion } from "../utils/learningRewards";

export default function StoryReader() {
  const navigate = useNavigate();
  const { id } = useParams();

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
  // LUMILEX LIVE READING
  // ==========================================

  const [isListening, setIsListening] = useState(false);

  const [speechSupported, setSpeechSupported] = useState(
    typeof MediaRecorder !== "undefined"
  );

  const [speechError, setSpeechError] = useState("");
  const [pauseMessage, setPauseMessage] = useState("");

  // Words that LumiLex has recognized
  const [readWordIndexes, setReadWordIndexes] = useState([]);

  // Current word LumiLex expects
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  // Essential reading is always available; energy is reserved for optional games.
  const [hasStartedReading, setHasStartedReading] = useState(false);

  // ==========================================
  // PROGRESS
  // ==========================================

  const [readingProgress, setReadingProgress] = useState(0);

  // ==========================================
  // COMPLETION
  // ==========================================

  const [showCompletion, setShowCompletion] = useState(false);
  const [starsEarned, setStarsEarned] = useState(0);

  // ==========================================
  // REFS
  // ==========================================

  const speechRef = useRef(null);

  // MediaRecorder replaces browser SpeechRecognition
  const mediaRecorderRef = useRef(null);

  const listeningRef = useRef(false);

  const completionRef = useRef(false);

  const expectedWordIndexRef = useRef(0);

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

        const response = await fetch(
          `http://localhost:5000/api/stories/${id}`,
          {
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch story");
        }

        const selectedStory = await response.json();

        setContent({
          title: selectedStory.title,

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
  // FRIENDLY VOICE
  // ==========================================

  const getFriendlyVoice = () => {
    const voices = window.speechSynthesis.getVoices();

    if (!voices || voices.length === 0) {
      return null;
    }

    const preferredNames = [
      "Samantha",
      "Ava",
      "Karen",
      "Moira",
      "Google US English",
      "Google UK English Female",
      "Microsoft Aria Online",
      "Microsoft Jenny Online",
      "Microsoft Zira",
      "Microsoft Sonia",
    ];

    for (const preferredName of preferredNames) {
      const voice = voices.find(
        (v) =>
          v.name
            .toLowerCase()
            .includes(preferredName.toLowerCase()) &&
          v.lang.toLowerCase().startsWith("en")
      );

      if (voice) {
        return voice;
      }
    }

    const englishVoice = voices.find((voice) =>
      voice.lang.toLowerCase().startsWith("en")
    );

    return englishVoice || voices[0];
  };

  // ==========================================
  // LOAD SPEECH VOICES
  // ==========================================

  useEffect(() => {
    const loadVoices = () => {
      window.speechSynthesis.getVoices();
    };

    loadVoices();

    window.speechSynthesis.addEventListener(
      "voiceschanged",
      loadVoices
    );

    return () => {
      window.speechSynthesis.removeEventListener(
        "voiceschanged",
        loadVoices
      );
    };
  }, []);

  // ==========================================
  // GET ALL STORY WORDS
  // ==========================================

  const getStoryWords = () => {
    if (!content) {
      return [];
    }

    const words = [];

    content.paragraphs.forEach(
      (paragraph, paragraphIndex) => {
        const paragraphWords = paragraph.split(/\s+/);

        paragraphWords.forEach(
          (word, wordIndex) => {
            words.push({
              word,
              paragraphIndex,
              wordIndex,
              uniqueIndex: `${paragraphIndex}-${wordIndex}`,
            });
          }
        );
      }
    );

    return words;
  };

  // ==========================================
  // NORMALIZE WORD
  // ==========================================

  const normalizeWord = (word) => {
    return word
      .toLowerCase()
      .replace(/[.,!?;:"'()[\]{}]/g, "")
      .trim();
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
          "Take your time! No worries — continue when you're ready. 💚"
        );
      }
    }, 4500);
  };

  // ==========================================
  // PROCESS WHISPER TRANSCRIPTION
  // ==========================================

  const processSpokenText = (spokenText) => {
  if (!content) {
    return;
  }

  const storyWords = getStoryWords();

  if (storyWords.length === 0) {
    return;
  }

  const spokenWords = spokenText
    .split(/\s+/)
    .map(normalizeWord)
    .filter(Boolean);

  let expectedIndex =
    expectedWordIndexRef.current;

  const updatedReadWords = [...readWordIndexes];

  for (const spokenWord of spokenWords) {

    // Story already completed
    if (expectedIndex >= storyWords.length) {
      break;
    }

    // Ignore filler sounds
    if (
      spokenWord === "um" ||
      spokenWord === "uh" ||
      spokenWord === "erm" ||
      spokenWord === "hmm" ||
      spokenWord === "hm"
    ) {
      continue;
    }

    // ==========================================
    // LOOK AHEAD FOR THE SPOKEN WORD
    // ==========================================
    //
    // Example:
    //
    // Story:
    // The little rabbit jumps
    //
    // Child:
    // The rabbit jumps
    //
    // When "rabbit" is heard:
    //
    // "little" -> remains normal
    // "rabbit" -> becomes read
    //
    // We DO NOT mark skipped words.
    // ==========================================

    let matchedIndex = -1;

    const LOOK_AHEAD = 5;

    for (
      let i = expectedIndex;
      i < Math.min(
        expectedIndex + LOOK_AHEAD,
        storyWords.length
      );
      i++
    ) {

      const expectedWord =
        normalizeWord(
          storyWords[i].word
        );

      if (spokenWord === expectedWord) {
        matchedIndex = i;
        break;
      }
    }

    // ==========================================
    // WORD FOUND
    // ==========================================

    if (matchedIndex !== -1) {

      const uniqueIndex =
        storyWords[matchedIndex].uniqueIndex;

      // IMPORTANT:
      // Only mark the word the child actually said.
      //
      // We DO NOT mark the words skipped before it.
      if (!updatedReadWords.includes(uniqueIndex)) {

        updatedReadWords.push(
          uniqueIndex
        );
      }

      // Move expected position to the word
      // AFTER the word that was recognized.
      //
      // Example:
      //
      // The [little] [rabbit]
      //              ↑
      //
      // rabbit recognized
      //
      // Next expected word = jumps
      expectedIndex =
        matchedIndex + 1;

      setCurrentWordIndex(
        expectedIndex
      );

      // Update progress based on the
      // position reached in the story.
      setReadingProgress(
        Math.round(
          (expectedIndex / storyWords.length) * 100
        )
      );

      // ==========================================
      // FINAL WORD
      // ==========================================

      if (
        expectedIndex >= storyWords.length
      ) {

        expectedWordIndexRef.current =
          expectedIndex;

        setReadWordIndexes(
          updatedReadWords
        );

        setReadingProgress(100);

        completeStory();

        return;
      }
    }

    // ==========================================
    // WORD NOT FOUND
    // ==========================================
    //
    // If the spoken word does not match anything
    // within the next few story words, we simply
    // ignore it for now.
    //
    // The story position does not move.
    // ==========================================
  }

  // Save the latest expected position
  expectedWordIndexRef.current =
    expectedIndex;

  // Update only the words actually recognized
  setReadWordIndexes(
    updatedReadWords
  );
};

  // ==========================================
  // SEND AUDIO TO WHISPER
  // ==========================================

  const sendAudioToWhisper = async (audioBlob) => {
    try {
      console.log("Sending audio to Whisper...");

      const formData = new FormData();

      formData.append(
        "audio",
        audioBlob,
        "reading.webm"
      );

      const response = await fetch(
        "http://localhost:5000/api/speech/transcribe",
        {
          method: "POST",
          body: formData,
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Whisper transcription failed"
        );
      }

      console.log(
        "Whisper heard:",
        data.text
      );

      if (data.text && data.text.trim()) {
        setPauseMessage("");

        startPauseTimer();

        processSpokenText(data.text);
      }
    } catch (error) {
      console.error(
        "Whisper request failed:",
        error
      );

      setSpeechError(
        "LumiLex couldn't understand the audio. Please continue reading."
      );
    }
  };

  // ==========================================
  // START LUMILEX MICROPHONE LISTENING
  // ==========================================

  const startListening = async () => {
    
    if (!speechSupported) {
      setSpeechError(
        "Microphone recording is not supported in this browser. Please try Google Chrome."
      );

      return;
    }

    if (!content) {
      return;
    }

    if (isListening) {
      return;
    }

    try {
      // Stop LumiLex's read-aloud voice
      window.speechSynthesis.cancel();

      setIsReading(false);
      setActiveWord(null);

      setSpeechError("");
      setPauseMessage("");

      // Reset reading tracking
      setReadWordIndexes([]);
      setCurrentWordIndex(0);
      setReadingProgress(0);

      expectedWordIndexRef.current = 0;

      completionRef.current = false;

      // Ask browser for microphone access
      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

      // Create recorder
      const recorder = new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;

      listeningRef.current = true;

      setIsListening(true);

      startPauseTimer();

      let audioChunks = [];

      // ==========================================
      // AUDIO DATA
      // ==========================================

      recorder.ondataavailable = (event) => {
        if (
          event.data &&
          event.data.size > 0
        ) {
          audioChunks.push(event.data);
        }
      };

      // ==========================================
      // RECORDING STOPPED
      // ==========================================

      recorder.onstop = async () => {
        if (audioChunks.length === 0) {
          return;
        }

        const audioBlob = new Blob(
          audioChunks,
          {
            type:
              recorder.mimeType ||
              "audio/webm",
          }
        );

        audioChunks = [];

        await sendAudioToWhisper(audioBlob);

        // Continue recording
        if (
          listeningRef.current &&
          !completionRef.current
        ) {
          try {
            recorder.start();

            recordingTimerRef.current =
              setTimeout(() => {
                if (
                  recorder.state ===
                    "recording" &&
                  listeningRef.current
                ) {
                  recorder.stop();
                }
              }, 5000);
          } catch (error) {
            console.error(
              "Could not restart recorder:",
              error
            );
          }
        }
      };

      // ==========================================
      // RECORDING ERROR
      // ==========================================

      recorder.onerror = (event) => {
        console.error(
          "MediaRecorder error:",
          event
        );

        setSpeechError(
          "LumiLex couldn't record your voice. Please try again."
        );

        listeningRef.current = false;

        setIsListening(false);

        clearPauseTimer();

        stream
          .getTracks()
          .forEach((track) => track.stop());
      };

      // ==========================================
      // START RECORDING
      // ==========================================

      recorder.start();

      recordingTimerRef.current =
        setTimeout(() => {
          if (
            recorder.state === "recording" &&
            listeningRef.current
          ) {
            recorder.stop();
          }
        }, 5000);
    } catch (error) {
      console.error(
        "Microphone error:",
        error
      );

      listeningRef.current = false;

      setIsListening(false);

      clearPauseTimer();

      if (
        error.name === "NotAllowedError"
      ) {
        setSpeechError(
          "Microphone access was blocked. Please allow microphone access and try again."
        );
      } else if (
        error.name === "NotFoundError"
      ) {
        setSpeechError(
          "LumiLex couldn't find a microphone. Please check your microphone and try again."
        );
      } else {
        setSpeechError(
          "LumiLex couldn't start listening. Please try again."
        );
      }
    }
  };

  // ==========================================
  // SPEAK INDIVIDUAL WORD
  // ==========================================

  const speakWord = (word, index) => {
    // Don't interfere with live reading
    if (isListening) {
      return;
    }

    window.speechSynthesis.cancel();

    const cleanWord = word.replace(
      /[.,!?;:"'()]/g,
      ""
    );

    if (!cleanWord.trim()) {
      return;
    }

    const utterance =
      new SpeechSynthesisUtterance(cleanWord);

    utterance.lang = "en-US";

    utterance.rate = 0.65;

    utterance.pitch = 1.05;

    utterance.volume = 1;

    const voice = getFriendlyVoice();

    if (voice) {
      utterance.voice = voice;
    }

    setActiveWord(index);

    utterance.onend = () => {
      setActiveWord(null);
    };

    utterance.onerror = () => {
      setActiveWord(null);
    };

    speechRef.current = utterance;

    window.speechSynthesis.speak(utterance);
  };

  // ==========================================
  // READ ENTIRE STORY ALOUD
  // ==========================================

  const readStoryAloud = () => {
    if (!content) {
      return;
    }

    // Don't interfere with live reading
    if (isListening) {
      return;
    }

    window.speechSynthesis.cancel();

    setIsReading(true);

    setActiveWord(null);

    let paragraphIndex = 0;

    const speakParagraph = () => {
      if (
        paragraphIndex >=
        content.paragraphs.length
      ) {
        setIsReading(false);

        setActiveWord(null);

        return;
      }

      const paragraph =
        content.paragraphs[paragraphIndex];

      const words = paragraph.split(" ");

      const utterance =
        new SpeechSynthesisUtterance(
          paragraph
        );

      utterance.lang = "en-US";

      utterance.rate = 0.72;

      utterance.pitch = 1.05;

      utterance.volume = 1;

      const voice = getFriendlyVoice();

      if (voice) {
        utterance.voice = voice;
      }

      utterance.onboundary = (event) => {
        const position = event.charIndex;

        if (typeof position !== "number") {
          return;
        }

        let characterPosition = 0;

        for (
          let wordIndex = 0;
          wordIndex < words.length;
          wordIndex++
        ) {
          const word = words[wordIndex];

          const start = characterPosition;

          const end =
            characterPosition + word.length;

          if (
            position >= start &&
            position < end
          ) {
            const uniqueIndex =
              `${paragraphIndex}-${wordIndex}`;

            setActiveWord(uniqueIndex);

            break;
          }

          characterPosition = end + 1;
        }
      };

      utterance.onend = () => {
        paragraphIndex++;

        setTimeout(() => {
          if (!isListening) {
            speakParagraph();
          }
        }, 500);
      };

      utterance.onerror = (event) => {
        console.error(
          "Speech synthesis error:",
          event
        );

        setIsReading(false);

        setActiveWord(null);
      };

      speechRef.current = utterance;

      window.speechSynthesis.speak(utterance);
    };

    speakParagraph();
  };

  // ==========================================
  // STOP READ ALOUD
  // ==========================================

  const stopReadingAloud = () => {
    window.speechSynthesis.cancel();

    setIsReading(false);

    setActiveWord(null);
  };

  // ==========================================
  // COMPLETION SOUND
  // ==========================================

  const playCompletionSound = () => {
    const audio = new Audio(
      "/sounds/stars.mp3"
    );

    audio.volume = 0.7;

    audio.play().catch((error) => {
      console.error(
        "Completion sound failed:",
        error
      );
    });
  };

  // ==========================================
  // COMPLETE STORY
  // ==========================================

  const completeStory = () => {
    if (completionRef.current) {
      return;
    }

    if (!hasStartedReading) {
      return;
    }

    // Prevent completion before final word
    const storyWords = getStoryWords();

    if (
      expectedWordIndexRef.current <
      storyWords.length
    ) {
      return;
    }

    completionRef.current = true;

    // ==========================================
    // STOP MICROPHONE
    // ==========================================

    listeningRef.current = false;

    clearPauseTimer();

    if (recordingTimerRef.current) {
      clearTimeout(
        recordingTimerRef.current
      );

      recordingTimerRef.current = null;
    }

    if (mediaRecorderRef.current) {
      try {
        if (
          mediaRecorderRef.current.state ===
          "recording"
        ) {
          mediaRecorderRef.current.stop();
        }
      } catch (error) {
        console.log(
          "Recorder already stopped."
        );
      }

      if (
        mediaRecorderRef.current.stream
      ) {
        mediaRecorderRef.current.stream
          .getTracks()
          .forEach(
            (track) => track.stop()
          );
      }

      mediaRecorderRef.current = null;
    }

    // Stop speech synthesis
    window.speechSynthesis.cancel();

    setIsListening(false);

    setIsReading(false);

    setActiveWord(null);

    setPauseMessage("");

    setReadingProgress(100);

    // ==========================================
    // AWARD STARS
    // ==========================================

    const earned = 3;

    recordStoryCompletion();

    setStarsEarned(earned);

    // Play reward sound
    playCompletionSound();

    // Show completion screen
    setShowCompletion(true);
  };

  // ==========================================
  // START READING
  // ==========================================

  const startReading = () => {
    // Reading practice never consumes energy.
    // Story is now officially started

    setHasStartedReading(true);

    setReadingProgress(0);

    setReadWordIndexes([]);

    setCurrentWordIndex(0);

    expectedWordIndexRef.current = 0;

    completionRef.current = false;

    setShowCompletion(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    /*
      IMPORTANT:

      We DO NOT start the microphone here.

      The child must click:
      "🎤 Read to LumiLex"

      before microphone access begins.
    */
  };

  // ==========================================
  // BACK TO STORIES
  // ==========================================

  const backToStories = () => {
    listeningRef.current = false;

    clearPauseTimer();

    if (recordingTimerRef.current) {
      clearTimeout(
        recordingTimerRef.current
      );

      recordingTimerRef.current = null;
    }

    if (mediaRecorderRef.current) {
      try {
        if (
          mediaRecorderRef.current.state ===
          "recording"
        ) {
          mediaRecorderRef.current.stop();
        }
      } catch (error) {
        console.log(
          "Recorder already stopped."
        );
      }

      if (
        mediaRecorderRef.current.stream
      ) {
        mediaRecorderRef.current.stream
          .getTracks()
          .forEach(
            (track) => track.stop()
          );
      }

      mediaRecorderRef.current = null;
    }

    window.speechSynthesis.cancel();

    setIsListening(false);

    setIsReading(false);

    setActiveWord(null);

    navigate("/stories");
  };

  // ==========================================
  // CLEANUP
  // ==========================================

  useEffect(() => {
    return () => {
      listeningRef.current = false;

      clearPauseTimer();

      if (recordingTimerRef.current) {
        clearTimeout(
          recordingTimerRef.current
        );
      }

      if (mediaRecorderRef.current) {
        try {
          if (
            mediaRecorderRef.current.state ===
            "recording"
          ) {
            mediaRecorderRef.current.stop();
          }
        } catch (error) {
          console.log(
            "Recorder already stopped."
          );
        }

        if (
          mediaRecorderRef.current.stream
        ) {
          mediaRecorderRef.current.stream
            .getTracks()
            .forEach(
              (track) => track.stop()
            );
        }
      }

      window.speechSynthesis.cancel();
    };
  }, []);

  // ==========================================
  // LOADING
  // ==========================================

  if (storyLoading) {
    return (
      <div className="story-error">
        <div className="story-error-card">
          <h2>Loading story...</h2>

          <p>
            Getting your story ready.
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // STORY ERROR
  // ==========================================

  if (storyError || !content) {
    return (
      <div className="story-error">
        <div className="story-error-card">
          <h2>Story not found</h2>

          <p>
            {storyError ||
              "We couldn't find this story."}
          </p>

          <button
            onClick={backToStories}
            className="back-button"
          >
            Back to Stories
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // COMPLETION SCREEN
  // ==========================================

  if (showCompletion) {
    return (
      <div className="completion-screen">

        <div className="completion-card">

          <div className="completion-icon">
            🎉
          </div>

          <h1>
            Great Job!
          </h1>

          <h2>
            You finished this story!
          </h2>

          <p className="completion-story-title">
            {content.title}
          </p>

          <div className="completion-stars">
            ⭐ ⭐ ⭐
          </div>

          <div className="stars-reward">
            +{starsEarned} Stars
          </div>

          <p className="completion-message">
            Wonderful reading! Keep exploring
            new stories and adventures.
          </p>

          <div className="completion-buttons">

            <button
              className="continue-reading-button"
              onClick={() =>
                setShowCompletion(false)
              }
            >
              Stay Here
            </button>

            <button
              className="completion-back-button"
              onClick={backToStories}
            >
              Back to Stories
            </button>

          </div>

        </div>

      </div>
    );
  }

  // ==========================================
  // START READING SCREEN
  // ==========================================

  if (!hasStartedReading) {
    return (
      <div className="start-reading-screen">

        <div className="start-reading-card">

          <div className="start-reading-icon">
            📖
          </div>

          <h1>
            Ready to Read?
          </h1>

          <h2>
            {content.title}
          </h2>

          <p>
            Take your time and enjoy the
            story.
          </p>

          <button
            className="start-reading-button"
            onClick={startReading}
          >
            Start Reading 🌟
          </button>

          <button
            className="back-button secondary"
            onClick={backToStories}
          >
            Back to Stories
          </button>

        </div>

      </div>
    );
  }

  // ==========================================
  // MAIN STORY READER
  // ==========================================

  return (
    <div className="story-reader">

      {/* ======================================
          HEADER
      ====================================== */}

      <header className="story-header">

        <button
          className="back-button"
          onClick={backToStories}
        >
          ← Stories
        </button>

      </header>

      {/* ======================================
          STORY
      ====================================== */}

      <main className="story-container">

        <div className="story-title-section">

          <h1>
            {content.title}
          </h1>

          <p>
            Read at your own pace 🌱
          </p>

        </div>

        {/* ====================================
            PROGRESS
        ==================================== */}

        <div className="reading-progress">

          <div className="progress-header">

            <span>
              Reading Progress
            </span>

            <strong>
              {readingProgress}%
            </strong>

          </div>

          <div className="progress-bar">

            <div
              className="progress-fill"
              style={{
                width: `${readingProgress}%`,
              }}
            />

          </div>

        </div>

        {/* ====================================
            LISTEN WITH LUMILEX
        ==================================== */}

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

        </div>

        {/* ====================================
            READ TO LUMILEX
        ==================================== */}

        <div className="voice-reading-section">

          {!isListening ? (
            <button
              className="voice-reading-button"
              onClick={startListening}
              disabled={!speechSupported}
            >
              🎤 Read to LumiLex
            </button>
          ) : (
            <div className="lumilex-listening-status">

              <span className="listening-dot"></span>

              <div>

                <strong>
                  LumiLex is listening...
                </strong>

                <p>
                  Read the story aloud at
                  your own pace 💚
                </p>

              </div>

            </div>
          )}

          {/* Browser doesn't support recording */}

          {!speechSupported && (
            <div className="speech-error-card">

              <strong>
                Live reading isn't supported
                here.
              </strong>

              <p>
                Please use Google Chrome for
                the LumiLex reading feature.
              </p>

            </div>
          )}

          {/* Microphone / speech error */}

          {speechError && (
            <div className="speech-error-card">

              <strong>
                Something went wrong
              </strong>

              <p>
                {speechError}
              </p>

            </div>
          )}

          {/* Friendly pause message */}

          {pauseMessage && (
            <div className="pause-help-card">

              <span>
                💚
              </span>

              <p>
                {pauseMessage}
              </p>

            </div>
          )}

        </div>

        {/* ====================================
            STORY CARD
        ==================================== */}

        <article className="story-card">

          {content.paragraphs.map(
            (
              paragraph,
              paragraphIndex
            ) => {

              const words =
                paragraph.split(/\s+/);

              return (
                <p
                  key={paragraphIndex}
                  className="story-paragraph"
                >

                  {words.map(
                    (
                      word,
                      wordIndex
                    ) => {

                      const uniqueIndex =
                        `${paragraphIndex}-${wordIndex}`;

                      const isRead =
                        readWordIndexes.includes(
                          uniqueIndex
                        );

                      const storyWords =
                        getStoryWords();

                      const isCurrent =
                        currentWordIndex ===
                        storyWords.findIndex(
                          (item) =>
                            item.uniqueIndex ===
                            uniqueIndex
                        );

                      let wordClass =
                        "story-word";

                      if (isRead) {
                        wordClass += " read";
                      }

                      if (
                        isCurrent &&
                        isListening
                      ) {
                        wordClass += " current";
                      }

                      if (
                        activeWord ===
                        uniqueIndex
                      ) {
                        wordClass += " active";
                      }

                      return (
                        <span
                          key={uniqueIndex}
                          className={wordClass}
                          onClick={() =>
                            speakWord(
                              word,
                              uniqueIndex
                            )
                          }
                        >
                          {word}{" "}
                        </span>
                      );
                    }
                  )}

                </p>
              );
            }
          )}

        </article>

        {/* ====================================
            READING COMPANION MESSAGE
        ==================================== */}

        <div className="reading-companion-footer">

          {isListening ? (
            <>
              <span>
                🌱
              </span>

              <p>
                LumiLex is following along
                with you. Take your time!
              </p>
            </>
          ) : (
            <>
              <span>
                💚
              </span>

              <p>
                Tap any word if you want
                LumiLex to say it for you.
              </p>
            </>
          )}

        </div>

      </main>

      {/* ======================================
          FOOTER
      ====================================== */}

      <footer className="story-footer">

        <p>
          💚 Take your time. You're doing great!
        </p>

      </footer>

    </div>
  );
}