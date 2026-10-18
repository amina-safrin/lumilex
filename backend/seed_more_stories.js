const pool = require("./db");

const storiesToAdd = [
  {
    title: "Oliver the Owl Who Loved Books",
    content: `Oliver is a fluffy brown barn owl.

While other owls sleep all morning, Oliver sits on a mossy branch and reads tiny picture books.

"Twit, twoo!" says Mama Owl. "What is your favorite story today?"

Oliver wiggles his feather ears and points to a page with shining stars.

"Reading takes me on adventures all around the wide world," hooted Oliver with a proud owl smile.`,
    difficulty: "Beginner",
    topic: "Animals",
    character_type: "Owl",
    character_name: "Oliver",
    mood: "Cozy & Gentle",
    story_length: "Short"
  },
  {
    title: "The Friendly Cloud That Rained Lemonade",
    content: `High above the green rolling hills floated Puff, a cheerful round cloud.

One warm summer afternoon, the woodland animals were feeling thirsty.

Puff decided to do something magical. He spun around three times and tickled the sunshine.

Instead of plain rain, Puff sprinkled sweet, cool lemonade drops on the meadow!

The bunny, the hedgehog, and the squirrel cheered and caught the yummy drops on their tongues.`,
    difficulty: "Beginner",
    topic: "Fantasy",
    character_type: "Cloud",
    character_name: "Puff",
    mood: "Cheerful & Silly",
    story_length: "Short"
  },
  {
    title: "Barnaby Bear Bakes a Honey Pie",
    content: `Barnaby Bear woke up with a very rumbly tummy.

"Today is the great Honey Pie day!" said Barnaby in a cheerful booming voice.

He rolled sweet flour dough on his wooden kitchen table.

Next, his little friend Buzzy the Bee brought a pot of golden blossom honey.

Together they stirred, baked, and shared a warm, delicious slice under the shady oak tree.`,
    difficulty: "Beginner",
    topic: "Friendship",
    character_type: "Bear",
    character_name: "Barnaby",
    mood: "Warm & Sweet",
    story_length: "Short"
  },
  {
    title: "The Little Moon Rocket and the Star Fairies",
    content: `Nova was a friendly silver spaceship with shiny red tail fins.

Nova loved flying through the dark purple galaxy to visit her friends, the twinkling star fairies.

"Hold on tight!" cheered Nova as she zoomed past a friendly ring of blue ice pebbles.

The star fairies danced in the cosmic breeze and dusted Nova's windows with sparkling glitter.

Nova smiled her brightest headlight beam and said, "Space is full of magic when we explore together!"`,
    difficulty: "Beginner",
    topic: "Space",
    character_type: "Rocket",
    character_name: "Nova",
    mood: "Adventurous & Wondrous",
    story_length: "Short"
  },
  {
    title: "Coral the Seahorse Finds a Hidden Pearl",
    content: `Down in the calm turquoise ocean lived Coral, a tiny orange seahorse.

Coral curled her tail gently around a wavy green sea-grass ribbon.

Suddenly, she spotted a soft pink shell resting on the white sand.

The shell opened slowly, revealing a glowing pearl that hummed a peaceful ocean melody.

Coral invited all the baby fish to swim around the pearl and listen to the song of the deep sea.`,
    difficulty: "Beginner",
    topic: "Animals",
    character_type: "Seahorse",
    character_name: "Coral",
    mood: "Calming & Peaceful",
    story_length: "Short"
  },
  {
    title: "The Magic Forest Picnic",
    content: `Penny the hedgehog and Pip the squirrel packed a basket full of crunchy red apples and walnut treats.

They walked along the winding trail lined with soft fern fronds and bluebell flowers.

They spread a checkered cloth under the gentle shade of the giant weeping willow.

A family of friendly ladybugs joined in to share tiny berry crumbs.

"A picnic with friends makes every sunny afternoon the happiest day," chirped Pip with a happy twitch of his tail.`,
    difficulty: "Beginner",
    topic: "Nature",
    character_type: "Hedgehog",
    character_name: "Penny",
    mood: "Wholesome & Joyful",
    story_length: "Short"
  },
  {
    title: "Kip the Kangaroo's Great Big Hop",
    content: `Kip was a spunky little kangaroo with extra springy brown feet.

Every morning, Kip hopped over blooming wildflowers and babbling crystal brooks.

"Boing, boing, boing!" went Kip's bouncy paws across the sandy red path.

He hopped so high he gave a gentle high-five to a passing green parrot in the eucalyptus tree!

"Practice makes my legs strong and my heart happy," giggled Kip as he took another giant joyful leap.`,
    difficulty: "Beginner",
    topic: "Animals",
    character_type: "Kangaroo",
    character_name: "Kip",
    mood: "Energetic & Fun",
    story_length: "Short"
  },
  {
    title: "The Dancing Rainbow Dragon",
    content: `Deep inside Whisper Valley lived Spark, a kind little dragon with rainbow-colored scales.

Spark did not blow scary fire. Instead, Spark blew soft bubbles filled with lavender and peppermint scents!

Whenever the meadow bunnies felt sad, Spark danced a gentle waltz and popped fragrant bubbles for them.

The woodland smiled, and colorful sparkles filled the twilight sky.

Everyone agreed that Spark was the gentlest, most magical dragon in all the enchanted kingdoms.`,
    difficulty: "Beginner",
    topic: "Fantasy",
    character_type: "Dragon",
    character_name: "Spark",
    mood: "Heartwarming & Dreamy",
    story_length: "Short"
  },
  {
    title: "The Whispering Brook and the Pebble Boat",
    content: `Lily stood beside the sparkling brook watching clear water dance over smooth stones.

She carefully folded a bright yellow leaf into a tiny woodland boat.

"Sail safely, little boat!" whispered Lily as she placed it on the bubbling water.

The yellow boat glided smoothly past green mossy banks and sleeping water lilies.

A friendly dragonfly guided the boat along its voyage toward the calm, sunny pond.`,
    difficulty: "Beginner",
    topic: "Nature",
    character_type: "Child",
    character_name: "Lily",
    mood: "Peaceful & Imaginative",
    story_length: "Short"
  },
  {
    title: "Captain Finley and the Treasure of Kindness",
    content: `Finley was a brave little otter with a tiny wooden pirate hat.

He sailed his sturdy raft across Mirror Lake searching for ancient pirate treasure.

Under the roots of a giant birch tree, he found an old polished wooden chest.

Inside was not gold or jewels, but notes of kindness written by forest friends long ago!

Finley wrote a new note that said: "A true friend is the greatest treasure of all."`,
    difficulty: "Beginner",
    topic: "Adventure",
    character_type: "Otter",
    character_name: "Finley",
    mood: "Inspirational & Brave",
    story_length: "Short"
  }
];

async function seedMoreStories() {
  try {
    for (const story of storiesToAdd) {
      // Check if story already exists by title
      const existing = await pool.query(
        "SELECT id FROM stories WHERE title = $1 AND story_type = 'library'",
        [story.title]
      );

      if (existing.rows.length === 0) {
        await pool.query(
          `INSERT INTO stories 
           (title, content, difficulty, topic, story_type, character_type, character_name, mood, story_length)
           VALUES ($1, $2, $3, $4, 'library', $5, $6, $7, $8)`,
          [
            story.title,
            story.content,
            story.difficulty,
            story.topic,
            story.character_type,
            story.character_name,
            story.mood,
            story.story_length,
          ]
        );
        console.log(`+ Added: "${story.title}" (${story.topic})`);
      } else {
        console.log(`= Already exists: "${story.title}"`);
      }
    }

    const totalRes = await pool.query("SELECT COUNT(*) FROM stories WHERE story_type = 'library'");
    console.log(`\nSUCCESS: Total library stories in database: ${totalRes.rows[0].count}`);
    process.exit(0);
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
}

seedMoreStories();
