// =========================================================
// LUMILEX BIRDBRAIN ADAPTIVE ENGINE & DUOLINGO-STYLE LESSONS
// Inspired by Duolingo's Birdbrain AI:
// - Level-by-level bite-sized short lessons (4-5 questions each)
// - Starts from Alphabets and Phonics
// - Dynamically forms each child's next lesson based on their individual performance:
//   * Interweaves spaced-repetition questions targeting active mistakes from PostgreSQL
//   * Adapts difficulty: 'supported' (extra picture anchors + slower audio),
//     'standard', or 'boost' (challenger mode for high accuracy)
//   * Unlocks nodes sequentially along a winding stepping-stone path
// =========================================================

import { getErrorTrackerState, recordChildMistake, recordChildSuccess } from "./errorTracker";
import { getLearningState, setLearningStateLocally } from "./learningRewards";

// ---------------------------------------------------------
// COMPREHENSIVE CURRICULUM: LEVELS & SHORT BITE-SIZED LESSONS
// ---------------------------------------------------------

export const DUO_UNITS = [
  // =======================================================
  // UNIT 1: ALPHABET KINGDOM (Letter Recognition & Shapes)
  // =======================================================
  {
    id: 1,
    unitNumber: 1,
    title: "Alphabet Kingdom",
    subtitle: "Letter Recognition & Friendly Shapes",
    icon: "🍎",
    color: "#10b981", // Emerald Green
    accentBg: "#ecfdf5",
    description: "Meet friendly letter companions and recognize uppercase and lowercase letters.",
    lessons: [
      {
        id: "1-1",
        unitId: 1,
        lessonNumber: 1,
        title: "Letters A, B, C",
        subtitle: "Read Aloud, Images & Spell",
        icon: "🍎",
        targetLetters: ["A", "B", "C"],
        xp: 15,
        gemsReward: 5,
        questions: [
          {
            id: "1-1-q1",
            type: "speak_loud",
            prompt: "Read out loud: Apple",
            targetWord: "APPLE",
            syllables: ["Ap", "ple"],
            phoneticHint: "ah - pple",
            picture: "🍎",
            pictureLabel: "Apple",
            hint: "Say apple: a-pple! 🍎",
          },
          {
            id: "1-1-q2",
            type: "image_select",
            prompt: "Which picture is Ball?",
            targetWord: "BALL",
            imageChoices: [
              { label: "Apple", emoji: "🍎", audio: "Apple" },
              { label: "Ball", emoji: "⚽", audio: "Ball" },
              { label: "Cat", emoji: "🐱", audio: "Cat" },
            ],
            answer: "Ball",
            hint: "Ball is round and bounces! ⚽",
          },
          {
            id: "1-1-q3",
            type: "letter_build",
            prompt: "Spell the word: Cat",
            targetWord: "CAT",
            picture: "🐱",
            pictureLabel: "Cat",
            letterBank: ["C", "A", "T", "O"],
            answer: "CAT",
            hint: "C - A - T spells Cat! 🐱",
          },
          {
            id: "1-1-q4",
            type: "word_select",
            prompt: "Which word says Cat?",
            picture: "🐱",
            choices: ["Cat", "Bat", "Car"],
            answer: "Cat",
            hint: "C is for Cat! 🐱",
          },
          {
            id: "1-1-q5",
            type: "speak_loud",
            prompt: "Read out loud: letter B sound",
            targetWord: "B",
            phoneticHint: "Sound: buh",
            picture: "⚽",
            pictureLabel: "Letter B says buh",
            hint: "Say buh! ⚽",
          },
          {
            id: "1-1-q6",
            type: "sentence_read",
            prompt: "Read out loud: I see a cat.",
            sentence: "I see a cat.",
            tokens: ["I", "see", "a", "cat."],
            hint: "I see a cat! 🐱",
          },
        ],
      },
      {
        id: "1-2",
        unitId: 1,
        lessonNumber: 2,
        title: "Letters D, E, F, G",
        subtitle: "Dog, Egg & Fish",
        icon: "🐶",
        targetLetters: ["D", "E", "F", "G"],
        xp: 15,
        gemsReward: 5,
        questions: [
          {
            id: "1-2-q1",
            type: "speak_loud",
            prompt: "Read out loud: Dog",
            targetWord: "DOG",
            syllables: ["Dog"],
            phoneticHint: "d - o - g",
            picture: "🐶",
            pictureLabel: "Dog",
            hint: "Say Dog: d-o-g! 🐶",
          },
          {
            id: "1-2-q2",
            type: "image_select",
            prompt: "Which picture is Fish?",
            targetWord: "FISH",
            imageChoices: [
              { label: "Dog", emoji: "🐶", audio: "Dog" },
              { label: "Egg", emoji: "🥚", audio: "Egg" },
              { label: "Fish", emoji: "🐟", audio: "Fish" },
            ],
            answer: "Fish",
            hint: "Fish swims with fins! 🐟",
          },
          {
            id: "1-2-q3",
            type: "letter_build",
            prompt: "Spell the word: Dog",
            targetWord: "DOG",
            picture: "🐶",
            pictureLabel: "Dog",
            letterBank: ["D", "O", "G", "B"],
            answer: "DOG",
            hint: "D - O - G spells Dog! 🐶",
          },
          {
            id: "1-2-q4",
            type: "word_select",
            prompt: "Which word says Egg?",
            picture: "🥚",
            choices: ["Egg", "Elf", "Ear"],
            answer: "Egg",
            hint: "E - G - G spells Egg! 🥚",
          },
          {
            id: "1-2-q5",
            type: "speak_loud",
            prompt: "Read out loud: letter G sound",
            targetWord: "G",
            phoneticHint: "Sound: guh",
            picture: "🌿",
            pictureLabel: "Garden says guh",
            hint: "Say guh! 🌿",
          },
          {
            id: "1-2-q6",
            type: "sentence_read",
            prompt: "Read out loud: A dog can run.",
            sentence: "A dog can run.",
            tokens: ["A", "dog", "can", "run."],
            hint: "A dog can run! 🐶",
          },
        ],
      },
      {
        id: "1-3",
        unitId: 1,
        lessonNumber: 3,
        title: "Letters H, I, J, K, L",
        subtitle: "Hat, Kite & Lion",
        icon: "🦁",
        targetLetters: ["H", "I", "J", "K", "L"],
        xp: 15,
        gemsReward: 5,
        questions: [
          {
            id: "1-3-q1",
            type: "speak_loud",
            prompt: "Read out loud: Hat",
            targetWord: "HAT",
            syllables: ["Hat"],
            phoneticHint: "h - a - t",
            picture: "🎩",
            pictureLabel: "Hat",
            hint: "Say Hat: h-a-t! 🎩",
          },
          {
            id: "1-3-q2",
            type: "image_select",
            prompt: "Which picture is Kite?",
            targetWord: "KITE",
            imageChoices: [
              { label: "Hat", emoji: "🎩", audio: "Hat" },
              { label: "Kite", emoji: "🪁", audio: "Kite" },
              { label: "Lion", emoji: "🦁", audio: "Lion" },
            ],
            answer: "Kite",
            hint: "Kite flies high in the wind! 🪁",
          },
          {
            id: "1-3-q3",
            type: "letter_build",
            prompt: "Spell the word: Hat",
            targetWord: "HAT",
            picture: "🎩",
            pictureLabel: "Hat",
            letterBank: ["H", "A", "T", "O"],
            answer: "HAT",
            hint: "H - A - T spells Hat! 🎩",
          },
          {
            id: "1-3-q4",
            type: "word_select",
            prompt: "Which word says Lion?",
            picture: "🦁",
            choices: ["Lion", "Line", "Lemon"],
            answer: "Lion",
            hint: "Lion starts with L! 🦁",
          },
          {
            id: "1-3-q5",
            type: "speak_loud",
            prompt: "Read out loud: letter H sound",
            targetWord: "H",
            phoneticHint: "Sound: huh",
            picture: "🎩",
            pictureLabel: "Hat says huh",
            hint: "Say huh like a warm breath! 🎩",
          },
          {
            id: "1-3-q6",
            type: "sentence_read",
            prompt: "Read out loud: Look at the kite.",
            sentence: "Look at the kite.",
            tokens: ["Look", "at", "the", "kite."],
            hint: "Look at the kite! 🪁",
          },
        ],
      },
      {
        id: "1-4",
        unitId: 1,
        lessonNumber: 4,
        title: "Letters M, N, O, P",
        subtitle: "Moon, Nest & Pig",
        icon: "🦉",
        targetLetters: ["M", "N", "O", "P"],
        xp: 15,
        gemsReward: 5,
        questions: [
          {
            id: "1-4-q1",
            type: "speak_loud",
            prompt: "Read out loud: Moon",
            targetWord: "MOON",
            syllables: ["Moon"],
            phoneticHint: "m - oo - n",
            picture: "🌙",
            pictureLabel: "Moon",
            hint: "Say Moon: m-oo-n! 🌙",
          },
          {
            id: "1-4-q2",
            type: "image_select",
            prompt: "Which picture is Owl?",
            targetWord: "OWL",
            imageChoices: [
              { label: "Moon", emoji: "🌙", audio: "Moon" },
              { label: "Nest", emoji: "🪺", audio: "Nest" },
              { label: "Owl", emoji: "🦉", audio: "Owl" },
            ],
            answer: "Owl",
            hint: "Owl has big round eyes! 🦉",
          },
          {
            id: "1-4-q3",
            type: "letter_build",
            prompt: "Spell the word: Nest",
            targetWord: "NEST",
            picture: "🪺",
            pictureLabel: "Nest",
            letterBank: ["N", "E", "S", "T"],
            answer: "NEST",
            hint: "N - E - S - T spells Nest! 🪺",
          },
          {
            id: "1-4-q4",
            type: "word_select",
            prompt: "Which word says Pig?",
            picture: "🐷",
            choices: ["Pig", "Pen", "Pug"],
            answer: "Pig",
            hint: "Pig starts with P! 🐷",
          },
          {
            id: "1-4-q5",
            type: "speak_loud",
            prompt: "Read out loud: letter M sound",
            targetWord: "M",
            phoneticHint: "Sound: mmm",
            picture: "🌙",
            pictureLabel: "Moon says mmm",
            hint: "Say mmm with lips together! 🌙",
          },
          {
            id: "1-4-q6",
            type: "sentence_read",
            prompt: "Read out loud: The moon is big.",
            sentence: "The moon is big.",
            tokens: ["The", "moon", "is", "big."],
            hint: "The moon is big! 🌙",
          },
        ],
      },
      {
        id: "1-5",
        unitId: 1,
        lessonNumber: 5,
        title: "Alphabet Castle Review",
        subtitle: "Sun, Tree & Star",
        icon: "🏰",
        targetLetters: ["S", "T", "R", "W"],
        xp: 20,
        gemsReward: 10,
        questions: [
          {
            id: "1-5-q1",
            type: "speak_loud",
            prompt: "Read out loud: Sun",
            targetWord: "SUN",
            syllables: ["Sun"],
            phoneticHint: "s - u - n",
            picture: "☀️",
            pictureLabel: "Sun",
            hint: "Say Sun: s-u-n! ☀️",
          },
          {
            id: "1-5-q2",
            type: "image_select",
            prompt: "Which picture is Tree?",
            targetWord: "TREE",
            imageChoices: [
              { label: "Sun", emoji: "☀️", audio: "Sun" },
              { label: "Tree", emoji: "🌳", audio: "Tree" },
              { label: "Rainbow", emoji: "🌈", audio: "Rainbow" },
            ],
            answer: "Tree",
            hint: "Tree has leafy green branches! 🌳",
          },
          {
            id: "1-5-q3",
            type: "letter_build",
            prompt: "Spell the word: Sun",
            targetWord: "SUN",
            picture: "☀️",
            pictureLabel: "Sun",
            letterBank: ["S", "U", "N", "T"],
            answer: "SUN",
            hint: "S - U - N spells Sun! ☀️",
          },
          {
            id: "1-5-q4",
            type: "word_select",
            prompt: "Which word says Star?",
            picture: "⭐",
            choices: ["Star", "Sun", "Sea"],
            answer: "Star",
            hint: "Star begins with S! ⭐",
          },
          {
            id: "1-5-q5",
            type: "speak_loud",
            prompt: "Read out loud: letter S sound",
            targetWord: "S",
            phoneticHint: "Sound: sss",
            picture: "☀️",
            pictureLabel: "Sun says sss",
            hint: "Say sss like the sun shining! ☀️",
          },
          {
            id: "1-5-q6",
            type: "sentence_read",
            prompt: "Read out loud: We see the sun.",
            sentence: "We see the sun.",
            tokens: ["We", "see", "the", "sun."],
            hint: "We see the sun! ☀️",
          },
        ],
      },
    ],
  },

  // =======================================================
  // UNIT 2: PHONICS SOUND SAFARI (Sounds & Phoneme Matching)
  // =======================================================
  {
    id: 2,
    unitNumber: 2,
    title: "Phonics Sound Safari",
    subtitle: "Hearing Sounds & First Phonemes",
    icon: "🦁",
    color: "#3b82f6", // Sky Blue
    accentBg: "#eff6ff",
    description: "Listen to letter sounds and learn how letters sound in real spoken words.",
    lessons: [
      {
        id: "2-1",
        unitId: 2,
        lessonNumber: 1,
        title: "Initial Sounds /m/ & /s/",
        subtitle: "Moon, Sun & Milk",
        icon: "🌙",
        targetLetters: ["M", "S"],
        xp: 15,
        gemsReward: 5,
        questions: [
          {
            id: "2-1-q1",
            type: "speak_loud",
            prompt: "Read out loud: Sun",
            targetWord: "SUN",
            syllables: ["Sun"],
            phoneticHint: "s - u - n",
            picture: "☀️",
            pictureLabel: "Sun",
            hint: "Say Sun: s-u-n! ☀️",
          },
          {
            id: "2-1-q2",
            type: "image_select",
            prompt: "Which picture starts with sound M?",
            targetWord: "MILK",
            imageChoices: [
              { label: "Milk", emoji: "🥛", audio: "Milk" },
              { label: "Sock", emoji: "🧦", audio: "Sock" },
              { label: "Book", emoji: "📖", audio: "Book" },
            ],
            answer: "Milk",
            hint: "Milk starts with M! 🥛",
          },
          {
            id: "2-1-q3",
            type: "letter_build",
            prompt: "Spell the word: Sun",
            targetWord: "SUN",
            picture: "☀️",
            pictureLabel: "Sun",
            letterBank: ["S", "U", "N", "M"],
            answer: "SUN",
            hint: "S - U - N spells Sun! ☀️",
          },
          {
            id: "2-1-q4",
            type: "word_select",
            prompt: "Which word says Moon?",
            picture: "🌙",
            choices: ["Moon", "Man", "Mop"],
            answer: "Moon",
            hint: "Moon starts with M! 🌙",
          },
          {
            id: "2-1-q5",
            type: "speak_loud",
            prompt: "Read out loud: Mop",
            targetWord: "MOP",
            syllables: ["Mop"],
            phoneticHint: "m - o - p",
            picture: "🧹",
            pictureLabel: "Mop",
            hint: "Say Mop: m-o-p! 🧹",
          },
          {
            id: "2-1-q6",
            type: "sentence_read",
            prompt: "Read out loud: The sun is hot.",
            sentence: "The sun is hot.",
            tokens: ["The", "sun", "is", "hot."],
            hint: "The sun is hot! ☀️",
          },
        ],
      },
      {
        id: "2-2",
        unitId: 2,
        lessonNumber: 2,
        title: "Short Vowels /a/ & /o/",
        subtitle: "Ant, Pot & Octopus",
        icon: "🐙",
        targetLetters: ["A", "O"],
        xp: 15,
        gemsReward: 5,
        questions: [
          {
            id: "2-2-q1",
            type: "speak_loud",
            prompt: "Read out loud: Ant",
            targetWord: "ANT",
            syllables: ["Ant"],
            phoneticHint: "ah - n - t",
            picture: "🐜",
            pictureLabel: "Ant",
            hint: "Say Ant: a-n-t! 🐜",
          },
          {
            id: "2-2-q2",
            type: "image_select",
            prompt: "Which picture is Octopus?",
            targetWord: "OCTOPUS",
            imageChoices: [
              { label: "Ant", emoji: "🐜", audio: "Ant" },
              { label: "Pot", emoji: "🍲", audio: "Pot" },
              { label: "Octopus", emoji: "🐙", audio: "Octopus" },
            ],
            answer: "Octopus",
            hint: "Octopus has eight legs! 🐙",
          },
          {
            id: "2-2-q3",
            type: "letter_build",
            prompt: "Spell the word: Pot",
            targetWord: "POT",
            picture: "🍲",
            pictureLabel: "Pot",
            letterBank: ["P", "O", "T", "A"],
            answer: "POT",
            hint: "P - O - T spells Pot! 🍲",
          },
          {
            id: "2-2-q4",
            type: "word_select",
            prompt: "Which word says Cat?",
            picture: "🐱",
            choices: ["Cat", "Cot", "Cut"],
            answer: "Cat",
            hint: "C - A - T is Cat! 🐱",
          },
          {
            id: "2-2-q5",
            type: "speak_loud",
            prompt: "Read out loud: Box",
            targetWord: "BOX",
            syllables: ["Box"],
            phoneticHint: "b - o - x",
            picture: "📦",
            pictureLabel: "Box",
            hint: "Say Box: b-o-x! 📦",
          },
          {
            id: "2-2-q6",
            type: "sentence_read",
            prompt: "Read out loud: A cat in a pot.",
            sentence: "A cat in a pot.",
            tokens: ["A", "cat", "in", "a", "pot."],
            hint: "A cat in a pot! 🍲",
          },
        ],
      },
      {
        id: "2-3",
        unitId: 2,
        lessonNumber: 3,
        title: "Popping Sounds /b/, /p/, /t/",
        subtitle: "Bat, Panda & Tiger",
        icon: "🐯",
        targetLetters: ["B", "P", "T"],
        xp: 15,
        gemsReward: 5,
        questions: [
          {
            id: "2-3-q1",
            type: "speak_loud",
            prompt: "Read out loud: Bat",
            targetWord: "BAT",
            syllables: ["Bat"],
            phoneticHint: "b - a - t",
            picture: "🦇",
            pictureLabel: "Bat",
            hint: "Say Bat: b-a-t! 🦇",
          },
          {
            id: "2-3-q2",
            type: "image_select",
            prompt: "Which picture is Panda?",
            targetWord: "PANDA",
            imageChoices: [
              { label: "Bear", emoji: "🐻", audio: "Bear" },
              { label: "Panda", emoji: "🐼", audio: "Panda" },
              { label: "Tiger", emoji: "🐯", audio: "Tiger" },
            ],
            answer: "Panda",
            hint: "Panda starts with a gentle pop: p! 🐼",
          },
          {
            id: "2-3-q3",
            type: "letter_build",
            prompt: "Spell the word: Tap",
            targetWord: "TAP",
            picture: "🚰",
            pictureLabel: "Tap",
            letterBank: ["T", "A", "P", "B"],
            answer: "TAP",
            hint: "T - A - P spells Tap! 🚰",
          },
          {
            id: "2-3-q4",
            type: "word_select",
            prompt: "Which word says Bear?",
            picture: "🐻",
            choices: ["Bear", "Bat", "Bun"],
            answer: "Bear",
            hint: "B is for Bear! 🐻",
          },
          {
            id: "2-3-q5",
            type: "speak_loud",
            prompt: "Read out loud: Top",
            targetWord: "TOP",
            syllables: ["Top"],
            phoneticHint: "t - o - p",
            picture: "🎪",
            pictureLabel: "Top",
            hint: "Say Top: t-o-p! 🎪",
          },
          {
            id: "2-3-q6",
            type: "sentence_read",
            prompt: "Read out loud: The bear can tap.",
            sentence: "The bear can tap.",
            tokens: ["The", "bear", "can", "tap."],
            hint: "The bear can tap! 🐻",
          },
        ],
      },
    ],
  },

  // =======================================================
  // UNIT 3: ANTI-REVERSAL ANCHORS (b vs d, p vs q, m vs w)
  // Essential dyslexia multisensory memory anchors
  // =======================================================
  {
    id: 3,
    unitNumber: 3,
    title: "Anti-Reversal Workshop",
    subtitle: "Conquering 'b' vs 'd' and 'p' vs 'q'",
    icon: "🪄",
    color: "#8b5cf6", // Purple Magic
    accentBg: "#f3e8ff",
    description: "Multi-sensory body cues and memory anchors to easily tell reversible letters apart.",
    lessons: [
      {
        id: "3-1",
        unitId: 3,
        lessonNumber: 1,
        title: "The Bed Trick: 'b' and 'd'",
        subtitle: "Belly in Front vs Diaper Behind",
        icon: "🛏️",
        targetLetters: ["b", "d"],
        xp: 20,
        gemsReward: 8,
        questions: [
          {
            id: "3-1-q1",
            type: "speak_loud",
            prompt: "Read out loud: Bed",
            targetWord: "BED",
            syllables: ["Bed"],
            phoneticHint: "b - e - d",
            picture: "🛏️",
            pictureLabel: "bed: b has belly, d has diaper",
            hint: "Say Bed: b-e-d! 🛏️",
          },
          {
            id: "3-1-q2",
            type: "image_select",
            prompt: "Which picture begins with letter B?",
            targetWord: "BALL",
            imageChoices: [
              { label: "Ball", emoji: "⚽", audio: "Ball" },
              { label: "Dog", emoji: "🐶", audio: "Dog" },
              { label: "Duck", emoji: "🦆", audio: "Duck" },
            ],
            answer: "Ball",
            hint: "Ball starts with B! ⚽",
          },
          {
            id: "3-1-q3",
            type: "letter_build",
            prompt: "Spell the word: Bed",
            targetWord: "BED",
            picture: "🛏️",
            pictureLabel: "Bed",
            letterBank: ["B", "E", "D", "P"],
            answer: "BED",
            hint: "B - E - D spells Bed! 🛏️",
          },
          {
            id: "3-1-q4",
            type: "word_select",
            prompt: "Which word says Dog?",
            picture: "🐶",
            choices: ["Dog", "Bog", "Dot"],
            answer: "Dog",
            hint: "Dog starts with D! 🐶",
          },
          {
            id: "3-1-q5",
            type: "speak_loud",
            prompt: "Read out loud: Bat",
            targetWord: "BAT",
            syllables: ["Bat"],
            phoneticHint: "b - a - t",
            picture: "🦇",
            pictureLabel: "Bat",
            hint: "Say Bat: b-a-t! 🦇",
          },
          {
            id: "3-1-q6",
            type: "sentence_read",
            prompt: "Read out loud: A dog on the bed.",
            sentence: "A dog on the bed.",
            tokens: ["A", "dog", "on", "the", "bed."],
            hint: "A dog on the bed! 🛏️",
          },
        ],
      },
      {
        id: "3-2",
        unitId: 3,
        lessonNumber: 2,
        title: "Tails Up & Down: 'p' and 'q'",
        subtitle: "Pig, Queen & Pen",
        icon: "👑",
        targetLetters: ["p", "q"],
        xp: 20,
        gemsReward: 8,
        questions: [
          {
            id: "3-2-q1",
            type: "speak_loud",
            prompt: "Read out loud: Pig",
            targetWord: "PIG",
            syllables: ["Pig"],
            phoneticHint: "p - i - g",
            picture: "🐷",
            pictureLabel: "Pig",
            hint: "Say Pig: p-i-g! 🐷",
          },
          {
            id: "3-2-q2",
            type: "image_select",
            prompt: "Which picture is Queen?",
            targetWord: "QUEEN",
            imageChoices: [
              { label: "Pig", emoji: "🐷", audio: "Pig" },
              { label: "Queen", emoji: "👑", audio: "Queen" },
              { label: "Puddle", emoji: "🌧️", audio: "Puddle" },
            ],
            answer: "Queen",
            hint: "Queen wears a sparkling crown! 👑",
          },
          {
            id: "3-2-q3",
            type: "letter_build",
            prompt: "Spell the word: Pig",
            targetWord: "PIG",
            picture: "🐷",
            pictureLabel: "Pig",
            letterBank: ["P", "I", "G", "Q"],
            answer: "PIG",
            hint: "P - I - G spells Pig! 🐷",
          },
          {
            id: "3-2-q4",
            type: "word_select",
            prompt: "Which word says Cup?",
            picture: "☕",
            choices: ["Cup", "Cap", "Cub"],
            answer: "Cup",
            hint: "C - U - P spells Cup! ☕",
          },
          {
            id: "3-2-q5",
            type: "speak_loud",
            prompt: "Read out loud: Pen",
            targetWord: "PEN",
            syllables: ["Pen"],
            phoneticHint: "p - e - n",
            picture: "🖊️",
            pictureLabel: "Pen",
            hint: "Say Pen: p-e-n! 🖊️",
          },
          {
            id: "3-2-q6",
            type: "sentence_read",
            prompt: "Read out loud: The pig had fun.",
            sentence: "The pig had fun.",
            tokens: ["The", "pig", "had", "fun."],
            hint: "The pig had fun! 🐷",
          },
        ],
      },
    ],
  },

  // =======================================================
  // UNIT 4: SOUND BLENDS BAKERY (Consonant Blends)
  // =======================================================
  {
    id: 4,
    unitNumber: 4,
    title: "Sound Blends Bakery",
    subtitle: "Two Sounds Holding Hands (st, bl, tr)",
    icon: "🥐",
    color: "#f59e0b", // Warm Amber
    accentBg: "#fef3c7",
    description: "Blend consonant pairs smoothly together without losing any sounds.",
    lessons: [
      {
        id: "4-1",
        unitId: 4,
        lessonNumber: 1,
        title: "S-Blends: st-, sp-, sn-",
        subtitle: "Star, Spoon & Stop",
        icon: "⭐",
        targetLetters: ["st", "sp", "sn"],
        xp: 20,
        gemsReward: 8,
        questions: [
          {
            id: "4-1-q1",
            type: "speak_loud",
            prompt: "Read out loud: Star",
            targetWord: "STAR",
            syllables: ["Star"],
            phoneticHint: "s - t - ar",
            picture: "⭐",
            pictureLabel: "Star",
            hint: "Say Star: s-t-ar! ⭐",
          },
          {
            id: "4-1-q2",
            type: "image_select",
            prompt: "Which picture is Spoon?",
            targetWord: "SPOON",
            imageChoices: [
              { label: "Star", emoji: "⭐", audio: "Star" },
              { label: "Spoon", emoji: "🥄", audio: "Spoon" },
              { label: "Snail", emoji: "🐌", audio: "Snail" },
            ],
            answer: "Spoon",
            hint: "Spoon is for eating soup! 🥄",
          },
          {
            id: "4-1-q3",
            type: "letter_build",
            prompt: "Spell the word: Stop",
            targetWord: "STOP",
            picture: "🛑",
            pictureLabel: "Stop",
            letterBank: ["S", "T", "O", "P"],
            answer: "STOP",
            hint: "S - T - O - P spells Stop! 🛑",
          },
          {
            id: "4-1-q4",
            type: "word_select",
            prompt: "Which word says Snail?",
            picture: "🐌",
            choices: ["Snail", "Sail", "Spin"],
            answer: "Snail",
            hint: "S - N starts Snail! 🐌",
          },
          {
            id: "4-1-q5",
            type: "speak_loud",
            prompt: "Read out loud: Spin",
            targetWord: "SPIN",
            syllables: ["Spin"],
            phoneticHint: "s - p - i - n",
            picture: "🌀",
            pictureLabel: "Spin",
            hint: "Say Spin: s-p-i-n! 🌀",
          },
          {
            id: "4-1-q6",
            type: "sentence_read",
            prompt: "Read out loud: A star in the sky.",
            sentence: "A star in the sky.",
            tokens: ["A", "star", "in", "the", "sky."],
            hint: "A star in the sky! ⭐",
          },
        ],
      },
      {
        id: "4-2",
        unitId: 4,
        lessonNumber: 2,
        title: "L & R Blends: fr-, bl-, cl-",
        subtitle: "Frog, Clock & Tree",
        icon: "☁️",
        targetLetters: ["fr", "bl", "cl"],
        xp: 20,
        gemsReward: 8,
        questions: [
          {
            id: "4-2-q1",
            type: "speak_loud",
            prompt: "Read out loud: Frog",
            targetWord: "FROG",
            syllables: ["Frog"],
            phoneticHint: "f - r - o - g",
            picture: "🐸",
            pictureLabel: "Frog",
            hint: "Say Frog: f-r-o-g! 🐸",
          },
          {
            id: "4-2-q2",
            type: "image_select",
            prompt: "Which picture is Clock?",
            targetWord: "CLOCK",
            imageChoices: [
              { label: "Frog", emoji: "🐸", audio: "Frog" },
              { label: "Clock", emoji: "⏰", audio: "Clock" },
              { label: "Tree", emoji: "🌳", audio: "Tree" },
            ],
            answer: "Clock",
            hint: "Clock tells the time! ⏰",
          },
          {
            id: "4-2-q3",
            type: "letter_build",
            prompt: "Spell the word: Blue",
            targetWord: "BLUE",
            picture: "🔷",
            pictureLabel: "Blue",
            letterBank: ["B", "L", "U", "E"],
            answer: "BLUE",
            hint: "B - L - U - E spells Blue! 🔷",
          },
          {
            id: "4-2-q4",
            type: "word_select",
            prompt: "Which word says Tree?",
            picture: "🌳",
            choices: ["Tree", "Three", "True"],
            answer: "Tree",
            hint: "T - R starts Tree! 🌳",
          },
          {
            id: "4-2-q5",
            type: "speak_loud",
            prompt: "Read out loud: Drum",
            targetWord: "DRUM",
            syllables: ["Drum"],
            phoneticHint: "d - r - u - m",
            picture: "🥁",
            pictureLabel: "Drum",
            hint: "Say Drum: d-r-u-m! 🥁",
          },
          {
            id: "4-2-q6",
            type: "sentence_read",
            prompt: "Read out loud: The frog can hop.",
            sentence: "The frog can hop.",
            tokens: ["The", "frog", "can", "hop."],
            hint: "The frog can hop! 🐸",
          },
        ],
      },
    ],
  },

  // =======================================================
  // UNIT 5: RHYME MOUNTAIN (Word Families -at, -op, -ug)
  // =======================================================
  {
    id: 5,
    unitNumber: 5,
    title: "Rhyme Mountain",
    subtitle: "Word Families & Rhyming Magic",
    icon: "🏔️",
    color: "#ec4899", // Cheerful Pink
    accentBg: "#fdf2f8",
    description: "Discover word families that share rhyme endings like -at, -op, and -ug.",
    lessons: [
      {
        id: "5-1",
        unitId: 5,
        lessonNumber: 1,
        title: "The -at Family",
        subtitle: "Cat, Hat, Bat & Mat",
        icon: "🎩",
        targetLetters: ["-at"],
        xp: 20,
        gemsReward: 8,
        questions: [
          {
            id: "5-1-q1",
            type: "speak_loud",
            prompt: "Read out loud: Cat",
            targetWord: "CAT",
            syllables: ["Cat"],
            phoneticHint: "c - a - t",
            picture: "🐱",
            pictureLabel: "Cat",
            hint: "Say Cat: c-a-t! 🐱",
          },
          {
            id: "5-1-q2",
            type: "image_select",
            prompt: "Which picture rhymes with Cat?",
            targetWord: "HAT",
            imageChoices: [
              { label: "Hat", emoji: "🎩", audio: "Hat" },
              { label: "Dog", emoji: "🐶", audio: "Dog" },
              { label: "Sun", emoji: "☀️", audio: "Sun" },
            ],
            answer: "Hat",
            hint: "C-at and H-at rhyme! 🎩",
          },
          {
            id: "5-1-q3",
            type: "letter_build",
            prompt: "Spell the word: Bat",
            targetWord: "BAT",
            picture: "🦇",
            pictureLabel: "Bat",
            letterBank: ["B", "A", "T", "C"],
            answer: "BAT",
            hint: "B - A - T spells Bat! 🦇",
          },
          {
            id: "5-1-q4",
            type: "word_select",
            prompt: "Which word says Mat?",
            picture: "🧶",
            choices: ["Mat", "Mop", "Map"],
            answer: "Mat",
            hint: "M - A - T spells Mat! 🧶",
          },
          {
            id: "5-1-q5",
            type: "speak_loud",
            prompt: "Read out loud: Rat",
            targetWord: "RAT",
            syllables: ["Rat"],
            phoneticHint: "r - a - t",
            picture: "🐀",
            pictureLabel: "Rat",
            hint: "Say Rat: r-a-t! 🐀",
          },
          {
            id: "5-1-q6",
            type: "sentence_read",
            prompt: "Read out loud: The cat sat on a mat.",
            sentence: "The cat sat on a mat.",
            tokens: ["The", "cat", "sat", "on", "a", "mat."],
            hint: "The cat sat on a mat! 🧶",
          },
        ],
      },
      {
        id: "5-2",
        unitId: 5,
        lessonNumber: 2,
        title: "The -op & -ug Families",
        subtitle: "Hop, Mop, Bug & Rug",
        icon: "🐛",
        targetLetters: ["-op", "-ug"],
        xp: 20,
        gemsReward: 8,
        questions: [
          {
            id: "5-2-q1",
            type: "speak_loud",
            prompt: "Read out loud: Hop",
            targetWord: "HOP",
            syllables: ["Hop"],
            phoneticHint: "h - o - p",
            picture: "🐇",
            pictureLabel: "Hop",
            hint: "Say Hop: h-o-p! 🐇",
          },
          {
            id: "5-2-q2",
            type: "image_select",
            prompt: "Which picture is Bug?",
            targetWord: "BUG",
            imageChoices: [
              { label: "Bug", emoji: "🐛", audio: "Bug" },
              { label: "Mop", emoji: "🧹", audio: "Mop" },
              { label: "Pot", emoji: "🍲", audio: "Pot" },
            ],
            answer: "Bug",
            hint: "B-ug crawls softly! 🐛",
          },
          {
            id: "5-2-q3",
            type: "letter_build",
            prompt: "Spell the word: Mop",
            targetWord: "MOP",
            picture: "🧹",
            pictureLabel: "Mop",
            letterBank: ["M", "O", "P", "G"],
            answer: "MOP",
            hint: "M - O - P spells Mop! 🧹",
          },
          {
            id: "5-2-q4",
            type: "word_select",
            prompt: "Which word says Hug?",
            picture: "🫂",
            choices: ["Hug", "Hop", "Hat"],
            answer: "Hug",
            hint: "H - U - G spells Hug! 🫂",
          },
          {
            id: "5-2-q5",
            type: "speak_loud",
            prompt: "Read out loud: Rug",
            targetWord: "RUG",
            syllables: ["Rug"],
            phoneticHint: "r - u - g",
            picture: "🪴",
            pictureLabel: "Rug",
            hint: "Say Rug: r-u-g! 🪴",
          },
          {
            id: "5-2-q6",
            type: "sentence_read",
            prompt: "Read out loud: A bug on a rug.",
            sentence: "A bug on a rug.",
            tokens: ["A", "bug", "on", "a", "rug."],
            hint: "A bug on a rug! 🪴",
          },
        ],
      },
    ],
  },

  // =======================================================
  // UNIT 6: WORD BUILDERS & STORIES (Compound Words & Phrases)
  // =======================================================
  {
    id: 6,
    unitNumber: 6,
    title: "Word Builders & Story Safari",
    subtitle: "Compound Words & First Sentences",
    icon: "🌿",
    color: "#06b6d4", // Cyan
    accentBg: "#ecfeff",
    description: "Combine little words into big words and read your first complete story sentences.",
    lessons: [
      {
        id: "6-1",
        unitId: 6,
        lessonNumber: 1,
        title: "Compound Word Magic",
        subtitle: "Sunflower, Butterfly & Rainbow",
        icon: "🌻",
        targetLetters: ["compound"],
        xp: 25,
        gemsReward: 10,
        questions: [
          {
            id: "6-1-q1",
            type: "speak_loud",
            prompt: "Read out loud: Sunflower",
            targetWord: "SUNFLOWER",
            syllables: ["Sun", "flow", "er"],
            phoneticHint: "sun - flow - er",
            picture: "🌻",
            pictureLabel: "Sunflower",
            hint: "Say Sunflower: Sun + Flower! 🌻",
          },
          {
            id: "6-1-q2",
            type: "image_select",
            prompt: "Which picture is Butterfly?",
            targetWord: "BUTTERFLY",
            imageChoices: [
              { label: "Sunflower", emoji: "🌻", audio: "Sunflower" },
              { label: "Butterfly", emoji: "🦋", audio: "Butterfly" },
              { label: "Rainbow", emoji: "🌈", audio: "Rainbow" },
            ],
            answer: "Butterfly",
            hint: "Butterfly flutters with pretty wings! 🦋",
          },
          {
            id: "6-1-q3",
            type: "letter_build",
            prompt: "Spell the word: Rain",
            targetWord: "RAIN",
            picture: "🌧️",
            pictureLabel: "Rain",
            letterBank: ["R", "A", "I", "N"],
            answer: "RAIN",
            hint: "R - A - I - N spells Rain! 🌧️",
          },
          {
            id: "6-1-q4",
            type: "word_select",
            prompt: "Which word says Starfish?",
            picture: "⭐",
            choices: ["Starfish", "Goldfish", "Jellyfish"],
            answer: "Starfish",
            hint: "Star + Fish = Starfish! ⭐",
          },
          {
            id: "6-1-q5",
            type: "speak_loud",
            prompt: "Read out loud: Rainbow",
            targetWord: "RAINBOW",
            syllables: ["Rain", "bow"],
            phoneticHint: "rain - bow",
            picture: "🌈",
            pictureLabel: "Rainbow",
            hint: "Say Rainbow: Rain + Bow! 🌈",
          },
          {
            id: "6-1-q6",
            type: "sentence_read",
            prompt: "Read out loud: I see a big rainbow.",
            sentence: "I see a big rainbow.",
            tokens: ["I", "see", "a", "big", "rainbow."],
            hint: "I see a big rainbow! 🌈",
          },
        ],
      },
      {
        id: "6-2",
        unitId: 6,
        lessonNumber: 2,
        title: "Sweet Words & Story Time",
        subtitle: "Cupcake, Snowman & Story Sentences",
        icon: "🧁",
        targetLetters: ["compound", "stories"],
        xp: 25,
        gemsReward: 10,
        questions: [
          {
            id: "6-2-q1",
            type: "speak_loud",
            prompt: "Read out loud: Cupcake",
            targetWord: "CUPCAKE",
            syllables: ["Cup", "cake"],
            phoneticHint: "cup - cake",
            picture: "🧁",
            pictureLabel: "Cupcake",
            hint: "Say Cupcake: Cup + Cake! 🧁",
          },
          {
            id: "6-2-q2",
            type: "image_select",
            prompt: "Which picture is Pancake?",
            targetWord: "PANCAKE",
            imageChoices: [
              { label: "Cupcake", emoji: "🧁", audio: "Cupcake" },
              { label: "Pancake", emoji: "🥞", audio: "Pancake" },
              { label: "Snowman", emoji: "☃️", audio: "Snowman" },
            ],
            answer: "Pancake",
            hint: "Pan + Cake = Pancake! 🥞",
          },
          {
            id: "6-2-q3",
            type: "letter_build",
            prompt: "Spell the word: Snow",
            targetWord: "SNOW",
            picture: "❄️",
            pictureLabel: "Snow",
            letterBank: ["S", "N", "O", "W"],
            answer: "SNOW",
            hint: "S - N - O - W spells Snow! ❄️",
          },
          {
            id: "6-2-q4",
            type: "word_select",
            prompt: "Which word says Firefly?",
            picture: "🪲",
            choices: ["Firefly", "Dragonfly", "Housefly"],
            answer: "Firefly",
            hint: "Fire + Fly = Firefly! 🪲",
          },
          {
            id: "6-2-q5",
            type: "speak_loud",
            prompt: "Read out loud: Snowman",
            targetWord: "SNOWMAN",
            syllables: ["Snow", "man"],
            phoneticHint: "snow - man",
            picture: "☃️",
            pictureLabel: "Snowman",
            hint: "Say Snowman: Snow + Man! ☃️",
          },
          {
            id: "6-2-q6",
            type: "sentence_read",
            prompt: "Read out loud: We make a snowman.",
            sentence: "We make a snowman.",
            tokens: ["We", "make", "a", "snowman."],
            hint: "We make a snowman! ☃️",
          },
        ],
      },
    ],
  },
];

