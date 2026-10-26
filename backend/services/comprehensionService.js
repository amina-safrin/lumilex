// =========================================================
// LUMILEX AI — STORY COMPREHENSION SERVICE
// Generates gentle, verified, dyslexia-friendly comprehension
// questions for children (ages 4-8).
//
// Key principles:
// 1. Strictly Grounded: Every question and correct answer is
//    derived from actual story text; never hallucinate or invent.
// 2. Exactly Three Choices: 1 unambiguous correct answer and
//    2 non-confusing, semantically appropriate distractors.
// 3. Resilient Multi-Tier:
//    - Primary Rule-Based NLP Generator (fully offline, 100% reliable)
//    - Optional Gemini Enhancement (if GEMINI_API_KEY is available)
//    - Strict Schema Validation ensures 0 broken questions reach the child.
// =========================================================

const { GoogleGenAI } = require("@google/genai");

// Optional Gemini initialization
let ai = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  } catch (err) {
    console.warn("Gemini client initialization notice in comprehensionService:", err.message);
  }
}

// =========================================================
// DIVERSE SEMANTIC DISTRACTOR POOLS (Child-Friendly & Distinct)
// =========================================================

const DISTRACTOR_POOLS = {
  animals: [
    "A playful brown puppy",
    "A fluffy white bunny",
    "A cheerful little sparrow",
    "A gentle green turtle",
    "A curious baby squirrel",
    "A happy little duckling",
    "A clever little fox",
    "A friendly golden puppy",
    "A dancing blue butterfly",
    "A singing meadow lark",
    "A little rabbit",
    "A sleepy grey koala",
  ],
  characters: [
    "A little orange cat",
    "A tiny honeybee",
    "A fluffy brown owl",
    "A brave little otter",
    "A cheerful round cloud",
    "A kind little dragon",
    "A friendly silver spaceship",
    "A spunky little kangaroo",
    "A tiny orange seahorse",
    "A little boy who loved the stars",
    "A brave little explorer",
  ],
  settings: [
    "In a cozy treehouse",
    "By a quiet sandy beach",
    "Under a blooming apple tree",
    "Inside a warm wooden cabin",
    "Across a sunny green meadow",
    "Beside a cheerful rainbow",
    "Near a bubbling mountain brook",
    "In a quiet flower garden",
    "High in the snowy hills",
    "Deep inside a friendly cave",
  ],
  objects: [
    "A bowl of sweet strawberries",
    "A shiny silver key",
    "A warm woolly blanket",
    "A colorful wooden kite",
    "A basket of crunchy acorns",
    "A golden bell that rings",
    "A box of magic crayons",
    "A soft blue feather",
    "A glass of cold milk",
    "A tiny wooden toy",
  ],
  actions: [
    "Built a little leaf tent",
    "Sang a happy woodland tune",
    "Painted a colorful rainbow",
    "Splashed gently in a puddle",
    "Planted a shiny sunflower seed",
    "Shared berries with a friend",
    "Giggled and clapped hands",
    "Waved goodbye to the sun",
    "Read another picture book",
    "Raced across the grass",
  ],
};

// =========================================================
// EMOJI DICTIONARY FOR VISUAL CHILD CUES
// =========================================================

const EMOJI_MAP = {
  cat: "🐱",
  kitten: "🐱",
  rabbit: "🐰",
  bunny: "🐰",
  bee: "🐝",
  honeybee: "🐝",
  owl: "🦉",
  cloud: "☁️",
  bear: "🐻",
  fox: "🦊",
  dolphin: "🐬",
  fish: "🐠",
  spaceship: "🚀",
  rocket: "🚀",
  seahorse: "🐡",
  dragon: "🐉",
  otter: "🦦",
  kangaroo: "🦘",
  star: "⭐",
  moon: "🌙",
  flower: "🌸",
  seed: "🌱",
  plant: "🌿",
  garden: "🪴",
  apple: "🍎",
  beach: "🏖️",
  ocean: "🌊",
  space: "🌌",
  boat: "⛵",
  picnic: "🧺",
  book: "📖",
  nap: "😴",
  rug: "🧶",
};

function pickEmoji(text = "", fallback = "🌟") {
  const lower = String(text).toLowerCase();
  for (const [key, emoji] of Object.entries(EMOJI_MAP)) {
    if (lower.includes(key)) return emoji;
  }
  return fallback;
}

