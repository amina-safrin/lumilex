// =========================================================
// LUMILEX DYSLEXIA-FRIENDLY PHONICS & LEARNING REWARDS
// Built specifically for young readers with dyslexia:
// - Multisensory: visual picture mnemonics + audio pronunciation
// - Anti-reversal letter anchors (b vs d, p vs q)
// - Gradual progression: Letters -> Sounds -> Blends -> Families -> Compound Words -> Sentences
// - Positive reinforcement: effort stars, badges, growing garden
// =========================================================

const BASE_STORAGE_KEY = "lumilex_learning_rewards_v2";
const BASE_LEGACY_STARS_KEY = "lumilex_stars";

// Per-child storage keys — scoped by userId
function storageKey(userId) {
  return userId ? `${BASE_STORAGE_KEY}_${userId}` : BASE_STORAGE_KEY;
}
function legacyStarsKey(userId) {
  return userId ? `${BASE_LEGACY_STARS_KEY}_${userId}` : BASE_LEGACY_STARS_KEY;
}

// Keep non-parameterised exports for backward compatibility (Dashboard currently calls these)
const STORAGE_KEY = BASE_STORAGE_KEY;
const LEGACY_STARS_KEY = BASE_LEGACY_STARS_KEY;

export const LEARNING_LEVELS = [
  // -------------------------------------------------------
  // LEVEL 1: Alphabet Picture Garden
  // Remember letters through vivid, memorable visual anchors.
  // -------------------------------------------------------
  {
    id: 1,
    title: "Alphabet Picture Garden",
    subtitle: "Remember letters with friendly picture friends",
    icon: "🍎",
    skill: "Alphabet & visual letter memory",
    description: "Look at the picture, hear its friendly name, and spot the letter that starts the word.",
    questions: [
      {
        prompt: "Apple begins with which letter?",
        picture: "🍎",
        pictureLabel: "Apple",
        choices: ["A", "B", "C"],
        answer: "A",
        hint: "Say apple slowly: /a/pple. A is for Apple! 🍎",
        letter: "A",
        soundExamples: [
          { label: "A", word: "apple" },
          { label: "B", word: "ball" },
          { label: "C", word: "cat" }
        ]
      },
      {
        prompt: "Look at the bouncy Ball! Which letter starts Ball?",
        picture: "⚽",
        pictureLabel: "Ball",
        choices: ["B", "D", "P"],
        answer: "B",
        hint: "B has a big bouncy belly in front, just like a Ball! /b/ Ball. ⚽",
        letter: "B",
        soundExamples: [
          { label: "B", word: "ball" },
          { label: "D", word: "dog" },
          { label: "P", word: "pig" }
        ]
      },
      {
        prompt: "Find the letter for the cute sleeping Cat.",
        picture: "🐱",
        pictureLabel: "Cat",
        choices: ["C", "S", "O"],
        answer: "C",
        hint: "Letter C is curved like a cozy sleeping cat! /k/ Cat. 🐱",
        letter: "C",
        soundExamples: [
          { label: "C", word: "cat" },
          { label: "S", word: "sun" },
          { label: "O", word: "octopus" }
        ]
      },
      {
        prompt: "Here is a happy puppy Dog! Which letter is Dog?",
        picture: "🐶",
        pictureLabel: "Dog",
        choices: ["D", "B", "T"],
        answer: "D",
        hint: "Letter D has its round tummy on the left, waiting for a pet! /d/ Dog. 🐶",
        letter: "D",
        soundExamples: [
          { label: "D", word: "dog" },
          { label: "B", word: "ball" },
          { label: "T", word: "tree" }
        ]
      },
      {
        prompt: "Elephant starts with which big friendly letter?",
        picture: "🐘",
        pictureLabel: "Elephant",
        choices: ["E", "F", "L"],
        answer: "E",
        hint: "E is for Elephant! Hear /eh/ at the start. 🐘",
        letter: "E",
        soundExamples: [
          { label: "E", word: "elephant" },
          { label: "F", word: "fish" },
          { label: "L", word: "lion" }
        ]
      },
      {
        prompt: "Fish swims in the pond! Which letter begins Fish?",
        picture: "🐠",
        pictureLabel: "Fish",
        choices: ["F", "P", "T"],
        answer: "F",
        hint: "Blow gentle air for /f/: Fish starts with F! 🐠",
        letter: "F",
        soundExamples: [
          { label: "F", word: "fish" },
          { label: "P", word: "pig" },
          { label: "T", word: "tree" }
        ]
      },
      {
        prompt: "Sun shines so bright! Which warm letter starts Sun?",
        picture: "☀️",
        pictureLabel: "Sun",
        choices: ["S", "C", "Z"],
        answer: "S",
        hint: "S curves like sunshine: sss-sun! ☀️",
        letter: "S",
        soundExamples: [
          { label: "S", word: "sun" },
          { label: "C", word: "cat" },
          { label: "Z", word: "zebra" }
        ]
      },
      {
        prompt: "Moon glows at night! Which letter begins Moon?",
        picture: "🌙",
        pictureLabel: "Moon",
        choices: ["M", "W", "N"],
        answer: "M",
        hint: "Press your lips together for /m/: Moon starts with M! 🌙",
        letter: "M",
        soundExamples: [
          { label: "M", word: "moon" },
          { label: "W", word: "whale" },
          { label: "N", word: "nest" }
        ]
      }
    ]
  },

  // -------------------------------------------------------
  // LEVEL 2: Sound Safari & Letter Phonemes
  // Hear pure phonemes and distinguish sounds easily.
  // -------------------------------------------------------
  {
    id: 2,
    title: "Sound Safari",
    subtitle: "Listen, say it, and spot the friendly sound",
    icon: "🦁",
    skill: "Phonological awareness & letter sounds",
    description: "Listen to the letter sound and match it with its picture friend.",
    questions: [
      {
        prompt: "Which word begins with the gentle /m/ sound?",
        picture: "🌙",
        pictureLabel: "Listen for /m/",
        choices: ["Moon", "Cat", "Sun"],
        answer: "Moon",
        hint: "Mmm-moon! Your lips gently touch for /m/. 🌙",
        soundExamples: [
          { label: "/m/", word: "moon" },
          { label: "/k/", word: "cat" },
          { label: "/s/", word: "sun" }
        ]
      },
      {
        prompt: "Tap the picture that begins with the sunny /s/ sound.",
        picture: "☀️",
        pictureLabel: "Listen for /s/",
        choices: ["Sun", "Dog", "Pig"],
        answer: "Sun",
        hint: "Stretch the sound like gentle breeze: sssss-sun! ☀️",
        soundExamples: [
          { label: "/s/", word: "sun" },
          { label: "/d/", word: "dog" },
          { label: "/p/", word: "pig" }
        ]
      },
      {
        prompt: "Which word starts with the bouncy /b/ pop sound?",
        picture: "⚽",
        pictureLabel: "Listen for /b/",
        choices: ["Ball", "Dog", "Fish"],
        answer: "Ball",
        hint: "B is a bouncy bubble pop: b-b-ball! ⚽",
        soundExamples: [
          { label: "/b/", word: "ball" },
          { label: "/d/", word: "dog" },
          { label: "/f/", word: "fish" }
        ]
      },
      {
        prompt: "Listen: /d/ as in Dog. Which word starts with /d/?",
        picture: "🐶",
        pictureLabel: "Listen for /d/",
        choices: ["Dog", "Ball", "Cat"],
        answer: "Dog",
        hint: "Tap your tongue behind your teeth: /d/ /d/ Dog! 🐶",
        soundExamples: [
          { label: "/d/", word: "dog" },
          { label: "/b/", word: "ball" },
          { label: "/k/", word: "cat" }
        ]
      },
      {
        prompt: "Which word begins with the quick puff /p/?",
        picture: "🐷",
        pictureLabel: "Listen for /p/",
        choices: ["Pig", "Apple", "Leaf"],
        answer: "Pig",
        hint: "P is a light puff of air: p-p-pig! 🐷",
        soundExamples: [
          { label: "/p/", word: "pig" },
          { label: "/a/", word: "apple" },
          { label: "/l/", word: "leaf" }
        ]
      },
      {
        prompt: "Which letter makes the gentle /l/ sound in Leaf?",
        picture: "🍃",
        pictureLabel: "Leaf",
        choices: ["L", "M", "T"],
        answer: "L",
        hint: "Llll-leaf. Lift your tongue up for L! 🍃",
        soundExamples: [
          { label: "L", word: "leaf" },
          { label: "M", word: "moon" },
          { label: "T", word: "tree" }
        ]
      }
    ]
  },

  // -------------------------------------------------------
  // LEVEL 3: Sound Blenders (3-Letter CVC Words)
  // Sliding individual sounds into friendly little words.
  // -------------------------------------------------------
  {
    id: 3,
    title: "Little Word Blenders",
    subtitle: "Slide sounds together to build your first words",
    icon: "🧩",
    skill: "Sound blending (CVC words)",
    description: "Hear each individual sound, then smoothly slide them together into a whole word.",
    questions: [
      {
        prompt: "Slide /c/ /a/ /t/ together. What word does it make?",
        picture: "🐱",
        pictureLabel: "A furry cat",
        choices: ["Cat", "Cup", "Cot"],
        answer: "Cat",
        hint: "Say the sounds smoothly: c... a... t... Cat! 🐱",
        blendParts: ["/c/", "/a/", "/t/"],
        soundExamples: [
          { label: "/c/", word: "cat" },
          { label: "/a/", word: "apple" },
          { label: "/t/", word: "top" }
        ]
      },
      {
        prompt: "Put these sounds together: /s/ /u/ /n/.",
        picture: "☀️",
        pictureLabel: "Sunny sun",
        choices: ["Sun", "Sit", "Sap"],
        answer: "Sun",
        hint: "Slide them: sss-uuu-nnn... Sun! ☀️",
        blendParts: ["/s/", "/u/", "/n/"],
        soundExamples: [
          { label: "/s/", word: "sun" },
          { label: "/u/", word: "up" },
          { label: "/n/", word: "nest" }
        ]
      },
      {
        prompt: "Blend /d/ /o/ /g/. What friendly friend is it?",
        picture: "🐶",
        pictureLabel: "A waggy dog",
        choices: ["Dog", "Dig", "Dot"],
        answer: "Dog",
        hint: "Say each sound: d... o... g... Dog! 🐶",
        blendParts: ["/d/", "/o/", "/g/"],
        soundExamples: [
          { label: "/d/", word: "dog" },
          { label: "/o/", word: "octopus" },
          { label: "/g/", word: "grapes" }
        ]
      },
      {
        prompt: "Where do we sleep? Blend: /b/ /e/ /d/.",
        picture: "🛏️",
        pictureLabel: "Cozy bed",
        choices: ["Bed", "Bad", "Bug"],
        answer: "Bed",
        hint: "b... e... d... Bed! A cozy place to rest. 🛏️",
        blendParts: ["/b/", "/e/", "/d/"],
        soundExamples: [
          { label: "/b/", word: "ball" },
          { label: "/e/", word: "elephant" },
          { label: "/d/", word: "dog" }
        ]
      },
      {
        prompt: "Blend /p/ /i/ /g/. Which pink animal is this?",
        picture: "🐷",
        pictureLabel: "Little piggy",
        choices: ["Pig", "Peg", "Pug"],
        answer: "Pig",
        hint: "p... i... g... Pig! Oink oink. 🐷",
        blendParts: ["/p/", "/i/", "/g/"],
        soundExamples: [
          { label: "/p/", word: "pig" },
          { label: "/i/", word: "in" },
          { label: "/g/", word: "go" }
        ]
      },
      {
        prompt: "Blend /b/ /u/ /g/. What tiny crawler is this?",
        picture: "🐞",
        pictureLabel: "Little ladybug",
        choices: ["Bug", "Bag", "Big"],
        answer: "Bug",
        hint: "b... u... g... Bug! A friendly little ladybug. 🐞",
        blendParts: ["/b/", "/u/", "/g/"],
        soundExamples: [
          { label: "/b/", word: "ball" },
          { label: "/u/", word: "up" },
          { label: "/g/", word: "go" }
        ]
      }
    ]
  },

  // -------------------------------------------------------
  // LEVEL 4: Word Families & Rhyme Safari
  // Recognize common word patterns to ease dyslexia decoding.
  // -------------------------------------------------------
  {
    id: 4,
    title: "Rhyme & Word Families",
    subtitle: "Spot matching word endings that sound the same",
    icon: "🌈",
    skill: "Word families & rhyming patterns",
    description: "See how words share the same ending family, making them easy to read.",
    questions: [
      {
        prompt: "Which word rhymes with Cat in the -at family?",
        picture: "🦇",
        pictureLabel: "Bat",
        choices: ["Bat", "Dog", "Sun"],
        answer: "Bat",
        hint: "Cat and Bat both end in -at! 🐱🦇",
        family: "-at",
        soundExamples: [
          { label: "cat", word: "cat" },
          { label: "bat", word: "bat" },
          { label: "hat", word: "hat" }
        ]
      },
      {
        prompt: "Sun is in the -un family. Which word rhymes with Sun?",
        picture: "🏃",
        pictureLabel: "Run",
        choices: ["Run", "Map", "Bed"],
        answer: "Run",
        hint: "Sun and Run have the same happy -un ending! ☀️🏃",
        family: "-un",
        soundExamples: [
          { label: "sun", word: "sun" },
          { label: "run", word: "run" },
          { label: "fun", word: "fun" }
        ]
      },
      {
        prompt: "Dog belongs to the -og family. What rhymes with Dog?",
        picture: "🐸",
        pictureLabel: "Frog",
        choices: ["Frog", "Fish", "Pig"],
        answer: "Frog",
        hint: "Dog and Frog both end in -og! 🐶🐸",
        family: "-og",
        soundExamples: [
          { label: "dog", word: "dog" },
          { label: "frog", word: "frog" },
          { label: "log", word: "log" }
        ]
      },
      {
        prompt: "Bug is in the -ug family. What rhymes with Bug?",
        picture: "☕",
        pictureLabel: "Mug",
        choices: ["Mug", "Cat", "Sun"],
        answer: "Mug",
        hint: "Bug and Mug end in -ug! 🐞☕",
        family: "-ug",
        soundExamples: [
          { label: "bug", word: "bug" },
          { label: "mug", word: "mug" },
          { label: "hug", word: "hug" }
        ]
      },
      {
        prompt: "Hop rhymes with which word in the -op family?",
        picture: "🧹",
        pictureLabel: "Mop",
        choices: ["Mop", "Car", "Tree"],
        answer: "Mop",
        hint: "Hop and Mop both share the bouncy -op sound! 🐰🧹",
        family: "-op",
        soundExamples: [
          { label: "hop", word: "hop" },
          { label: "mop", word: "mop" },
          { label: "top", word: "top" }
        ]
      }
    ]
  },

  // -------------------------------------------------------
  // LEVEL 5: Combination Word Builders (Compound Words)
  // Combining small friendly words into big exciting words!
  // e.g. Honey + Bee = Honeybee 🍯🐝
  // -------------------------------------------------------
  {
    id: 5,
    title: "Combination Word Builders",
    subtitle: "Join two small words to create an exciting new word!",
    icon: "🍯",
    skill: "Compound words & morphemic awareness",
    description: "Tap the two words to hear them combine into one big, friendly word!",
    questions: [
      {
        type: "compound",
        prompt: "Join Honey + Bee together! What word do they make?",
        picture: "🍯🐝",
        pictureLabel: "Honey + Bee",
        part1: "Honey",
        emoji1: "🍯",
        part2: "Bee",
        emoji2: "🐝",
        combined: "Honeybee",
        choices: ["Honeybee", "Sunbee", "Honeycat"],
        answer: "Honeybee",
        hint: "Sweet Honey 🍯 plus busy Bee 🐝 makes Honeybee! 🍯🐝",
        soundExamples: [
          { label: "Honey", word: "honey" },
          { label: "Bee", word: "bee" },
          { label: "Honeybee", word: "honeybee" }
        ]
      },
      {
        type: "compound",
        prompt: "Join Rain + Bow together! What colorful surprise is made?",
        picture: "🌧️🌈",
        pictureLabel: "Rain + Bow",
        part1: "Rain",
        emoji1: "🌧️",
        part2: "Bow",
        emoji2: "🌈",
        combined: "Rainbow",
        choices: ["Rainbow", "Raindrop", "Sunbow"],
        answer: "Rainbow",
        hint: "Rain 🌧️ plus Bow 🌈 creates a beautiful Rainbow in the sky! 🌈",
        soundExamples: [
          { label: "Rain", word: "rain" },
          { label: "Bow", word: "bow" },
          { label: "Rainbow", word: "rainbow" }
        ]
      },
      {
        type: "compound",
        prompt: "Put Sun + Flower together! What happy plant grows?",
        picture: "☀️🌻",
        pictureLabel: "Sun + Flower",
        part1: "Sun",
        emoji1: "☀️",
        part2: "Flower",
        emoji2: "🌻",
        combined: "Sunflower",
        choices: ["Sunflower", "Sunrain", "Moonflower"],
        answer: "Sunflower",
        hint: "Warm Sun ☀️ plus Flower 🌻 gives us a tall Sunflower! 🌻",
        soundExamples: [
          { label: "Sun", word: "sun" },
          { label: "Flower", word: "flower" },
          { label: "Sunflower", word: "sunflower" }
        ]
      },
      {
        type: "compound",
        prompt: "Join Star + Fish together! What ocean friend is this?",
        picture: "⭐🐟",
        pictureLabel: "Star + Fish",
        part1: "Star",
        emoji1: "⭐",
        part2: "Fish",
        emoji2: "🐟",
        combined: "Starfish",
        choices: ["Starfish", "Goldfish", "Jellyfish"],
        answer: "Starfish",
        hint: "Star ⭐ plus Fish 🐟 makes a sea Starfish! ⭐🐟",
        soundExamples: [
          { label: "Star", word: "star" },
          { label: "Fish", word: "fish" },
          { label: "Starfish", word: "starfish" }
        ]
      },
      {
        type: "compound",
        prompt: "Combine Butter + Fly! What fluttering friend appears?",
        picture: "🧈🦋",
        pictureLabel: "Butter + Fly",
        part1: "Butter",
        emoji1: "🧈",
        part2: "Fly",
        emoji2: "🪰",
        combined: "Butterfly",
        choices: ["Butterfly", "Dragonfly", "Firefly"],
        answer: "Butterfly",
        hint: "Butter 🧈 plus Fly 🪰 makes a colorful Butterfly! 🦋",
        soundExamples: [
          { label: "Butter", word: "butter" },
          { label: "Fly", word: "fly" },
          { label: "Butterfly", word: "butterfly" }
        ]
      },
      {
        type: "compound",
        prompt: "Join Cup + Cake together! What yummy sweet treat is it?",
        picture: "🥤🎂",
        pictureLabel: "Cup + Cake",
        part1: "Cup",
        emoji1: "🥤",
        part2: "Cake",
        emoji2: "🎂",
        combined: "Cupcake",
        choices: ["Cupcake", "Pancake", "Cheesecake"],
        answer: "Cupcake",
        hint: "A tiny Cake baked in a Cup is a Cupcake! 🧁",
        soundExamples: [
          { label: "Cup", word: "cup" },
          { label: "Cake", word: "cake" },
          { label: "Cupcake", word: "cupcake" }
        ]
      },
      {
        type: "compound",
        prompt: "Join Snow + Man together on a cold winter day!",
        picture: "❄️⛄",
        pictureLabel: "Snow + Man",
        part1: "Snow",
        emoji1: "❄️",
        part2: "Man",
        emoji2: "⛄",
        combined: "Snowman",
        choices: ["Snowman", "Rainman", "Iceman"],
        answer: "Snowman",
        hint: "Fluffy Snow ❄️ rolled together makes a cheerful Snowman! ⛄",
        soundExamples: [
          { label: "Snow", word: "snow" },
          { label: "Man", word: "man" },
          { label: "Snowman", word: "snowman" }
        ]
      },
      {
        type: "compound",
        prompt: "Combine Sand + Castle at the sunny beach!",
        picture: "🏖️🏰",
        pictureLabel: "Sand + Castle",
        part1: "Sand",
        emoji1: "🏖️",
        part2: "Castle",
        emoji2: "🏰",
        combined: "Sandcastle",
        choices: ["Sandcastle", "Sandhouse", "Beachhouse"],
        answer: "Sandcastle",
        hint: "Building in the Sand 🏖️ creates a magnificent Sandcastle! 🏰",
        soundExamples: [
          { label: "Sand", word: "sand" },
          { label: "Castle", word: "castle" },
          { label: "Sandcastle", word: "sandcastle" }
        ]
      }
    ]
  },

  // -------------------------------------------------------
  // LEVEL 6: Sentence Reading Explorers
  // Short, dyslexia-spaced sentences with visual picture clues.
  // -------------------------------------------------------
  {
    id: 6,
    title: "Sentence Explorers",
    subtitle: "Read friendly short sentences and uncover story meaning",
    icon: "📖",
    skill: "Sentence comprehension with picture anchors",
    description: "Read short, calm sentences at your own pace with helpful picture clues.",
    questions: [
      {
        prompt: "‘The happy cat naps in the sun.’ Where is the cat?",
        picture: "🐱☀️",
        pictureLabel: "Cat in the sun",
        choices: ["In the sun", "In the car", "In a tree"],
        answer: "In the sun",
        hint: "Look at the last words: ‘in the sun’. ☀️"
      },
      {
        prompt: "‘The little puppy has a red ball.’ What color is the ball?",
        picture: "🐶🔴",
        pictureLabel: "Puppy with a ball",
        choices: ["Red", "Blue", "Green"],
        answer: "Red",
        hint: "The story says: ‘a red ball’. 🔴"
      },
      {
        prompt: "‘A honeybee visits a yellow sunflower.’ Who visits the flower?",
        picture: "🐝🌻",
        pictureLabel: "Bee and sunflower",
        choices: ["A honeybee", "A sleepy frog", "A big whale"],
        answer: "A honeybee",
        hint: "Our combination friend from Level 5: a honeybee! 🐝"
      },
      {
        prompt: "‘Ben puts on a yellow raincoat.’ What might the weather be?",
        picture: "🌧️",
        pictureLabel: "Rainy day",
        choices: ["Rainy", "Very hot", "Snowy"],
        answer: "Rainy",
        hint: "Raincoats keep us dry when it rains! 🌧️"
      },
      {
        prompt: "‘The rabbit shares a crunchy carrot with a friend.’ What does this show?",
        picture: "🐰🥕",
        pictureLabel: "Sharing friend",
        choices: ["Kindness", "Anger", "Sleepiness"],
        answer: "Kindness",
        hint: "Sharing with a friend shows warm kindness! 💚"
      }
    ]
  }
];