// ---------------------------------------------------------
// BIRDBRAIN ADAPTIVE ENGINE (Duolingo AI Model for LumiLex)
// ---------------------------------------------------------

/**
 * Retrieves the child's progress across all lesson units
 */
export function getChildUnitProgress(progressData = null) {
  const levelsObj = progressData?.levels || {};
  let totalLessons = 0;
  let completedCount = 0;
  let currentActiveLesson = null;

  const unitsWithStatus = DUO_UNITS.map((unit, unitIdx) => {
    let unitCompleted = true;
    let unitStars = 0;

    const lessonsWithStatus = unit.lessons.map((lesson, lessonIdx) => {
      totalLessons += 1;
      const lessonKey = lesson.id;
      const saved = levelsObj[lessonKey] || {};
      const isDone = !!saved.completed;

      if (isDone) {
        completedCount += 1;
        unitStars += (saved.stars || 3);
      } else {
        unitCompleted = false;
      }

      // Determine unlock state:
      // First lesson of unit 1 is always unlocked.
      // Otherwise, unlocked if previous lesson is completed.
      let isUnlocked = false;
      if (unitIdx === 0 && lessonIdx === 0) {
        isUnlocked = true;
      } else if (lessonIdx > 0) {
        const prevKey = unit.lessons[lessonIdx - 1].id;
        isUnlocked = !!levelsObj[prevKey]?.completed;
      } else if (unitIdx > 0) {
        const prevUnitLastKey = DUO_UNITS[unitIdx - 1].lessons.slice(-1)[0].id;
        isUnlocked = !!levelsObj[prevUnitLastKey]?.completed;
      }

      const isCurrent = isUnlocked && !isDone && !currentActiveLesson;
      if (isCurrent) {
        currentActiveLesson = { ...lesson, unitNumber: unit.unitNumber, unitTitle: unit.title };
      }

      return {
        ...lesson,
        isCompleted: isDone,
        isUnlocked,
        isCurrent: isCurrent,
        stars: saved.stars || (isDone ? 3 : 0),
        accuracy: saved.accuracy || 0,
      };
    });

    return {
      ...unit,
      isCompleted: unitCompleted && lessonsWithStatus.every((l) => l.isCompleted),
      totalStars: unitStars,
      lessons: lessonsWithStatus,
    };
  });

  // If all completed, current is the last lesson
  if (!currentActiveLesson && unitsWithStatus[0]?.lessons[0]) {
    currentActiveLesson = unitsWithStatus[0].lessons[0];
  }

  const overallPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  return {
    units: unitsWithStatus,
    completedCount,
    totalLessons,
    overallPercent,
    currentActiveLesson,
  };
}

