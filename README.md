# LumiLex AI — Adaptive Dyslexia Literacy & Reading Quest 🦉✨

**LumiLex** is an adaptive, game-based literacy and reading quest platform engineered specifically for **children with dyslexia and young emerging readers**. Modeled after Duolingo's world-class gamification mechanics and grounded in the **Science of Reading (Orton-Gillingham approach)**, LumiLex transforms phonics, syllable blending, and story reading into an accessible, high-engagement adventure.

Featuring a serpentine stepping-stone path, continuous microphone speech evaluation powered by **OpenAI Whisper AI**, real-time dyslexia-tolerant phoneme matching, AI story generation with **Google Gemini**, and a non-punitive multi-sensory reward system, LumiLex ensures every child builds confident reading skills at their own pace.

---

## 🌟 Key Innovations & Design Philosophy

1. **Orton-Gillingham & Dyslexia-First Design:**
   - **OpenDyslexic Typography:** Bottom-weighted lettering prevents perceptual letter flipping, rotations, and transpositions.
   - **Color-Coded Phonics & High Contrast:** Specially calibrated themes (Sage Green, Sky Blue, Warm Cream, Soft Lavender) reduce visual stress and Scotopic sensitivity.
   - **Multi-Sensory Reinforcement:** Every visual element is paired with synthesized child-pitched auditory feedback, letter-sound blending buttons, and physical 3D bounce physics.

2. **Duolingo-Style Birdbrain Engine:**
   - Level-by-level structured curriculum starting from fundamental alphabet phonemes and progressing through CVC blending, digraphs, high-frequency sight words, and decodable sentences.
   - **Quiet Adaptive Spacing:** Tracks child mistakes without anxiety-inducing error alerts. Difficult words and sounds are automatically flagged as "Tricky Friends" and woven into upcoming lessons until mastered.

3. **Hybrid Continuous Voice Evaluation:**
   - Combines low-latency **Web Speech API** streaming with a local **Faster-Whisper AI** microservice running on rolling 3.5-second audio chunks.
   - **Dyslexia-Tolerant Matching:** Tolerates common letter inversions ($b \leftrightarrow d$, $p \leftrightarrow q$, $m \leftrightarrow w$), child accent variations, and phoneme approximations (e.g., recognizing *"bee"*, *"buh"*, or *"ball"* for letter **B**).
   - **Continuous Sound-Out Support:** Allows children to pause and sound out words over 15+ seconds without prematurely timing out.
   - **Quiet 3-Attempt Orange Card Flow:** Internal tracking without pressure or countdown badges. If an attempt is tricky after 3 tries, the card warmly highlights in orange and reveals a cheerful **CONTINUE** button to keep momentum positive.

4. **Multi-Sensory Tactile Audio:**
   - Built-in Web Audio API synthesizer generates organic bubble pop sounds on every interaction, ascending pentatonic bell chimes on success, and gentle harmonic wobbles on mistakes (no jarring buzzers or negative feedback).

---

## 🏗️ System Architecture

```mermaid
graph TD
    subgraph Client ["Frontend (React 19 + Vite 8)"]
        UI["Duolingo Stepping-Stones UI<br/>(LearningJourney.jsx / Lessons.jsx)"]
        Modal["Lesson Player & Speech Card<br/>(LessonPlayerModal.jsx)"]
        AudioSynth["Web Audio Synthesizer<br/>(childAudio.js)"]
        WebSpeech["Web Speech Streaming Preview"]
    end

    subgraph BackendApp ["Backend API (Node.js + Express 5 - Port 5000)"]
        Auth["JWT & Cookie Auth<br/>(authRoutes.js)"]
        StoriesAPI["Story & Gemini Pipeline<br/>(stories.js)"]
        SpeechProxy["Speech Transcribe Proxy<br/>(speech.js)"]
        LearningAPI["Progress & Mastery Routes<br/>(learningRoutes.js)"]
    end

    subgraph AI ["AI Services & Database"]
        PG[("PostgreSQL Database<br/>Users, Progress, Rewards")]
        Gemini["Google Gemini 3.8 Flash<br/>Decodable Stories Engine"]
        Whisper["Python Faster-Whisper Server<br/>(Port 8000 / Whisper base.en)"]
    end

    UI -->|"HTTP API / Credentials"| BackendApp
    Modal -->|"Rolling WebM Audio Chunks"| SpeechProxy
    Modal -->|"Interim Zero-Latency Speech"| WebSpeech
    UI -->|"Interactive Sounds & Pop Audio"| AudioSynth
    SpeechProxy -->|"Multipart Audio + Prompt"| Whisper
    Whisper -->|"Transcribed Text Result"| SpeechProxy
    StoriesAPI -->|"AI Prompt + Decodable Context"| Gemini
    Auth -->|"Sessions & Queries"| PG
    LearningAPI -->|"Mastery & Mistake Logs"| PG
```

