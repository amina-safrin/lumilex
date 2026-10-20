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

// Global sound preferences
let soundsMuted = false;
let soundVolume = 0.8; // 0.0 to 1.0

export function getSoundVolume() {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("lumilex_sound_volume");
    if (saved !== null) {
      soundVolume = Math.max(0, Math.min(1, parseFloat(saved) || 0.8));
    }
  }
  return soundVolume;
}

export function setSoundVolume(vol) {
  soundVolume = Math.max(0, Math.min(1, parseFloat(vol)));
  if (typeof window !== "undefined") {
    localStorage.setItem("lumilex_sound_volume", String(soundVolume));
  }
  return soundVolume;
}

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

let lastPopTime = 0;

/**
 * Delightful bubble pop sound on button press
 * Short, crisp, bouncy, and friendly for children with dyslexia
 */
export function playPopSound() {
  if (isSoundsMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  // Debounce rapid duplicate calls (within 60ms) so button click + inline handler don't double-fire
  if (now - lastPopTime < 0.06) return;
  lastPopTime = now;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const vol = getSoundVolume();

    osc.type = "sine";
    // Pitch rises quickly and drops like a cheerful bubble popping
    osc.frequency.setValueAtTime(360, now);
    osc.frequency.exponentialRampToValueAtTime(840, now + 0.032);
    osc.frequency.exponentialRampToValueAtTime(460, now + 0.07);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.18 * vol, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  } catch (e) {
    // AudioContext safety fallback
  }
}

/**
 * Alias for backward compatibility across existing components
 */
export const playTapSound = playPopSound;

/**
 * Attaches a global click listener to play the pop sound on every button press across the app
 */
export function initGlobalButtonSounds() {
  if (typeof window === "undefined") return () => {};

  const handleGlobalClick = (e) => {
    try {
      const target = e.target;
      if (!target || typeof target.closest !== "function") return;

      // Detect button or clickable button-like element
      const btn = target.closest("button, [role='button'], input[type='button'], input[type='submit'], .btn, .clickable-pill");
      if (
        btn &&
        !btn.disabled &&
        btn.getAttribute("aria-disabled") !== "true" &&
        btn.getAttribute("data-no-pop") !== "true"
      ) {
        playPopSound();
      }
    } catch (err) {
      // Safe fallback
    }
  };

  // Use capture phase so all button clicks register reliably
  window.addEventListener("click", handleGlobalClick, true);

  return () => {
    window.removeEventListener("click", handleGlobalClick, true);
  };
}
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

export const playGentleEncouragement = playRetryGentleSound;


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

/**
 * Enchanting sparkling magic spell sound (for AI Story Generation & selections)
 */
export function playMagicSpellSound() {
  if (isSoundsMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  // Shimmering celestial arpeggio
  const magicNotes = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98];

  magicNotes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now + idx * 0.06);

    gain.gain.setValueAtTime(0, now + idx * 0.06);
    gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.06 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * 0.06);
    osc.stop(now + idx * 0.06 + 0.42);
  });
}

/**
 * Gentle whoosh sound when selecting character or topic
 */
export function playWhooshSound() {
  if (isSoundsMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "triangle";
  osc.frequency.setValueAtTime(220, now);
  osc.frequency.exponentialRampToValueAtTime(587.33, now + 0.18);

  gain.gain.setValueAtTime(0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.22);
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

// ---------------------------------------------------------
// Speech Synthesis (Slow, Patient, Dyslexia-Optimized)
// ---------------------------------------------------------

export function cleanTextForSpeech(input) {
  if (!input) return "";
  return String(input)
    // Remove emojis so TTS does not read out descriptions like "red apple" or "crescent moon"
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu, "")
    // Remove slashes
    .replace(/\//g, "")
    // Remove leading dash on word families like "-at" or "-un"
    .replace(/(^|\s)-([a-zA-Z]+)/g, "$1$2")
    .replace(/\s+/g, " ")
    .trim();
}

export const PHONIC_SOUNDS = {
  a: "ah",
  b: "buh",
  c: "kuh",
  d: "duh",
  e: "eh",
  f: "fff",
  g: "guh",
  h: "huh",
  i: "ih",
  j: "juh",
  k: "kuh",
  l: "lll",
  m: "mmm",
  n: "nnn",
  o: "ah",
  p: "puh",
  q: "kwuh",
  r: "rrr",
  s: "sss",
  t: "tuh",
  u: "uh",
  v: "vvv",
  w: "wuh",
  x: "ks",
  y: "yuh",
  z: "zzz",
};

export function speakPhonicSound(letter) {
  const char = String(letter).trim().toLowerCase().replace(/[^a-z]/g, "");
  const sound = PHONIC_SOUNDS[char] || char;
  speakText(sound, { rate: 0.72, pitch: 1.1 });
}

/**
 * Speak any word or phrase with patient, clear cadence
 */
export function speakText(text, options = {}) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  if (isSoundsMuted()) return;

  window.speechSynthesis.cancel();
  const cleaned = cleanTextForSpeech(text);
  if (!cleaned) return;

  const utterance = new SpeechSynthesisUtterance(cleaned);
  utterance.rate = options.rate || 0.74; // Slower pace for dyslexia processing
  utterance.pitch = options.pitch || 1.1; // Gentle, child-friendly pitch
  utterance.volume = getSoundVolume();

  const voice = getFriendlyVoice();
  if (voice) utterance.voice = voice;

  if (options.onStart) utterance.onstart = options.onStart;
  if (options.onEnd) utterance.onend = options.onEnd;
  if (options.onError) utterance.onerror = options.onError;

  window.speechSynthesis.speak(utterance);
}

/**
 * Special pronunciation for letter and its mnemonic image
 * e.g., letter "A", word "Apple" -> "A is for Apple. Apple!"
 */
export function speakLetterMnemonic(letter, word, pictureEmoji = "") {
  const cleanLetter = String(letter).trim().toUpperCase();
  const cleanWord = cleanTextForSpeech(word);
  const text = `${cleanLetter}! ${cleanLetter} is for ${cleanWord}. ${cleanWord}!`;
  speakText(text, { rate: 0.72, pitch: 1.12 });
}

/**
 * Pronounce compound words (Word 1 + Word 2 = Combined Word)
 * e.g., "Honey" + "Bee" = "Honeybee"
 */
export function speakCompoundWord(firstWord, secondWord, combinedWord) {
  const w1 = cleanTextForSpeech(firstWord);
  const w2 = cleanTextForSpeech(secondWord);
  const combo = cleanTextForSpeech(combinedWord);
  const text = `${w1}... plus ${w2}... makes ${combo}!`;
  speakText(text, { rate: 0.72, pitch: 1.12 });
}

/**
 * Phoneme sound breakdown
 * e.g., ["c", "a", "t"] -> "kuh... ah... tuh... Cat!"
 */
export function speakPhonemeBlend(phonemes, wholeWord) {
  const cleanPhonemes = (phonemes || []).map((p) => {
    const char = String(p).trim().toLowerCase().replace(/[^a-z]/g, "");
    return PHONIC_SOUNDS[char] || char;
  }).join("... ");
  const cleanWhole = cleanTextForSpeech(wholeWord);
  const text = `${cleanPhonemes}... ${cleanWhole}!`;
  speakText(text, { rate: 0.68, pitch: 1.1 });
}
