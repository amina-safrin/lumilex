import { useState } from "react";
import {
  Brain,
  Sparkles,
  Volume2,
  VolumeX,
  Target,
  Compass,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  Award,
  Cloud
} from "lucide-react";
import { speakText } from "../utils/childAudio";
import "./GemmaAdaptiveCoachCard.css";

const SKILL_LABELS = {
  letter_recognition: "Letter Recognition & Shapes 🍎",
  phonics: "Phonics & Letter Sounds 🦁",
  sound_blending: "Sound Blending (CVC) 🧩",
  word_reading: "Word Families & Vocabulary 🌈",
  fluency: "Reading Fluency & Rhythm 🗣️",
  comprehension: "Story Comprehension 📖",
};

export default function GemmaAdaptiveCoachCard({
  recommendation,
  isLoading = false,
  onActionClick = null,
  actionButtonText = "Start Next Quest 🚀",
  title = "Gemma AI Reading Coach",
  childName = "Reader",
}) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  if (isLoading) {
    return (
      <div className="gemma-coach-card">
        <div className="gemma-skeleton">
          <div className="gemma-pulse-avatar">🦉</div>
          <p className="gemma-skeleton-text">
            Gemma Cloud is analyzing reading performance patterns...
          </p>
        </div>
      </div>
    );
  }

  if (!recommendation) return null;

  const {
    observedPerformancePatterns,
    possibleSkillDifficulties,
    recommendedNextActivity,
    suitableDifficulty = "standard",
    targetedSkill = "phonics",
    encouragingFeedback,
    suggestedFollowUpAssessment,
    isFallback = false,
  } = recommendation;

  const handleSpeakFeedback = () => {
    if (isSpeaking) {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      return;
    }

    const textToSpeak = `${encouragingFeedback} Next up: ${recommendedNextActivity}`;
    setIsSpeaking(true);
    speakText(textToSpeak, {
      rate: 0.85,
      pitch: 1.15,
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  const skillName = SKILL_LABELS[targetedSkill] || targetedSkill.replace(/_/g, " ");

  return (
    <div className="gemma-coach-card" role="region" aria-label="Gemma Adaptive Learning Recommendations">
      {/* Header Strip */}
      <div className="gemma-coach-header">
        <div className="gemma-coach-title-group">
          <div className="gemma-avatar-badge" title="Gemma AI Reading Companion">
            🦉
          </div>
          <div>
            <div className="gemma-coach-title">
              <span>{title}</span>
              <span className="gemma-cloud-tag" title="Powered by Gemma Cloud via Ollama">
                <Cloud size={11} />
                <span>Gemma 4</span>
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="gemma-speak-btn"
          onClick={handleSpeakFeedback}
          title={isSpeaking ? "Stop voice" : "Listen to coach feedback"}
        >
          {isSpeaking ? <VolumeX size={15} /> : <Volume2 size={15} />}
          <span>{isSpeaking ? "Stop" : "Listen"}</span>
        </button>
      </div>

      {/* Encouraging Feedback Message Bubble */}
      {encouragingFeedback && (
        <div className="gemma-feedback-bubble">
          <p className="gemma-feedback-text">
            {encouragingFeedback}
          </p>
        </div>
      )}

      {/* Chips Row: Skill & Difficulty */}
      <div className="gemma-chips-row">
        <span className="gemma-chip skill" title="Target Learning Skill">
          <Target size={13} />
          <span>{skillName}</span>
        </span>

        <span
          className={`gemma-chip difficulty-${suitableDifficulty}`}
          title="Recommended Practice Intensity"
        >
          <Sparkles size={13} />
          <span style={{ textTransform: "capitalize" }}>
            {suitableDifficulty === "support"
              ? "Supported Practice (With Visuals)"
              : suitableDifficulty === "boost"
              ? "Challenger Mode (Boost)"
              : "Standard Practice"}
          </span>
        </span>
      </div>

      {/* Structured Insights Grid */}
      <div className="gemma-insights-grid">
        {observedPerformancePatterns && (
          <div className="gemma-insight-box">
            <span className="gemma-insight-label">
              <CheckCircle2 size={13} color="#10b981" />
              <span>Observed Strength</span>
            </span>
            <p className="gemma-insight-content">
              {observedPerformancePatterns}
            </p>
          </div>
        )}

        {possibleSkillDifficulties && (
          <div className="gemma-insight-box">
            <span className="gemma-insight-label">
              <ShieldAlert size={13} color="#f59e0b" />
              <span>Coaching Focus & Uncertainty</span>
            </span>
            <p className="gemma-insight-content">
              {possibleSkillDifficulties}
            </p>
          </div>
        )}
      </div>

      {/* Suggested Follow-Up Assessment (Informal) */}
      {suggestedFollowUpAssessment && (
        <div style={{ marginBottom: "0.85rem", fontSize: "0.82rem", color: "#64748b" }}>
          <strong style={{ color: "#475569" }}>Suggested mini-check: </strong>
          <span>{suggestedFollowUpAssessment}</span>
        </div>
      )}

      {/* Next Recommended Activity Action Bar */}
      {recommendedNextActivity && (
        <div className="gemma-next-action-box">
          <div className="gemma-next-info">
            <span className="gemma-next-label">Recommended Next Quest</span>
            <span className="gemma-next-title">{recommendedNextActivity}</span>
          </div>

          {onActionClick && (
            <button
              type="button"
              className="gemma-next-btn"
              onClick={onActionClick}
            >
              <span>{actionButtonText}</span>
              <ArrowRight size={15} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
