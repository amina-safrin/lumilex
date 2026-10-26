// =========================================================
// LUMILEX AI — SEED LIBRARY STORIES
// Expands the Story Library with 50+ new short, accessible,
// dyslexia-friendly stories organized across 9 themes and
// 5 structured reading levels.
//
// Preserves all existing story IDs (1-12, 27-36) and user progress.
// Idempotent: Can be run multiple times safely without duplicates.
// =========================================================

const pool = require("./db");

// Helper to count words accurately
function countWords(text) {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// 1. UPDATES FOR EXISTING 22 LIBRARY STORIES
const existingLibraryUpdates = [
  {
    id: 1,
    difficulty: "Level 2 — Word Builders",
    topic: "Nature",
    phonics_focus: "Vowel team /ee/ and r-controlled /ar/",
    practice_words: ["rabbit", "garden", "flowers", "seed", "planted"],
    learning_objective: "Practice reading nature words with patience and gentle sequencing.",
  },
  {
    id: 2,
    difficulty: "Level 2 — Word Builders",
    topic: "Adventure",
    phonics_focus: "Vowel digraph /oo/ and long /igh/",
    practice_words: ["moon", "night", "sky", "shining", "stars"],
    learning_objective: "Read about the night sky with smooth vowel blending.",
  },
  {
    id: 3,
    difficulty: "Level 2 — Word Builders",
    topic: "Friendship",
    phonics_focus: "Digraph /sh/ and vowel team /ea/",
    practice_words: ["fox", "share", "apples", "friends", "hungry"],
    learning_objective: "Learn the joy of sharing while practicing consonant digraphs.",
  },
  {
    id: 4,
    difficulty: "Level 3 — Sentence Readers",
    topic: "Animals",
    phonics_focus: "Long /ea/ and digraph /ph/",
    practice_words: ["ocean", "beach", "dolphin", "swimming", "adventure"],
    learning_objective: "Build reading stamina with connected ocean adventure sentences.",
  },
  {
    id: 5,
    difficulty: "Level 3 — Sentence Readers",
    topic: "Space",
    phonics_focus: "R-controlled /ar/ and blends /sp/, /pl/",
    practice_words: ["stars", "explorer", "spaceship", "planet", "glowing"],
    learning_objective: "Explore imaginative space vocabulary with multi-word pacing.",
  },
  {
    id: 6,
    difficulty: "Level 1 — First Words",
    topic: "Friendship",
    phonics_focus: "Short vowels /a/, /i/ and sight words",
    practice_words: ["cat", "bird", "house", "wing", "friends"],
    learning_objective: "Practice foundational CVC words in a comforting friendship tale.",
  },
  {
    id: 7,
    difficulty: "Level 2 — Word Builders",
    topic: "Adventure",
    phonics_focus: "Long /ay/ and magic-e /ave/",
    practice_words: ["brave", "day", "school", "smiled", "playing"],
    learning_objective: "Encourage bravery and social confidence with common phonics patterns.",
  },
  {
    id: 8,
    difficulty: "Level 2 — Word Builders",
    topic: "Friendship",
    phonics_focus: "Vowel digraph /ue/ and r-controlled /ear/",
    practice_words: ["bear", "bluebird", "song", "tree", "morning"],
    learning_objective: "Recognize listening skills and gentle friendship words.",
  },
  {
    id: 9,
    difficulty: "Level 3 — Sentence Readers",
    topic: "Nature",
    phonics_focus: "Compound words and vowel team /ee/",
    practice_words: ["treehouse", "wooden", "ladder", "drawings", "reading"],
    learning_objective: "Read multi-sentence descriptions of a cozy outdoor reading space.",
  },
  {
    id: 10,
    difficulty: "Level 1 — First Words",
    topic: "Animals",
    phonics_focus: "Short /i/ and /u/ CVC words",
    practice_words: ["small", "turtle", "race", "best", "smile"],
    learning_objective: "Emphasize personal perseverance through simple decodable sentences.",
  },
  {
    id: 11,
    difficulty: "Level 3 — Sentence Readers",
    topic: "Fantasy",
    phonics_focus: "Consonant blends /dr/, /gr/ and digraph /ch/",
    practice_words: ["dragon", "green", "hill", "friends", "clouds"],
    learning_objective: "Practice fantasy words in a non-scary, friendly context.",
  },
  {
    id: 12,
    difficulty: "Level 2 — Word Builders",
    topic: "Nature",
    phonics_focus: "Diphthong /ai/ and r-controlled /ar/",
    practice_words: ["rainbow", "garden", "sparkle", "flowers", "sunlight"],
    learning_objective: "Read colorful descriptive words connected to weather and plants.",
  },
  {
    id: 27,
    difficulty: "Level 3 — Sentence Readers",
    topic: "Animals",
    phonics_focus: "Diphthong /ow/ and vowel team /oo/",
    practice_words: ["owl", "branch", "picture", "books", "adventures"],
    learning_objective: "Celebrate reading books with a lovable nocturnal owl companion.",
  },
  {
    id: 28,
    difficulty: "Level 3 — Sentence Readers",
    topic: "Fantasy",
    phonics_focus: "Diphthong /ou/ and vowel team /ai/",
    practice_words: ["cloud", "lemonade", "drops", "meadow", "summer"],
    learning_objective: "Enjoy playful imaginative fantasy with cheerful sensory words.",
  },
  {
    id: 29,
    difficulty: "Level 3 — Sentence Readers",
    topic: "Friendship",
    phonics_focus: "Magic-e /ake/ and vowel team /ee/",
    practice_words: ["bear", "baked", "honey", "table", "share"],
    learning_objective: "Read baking and collaboration steps in short, happy sentences.",
  },
  {
    id: 30,
    difficulty: "Level 4 — Little Adventures",
    topic: "Space",
    phonics_focus: "Vowel teams /ai/, /ee/ and r-controlled /ar/",
    practice_words: ["spaceship", "silver", "fairies", "galaxy", "glitter"],
    learning_objective: "Follow a multi-paragraph space journey with rich descriptive language.",
  },
  {
    id: 31,
    difficulty: "Level 3 — Sentence Readers",
    topic: "Animals",
    phonics_focus: "R-controlled /or/, /ear/ and blend /sh/",
    practice_words: ["seahorse", "pearl", "ocean", "shell", "melody"],
    learning_objective: "Read calm marine vocabulary with smooth pacing.",
  },
  {
    id: 32,
    difficulty: "Level 4 — Little Adventures",
    topic: "Nature",
    phonics_focus: "Blends /fr/, /cl/ and short vowels",
    practice_words: ["picnic", "hedgehog", "squirrel", "basket", "willow"],
    learning_objective: "Navigate outdoor picnic descriptions with compound animal names.",
  },
  {
    id: 33,
    difficulty: "Level 3 — Sentence Readers",
    topic: "Animals",
    phonics_focus: "Vowel team /oo/ and short /o/",
    practice_words: ["kangaroo", "hop", "brook", "parrot", "springy"],
    learning_objective: "Practice rhythmic, bouncy animal action verbs.",
  },
  {
    id: 34,
    difficulty: "Level 4 — Little Adventures",
    topic: "Fantasy",
    phonics_focus: "Diphthong /ow/ and blends /sc/, /sp/",
    practice_words: ["dragon", "rainbow", "bubbles", "sparkles", "scales"],
    learning_objective: "Experience comforting magical themes that ease reading anxiety.",
  },
  {
    id: 35,
    difficulty: "Level 3 — Sentence Readers",
    topic: "Nature",
    phonics_focus: "Digraph /wh/ and vowel team /oa/",
    practice_words: ["whispered", "brook", "boat", "stones", "water"],
    learning_objective: "Trace the gentle voyage of a leaf boat down a clear stream.",
  },
  {
    id: 36,
    difficulty: "Level 4 — Little Adventures",
    topic: "Adventure",
    phonics_focus: "Vowel team /ea/ and blend /tr/",
    practice_words: ["pirate", "treasure", "kindness", "otter", "lake"],
    learning_objective: "Discover that friendship and kind notes are the greatest treasures.",
  },
];

// 2. 54 NEW SHORT LIBRARY STORIES (6 per theme, across Levels 1 to 5)
const newLibraryStories = [
  // =========================================================
  // THEME 1: ANIMALS & PETS (Topic: Animals)
  // =========================================================
  {
    title: "Pip the Pup in the Mud",
    content: `Pip is a little pup.
Pip loves to run in the red mud.
He digs a big, deep pit with his paws.
Mama sees muddy Pip.
"Hop in the warm tub, Pip!" says Mama.
Pip gets a soft, bubbly scrub.
Now Pip is a clean, happy pup!`,
    difficulty: "Level 1 — First Words",
    topic: "Animals",
    character_type: "Animal Friend",
    character_name: "Pip",
    mood: "Happy",
    story_length: "Short",
    phonics_focus: "Short /u/ and /i/ CVC words (pup, mud, run, dig, tub, pit)",
    practice_words: ["pup", "mud", "run", "digs", "tub", "clean"],
    learning_objective: "Practice decoding short /u/ and /i/ CVC words with simple dialogue.",
  },
  {
    title: "Fox in the Red Box",
    content: `A sleek red fox sits on a mossy log.
He spots a big, shiny red box in the grass.
Hop, hop, hop!
The quick fox hops right inside the box.
The box is dry, soft, and warm.
He curls up his bushy tail and takes a cozy nap.
Good little fox!`,
    difficulty: "Level 1 — First Words",
    topic: "Animals",
    character_type: "Animal Friend",
    character_name: "Fox",
    mood: "Calm",
    story_length: "Short",
    phonics_focus: "Short /o/ and /e/ CVC words (fox, box, red, hop, log)",
    practice_words: ["fox", "box", "red", "hops", "warm", "tail"],
    learning_objective: "Recognize rhyming CVC words (-ox) in a calming animal tale.",
  },
  {
    title: "Dottie the Duck on the Blue Pond",
    content: `Dottie the duck glides across the calm blue pond.
She dips her flat yellow bill into the clear water.
Splash!
She catches a tiny water bug near the green reeds.
Dottie flaps her soft wings and gives a cheerful quack.
Three fuzzy ducklings swim fast behind her in a tidy line.`,
    difficulty: "Level 2 — Word Builders",
    topic: "Animals",
    character_type: "Animal Friend",
    character_name: "Dottie",
    mood: "Cheerful & Silly",
    story_length: "Short",
    phonics_focus: "Digraph /ck/ and blends /fl/, /sw/ (duck, flap, swim, pond)",
    practice_words: ["duck", "pond", "swim", "wings", "quack", "water"],
    learning_objective: "Reinforce /ck/ ending digraphs with animal swimming actions.",
  },
  {
    title: "Rusty the Kitten and the Silver Bell",
    content: `Rusty was a fuzzy orange kitten with velvet ears.
He wore a tiny silver bell on his blue collar.
Jingle, jingle, ring!
Rusty loved to stalk under the wooden kitchen table.
When he pounced at a red yarn ball, the bell sang a merry tune.
Rusty curled up on a sunny wool rug and purred sweetly.`,
    difficulty: "Level 2 — Word Builders",
    topic: "Animals",
    character_type: "Animal Friend",
    character_name: "Rusty",
    mood: "Cozy & Gentle",
    story_length: "Short",
    phonics_focus: "Ending blend /st/ and digraph /sh/ (rusty, kitten, bell, rug, purr)",
    practice_words: ["kitten", "bell", "ring", "table", "purred", "collar"],
    learning_objective: "Practice blends and sound-effect words with a pet kitten adventure.",
  },
  {
    title: "Barnaby Bunny's Lost Sweet Carrot",
    content: `Barnaby Bunny hopped happily along the garden path.
He dropped his sweetest crunchy carrot into the tall clover.
"Where can my orange carrot be?" sniffed Barnaby.
A friendly robin perched on the stone wall pointed her beak down.
Barnaby peeked under the wide green leaves and found his prize.
"Thank you, kind robin!" chirped Barnaby as he shared a crisp, tasty bite.`,
    difficulty: "Level 3 — Sentence Readers",
    topic: "Animals",
    character_type: "Animal Friend",
    character_name: "Barnaby",
    mood: "Warm & Sweet",
    story_length: "Short",
    phonics_focus: "Vowel teams /ee/ and /oa/ (sweet, robin, carrot, green, shared)",
    practice_words: ["bunny", "carrot", "clover", "robin", "garden", "shared"],
    learning_objective: "Follow character problem-solving and sharing in connected sentences.",
  },
  {
    title: "Shelby the Sea Turtle's Big Ocean Wave",
    content: `Shelby was a young green sea turtle with a patterned shell.
Today, the ocean tide was rising fast beneath the warm sun.
Shelby paddled her front flippers toward a gentle blue crest.
Whoosh!
The smooth wave carried her gliding over the sunny coral reef.
Tiny silver fish leaped playfully beside her shell.
Shelby steered safely into the calm sandy bay, eager to tell her family about her grand ride.`,
    difficulty: "Level 4 — Little Adventures",
    topic: "Animals",
    character_type: "Animal Friend",
    character_name: "Shelby",
    mood: "Adventurous & Wondrous",
    story_length: "Short",
    phonics_focus: "Compound words and long vowels (turtle, ocean, wave, flippers, coral)",
    practice_words: ["turtle", "ocean", "flippers", "coral", "shell", "gliding"],
    learning_objective: "Build reading stamina with rich marine wildlife vocabulary.",
  },

  // =========================================================
  // THEME 2: ADVENTURES & EXPLORATION (Topic: Adventure)
  // =========================================================
  {
    title: "Dan and the Big Red Map",
    content: `Dan has a big red map.
Dan puts the map in his brown bag.
He walks along the winding path.
He stops at a tall, grey rock.
Look!
Dan sees a blue bird resting in a twig nest.
Dan taps his paper map and smiles with joy.
Adventure is everywhere!`,
    difficulty: "Level 1 — First Words",
    topic: "Adventure",
    character_type: "Me",
    character_name: "Dan",
    mood: "Happy",
    story_length: "Short",
    phonics_focus: "Short /a/ CVC words (Dan, map, bag, path)",
    practice_words: ["map", "bag", "path", "rock", "bird", "nest"],
    learning_objective: "Read short CVC adventure sentences with high-frequency sight words.",
  },
  {
    title: "The Big Green Camp Tent",
    content: `Sam and his dad set up a bright green camp tent.
They put four sturdy wooden pegs into the damp grass.
Tap, tap, tap went the wooden mallet.
Inside, Sam rolled out his soft blue sleeping bag.
Dad lit a warm brass lamp.
Together, they listened happily to chirping crickets outside the tent door.`,
    difficulty: "Level 2 — Word Builders",
    topic: "Adventure",
    character_type: "Me",
    character_name: "Sam",
    mood: "Cozy & Gentle",
    story_length: "Short",
    phonics_focus: "Ending blends /mp/, /nt/, /st/ (camp, tent, rest, lamp, best)",
    practice_words: ["camp", "tent", "pegs", "grass", "lamp", "crickets"],
    learning_objective: "Master words ending in blends -mp and -nt during an outdoor camping tale.",
  },
  {
    title: "The Secret Meadow Trail",
    content: `Maya followed a winding dirt trail into the sunny valley.
Golden butterflies danced above purple clover blossoms.
Soon, the trail led to a whispering freshwater stream.
Flat stepping stones made a safe bridge across the water.
Maya stepped carefully from stone to stone until she reached the other bank.
In the middle of the grass stood a wild apple tree bursting with sweet fruit.`,
    difficulty: "Level 3 — Sentence Readers",
    topic: "Adventure",
    character_type: "Me",
    character_name: "Maya",
    mood: "Adventurous & Wondrous",
    story_length: "Short",
    phonics_focus: "Long /ai/ and /ea/ (trail, stream, reach, wait, clean)",
    practice_words: ["trail", "valley", "stream", "stones", "butterflies", "sweet"],
    learning_objective: "Practice long vowel teams in a peaceful nature trail exploration.",
  },
  {
    title: "The Cave of Whispering Echoes",
    content: `Leo found a tiny archway hidden beneath mossy pine branches.
It was the entrance to Whispering Cave.
Leo stepped onto the dry pebble floor and cupped his hands.
"Hello, cave!" called Leo.
"Hello, cave!" echoed back the stone walls in a friendly singsong.
A beam of warm sunlight shone through a crack in the ceiling, illuminating sparkling quartz crystals.
Leo sketched the glowing stones in his pocket notebook before skipping home.`,
    difficulty: "Level 4 — Little Adventures",
    topic: "Adventure",
    character_type: "Me",
    character_name: "Leo",
    mood: "Exciting",
    story_length: "Short",
    phonics_focus: "Digraphs /ch/, /sh/ and blends (echo, whisper, crystal, pebble, cave)",
    practice_words: ["cave", "whispering", "echoed", "crystals", "notebook", "sunlight"],
    learning_objective: "Read two-syllable descriptive words with confident decoding skills.",
  },
  {
    title: "Sailor Sam and the Dolphin Guide",
    content: `Sailor Sam steered his small wooden sailboat toward the outer bay.
Morning fog drifted across the rolling green swells.
Sam could not spot the tall red lighthouse through the grey mist.
Suddenly, a sleek grey dolphin surfaced beside the bow.
The dolphin clicked softly and leaped forward through the water.
Sam trusted his sea friend and followed the gentle ripples.
Within minutes, the warm sun broke through the clouds, revealing the safe sandy harbor and welcoming cheers from the dock.`,
    difficulty: "Level 5 — Confident Readers",
    topic: "Adventure",
    character_type: "Me",
    character_name: "Sam",
    mood: "Adventurous & Wondrous",
    story_length: "Short",
    phonics_focus: "Vowel team /oi/ and /ow/ (sail, guide, harbor, ocean, breeze)",
    practice_words: ["sailor", "sailboat", "dolphin", "harbor", "lighthouse", "ripples"],
    learning_objective: "Strengthen reading comprehension with rich seafaring narrative structure.",
  },
  {
    title: "The Mountain Peak Kite",
    content: `Toby carried his diamond kite up the grassy mountain slope.
High on the ridge, the cool mountain breeze blew steady and strong.
Toby held the spool tight and ran three quick steps.
Whoosh!
The scarlet kite soared into the blue sky like a proud bird.
From high above, Toby could see the tiny roofs of his village and winding river ribbons below.
Flying his kite made Toby feel like he could touch the clouds.`,
    difficulty: "Level 4 — Little Adventures",
    topic: "Adventure",
    character_type: "Me",
    character_name: "Toby",
    mood: "Exciting",
    story_length: "Short",
    phonics_focus: "Magic-e words and blends (kite, peak, glide, slope, breeze)",
    practice_words: ["mountain", "breeze", "kite", "village", "clouds", "soared"],
    learning_objective: "Practice magic-e long vowels in an uplifting outdoor adventure.",
  },

  // =========================================================
  // THEME 3: FAMILY & FRIENDSHIP (Topic: Friendship)
  // =========================================================
  {
    title: "Pip and Pop Give a Hug",
    content: `Pip is sad.
His little red toy truck broke.
Pop sees Pip sit and cry.
Pop runs to Pip fast.
Pop gives Pip a big, warm hug.
"Do not be sad, Pip," says Pop kindly.
Pip smiles and wipes a tear.
They sit in the warm sun and fix the toy truck together.`,
    difficulty: "Level 1 — First Words",
    topic: "Friendship",
    character_type: "Friend",
    character_name: "Pop",
    mood: "Warm & Sweet",
    story_length: "Short",
    phonics_focus: "Short /o/, /u/, /i/ CVC words (Pip, Pop, hug, run, sit, sad)",
    practice_words: ["hug", "sad", "truck", "smiles", "warm", "together"],
    learning_objective: "Read comforting emotional support words with simple CVC decodables.",
  },
  {
    title: "Baking Honey Buns with Gran",
    content: `Max visited Gran on a rainy Sunday morning.
Gran tied a bright yellow apron around Max's waist.
They stirred flour, butter, and sweet milk into a clay bowl.
Max rolled the thick dough with a wooden rolling pin.
Soon, six round buns baked golden brown in the warm oven.
Sharing fresh warm buns made the rainy day feel cozy and bright.`,
    difficulty: "Level 2 — Word Builders",
    topic: "Friendship",
    character_type: "Family",
    character_name: "Gran",
    mood: "Cozy & Gentle",
    story_length: "Short",
    phonics_focus: "Short /u/ and blends /br/, /st/ (gran, buns, stir, oven, warm)",
    practice_words: ["baked", "buns", "flour", "oven", "apron", "sharing"],
    learning_objective: "Reinforce kitchen and family vocabulary with sequential baking steps.",
  },
  {
    title: "The Cozy Friendship Quilt",
    content: `Ella and Nora wanted to make a special blanket for their clubhouse.
Ella brought squares of blue linen, and Nora brought soft yellow cotton.
Mother helped them thread a sturdy needle with green yarn.
Stitch by stitch, the two girls joined their favorite patches together.
When the quilt was finished, they wrapped it around both their shoulders and giggled with cozy delight.`,
    difficulty: "Level 3 — Sentence Readers",
    topic: "Friendship",
    character_type: "Friend",
    character_name: "Ella and Nora",
    mood: "Warm & Sweet",
    story_length: "Short",
    phonics_focus: "Digraph /qu/ and /th/ (quilt, patch, stitch, thread, friend)",
    practice_words: ["quilt", "blanket", "patches", "thread", "stitch", "shoulders"],
    learning_objective: "Read digraph /qu/ and /th/ words in a creative craft story.",
  },
  {
    title: "Sharing the Big Snow Sled",
    content: `Fresh snow covered Blueberry Hill like a fluffy white sheet.
Jack dragged his red wooden sled up the snowy bank.
At the summit, little Ben stood shivering with no sled of his own.
"Come ride with me, Ben!" called Jack kindly.
Both boys squeezed onto the wooden slats and zoomed down the slope, laughing loudly as cold powdery snow sprayed their boots.`,
    difficulty: "Level 3 — Sentence Readers",
    topic: "Friendship",
    character_type: "Friend",
    character_name: "Jack and Ben",
    mood: "Happy",
    story_length: "Short",
    phonics_focus: "Blends /sl/, /sp/ and long /o/ (sled, snow, slide, speed, hill)",
    practice_words: ["sled", "snow", "slope", "zoomed", "laughing", "shivering"],
    learning_objective: "Explore winter outdoor vocabulary and kindness toward others.",
  },
  {
    title: "The Teamwork Tree Bench",
    content: `Grandpa and Clara found three sturdy cedar planks behind the garden shed.
"Let us build a resting bench under the sweet apple tree," suggested Grandpa.
Clara held the brass ruler straight while Grandpa made neat pencil marks on the wood.
Clara sanded the rough edges until the cedar felt smooth as silk.
Together, they fastened the legs tight.
Sitting side by side on their handmade bench, they enjoyed sweet iced lemonade and watched blue jays flutter.`,
    difficulty: "Level 4 — Little Adventures",
    topic: "Friendship",
    character_type: "Family",
    character_name: "Clara and Grandpa",
    mood: "Warm & Sweet",
    story_length: "Short",
    phonics_focus: "Compound words and vowel teams (bench, cedar, planks, smooth, build)",
    practice_words: ["grandpa", "bench", "cedar", "sanded", "smooth", "handmade"],
    learning_objective: "Follow a multi-step woodworking project with collaborative dialogue.",
  },
  {
    title: "A Surprise Card for Maya",
    content: `Maya walked down the gravel driveway to check the green tin mailbox.
Inside lay a small turquoise envelope tied with a silver satin ribbon.
The address was written in neat purple crayon.
Maya unfolded the card and saw a crayon drawing of two girls holding hands beneath a bright yellow sunflower.
"Dear Maya, thank you for sharing your colored pencils on the first day of school. You are my best friend," read the note.
Maya held the cheerful card close to her heart and smiled all morning.`,
    difficulty: "Level 5 — Confident Readers",
    topic: "Friendship",
    character_type: "Friend",
    character_name: "Maya",
    mood: "Warm & Sweet",
    story_length: "Short",
    phonics_focus: "R-controlled vowels & multi-syllable (surprise, letter, mailbox, friend, ribbon)",
    practice_words: ["card", "envelope", "ribbon", "sunflower", "pencils", "mailbox"],
    learning_objective: "Read multi-paragraph epistolary text with rich descriptive nouns.",
  },

  // =========================================================
  // THEME 4: SCHOOL & LEARNING (Topic: School)
  // =========================================================
  {
    title: "Ned and His Red Pen",
    content: `Ned has a new pen.
The pen is bright red.
Ned takes off the black cap.
He prints his name on a clean white pad: N-E-D.
The teacher claps her hands with a warm smile.
"Good job, Ned!" she says.
Ned puts the red pen safely in his bag.`,
    difficulty: "Level 1 — First Words",
    topic: "School",
    character_type: "Me",
    character_name: "Ned",
    mood: "Happy",
    story_length: "Short",
    phonics_focus: "Short /e/ and /a/ CVC words (pen, red, cap, pad, Ned)",
    practice_words: ["pen", "red", "cap", "prints", "name", "claps"],
    learning_objective: "Reinforce short /e/ CVC spelling and classroom confidence.",
  },
  {
    title: "Show and Tell with Stan",
    content: `Today was Show and Tell in Mrs. Green's cheerful classroom.
Stan stood proudly at the front of the rug.
He pulled a smooth, striped river stone from his pocket.
"I found this shiny pebble by the rushing creek," explained Stan.
His classmates leaned forward to touch the cool stone.
Stan felt happy sharing his outdoor treasure.`,
    difficulty: "Level 2 — Word Builders",
    topic: "School",
    character_type: "Me",
    character_name: "Stan",
    mood: "Happy",
    story_length: "Short",
    phonics_focus: "Blends /st/, /sh/ (show, tell, stone, stand, class)",
    practice_words: ["classroom", "stone", "pebble", "creek", "sharing", "treasure"],
    learning_objective: "Practice /st/ consonant blends in a classroom presentation context.",
  },
  {
    title: "The Library Mystery Book",
    content: `Lucas loved visiting the school library on Tuesday afternoons.
He searched along the low wooden shelves for an exciting adventure tale.
Behind a row of tall green dictionaries, Lucas noticed a shiny book with a golden magnifying glass on its spine.
He opened the first page and read about a lost clock.
Lucas sat in the beanbag chair and read quietly until the bell rang.`,
    difficulty: "Level 3 — Sentence Readers",
    topic: "School",
    character_type: "Me",
    character_name: "Lucas",
    mood: "Calm",
    story_length: "Short",
    phonics_focus: "Vowel team /oo/ and digraph /sh/ (book, look, read, shelf, find)",
    practice_words: ["library", "shelves", "golden", "dictionaries", "magnifying", "adventure"],
    learning_objective: "Develop library navigation vocabulary and silent reading enthusiasm.",
  },
  {
    title: "The Tiny Sprout in the Paper Cup",
    content: `In science class, Miss Chen gave each child a brown paper cup and a striped bean seed.
Zoe filled her cup with rich dark soil.
She pushed the seed gently under the earth and sprinkled three drops of water on top.
She placed the cup on the sunny windowsill.
Four days later, a tiny emerald green sprout popped through the soil, reaching toward the sunshine.`,
    difficulty: "Level 3 — Sentence Readers",
    topic: "School",
    character_type: "Me",
    character_name: "Zoe",
    mood: "Adventurous & Wondrous",
    story_length: "Short",
    phonics_focus: "Blends /sp/, /gr/ and digraph /th/ (seed, soil, cup, grow, green)",
    practice_words: ["science", "seed", "soil", "sprout", "windowsill", "sunshine"],
    learning_objective: "Follow science experiment instructions with plant growth vocabulary.",
  },
  {
    title: "The Colorful Hallway Wall Mural",
    content: `The elementary school hallway had one plain white brick wall.
Today, Mr. Miller gave every child a paintbrush and jars of cheerful tempera paint.
Liam painted a smiling golden sun in the corner.
Sofia painted fluffy blue clouds and a soaring red cardinal.
Together, the class created a giant meadow full of dancing wildflowers and buzzing bees.
When parents walked down the hall, everyone stopped to admire the students' colorful masterpiece.`,
    difficulty: "Level 4 — Little Adventures",
    topic: "School",
    character_type: "Me",
    character_name: "Liam and Sofia",
    mood: "Happy",
    story_length: "Short",
    phonics_focus: "Multi-syllable & blends (mural, paint, brush, cardinal, masterpiece)",
    practice_words: ["hallway", "paint", "paintbrush", "cardinal", "wildflowers", "masterpiece"],
    learning_objective: "Read collaborative artistic verbs and compound classroom words.",
  },
  {
    title: "Spelling Bee Champion Chloe",
    content: `The school auditorium was filled with quiet excitement for the annual second-grade spelling bee.
Chloe stood on the wooden stage and took a slow, calming breath.
The head teacher spoke clearly into the microphone: "Chloe, your word is 'whisper'."
Chloe closed her eyes for two seconds and pictured the letters in her mind: W-H-I-S-P-E-R.
"W-H-I-S-P-E-R, whisper," said Chloe into the mic.
"That is correct!" beamed the judges.
The entire crowd burst into enthusiastic applause as Chloe received a small bronze ribbon.`,
    difficulty: "Level 5 — Confident Readers",
    topic: "School",
    character_type: "Me",
    character_name: "Chloe",
    mood: "Happy",
    story_length: "Short",
    phonics_focus: "Syllable breakdown and silent letters (champion, trophy, spell, whisper, proud)",
    practice_words: ["auditorium", "spelling", "whisper", "microphone", "applause", "ribbon"],
    learning_objective: "Celebrate literacy achievements with multi-syllable school vocabulary.",
  },

  // =========================================================
  // THEME 5: NATURE, PLANTS & WEATHER (Topic: Nature)
  // =========================================================
  {
    title: "The Hot Sun and the Bug",
    content: `The sun is big and hot.
The sun shines on wet red mud.
A tiny red bug sits on a dry twig.
The wet mud dries fast in the heat.
The bug runs on six little legs.
The warm sun makes green grass grow tall.
Nature is good and bright!`,
    difficulty: "Level 1 — First Words",
    topic: "Nature",
    character_type: "Animal Friend",
    character_name: "Bug",
    mood: "Happy",
    story_length: "Short",
    phonics_focus: "Short /u/ and /a/ CVC words (sun, mud, bug, hot, dry, legs)",
    practice_words: ["sun", "mud", "bug", "twig", "grass", "heat"],
    learning_objective: "Decode short /u/ words while observing natural weather and plant life.",
  },
  {
    title: "The Singing Raindrops on the Roof",
    content: `Grey clouds gathered over the pine forest.
Pitter, patter, plop!
Soft raindrops fell upon the cabin roof.
Toby stood by the glass window in his woolen socks.
Each water drop made a merry tapping sound against the sill.
The garden flowers lifted their heads and drank the sweet rain with gratitude.`,
    difficulty: "Level 2 — Word Builders",
    topic: "Nature",
    character_type: "Me",
    character_name: "Toby",
    mood: "Cozy & Gentle",
    story_length: "Short",
    phonics_focus: "Ending blend /ng/ and vowel digraph /ai/ (rain, drop, sing, roof, song)",
    practice_words: ["raindrops", "roof", "cabin", "window", "flowers", "drank"],
    learning_objective: "Read sound-imitation words and calming weather descriptions.",
  },
  {
    title: "The Mighty Oak from a Tiny Acorn",
    content: `An old brown acorn fell from a giant oak tree with a tiny thump.
It rolled into a soft patch of green moss.
Winter brought cold white snow that tucked the acorn safely under the soil.
When spring arrived with warm golden sunshine, the acorn pushed up two emerald leaves.
Years from now, the tiny sprout will become a mighty forest oak tree.`,
    difficulty: "Level 3 — Sentence Readers",
    topic: "Nature",
    character_type: "Nature",
    character_name: "Acorn",
    mood: "Adventurous & Wondrous",
    story_length: "Short",
    phonics_focus: "Long /oa/ and /ow/ (oak, acorn, grow, ground, tall)",
    practice_words: ["acorn", "oak", "winter", "spring", "sprout", "mighty"],
    learning_objective: "Follow cyclical natural life stages through connected sentences.",
  },
  {
    title: "The Dancing Autumn Leaves",
    content: `A crisp October wind swept through the backyard maple tree.
Amber, ruby, and golden leaves swirled into the air like bright butterflies.
Oliver raked the dry leaves into a giant mountain near the wooden fence.
He took three running steps and jumped right into the middle!
Crunchy leaves scattered everywhere while Oliver laughed into the crisp autumn breeze.`,
    difficulty: "Level 3 — Sentence Readers",
    topic: "Nature",
    character_type: "Me",
    character_name: "Oliver",
    mood: "Happy",
    story_length: "Short",
    phonics_focus: "Diphthongs /ou/, /ow/ and blends /bl/ (autumn, leaf, wind, brown, dance)",
    practice_words: ["autumn", "leaves", "maple", "raked", "mountain", "breeze"],
    learning_objective: "Explore seasonal changes and playful outdoor harvest vocabulary.",
  },
  {
    title: "The Secret Moss Waterfall",
    content: `Deep inside Fern Canyon, hiking twins Sam and Jamie heard a rushing sound like pouring crystal.
They pushed past giant velvet ferns and discovered a hidden waterfall.
Cool water tumbled over dark granite rocks and formed a circular turquoise pool.
Emerald moss covered the damp stones like a thick green carpet.
Tiny rainbow mist danced in the morning light as dragonflies zipped across the water's surface, creating a magical sanctuary.`,
    difficulty: "Level 4 — Little Adventures",
    topic: "Nature",
    character_type: "Me",
    character_name: "Sam and Jamie",
    mood: "Adventurous & Wondrous",
    story_length: "Short",
    phonics_focus: "Digraphs /sh/, /th/ and blends /sp/, /fl/ (waterfall, stream, moss, spray, rocks)",
    practice_words: ["waterfall", "canyon", "granite", "moss", "dragonflies", "sanctuary"],
    learning_objective: "Expand nature vocabulary with sensory adjectives and geography terms.",
  },
  {
    title: "The Morning Meadow Dewdrop Jewels",
    content: `Before the village rooster crowed, Clara slipped on her yellow rubber boots and stepped out into the misty meadow.
Every blade of clover held a perfectly round, sparkling drop of morning dew.
Spiderwebs woven between tall thistle stalks looked like necklaces of glistening diamond beads.
As the golden morning sun climbed over the distant pine ridge, the whole valley sparkled with brilliant light.
Clara walked softly across the damp grass, careful not to disturb the peaceful awakening of the slumbering forest.`,
    difficulty: "Level 5 — Confident Readers",
    topic: "Nature",
    character_type: "Me",
    character_name: "Clara",
    mood: "Calm",
    story_length: "Short",
    phonics_focus: "Vowel variations & compound words (morning, meadow, dewdrop, sparkle, spiderweb)",
    practice_words: ["meadow", "sparkling", "spiderwebs", "necklace", "sparkled", "slumbering"],
    learning_objective: "Appreciate poetic nature descriptions with advanced decodable adjectives.",
  },

  // =========================================================
  // THEME 6: FANTASY & MAGICAL ADVENTURES (Topic: Fantasy)
  // =========================================================
  {
    title: "Pip the Elf and the Blue Gem",
    content: `Pip is a tiny elf.
Pip digs in a dim cave with his pick.
Tap, tap!
He hits a hard, round rock.
A shiny blue gem pops right out.
Pip puts the blue gem in his green cap.
The gem glows bright in the dark.
Pip skips home with a happy grin!`,
    difficulty: "Level 1 — First Words",
    topic: "Fantasy",
    character_type: "Magical Character",
    character_name: "Pip",
    mood: "Happy",
    story_length: "Short",
    phonics_focus: "Short /e/ and /i/ CVC words (elf, gem, dig, hit, cap, dim)",
    practice_words: ["elf", "gem", "digs", "rock", "glows", "happy"],
    learning_objective: "Read basic fantasy terms using simple, accessible short-vowel decodables.",
  },
  {
    title: "The Cloud Dragon's Silver Whistle",
    content: `Spark was a little cloud dragon who lived above the snowy peaks.
Unlike fiery dragons, Spark had scales made of soft silver fog.
Spark blew through a polished wooden whistle.
Sweet musical notes floated through the sky, turning grey thunderstorm clouds into fluffy pink cotton candy!
The forest birds chirped happily along with Spark's breezy tune.`,
    difficulty: "Level 2 — Word Builders",
    topic: "Fantasy",
    character_type: "Magical Character",
    character_name: "Spark",
    mood: "Cheerful & Silly",
    story_length: "Short",
    phonics_focus: "Digraph /wh/ and blend /cl/ (cloud, dragon, whistle, sky, blow)",
    practice_words: ["dragon", "cloud", "silver", "whistle", "scales", "musical"],
    learning_objective: "Practice /wh/ digraphs in a gentle, non-threatening dragon adventure.",
  },
  {
    title: "The Magic Paintbrush of Dawn",
    content: `Young fairy Lyra owned a tiny paintbrush made from dried silver reeds.
Whenever twilight faded into dawn, Lyra dipped her bristles into cups of starlight dew.
With three gentle strokes across the horizon, she painted ribbons of coral pink, lavender, and honey gold across the sky.
The sleepy world woke up to a radiant sunrise, marveling at the beauty Lyra painted with her silent strokes.`,
    difficulty: "Level 3 — Sentence Readers",
    topic: "Fantasy",
    character_type: "Magical Character",
    character_name: "Lyra",
    mood: "Adventurous & Wondrous",
    story_length: "Short",
    phonics_focus: "Vowel team /ai/ and blends /br/, /st/ (brush, paint, color, dawn, shine)",
    practice_words: ["fairy", "paintbrush", "starlight", "horizon", "sunrise", "lavender"],
    learning_objective: "Read colorful artistic metaphors in a gentle fairy tale setting.",
  },
  {
    title: "The Whispering Crystal Cave",
    content: `While exploring the base of Mount Sparkle, wizard apprentice Finn found a doorway formed by purple amethyst pillars.
Inside, hundreds of crystal stalactites hummed a sweet, soothing lullaby.
Finn gently tapped a blue crystal with his birch wand.
A shower of safe, sparkling stardust floated down, healing the wilting buttercup flowers in Finn's satchel.
Finn smiled warmly, knowing this enchanted sanctuary would always be a refuge of peace and wonders for all gentle woodland creatures.`,
    difficulty: "Level 4 — Little Adventures",
    topic: "Fantasy",
    character_type: "Magical Character",
    character_name: "Finn",
    mood: "Magical",
    story_length: "Short",
    phonics_focus: "Digraph /wh/ and long vowels (crystal, cave, whisper, glow, magic)",
    practice_words: ["wizard", "amethyst", "crystal", "lullaby", "stardust", "enchanted"],
    learning_objective: "Follow magic apprentice narratives with gentle problem resolutions.",
  },
  {
    title: "The Star Sprite and the Stolen Lantern",
    content: `High atop Starlight Spire lived Glimmer, an energetic sprite who tended the celestial lanterns.
One chilly midnight, a mischievous shadow goblin crept in and swiped the golden lantern that guided sailing ships into port.
Glimmer did not panic.
She sprinkled luminescent stardust on her gossamer wings and soared gracefully down the moonlit canyon.
Glimmer offered the shivering goblin a cozy velvet scarf in trade.
Touched by her kindness, the goblin handed back the glowing lantern, and together they illuminated the harbor waves safely.`,
    difficulty: "Level 5 — Confident Readers",
    topic: "Fantasy",
    character_type: "Magical Character",
    character_name: "Glimmer",
    mood: "Magical",
    story_length: "Short",
    phonics_focus: "Multi-syllable & soft c/g (lantern, sprite, stolen, shadows, sparkle)",
    practice_words: ["celestial", "lantern", "goblin", "stardust", "illuminated", "shivering"],
    learning_objective: "Appreciate character empathy and peaceful conflict resolution in fantasy.",
  },
  {
    title: "The Pocket Pixie's Acorn Tea Party",
    content: `Underneath a flowering elderberry bush, a thumb-sized pixie named Clover was setting a tiny circular table.
She used polished acorn caps for teacups and wild strawberry slices for cakes.
Her guest of honor, an emerald bumblebee named Barnaby, buzzed in and hovered politely above a rose petal cushion.
Clover poured sweet honeydew tea from a bluebell pitcher.
They spent the entire golden afternoon trading jokes and listening to the rustling breeze in the tall clover.`,
    difficulty: "Level 4 — Little Adventures",
    topic: "Fantasy",
    character_type: "Magical Character",
    character_name: "Clover",
    mood: "Cheerful & Silly",
    story_length: "Short",
    phonics_focus: "Short & long vowels, blends (pixie, acorn, tea, blossom, petal)",
    practice_words: ["pixie", "acorn", "teacups", "bumblebee", "pitcher", "honeydew"],
    learning_objective: "Read whimsical miniaturized scale descriptions with confident fluency.",
  },

  // =========================================================
  // THEME 7: VEHICLES & MACHINES (Topic: Vehicles)
  // =========================================================
  {
    title: "The Big Red City Bus",
    content: `The big city bus is bright red.
The bus has six large black wheels.
Honk, honk!
The red bus stops at the street curb.
Ben steps onto the bus with his mom.
He sits by a big glass window.
The red bus rolls smoothly down the lane.
Riding the bus is fun!`,
    difficulty: "Level 1 — First Words",
    topic: "Vehicles",
    character_type: "Vehicle",
    character_name: "Bus",
    mood: "Happy",
    story_length: "Short",
    phonics_focus: "Short /u/ and /e/ CVC words (bus, red, get, run, stop)",
    practice_words: ["bus", "red", "wheels", "stops", "window", "riding"],
    learning_objective: "Practice short /u/ words with familiar public transit settings.",
  },
  {
    title: "The Little Blue Tugboat in the Harbor",
    content: `Barnaby was a small but sturdy blue tugboat.
He lived in the busy salty harbor.
Toot, toot! went Barnaby's shiny brass horn.
When a giant cargo ship arrived from across the deep sea, Barnaby pressed his thick rubber bumper against its hull.
With a steady push, the little tug guided the giant ship safely to the dock.`,
    difficulty: "Level 2 — Word Builders",
    topic: "Vehicles",
    character_type: "Vehicle",
    character_name: "Barnaby",
    mood: "Happy",
    story_length: "Short",
    phonics_focus: "Short /u/ and blends /bl/, /st/ (tug, boat, blue, dock, push)",
    practice_words: ["tugboat", "harbor", "cargo", "ship", "push", "dock"],
    learning_objective: "Learn about harbor teamwork through clear boat action verbs.",
  },
  {
    title: "The Red Fire Engine to the Rescue",
    content: `Clang, clang, wee-woo!
Engine Number Five dashed out of the fire station doors.
Firefighter Dave steered the shiny red truck down Maple Avenue with flashing scarlet lights.
A frightened orange kitten was stuck high in the branches of Mrs. Gable's oak tree.
Firefighter Dave extended the tall silver ladder smoothly.
He climbed up, cuddled the kitten safely in his coat, and brought it down to cheers.`,
    difficulty: "Level 3 — Sentence Readers",
    topic: "Vehicles",
    character_type: "Vehicle",
    character_name: "Engine Five",
    mood: "Exciting",
    story_length: "Short",
    phonics_focus: "Digraph /ck/, /ch/ and blends /tr/, /sp/ (truck, fire, ladder, spray, save)",
    practice_words: ["firefighter", "engine", "ladder", "kitten", "station", "truck"],
    learning_objective: "Read exciting community helper vocabulary with comforting outcomes.",
  },
  {
    title: "Bicycle Ben's Great Hill Ride",
    content: `Ben strapped on his bright yellow helmet and gripped his bicycle handlebars firmly.
Today he was ready to pedal up the long slope of Greenview Hill.
Push, pedal, push!
Ben's legs pumped steadily against the pedals.
When he reached the summit, the cool wind cheered him on.
Ben tapped his handbrakes gently and coasted down the smooth asphalt path, smiling at his exciting triumph.`,
    difficulty: "Level 3 — Sentence Readers",
    topic: "Vehicles",
    character_type: "Me",
    character_name: "Ben",
    mood: "Happy",
    story_length: "Short",
    phonics_focus: "Magic-e words and blends (bike, pedal, hill, brake, zoom)",
    practice_words: ["bicycle", "helmet", "handlebars", "pedals", "slope", "brakes"],
    learning_objective: "Practice bicycle safety words and physical persistence.",
  },
  {
    title: "The Little Steam Train that Carried Apples",
    content: `Chugga-chugga, choo-choo!
Rusty was a cheerful emerald steam locomotive with shiny brass whistles.
Every autumn, farmers loaded Rusty's wooden railcars with crates of crisp red apples and sweet cider barrels.
Rusty puffed white billows of steam into the crisp mountain air as he chugged up the twisting tracks.
When Rusty delivered the harvest to the bustling village depot, the stationmaster rang the brass bell and thanked the hardworking little train with fresh coal.`,
    difficulty: "Level 4 — Little Adventures",
    topic: "Vehicles",
    character_type: "Vehicle",
    character_name: "Rusty",
    mood: "Happy",
    story_length: "Short",
    phonics_focus: "Compound words & vowel digraphs (engine, steam, whistle, orchard, track)",
    practice_words: ["locomotive", "railcars", "whistles", "harvest", "apples", "tracks"],
    learning_objective: "Read railway transport and harvest distribution terms in sequential order.",
  },
  {
    title: "Maya's Clean Solar Scooter Adventure",
    content: `Maya and her father spent Saturday afternoon assembling an electric scooter equipped with a sleek solar roof panel.
Once the indicator light turned brilliant emerald green, Maya snapped on her matching elbow pads and zipped onto the park trail.
The scooter glided silently over the smooth concrete path without any smoky fumes.
Maya waved to neighbors strolling with their dogs.
"The warm sun powers my whole journey!" cheered Maya happily as the clean energy propelled her smoothly past the duck pond and sports field.`,
    difficulty: "Level 5 — Confident Readers",
    topic: "Vehicles",
    character_type: "Me",
    character_name: "Maya",
    mood: "Adventurous & Wondrous",
    story_length: "Short",
    phonics_focus: "Multi-syllable & soft c (solar, scooter, battery, sunshine, explore)",
    practice_words: ["scooter", "electric", "solar", "concrete", "energy", "propelled"],
    learning_objective: "Introduce modern green technology and clean energy concepts in storytelling.",
  },

  // =========================================================
  // THEME 8: SPORTS, GAMES & HOBBIES (Topic: Sports)
  // =========================================================
  {
    title: "Sam Hits the Red Ball",
    content: `Sam has a wooden bat.
Tim throws a soft red ball.
Swish, crack!
Sam hits the ball high in the air.
The ball flies onto the green grass.
"Run, Sam, run!" yells Tim.
Sam runs fast to the white bag.
Good hit, Sam!
Playing ball is fun!`,
    difficulty: "Level 1 — First Words",
    topic: "Sports",
    character_type: "Me",
    character_name: "Sam",
    mood: "Happy",
    story_length: "Short",
    phonics_focus: "Short /a/ and /i/ CVC words (hit, bat, ball, run, bag, red)",
    practice_words: ["bat", "ball", "hits", "runs", "grass", "play"],
    learning_objective: "Practice baseball CVC action verbs with high-energy punctuation.",
  },
  {
    title: "The Jump Rope Playground Rhythm",
    content: `Lily and Emma held the wooden handles of a long cotton jump rope.
Turn, turn, turn went the rope against the paved school yard.
Maya leaped inside with light, springy feet.
"One, two, three, jump high with me!" sang the girls together.
Maya skipped without tripping once, earning high-fives from the cheering circle.`,
    difficulty: "Level 2 — Word Builders",
    topic: "Sports",
    character_type: "Friend",
    character_name: "Maya",
    mood: "Happy",
    story_length: "Short",
    phonics_focus: "Short /u/ and blends /mp/, /sk/ (jump, rope, skip, rhythm, turn)",
    practice_words: ["jump", "rope", "handles", "yard", "skipped", "cheering"],
    learning_objective: "Read rhythmic counting rhymes and playground cooperation verbs.",
  },
  {
    title: "Soccer Star Leo's Winning Goal",
    content: `The yellow team and blue team were tied in the final minute of the Saturday soccer match.
Leo ran fast down the right sideline, keeping his soccer ball close to his cleats.
A defender sprinted toward him.
Leo cleverly passed the ball to his teammate Lucas.
Lucas crossed it back cleanly.
Thump!
Leo kicked the ball into the corner of the net for the winning goal.`,
    difficulty: "Level 3 — Sentence Readers",
    topic: "Sports",
    character_type: "Me",
    character_name: "Leo",
    mood: "Exciting",
    story_length: "Short",
    phonics_focus: "Long /oa/ and blends /sc/, /st/ (goal, kick, score, grass, net)",
    practice_words: ["soccer", "cleats", "teammate", "passed", "kicked", "goal"],
    learning_objective: "Follow fast-paced team sports action and supportive passing play.",
  },
  {
    title: "The Rainy Day Jigsaw Puzzle",
    content: `Rain poured steadily against the living room windowpanes.
Maya and her brother Noah dumped a hundred cardboard puzzle pieces onto the coffee table.
First, they turned all the pieces face up.
Noah gathered the flat border pieces while Maya sorted the bright blue sky sections.
Clicking the final red barn piece into the center, the siblings high-fived each other proudly over their completed artwork.`,
    difficulty: "Level 3 — Sentence Readers",
    topic: "Sports",
    character_type: "Family",
    character_name: "Maya and Noah",
    mood: "Cozy & Gentle",
    story_length: "Short",
    phonics_focus: "Digraphs /zz/, /ck/ and blends (puzzle, piece, table, corner, edge)",
    practice_words: ["puzzle", "cardboard", "pieces", "border", "completed", "siblings"],
    learning_objective: "Reinforce problem-solving strategies and indoor hobby collaboration.",
  },
  {
    title: "The Great Treehouse Chess Match",
    content: `Inside their wooden backyard treehouse, Oliver and Toby set up a checkered wooden chessboard.
The autumn breeze rustled through the oak branches above.
Oliver moved his white wooden knight in a clever L-shaped hop over Toby's black pawn.
Toby tapped his chin thoughtfully, studying the board before advancing his bishop diagonally.
Win or lose, both friends loved the quiet focus of the game and celebrated each clever move with warm cinnamon apple slices.`,
    difficulty: "Level 4 — Little Adventures",
    topic: "Sports",
    character_type: "Friend",
    character_name: "Oliver and Toby",
    mood: "Calm",
    story_length: "Short",
    phonics_focus: "Digraphs /ch/, /th/ and blends (chess, board, knight, castle, think)",
    practice_words: ["chessboard", "knight", "bishop", "thoughtfully", "checkered", "celebrated"],
    learning_objective: "Explore thoughtful strategic game vocabulary and gracious sportsmanship.",
  },
  {
    title: "Clara's First Roller Skate Spin",
    content: `Clara laced her four-wheel roller skates tightly and tested the toe stoppers against the polished wooden floor of the roller rink.
Upbeat music echoed from the ceiling speakers while colorful disco lights danced across the boards.
Clara took two cautious glides, keeping her knees gently bent for balance.
Feeling brave, she pushed smoothly with her left foot, tucked her arms in close, and executed a complete circular spin!
Her older sister clapped enthusiastically from the barrier as Clara skated forward with radiant confidence.`,
    difficulty: "Level 5 — Confident Readers",
    topic: "Sports",
    character_type: "Me",
    character_name: "Clara",
    mood: "Exciting",
    story_length: "Short",
    phonics_focus: "Multi-syllable & vowel combinations (roller, skate, balance, ribbon, spin)",
    practice_words: ["roller", "skates", "balance", "glides", "circular", "confidence"],
    learning_objective: "Read descriptive movement verbs and celebrate motor skill mastery.",
  },

  // =========================================================
  // THEME 9: EVERYDAY LIFE & HELPFUL ACTIONS (Topic: Everyday)
  // =========================================================
  {
    title: "Dan Cleans the Big Pan",
    content: `The big cooking pan has black spots.
Dad fills the deep kitchen sink with warm suds.
Dan grabs a soft yellow rag.
Rub, scrub, rub!
Dan rubs the big pan clean.
"Thank you for helping, Dan," says Dad with a warm hug.
Helping at home feels good and makes everyone smile!`,
    difficulty: "Level 1 — First Words",
    topic: "Everyday",
    character_type: "Me",
    character_name: "Dan",
    mood: "Happy",
    story_length: "Short",
    phonics_focus: "Short /a/ and /i/ CVC words (pan, rag, sink, rub, clean)",
    practice_words: ["pan", "sink", "suds", "scrub", "clean", "helping"],
    learning_objective: "Encourage household helpfulness with rhythmic CVC chore words.",
  },
  {
    title: "The Lost Kitty's Pink Collar",
    content: `While walking down Elm Street, Maya spotted a tiny grey kitten shivering on Mrs. Higgins' front steps.
On the kitten's pink collar was a silver tag with a telephone number.
Maya ran inside and asked her mother to dial the number.
Minutes later, a relieved neighbor arrived, hugging the lost kitten tightly and thanking Maya warmly for her quick kindness.`,
    difficulty: "Level 2 — Word Builders",
    topic: "Everyday",
    character_type: "Me",
    character_name: "Maya",
    mood: "Warm & Sweet",
    story_length: "Short",
    phonics_focus: "Short /o/ and blends /st/, /sp/ (lost, cat, spot, porch, bell)",
    practice_words: ["kitten", "collar", "telephone", "neighbor", "kindness", "shivering"],
    learning_objective: "Demonstrate community helpfulness and animal care with real-life actions.",
  },
  {
    title: "Baking Oatmeal Cookies for Mr. Gable",
    content: `Elderly Mr. Gable lived alone down the quiet lane and had recently broken his walking cane.
Lily decided to bake him a batch of warm oatmeal raisin cookies.
She measured brown sugar carefully and dropped round dollops of batter onto the cookie sheet.
When the cookies cooled, Lily carried the covered plate to Mr. Gable's porch.
The sweet surprise brought a bright tearful smile to his face.`,
    difficulty: "Level 3 — Sentence Readers",
    topic: "Everyday",
    character_type: "Me",
    character_name: "Lily",
    mood: "Warm & Sweet",
    story_length: "Short",
    phonics_focus: "Long /oo/ and blends /sm/, /ch/ (cookie, bake, smile, tray, warm)",
    practice_words: ["oatmeal", "cookies", "bake", "lane", "surprise", "porch"],
    learning_objective: "Learn intergenerational kindness and thoughtful neighborhood care.",
  },
  {
    title: "Planting the Community Vegetable Garden",
    content: `Saturday morning was cleanup day at the neighborhood community garden.
Liam carried a small green watering can while his neighbors pulled stubborn weeds from the carrot patch.
Liam dug three small holes in the dark, crumbly earth and gently buried tomato seedlings.
He showered each plant with fresh water.
Working together under the morning sun made the whole neighborhood feel like one big happy family.`,
    difficulty: "Level 3 — Sentence Readers",
    topic: "Everyday",
    character_type: "Me",
    character_name: "Liam",
    mood: "Happy",
    story_length: "Short",
    phonics_focus: "R-controlled /ar/, /er/ and blends (plant, garden, shovel, water, earth)",
    practice_words: ["community", "garden", "seedlings", "watering", "tomato", "neighbors"],
    learning_objective: "Highlight civic collaboration and gardening in decodable sentences.",
  },
  {
    title: "Nora's Children's Clinic Book Drive",
    content: `Nora's bedroom bookshelf was overflowing with storybooks she had read when she was younger.
Instead of packing them into the dusty attic, Nora decorated three cardboard boxes with colorful marker drawings.
She organized a book drive for the local children's clinic.
Her school friends brought in dozens of picture books and early readers.
When Nora delivered forty books to the clinic waiting room, the smiling nurses said the stories would bring comfort to visiting children.`,
    difficulty: "Level 4 — Little Adventures",
    topic: "Everyday",
    character_type: "Me",
    character_name: "Nora",
    mood: "Warm & Sweet",
    story_length: "Short",
    phonics_focus: "Multi-syllable & compound words (donation, library, boxes, children, share)",
    practice_words: ["bookshelf", "decorated", "clinic", "picture", "nurses", "comfort"],
    learning_objective: "Inspire book donations and community giving with multi-sentence paragraphs.",
  },
  {
    title: "The Helpful Sidewalk Snow Shovelers",
    content: `Overnight, a gentle blizzard blanketed the village sidewalks in eight inches of sparkling powder.
Before playing in the snow, Ethan and his sister Chloe zipped up their heavy winter parkas and grabbed two lightweight plastic shovels.
Together, they cleared the long concrete walkway leading to Mrs. Henderson's front door so the postal worker could deliver mail safely.
Seeing the clean path through her window, Mrs. Henderson tapped on the glass, waved gratefully, and brought the siblings mugs of steaming hot cocoa topped with fluffy marshmallows.`,
    difficulty: "Level 5 — Confident Readers",
    topic: "Everyday",
    character_type: "Family",
    character_name: "Ethan and Chloe",
    mood: "Cozy & Gentle",
    story_length: "Short",
    phonics_focus: "Multi-syllable & long vowels (shovel, sidewalk, pathway, neighbor, cocoa)",
    practice_words: ["blizzard", "sidewalks", "shovels", "walkway", "winter", "marshmallows"],
    learning_objective: "Read extended winter narrative highlighting civic duty and heartwarming rewards.",
  },
];

async function seedLibraryStories() {
  console.log("\n========================================================");
  console.log("📚 SEEDING SHORT STORIES INTO LUMILEX STORY LIBRARY");
  console.log("========================================================\n");

  try {
    // 1. Ensure required columns exist
    await pool.query(`
      ALTER TABLE stories ADD COLUMN IF NOT EXISTS phonics_focus VARCHAR(255);
      ALTER TABLE stories ADD COLUMN IF NOT EXISTS practice_words TEXT[] DEFAULT '{}';
      ALTER TABLE stories ADD COLUMN IF NOT EXISTS word_count INTEGER;
      ALTER TABLE stories ADD COLUMN IF NOT EXISTS learning_objective TEXT;
    `);

    // 2. Update existing 22 library stories
    console.log("🔄 Updating metadata for existing 22 library stories...");
    let updatedCount = 0;
    for (const update of existingLibraryUpdates) {
      const storyRes = await pool.query(
        "SELECT id, content FROM stories WHERE id = $1 AND story_type = 'library'",
        [update.id]
      );
      if (storyRes.rows.length > 0) {
        const words = countWords(storyRes.rows[0].content);
        await pool.query(
          `UPDATE stories
           SET difficulty = $1,
               topic = $2,
               phonics_focus = $3,
               practice_words = $4,
               word_count = $5,
               learning_objective = $6
           WHERE id = $7`,
          [
            update.difficulty,
            update.topic,
            update.phonics_focus,
            update.practice_words,
            words,
            update.learning_objective,
            update.id,
          ]
        );
        updatedCount++;
      }
    }
    console.log(`✅ Updated ${updatedCount} existing library stories.`);

    // 3. Insert or update 54 new library stories
    console.log("\n🌱 Inserting 54 new diverse short library stories...");
    let insertedCount = 0;
    let refreshedCount = 0;

    for (const story of newLibraryStories) {
      const words = countWords(story.content);
      const existing = await pool.query(
        "SELECT id FROM stories WHERE title = $1 AND story_type = 'library'",
        [story.title]
      );

      if (existing.rows.length === 0) {
        await pool.query(
          `INSERT INTO stories (
             title, content, difficulty, topic, story_type,
             character_type, character_name, mood, story_length,
             phonics_focus, practice_words, word_count, learning_objective
           )
           VALUES ($1, $2, $3, $4, 'library', $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            story.title,
            story.content,
            story.difficulty,
            story.topic,
            story.character_type,
            story.character_name,
            story.mood,
            story.story_length,
            story.phonics_focus,
            story.practice_words,
            words,
            story.learning_objective,
          ]
        );
        insertedCount++;
      } else {
        await pool.query(
          `UPDATE stories
           SET content = $1,
               difficulty = $2,
               topic = $3,
               character_type = $4,
               character_name = $5,
               mood = $6,
               story_length = $7,
               phonics_focus = $8,
               practice_words = $9,
               word_count = $10,
               learning_objective = $11
           WHERE id = $12`,
          [
            story.content,
            story.difficulty,
            story.topic,
            story.character_type,
            story.character_name,
            story.mood,
            story.story_length,
            story.phonics_focus,
            story.practice_words,
            words,
            story.learning_objective,
            existing.rows[0].id,
          ]
        );
        refreshedCount++;
      }
    }

    console.log(`✅ Inserted ${insertedCount} new stories (refreshed ${refreshedCount} existing).`);

    // 4. Summarize total library stories & word count distribution
    const summaryRes = await pool.query(`
      SELECT
        COUNT(*) as total_library_stories,
        MIN(word_count) as min_words,
        MAX(word_count) as max_words,
        ROUND(AVG(word_count)) as avg_words
      FROM stories
      WHERE story_type = 'library'
    `);

    const levelRes = await pool.query(`
      SELECT difficulty, COUNT(*) as count
      FROM stories
      WHERE story_type = 'library'
      GROUP BY difficulty
      ORDER BY difficulty ASC
    `);

    const topicRes = await pool.query(`
      SELECT topic, COUNT(*) as count
      FROM stories
      WHERE story_type = 'library'
      GROUP BY topic
      ORDER BY topic ASC
    `);

    console.log("\n========================================================");
    console.log("📊 LIBRARY STORIES INVENTORY SUMMARY:");
    console.log("========================================================");
    console.log(`Total Library Stories: ${summaryRes.rows[0].total_library_stories}`);
    console.log(`Word Count Range:      ${summaryRes.rows[0].min_words} to ${summaryRes.rows[0].max_words} words (Average: ${summaryRes.rows[0].avg_words} words)`);
    console.log("\nReading Level Breakdown:");
    levelRes.rows.forEach((r) => console.log(`  • ${r.difficulty}: ${r.count} stories`));
    console.log("\nTheme / Topic Breakdown:");
    topicRes.rows.forEach((r) => console.log(`  • ${r.topic}: ${r.count} stories`));
    console.log("========================================================\n");

  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  seedLibraryStories();
}

module.exports = { seedLibraryStories, newLibraryStories, existingLibraryUpdates };
