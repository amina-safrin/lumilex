import { useEffect, useMemo, useState } from "react";
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
  Plus
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
  playTapSound,
  playCombineSound,
  playHintSound,
  speakText,
  speakLetterMnemonic,
  speakCompoundWord,
  speakPhonemeBlend,
  toggleMuteSounds,
  isSoundsMuted
} from "../utils/childAudio";

export default function LearningJourney() {
  const navigate = useNavigate();

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const [learningState, setLearningState] = useState(() => getLearningState());
  const [activeLevel, setActiveLevel] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [answers, setAnswers] = useState([]);
  const [showHint, setShowHint] = useState(false);
  const [speakingText, setSpeakingText] = useState("");
  const [sessionResult, setSessionResult] = useState(null);
  const [isMuted, setIsMuted] = useState(() => isSoundsMuted());
  const [combinedSuccess, setCombinedSuccess] = useState(false);

  const garden = useMemo(() => getGardenStage(learningState), [learningState]);

  const handleToggleMute = () => {
    const muted = toggleMuteSounds();
    setIsMuted(muted);
    if (muted && typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  };

  const startLevel = (level) => {
    setActiveLevel(level);
    setQuestionIndex(0);
    setSelectedAnswer("");
    setAnswers([]);
    setShowHint(false);
    setSessionResult(null);
    setCombinedSuccess(false);

    // Speak cheerful welcome for the level
    speakText(`Welcome to ${level.title}! Let's have fun reading.`, {
      onStart: () => setSpeakingText(level.title),
      onEnd: () => setSpeakingText("")
    });
  };

  const currentQuestion = activeLevel?.questions[questionIndex];

  // Turn each word in the prompt into an accessible touch-to-hear word
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
            className="question-word-button"
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

  // Tap-to-hear handler for image or word
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

  // Submit answer
  const submitAnswer = () => {
    if (!selectedAnswer || !activeLevel) return;

    const isCorrect = selectedAnswer === currentQuestion.answer;
    if (isCorrect) {
      playSuccessChime();
    }

    const nextAnswers = [...answers, isCorrect];
    setAnswers(nextAnswers);
    setShowHint(false);
    setCombinedSuccess(false);

    if (questionIndex < activeLevel.questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
      setSelectedAnswer("");
      return;
    }

    const correctCount = nextAnswers.filter(Boolean).length;
    const result = recordPracticeSession(
      activeLevel.id,
      correctCount,
      activeLevel.questions.length
    );

    setLearningState(result.state);
    setSessionResult({
      ...result,
      correct: correctCount,
      total: activeLevel.questions.length
    });

    if (result.levelCompleted) {
      playSuccessChime();
      speakText("Wonderful job! You mastered this level!");
    }
  };

  const closePractice = () => {
    setActiveLevel(null);
    setSessionResult(null);
    setCombinedSuccess(false);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  };

  return (
    <div className="learning-page dyslexia-friendly-theme">
      {/* ===================================================
          TOPBAR
      =================================================== */}
      <header className="learning-topbar">
        <button className="learning-back" onClick={() => navigate("/dashboard")}>
          <ArrowLeft size={17} /> Dashboard
        </button>

        <div className="learning-brand">
          <span>📚</span> LumiLex <small>DYSLEXIA READING PATH</small>
        </div>

        <div className="topbar-actions">
          <button
            type="button"
            className="sound-toggle-btn"
            onClick={handleToggleMute}
            title={isMuted ? "Unmute sounds" : "Mute sounds"}
            aria-label={isMuted ? "Unmute sounds" : "Mute sounds"}
          >
            {isMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
            <span>{isMuted ? "Muted" : "Sound"}</span>
          </button>

          <div className="learning-star-count">
            <Star size={17} fill="currentColor" /> {learningState.stars} stars
          </div>
        </div>
      </header>

      {/* ===================================================
          MAIN CONTENT
      =================================================== */}
      <main className="learning-main">
        {!activeLevel ? (
          <>
            {/* HERO PANEL */}
            <section className="learning-hero">
              <div>
                <span className="learning-eyebrow">
                  <Sparkles size={14} /> ADAPTIVE READING PATH FOR DYSLEXIA
                </span>
                <h1>Every little step builds reading confidence.</h1>
                <p>
                  No rush, no timers, no penalties. Explore friendly letters with memorable images,
                  phonics sounds, and playful combination words designed for dyslexic minds.
                </p>
                <div className="learning-hero-pills">
                  <span>⭐ {learningState.stars} stars earned</span>
                  <span>🏅 {learningState.badges.length} badges</span>
                  <span>🌱 {learningState.gardenPoints} garden points</span>
                </div>
              </div>
              <div className="learning-hero-art" aria-label="A friendly growing plant">
                🌱<span>✨</span><i>🌼</i>
              </div>
            </section>

            {/* GARDEN PANEL */}
            <section className="garden-panel">
              <div className="garden-art">{garden.emoji}</div>
              <div className="garden-copy">
                <span className="learning-eyebrow">YOUR LEARNING GARDEN</span>
                <h2>{garden.name}</h2>
                <p>
                  {garden.description} Every story you read and practice activity you try adds sunshine and water to your garden.
                </p>
                <div className="garden-progress">
                  <span
                    style={{
                      width: `${Math.min(
                        100,
                        ((learningState.gardenPoints % 3) / 3) * 100 ||
                          (learningState.gardenPoints ? 100 : 0)
                      )}%`,
                    }}
                  />
                </div>
                <small>
                  {learningState.gardenPoints} learning {learningState.gardenPoints === 1 ? "moment" : "moments"} planted
                </small>
              </div>
            </section>

            {/* LEVEL LIST HEADER */}
            <div className="learning-section-title">
              <div>
                <span className="learning-eyebrow">STEP-BY-STEP PROGRESSION</span>
                <h2>Your Phonics & Word Levels</h2>
                <p>Designed step-by-step: Letters with Images $\rightarrow$ Sounds $\rightarrow$ Blends $\rightarrow$ Rhymes $\rightarrow$ Combination Words.</p>
              </div>
              <div className="mastery-note">
                Practice at your own speed! Master a level with 75% or more to open the next adventure.
              </div>
            </div>

            {/* LEVEL CARDS */}
            <section className="level-list">
              {LEARNING_LEVELS.map((level) => {
                const progress = learningState.levels[level.id] || {};
                const unlocked = level.id <= learningState.currentLevel;
                const mastered = Boolean(progress.completed);

                return (
                  <article
                    key={level.id}
                    className={`level-card ${unlocked ? "unlocked" : "locked"} ${
                      mastered ? "mastered" : ""
                    }`}
                  >
                    <div className="level-icon">
                      {unlocked ? level.icon : <LockKeyhole size={25} />}
                    </div>
                    <div className="level-info">
                      <div className="level-kicker">
                        LEVEL {level.id}{" "}
                        {mastered && (
                          <span className="mastered-tag">
                            <Check size={12} /> MASTERED
                          </span>
                        )}
                      </div>
                      <h3>{level.title}</h3>
                      <p>{level.subtitle}</p>
                      <small>
                        {level.skill} · {progress.attempts || 0} practice{" "}
                        {progress.attempts === 1 ? "session" : "sessions"}
                        {progress.bestAccuracy !== undefined
                          ? ` · Best ${progress.bestAccuracy}%`
                          : ""}
                      </small>
                    </div>
                    <button
                      className="level-action"
                      disabled={!unlocked}
                      onClick={() => startLevel(level)}
                    >
                      {unlocked
                        ? mastered
                          ? "Practise again"
                          : "Start practice"
                        : "Locked"}
                      {unlocked ? (
                        <ArrowRight size={16} />
                      ) : (
                        <LockKeyhole size={15} />
                      )}
                    </button>
                  </article>
                );
              })}
            </section>

            {/* BADGES */}
            <section className="badge-panel">
              <div className="badge-panel-heading">
                <Trophy size={21} />
                <div>
                  <h2>Your Badges</h2>
                  <p>Every milestone celebrated along your reading path.</p>
                </div>
              </div>
              {learningState.badges.length ? (
                <div className="badge-grid">
                  {learningState.badges.map((badge) => (
                    <div className="badge-item" key={badge.id}>
                      <span>{badge.icon}</span>
                      <div>
                        <strong>{badge.title}</strong>
                        <small>{badge.description}</small>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-badges">
                  <span>🏅</span>
                  <p>Your first badge is waiting! Complete your first practice to earn it.</p>
                </div>
              )}
            </section>
          </>
        ) : (
          /* =================================================
              ACTIVE PRACTICE PANEL
          ================================================= */
          <section className="practice-panel">
            <button className="learning-back" onClick={closePractice}>
              <ArrowLeft size={17} /> All levels
            </button>

            {!sessionResult ? (
              <>
                <div className="practice-heading">
                  <span className="level-icon large">{activeLevel.icon}</span>
                  <span className="learning-eyebrow">
                    LEVEL {activeLevel.id} · {activeLevel.skill.toUpperCase()}
                  </span>
                  <h1>{activeLevel.title}</h1>
                  <p>{activeLevel.description}</p>
                </div>

                <div className="question-progress">
                  <div>
                    <span>
                      Question {questionIndex + 1} of {activeLevel.questions.length}
                    </span>
                    <strong>
                      {Math.round(
                        (questionIndex / activeLevel.questions.length) * 100
                      )}
                      %
                    </strong>
                  </div>
                  <div className="garden-progress">
                    <span
                      style={{
                        width: `${
                          ((questionIndex + 1) / activeLevel.questions.length) * 100
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div className="question-card">
                  {/* SPEAKABLE PROMPT */}
                  <h2 className="speakable-question">
                    {renderSpeakableQuestion(currentQuestion.prompt)}
                  </h2>

                  {/* SPECIAL LEVEL 5: COMBINATION WORD VISUALIZER (honey + bee = honeybee) */}
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
                            {combinedSuccess
                              ? currentQuestion.picture
                              : "✨"}
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
                    /* REGULAR PICTURE ANCHOR (Level 1, 2, 3, 4, 6) */
                    currentQuestion.picture && (
                      <button
                        type="button"
                        className="question-picture"
                        onClick={() => handleItemAudio(currentQuestion.pictureLabel)}
                        aria-label={`Hear ${currentQuestion.pictureLabel || currentQuestion.picture}`}
                      >
                        <span className="question-picture-emoji" aria-hidden="true">
                          {currentQuestion.picture}
                        </span>
                        <span className="question-picture-caption">
                          {currentQuestion.pictureLabel || "Tap to hear"}
                        </span>
                        <span className="question-picture-audio">
                          <Volume2 size={16} /> Tap to hear
                        </span>
                      </button>
                    )
                  )}

                  <p className="tap-to-hear-note">
                    <Volume2 size={16} /> Tap any word, picture, or option to hear it spoken clearly.
                  </p>

                  {/* SOUND EXAMPLES (Phonics & Pronunciation) */}
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

                  {/* ANSWER OPTIONS */}
                  <div className="answer-options">
                    {currentQuestion.choices.map((choice) => (
                      <button
                        type="button"
                        key={choice}
                        className={`answer-option ${
                          selectedAnswer === choice ? "selected" : ""
                        }`}
                        onClick={() => handleSelectChoice(choice)}
                        aria-label={`Hear and choose ${choice}`}
                      >
                        <span>{choice}</span>
                        <span className="answer-option-actions">
                          <Volume2 size={17} />
                          {selectedAnswer === choice && <Check size={17} />}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* SPEAKING STATUS */}
                  {speakingText && (
                    <div className="audio-status" role="status">
                      🔊 Saying: <strong>{speakingText}</strong>
                    </div>
                  )}

                  {/* HINT */}
                  {showHint && (
                    <div className="kind-hint">
                      💚 Friendly Hint: {currentQuestion.hint}
                    </div>
                  )}

                  {/* ACTION BUTTONS */}
                  <div className="question-actions">
                    <button
                      className="hint-button"
                      onClick={() => {
                        playHintSound();
                        setShowHint(!showHint);
                        if (!showHint) {
                          speakText(currentQuestion.hint);
                        }
                      }}
                    >
                      💡 Need a gentle hint?
                    </button>

                    <button
                      className="practice-submit"
                      disabled={!selectedAnswer}
                      onClick={submitAnswer}
                    >
                      {questionIndex === activeLevel.questions.length - 1
                        ? "Finish practice"
                        : "Next question"}
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>

                <p className="practice-reassurance">
                  🌱 Take all the time you need. Reading gets easier every single time you try.
                </p>
              </>
            ) : (
              /* =================================================
                  SESSION RESULTS
              ================================================= */
              <div className="session-result">
                <div className="result-celebration">
                  {sessionResult.levelCompleted ? "🎉" : "🌱"}
                </div>
                <span className="learning-eyebrow">PRACTICE COMPLETE</span>
                <h1>
                  {sessionResult.levelCompleted
                    ? "Fantastic Reading!"
                    : "Proud of your effort!"}
                </h1>
                <p>
                  {sessionResult.accuracy >= 75
                    ? "You showed wonderful understanding. Keep going at your own pace!"
                    : "Every try helps your brain grow. You can practice this level again anytime!"}
                </p>

                <div className="result-stats">
                  <div>
                    <strong>
                      {sessionResult.correct}/{sessionResult.total}
                    </strong>
                    <span>answers correct</span>
                  </div>
                  <div>
                    <strong>{sessionResult.accuracy}%</strong>
                    <span>this session</span>
                  </div>
                  <div>
                    <strong>+{sessionResult.starsEarned}</strong>
                    <span>stars earned</span>
                  </div>
                </div>

                {sessionResult.newlyMastered &&
                  activeLevel.id < LEARNING_LEVELS.length && (
                    <div className="level-up-banner">
                      🎊 Level {activeLevel.id + 1} Unlocked! Your next reading adventure is ready.
                    </div>
                  )}

                {sessionResult.newlyMastered &&
                  activeLevel.id === LEARNING_LEVELS.length && (
                    <div className="level-up-banner">
                      🏆 You mastered all reading levels! You are an amazing reader.
                    </div>
                  )}

                <div className="result-actions">
                  <button
                    className="hint-button"
                    onClick={() => startLevel(activeLevel)}
                  >
                    <RotateCcw size={16} /> Practise again
                  </button>
                  <button className="practice-submit" onClick={closePractice}>
                    Back to my levels <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        <footer className="learning-footer">
          <BookOpen size={16} /> LumiLex Dyslexia Companion <span>💚</span> No rush, no stress—just comfortable, joyful reading.
        </footer>
      </main>
    </div>
  );
}
