// =========================================================
// LUMILEX AI — STORY FALLBACK SERVICE
// Provides a reliable, child-friendly fallback story generator
// when primary cloud AI (Gemini) encounters 503 high-demand,
// rate limits, or network interruptions.
//
// Features:
// 1. Ollama local AI fallback (using configured OLLAMA_MODEL e.g. gemma4:cloud)
// 2. High-quality deterministic personalized story generator
//    tailored to the child's interests, reading level, character, and mood.
// 3. Strict privacy and dyslexia-friendly formatting (short paragraphs).
// =========================================================

const http = require("http");

// Configuration from environment variables
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "gemma4:cloud";
const OLLAMA_TIMEOUT_MS = parseInt(process.env.OLLAMA_TIMEOUT_MS, 10) || 12000;

// =========================================================
// 1. DETERMINISTIC PERSONALIZED TEMPLATES & STORY DATA
// Tailored by interest, character, mood, and reading level.
// =========================================================

const THEME_DATA = {
  Animals: {
    characters: ["Pip the fluffy bunny", "Sam the orange cat", "Leo the friendly puppy", "Barnaby the cozy bear"],
    settings: ["a sunny clover meadow", "a quiet flower garden", "the shady oak grove"],
    items: ["a basket of sweet red berries", "a shiny little acorn", "a soft woolen ribbon"],
    activities: ["hopped across the mossy stepping stones", "listened to the gentle songbirds", "explored the winding woodland trail"],
    conclusions: ["curled up warmly under a shady willow tree and took a happy afternoon nap", "smiled proudly and shared a yummy treat with their forest friends"],
  },
  Space: {
    characters: ["Nova the little spaceship", "Orion the curious star explorer", "Cosmo the friendly moon bunny"],
    settings: ["the quiet purple galaxy", "a ring of sparkling blue ice crystals", "a peaceful glowing moon crater"],
    items: ["a shimmering star crystal", "a basket of sweet space berries", "a map of twinkling constellations"],
    activities: ["zoomed gently past a ring of laughing asteroids", "danced with the twinkling cosmic star fairies", "followed a trail of glittering stardust"],
    conclusions: ["smiled brightly and watched the twinkling stars light up the peaceful night sky", "looked out the window and whispered, 'Space is full of magic when we explore together!'"],
  },
  Nature: {
    characters: ["Lily the woodland explorer", "Buzzy the tiny honeybee", "Pip the gentle hedgehog"],
    settings: ["a peaceful mossy brook", "the whispering pine forest", "a warm sunny valley"],
    items: ["a bright golden leaf boat", "a drop of sweet flower nectar", "a smooth polished river pebble"],
    activities: ["guided a tiny yellow leaf boat down the bubbling water", "watched colorful butterflies dance in the warm sunshine", "planted a tiny shiny seed in the rich soft soil"],
    conclusions: ["listened to the peaceful song of the babbling brook and smiled with a happy heart", "celebrated because they knew that gentle care makes wonderful things grow"],
  },
  Fantasy: {
    characters: ["Spark the kind rainbow dragon", "Puff the cheerful cloud", "Twinkle the gentle star fairy"],
    settings: ["Whisper Valley", "the enchanted crystal meadow", "the candy-floss sky"],
    items: ["a bubble filled with lavender sweetness", "a wand of soft silver light", "a basket of sparkling cloud drops"],
    activities: ["blew fragrant rainbow bubbles that floated into the air", "sprinkled cool sweet lemonade drops over the thirsty flowers", "danced a gentle waltz with the friendly meadow creatures"],
    conclusions: ["spread colorful sparkles into the twilight and smiled, knowing kindness is the greatest magic of all", "celebrated with all their enchanted kingdom friends under the rainbow"],
  },
  Adventure: {
    characters: ["Captain Finley the brave otter", "Kip the springy kangaroo", "Maya the little explorer"],
    settings: ["Mirror Lake", "the ancient birch forest", "the sandy red trail"],
    items: ["an old polished wooden chest", "a friendly paper map", "a shiny brass compass"],
    activities: ["sailed a sturdy wooden raft across the crystal water", "hopped over babbling crystal brooks with extra bouncy leaps", "followed the trail of bright yellow flowers to a secret clearing"],
    conclusions: ["found that notes of kindness from friends are the greatest treasure in the whole world", "cheered happily and celebrated another brave, wonderful adventure"],
  },
  Friendship: {
    characters: ["Penny and Pip", "Barnaby Bear and Buzzy the Bee", "Mia and her friendly dog Toby"],
    settings: ["under the great shady oak tree", "a cozy wooden kitchen", "the sunny meadow picnic blanket"],
    items: ["a warm slice of honey pie", "a checkered red picnic cloth", "a basket full of crunchy apples"],
    activities: ["rolled sweet flour dough together at the kitchen table", "spread a checkered cloth and shared sweet treats", "helped each other carry the picnic basket along the winding path"],
    conclusions: ["shared a big warm hug and agreed that spending sunny days with friends is the best gift of all", "sat together under the cool shade, laughing and eating sweet treats"],
  },
};