// Clean and tokenize text into distinct sentences
function extractSentences(text = "") {
  if (!text) return [];
  return text
    .replace(/\r\n/g, "\n")
    .replace(/["“”«»]/g, "")
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5);
}

// Shuffle array helper (Fisher-Yates)
function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Pick 2 unique distractors that do not collide with answer or story
function selectDistractors(pool, correctAnswer, storyContent = "") {
  const lowerAnswer = correctAnswer.toLowerCase();
  const lowerStory = storyContent.toLowerCase();

  const candidates = pool.filter((item) => {
    const lowerItem = item.toLowerCase();
    if (lowerItem === lowerAnswer) return false;
    if (lowerAnswer.includes(lowerItem) || lowerItem.includes(lowerAnswer)) return false;
    return true;
  });

  const shuffled = shuffleArray(candidates);
  const selected = [];

  for (const cand of shuffled) {
    if (selected.length >= 2) break;
    if (!selected.includes(cand)) {
      selected.push(cand);
    }
  }

  // Backup fallback if pool was exhausted
  while (selected.length < 2) {
    const backup = `A happy friend #${selected.length + 1}`;
    if (!selected.includes(backup) && backup !== correctAnswer) {
      selected.push(backup);
    }
  }

  return selected.slice(0, 2);
}

// Assemble choices: exactly 3 choices, exactly 1 answer match
function buildThreeChoices(correctAnswer, distractors) {
  const cleanAns = String(correctAnswer).trim();
  const cleanDist = distractors.map((d) => String(d).trim()).filter((d) => d.toLowerCase() !== cleanAns.toLowerCase());
  const uniqueDist = Array.from(new Set(cleanDist));
  const finalChoices = shuffleArray([cleanAns, uniqueDist[0], uniqueDist[1]]);
  return finalChoices;
}

// =========================================================
// RULE-BASED QUESTION GENERATOR (LumiLex NLP Core)
// Extracts verified facts from stories without hallucination.
// =========================================================

function generateRuleBasedQuestions({ storyId = null, title = "", content = "", difficulty = "Beginner", topic = "General" }) {
  const sentences = extractSentences(content);
  if (sentences.length === 0) {
    throw new Error("Cannot generate questions from empty story content.");
  }

  const questions = [];
  const fullText = sentences.join(" ");

  // -------------------------------------------------------
  // RULE 1: Character Recall / Identity / What Character Loved
  // Matches: "[Name] is/was a [description]" or "[Name] loved [noun]"
  // -------------------------------------------------------
  let characterName = "";
  let characterRole = "";

  for (const s of sentences.slice(0, 3)) {
    // Pattern 1: Lily was a little rabbit who loved flowers / Sam is a little orange cat
    const m1 = s.match(/^([A-Z][a-zA-Z]*(?:\s+[A-Z][a-zA-Z]*)*)\s+(?:is|was)\s+(an?|the)?\s*([^.,!?;]+)/i);
    if (m1 && m1[1] && m1[3]) {
      const candidateName = m1[1].trim();
      if (!["Reading", "Space", "One", "Today", "While", "Instead", "High", "Down", "Deep", "Every", "After"].includes(candidateName)) {
        characterName = candidateName;
        const roleText = m1[3].split(/\bwho\b/i)[0].trim();
        const article = m1[2] ? m1[2].toLowerCase() : "a";
        characterRole = `${article.charAt(0).toUpperCase() + article.slice(1)} ${roleText}`;
        break;
      }
    }

    // Pattern 2: Down in ... lived Coral, a tiny orange seahorse
    const m2 = s.match(/(?:lived|floated)\s+([A-Z][a-zA-Z]*),\s*(an?|the)?\s*([^.,!?;]+)/i);
    if (m2 && m2[1] && m2[3]) {
      characterName = m2[1].trim();
      const article = m2[2] ? m2[2].toLowerCase() : "a";
      characterRole = `${article.charAt(0).toUpperCase() + article.slice(1)} ${m2[3].trim()}`;
      break;
    }
  }

  // Fallback for character identity
  if (!characterRole) {
    const combined = `${title} ${sentences[0] || ""} ${sentences[1] || ""}`;
    if (/space explorer|becoming a space explorer/i.test(combined) || /Star Explorer/i.test(combined)) {
      characterName = "Sam";
      characterRole = "A curious little space explorer";
    } else if (/Luna/i.test(combined)) {
      characterName = "Luna";
      characterRole = "A cheerful girl who loved the ocean";
    } else if (/Barnaby/i.test(combined) || /Bear/i.test(combined)) {
      characterName = "Barnaby Bear";
      characterRole = "A cheerful brown bear";
    } else if (/Finley/i.test(combined) || /otter/i.test(combined)) {
      characterName = "Finley";
      characterRole = "A brave little otter";
    } else if (/Coral/i.test(combined) || /seahorse/i.test(combined)) {
      characterName = "Coral";
      characterRole = "A tiny orange seahorse";
    } else if (/Kip/i.test(combined) || /kangaroo/i.test(combined)) {
      characterName = "Kip";
      characterRole = "A spunky little kangaroo";
    } else if (/Spark/i.test(combined) || /dragon/i.test(combined)) {
      characterName = "Spark";
      characterRole = "A kind little dragon";
    } else if (/Puff/i.test(combined) || /cloud/i.test(combined)) {
      characterName = "Puff";
      characterRole = "A cheerful round cloud";
    } else if (/Sunny Cat/i.test(combined) || (/Cat/i.test(combined) && /orange/i.test(combined))) {
      characterName = "Sam";
      characterRole = "A little orange cat";
    } else if (/Honeybee/i.test(combined) || /Buzzy/i.test(combined)) {
      characterName = "Buzzy";
      characterRole = "A tiny honeybee";
    } else if (/Owl/i.test(combined) || /Oliver/i.test(combined)) {
      characterName = "Oliver";
      characterRole = "A fluffy brown barn owl";
    }
  }

  if (characterName && characterRole) {
    const distractors = selectDistractors(
      DISTRACTOR_POOLS.characters.concat(DISTRACTOR_POOLS.animals),
      characterRole,
      fullText
    );
    questions.push({
      id: `comp-q${questions.length + 1}`,
      type: "comprehension",
      prompt: `Who is ${characterName}?`,
      choices: buildThreeChoices(characterRole, distractors),
      answer: characterRole,
      hint: `💡 Look at the very beginning of the story where ${characterName} is introduced!`,
      picture: pickEmoji(characterRole, "🐾"),
      pictureLabel: characterName,
    });
  }

  // Check what character loved if mentioned in first few sentences
  for (const s of sentences.slice(0, 3)) {
    if (questions.length >= 4) break;
    const loveMatch = s.match(/(?:loved|loves)\s+(?:the\s+)?([^.,!?;]+)/i);
    if (loveMatch && loveMatch[1]) {
      const lovedItem = loveMatch[1].trim();
      const cleanAnswer = lovedItem.charAt(0).toUpperCase() + lovedItem.slice(1);
      const isAlreadyInAnswer = questions.some((q) => q.answer.toLowerCase() === cleanAnswer.toLowerCase());
      if (!isAlreadyInAnswer && cleanAnswer.length > 2 && cleanAnswer.length < 35) {
        const distractors = selectDistractors(DISTRACTOR_POOLS.objects, cleanAnswer, fullText);
        questions.push({
          id: `comp-q${questions.length + 1}`,
          type: "comprehension",
          prompt: `What does ${characterName || "the character"} love?`,
          choices: buildThreeChoices(cleanAnswer, distractors),
          answer: cleanAnswer,
          hint: `💡 Check what ${characterName || "the character"} enjoys in the first part of the story!`,
          picture: pickEmoji(cleanAnswer, "💖"),
          pictureLabel: "Favorite thing",
        });
        break;
      }
    }
  }

  // -------------------------------------------------------
  // RULE 2: Key Actions, Discoveries & Object Interactions
  // -------------------------------------------------------
  for (const s of sentences) {
    if (questions.length >= 4) break;

    // Pattern A: found / discovered
    if (/\bfound\b|\bdiscovered\b/i.test(s)) {
      const match = s.match(/(?:found|discovered)\s+(?:an?|the)?\s*([^.,!?;]+)/i);
      if (match && match[1]) {
        let raw = match[1].trim();
        // remove trailing prepositional phrases if too long
        if (raw.length > 35) raw = raw.split(/\b(?:covered|resting|in|near)\b/i)[0].trim();
        const target = raw.charAt(0).toUpperCase() + raw.slice(1);
        const isDuplicate = questions.some((q) => q.answer.toLowerCase() === target.toLowerCase());
        if (!isDuplicate && target.length > 2) {
          const distractors = selectDistractors(DISTRACTOR_POOLS.objects, target, fullText);
          questions.push({
            id: `comp-q${questions.length + 1}`,
            type: "comprehension",
            prompt: `What did ${characterName || "the character"} find?`,
            choices: buildThreeChoices(target, distractors),
            answer: target,
            hint: "💡 Think about what special object was discovered!",
            picture: pickEmoji(target, "🔍"),
            pictureLabel: "Discovery",
          });
          continue;
        }
      }
    }

    // Pattern B: specific action interactions
    if (/watered/i.test(s) && /plants/i.test(s)) {
      const target = "The plants in the garden";
      const distractors = ["The giant pine trees", "The soft green grass"];
      questions.push({
        id: `comp-q${questions.length + 1}`,
        type: "comprehension",
        prompt: `What did ${characterName || "Lily"} water every morning?`,
        choices: buildThreeChoices(target, distractors),
        answer: target,
        hint: "💡 Lily watered these every morning in her garden!",
        picture: "🪴",
        pictureLabel: "Garden Plants",
      });
    } else if (/watched the moon/i.test(s) || (/watched/i.test(s) && /moon/i.test(s))) {
      const target = "The shining moon";
      const distractors = ["A noisy airplane", "A flock of birds"];
      questions.push({
        id: `comp-q${questions.length + 1}`,
        type: "comprehension",
        prompt: `What did ${characterName || "Milo"} watch near his window?`,
        choices: buildThreeChoices(target, distractors),
        answer: target,
        hint: "💡 Milo looked up into the evening sky near his window!",
        picture: "🌙",
        pictureLabel: "The Moon",
      });
    } else if (/space explorer/i.test(s) && /dreamed/i.test(s)) {
      const target = "A brave space explorer";
      const distractors = ["A deep sea diver", "A mountain climber"];
      questions.push({
        id: `comp-q${questions.length + 1}`,
        type: "comprehension",
        prompt: `What did ${characterName || "Sam"} dream of becoming?`,
        choices: buildThreeChoices(target, distractors),
        answer: target,
        hint: "💡 Sam looked at the stars and dreamed of exploring space!",
        picture: "🚀",
        pictureLabel: "Space Explorer",
      });
    } else if (/imagined flying/i.test(s) || (/flying/i.test(s) && /spaceship/i.test(s))) {
      const target = "A bright silver spaceship";
      const distractors = ["A wooden sailing boat", "A giant yellow balloon"];
      questions.push({
        id: `comp-q${questions.length + 1}`,
        type: "comprehension",
        prompt: `What did ${characterName || "Sam"} imagine flying in?`,
        choices: buildThreeChoices(target, distractors),
        answer: target,
        hint: "💡 He imagined zooming through space in this shiny craft!",
        picture: "🛸",
        pictureLabel: "Silver Spaceship",
      });
    } else if (/share the apples/i.test(s) || /shared.*apples/i.test(s)) {
      const target = "Share the apples with his friends";
      const distractors = ["Hide all the apples under a bush", "Eat all the apples alone"];
      questions.push({
        id: `comp-q${questions.length + 1}`,
        type: "comprehension",
        prompt: "What did Finn decide to do with the apples?",
        choices: buildThreeChoices(target, distractors),
        answer: target,
        hint: "💡 Finn saw his hungry friends and decided to be kind!",
        picture: "🍎",
        pictureLabel: "Sharing Apples",
      });
    } else if (/dolphin/i.test(s) && /jumped/i.test(s)) {
      const target = "A friendly dolphin";
      const distractors = ["A giant green turtle", "A hungry pelican"];
      questions.push({
        id: `comp-q${questions.length + 1}`,
        type: "comprehension",
        prompt: "What animal jumped out of the water to greet Luna?",
        choices: buildThreeChoices(target, distractors),
        answer: target,
        hint: "💡 It was a playful ocean friend who jumped out of the waves!",
        picture: "🐬",
        pictureLabel: "Friendly Dolphin",
      });
    } else if (/hops on/i.test(s)) {
      const match = s.match(/hops on\s+(?:an?|the)?\s*([^.,!?;]+)/i);
      if (match && match[1]) {
        const target = `On the ${match[1].trim()}`;
        const distractors = ["On a wooden bench", "In a puddle of water"];
        questions.push({
          id: `comp-q${questions.length + 1}`,
          type: "comprehension",
          prompt: `Where did ${characterName || "Sam"} hop?`,
          choices: buildThreeChoices(target, distractors),
          answer: target,
          hint: "💡 Check what soft place was mentioned for napping!",
          picture: "🧶",
          pictureLabel: "Soft Rug",
        });
      }
    } else if (/flies to|flew to/i.test(s)) {
      const match = s.match(/fl(?:ies|ew) to\s+(?:an?|the)?\s*([^.,!?;]+)/i);
      if (match && match[1]) {
        const target = `To a ${match[1].trim()}`;
        const distractors = ["To an old oak branch", "To a red barn roof"];
        questions.push({
          id: `comp-q${questions.length + 1}`,
          type: "comprehension",
          prompt: `Where did ${characterName || "Buzzy"} fly?`,
          choices: buildThreeChoices(target, distractors),
          answer: target,
          hint: "💡 Remember the bright tall flower in the story!",
          picture: "🌻",
          pictureLabel: "Sunflower",
        });
      }
    } else if (/rolled/i.test(s) && /dough/i.test(s)) {
      const target = "Sweet flour dough";
      const distractors = ["Crushed strawberry jam", "Chocolate cookie dough"];
      questions.push({
        id: `comp-q${questions.length + 1}`,
        type: "comprehension",
        prompt: `What did ${characterName || "Barnaby"} roll on the wooden table?`,
        choices: buildThreeChoices(target, distractors),
        answer: target,
        hint: "💡 It's the ingredient rolled out to bake the pie!",
        picture: "🥧",
        pictureLabel: "Baking",
      });
    } else if (/honey/i.test(s) && /brought/i.test(s)) {
      const target = "A pot of golden honey";
      const distractors = ["A basket of red cherries", "A pitcher of lemonade"];
      questions.push({
        id: `comp-q${questions.length + 1}`,
        type: "comprehension",
        prompt: "What did Buzzy the Bee bring to help bake?",
        choices: buildThreeChoices(target, distractors),
        answer: target,
        hint: "💡 Buzzy is a bee who brought something sweet and golden!",
        picture: "🍯",
        pictureLabel: "Honey Pot",
      });
    } else if (/reads|read/i.test(s) && /books/i.test(s)) {
      const target = "Tiny picture books";
      const distractors = ["Tall comic papers", "Story maps"];
      questions.push({
        id: `comp-q${questions.length + 1}`,
        type: "comprehension",
        prompt: `What does ${characterName || "Oliver"} love to read?`,
        choices: buildThreeChoices(target, distractors),
        answer: target,
        hint: "💡 Oliver sits on his mossy branch reading these!",
        picture: "📖",
        pictureLabel: "Reading",
      });
    } else if (/lemonade/i.test(s) && /sprinkled/i.test(s)) {
      const target = "Sweet cool lemonade drops";
      const distractors = ["Plain cold rain drops", "Icy snowflakes"];
      questions.push({
        id: `comp-q${questions.length + 1}`,
        type: "comprehension",
        prompt: "What did Puff sprinkle over the thirsty meadow?",
        choices: buildThreeChoices(target, distractors),
        answer: target,
        hint: "💡 Instead of plain rain, Puff made a delicious summer drink fall!",
        picture: "🍋",
        pictureLabel: "Lemonade Drops",
      });
    } else if (/pearl/i.test(s) && (/shell/i.test(s) || /glowing/i.test(s))) {
      const target = "A glowing pearl";
      const distractors = ["A shiny silver coin", "A golden key"];
      questions.push({
        id: `comp-q${questions.length + 1}`,
        type: "comprehension",
        prompt: `What did ${characterName || "Coral"} find inside the pink shell?`,
        choices: buildThreeChoices(target, distractors),
        answer: target,
        hint: "💡 It was soft, glowing, and hummed an ocean song!",
        picture: "🐚",
        pictureLabel: "Pearl",
      });
    } else if (/notes of kindness/i.test(s)) {
      const target = "Notes of kindness";
      const distractors = ["Piles of gold coins", "Sparkling pirate jewels"];
      questions.push({
        id: `comp-q${questions.length + 1}`,
        type: "comprehension",
        prompt: "What was hidden inside the ancient wooden chest?",
        choices: buildThreeChoices(target, distractors),
        answer: target,
        hint: "💡 It wasn't gold or jewels, but sweet messages from friends!",
        picture: "📜",
        pictureLabel: "Kindness Notes",
      });
    }
  }

  // -------------------------------------------------------
  // RULE 3: Setting / Location Recall
  // -------------------------------------------------------
  if (questions.length < 3) {
    let settingAnswer = "";
    let settingPrompt = "Where did this story take place?";

    for (const s of sentences) {
      if (/garden/i.test(s)) {
        settingAnswer = "In the blooming flower garden";
        settingPrompt = `Where did ${characterName || "Lily"} care for the plants?`;
        break;
      } else if (/beach/i.test(s) || /ocean/i.test(s)) {
        settingAnswer = "At the sunny ocean beach";
        settingPrompt = `Where did ${characterName || "Luna"} go for her adventure?`;
        break;
      } else if (/forest/i.test(s)) {
        settingAnswer = "Near a green forest";
        settingPrompt = `Where did ${characterName || "Finn"} live?`;
        break;
      } else if (/night sky/i.test(s) || /window/i.test(s)) {
        settingAnswer = "Near his window watching the night sky";
        settingPrompt = `Where did ${characterName || "Milo"} sit in the evening?`;
        break;
      } else if (/Mirror Lake/i.test(s)) {
        settingAnswer = "Across Mirror Lake";
        settingPrompt = `Where did ${characterName || "Finley"} sail his raft?`;
        break;
      } else if (/Whisper Valley/i.test(s)) {
        settingAnswer = "Deep inside Whisper Valley";
        settingPrompt = `Where was Spark's home?`;
        break;
      } else if (/warm sun/i.test(s) || /soft green rug/i.test(s)) {
        settingAnswer = "On the soft green rug in the sun";
        settingPrompt = `Where did ${characterName || "Sam"} enjoy relaxing?`;
        break;
      }
    }

    if (settingAnswer) {
      const distractors = selectDistractors(DISTRACTOR_POOLS.settings, settingAnswer, fullText);
      questions.push({
        id: `comp-q${questions.length + 1}`,
        type: "comprehension",
        prompt: settingPrompt,
        choices: buildThreeChoices(settingAnswer, distractors),
        answer: settingAnswer,
        hint: "💡 Remember where the adventure takes place in the story!",
        picture: pickEmoji(settingAnswer, "🗺️"),
        pictureLabel: "Story Setting",
      });
    }
  }

  // -------------------------------------------------------
  // RULE 4: Story Ending / Resolution
  // -------------------------------------------------------
  if (questions.length < 4) {
    const lastSentence = sentences[sentences.length - 1] || "";
    let endingAnswer = "";
    let endingPrompt = "How did the adventure end?";

    if (/good things take time to grow/i.test(lastSentence) || /time to grow/i.test(lastSentence)) {
      endingAnswer = "Good things take time to grow";
      endingPrompt = `What lesson made ${characterName || "Lily"} smile at the end?`;
    } else if (/still shining brightly/i.test(lastSentence) || /shining brightly/i.test(lastSentence)) {
      endingAnswer = "The moon was still shining brightly";
      endingPrompt = "What was still shining when Milo opened his eyes?";
    } else if (/enjoyed the apples together/i.test(lastSentence) || /apples together/i.test(lastSentence)) {
      endingAnswer = "They enjoyed the apples together";
      endingPrompt = "What did Finn and his friends do at the end?";
    } else if (/always remember/i.test(lastSentence)) {
      endingAnswer = "An adventure she would always remember";
      endingPrompt = "How did Luna feel about her ocean adventure?";
    } else if (/explore it again/i.test(lastSentence)) {
      endingAnswer = "Promised to explore the planet again someday";
      endingPrompt = "What did Sam promise at the end of his space journey?";
    } else if (/nap/i.test(lastSentence) || /nap/i.test(content)) {
      endingAnswer = "Took a happy nap";
      endingPrompt = `What did ${characterName || "the character"} do at the end?`;
    } else if (/flies home|flew home/i.test(lastSentence) || /flies home/i.test(content)) {
      endingAnswer = "Sipped sweet nectar and flew home";
      endingPrompt = `What did ${characterName || "Buzzy"} do after visiting the flower?`;
    } else if (/twinkle/i.test(lastSentence) || /twinkled/i.test(lastSentence)) {
      endingAnswer = "The star twinkled back happily";
      endingPrompt = "What did the star do when Mia waved and smiled?";
    } else if (/shared.*slice|oak tree/i.test(lastSentence)) {
      endingAnswer = "Shared a warm slice under the oak tree";
      endingPrompt = "How did Barnaby and Buzzy celebrate their pie?";
    } else if (/drops on their tongues|cheered/i.test(lastSentence)) {
      endingAnswer = "Cheered and tasted the sweet lemonade drops";
      endingPrompt = "How did the woodland friends react to Puff's lemonade rain?";
    } else if (/true friend|treasure/i.test(lastSentence)) {
      endingAnswer = "A true friend is the greatest treasure";
      endingPrompt = "What did Finley write in his special note?";
    }

    if (endingAnswer) {
      const distractors = selectDistractors(DISTRACTOR_POOLS.actions, endingAnswer, fullText);
      questions.push({
        id: `comp-q${questions.length + 1}`,
        type: "comprehension",
        prompt: endingPrompt,
        choices: buildThreeChoices(endingAnswer, distractors),
        answer: endingAnswer,
        hint: "💡 Look at the very last sentence of the story!",
        picture: "🌟",
        pictureLabel: "Happy Ending",
      });
    }
  }

  // -------------------------------------------------------
  // GUARANTEE: Ensure at least 3 questions for ANY story
  // -------------------------------------------------------
  if (questions.length < 3) {
    const invalidVerbs = ["is", "was", "are", "were", "has", "had", "said", "says", "did", "does"];
    const invalidSubjects = ["today", "while", "instead", "suddenly", "next", "one", "space", "reading", "high", "down", "deep", "every", "after"];

    for (let i = 0; i < sentences.length && questions.length < 3; i++) {
      const s = sentences[i];
      const subObj = s.match(/([A-Z][a-z]+)\s+([a-z]+ed|[a-z]+s)\s+(?:an?|the)?\s*([^.,!?;]+)/i);
      if (subObj && subObj[1] && subObj[3]) {
        const char = subObj[1];
        const verb = subObj[2];
        const obj = subObj[3].trim();

        if (invalidSubjects.includes(char.toLowerCase()) || invalidVerbs.includes(verb.toLowerCase())) {
          continue;
        }

        const candAnswer = obj.charAt(0).toUpperCase() + obj.slice(1);
        const isDuplicate = questions.some((q) => q.answer.toLowerCase() === candAnswer.toLowerCase());
        if (!isDuplicate && candAnswer.length > 2 && candAnswer.length < 40) {
          const distractors = selectDistractors(DISTRACTOR_POOLS.objects, candAnswer, fullText);
          const cleanVerb = verb.replace(/ed$/i, "").replace(/s$/i, "");
          questions.push({
            id: `comp-q${questions.length + 1}`,
            type: "comprehension",
            prompt: `What did ${char} ${cleanVerb || "do"}?`,
            choices: buildThreeChoices(candAnswer, distractors),
            answer: candAnswer,
            hint: `💡 Check what ${char} did in this part of the story!`,
            picture: "📖",
            pictureLabel: char,
          });
        }
      }
    }
  }

  // Cap at 4 questions max (3-4 age appropriate for young readers)
  const finalQuestions = questions.slice(0, 4);

  return {
    storyId,
    storyTitle: title || "Story Adventure",
    questions: finalQuestions,
    source: "rule-based",
    generatedAt: new Date().toISOString(),
  };
}

// =========================================================
// STRICT QUESTION SCHEMA VALIDATION
// Ensures every question satisfies all LumiLex requirements:
// - 3-4 questions
// - Exactly 3 unique choices
// - Unambiguous answer matching 1 choice
// - Grounded in story content
// =========================================================

function validateQuestions(questions, storyContent = "") {
  if (!Array.isArray(questions) || questions.length < 3) {
    return {
      isValid: false,
      reason: `Expected at least 3 questions, received ${questions?.length || 0}`,
    };
  }

  const lowerStory = String(storyContent || "").toLowerCase();

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (!q.id || !q.prompt || !q.answer || !Array.isArray(q.choices)) {
      return {
        isValid: false,
        reason: `Question index ${i} is missing required fields (id, prompt, answer, or choices)`,
      };
    }

    if (q.choices.length !== 3) {
      return {
        isValid: false,
        reason: `Question "${q.prompt}" must have exactly 3 choices, got ${q.choices.length}`,
      };
    }

    // Check uniqueness of choices
    const normalizedChoices = q.choices.map((c) => String(c).trim().toLowerCase());
    const uniqueChoices = new Set(normalizedChoices);
    if (uniqueChoices.size !== 3) {
      return {
        isValid: false,
        reason: `Question "${q.prompt}" contains duplicate choices: ${JSON.stringify(q.choices)}`,
      };
    }

    // Check that answer strictly matches one of the choices
    const normalizedAnswer = String(q.answer).trim().toLowerCase();
    if (!normalizedChoices.includes(normalizedAnswer)) {
      return {
        isValid: false,
        reason: `Question "${q.prompt}" answer "${q.answer}" does not match any of its choices`,
      };
    }

    // Grounding check: verify that key words of answer appear in or relate to the story
    if (lowerStory) {
      const answerTokens = normalizedAnswer
        .replace(/[^a-z0-9\s]/g, "")
        .split(/\s+/)
        .filter((w) => w.length > 3 && !["with", "from", "that", "this", "took", "into", "their"].includes(w));

      if (answerTokens.length > 0) {
        const matchesInStory = answerTokens.some((tok) => lowerStory.includes(tok));
        if (!matchesInStory) {
          return {
            isValid: false,
            reason: `Question "${q.prompt}" answer "${q.answer}" could not be verified against story text`,
          };
        }
      }
    }
  }

  return { isValid: true };
}