---

## 📁 Repository Structure & Directory Map

```
LUMILEXXX/
├── backend/                              # Express.js REST API & Database
│   ├── middleware/
│   │   └── authMiddleware.js             # JWT verification and user session attach
│   ├── routes/
│   │   ├── authRoutes.js                 # Signup, login, logout, profile
│   │   ├── learningRoutes.js             # Level unlocks, lesson completion, XP
│   │   ├── profileRoutes.js              # Child avatar and settings
│   │   ├── speech.js                     # Whisper AI proxy endpoint (/api/speech/transcribe)
│   │   └── stories.js                    # Gemini story generation & story library
│   ├── db.js                             # PostgreSQL client connection pool
│   ├── migrate_progress.js               # Progress schema migrations
│   ├── migrate_rewards.js                # Star and gem schema migrations
│   ├── schema.sql                        # Core PostgreSQL database tables
│   ├── seed_more_stories.js              # Initial library decodable story seeders
│   └── server.js                         # Main Express application entrypoint (Port 5000)
│
├── frontend/                             # React 19 Single Page Application
│   ├── public/                           # Static public assets
│   ├── src/
│   │   ├── assets/
│   │   │   └── fonts/                    # OpenDyslexic font files (.woff)
│   │   ├── components/
│   │   │   ├── DuolingoPath.jsx          # Winding 3D stepping-stones roadmap component
│   │   │   ├── DuolingoPath.css          # Roadmap styles, crown badges, and animations
│   │   │   ├── LessonPlayerModal.jsx     # Bite-sized interactive lesson player modal
│   │   │   ├── LessonPlayerModal.css     # Lesson cards, mic pulse, and orange state styles
│   │   │   ├── ProtectedRoute.jsx        # Route guard for authenticated child sessions
│   │   │   ├── ThemePicker.jsx           # Dyslexia color theme switcher
│   │   │   ├── VirtualTree.jsx           # Animated garden progress tree
│   │   │   └── VirtualTree.css           # Garden and tree styles
│   │   ├── context/
│   │   │   └── ChildContext.jsx          # Active child profile, gems, stars, streak state
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx             # Main dashboard with progress stats & quick start
│   │   │   ├── Dashboard.css             # Dashboard styling
│   │   │   ├── Lessons.jsx               # Dedicated level-by-level unit roadmap page
│   │   │   ├── Lessons.css               # Lessons page styling
│   │   │   ├── LearningJourney.jsx       # Stepping-stones quest path
│   │   │   ├── LearningJourney.css       # Quest path styling
│   │   │   ├── StoryReader.jsx           # Interactive decodable story reader with Whisper
│   │   │   ├── StoryReader.css           # Word-highlighting reader styles
│   │   │   ├── StoryLibrary.jsx          # Browse curated decodable storybooks
│   │   │   ├── CreateStory.jsx           # AI-powered decodable story creator
│   │   │   ├── Practice.jsx              # Tricky Friends error review arena
│   │   │   ├── ChildProfile.jsx          # Child avatar & progress dashboard
│   │   │   ├── Login.jsx                 # Student & parent sign-in
│   │   │   └── Signup.jsx                # New reader registration
│   │   ├── utils/
│   │   │   ├── birdbrainEngine.js        # Duolingo-style adaptive curriculum & mistake tracker
│   │   │   ├── childAudio.js             # Web Audio API sound generator (pop, fanfare, chimes)
│   │   │   ├── errorTracker.js           # Dyslexia error pattern detection (b/d transpositions)
│   │   │   ├── learningRewards.js        # Star crystals, gems, and garden points storage
│   │   │   └── energy.js                 # Game energy utility (never blocks core reading)
│   │   ├── App.jsx                       # Master client routes and layout shell
│   │   ├── index.css                     # Global styles, button physics, pop animations
│   │   └── themes.css                    # Dyslexia accessibility themes
│   ├── package.json                      # Frontend dependencies & scripts
│   └── vite.config.js                    # Vite bundler configuration
│
└── whisper/                              # Python Speech Microservice
    ├── requirements.txt                  # Python dependencies (faster-whisper, flask)
    ├── test_whisper.py                   # Self-test script for Whisper model loading
    └── whisper_server.py                 # Flask server running Faster-Whisper base.en (Port 8000)
```

---

## 🎮 Core Features & User Experiences