const defaultState = () => ({
  stars: Number(localStorage.getItem(LEGACY_STARS_KEY)) || 0,
  badges: [],
  completedStories: 0,
  completedSessions: 0,
  currentLevel: 1,
  levels: {},
  gardenPoints: 0,
});

export function getLearningState(userId = null) {
  try {
    const ssKey = storageKey(userId);
    const saved = localStorage.getItem(ssKey);
    const state = saved ? { ...defaultState(), ...JSON.parse(saved) } : defaultState();
    // Merge legacy stars if present for this user
    const legacyKey = legacyStarsKey(userId);
    const legacyStars = Number(localStorage.getItem(legacyKey)) || 0;
    state.stars = Math.max(state.stars || 0, legacyStars);
    return state;
  } catch {
    return defaultState();
  }
}

function saveState(state, userId = null) {
  const ssKey = storageKey(userId);
  const legacyKey = legacyStarsKey(userId);
  localStorage.setItem(ssKey, JSON.stringify(state));
  localStorage.setItem(legacyKey, String(state.stars));

  // Sync to PostgreSQL in background
  if (typeof window !== "undefined") {
    fetch("http://localhost:5000/api/learning/sync-progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        stars: state.stars,
        currentLevel: state.currentLevel,
        gardenPoints: state.gardenPoints,
        completedStories: state.completedStories,
        completedSessions: state.completedSessions,
        badges: state.badges,
        levels: state.levels,
      }),
    }).catch((e) => console.warn("Background progress sync skipped:", e.message));
  }

  return state;
}

