// =========================================================
// LUMILEX AI — GEMMA CLOUD ADAPTIVE LEARNING SERVICE
// Integrates Ollama's `gemma4:cloud` model with LumiLex's
// Orton-Gillingham Science of Reading pedagogy.
//
// Key principles:
// 1. Strict Privacy: Minimal performance metrics only, zero PII.
// 2. Deterministic Progression: Backend mastery rules decide progression;
//    Gemma cannot arbitrarily promote or demote children.
// 3. Acoustic Uncertainty: Speech recognition mismatches are treated
//    as possible pronunciation/mic variances, not confirmed mistakes.
// 4. Resilient Fallback: Safe, rule-based fallback when Ollama is offline.
// =========================================================

const http = require("http");
const https = require("https");

// Configuration from environment variables (with secure defaults)
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "gemma4:cloud";
const OLLAMA_TIMEOUT_MS = parseInt(process.env.OLLAMA_TIMEOUT_MS, 10) || 15000;
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY || null;

// Supported skills aligned with LumiLex curriculum
const SUPPORTED_SKILLS = [
  "letter_recognition",
  "phonics",
  "sound_blending",
  "word_reading",
  "fluency",
  "comprehension",
];

// Mapping levels to core primary skills
const LEVEL_SKILLS_MAP = {
  1: { skill: "letter_recognition", title: "Alphabet Picture Garden" },
  2: { skill: "phonics", title: "Sound Safari" },
  3: { skill: "sound_blending", title: "Little Word Blenders" },
  4: { skill: "word_reading", title: "Rhyme & Word Families" },
  5: { skill: "word_reading", title: "Combination Word Builders" },
  6: { skill: "comprehension", title: "Sentence Explorers" },
};

// =========================================================
// 1. DETERMINISTIC PROGRESSION ENGINE
// Governs level unlocks and pacing based on repository mastery rules.
// =========================================================
function evaluateDeterministicProgression({ accuracy = 0, currentLevel = 1, completedSessions = 0 }) {
  const acc = Number(accuracy) || 0;
  const level = Number(currentLevel) || 1;

  // LumiLex mastery threshold: >= 75% accuracy
  if (acc >= 90) {
    return {
      decision: "boost",
      nextLevel: Math.min(6, level + 1),
      suitableDifficulty: "boost",
      rationale: "High accuracy demonstrated (>=90%). Ready for challenger questions or next level.",
    };
  } else if (acc >= 75) {
    return {
      decision: "advance",
      nextLevel: Math.min(6, level + 1),
      suitableDifficulty: "standard",
      rationale: "Mastery achieved (>=75%). Ready to advance along the stepping-stone path.",
    };
  } else if (acc >= 60) {
    return {
      decision: "repeat",
      nextLevel: level,
      suitableDifficulty: "standard",
      rationale: "Near mastery (60-74%). Repeat current activity to reinforce confidence without penalties.",
    };
  } else {
    return {
      decision: "support",
      nextLevel: level,
      suitableDifficulty: "support",
      rationale: "Emerging accuracy (<60%). Supported difficulty recommended with visual mnemonics and hints.",
    };
  }
}