// Generate cute title helper
function generateCuteTitle({ characterName = "", characterType = "", interest = "Adventure", mood = "Happy" }) {
  const char = characterName || (characterType === "Animal Friend" ? "A Little Friend" : "The Brave Explorer");
  const titles = [
    `${char} and the ${interest} Adventure`,
    `${char}'s ${mood} Day`,
    `The ${interest} Secret of ${char}`,
    `${char} and the Sunny Discovery`,
    `A ${mood} Journey with ${char}`,
  ];
  return titles[Math.floor(Math.random() * titles.length)].replace(/[.!?]/g, "");
}

// Generate personalized story text deterministically
function generateDeterministicStory({
  interests = ["Animals"],
  level = "Beginner",
  length = "Short",
  characterType = "Animal Friend",
  characterName = "",
  mood = "Happy",
  maxWords = 120,
}) {
  const primaryTopic = interests[0] || "Animals";
  const theme = THEME_DATA[primaryTopic] || THEME_DATA.Animals;

  // Determine character
  let hero = characterName ? characterName.trim() : "";
  if (!hero) {
    if (characterType === "Animal Friend") hero = theme.characters[0];
    else if (characterType === "Magical Character") hero = "Spark the magical friend";
    else hero = "A brave little adventurer";
  }

  // Select setting, activity, item, and conclusion
  const setting = theme.settings[Math.floor(Math.random() * theme.settings.length)];
  const item = theme.items[Math.floor(Math.random() * theme.items.length)];
  const activity = theme.activities[Math.floor(Math.random() * theme.activities.length)];
  const conclusion = theme.conclusions[Math.floor(Math.random() * theme.conclusions.length)];

  let storyParagraphs = [];

  if (level === "Beginner") {
    // 4-5 short, gentle sentences with easy words
    storyParagraphs = [
      `${hero} woke up early and smiled. It was a bright, sunny morning in ${setting}.`,
      `${hero} loved exploring new trails. Today was a very special day.`,
      `Along the way, ${hero} ${activity}. In the soft grass was ${item}!`,
      `"What a wonderful surprise!" cheered ${hero}. The day felt so warm and gentle.`,
      `At last, ${hero} ${conclusion}.`,
    ];
  } else if (level === "Intermediate") {
    storyParagraphs = [
      `Early one warm morning, ${hero} stepped outside to explore ${setting}. The gentle breeze carried the sweet scent of blooming wildflowers.`,
      `"Today is the perfect day for a big discovery," said ${hero} with a cheerful smile. Every step along the winding trail was full of wonder.`,
      `While exploring near the sparkling water, ${hero} ${activity}. Tucked safely between the soft green ferns rested ${item}.`,
      `"This is truly special," cheered ${hero}, holding it gently with both hands. It was the friendliest treasure of the day.`,
      `As the afternoon sun cast a warm golden glow across the valley, ${hero} ${conclusion}. It was an adventure filled with joy and peaceful memories.`,
    ];
  } else {
    // Advanced reader
    storyParagraphs = [
      `High above the rolling green hills, the morning sunlight danced across ${setting}. ${hero} packed a sturdy little satchel and prepared for an exciting new expedition.`,
      `"Every new path teaches us something wonderful," thought ${hero} as the soft woodland breeze rustled through the tall shady trees.`,
      `Along the journey, ${hero} ${activity}. Right beside the babbling crystal brook, ${hero} spotted ${item} resting gracefully in the sunlight.`,
      `With a proud and joyful heart, ${hero} carefully picked it up. A passing butterfly fluttered nearby in celebration, guiding the way back along the sunny meadow trail.`,
      `When evening arrived with soft purple twilight, ${hero} ${conclusion}. It was a magnificent adventure that will always be remembered.`,
    ];
  }

  // For Short length, select 3-4 paragraphs; for Medium/Long, keep full paragraphs
  if (length === "Short" && storyParagraphs.length > 4) {
    storyParagraphs = [storyParagraphs[0], storyParagraphs[2], storyParagraphs[3], storyParagraphs[storyParagraphs.length - 1]];
  }

  const storyContent = storyParagraphs.join("\n\n");
  const title = generateCuteTitle({ characterName: hero, characterType, interest: primaryTopic, mood });

  return {
    storyContent,
    title,
    source: "deterministic",
  };
}

