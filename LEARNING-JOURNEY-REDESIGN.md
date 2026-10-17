# LumiLex Learning Journey redesign

## What changed
- Reworked the learning path into six progressive levels: Alphabet Garden, Sound Safari, Little Word Builders, Sentence Builders, Tiny Story Readers, and Story Adventurers.
- Level 1 now introduces letters through familiar picture prompts (apple, ball, cat, dog, fish). Children can tap the picture, question words, sound examples, and answers to hear them spoken aloud.
- Level 2 focuses on listening for and identifying letter sounds. Level 3 practises blending sounds into short words with picture clues.
- Kept the existing reward system: stars, badges, garden growth, and level unlocks after two sessions at 80% accuracy or above.
- Removed floating animations, transform-on-hover movement, and card transitions from the Learning Journey to reduce visual distraction and layout flinching.
- Kept the existing sage-green brand palette and added warm, friendly picture panels.

## Run it
1. Extract the ZIP.
2. Open `LUMILEX/frontend` in VS Code.
3. Run `npm install` if dependencies are not installed.
4. Run `npm run dev`.
5. Keep the backend running separately as usual.

The browser's built-in speech synthesis reads tapped words and picture labels. No paid OpenAI API is required for these click-to-hear controls.