### 1. Duolingo-Style Lesson Player (`LessonPlayerModal.jsx`)
- **Unit & Level Roadmap:** Starting from Unit 1: *Alphabet Wonders* (Letter Sounds, A-B-C, D-E-F) to CVC words, sight words, and short sentences.
- **Five Interactive Question Types:**
  1. **Read Out Loud (`speak_loud`):** Children view a letter or word with picture mnemonic, phonetics, and syllable blending chips. Tapping the microphone listens via Whisper and marks correct instantly when spoken.
  2. **Image Selection (`image_select`):** 3-card visual grid with individual speaker buttons to hear words in a friendly child's voice.
  3. **Letter Builder (`letter_build`):** Interactive spelling tiles that can be tapped to assemble target words in order.
  4. **Word Identification (`word_select`):** Clean choice cards for word-sound discrimination.
  5. **Sentence Reading (`sentence_read`):** Displays sentences broken into clickable syllable tokens with continuous speech recognition.
- **Supportive 3-Attempt Orange Fallback:**
  - Children have ample time (16 seconds per sentence) to read aloud.
  - No stressful "chances left" or countdown warnings are ever displayed to the child.
  - If a child attempts 3 times without a match, the card gently transitions to warm orange text with a supportive note (*"Good effort! Practice makes progress 🧡"*), revealing an orange **CONTINUE** button to advance happily without frustration.
- **Birdbrain AI Adaptive System:**
  - Quietly records mistake categories (reversals, omissions, vowel substitutions).
  - Dynamically injects missed concepts into future stepping-stone lessons for reinforcement.

### 2. Interactive Story Reader with Synchronized Whisper Tracking (`StoryReader.jsx`)
- Reads decodable books sentence-by-sentence.
- As the child speaks into the microphone, Whisper matches read words in real time with a 6-word lookahead buffer, highlighting each word in bright green as it is pronounced.
- If a child pauses, a friendly message appears: *"Take your time! No worries — continue reading whenever you are ready. 💚"*
- Click-to-hear word pronunciation and full sentence reading in child voice pitch ($1.38\times$) and gentle rate ($0.88\times$).

### 3. AI Decodable Story Generation (`CreateStory.jsx`)
- Integrated with **Google Gemini 3.8 Flash**.
- Generates custom, phonetically controlled decodable storybooks based on the child's grade level, target phonics sounds, and personal interests (e.g., dragons, space, animals).
- Outputs sentence-tokenized stories with comprehension checks and vocabulary builders.

### 4. Reward & Motivation Ecosystem
- **Daily Reading Streak (🔥):** Celebrates daily practice consistency.
- **Star Crystals (⭐) & Challenger Gems (💎):** Earned through effort, reading aloud, and lesson completion.
- **Virtual Garden & Growing Tree:** Every lesson and story read contributes growth points, evolving a sprout into a flourishing garden.
- **Golden Crowns (👑):** Awarded for mastering level milestones on the roadmap.
- **No-Penalty Philosophy:** Stars and gems are never deducted for errors or retries.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | **React 19**, **Vite 8**, **React Router DOM v7** |
| **Icons & Typography** | **Lucide React**, **OpenDyslexic Font** |
| **Styling & Physics** | Native CSS3 with 3D tactile push physics, custom themes, hardware-accelerated transforms |
| **Client Audio** | **Web Audio API** (polyphonic pop sounds, success chimes, celebration fanfare) + **SpeechSynthesis** (child voice tuned) |
| **Backend Runtime** | **Node.js 20+**, **Express.js 5** |
| **Database** | **PostgreSQL** with connection pooling via `pg` |
| **Authentication** | Secure HTTP-only cookies, **JSON Web Tokens (JWT)**, **bcryptjs** password hashing, **Passport.js** Google OAuth 2.0 |
| **AI Text Engine** | **Google Gemini 3.8 Flash** via `@google/genai` SDK |
| **Speech-to-Text Engine** | **Faster-Whisper (`base.en` model)** on local Python Flask microservice (Port 8000) |
| **Audio Processing** | **MediaRecorder API** (WebM Opus 16kHz) + Multer memory storage stream |

---

## 🚀 Getting Started & Local Development

### Prerequisites
- **Node.js** (v18.0.0 or higher recommended)
- **PostgreSQL** (running locally on port 5432)
- **Python** (v3.10 or higher for the Whisper service)
- **ffmpeg** installed on system PATH (required by Whisper for audio decoding)

---

### Step 1: Database Setup

1. Start your local PostgreSQL service.
2. Create a database named `lumilex`:
   ```sql
   CREATE DATABASE lumilex;
   ```
