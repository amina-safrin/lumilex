# LumiLex AI — Learning Levels and Rewards Update

This project update adds a level-based reading practice journey and a combined rewards system while keeping the existing sage-green design.

## What's included

- **Learning Journey page** at `/learning-journey`, with five reading levels:
  1. Sound Explorers — letter sounds
  2. Little Word Builders — blending and short words
  3. Sentence Builders — sentence reading
  4. Tiny Story Readers — story understanding
  5. Story Adventurers — vocabulary and comprehension
- **Adaptive unlocking:** a child needs two practice sessions at 80% accuracy or higher on a level to master it and unlock the next level. A child can repeat any unlocked level.
- **Stars:** each completed practice session awards two effort stars plus one star per correct answer. First-time mastery of any level awards five bonus stars. Completing a story awards three stars. Stars are never taken away for mistakes.
- **Badges:** practice, story milestones, star milestones, garden growth, and level mastery can earn badges.
- **Learning garden:** completed story/practice activities add garden growth points, moving the garden from a sprout to a flowering garden.
- **Level-up celebrations** when a new level unlocks.
- **No penalties:** wrong answers do not subtract stars. Children can ask for hints and retry.
- **Reading is always free:** starting or completing a story and using essential learning practice never consumes energy or shows an energy-block screen. The existing `utils/energy.js` helper is reserved for optional games if those are added later; do not call it from reading or core practice flows.
- Dashboard reward snapshot and a Learning Journey navigation link.
- **Click-to-hear phonics:** tapping an answer word reads it aloud; early phonics questions also show sound-example buttons (for example, /s/ with “sun”) so children can hear the sound in a spoken word.

## Run it in VS Code

> The zip intentionally excludes `node_modules` and `.env`. This keeps the project smaller and avoids sharing secret API keys. Keep your own existing `.env` file private.

### 1. Extract the project

Extract the ZIP. Open the extracted `lum` folder in VS Code. It contains `frontend` and `backend` folders.

### 2. Install frontend packages

Open a terminal in VS Code and run:

```bash
cd frontend
npm install
npm run dev
```

Vite will print a local address, usually `http://localhost:5173`. Open that address in your browser.

### 3. Start the backend in a second terminal

Open a second terminal, then run:

```bash
cd backend
npm install
npm run dev
```

If the backend package does not have a `dev` script, use:

```bash
node server.js
```

The backend expects its existing PostgreSQL database and environment variables. Restore your own backend `.env` locally; do not share it publicly. The frontend currently calls `http://localhost:5000`.

### 4. Try the new learning system

1. Sign in to LumiLex.
2. Open **Learning Journey** from the dashboard.
3. Start **Sound Explorers**.
4. Answer the five questions. Use **Need a hint?** if you want help.
5. A completed session awards stars, grows the garden, and may award badges.
6. Earn at least 80% in two sessions at the same level to unlock the next level.
7. Finish a story to earn three story stars and your Story Starter badge.

## Where the main changes are

- `frontend/src/pages/LearningJourney.jsx` — learning levels, quiz flow, badges, garden, and level-up screens.
- `frontend/src/pages/LearningJourney.css` — sage-green learning journey styles and click-to-hear controls.
- `frontend/src/utils/learningRewards.js` — local browser persistence, stars, badges, garden progress, and mastery rules.
- `frontend/src/pages/StoryReader.jsx` — reading no longer consumes energy; story completion adds rewards.
- `frontend/src/pages/Dashboard.jsx` and `frontend/src/index.css` — reward snapshot and navigation.
- `frontend/src/App.jsx` — new `/learning-journey` route.

## Important implementation note

At this stage, rewards and learning progress are stored in the browser's `localStorage` on the device being used. This makes the prototype work without a database migration, but the data is not yet synced across devices or isolated by child account in the backend. For a production/academic final version, the next improvement would be saving child-specific reward and mastery records in PostgreSQL behind the authenticated API.


## Click-to-hear word sounds

In Learning Journey, children can tap any answer word to hear it spoken and see a speaker icon. Early phonics questions include sound-example chips such as `/s/` with `sun`; tapping a chip speaks the example word so the child can listen to the target sound in context. Playback uses the browser's built-in Speech Synthesis voices, so the voice can vary by device/browser. These are spoken word examples rather than studio-recorded isolated phonemes; for the most accurate phoneme teaching, the next step would be to add recorded phoneme audio clips.