// =========================================================
// 2. OLLAMA FALLBACK GENERATION (Local Gemma AI)
// Invokes the local Ollama instance if available.
// =========================================================

async function generateOllamaStory({
  interests = ["Animals"],
  level = "Beginner",
  length = "Short",
  characterType = "Animal Friend",
  characterName = "",
  mood = "Happy",
  maxWords = 120,
}) {
  const primaryTopic = interests.join(", ");
  const heroName = characterName?.trim() || "A little friend";

  const prompt = `You are a gentle children's author writing a reading story for a child with dyslexia (age 4-8).
Topic/Interests: ${primaryTopic}
Reading Level: ${level} (use very simple words, short sentences)
Length: ${length} (target length: ${maxWords} words)
Character: ${heroName} (${characterType})
Mood: ${mood}

RULES:
1. Write in 3 to 5 short paragraphs separated by blank lines.
2. Use short sentences and simple vocabulary.
3. Keep the story encouraging, cozy, and positive.
4. Do NOT include markdown titles, headings, or bullet points.
5. Return ONLY the story content.`;

  const requestBody = {
    model: OLLAMA_MODEL,
    messages: [
      { role: "system", content: "You are a gentle children's storybook author for children with dyslexia." },
      { role: "user", content: prompt },
    ],
    stream: false,
    options: {
      temperature: 0.7,
      top_p: 0.9,
    },
  };

  const endpoint = `${OLLAMA_BASE_URL.replace(/\/+$/, "")}/api/chat`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      throw new Error(`Ollama HTTP ${response.status}`);
    }

    const data = await response.json();
    const content = data?.message?.content?.trim() || "";

    if (!content || content.length < 30) {
      throw new Error("Ollama returned empty story content");
    }

    // Clean up content
    const cleaned = content.replace(/^#+.*$/gm, "").replace(/^\*\*.*?\*\*$/gm, "").trim();
    const title = generateCuteTitle({ characterName: heroName, characterType, interest: interests[0], mood });

    return {
      storyContent: cleaned,
      title,
      source: "ollama-gemma",
    };
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// =========================================================
// 3. UNIFIED RESILIENT FALLBACK ENTRY POINT
// Tries Ollama first if configured, then deterministic engine.
// =========================================================

async function generateFallbackStory(params) {
  // 1. Try local Ollama if reachable
  try {
    const ollamaResult = await generateOllamaStory(params);
    if (ollamaResult?.storyContent) {
      console.log("Successfully generated story using local Ollama model:", OLLAMA_MODEL);
      return ollamaResult;
    }
  } catch (ollamaErr) {
    console.warn("Ollama fallback notice (switching to deterministic generator):", ollamaErr.message);
  }

  // 2. Use guaranteed deterministic personalized generator
  console.log("Generating story using LumiLex deterministic personalized engine...");
  return generateDeterministicStory(params);
}

module.exports = {
  generateCuteTitle,
  generateDeterministicStory,
  generateOllamaStory,
  generateFallbackStory,
};