// =========================================================
// 2. DYSLEXIA-TOLERANT SPEECH ANALYSIS
// Compares speech transcript with expected passage.
// Speech mismatches are tagged as *possible* variances.
// =========================================================
function levenshtein(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (a.charAt(i - 1) === b.charAt(j - 1)) {
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

function isDyslexiaTolerantMatch(spoken, expected) {
  if (!spoken || !expected) return false;
  const s = spoken.toLowerCase().replace(/[.,!?;:"'()[\]{}]/g, "").trim();
  const e = expected.toLowerCase().replace(/[.,!?;:"'()[\]{}]/g, "").trim();
  if (s === e) return true;

  // Anti-reversal letter normalization (b <-> d, p <-> q, m <-> w)
  const normS = s.replace(/d/g, "b").replace(/q/g, "p").replace(/w/g, "m");
  const normE = e.replace(/d/g, "b").replace(/q/g, "p").replace(/w/g, "m");
  if (normS === normE) return true;

  const dist = levenshtein(s, e);
  if (e.length <= 3 && dist <= 1) return true;
  if (e.length > 3 && dist <= 2) return true;
  if (e.length >= 4 && (s.startsWith(e) || e.startsWith(s))) return true;

  return false;
}

function analyzeSpeechDiscrepancies(transcript, expectedText) {
  if (!transcript || !expectedText) {
    return { hasSpeechData: false, possibleMismatches: [] };
  }

  const expectedWords = expectedText.split(/\s+/).map((w) => w.toLowerCase().replace(/[^\w]/g, "")).filter(Boolean);
  const spokenWords = transcript.split(/\s+/).map((w) => w.toLowerCase().replace(/[^\w]/g, "")).filter(Boolean);

  const possibleMismatches = [];

  expectedWords.forEach((expectedWord) => {
    const matched = spokenWords.some((spokenWord) => isDyslexiaTolerantMatch(spokenWord, expectedWord));
    if (!matched) {
      possibleMismatches.push({
        word: expectedWord,
        note: "Possible acoustic mismatch, quiet volume, or emerging sound articulation",
      });
    }
  });

  return {
    hasSpeechData: true,
    possibleMismatches,
    totalExpectedWords: expectedWords.length,
    spokenWordsCount: spokenWords.length,
  };
}

// =========================================================
// 3. OLLAMA API CLIENT WITH TIMEOUT & ROBUST PARSING
// =========================================================
async function callOllamaChat(messages, options = {}) {
  const endpoint = `${OLLAMA_BASE_URL.replace(/\/+$/, "")}/api/chat`;
  const timeoutMs = options.timeoutMs || OLLAMA_TIMEOUT_MS;
  const model = options.model || OLLAMA_MODEL;

  const requestBody = {
    model,
    messages,
    format: "json",
    stream: false,
    options: {
      temperature: 0.2, // Consistent, structured pedagogical advice
      top_p: 0.9,
    },
  };

  const headers = {
    "Content-Type": "application/json",
  };
  if (OLLAMA_API_KEY) {
    headers["Authorization"] = `Bearer ${OLLAMA_API_KEY}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      throw new Error(`Ollama HTTP ${response.status}: ${errText.slice(0, 200)}`);
    }

    const data = await response.json();
    return data;
  } catch (err) {
    clearTimeout(timer);
    if (err.name === "AbortError") {
      throw new Error(`Ollama request timed out after ${timeoutMs}ms`);
    }
    throw err;
  }
}

// =========================================================
// 4. CLEAN & VALIDATE MODEL OUTPUT
// =========================================================
function parseAndValidateModelResponse(rawText) {
  if (!rawText || typeof rawText !== "string") {
    throw new Error("Empty model response text");
  }

  // Strip markdown code fences if present (e.g. ```json ... ```)
  let cleaned = rawText.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/, "").replace(/```$/, "").trim();
  }

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    // Attempt simple regex extraction of JSON object
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      parsed = JSON.parse(match[0]);
    } else {
      throw new Error(`Failed to parse JSON from Gemma response: ${err.message}`);
    }
  }

  // Validate all 7 required fields
  const requiredFields = [
    "observedPerformancePatterns",
    "possibleSkillDifficulties",
    "recommendedNextActivity",
    "suitableDifficulty",
    "targetedSkill",
    "encouragingFeedback",
    "suggestedFollowUpAssessment",
  ];

  for (const field of requiredFields) {
    if (!parsed[field] || typeof parsed[field] !== "string" || !parsed[field].trim()) {
      throw new Error(`Missing or empty required field: ${field}`);
    }
  }

  // Normalize targeted skill
  let normalizedSkill = parsed.targetedSkill.toLowerCase().replace(/[\s-]/g, "_");
  if (!SUPPORTED_SKILLS.includes(normalizedSkill)) {
    // Find closest or fallback to phonics
    normalizedSkill = SUPPORTED_SKILLS.find((s) => normalizedSkill.includes(s)) || "phonics";
  }

  // Normalize difficulty
  let normalizedDiff = parsed.suitableDifficulty.toLowerCase().trim();
  if (!["support", "standard", "boost"].includes(normalizedDiff)) {
    normalizedDiff = "standard";
  }

  return {
    observedPerformancePatterns: parsed.observedPerformancePatterns.trim(),
    possibleSkillDifficulties: parsed.possibleSkillDifficulties.trim(),
    recommendedNextActivity: parsed.recommendedNextActivity.trim(),
    suitableDifficulty: normalizedDiff,
    targetedSkill: normalizedSkill,
    encouragingFeedback: parsed.encouragingFeedback.trim(),
    suggestedFollowUpAssessment: parsed.suggestedFollowUpAssessment.trim(),
  };
}

// =========================================================
// 5. DETERMINISTIC FALLBACK RECOMMENDATION GENERATOR
// Guarantees reliable operation if Ollama is paused/offline.
// =========================================================
function generateDeterministicFallback({
  currentLevel = 1,
  accuracy = 0,
  deterministicProgression,
  speechAnalysis = null,
  trickyItems = [],
}) {
  const levelInfo = LEVEL_SKILLS_MAP[currentLevel] || { skill: "phonics", title: "Phonics Practice" };
  const acc = Number(accuracy) || 0;
  const isAdvance = deterministicProgression.decision === "advance" || deterministicProgression.decision === "boost";
  const isSupport = deterministicProgression.decision === "support";

  let observed = `Completed ${levelInfo.title} with ${acc}% accuracy.`;
  if (acc >= 90) {
    observed += " Demonstrated confident, fluid letter and sound recognition.";
  } else if (acc >= 75) {
    observed += " Showed solid understanding of core sound patterns.";
  } else {
    observed += " Practiced actively with positive effort and persistence.";
  }

  let difficulties = "No significant persistent blockers detected.";
  if (speechAnalysis?.possibleMismatches?.length > 0) {
    const sampleWords = speechAnalysis.possibleMismatches.slice(0, 3).map((m) => `"${m.word}"`).join(", ");
    difficulties = `Potential acoustic/mic variance or sound hesitation on ${sampleWords}. Note: Speech recognition mismatches are treated with uncertainty and not as confirmed errors.`;
  } else if (trickyItems.length > 0) {
    difficulties = `Reinforcing friendly practice for tricky sounds: ${trickyItems.slice(0, 3).join(", ")}.`;
  } else if (acc < 75) {
    difficulties = "Emerging sound-blending fluency. Child benefits from tactile visual anchors.";
  }

  let nextActivity = "";
  if (isAdvance) {
    const nextLvl = deterministicProgression.nextLevel;
    const nextInfo = LEVEL_SKILLS_MAP[nextLvl] || { title: "Next Reading Quest" };
    nextActivity = `Level ${nextLvl}: ${nextInfo.title} — continue along the stepping-stone path.`;
  } else if (isSupport) {
    nextActivity = `Level ${currentLevel}: ${levelInfo.title} (Supported Practice with picture hints and slow audio).`;
  } else {
    nextActivity = `Level ${currentLevel}: ${levelInfo.title} (Reinforcement round to secure mastery crown).`;
  }

  let encouragingFeedback = "";
  if (acc >= 90) {
    encouragingFeedback = "Sensational reading! You're shining bright like a star crystal! 🌟💎";
  } else if (acc >= 75) {
    encouragingFeedback = "Wonderful reading work! Practice makes progress, and you're growing stronger every day! 🌿✨";
  } else {
    encouragingFeedback = "Super effort! Every single word you try helps your learning tree sprout tall and proud! 🌱🧡";
  }

  return {
    observedPerformancePatterns: observed,
    possibleSkillDifficulties: difficulties,
    recommendedNextActivity: nextActivity,
    suitableDifficulty: deterministicProgression.suitableDifficulty,
    targetedSkill: levelInfo.skill,
    encouragingFeedback,
    suggestedFollowUpAssessment: `Try a quick 3-question review in ${levelInfo.title} focusing on target sound recognition.`,
    isFallback: true,
  };
}

// =========================================================
// 6. MAIN ADAPTIVE LEARNING ORCHESTRATOR
// =========================================================
async function generateAdaptiveRecommendation({
  currentLevel = 1,
  accuracy = 0,
  correctCount = 0,
  totalQuestions = 0,
  skillsExercised = [],
  speechTranscript = "",
  expectedPassage = "",
  trickyItems = [],
  completedSessions = 0,
}) {
  // Step 1: Compute deterministic progression according to LumiLex rules
  const deterministicProgression = evaluateDeterministicProgression({
    accuracy,
    currentLevel,
    completedSessions,
  });

  // Step 2: Analyze speech recognition transcript if available
  const speechAnalysis = analyzeSpeechDiscrepancies(speechTranscript, expectedPassage);

  // Step 3: Prepare minimized performance payload (NO PII, zero tokens/passwords)
  const currentLevelInfo = LEVEL_SKILLS_MAP[currentLevel] || { skill: "phonics", title: `Level ${currentLevel}` };

  const performanceSummary = {
    currentLevelNumber: currentLevel,
    currentLevelTitle: currentLevelInfo.title,
    primaryTargetSkill: currentLevelInfo.skill,
    accuracyPercent: accuracy,
    questionsCompleted: totalQuestions,
    correctAnswers: correctCount,
    skillsExercised: skillsExercised.length > 0 ? skillsExercised : [currentLevelInfo.skill],
    deterministicDecision: deterministicProgression.decision,
    deterministicNextLevel: deterministicProgression.nextLevel,
    deterministicDifficulty: deterministicProgression.suitableDifficulty,
    trickyItemsCount: trickyItems.length,
    trickyItemKeys: trickyItems.slice(0, 5),
    hasSpeechAudioData: speechAnalysis.hasSpeechData,
    possibleSpeechVariancesCount: speechAnalysis.possibleMismatches?.length || 0,
    possibleSpeechWords: speechAnalysis.possibleMismatches?.slice(0, 4).map((m) => m.word) || [],
  };

  // Step 4: Prompt for Gemma 4 Cloud via Ollama
  const systemPrompt = `You are the Gemma Reading Coach for LumiLex AI, an Orton-Gillingham dyslexia literacy platform.
Your job is to provide structured pedagogical recommendations to support a young child with dyslexia.

CRITICAL RULES:
1. Speech recognition mismatches MUST be treated as POSSIBLE pronunciation or microphone variances, NOT confirmed reading mistakes. Children with dyslexia experience acoustic variability, shyness, and accents.
2. The deterministic progression decision has already been calculated by the curriculum engine: "${deterministicProgression.decision}" (Difficulty: "${deterministicProgression.suitableDifficulty}"). Your pedagogical advice MUST align with this decision.
3. Keep feedback warm, encouraging, child-centered, and celebratory.
4. Output MUST be ONLY a raw JSON object (no surrounding conversational text) conforming to this exact schema:
{
  "observedPerformancePatterns": "concise description of observed strengths and reading behavior",
  "possibleSkillDifficulties": "noted areas of uncertainty or potential sound stumbles (explicitly mentioning speech recognition uncertainty if applicable)",
  "recommendedNextActivity": "name of recommended LumiLex activity or level",
  "suitableDifficulty": "${deterministicProgression.suitableDifficulty}",
  "targetedSkill": "one of: letter_recognition, phonics, sound_blending, word_reading, fluency, comprehension",
  "encouragingFeedback": "warm, friendly message for the child with emojis",
  "suggestedFollowUpAssessment": "brief informal check or mini-game suggestion"
}`;

  const userPrompt = `Here is the anonymous learning-performance summary for this checkpoint:
${JSON.stringify(performanceSummary, null, 2)}

Provide the structured JSON recommendation.`;

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  // Step 5: Query Gemma Cloud with fallback protection
  try {
    const response = await callOllamaChat(messages, {
      model: OLLAMA_MODEL,
      timeoutMs: OLLAMA_TIMEOUT_MS,
    });

    const assistantContent = response?.message?.content || "";
    const validated = parseAndValidateModelResponse(assistantContent);

    return {
      success: true,
      modelUsed: response.model || OLLAMA_MODEL,
      recommendation: {
        ...validated,
        isFallback: false,
      },
      deterministicProgression,
      speechAnalysis,
      generatedAt: new Date().toISOString(),
    };
  } catch (apiError) {
    console.warn("Gemma Cloud/Ollama notice (using resilient Orton-Gillingham fallback):", apiError.message);

    const fallbackRec = generateDeterministicFallback({
      currentLevel,
      accuracy,
      deterministicProgression,
      speechAnalysis,
      trickyItems,
    });

    return {
      success: true,
      modelUsed: "deterministic-orton-gillingham-fallback",
      recommendation: fallbackRec,
      deterministicProgression,
      speechAnalysis,
      fallbackReason: apiError.message,
      generatedAt: new Date().toISOString(),
    };
  }
}

// =========================================================
// 7. GEMMA STORY ERROR-DRIVEN PRACTICE GENERATOR
// Transforms caught reading mistakes from Story Library into
// bespoke, Orton-Gillingham multi-sensory practice sessions.
// =========================================================

function generateDeterministicStoryPracticeFallback({
  storyTitle = "Story Adventure",
  storyTopic = "General",
  trickyWords = [],
  identifiedErrors = [],
  childName = "Reader",
  accuracy = 100,
}) {
  const safeTricky = Array.isArray(trickyWords) && trickyWords.length > 0
    ? trickyWords.map((w) => String(w).replace(/[^\w]/g, "").trim()).filter(Boolean)
    : ["story", "friend", "happy"];

  const primaryWord = safeTricky[0] || "story";
  const secondaryWord = safeTricky[1] || safeTricky[0] || "read";
  const capitalizedPrimary = primaryWord.charAt(0).toUpperCase() + primaryWord.slice(1);
  const capitalizedSecondary = secondaryWord.charAt(0).toUpperCase() + secondaryWord.slice(1);

  // Generate letter bank with 2 distractor letters
  const primaryLetters = primaryWord.toUpperCase().split("");
  const distractorLetters = ["E", "A", "O", "T", "S"].filter((l) => !primaryLetters.includes(l)).slice(0, 2);
  const letterBank = [...primaryLetters, ...distractorLetters].sort(() => Math.random() - 0.5);

  const practiceQuestions = [
    {
      id: "story-q1",
      type: "speak_loud",
      prompt: `Read out loud: ${primaryWord}`,
      targetWord: primaryWord.toUpperCase(),
      syllables: [capitalizedPrimary],
      phoneticHint: primaryWord.toLowerCase().split("").join(" - "),
      picture: "📖",
      pictureLabel: capitalizedPrimary,
      hint: `Take your time! Blend the sounds in ${primaryWord} smoothly. 🌟`,
    },
    {
      id: "story-q2",
      type: "word_select",
      prompt: `Which word says ${capitalizedPrimary}?`,
      picture: "🌟",
      choices: [
        capitalizedPrimary,
        capitalizedPrimary.slice(0, -1) + "t",
        capitalizedPrimary.charAt(0) + "a" + capitalizedPrimary.slice(2),
      ].filter((v, i, a) => a.indexOf(v) === i),
      answer: capitalizedPrimary,
      hint: `Listen closely: ${capitalizedPrimary} starts with letter ${capitalizedPrimary.charAt(0)}! 💡`,
    },
    {
      id: "story-q3",
      type: "letter_build",
      prompt: `Spell the word: ${primaryWord}`,
      targetWord: primaryWord.toUpperCase(),
      picture: "🧩",
      pictureLabel: capitalizedPrimary,
      letterBank,
      answer: primaryWord.toUpperCase(),
      hint: `Tap the letters one by one to spell ${primaryWord}! 🧱`,
    },
    {
      id: "story-q4",
      type: "speak_loud",
      prompt: `Read out loud: ${secondaryWord}`,
      targetWord: secondaryWord.toUpperCase(),
      syllables: [capitalizedSecondary],
      phoneticHint: secondaryWord.toLowerCase().split("").join(" - "),
      picture: "✨",
      pictureLabel: capitalizedSecondary,
      hint: `Say ${secondaryWord} out loud to LumiLex! 🎙️`,
    },
    {
      id: "story-q5",
      type: "sentence_read",
      prompt: `Read out loud: I love to read ${primaryWord}.`,
      sentence: `I love to read ${primaryWord}.`,
      tokens: ["I", "love", "to", "read", `${primaryWord}.`],
      hint: `Read the friendly story sentence out loud to LumiLex! 📖`,
    },
  ];

  return {
    storyTitle,
    coachFeedback: `Splendid effort reading "${storyTitle}", ${childName}! You read with bravery and enthusiasm. Here is a custom practice session designed just for you to master these words! 🌟`,
    errorAnalysis: safeTricky.length > 0
      ? `We noticed a few tricky sounds in words like "${safeTricky.slice(0, 3).join('", "')}". Practicing them with sound tiles will make them feel familiar and easy!`
      : "You read the story wonderfully! This quick review will keep your reading superpowers sharp.",
    identifiedTrickyWords: safeTricky.slice(0, 5),
    targetedSkill: "word_reading",
    practiceQuestions,
    isFallback: true,
  };
}

async function generateStoryPracticeSession({
  storyTitle = "Story Adventure",
  storyTopic = "General",
  expectedText = "",
  speechTranscript = "",
  identifiedErrors = [],
  trickyWords = [],
  childName = "Reader",
  accuracy = 100,
}) {
  const safeTricky = Array.isArray(trickyWords) && trickyWords.length > 0
    ? trickyWords.map((w) => String(w).replace(/[^\w]/g, "").trim()).filter(Boolean)
    : [];

  const errorSummary = {
    storyTitle,
    storyTopic,
    accuracyPercent: Number(accuracy) || 0,
    trickyWords: safeTricky.slice(0, 6),
    caughtErrorsSample: Array.isArray(identifiedErrors) ? identifiedErrors.slice(0, 5) : [],
    speechExcerpt: String(speechTranscript || "").slice(0, 300),
    expectedExcerpt: String(expectedText || "").slice(0, 300),
  };

  const systemPrompt = `You are the Gemma AI Reading Specialist for LumiLex, supporting young children with dyslexia.
The child just read the story "${storyTitle}" into the microphone (transcribed by Whisper).
Your job is to analyze the child's reading errors (substituted, mispronounced, or skipped words) and create a bespoke 5-question multi-sensory Orton-Gillingham practice session.

CRITICAL INSTRUCTIONS:
1. Treat reading stumbles kindly. For young children with dyslexia, sound substitutions (like b/d reversals or vowel slips) are natural growth opportunities.
2. The 5 practice questions MUST directly reinforce the tricky words identified: [${safeTricky.slice(0, 5).join(", ")}].
3. Question types MUST be one of:
   - "speak_loud": Prompt child to read targetWord aloud to LumiLex (includes syllables, phoneticHint, picture, pictureLabel, hint).
   - "word_select": 3 clear choices targeting sound discrimination, answer, picture, hint.
   - "letter_build": Spell the tricky word with a letterBank (targetWord letters + 2 distractors).
   - "sentence_read": Read aloud a short 4-6 word friendly sentence containing the tricky word (sentence, tokens array, hint).
4. Output MUST be ONLY valid JSON conforming to this schema:
{
  "storyTitle": "${storyTitle}",
  "coachFeedback": "encouraging 2-sentence feedback for the child with emojis",
  "errorAnalysis": "child-friendly explanation of the phonics patterns practiced",
  "identifiedTrickyWords": ["word1", "word2"],
  "targetedSkill": "word_reading",
  "practiceQuestions": [
    {
      "id": "story-q1",
      "type": "speak_loud",
      "prompt": "Read out loud: ...",
      "targetWord": "...",
      "syllables": ["..."],
      "phoneticHint": "...",
      "picture": "emoji",
      "pictureLabel": "...",
      "hint": "..."
    }
  ]
}`;

  const userPrompt = `Here is the story reading error analysis data:
${JSON.stringify(errorSummary, null, 2)}

Generate the tailored practice session JSON.`;

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  try {
    const response = await callOllamaChat(messages, {
      model: OLLAMA_MODEL,
      timeoutMs: OLLAMA_TIMEOUT_MS,
    });

    const assistantContent = response?.message?.content || "";
    let cleaned = assistantContent.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/, "").replace(/```$/, "").trim();
    }

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
      else throw new Error("Could not parse JSON from Gemma response");
    }

    if (!parsed.practiceQuestions || !Array.isArray(parsed.practiceQuestions) || parsed.practiceQuestions.length === 0) {
      throw new Error("Gemma did not return practiceQuestions array");
    }

    return {
      success: true,
      modelUsed: response.model || OLLAMA_MODEL,
      practiceSession: {
        storyTitle: parsed.storyTitle || storyTitle,
        coachFeedback: parsed.coachFeedback || `Splendid reading of "${storyTitle}", ${childName}!`,
        errorAnalysis: parsed.errorAnalysis || "Focused phonics practice for tricky story words.",
        identifiedTrickyWords: parsed.identifiedTrickyWords || safeTricky,
        targetedSkill: parsed.targetedSkill || "word_reading",
        practiceQuestions: parsed.practiceQuestions,
        isFallback: false,
      },
      generatedAt: new Date().toISOString(),
    };
  } catch (apiError) {
    console.warn("Gemma Cloud story practice notice (using Orton-Gillingham fallback):", apiError.message);

    const fallbackSession = generateDeterministicStoryPracticeFallback({
      storyTitle,
      storyTopic,
      trickyWords: safeTricky,
      identifiedErrors,
      childName,
      accuracy,
    });

    return {
      success: true,
      modelUsed: "deterministic-story-fallback",
      practiceSession: fallbackSession,
      fallbackReason: apiError.message,
      generatedAt: new Date().toISOString(),
    };
  }
}

module.exports = {
  OLLAMA_BASE_URL,
  OLLAMA_MODEL,
  SUPPORTED_SKILLS,
  LEVEL_SKILLS_MAP,
  evaluateDeterministicProgression,
  isDyslexiaTolerantMatch,
  analyzeSpeechDiscrepancies,
  parseAndValidateModelResponse,
  generateDeterministicFallback,
  generateAdaptiveRecommendation,
  generateDeterministicStoryPracticeFallback,
  generateStoryPracticeSession,
};