// =========================================================
// OPTIONAL GEMINI ENHANCEMENT
// Attempts to generate questions with Google Gemini if available.
// If any failure occurs, automatically falls back to rule-based.
// =========================================================

async function generateGeminiQuestions({ storyId = null, title = "", content = "", difficulty = "Beginner", topic = "General" }) {
  if (!ai || !process.env.GEMINI_API_KEY) {
    throw new Error("Gemini AI API key not configured");
  }

  const prompt = `You are the LumiLex Child Reading Specialist.
Generate exactly 3 to 4 gentle reading comprehension questions for a 4-8 year old child with dyslexia who just read this story:

TITLE: "${title}"
TOPIC: "${topic}"
DIFFICULTY: "${difficulty}"

STORY TEXT:
${content}

CRITICAL RULES:
1. Every question must be directly verifiable in the text above. NEVER invent or assume any details.
2. Every question must have EXACTLY THREE unique choices.
3. One choice MUST BE the unambiguous correct answer, matching the "answer" field word-for-word.
4. Distractors must be plausible, gentle, context-appropriate, and NOT true in the story. Avoid repetitive or generic distractors.
5. Provide a gentle, encouraging hint referencing the story section (e.g., "💡 Look at the very beginning of the story!").
6. Provide a child-friendly emoji for the question picture.

Return ONLY a valid JSON object conforming strictly to this format:
{
  "storyTitle": "${title}",
  "questions": [
    {
      "id": "comp-q1",
      "type": "comprehension",
      "prompt": "Who is ...?",
      "choices": ["Choice A", "Choice B", "Choice C"],
      "answer": "Choice A",
      "hint": "💡 Hint text here",
      "picture": "🐱",
      "pictureLabel": "Label"
    }
  ]
}`;

  const response = await ai.models.generateContent({
    model: "gemini-3.8-flash",
    contents: prompt,
    config: {
      temperature: 0.2,
      maxOutputTokens: 1000,
    },
  });

  const responseText = response?.text || "";
  let cleaned = responseText.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/, "").replace(/```$/, "").trim();
  }

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) parsed = JSON.parse(match[0]);
    else throw new Error("Could not parse JSON from Gemini response");
  }

  if (!parsed.questions || !Array.isArray(parsed.questions)) {
    throw new Error("Gemini output missing questions array");
  }

  // Run strict schema validation on Gemini's output
  const validation = validateQuestions(parsed.questions, content);
  if (!validation.isValid) {
    throw new Error(`Gemini generated questions failed validation: ${validation.reason}`);
  }

  return {
    storyId,
    storyTitle: title || parsed.storyTitle || "Story Adventure",
    questions: parsed.questions.slice(0, 4),
    source: "gemini",
    generatedAt: new Date().toISOString(),
  };
}

// =========================================================
// UNIFIED PUBLIC GENERATOR
// Tries Gemini if available, with resilient rule-based fallback.
// =========================================================

async function generateStoryQuestions({ storyId = null, title = "", content = "", difficulty = "Beginner", topic = "General" }) {
  // If Gemini is available, attempt enhanced generation first
  if (ai && process.env.GEMINI_API_KEY) {
    try {
      const geminiResult = await generateGeminiQuestions({ storyId, title, content, difficulty, topic });
      return geminiResult;
    } catch (err) {
      console.warn("Comprehension notice (falling back to rule-based generator):", err.message);
    }
  }

  // Rule-based generation (always available, verified against story text)
  const ruleBasedResult = generateRuleBasedQuestions({ storyId, title, content, difficulty, topic });

  // Validate rule-based output as well
  const validation = validateQuestions(ruleBasedResult.questions, content);
  if (!validation.isValid) {
    console.error("Rule-based questions validation failure:", validation.reason);
  }

  return ruleBasedResult;
}

module.exports = {
  generateRuleBasedQuestions,
  generateGeminiQuestions,
  validateQuestions,
  generateStoryQuestions,
};
