# LumiLex AI — Learning Rewards and Child-Friendly Colours

This update is merged into the supplied LUMILEX project. Existing pages and backend source were preserved. Installed `node_modules`, build output, `.git`, and the private `.env` file were excluded from this share.

## What's added
- Five progressive Reading Journey levels: sounds, blending, sentences, tiny stories, and story adventures.
- Practice hints and retries without penalties for mistakes.
- Stars, badges, garden growth, and mastery-based level unlocks.
- Child-friendly sage, sunshine, sky-blue, coral, and lilac accents.
- Story completion feeds into the shared learning rewards store.
- Essential story reading no longer consumes energy. Energy utility remains available for optional game mechanics.

## Setup
1. Extract this ZIP.
2. Copy `backend/.env.example` to `backend/.env` and fill in your own PostgreSQL and API credentials. Do not share `.env`.
3. Start PostgreSQL.
4. Terminal 1: `cd LUMILEX/frontend`, then `npm install`, then `npm run dev`.
5. Terminal 2: `cd LUMILEX/backend`, then `npm install`, then `node server.js` (or use the start command in backend/package.json if present).
6. Open the local Vite URL shown in Terminal 1.

## Learning progression
A level unlocks after two practice sessions at 80% accuracy or better. Children can repeat activities freely. This is an initial configurable rule, not a diagnostic assessment.

## Notes
Learning rewards currently persist in this browser's `localStorage`; they are not yet synced to PostgreSQL or across devices.