/**
 * Birdbrain Engine: Generates a tailored 4-5 question lesson session
 * - Injects targeted spaced repetition questions from active mistakes
 * - Adjusts difficulty mode ('supported', 'standard', 'boost')
 * - Explains Birdbrain's AI reasoning for child & parents
 */
export function generateBirdbrainLesson({
  targetLessonId = null,
  userId = null,
  mistakesMap = {},
  errorTracker = null,
}) {
  const tracker = errorTracker || getErrorTrackerState(userId);

  // 1. Find the requested lesson or current next active lesson
  const allLessons = DUO_UNITS.flatMap((u) => u.lessons.map((l) => ({ ...l, unit: u })));
  let baseLesson = allLessons.find((l) => l.id === targetLessonId);
  if (!baseLesson) {
    const progress = getChildUnitProgress();
    baseLesson = progress.currentActiveLesson || allLessons[0];
  }

  const baseQuestions = [...(baseLesson.questions || [])];

  // 2. Identify active tricky mistakes for this child
  const rawMistakes = Object.values(mistakesMap || tracker.mistakes || {});
  const activeMistakes = rawMistakes
    .filter((m) => !m.mastered && (m.count > 0 || m.mistake_count > 0))
    .sort((a, b) => (b.count || b.mistake_count || 0) - (a.count || a.mistake_count || 0));

  // 3. Determine Adaptive Intensity Mode
  const recents = tracker.recentAccuracies || [];
  let adaptiveMode = "standard";
  let birdbrainMessage = `Birdbrain tailored this lesson for you! Starts with ${baseLesson.title}.`;

  if (recents.length > 0) {
    const avg = recents.reduce((a, b) => a + b, 0) / recents.length;
    if (avg >= 90) {
      adaptiveMode = "boost";
      birdbrainMessage = `⚡ Challenger Mode Active: You have ${Math.round(avg)}% accuracy! Birdbrain added bonus diamond challenges.`;
    } else if (avg < 72) {
      adaptiveMode = "supported";
      birdbrainMessage = `🌱 Nurture Mode: Extra picture helpers and slower audio pronunciation enabled to support your reading power.`;
    }
  }

  // 4. Weave 1-2 Spaced Repetition questions from mistakes if relevant
  const tailoredQuestions = [];
  let reviewItemUsed = null;

  if (activeMistakes.length > 0) {
    const topMistake = activeMistakes[0];
    if (topMistake.questionData) {
      reviewItemUsed = topMistake.key || topMistake.item_key;
      // Mark as Birdbrain targeted review question
      const reviewQ = {
        ...topMistake.questionData,
        isBirdbrainReview: true,
        birdbrainBadge: `Targeted Review: Friendly ${reviewItemUsed}`,
      };
      tailoredQuestions.push(reviewQ);
      birdbrainMessage = `🧠 Birdbrain spaced-repetition active: Reviewing tricky friend '${reviewItemUsed}' with friendly hints!`;
    }
  }

  // 5. Fill remaining slots from base curriculum to include rich reading exercises
  baseQuestions.forEach((q) => {
    // Avoid exact duplicate
    if (!tailoredQuestions.some((tq) => tq.prompt === q.prompt)) {
      if (tailoredQuestions.length < 6) {
        tailoredQuestions.push(q);
      }
    }
  });

  // Fallback if needed
  if (tailoredQuestions.length < 5) {
    tailoredQuestions.push(...baseQuestions.slice(0, 5 - tailoredQuestions.length));
  }

  return {
    lesson: baseLesson,
    unit: baseLesson.unit,
    questions: tailoredQuestions,
    adaptiveMode,
    birdbrainMessage,
    reviewItemUsed,
    trickyCount: activeMistakes.length,
    estimatedMinutes: 2,
  };
}

