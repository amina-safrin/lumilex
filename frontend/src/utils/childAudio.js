// =========================================================
// LUMILEX CHILD-FRIENDLY AUDIO ENGINE (DUOLINGO-STYLE)
// Specially crafted for children with dyslexia:
// - Gentle, soothing tones (no harsh buzzers or startling noises)
// - Web Audio API synthesizer (zero external mp3 dependencies)
// - Slow, crystal-clear speech synthesis with warm pitch
// - Phonetic isolation, compound words & celebratory fanfares
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
 * Cheerful ascending chime for correct answer (Pentatonic: C5, E5, G5, C6)
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
    osc.frequency.setValueAtTime(freq, now + idx * 0.08);

    gain.gain.setValueAtTime(0, now + idx * 0.08);
    gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.08 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * 0.08);
    osc.stop(now + idx * 0.08 + 0.38);
  });
}

/**
 * Gentle, encouraging wobble sound when child needs to retry
 * Soft and bouncy - NEVER a harsh or punishing buzzer!
 */
export function playRetryGentleSound() {
  if (isSoundsMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  // Gentle slide: F4 down to D4
  osc.frequency.setValueAtTime(349.23, now);
  osc.frequency.exponentialRampToValueAtTime(293.66, now + 0.22);

  gain.gain.setValueAtTime(0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.26);
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
  const notes = [392.0, 523.25, 659.25, 783.99]; // G4 -> C5 -> E5 -> G5

  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, now + idx * 0.1);

    gain.gain.setValueAtTime(0.18, now + idx * 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * 0.1);
    osc.stop(now + idx * 0.1 + 0.42);
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

/**
 * Duolingo-style Celebration Fanfare for completing a lesson!
 */
export function playCelebrationFanfare() {
  if (isSoundsMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  // Major arpeggio with celebratory top chords: C5, E5, G5, C6, E6
  const fanfares = [
    { freq: 523.25, time: 0.0, dur: 0.15 },
    { freq: 659.25, time: 0.12, dur: 0.15 },
    { freq: 783.99, time: 0.24, dur: 0.15 },
    { freq: 1046.5, time: 0.36, dur: 0.45 },
    { freq: 1318.5, time: 0.5, dur: 0.6 }
  ];

  fanfares.forEach(({ freq, time, dur }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, now + time);

    gain.gain.setValueAtTime(0, now + time);
    gain.gain.linearRampToValueAtTime(0.22, now + time + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + time);
    osc.stop(now + time + dur + 0.05);
  });
}

/**
 * Sparkling gem / reward sound
 */
export function playGemEarnedSound() {
  if (isSoundsMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [880, 1174.66, 1760]; // A5 -> D6 -> A6

  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now + idx * 0.08);

    gain.gain.setValueAtTime(0.15, now + idx * 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * 0.08);
    osc.stop(now + idx * 0.08 + 0.28);
  });
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
  utterance.rate = options.rate || 0.74; // Slower pace for dyslexia processing
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
