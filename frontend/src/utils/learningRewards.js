const STORAGE_KEY = "lumilex_learning_rewards_v2";
const LEGACY_STARS_KEY = "lumilex_stars";

export const LEARNING_LEVELS = [
  {
    id: 1,
    title: "Alphabet Garden",
    subtitle: "Meet letters with friendly pictures",
    icon: "🌈",
    skill: "Alphabet recognition",
    description: "Look at a picture, hear its name, and find the letter that starts the word.",
    questions: [
      { prompt: "Apple begins with which letter?", picture: "🍎", pictureLabel: "Apple", choices: ["A", "B", "C"], answer: "A", hint: "Say apple slowly: /a/pple. Apple starts with A.", soundExamples: [{ label: "/a/", word: "apple" }, { label: "/b/", word: "ball" }, { label: "/c/", word: "cat" }] },
      { prompt: "Which letter starts the word ball?", picture: "⚽", pictureLabel: "Ball", choices: ["D", "B", "M"], answer: "B", hint: "B is for ball. Listen for /b/ at the beginning.", soundExamples: [{ label: "/b/", word: "ball" }, { label: "/d/", word: "dog" }, { label: "/m/", word: "moon" }] },
      { prompt: "Find the first letter in cat.", picture: "🐱", pictureLabel: "Cat", choices: ["C", "S", "T"], answer: "C", hint: "Cat starts with the crisp /c/ sound.", soundExamples: [{ label: "/c/", word: "cat" }, { label: "/s/", word: "sun" }, { label: "/t/", word: "top" }] },
      { prompt: "Dog starts with which letter?", picture: "🐶", pictureLabel: "Dog", choices: ["B", "D", "F"], answer: "D", hint: "Say dog. The first sound is /d/.", soundExamples: [{ label: "/d/", word: "dog" }, { label: "/b/", word: "ball" }, { label: "/f/", word: "fish" }] },
      { prompt: "Which letter begins the word fish?", picture: "🐠", pictureLabel: "Fish", choices: ["P", "F", "L"], answer: "F", hint: "Fish begins with /f/. Feel the air on your lip as you say it.", soundExamples: [{ label: "/f/", word: "fish" }, { label: "/p/", word: "pig" }, { label: "/l/", word: "leaf" }] },
    ],
  },
  {
    id: 2,
    title: "Sound Safari",
    subtitle: "Listen, say it, and spot the sound",
    icon: "🦁",
    skill: "Phonics and letter sounds",
    description: "Hear a sound in a familiar word and find the letter that makes it.",
    questions: [
      { prompt: "Which word begins with the /m/ sound?", picture: "🌙", pictureLabel: "Listen for /m/", choices: ["Cat", "Moon", "Fish"], answer: "Moon", hint: "Mmm-moon. Your lips come together for /m/.", soundExamples: [{ label: "/m/", word: "moon" }, { label: "/c/", word: "cat" }, { label: "/f/", word: "fish" }] },
      { prompt: "Tap the word that starts with /s/.", picture: "☀️", pictureLabel: "Sun", choices: ["Sun", "Dog", "Pig"], answer: "Sun", hint: "Stretch the first sound: sssssun.", soundExamples: [{ label: "/s/", word: "sun" }, { label: "/d/", word: "dog" }, { label: "/p/", word: "pig" }] },
      { prompt: "What sound starts the word goat?", picture: "🐐", pictureLabel: "Goat", choices: ["/g/ as in goat", "/t/ as in top", "/f/ as in fish"], answer: "/g/ as in goat", hint: "Goat starts with /g/. Listen to the word again.", soundExamples: [{ label: "/g/", word: "goat" }, { label: "/t/", word: "top" }, { label: "/f/", word: "fish" }] },
      { prompt: "Which letter makes the first sound in leaf?", picture: "🍃", pictureLabel: "Leaf", choices: ["L", "M", "P"], answer: "L", hint: "Listen: lllleaf. The sound starts with L.", soundExamples: [{ label: "/l/", word: "leaf" }, { label: "/m/", word: "moon" }, { label: "/p/", word: "pig" }] },
      { prompt: "Which word starts with /p/?", picture: "🐷", pictureLabel: "Pig", choices: ["Pig", "Apple", "Sun"], answer: "Pig", hint: "P is a quick puff of air: p-p-pig.", soundExamples: [{ label: "/p/", word: "pig" }, { label: "/a/", word: "apple" }, { label: "/s/", word: "sun" }] },
    ],
  },
  {
    id: 3,
    title: "Little Word Builders",
    subtitle: "Blend sounds to build your first words",
    icon: "🧩",
    skill: "Blending and short words",
    description: "Listen to each sound, then slide them together to make a word.",
    questions: [
      { prompt: "Blend /c/ /a/ /t/. What word do they make?", picture: "🐱", pictureLabel: "A cat", choices: ["Cat", "Cup", "Cot"], answer: "Cat", hint: "Say each sound, then make them smooth: c-a-t, cat.", soundExamples: [{ label: "/c/", word: "cat" }, { label: "/a/", word: "apple" }, { label: "/t/", word: "top" }] },
      { prompt: "Put these sounds together: /s/ /u/ /n/.", picture: "☀️", pictureLabel: "A sunny sun", choices: ["Sit", "Sun", "Sin"], answer: "Sun", hint: "Stretch it slowly: sss-uuu-nnn, sun!", soundExamples: [{ label: "/s/", word: "sun" }, { label: "/u/", word: "up" }, { label: "/n/", word: "net" }] },
      { prompt: "Which word matches this picture?", picture: "🗺️", pictureLabel: "Map", choices: ["Map", "Mop", "Mug"], answer: "Map", hint: "Say the first, middle, and last sounds in map.", soundExamples: [{ label: "map", word: "map" }, { label: "mop", word: "mop" }, { label: "mug", word: "mug" }] },
      { prompt: "Which word rhymes with sun?", picture: "🏃", pictureLabel: "Run", choices: ["Map", "Run", "Bed"], answer: "Run", hint: "Sun and run end with the same sound.", soundExamples: [{ label: "sun", word: "sun" }, { label: "run", word: "run" }, { label: "bed", word: "bed" }] },
      { prompt: "Choose the word for an animal that says meow.", picture: "🐈", pictureLabel: "A cat", choices: ["Dog", "Cat", "Pig"], answer: "Cat", hint: "Tap each word to hear it, then choose the one that matches.", soundExamples: [{ label: "dog", word: "dog" }, { label: "cat", word: "cat" }, { label: "pig", word: "pig" }] },
    ],
  },
  {
    id: 4,
    title: "Sentence Builders",
    subtitle: "Put words together to share an idea",
    icon: "📝",
    skill: "Sentence reading",
    description: "Use familiar words and picture clues to understand short sentences.",
    questions: [
      { prompt: "‘The dog runs.’ Who is running?", picture: "🐕", pictureLabel: "A running dog", choices: ["The dog", "The sun", "The cat"], answer: "The dog", hint: "Look for the naming words in the sentence." },
      { prompt: "I drink from a …", picture: "🥤", pictureLabel: "A cup", choices: ["cup", "sock", "book"], answer: "cup", hint: "Which object can hold a drink?" },
      { prompt: "Put the words in order: ‘is / It / sunny’", picture: "🌞", pictureLabel: "Sunny weather", choices: ["It is sunny", "Sunny it is?", "Is sunny it"], answer: "It is sunny", hint: "Start with who or what the sentence is about." },
      { prompt: "Mia has a red ball. What colour is the ball?", picture: "🔴", pictureLabel: "Red", choices: ["Blue", "Red", "Green"], answer: "Red", hint: "Find the colour word in the sentence." },
      { prompt: "Which sentence makes sense?", picture: "🐦", pictureLabel: "A bird", choices: ["Birds can fly.", "Fly can birds the.", "Birds the can."], answer: "Birds can fly.", hint: "A sentence needs words in an order that makes sense." },
    ],
  },
  {
    id: 5,
    title: "Tiny Story Readers",
    subtitle: "Read a little story and find clues",
    icon: "📚",
    skill: "Story understanding",
    description: "Use story details to answer questions.",
    questions: [
      { prompt: "Ava planted a seed. What did Ava plant?", picture: "🌱", pictureLabel: "A growing seed", choices: ["A seed", "A stone", "A toy"], answer: "A seed", hint: "The answer is in the first sentence." },
      { prompt: "Why did the plant grow? Ava watered it each day.", picture: "💧", pictureLabel: "Watering a plant", choices: ["It got water", "It ate lunch", "It wore a hat"], answer: "It got water", hint: "Look for what Ava did each day." },
      { prompt: "Ben put on a coat and opened his umbrella. What might the weather be like?", picture: "🌧️", pictureLabel: "Rainy weather", choices: ["Rainy", "Very hot", "Very quiet"], answer: "Rainy", hint: "An umbrella is often used when it rains." },
      { prompt: "The rabbit shared its carrot with a friend. What does this show?", picture: "🐰", pictureLabel: "A rabbit sharing a carrot", choices: ["Kindness", "Anger", "Sleepiness"], answer: "Kindness", hint: "Think about how sharing helps a friend feel." },
      { prompt: "What is a good title for a story about a lost puppy finding home?", picture: "🐶", pictureLabel: "A puppy", choices: ["The Lost Puppy", "A Blue Pencil", "Lunch Time"], answer: "The Lost Puppy", hint: "A title tells us what the story is mostly about." },
    ],
  },
  {
    id: 6,
    title: "Story Adventurers",
    subtitle: "Explore longer words and deeper meaning",
    icon: "🌟",
    skill: "Vocabulary and comprehension",
    description: "Explore meaning, word parts, and story clues.",
    questions: [
      { prompt: "What does ‘enormous’ mean?", picture: "🐳", pictureLabel: "An enormous whale", choices: ["Very big", "Very tiny", "Very quiet"], answer: "Very big", hint: "An enormous whale would be much bigger than a fish." },
      { prompt: "Which word has two syllables? Clap the parts.", picture: "🐇", pictureLabel: "Rabbit", choices: ["Rabbit", "Cat", "Sun"], answer: "Rabbit", hint: "Clap the parts: rab-bit." },
      { prompt: "Although it was raining, Noor went outside with boots. What does although tell us?", picture: "🥾", pictureLabel: "Rain boots", choices: ["There is a contrast", "The story is over", "Someone is asking a question"], answer: "There is a contrast", hint: "Noor went outside even though the weather was rainy." },
      { prompt: "What helps you work out an unfamiliar word in a story?", picture: "🔎", pictureLabel: "A magnifying glass", choices: ["Look at nearby clues and word parts", "Skip every sentence", "Guess without reading"], answer: "Look at nearby clues and word parts", hint: "The sentence and word parts can give useful clues." },
      { prompt: "A character practises every day and improves. What is a likely message?", picture: "🌻", pictureLabel: "A growing flower", choices: ["Practice can help us grow", "Never try anything new", "Only perfect people can learn"], answer: "Practice can help us grow", hint: "Think about what changed because the character kept trying." },
    ],
  },
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

export function getLearningState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const state = saved ? { ...defaultState(), ...JSON.parse(saved) } : defaultState();
    state.stars = Math.max(state.stars || 0, Number(localStorage.getItem(LEGACY_STARS_KEY)) || 0);
    return state;
  } catch {
    return defaultState();
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  localStorage.setItem(LEGACY_STARS_KEY, String(state.stars));
  return state;
}