/**
 * Record completion of a Duolingo lesson:
 * - Updates lesson node status in PostgreSQL via sync-progress
 * - Awards effort stars & gems
 * - Updates mistake mastery
 */
export async function finishBirdbrainLesson({
  lessonId,
  unitId,
  accuracy,
  mistakesCount,
  userId = null,
}) {
  const starsEarned = accuracy === 100 ? 3 : accuracy >= 75 ? 2 : 1;
  const isPerfect = accuracy === 100 && mistakesCount === 0;
  const gemsAwarded = isPerfect ? 8 : 4;

  const currentLearning = getLearningState(userId);
  const levelsMap = { ...(currentLearning.levels || {}) };

  // Mark lesson completed
  levelsMap[lessonId] = {
    completed: true,
    stars: starsEarned,
    accuracy,
    completedAt: new Date().toISOString(),
  };

  const newStars = (currentLearning.stars || 0) + starsEarned;
  const newSessions = (currentLearning.completedSessions || 0) + 1;
  const newGardenPoints = (currentLearning.gardenPoints || 0) + 15; // 15 watering points for the magical tree

  const updatedProgress = {
    ...currentLearning,
    stars: newStars,
    completedSessions: newSessions,
    gardenPoints: newGardenPoints,
    levels: levelsMap,
  };

  setLearningStateLocally(updatedProgress, userId);

  // Sync to PostgreSQL backend
  if (typeof window !== "undefined") {
    try {
      await fetch("http://localhost:5000/api/learning/sync-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          stars: newStars,
          currentLevel: Math.max(currentLearning.currentLevel || 1, unitId || 1),
          gardenPoints: newGardenPoints,
          completedStories: currentLearning.completedStories || 0,
          completedSessions: newSessions,
          badges: currentLearning.badges || [],
          levels: levelsMap,
        }),
      });

      await fetch("http://localhost:5000/api/learning/complete-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ accuracy, mistakesCount }),
      });
    } catch (err) {
      console.warn("Background lesson sync error:", err.message);
    }
  }

  return {
    starsEarned,
    gemsAwarded,
    isPerfect,
    newStars,
    newGardenPoints,
  };
}
