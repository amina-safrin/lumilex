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
        subtitle: "Apple, Ball & Cat",
        icon: "🍎",
        targetLetters: ["A", "B", "C"],
        xp: 15,
        gemsReward: 5,
        questions: [
          {
            id: "1-1-q1",
            type: "letter_match",
            prompt: "Apple begins with which friendly letter?",
            letter: "A",
            picture: "🍎",
            pictureLabel: "Apple",
            audioPrompt: "Apple starts with the short ah sound. Can you find letter A?",
            choices: ["A", "B", "C"],
            answer: "A",
            hint: "Say apple slowly: a-pple. A is for Apple! 🍎",
            hintSpeech: "Apple starts with the ah sound. A is for Apple!",
          },
          {
            id: "1-1-q2",
            type: "letter_match",
            prompt: "Which letter matches the bouncing ball?",
            letter: "B",
            picture: "⚽",
            pictureLabel: "Ball",
            audioPrompt: "Ball bounces with a buh sound. Find letter B!",
            choices: ["D", "B", "P"],
            answer: "B",
            hint: "B has a big round belly in front! ⚽",
            hintSpeech: "B has a round belly. B is for Ball!",
          },
          {
            id: "1-1-q3",
            type: "letter_match",
            prompt: "Cat starts with which curled letter?",
            letter: "C",
            picture: "🐱",
            pictureLabel: "Cat",
            audioPrompt: "Cat begins with the kuh sound. Which letter curls like a sleeping cat?",
            choices: ["O", "C", "G"],
            answer: "C",
            hint: "Letter C curls like a cozy cat! 🐱",
            hintSpeech: "C curls like a cozy kitten. C is for Cat!",
          },
          {
            id: "1-1-q4",
            type: "case_match",
            prompt: "Match the lowercase 'a' to its uppercase friend:",
            letter: "A",
            picture: "🌟",
            pictureLabel: "Letter A",
            audioPrompt: "Find the big capital letter A!",
            choices: ["B", "A", "C"],
            answer: "A",
            hint: "Big A looks like a tall tent with a belt! ⛺",
            hintSpeech: "Big A has two tall sides and a bridge across.",
          },
        ],
      },
      {
        id: "1-2",
        unitId: 1,
        lessonNumber: 2,
        title: "Letters D, E, F, G",
        subtitle: "Dog, Egg, Fish & Garden",
        icon: "🐶",
        targetLetters: ["D", "E", "F", "G"],
        xp: 15,
        gemsReward: 5,
        questions: [
          {
            id: "1-2-q1",
            type: "letter_match",
            prompt: "Dog begins with which letter?",
            letter: "D",
            picture: "🐶",
            pictureLabel: "Dog",
            audioPrompt: "Dog starts with a happy duh sound. Which letter is D?",
            choices: ["B", "D", "P"],
            answer: "D",
            hint: "Letter d has a tall door and a round diaper behind! 🐶",
            hintSpeech: "D has a tall stick and round back. D is for Dog!",
          },
          {
            id: "1-2-q2",
            type: "letter_match",
            prompt: "Which letter starts the word Egg?",
            letter: "E",
            picture: "🥚",
            pictureLabel: "Egg",
            audioPrompt: "Egg starts with the short eh sound. Find letter E!",
            choices: ["E", "F", "L"],
            answer: "E",
            hint: "Capital E has three cheerful shelves! 🥚",
            hintSpeech: "Letter E makes the short eh sound for Egg.",
          },
          {
            id: "1-2-q3",
            type: "letter_match",
            prompt: "Fish swims with which letter?",
            letter: "F",
            picture: "🐟",
            pictureLabel: "Fish",
            audioPrompt: "Fish starts with a gentle fff breeze. Tap letter F!",
            choices: ["T", "E", "F"],
            answer: "F",
            hint: "Letter F has two swimming fins! 🐟",
            hintSpeech: "F makes the soft fff sound. F is for Fish!",
          },
          {
            id: "1-2-q4",
            type: "letter_match",
            prompt: "Garden grows with which letter?",
            letter: "G",
            picture: "🌿",
            pictureLabel: "Garden",
            audioPrompt: "Garden starts with a gentle guh sound. Tap letter G!",
            choices: ["C", "G", "O"],
            answer: "G",
            hint: "Letter G curves like C with a little garden bench inside! 🌿",
            hintSpeech: "G makes the guh sound for Garden.",
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
            type: "sound_listen",
            prompt: "Which word starts with the sound m?",
            picture: "🥛",
            pictureLabel: "Milk",
            audioPrompt: "Listen to the sound: m. Which word begins with m?",
            choices: ["Milk", "Silk", "Book"],
            answer: "Milk",
            hint: "Say mmmm... Milk! Both lips come together. 🥛",
            hintSpeech: "Milk starts with the m sound.",
          },
          {
            id: "2-1-q2",
            type: "sound_listen",
            prompt: "Which word begins with the sound s?",
            picture: "🧦",
            pictureLabel: "Sock",
            audioPrompt: "Listen: s. Which word begins with s?",
            choices: ["Sock", "Rock", "Lock"],
            answer: "Sock",
            hint: "Sssss-ock! Gentle air through teeth. 🧦",
            hintSpeech: "Sock starts with the s sound.",
          },
          {
            id: "2-1-q3",
            type: "phoneme_id",
            prompt: "What sound does letter M make?",
            picture: "🐵",
            pictureLabel: "Monkey",
            audioPrompt: "What sound does letter M make?",
            choices: ["m", "s", "p"],
            answer: "m",
            hint: "M makes the humming m sound! 🐵",
            hintSpeech: "M makes the m sound like something yummy.",
          },
          {
            id: "2-1-q4",
            type: "sound_listen",
            prompt: "Which picture starts with the sound s?",
            picture: "⭐",
            pictureLabel: "Star",
            audioPrompt: "Find the picture that starts with s!",
            choices: ["Star", "Moon", "Cloud"],
            answer: "Star",
            hint: "Sssss-tar shines bright in the night sky! ⭐",
            hintSpeech: "Star starts with s.",
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
            type: "reversal_anchor",
            prompt: "Look at letter 'b'. Where is its round tummy?",
            picture: "🛏️",
            pictureLabel: "b has belly in front",
            audioPrompt: "Look at letter b. Does b have its belly in front or diaper behind?",
            choices: ["Belly in front (facing right)", "Diaper behind (facing left)"],
            answer: "Belly in front (facing right)",
            hint: "Letter 'b' walks forward with its big round belly in front! 🛏️",
            hintSpeech: "b has its belly in front like a buttoned shirt.",
          },
          {
            id: "3-1-q2",
            type: "reversal_anchor",
            prompt: "Which letter is in the word 'dog'?",
            picture: "🐶",
            pictureLabel: "Dog",
            audioPrompt: "Dog starts with letter d. Find lowercase d!",
            choices: ["d", "b", "p"],
            answer: "d",
            hint: "Letter 'd' has its circle first on the left, then a tall door stick! 🐶",
            hintSpeech: "d has a circle first, then tall stick.",
          },
          {
            id: "3-1-q3",
            type: "reversal_anchor",
            prompt: "In the word 'bed', which letter comes first?",
            picture: "🛏️",
            pictureLabel: "b-e-d",
            audioPrompt: "Think of your hands making a bed: b on the left, d on the right!",
            choices: ["b", "d"],
            answer: "b",
            hint: "Left hand thumb up makes 'b' (the bed headboard)! 🛏️",
            hintSpeech: "b comes first on the left in bed.",
          },
          {
            id: "3-1-q4",
            type: "reversal_anchor",
            prompt: "Which letter starts the word 'ball'?",
            picture: "⚽",
            pictureLabel: "Ball",
            audioPrompt: "Ball starts with letter b. Tap the letter with the belly!",
            choices: ["b", "d", "q"],
            answer: "b",
            hint: "Stick first, then circle in front = 'b' for ball! ⚽",
            hintSpeech: "b has a stick first, then round belly.",
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
