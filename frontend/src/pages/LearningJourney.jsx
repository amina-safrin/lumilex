import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, BookOpen, Check, LockKeyhole, RotateCcw, Sparkles, Star, Trophy, Volume2 } from "lucide-react";
import "./LearningJourney.css";
import { getGardenStage, getLearningState, LEARNING_LEVELS, recordPracticeSession } from "../utils/learningRewards";

export default function LearningJourney() {
  const navigate = useNavigate();
  useEffect(() => () => { if ("speechSynthesis" in window) window.speechSynthesis.cancel(); }, []);
  const [learningState, setLearningState] = useState(() => getLearningState());
  const [activeLevel, setActiveLevel] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [answers, setAnswers] = useState([]);
  const [showHint, setShowHint] = useState(false);
  const [speakingText, setSpeakingText] = useState("");
  const [sessionResult, setSessionResult] = useState(null);
  const garden = useMemo(() => getGardenStage(learningState), [learningState]);

  const startLevel = (level) => {
    setActiveLevel(level);
    setQuestionIndex(0);
    setSelectedAnswer("");
    setAnswers([]);
    setShowHint(false);
    setSessionResult(null);
  };

  const currentQuestion = activeLevel?.questions[questionIndex];

  // Turn each word in the question into a small, accessible button.
  // Whitespace is preserved so the question still reads naturally.
  const renderSpeakableQuestion = (text) =>
    String(text).split(/(\s+)/).map((part, index) => {
      if (!part || /^\s+$/.test(part)) return part;
      const spokenWord = part.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}'’-]+$/gu, "");
      if (!spokenWord) return part;
      return (
        <button
          type="button"
          className="question-word-button"
          key={`${index}-${part}`}
          onClick={() => speakWord(spokenWord)}
          aria-label={`Hear the word ${spokenWord}`}
          title={`Hear “${spokenWord}”`}
        >
          {part}
        </button>
      );
    });

  // Read a clicked word or phrase aloud using the browser's speech engine.
  // This makes the words themselves interactive; sound examples use a real word
  // so children can hear the target sound in context.
  const speakWord = (text) => {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
      setSpeakingText("Audio is not supported in this browser. Try Chrome or Edge.");
      return;
    }
    window.speechSynthesis.cancel();
    const rawText = String(text).trim().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}'’-]+$/gu, "");
    if (!rawText) return;
    const letterSoundExamples = { A: "apple", B: "ball", C: "cat", D: "dog", F: "fish", G: "goat", L: "leaf", M: "moon", P: "pig", S: "sun", T: "top" };
    // When a child taps a single letter, play a familiar word that begins with
    // its sound instead of saying the letter name (for example, S -> sun).
    const cleanText = rawText.includes(" as in ")
      ? rawText.split(" as in ").pop()
      : (/^[A-Z]$/.test(rawText) && letterSoundExamples[rawText]
          ? letterSoundExamples[rawText]
          : rawText.replaceAll("/", ""));
    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voices = window.speechSynthesis.getVoices();
    utterance.voice = voices.find((voice) => /English/i.test(voice.lang) && /Google|Microsoft|Samantha|Ava|Jenny|Aria/i.test(voice.name))
      || voices.find((voice) => /en/i.test(voice.lang))
      || null;
    utterance.lang = utterance.voice?.lang || "en-US";
    utterance.rate = 0.78;
    utterance.pitch = 1.08;
    utterance.onstart = () => setSpeakingText(cleanText);
    utterance.onend = () => setSpeakingText("");
    utterance.onerror = () => setSpeakingText("");
    window.speechSynthesis.speak(utterance);
  };

  const submitAnswer = () => {
    if (!selectedAnswer || !activeLevel) return;
    const nextAnswers = [...answers, selectedAnswer === currentQuestion.answer];
    setAnswers(nextAnswers);
    setShowHint(false);
    if (questionIndex < activeLevel.questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
      setSelectedAnswer("");
      return;
    }
    const correct = nextAnswers.filter(Boolean).length;
    const result = recordPracticeSession(activeLevel.id, correct, activeLevel.questions.length);
    setLearningState(result.state);
    setSessionResult({ ...result, correct, total: activeLevel.questions.length });
  };

  const closePractice = () => {
    setActiveLevel(null);
    setSessionResult(null);
  };

  return (
    <div className="learning-page">
      <header className="learning-topbar">
        <button className="learning-back" onClick={() => navigate("/dashboard")}><ArrowLeft size={17} /> Dashboard</button>
        <div className="learning-brand"><span>📚</span> LumiLex <small>READING ADVENTURE</small></div>
        <div className="learning-star-count"><Star size={17} fill="currentColor" /> {learningState.stars} stars</div>
      </header>

      <main className="learning-main">
        {!activeLevel ? <>
          <section className="learning-hero">
            <div>
              <span className="learning-eyebrow"><Sparkles size={14} /> YOUR PERSONAL READING PATH</span>
              <h1>Every little step helps you grow.</h1>
              <p>Practise at your own pace. Try again whenever you need—your learning adventure will be here for you.</p>
              <div className="learning-hero-pills"><span>⭐ {learningState.stars} stars earned</span><span>🏅 {learningState.badges.length} badges</span></div>
            </div>
            <div className="learning-hero-art" aria-label="A friendly growing plant">🌱<span>✨</span><i>🌼</i></div>
          </section>

          <section className="garden-panel">
            <div className="garden-art">{garden.emoji}</div>
            <div className="garden-copy"><span className="learning-eyebrow">YOUR LEARNING GARDEN</span><h2>{garden.name}</h2><p>{garden.description} Every completed story or practice session helps it grow.</p><div className="garden-progress"><span style={{ width: `${Math.min(100, (learningState.gardenPoints % 3) / 3 * 100 || (learningState.gardenPoints ? 100 : 0))}%` }} /></div><small>{learningState.gardenPoints} learning {learningState.gardenPoints === 1 ? "moment" : "moments"} planted</small></div>
          </section>

          <div className="learning-section-title"><div><span className="learning-eyebrow">FIVE STEPS, ONE BRIGHTER READER</span><h2>Your Reading Levels</h2><p>New levels unlock as you show understanding across practice sessions.</p></div><div className="mastery-note">Two practice sessions with 80% or more unlock the next level.</div></div>

          <section className="level-list">
            {LEARNING_LEVELS.map((level) => {
              const progress = learningState.levels[level.id] || {};
              const unlocked = level.id <= learningState.currentLevel;
              const mastered = Boolean(progress.completed);
              return <article key={level.id} className={`level-card ${unlocked ? "unlocked" : "locked"} ${mastered ? "mastered" : ""}`}>
                <div className="level-icon">{unlocked ? level.icon : <LockKeyhole size={25} />}</div>
                <div className="level-info"><div className="level-kicker">LEVEL {level.id} {mastered && <span className="mastered-tag"><Check size={12} /> MASTERED</span>}</div><h3>{level.title}</h3><p>{level.subtitle}</p><small>{level.skill} · {progress.attempts || 0} practice {progress.attempts === 1 ? "session" : "sessions"}{progress.bestAccuracy !== undefined ? ` · Best ${progress.bestAccuracy}%` : ""}</small></div>
                <button className="level-action" disabled={!unlocked} onClick={() => startLevel(level)}>{unlocked ? (mastered ? "Practise again" : "Start practice") : "Locked"}{unlocked ? <ArrowRight size={16} /> : <LockKeyhole size={15} />}</button>
              </article>;
            })}
          </section>

          <section className="badge-panel"><div className="badge-panel-heading"><Trophy size={21} /><div><h2>Your Badges</h2><p>Little milestones worth celebrating.</p></div></div>{learningState.badges.length ? <div className="badge-grid">{learningState.badges.map((badge) => <div className="badge-item" key={badge.id}><span>{badge.icon}</span><div><strong>{badge.title}</strong><small>{badge.description}</small></div></div>)}</div> : <div className="empty-badges"><span>🏅</span><p>Your first badge is waiting. Try a practice activity to earn it!</p></div>}</section>
        </> : <section className="practice-panel">
          <button className="learning-back" onClick={closePractice}><ArrowLeft size={17} /> All levels</button>
          {!sessionResult ? <>
            <div className="practice-heading"><span className="level-icon large">{activeLevel.icon}</span><span className="learning-eyebrow">LEVEL {activeLevel.id} · {activeLevel.skill.toUpperCase()}</span><h1>{activeLevel.title}</h1><p>{activeLevel.description}</p></div>
            <div className="question-progress"><div><span>Question {questionIndex + 1} of {activeLevel.questions.length}</span><strong>{Math.round((questionIndex / activeLevel.questions.length) * 100)}%</strong></div><div className="garden-progress"><span style={{ width: `${((questionIndex + 1) / activeLevel.questions.length) * 100}%` }} /></div></div>
            <div className="question-card">
              <h2 className="speakable-question">{renderSpeakableQuestion(currentQuestion.prompt)}</h2>
              {currentQuestion.picture && <button type="button" className="question-picture" onClick={() => speakWord(currentQuestion.pictureLabel || currentQuestion.picture)} aria-label={`Hear ${currentQuestion.pictureLabel || currentQuestion.picture}`}>
                <span className="question-picture-emoji" aria-hidden="true">{currentQuestion.picture}</span>
                <span className="question-picture-caption">{currentQuestion.pictureLabel || "Tap to hear"}</span>
                <span className="question-picture-audio"><Volume2 size={16} /> Hear it</span>
              </button>}
              <p className="tap-to-hear-note"><Volume2 size={16} /> Tap a word or picture to hear it spoken.</p>
              {currentQuestion.soundExamples?.length > 0 && <div className="sound-example-row" aria-label="Hear sound examples">
                {currentQuestion.soundExamples.map((item) => <button type="button" key={`${item.label}-${item.word}`} className="sound-example-button" onClick={() => speakWord(item.word)} aria-label={`Hear ${item.label} in ${item.word}`}>
                  <span className="sound-example-label">{item.label}</span><span className="sound-example-word"><Volume2 size={14} /> {item.word}</span>
                </button>)}
              </div>}
              <div className="answer-options">{currentQuestion.choices.map((choice) => <button type="button" key={choice} className={`answer-option ${selectedAnswer === choice ? "selected" : ""}`} onClick={() => { setSelectedAnswer(choice); speakWord(choice); }} aria-label={`Hear and choose ${choice}`}>
                <span>{choice}</span><span className="answer-option-actions"><Volume2 size={17} />{selectedAnswer === choice && <Check size={17} />}</span>
              </button>)}</div>
              {speakingText && <div className="audio-status" role="status">🔊 Listening to: <strong>{speakingText}</strong></div>}
              {showHint && <div className="kind-hint">💚 Hint: {currentQuestion.hint}</div>}
              <div className="question-actions"><button className="hint-button" onClick={() => setShowHint(!showHint)}>Need a hint?</button><button className="practice-submit" disabled={!selectedAnswer} onClick={submitAnswer}>{questionIndex === activeLevel.questions.length - 1 ? "Finish practice" : "Next question"}<ArrowRight size={16} /></button></div>
            </div>
            <p className="practice-reassurance">🌱 Mistakes help us learn. You can try this level again whenever you like.</p>
          </> : <div className="session-result"><div className="result-celebration">{sessionResult.levelCompleted ? "🎉" : "🌱"}</div><span className="learning-eyebrow">PRACTICE COMPLETE</span><h1>{sessionResult.levelCompleted ? "You mastered this level!" : "Look how far you came!"}</h1><p>{sessionResult.accuracy >= 80 ? "You showed strong understanding. Keep practising to make it stick!" : "Every try helps your brain learn. Review the hints and give it another go when you feel ready."}</p><div className="result-stats"><div><strong>{sessionResult.correct}/{sessionResult.total}</strong><span>answers correct</span></div><div><strong>{sessionResult.accuracy}%</strong><span>this session</span></div><div><strong>+{sessionResult.starsEarned}</strong><span>stars earned</span></div></div>{sessionResult.newlyMastered && activeLevel.id < LEARNING_LEVELS.length && <div className="level-up-banner">🎊 Level {activeLevel.id + 1} unlocked! Your next adventure is ready.</div>}{sessionResult.newlyMastered && activeLevel.id === LEARNING_LEVELS.length && <div className="level-up-banner">🏆 You explored every reading level. Amazing effort!</div>}<div className="result-actions"><button className="hint-button" onClick={() => startLevel(activeLevel)}><RotateCcw size={16} /> Practise again</button><button className="practice-submit" onClick={closePractice}>Back to my levels <ArrowRight size={16} /></button></div></div>}
        </section>}

        <footer className="learning-footer"><BookOpen size={16} /> Read. Understand. Thrive. <span>💚</span> No rush, no penalties—just progress.</footer>
      </main>
    </div>
  );
}