function addBadge(state, id, title, description, icon) {
  if (!state.badges.some((badge) => badge.id === id)) {
    state.badges.push({ id, title, description, icon });
  }
}

export function recordStoryCompletion(userId = null) {
  const state = getLearningState(userId);
  state.stars += 3;
  state.completedStories += 1;
  state.gardenPoints += 1;
  addBadge(state, "first-story", "Story Starter", "Finished your first reading adventure", "📖");
  if (state.completedStories >= 3) {
    addBadge(state, "story-collector", "Story Collector", "Finished three stories", "🦋");
  }
  if (state.completedStories >= 5) {
    addBadge(state, "story-explorer", "Story Explorer", "Finished five stories", "🧭");
  }
  if (state.gardenPoints >= 3) {
    addBadge(state, "garden-grower", "Garden Grower", "Helped your learning garden sprout", "🌼");
  }
  return saveState(state, userId);
}

export function recordPracticeSession(levelId, correct, total, userId = null) {
  const state = getLearningState(userId);
  const accuracy = total ? Math.round((correct / total) * 100) : 0;
  const previous = state.levels[levelId] || { attempts: 0, masterySessions: 0, bestAccuracy: 0, completed: false };
  const wasMastery = accuracy >= 75; // Dyslexia-friendly threshold: 75% counts as mastery

  const next = {
    ...previous,
    attempts: previous.attempts + 1,
    masterySessions: previous.masterySessions + (wasMastery ? 1 : 0),
    bestAccuracy: Math.max(previous.bestAccuracy, accuracy),
    completed: previous.completed || (previous.masterySessions + (wasMastery ? 1 : 0) >= 1),
    lastAccuracy: accuracy,
  };

  const newlyMastered = !previous.completed && next.completed;
  state.levels[levelId] = next;
  state.completedSessions += 1;
  state.gardenPoints += 1;

  // Effort stars: 2 stars for participating + 1 for each correct answer
  let starsEarned = correct + 2;

  if (state.completedSessions >= 1) {
    addBadge(state, "first-practice", "Brave Explorer", "Started your first practice activity", "🌱");
  }
  if (state.completedSessions >= 5) {
    addBadge(state, "practice-pro", "Reading Pal", "Completed five practice adventures", "💪");
  }

  if (newlyMastered) {
    const levelTitle = LEARNING_LEVELS[levelId - 1]?.title || `Level ${levelId}`;
    addBadge(state, `level-${levelId}`, `${levelTitle} Champion`, `Showed understanding in ${levelTitle}`, "🏅");
    starsEarned += 5;

    if (levelId < LEARNING_LEVELS.length) {
      state.currentLevel = Math.max(state.currentLevel, levelId + 1);
      addBadge(state, `level-up-${levelId}`, "Level Up!", `Unlocked Level ${levelId + 1}`, "🎉");
    } else {
      addBadge(state, "reading-champion", "Master Explorer", "Explored every reading level!", "🌟");
    }
  }

  state.stars += starsEarned;
  if (state.stars >= 25) addBadge(state, "star-collector", "Star Collector", "Earned 25 learning stars", "⭐");
  if (state.gardenPoints >= 3) addBadge(state, "garden-grower", "Garden Grower", "Grew your garden taller", "🌼");
  if (state.gardenPoints >= 7) addBadge(state, "garden-bloomer", "Garden Bloomer", "Filled your garden with flowers", "🌷");
  if (state.gardenPoints >= 12) addBadge(state, "garden-champion", "Garden Champion", "Full blooming learning garden", "🌻");

  saveState(state, userId);
  return { state, accuracy, levelCompleted: next.completed, newlyMastered, unlockedLevel: state.currentLevel, starsEarned };
}

export function getGardenStage(state = getLearningState()) {
  if (state.gardenPoints >= 12) return { name: "Blooming Garden", emoji: "🌻🌼🌷", description: "Your garden is full of vibrant blooms!" };
  if (state.gardenPoints >= 7) return { name: "Flowering Garden", emoji: "🌿🌸🌿", description: "Your plants have beautiful flowers." };
  if (state.gardenPoints >= 3) return { name: "Growing Garden", emoji: "🌱🌿", description: "Your little plants are growing taller each day." };
  if (state.gardenPoints >= 1) return { name: "Little Sprout", emoji: "🌱", description: "You planted your first seed by practicing!" };
  return { name: "Your Garden", emoji: "🪴", description: "Complete a story or practice to plant your first seed." };
}