function addBadge(state, id, title, description, icon) {
  if (!state.badges.some((badge) => badge.id === id)) {
    state.badges.push({ id, title, description, icon });
  }
}

export function recordStoryCompletion() {
  const state = getLearningState();
  state.stars += 3;
  state.completedStories += 1;
  state.gardenPoints += 1;
  addBadge(state, "first-story", "Story Starter", "Finished your first story", "📖");
  if (state.completedStories >= 3) {
    addBadge(state, "story-collector", "Story Collector", "Finished three stories", "🦋");
  }
  if (state.completedStories >= 5) {
    addBadge(state, "story-explorer", "Story Explorer", "Finished five stories", "🧭");
  }
  if (state.gardenPoints >= 3) {
    addBadge(state, "garden-grower", "Garden Grower", "Helped your learning garden grow", "🌼");
  }
  return saveState(state);
}

export function recordPracticeSession(levelId, correct, total) {
  const state = getLearningState();
  const accuracy = total ? Math.round((correct / total) * 100) : 0;
  const previous = state.levels[levelId] || { attempts: 0, masterySessions: 0, bestAccuracy: 0, completed: false };
  const wasMastery = accuracy >= 80;
  const next = {
    ...previous,
    attempts: previous.attempts + 1,
    masterySessions: previous.masterySessions + (wasMastery ? 1 : 0),
    bestAccuracy: Math.max(previous.bestAccuracy, accuracy),
    completed: previous.completed || (previous.masterySessions + (wasMastery ? 1 : 0) >= 2),
    lastAccuracy: accuracy,
  };
  const newlyMastered = !previous.completed && next.completed;
  state.levels[levelId] = next;
  state.completedSessions += 1;
  state.gardenPoints += 1;
  // Every completed session earns 2 effort stars, plus 1 for each correct answer.
  // Wrong answers never remove stars; hints and retries are always allowed.
  let starsEarned = correct + 2;

  if (state.completedSessions >= 1) addBadge(state, "first-practice", "Brave Beginner", "Tried your first practice activity", "🌱");
  if (state.completedSessions >= 5) addBadge(state, "practice-pro", "Practice Pal", "Completed five practice sessions", "💪");

  if (newlyMastered) {
    addBadge(state, `level-${levelId}`, `${LEARNING_LEVELS[levelId - 1].title} Master`, `Showed strong understanding in ${LEARNING_LEVELS[levelId - 1].title}`, "🏅");
    // Celebrate mastery at every level, including the final level.
    starsEarned += 5;
    if (levelId < LEARNING_LEVELS.length) {
      state.currentLevel = Math.max(state.currentLevel, levelId + 1);
      addBadge(state, `level-up-${levelId}`, "Level Up!", `Unlocked Level ${levelId + 1}`, "🎉");
    } else {
      addBadge(state, "reading-adventurer", "Reading Adventurer", "Explored every reading level", "🌟");
    }
  }

  state.stars += starsEarned;
  if (state.stars >= 25) addBadge(state, "star-collector", "Star Collector", "Earned 25 learning stars", "⭐");
  if (state.gardenPoints >= 3) addBadge(state, "garden-grower", "Garden Grower", "Helped your learning garden grow", "🌼");
  if (state.gardenPoints >= 7) addBadge(state, "garden-bloomer", "Garden Bloomer", "Grew a flowering learning garden", "🌷");
  if (state.gardenPoints >= 12) addBadge(state, "garden-champion", "Garden Champion", "Grew a blooming learning garden", "🌻");

  saveState(state);
  return { state, accuracy, levelCompleted: next.completed, newlyMastered, unlockedLevel: state.currentLevel, starsEarned };
}

export function getGardenStage(state = getLearningState()) {
  if (state.gardenPoints >= 12) return { name: "Blooming Garden", emoji: "🌻🌼🌷", description: "Your garden is full of blooms!" };
  if (state.gardenPoints >= 7) return { name: "Flowering Garden", emoji: "🌿🌸🌿", description: "Your plants are growing flowers." };
  if (state.gardenPoints >= 3) return { name: "Growing Garden", emoji: "🌱🌿", description: "Your little plants are getting taller." };
  if (state.gardenPoints >= 1) return { name: "Little Sprout", emoji: "🌱", description: "You planted your first seed by learning." };
  return { name: "Your Garden", emoji: "🪴", description: "Complete a story or practice to plant your first seed." };
}
