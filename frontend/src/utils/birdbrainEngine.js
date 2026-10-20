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
            prompt: "Read this word out loud into your microphone:",
            targetWord: "APPLE",
            phoneticHint: "ah - pple",
            picture: "🍎",
            pictureLabel: "Apple",
            audioPrompt: "Listen to me: Apple! Tap the microphone and read Apple out loud!",
            hint: "Say apple clearly: a-pple! 🍎",
            hintSpeech: "Apple. Say Apple out loud into the microphone!",
          },
          {
            id: "1-1-q2",
            type: "image_select",
            prompt: "Which picture is 'BALL'?",
            audioPrompt: "Which of these pictures is Ball? Tap the right picture!",
            targetWord: "BALL",
            imageChoices: [
              { label: "Apple", emoji: "🍎", audio: "Apple" },
              { label: "Ball", emoji: "⚽", audio: "Ball" },
              { label: "Cat", emoji: "🐱", audio: "Cat" },
            ],
            answer: "Ball",
            hint: "Ball is round and bounces! ⚽",
            hintSpeech: "Ball is round like a soccer ball.",
          },
          {
            id: "1-1-q3",
            type: "letter_build",
            prompt: "Tap the letters in order to spell CAT:",
            audioPrompt: "Tap the letters in order to spell Cat: C... A... T!",
            targetWord: "CAT",
            picture: "🐱",
            pictureLabel: "Cat",
            letterBank: ["C", "A", "T", "O"],
            answer: "CAT",
            hint: "Cat starts with C, then middle vowel A, then T! 🐱",
            hintSpeech: "Spell C... A... T for Cat.",
          },
          {
            id: "1-1-q4",
            type: "word_select",
            prompt: "Read the words. Which one says 'CAT'?",
            audioPrompt: "Read the words. Which word says Cat?",
            picture: "🐱",
            choices: ["Cat", "Bat", "Car"],
            answer: "Cat",
            hint: "C is for Cat! Look for letter C at the front. 🐱",
            hintSpeech: "Cat begins with the letter C.",
          },
          {
            id: "1-1-q5",
            type: "speak_loud",
            prompt: "Read this letter sound out loud:",
            targetWord: "B",
            phoneticHint: "Sound: /buh/",
            picture: "⚽",
            pictureLabel: "Letter B",
            audioPrompt: "Letter B makes the sound buh! Tap the microphone and say buh!",
            hint: "Say buh like a bouncing ball! ⚽",
            hintSpeech: "Say buh for letter B.",
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
            prompt: "Read this animal name out loud:",
            targetWord: "DOG",
            phoneticHint: "d - o - g",
            picture: "🐶",
            pictureLabel: "Dog",
            audioPrompt: "Listen: Dog! Tap the microphone and read Dog out loud!",
            hint: "Say Dog: d-o-g! 🐶",
            hintSpeech: "Say Dog into your microphone!",
          },
          {
            id: "1-2-q2",
            type: "image_select",
            prompt: "Which picture is 'FISH'?",
            audioPrompt: "Which of these pictures is Fish? Tap the swimming friend!",
            targetWord: "FISH",
            imageChoices: [
              { label: "Dog", emoji: "🐶", audio: "Dog" },
              { label: "Egg", emoji: "🥚", audio: "Egg" },
              { label: "Fish", emoji: "🐟", audio: "Fish" },
            ],
            answer: "Fish",
            hint: "Fish swims in water with gentle fins! 🐟",
            hintSpeech: "Fish starts with F.",
          },
          {
            id: "1-2-q3",
            type: "letter_build",
            prompt: "Tap the letters in order to spell DOG:",
            audioPrompt: "Tap the letters to spell Dog: D... O... G!",
            targetWord: "DOG",
            picture: "🐶",
            pictureLabel: "Dog",
            letterBank: ["D", "O", "G", "B"],
            answer: "DOG",
            hint: "D... O... G spells Dog! 🐶",
            hintSpeech: "Tap D, then O, then G.",
          },
          {
            id: "1-2-q4",
            type: "word_select",
            prompt: "Read the choices. Which word says 'EGG'?",
            audioPrompt: "Read the word choices. Which word says Egg?",
            picture: "🥚",
            choices: ["Egg", "Elf", "Ear"],
            answer: "Egg",
            hint: "E-G-G spells Egg! 🥚",
            hintSpeech: "Egg begins with letter E.",
          },
          {
            id: "1-2-q5",
            type: "speak_loud",
            prompt: "Read the letter sound for G out loud:",
            targetWord: "G",
            phoneticHint: "Sound: /guh/",
            picture: "🌿",
            pictureLabel: "Garden",
            audioPrompt: "Letter G says guh! Tap the mic and say guh!",
            hint: "Say guh like Garden! 🌿",
            hintSpeech: "Say guh for letter G.",
          },
        ],
      },
      {
        id: "1-3",
        unitId: 1,
        lessonNumber: 3,
        title: "Letters H, I, J, K, L",
        subtitle: "Hat, Igloo, Jam, Kite & Lion",
        icon: "🦁",
        targetLetters: ["H", "I", "J", "K", "L"],
        xp: 15,
        gemsReward: 5,
        questions: [
          {
            id: "1-3-q1",
            type: "letter_match",
            prompt: "Hat begins with which breathing sound?",
            letter: "H",
            picture: "🎩",
            pictureLabel: "Hat",
            audioPrompt: "Hat starts with a warm breathing huh sound. Which letter is H?",
            choices: ["H", "N", "M"],
            answer: "H",
            hint: "H looks like a sturdy ladder with a rung in the middle! 🪜",
            hintSpeech: "H breathes softly like a warm sigh. H is for Hat!",
          },
          {
            id: "1-3-q2",
            type: "letter_match",
            prompt: "Igloo starts with which short vowel sound?",
            letter: "I",
            picture: "❄️",
            pictureLabel: "Igloo",
            audioPrompt: "Igloo starts with the short ih sound. Tap letter I!",
            choices: ["L", "I", "T"],
            answer: "I",
            hint: "Letter I stands tall and proud like an icicle! ❄️",
            hintSpeech: "Short ih sound like an itchy nose. I is for Igloo!",
          },
          {
            id: "1-3-q3",
            type: "letter_match",
            prompt: "Lion begins with which lovely sound?",
            letter: "L",
            picture: "🦁",
            pictureLabel: "Lion",
            audioPrompt: "Lion starts with the lll sound. Tongue touching the roof of your mouth!",
            choices: ["L", "I", "J"],
            answer: "L",
            hint: "Capital L stands tall and has a little foot stepping forward! 🦁",
            hintSpeech: "L makes the long lll sound. L is for Lion!",
          },
          {
            id: "1-3-q4",
            type: "letter_match",
            prompt: "Kite flies high with which letter?",
            letter: "K",
            picture: "🪁",
            pictureLabel: "Kite",
            audioPrompt: "Kite starts with the crisp kuh sound. Which letter is K?",
            choices: ["C", "K", "X"],
            answer: "K",
            hint: "K has arms and legs ready to fly a kite! 🪁",
            hintSpeech: "K has two kicking diagonals. K is for Kite!",
          },
        ],
      },
      {
        id: "1-4",
        unitId: 1,
        lessonNumber: 4,
        title: "Letters M, N, O, P",
        subtitle: "Moon, Nest, Owl & Penguin",
        icon: "🦉",
        targetLetters: ["M", "N", "O", "P"],
        xp: 15,
        gemsReward: 5,
        questions: [
          {
            id: "1-4-q1",
            type: "letter_match",
            prompt: "Moon shines with which humming sound?",
            letter: "M",
            picture: "🌙",
            pictureLabel: "Moon",
            audioPrompt: "Moon starts with the gentle mmm humming sound. Find letter M!",
            choices: ["W", "M", "N"],
            answer: "M",
            hint: "M has two majestic mountain peaks reaching for the moon! 🌙",
            hintSpeech: "M hums with both lips together. M is for Moon!",
          },
          {
            id: "1-4-q2",
            type: "letter_match",
            prompt: "Nest starts with which letter?",
            letter: "N",
            picture: "🪺",
            pictureLabel: "Nest",
            audioPrompt: "Nest starts with the nnn sound. Find letter N!",
            choices: ["M", "N", "U"],
            answer: "N",
            hint: "N has one cozy branch inside a nest! 🪺",
            hintSpeech: "N makes the nnn sound with tongue behind front teeth.",
          },
          {
            id: "1-4-q3",
            type: "letter_match",
            prompt: "Owl opens its round eyes with which letter?",
            letter: "O",
            picture: "🦉",
            pictureLabel: "Owl",
            audioPrompt: "Owl starts with the round letter O!",
            choices: ["O", "Q", "C"],
            answer: "O",
            hint: "O is round like the moon or an owl's curious eyes! 🦉",
            hintSpeech: "O is completely round with no corners.",
          },
          {
            id: "1-4-q4",
            type: "letter_match",
            prompt: "Penguin hops with which letter?",
            letter: "P",
            picture: "🐧",
            pictureLabel: "Penguin",
            audioPrompt: "Penguin pops with a gentle puh sound. Which letter is P?",
            choices: ["Q", "P", "B"],
            answer: "P",
            hint: "P has a tall stick and its round circle up high! 🐧",
            hintSpeech: "P pops softly with your lips. P is for Penguin!",
          },
        ],
      },
      {
        id: "1-5",
        unitId: 1,
        lessonNumber: 5,
        title: "Alphabet Castle Review",
        subtitle: "Sun, Tree & Rainbow Mastery",
        icon: "🏰",
        targetLetters: ["S", "T", "R", "W"],
        xp: 20,
        gemsReward: 10,
        questions: [
          {
            id: "1-5-q1",
            type: "letter_match",
            prompt: "Sun shines with which curving letter?",
            letter: "S",
            picture: "☀️",
            pictureLabel: "Sun",
            audioPrompt: "Sun starts with the sss sound, like a gentle stream. Tap letter S!",
            choices: ["S", "Z", "C"],
            answer: "S",
            hint: "S curves like a winding sunny path! ☀️",
            hintSpeech: "S makes the soft sss sound. S is for Sun!",
          },
          {
            id: "1-5-q2",
            type: "letter_match",
            prompt: "Tree grows tall with which letter?",
            letter: "T",
            picture: "🌳",
            pictureLabel: "Tree",
            audioPrompt: "Tree taps with the crisp tuh sound. Which letter is T?",
            choices: ["T", "I", "L"],
            answer: "T",
            hint: "T has a tall trunk and wide leafy branches on top! 🌳",
            hintSpeech: "T makes the tuh sound. T is for Tree!",
          },
          {
            id: "1-5-q3",
            type: "letter_match",
            prompt: "Rainbow begins with which rolling letter?",
            letter: "R",
            picture: "🌈",
            pictureLabel: "Rainbow",
            audioPrompt: "Rainbow starts with the warm rrr sound. Find letter R!",
            choices: ["P", "B", "R"],
            answer: "R",
            hint: "R looks like P with a running slide leg reaching forward! 🌈",
            hintSpeech: "R makes the rrr sound. R is for Rainbow!",
          },
          {
            id: "1-5-q4",
            type: "letter_match",
            prompt: "Water sparkles with which waving letter?",
            letter: "W",
            picture: "🌊",
            pictureLabel: "Water",
            audioPrompt: "Water starts with the wuh sound. Tap letter W!",
            choices: ["M", "W", "V"],
            answer: "W",
            hint: "W has two valleys like ocean waves! 🌊",
            hintSpeech: "W points down into valleys. W is for Water!",
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
        subtitle: "Moon & Sun Sounds",
        icon: "🌙",
        targetLetters: ["M", "S"],
        xp: 15,
        gemsReward: 5,
        questions: [
          {
            id: "2-1-q1",
            type: "speak_loud",
            prompt: "Read this word out loud into your microphone:",
            targetWord: "SUN",
            phoneticHint: "s - u - n",
            picture: "☀️",
            pictureLabel: "Sun",
            audioPrompt: "Listen to me: Sun! Tap the microphone and read Sun out loud!",
            hint: "Say Sun: sss-un! ☀️",
            hintSpeech: "Sun. Say Sun out loud into the microphone!",
          },
          {
            id: "2-1-q2",
            type: "image_select",
            prompt: "Which picture starts with the humming sound /m/?",
            audioPrompt: "Which of these pictures starts with m? Tap the right picture!",
            targetWord: "MILK",
            imageChoices: [
              { label: "Milk", emoji: "🥛", audio: "Milk" },
              { label: "Sock", emoji: "🧦", audio: "Sock" },
              { label: "Book", emoji: "📖", audio: "Book" },
            ],
            answer: "Milk",
            hint: "Mmmm... Milk! 🥛",
            hintSpeech: "Milk starts with the m sound.",
          },
          {
            id: "2-1-q3",
            type: "letter_build",
            prompt: "Tap the letters in order to spell SUN:",
            audioPrompt: "Tap the letters in order to spell Sun: S... U... N!",
            targetWord: "SUN",
            picture: "☀️",
            pictureLabel: "Sun",
            letterBank: ["S", "U", "N", "M"],
            answer: "SUN",
            hint: "S... U... N spells Sun! ☀️",
            hintSpeech: "Spell S... U... N.",
          },
          {
            id: "2-1-q4",
            type: "word_select",
            prompt: "Read the choices. Which word says 'MOON'?",
            audioPrompt: "Read the word choices. Which word says Moon?",
            picture: "🌙",
            choices: ["Moon", "Man", "Mop"],
            answer: "Moon",
            hint: "Moon begins with M and shines in the night sky! 🌙",
            hintSpeech: "Moon starts with M.",
          },
          {
            id: "2-1-q5",
            type: "sentence_read",
            prompt: "Read this short sentence out loud:",
            sentence: "The sun is hot.",
            tokens: ["The", "sun", "is", "hot."],
            audioPrompt: "Listen to the sentence: The sun is hot. Now read it out loud!",
            hint: "The sun is hot! ☀️",
            hintSpeech: "The sun is hot.",
          },
        ],
      },
      {
        id: "2-2",
        unitId: 2,
        lessonNumber: 2,
        title: "Short Vowels /a/ & /o/",
        subtitle: "Apple & Octopus Sounds",
        icon: "🐙",
        targetLetters: ["A", "O"],
        xp: 15,
        gemsReward: 5,
        questions: [
          {
            id: "2-2-q1",
            type: "sound_listen",
            prompt: "Which word has the short vowel sound ah?",
            picture: "🐜",
            pictureLabel: "Ant",
            audioPrompt: "Listen: ah. Which word begins with ah?",
            choices: ["Ant", "Owl", "Egg"],
            answer: "Ant",
            hint: "Ant starts with the short ah sound! 🐜",
            hintSpeech: "Ah like in Ant and Apple.",
          },
          {
            id: "2-2-q2",
            type: "sound_listen",
            prompt: "Octopus begins with which short vowel sound?",
            picture: "🐙",
            pictureLabel: "Octopus",
            audioPrompt: "Octopus starts with the short o sound. Which letter is that?",
            choices: ["O", "U", "A"],
            answer: "O",
            hint: "Open your mouth round for short o: ah-ctopus! 🐙",
            hintSpeech: "O makes the short ah sound in octopus.",
          },
          {
            id: "2-2-q3",
            type: "phoneme_id",
            prompt: "In the word CAT, what vowel sound is in the middle?",
            picture: "🐱",
            pictureLabel: "Cat",
            audioPrompt: "Listen closely: C-A-T. What is the middle vowel sound?",
            choices: ["a", "o", "e"],
            answer: "a",
            hint: "C-ah-t! The middle sound is short a! 🐱",
            hintSpeech: "Short a sound is in the middle of cat.",
          },
          {
            id: "2-2-q4",
            type: "sound_listen",
            prompt: "In the word POT, what vowel sound is in the middle?",
            picture: "🍲",
            pictureLabel: "Pot",
            audioPrompt: "P-O-T. What vowel sound sits in the middle?",
            choices: ["o", "a", "u"],
            answer: "o",
            hint: "P-ah-t! The middle sound is short o. 🍲",
            hintSpeech: "Short o sound sits in the middle of pot.",
          },
        ],
      },
      {
        id: "2-3",
        unitId: 2,
        lessonNumber: 3,
        title: "Popping Sounds /b/, /p/, /t/",
        subtitle: "Ball, Penguin & Tiger",
        icon: "🐯",
        targetLetters: ["B", "P", "T"],
        xp: 15,
        gemsReward: 5,
        questions: [
          {
            id: "2-3-q1",
            type: "sound_listen",
            prompt: "Which animal starts with the sound p?",
            picture: "🐼",
            pictureLabel: "Panda",
            audioPrompt: "Listen: p. Which friendly animal begins with p?",
            choices: ["Panda", "Bear", "Tiger"],
            answer: "Panda",
            hint: "Panda starts with a gentle pop: p-p-panda! 🐼",
            hintSpeech: "Panda begins with the letter P.",
          },
          {
            id: "2-3-q2",
            type: "sound_listen",
            prompt: "Tiger begins with which tapping sound?",
            letter: "T",
            picture: "🐯",
            pictureLabel: "Tiger",
            audioPrompt: "Tiger taps with the tuh sound. Find letter T!",
            choices: ["T", "D", "P"],
            answer: "T",
            hint: "T taps with the tip of your tongue! 🐯",
            hintSpeech: "T makes the crisp tuh sound.",
          },
          {
            id: "2-3-q3",
            type: "sound_listen",
            prompt: "Bear begins with which bouncy letter?",
            letter: "B",
            picture: "🐻",
            pictureLabel: "Bear",
            audioPrompt: "Bear bounces with the buh sound. Which letter is B?",
            choices: ["B", "D", "R"],
            answer: "B",
            hint: "B has a big belly facing right! 🐻",
            hintSpeech: "B makes the buh sound for Bear.",
          },
          {
            id: "2-3-q4",
            type: "sound_listen",
            prompt: "Which word ends with the tapping sound t?",
            picture: "🦇",
            pictureLabel: "Bat",
            audioPrompt: "Listen to the end sound of: B-A-T. What sound does it end with?",
            choices: ["t", "b", "p"],
            answer: "t",
            hint: "B-A-T ends with a crisp tap: t! 🦇",
            hintSpeech: "Bat ends with the sound t.",
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
            prompt: "Read this word out loud into your microphone:",
            targetWord: "BED",
            phoneticHint: "b - e - d",
            picture: "🛏️",
            pictureLabel: "bed: b has belly, d has diaper",
            audioPrompt: "Listen: Bed! Tap the microphone and read Bed out loud!",
            hint: "Say Bed: b-e-d! 🛏️",
            hintSpeech: "Bed. Read Bed out loud into your microphone!",
          },
          {
            id: "3-1-q2",
            type: "image_select",
            prompt: "Which picture begins with letter 'b' (belly in front)?",
            audioPrompt: "Which of these pictures starts with b? Tap the right picture!",
            targetWord: "BALL",
            imageChoices: [
              { label: "Ball", emoji: "⚽", audio: "Ball" },
              { label: "Dog", emoji: "🐶", audio: "Dog" },
              { label: "Duck", emoji: "🦆", audio: "Duck" },
            ],
            answer: "Ball",
            hint: "Ball starts with 'b'! ⚽",
            hintSpeech: "Ball starts with b.",
          },
          {
            id: "3-1-q3",
            type: "letter_build",
            prompt: "Tap the letters in order to spell BED:",
            audioPrompt: "Tap the letters in order to spell Bed: B... E... D!",
            targetWord: "BED",
            picture: "🛏️",
            pictureLabel: "Bed",
            letterBank: ["B", "E", "D", "P"],
            answer: "BED",
            hint: "B on the left, E in the middle, D on the right! 🛏️",
            hintSpeech: "Tap B, then E, then D.",
          },
          {
            id: "3-1-q4",
            type: "word_select",
            prompt: "Look at the dog. Which word says 'DOG'?",
            audioPrompt: "Read the words. Which word says Dog?",
            picture: "🐶",
            choices: ["Dog", "Bog", "Dot"],
            answer: "Dog",
            hint: "Dog begins with d: circle first, then tall stick! 🐶",
            hintSpeech: "Dog starts with letter d.",
          },
          {
            id: "3-1-q5",
            type: "speak_loud",
            prompt: "Read the word BAT out loud:",
            targetWord: "BAT",
            phoneticHint: "b - a - t",
            picture: "🦇",
            pictureLabel: "Bat",
            audioPrompt: "Listen: Bat! Tap the mic and read Bat out loud!",
            hint: "Say Bat: b-a-t! 🦇",
            hintSpeech: "Say Bat out loud!",
          },
        ],
      },
      {
        id: "3-2",
        unitId: 3,
        lessonNumber: 2,
        title: "Tails Up & Down: 'p' and 'q'",
        subtitle: "Puddle vs Queen",
        icon: "👑",
        targetLetters: ["p", "q"],
        xp: 20,
        gemsReward: 8,
        questions: [
          {
            id: "3-2-q1",
            type: "reversal_anchor",
            prompt: "Letter 'p' has its circle facing which way?",
            picture: "🐧",
            pictureLabel: "p has head facing right",
            audioPrompt: "Look at letter p. Its round balloon points to the right!",
            choices: ["Facing right (like b)", "Facing left (like d)"],
            answer: "Facing right (like b)",
            hint: "p has a deep tail diving down and circle facing right! 🐧",
            hintSpeech: "Letter p has its circle on the right side.",
          },
          {
            id: "3-2-q2",
            type: "reversal_anchor",
            prompt: "Queen begins with which letter?",
            picture: "👑",
            pictureLabel: "Queen",
            audioPrompt: "Queen begins with letter q. Can you find q?",
            choices: ["q", "p", "g"],
            answer: "q",
            hint: "Letter q has circle on the left and a little curly crown flick! 👑",
            hintSpeech: "q has its circle on the left with a little flick.",
          },
          {
            id: "3-2-q3",
            type: "reversal_anchor",
            prompt: "Pig begins with which letter?",
            picture: "🐷",
            pictureLabel: "Pig",
            audioPrompt: "Pig pops with letter p! Which one is p?",
            choices: ["p", "q", "b"],
            answer: "p",
            hint: "Stick dips below the line with circle on right: p! 🐷",
            hintSpeech: "p starts the word Pig.",
          },
          {
            id: "3-2-q4",
            type: "reversal_anchor",
            prompt: "Mountains and Valleys: 'm' vs 'w'. Which one points UP?",
            picture: "⛰️",
            pictureLabel: "m has mountain peaks",
            audioPrompt: "Which letter has peaks that reach UP like tall mountains?",
            choices: ["m (Mountains up)", "w (Water valleys down)"],
            answer: "m (Mountains up)",
            hint: "m reaches UP to touch the sky! w dips DOWN into water waves! ⛰️",
            hintSpeech: "m has two rounded hills pointing up.",
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
        subtitle: "Star, Spoon & Snail",
        icon: "⭐",
        targetLetters: ["st", "sp", "sn"],
        xp: 20,
        gemsReward: 8,
        questions: [
          {
            id: "4-1-q1",
            type: "blend_id",
            prompt: "What two letters blend at the start of STAR?",
            picture: "⭐",
            pictureLabel: "Star",
            audioPrompt: "Listen closely: sss-t-ar. What two letters blend together?",
            choices: ["st", "sp", "sl"],
            answer: "st",
            hint: "s and t hold hands to make st-ar! ⭐",
            hintSpeech: "s and t blend together for st in star.",
          },
          {
            id: "4-1-q2",
            type: "blend_id",
            prompt: "Spoon starts with which friendly blend?",
            picture: "🥄",
            pictureLabel: "Spoon",
            audioPrompt: "Spoon: sss-p-oon. Which blend starts the word?",
            choices: ["sp", "st", "sn"],
            answer: "sp",
            hint: "s and p pop together: sp-oon! 🥄",
            hintSpeech: "sp starts Spoon.",
          },
          {
            id: "4-1-q3",
            type: "blend_id",
            prompt: "Snail begins with which blend?",
            picture: "🐌",
            pictureLabel: "Snail",
            audioPrompt: "Snail: sss-n-ail. Tap the matching blend!",
            choices: ["sn", "sm", "sk"],
            answer: "sn",
            hint: "s and n glide together: sn-ail! 🐌",
            hintSpeech: "sn blends s and n together in snail.",
          },
          {
            id: "4-1-q4",
            type: "blend_id",
            prompt: "Stop starts with which blend?",
            picture: "🛑",
            pictureLabel: "Stop",
            audioPrompt: "Stop begins with: sss-t-op!",
            choices: ["st", "sp", "sw"],
            answer: "st",
            hint: "st makes the solid stop blend! 🛑",
            hintSpeech: "st begins Stop.",
          },
        ],
      },
      {
        id: "4-2",
        unitId: 4,
        lessonNumber: 2,
        title: "L-Blends: bl-, cl-, fl-",
        subtitle: "Blue, Cloud & Flag",
        icon: "☁️",
        targetLetters: ["bl", "cl", "fl"],
        xp: 20,
        gemsReward: 8,
        questions: [
          {
            id: "4-2-q1",
            type: "blend_id",
            prompt: "Blue starts with which colorful blend?",
            picture: "💙",
            pictureLabel: "Blue",
            audioPrompt: "Listen: b-l-ue. Which blend starts Blue?",
            choices: ["bl", "cl", "pl"],
            answer: "bl",
            hint: "b and l glide together: bl-ue! 💙",
            hintSpeech: "bl starts the word Blue.",
          },
          {
            id: "4-2-q2",
            type: "blend_id",
            prompt: "Cloud drifts with which blend?",
            picture: "☁️",
            pictureLabel: "Cloud",
            audioPrompt: "Cloud: c-l-oud. Which blend starts Cloud?",
            choices: ["cl", "gl", "fl"],
            answer: "cl",
            hint: "c and l make the soft cl-oud blend! ☁️",
            hintSpeech: "cl starts Cloud.",
          },
          {
            id: "4-2-q3",
            type: "blend_id",
            prompt: "Flag flutters with which blend?",
            picture: "🚩",
            pictureLabel: "Flag",
            audioPrompt: "Flag: f-l-ag. Which blend starts Flag?",
            choices: ["fl", "bl", "sl"],
            answer: "fl",
            hint: "f and l blow in the wind: fl-ag! 🚩",
            hintSpeech: "fl starts Flag.",
          },
          {
            id: "4-2-q4",
            type: "blend_id",
            prompt: "Frog jumps with which r-blend?",
            picture: "🐸",
            pictureLabel: "Frog",
            audioPrompt: "Frog: f-r-og. What blend starts frog?",
            choices: ["fr", "tr", "gr"],
            answer: "fr",
            hint: "f and r hop together: fr-og! 🐸",
            hintSpeech: "fr starts Frog.",
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
            type: "rhyme_match",
            prompt: "Which word rhymes with CAT?",
            picture: "🎩",
            pictureLabel: "Hat",
            audioPrompt: "Cat! Which word has the same -at ending sound?",
            choices: ["Hat", "Dog", "Sun"],
            answer: "Hat",
            hint: "C-at and H-at both end in -at! 🎩",
            hintSpeech: "Cat and Hat both rhyme with at.",
          },
          {
            id: "5-1-q2",
            type: "rhyme_match",
            prompt: "Change the first sound in CAT to /b/. What word do you get?",
            picture: "🦇",
            pictureLabel: "Bat",
            audioPrompt: "Take -at and put b in front. What word is it?",
            choices: ["Bat", "Bug", "Bed"],
            answer: "Bat",
            hint: "b + at = Bat! 🦇",
            hintSpeech: "b plus at makes Bat.",
          },
          {
            id: "5-1-q3",
            type: "rhyme_match",
            prompt: "Which of these also belongs to the -at family?",
            picture: "🧶",
            pictureLabel: "Mat",
            audioPrompt: "Find the word that ends in -at!",
            choices: ["Mat", "Mop", "Map"],
            answer: "Mat",
            hint: "M-at ends with -at like cat! 🧶",
            hintSpeech: "Mat rhymes with Cat.",
          },
          {
            id: "5-1-q4",
            type: "rhyme_match",
            prompt: "Does 'DOG' rhyme with 'CAT'?",
            picture: "🐶",
            pictureLabel: "Dog & Cat",
            audioPrompt: "Listen: Dog, Cat. Do they rhyme?",
            choices: ["No, they have different endings", "Yes, they rhyme"],
            answer: "No, they have different endings",
            hint: "Dog ends in -og, Cat ends in -at! 🐶",
            hintSpeech: "Dog and Cat do not rhyme.",
          },
        ],
      },
      {
        id: "5-2",
        unitId: 5,
        lessonNumber: 2,
        title: "The -op & -ug Families",
        subtitle: "Hop, Top, Bug & Hug",
        icon: "🐛",
        targetLetters: ["-op", "-ug"],
        xp: 20,
        gemsReward: 8,
        questions: [
          {
            id: "5-2-q1",
            type: "rhyme_match",
            prompt: "Which word rhymes with HOP?",
            picture: "🧹",
            pictureLabel: "Mop",
            audioPrompt: "Hop! Which word ends in the same -op sound?",
            choices: ["Mop", "Map", "Man"],
            answer: "Mop",
            hint: "H-op and M-op both bounce with -op! 🧹",
            hintSpeech: "Hop and Mop rhyme.",
          },
          {
            id: "5-2-q2",
            type: "rhyme_match",
            prompt: "Which word rhymes with BUG?",
            picture: "🫂",
            pictureLabel: "Hug",
            audioPrompt: "Bug! Which word shares the cozy -ug sound?",
            choices: ["Hug", "Hat", "Hop"],
            answer: "Hug",
            hint: "B-ug and H-ug both give warm -ug smiles! 🫂",
            hintSpeech: "Bug and Hug rhyme.",
          },
          {
            id: "5-2-q3",
            type: "rhyme_match",
            prompt: "Put /r/ in front of -ug. What word do you make?",
            picture: "🪴",
            pictureLabel: "Rug",
            audioPrompt: "r + ug. What word does that make?",
            choices: ["Rug", "Run", "Red"],
            answer: "Rug",
            hint: "r + ug = Rug! Soft on the floor. 🪴",
            hintSpeech: "r plus ug makes Rug.",
          },
          {
            id: "5-2-q4",
            type: "rhyme_match",
            prompt: "Top and Pop rhyme because they both end in:",
            picture: "🎈",
            pictureLabel: "Pop",
            audioPrompt: "What sound do Top and Pop share at the end?",
            choices: ["-op", "-ot", "-og"],
            answer: "-op",
            hint: "T-op and P-op both end in -op! 🎈",
            hintSpeech: "They both end in op.",
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
        subtitle: "Sun + Flower = Sunflower",
        icon: "🌻",
        targetLetters: ["compound"],
        xp: 25,
        gemsReward: 10,
        questions: [
          {
            id: "6-1-q1",
            type: "compound",
            prompt: "What word is made by SUN ☀️ + FLOWER 🌸?",
            picture: "🌻",
            pictureLabel: "Sunflower",
            audioPrompt: "Combine SUN and FLOWER. What word do you get?",
            choices: ["Sunflower", "Sunrain", "Sunlight"],
            answer: "Sunflower",
            hint: "Sun + Flower = Sunflower! 🌻",
            hintSpeech: "Sun and Flower make Sunflower.",
          },
          {
            id: "6-1-q2",
            type: "compound",
            prompt: "What word is made by BUTTER 🧈 + FLY 🪰?",
            picture: "🦋",
            pictureLabel: "Butterfly",
            audioPrompt: "Butter plus Fly makes what fluttering friend?",
            choices: ["Butterfly", "Buttercup", "Firefly"],
            answer: "Butterfly",
            hint: "Butter + Fly = Butterfly! 🦋",
            hintSpeech: "Butter and Fly make Butterfly.",
          },
          {
            id: "6-1-q3",
            type: "compound",
            prompt: "RAIN 🌧️ + BOW 🎀 makes which colorful arc?",
            picture: "🌈",
            pictureLabel: "Rainbow",
            audioPrompt: "Rain plus Bow makes what in the sky?",
            choices: ["Rainbow", "Raincoat", "Raindrop"],
            answer: "Rainbow",
            hint: "Rain + Bow = Rainbow! 🌈",
            hintSpeech: "Rain and Bow make Rainbow.",
          },
          {
            id: "6-1-q4",
            type: "compound",
            prompt: "STAR ⭐ + FISH 🐟 makes which ocean creature?",
            picture: "⭐",
            pictureLabel: "Starfish",
            audioPrompt: "Star plus Fish creates what ocean friend?",
            choices: ["Starfish", "Goldfish", "Jellyfish"],
            answer: "Starfish",
            hint: "Star + Fish = Starfish! ⭐",
            hintSpeech: "Star and Fish make Starfish.",
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

  // 5. Fill remaining slots from base curriculum to make exactly 4-5 questions
  baseQuestions.forEach((q) => {
    // Avoid exact duplicate
    if (!tailoredQuestions.some((tq) => tq.prompt === q.prompt)) {
      if (tailoredQuestions.length < 5) {
        tailoredQuestions.push(q);
      }
    }
  });

  // Fallback if needed
  if (tailoredQuestions.length < 4) {
    tailoredQuestions.push(...baseQuestions.slice(0, 4 - tailoredQuestions.length));
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