3. Run the schema script located in `backend/schema.sql` to initialize tables:
   ```bash
   psql -U postgres -d lumilex -f backend/schema.sql
   ```
4. Run schema migration scripts to ensure all rewards and progress tables are up to date:
   ```bash
   node backend/migrate_progress.js
   node backend/migrate_rewards.js
   node backend/migrate_welcome_gems.js
   ```

---

### Step 2: Set Up Python Whisper AI Server

The Whisper microservice runs locally and transcribes child voice recordings with zero third-party latency.

```bash
cd whisper

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# macOS/Linux:
# source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start Whisper server (Listens on port 8000)
python whisper_server.py
```
> The Whisper service will automatically download the lightweight `base.en` model on first launch and print:
> `Whisper server running on http://127.0.0.1:8000`

---

### Step 3: Set Up & Start Backend Server

1. Open a new terminal and navigate to `backend/`:
   ```bash
   cd backend
   npm install
   ```

2. Create or verify `backend/.env` with your local credentials:
   ```env
   PORT=5000
   DATABASE_URL=postgres://postgres:your_password@localhost:5432/lumilex
   JWT_SECRET=lumilex_super_secret_jwt_key_2026
   WHISPER_URL=http://127.0.0.1:8000/transcribe
   GEMINI_API_KEY=your_google_gemini_api_key_here
   ```

3. Start the backend:
   ```bash
   npm run dev
   # or
   node server.js
   ```
   > Backend will start on `http://localhost:5000`.

---

### Step 4: Set Up & Start Frontend

1. Open another terminal and navigate to `frontend/`:
   ```bash
   cd frontend
   npm install
   ```

2. Start the Vite development server:
   ```bash
   npm run dev
   ```

3. Open your browser and visit:
   ```
   http://localhost:5173
   ```

---

## 📡 API Reference Overview

### 1. Authentication (`/api/auth`)
- `POST /api/auth/signup` — Registers a parent/child account.
- `POST /api/auth/login` — Authenticates credentials and sets HTTP-only JWT cookie.
- `GET /api/auth/me` — Fetches current authenticated session and child profile.
- `POST /api/auth/logout` — Clears authentication cookie.

### 2. Speech Transcription (`/api/speech`)
- `POST /api/speech/transcribe` — Accepts multipart form audio (`.webm`) with optional prompt context; forwards to local Faster-Whisper server; returns `{ text: "apple", duration: 1.2 }`.

### 3. Decodable Stories (`/api/stories`)
- `GET /api/stories` — Fetches all library stories with difficulty ratings and word counts.
- `GET /api/stories/:id` — Fetches complete story text, tokenized sentences, and questions.
- `POST /api/stories/generate` — Invokes Google Gemini to create custom decodable stories on demand.
- `POST /api/stories/:id/complete` — Records story completion, awards stars, and grows garden.

### 4. Learning & Lessons (`/api/learning`)
- `GET /api/learning/progress` — Retrieves unlocked units, lesson milestones, and crowns.
- `POST /api/learning/complete-lesson` — Records accuracy, XP, stars, and updates streak.
- `POST /api/learning/record-mistake` — Logs error patterns for Birdbrain spaced review.

---

## 🧪 Testing & Verification

- **Frontend Production Build:**
  ```bash
  cd frontend
  npm run build
  ```
  *Built cleanly in < 1 second with full chunk minification and asset compression.*

- **Whisper Service Verification:**
  ```bash
  curl.exe -X POST http://127.0.0.1:8000/transcribe
  # Returns: {"error":"No audio file received"}
  ```

- **Backend Health & Route Verification:**
  ```bash
  curl.exe -X POST http://localhost:5000/api/speech/transcribe
  # Returns: {"error":"No audio file received"}
  ```

---

## 🎨 Design System & Accessibility Specs

- **Primary Dyslexia Typography:** `OpenDyslexic`, `Nunito`, sans-serif.
- **Button Physics:** `box-shadow: 0 4px 0 [darker-shade]` with active `:active { transform: translateY(2px); box-shadow: 0 2px 0 ... }`.
- **Pop Sound Design:** Real-time dual-oscillator FM synthesis at 540Hz $\to$ 980Hz frequency sweep over 45ms for a tactile, playful click on every button press.
- **Child Voice Tuning:** Browser SpeechSynthesis automatically adjusted to `pitch: 1.38` and `rate: 0.88` with prioritized young, female/child-friendly voices for soothing question reads.

---

## 📜 License & Credits

Built with ❤️ for young readers and children with dyslexia everywhere.
Developed by the LumiLex AI Team.
Licensed under the [MIT License](LICENSE).
