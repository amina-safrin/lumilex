// =========================================================
// LUMILEX CHILD-FRIENDLY AUDIO ENGINE
// Specially crafted for children with dyslexia:
// - Gentle, soothing tones (no harsh buzzers or startling noises)
// - Web Audio API synthesizer (zero external mp3 dependencies)
// - Slow, crystal-clear speech synthesis with warm pitch
// - Phonetic isolation and compound word blending
// =========================================================

let audioCtx = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

// Global sound preference
let soundsMuted = false;

export function toggleMuteSounds() {
  soundsMuted = !soundsMuted;
  if (typeof window !== "undefined") {
    localStorage.setItem("lumilex_muted", soundsMuted ? "true" : "false");
  }
  return soundsMuted;
}

export function isSoundsMuted() {
  if (typeof window !== "undefined") {
    soundsMuted = localStorage.getItem("lumilex_muted") === "true";
  }
  return soundsMuted;
}

// ---------------------------------------------------------
// Synthesized Sound Effects (Gentle & Encouraging)
// ---------------------------------------------------------

/**
 * Gentle warm ascending chime for correct answer (Pentatonic: C5, E5, G5, C6)
 */
export function playSuccessChime() {
  if (isSoundsMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now + idx * 0.09);

    gain.gain.setValueAtTime(0, now + idx * 0.09);
    gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.09 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * 0.09);
    osc.stop(now + idx * 0.09 + 0.38);
  });
}

/**
 * Soft soothing tap sound (like a friendly bubble pop)
 */
export function playTapSound() {
  if (isSoundsMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(440, now);
  osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);

  gain.gain.setValueAtTime(0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.1);
}

/**
 * Delightful blend chime when two words combine (honey + bee)
 */
export function playCombineSound() {
  if (isSoundsMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [392.0, 523.25, 659.25]; // G4 -> C5 -> E5

  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, now + idx * 0.12);

    gain.gain.setValueAtTime(0.15, now + idx * 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * 0.12);
    osc.stop(now + idx * 0.12 + 0.42);
  });
}

/**
 * Gentle warm bell for hints or encouragement
 */
export function playHintSound() {
  if (isSoundsMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(587.33, now); // D5

  gain.gain.setValueAtTime(0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.42);
}

// ---------------------------------------------------------
// Speech Synthesis (Slow, Patient, Dyslexia-Optimized)
// ---------------------------------------------------------

export function getFriendlyVoice() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  const preferredVoices = [
    "Google US English",
    "Samantha",
    "Jenny",
    "Aria",
    "Ava",
    "Microsoft Zira",
    "Karen",
  ];

  for (const name of preferredVoices) {
    const found = voices.find(
      (v) => v.name.toLowerCase().includes(name.toLowerCase()) && v.lang.startsWith("en")
    );
    if (found) return found;
  }

  return voices.find((v) => v.lang.startsWith("en")) || voices[0];
}

/**
 * Speak any word or phrase with patient, clear cadence
 */
export function speakText(text, options = {}) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  if (isSoundsMuted()) return;

  window.speechSynthesis.cancel();
  if (!text) return;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = options.rate || 0.75; // Slower pace for dyslexia processing
  utterance.pitch = options.pitch || 1.1; // Gentle, child-friendly pitch
  utterance.volume = 1.0;

  const voice = getFriendlyVoice();
  if (voice) utterance.voice = voice;

  if (options.onStart) utterance.onstart = options.onStart;
  if (options.onEnd) utterance.onend = options.onEnd;
  if (options.onError) utterance.onerror = options.onError;

  window.speechSynthesis.speak(utterance);
}

/**
 * Special pronunciation for letter and its mnemonic image
 * e.g., letter "A", word "Apple" -> "A is for Apple. /a/ Apple."
 */
export function speakLetterMnemonic(letter, word, pictureEmoji = "") {
  const cleanLetter = String(letter).trim().toUpperCase();
  const cleanWord = String(word).trim();
  const text = `${cleanLetter}! ${cleanLetter} is for ${cleanWord}. ${cleanWord}!`;
  speakText(text, { rate: 0.72, pitch: 1.12 });
}

/**
 * Pronounce compound words (Word 1 + Word 2 = Combined Word)
 * e.g., "Honey" + "Bee" = "Honeybee"
 */
export function speakCompoundWord(firstWord, secondWord, combinedWord) {
  const text = `${firstWord}... plus ${secondWord}... makes ${combinedWord}!`;
  speakText(text, { rate: 0.72, pitch: 1.12 });
}

/**
 * Phoneme sound breakdown
 * e.g., "/c/ /a/ /t/" -> "c... a... t... Cat!"
 */
export function speakPhonemeBlend(phonemes, wholeWord) {
  const cleanPhonemes = phonemes.join("... ");
  const text = `${cleanPhonemes}... ${wholeWord}!`;
  speakText(text, { rate: 0.7, pitch: 1.1 });
}
