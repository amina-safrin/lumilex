import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Sparkles,
  BookOpen,
  UserRound,
  ChevronRight,
  Check,
  WandSparkles,
  Volume2,
  VolumeX,
  Shuffle,
  PartyPopper,
  Play,
  RotateCcw,
} from "lucide-react";
import { useChild } from "../context/ChildContext";
import {
  playTapSound,
  playWhooshSound,
  playMagicSpellSound,
  playCelebrationFanfare,
  playSuccessChime,
  playHintSound,
  speakText,
  isSoundsMuted,
  toggleMuteSounds,
} from "../utils/childAudio";
import "./CreateStory.css";

function CreateStory() {
  const navigate = useNavigate();
  const { childName } = useChild();

  // ============================================
  // AUDIO & SOUND STATE
  // ============================================
  const [muted, setMuted] = useState(isSoundsMuted());
  const [speakingCard, setSpeakingCard] = useState(null);

  const handleToggleMute = () => {
    const next = toggleMuteSounds();
    setMuted(next);
    if (!next) {
      playTapSound();
    }
  };

  const handleSpeak = (text, cardKey = null, e = null) => {
    if (e) e.stopPropagation();
    setSpeakingCard(cardKey);
    speakText(text, {
      rate: 0.76,
      pitch: 1.1,
      onEnd: () => setSpeakingCard(null),
      onError: () => setSpeakingCard(null),
    });
  };

  // ============================================
  // STORY SELECTIONS
  // ============================================
  const [selectedInterests, setSelectedInterests] = useState(["Animals"]);
  const [selectedCharacter, setSelectedCharacter] = useState("Me");
  const [characterName, setCharacterName] = useState("");
  const [selectedMood, setSelectedMood] = useState("Happy");
  const [selectedLevel, setSelectedLevel] = useState("Beginner");
  const [selectedLength, setSelectedLength] = useState("Short");

  // ============================================
  // GENERATION STATE
  // ============================================
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [generationMessage, setGenerationMessage] = useState(
    "Mixing your magical ingredients..."
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [generatedStory, setGeneratedStory] = useState(null);

  // ============================================
  // RICH CHILD-FRIENDLY TOPICS
  // ============================================
  const interests = [
    {
      name: "Animals",
      icon: "🐶",
      color: "#f59e0b",
      description: "Playful puppies, kittens & forest friends",
    },
    {
      name: "Space",
      icon: "🚀",
      color: "#8b5cf6",
      description: "Fly past stars, moons & friendly alien planets",
    },
    {
      name: "Ocean",
      icon: "🐬",
      color: "#0284c7",
      description: "Swim with dolphins, colorful fish & sunken treasures",
    },
    {
      name: "Dinosaurs",
      icon: "🦖",
      color: "#10b981",
      description: "Friendly baby dinos on gentle prehistoric adventures",
    },
    {
      name: "Superheroes",
      icon: "🦸",
      color: "#ef4444",
      description: "Kind hero missions helping friends and saving the day",
    },
    {
      name: "Fairy Magic",
      icon: "🧚",
      color: "#ec4899",
      description: "Sparkly enchanted castles, glowing wands & gentle fairies",
    },
    {
      name: "Nature & Forest",
      icon: "🌳",
      color: "#15803d",
      description: "Secret treehouses, blooming flowers & singing birds",
    },
    {
      name: "Bedtime Dreams",
      icon: "🌙",
      color: "#6366f1",
      description: "Cozy lullabies, sleepy clouds & peaceful starry nights",
    },
  ];

  // ============================================
  // CHARACTERS
  // ============================================
  const characters = [
    {
      name: "Me",
      icon: "🌟",
      title: childName ? `${childName} (Me!)` : "Me!",
      description: "Star in the story yourself",
    },
    {
      name: "Animal Friend",
      icon: "🐾",
      title: "Animal Hero",
      description: "A brave, fuzzy puppy, bunny, or cub",
    },
    {
      name: "Magical Character",
      icon: "🧚",
      title: "Magic Buddy",
      description: "A kind wizard, pixie, or gentle baby dragon",
    },
    {
      name: "Robot Buddy",
      icon: "🤖",
      title: "Robot Pal",
      description: "A friendly, beep-boop helper robot",
    },
    {
      name: "Custom",
      icon: "✏️",
      title: "My Own Hero",
      description: "Type your very own character's name",
    },
  ];

  // ============================================
  // MOODS
  // ============================================
  const moods = [
    {
      name: "Happy",
      icon: "😊",
      label: "Cheerful & sunny",
    },
    {
      name: "Funny",
      icon: "😂",
      label: "Silly giggles & jokes",
    },
    {
      name: "Adventurous",
      icon: "🗺️",
      label: "Exciting journeys",
    },
    {
      name: "Magical",
      icon: "✨",
      label: "Wonder & sparkles",
    },
    {
      name: "Heartwarming",
      icon: "💖",
      label: "Kind hugs & love",
    },
  ];

  // ============================================
  // LEVELS
  // ============================================
  const levels = [
    {
      name: "Beginner",
      icon: "🌱",
      badge: "Easy Words",
      description: "Short, simple sentences with gentle phonics",
    },
    {
      name: "Intermediate",
      icon: "🌿",
      badge: "Growing Reader",
      description: "A fun story with a few exciting new words",
    },
    {
      name: "Advanced",
      icon: "🌳",
      badge: "Story Master",
      description: "Richer adventure with more story details",
    },
  ];

  // ============================================
  // LENGTHS
  // ============================================
  const lengths = [
    {
      name: "Short",
      time: "3-5 min",
      icon: "⚡",
      badge: "Quick Read",
    },
    {
      name: "Medium",
      time: "6-8 min",
      icon: "📖",
      badge: "Just Right",
    },
    {
      name: "Long",
      time: "10-12 min",
      icon: "📚",
      badge: "Deep Adventure",
    },
  ];

  // ============================================
  // GENERATION MESSAGE & PROGRESS ANIMATION
  // ============================================
  const messages = [
    "✨ Stirring the story cauldron...",
    "🐾 Finding wonderful characters...",
    "🌟 Picking soft, easy-to-read words...",
    "🎨 Painting colorful picture scenes...",
    "🌈 Adding sprinkles of magic...",
    "🎉 Putting on the shiny cover...",
  ];

  useEffect(() => {
    if (!isGenerating) return;

    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % messages.length;
      setGenerationStep(idx);
      setGenerationMessage(messages[idx]);
      playHintSound();
    }, 2400);

    return () => clearInterval(interval);
  }, [isGenerating]);

  // ============================================
  // SELECTION HANDLERS WITH SOUND EFFECTS
  // ============================================
  const toggleInterest = (interestName) => {
    playTapSound();
    setErrorMessage("");

    if (selectedInterests.includes(interestName)) {
      if (selectedInterests.length > 1) {
        setSelectedInterests(selectedInterests.filter((item) => item !== interestName));
      }
    } else {
      setSelectedInterests([...selectedInterests, interestName]);
    }
  };

  const handleCharacterSelect = (charName) => {
    playWhooshSound();
    setSelectedCharacter(charName);
    setErrorMessage("");
    if (charName !== "Custom") {
      setCharacterName("");
    }
  };

  const handleMoodSelect = (moodName) => {
    playTapSound();
    setSelectedMood(moodName);
  };

  const handleLevelSelect = (levelName) => {
    playTapSound();
    setSelectedLevel(levelName);
  };

  const handleLengthSelect = (lengthName) => {
    playTapSound();
    setSelectedLength(lengthName);
  };

  // ============================================
  // SURPRISE ME (MAGIC RANDOMIZER)
  // ============================================
  const handleSurpriseMe = () => {
    playMagicSpellSound();

    // Pick 1 or 2 random topics
    const shuffledTopics = [...interests].sort(() => 0.5 - Math.random());
    const randomTopics = shuffledTopics.slice(0, Math.floor(Math.random() * 2) + 1).map((t) => t.name);

    // Pick random character
    const randomChar = characters[Math.floor(Math.random() * (characters.length - 1))].name;

    // Pick random mood
    const randomMood = moods[Math.floor(Math.random() * moods.length)].name;

    setSelectedInterests(randomTopics);
    setSelectedCharacter(randomChar);
    setSelectedMood(randomMood);

    speakText("Abracadabra! Here is a magical surprise adventure!", { rate: 0.8, pitch: 1.15 });
  };

  // ============================================
  // CREATE STORY (CALL BACKEND)
  // ============================================
  const handleCreateStory = async () => {
    setErrorMessage("");
    setGeneratedStory(null);

    if (selectedInterests.length === 0) {
      setErrorMessage("Pick at least one story idea before creating your adventure! ✨");
      return;
    }

    if (selectedCharacter === "Custom" && !characterName.trim()) {
      setErrorMessage("Give your character a name first! 😊");
      return;
    }

    // Play sparkling magic spell sound!
    playMagicSpellSound();

    try {
      setIsGenerating(true);
      setGenerationStep(0);
      setGenerationMessage(messages[0]);

      const response = await fetch("http://localhost:5000/api/stories/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          interests: selectedInterests,
          level: selectedLevel,
          length: selectedLength,
          characterType: selectedCharacter,
          characterName:
            selectedCharacter === "Custom" ? characterName.trim() : "",
          mood: selectedMood,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || data.error || "Something went wrong while creating your story."
        );
      }

      if (!data.story || !data.story.id) {
        throw new Error("Story was created, but its details could not be loaded.");
      }

      setIsGenerating(false);
      setGeneratedStory(data.story);

      // Play joyful fanfare sound for completing creation!
      playCelebrationFanfare();
      setTimeout(() => {
        playSuccessChime();
        speakText(`Hooray! Your story is ready: ${data.story.title}!`, { rate: 0.82 });
      }, 500);
    } catch (error) {
      console.error("Error creating story:", error);
      setIsGenerating(false);
      setErrorMessage(
        error.message || "Oops! The story spell paused. Let's try once more! 🌟"
      );
    }
  };

  const handleReadGeneratedStory = () => {
    if (!generatedStory?.id) return;
    playSuccessChime();
    navigate(`/story/${generatedStory.id}`);
  };

  const handleCreateAnotherStory = () => {
    playTapSound();
    setGeneratedStory(null);
    setErrorMessage("");
  };

  const getSummaryCharacterName = () => {
    if (selectedCharacter === "Me") {
      return childName || "You";
    }
    if (selectedCharacter === "Custom") {
      return characterName.trim() || "Your custom hero";
    }
    return selectedCharacter;
  };

  return (
    <div className="create-story-page">
      {/* ============================================
          GENERATING OVERLAY (MAGICAL CAULDRON & FLOATING PARTICLES)
      ============================================ */}
      {isGenerating && (
        <div className="story-generating-overlay">
          <div className="story-generating-card">
            <div className="generation-sparkle sparkle-one">✨</div>
            <div className="generation-sparkle sparkle-two">🌟</div>
            <div className="generation-sparkle sparkle-three">🪄</div>
            <div className="generation-sparkle sparkle-four">🚀</div>
            <div className="generation-sparkle sparkle-five">🐾</div>

            <div className="magic-cauldron">
              <div className="cauldron-bubble bubble-1"></div>
              <div className="cauldron-bubble bubble-2"></div>
              <div className="cauldron-bubble bubble-3"></div>
              <div className="cauldron-glow"></div>
              <div className="generation-book">
                <div className="book-page book-left">
                  <BookOpen size={48} />
                </div>
                <div className="book-page book-right">
                  <BookOpen size={48} />
                </div>
              </div>
            </div>

            <span className="generation-tag">
              MAGIC SPELL #{generationStep + 1} OF 6
            </span>

            <h2>{generationMessage}</h2>

            <p>
              LumiLex is weaving a delightful, easy-to-read adventure starring{" "}
              <strong>{getSummaryCharacterName()}</strong>! 💚
            </p>

            <div className="generation-progress-track">
              <div
                className="generation-progress-fill"
                style={{ width: `${((generationStep + 1) / messages.length) * 100}%` }}
              ></div>
            </div>

            <div className="generation-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      )}

      {/* ============================================
          GENERATED STORY SUCCESS MODAL
      ============================================ */}
      {generatedStory && !isGenerating && (
        <div className="generated-story-overlay">
          <div className="generated-story-card">
            <div className="celebration-confetti">
              <span>🎉</span>
              <span>⭐</span>
              <span>✨</span>
              <span>🎈</span>
              <span>🌟</span>
            </div>

            <div className="generated-story-icon">
              <PartyPopper size={38} />
            </div>

            <span className="generated-story-label">
              🌟 YOUR ADVENTURE IS READY! 🌟
            </span>

            <h2>{generatedStory.title}</h2>

            <p className="generated-story-message">
              A brand new story written just for{" "}
              <strong>{childName || "you"}</strong> is ready to explore!
            </p>

            <div className="generated-story-details">
              <span>🌱 Level: {generatedStory.difficulty || selectedLevel}</span>
              <span>📚 Topic: {generatedStory.topic || selectedInterests.join(", ")}</span>
              <span>💕 Mood: {selectedMood}</span>
            </div>

            {/* Audio pronunciation of the title */}
            <button
              className="listen-title-btn"
              onClick={() => handleSpeak(generatedStory.title, "success-title")}
            >
              <Volume2 size={18} />
              Listen to Title Aloud
            </button>

            {/* Read story button */}
            <button
              className="read-generated-story-button"
              onClick={handleReadGeneratedStory}
            >
              <Play size={20} />
              Read My Story Now!
              <ChevronRight size={19} />
            </button>

            {/* Create another */}
            <button
              className="create-another-story-button"
              onClick={handleCreateAnotherStory}
            >
              <Sparkles size={16} /> Create Another Adventure
            </button>
          </div>
        </div>
      )}

      {/* ============================================
          HEADER
      ============================================ */}
      <header className="create-story-header">
        <button
          className="back-button"
          onClick={() => {
            playTapSound();
            navigate("/stories");
          }}
          disabled={isGenerating || generatedStory}
        >
          <ArrowLeft size={18} />
          Back to Stories
        </button>

        <div className="create-story-title">
          <Sparkles size={24} />
          <h1>Create My Story</h1>
        </div>

        {/* Audio Mute / Unmute Toggle */}
        <button
          className={`audio-toggle-btn ${muted ? "is-muted" : ""}`}
          onClick={handleToggleMute}
          title={muted ? "Unmute sound effects" : "Mute sound effects"}
        >
          {muted ? <VolumeX size={19} /> : <Volume2 size={19} />}
          <span>{muted ? "Muted" : "Sounds On"}</span>
        </button>
      </header>

      {/* ============================================
          INTRO BANNER
      ============================================ */}
      <section className="create-story-intro">
        <div className="intro-badge">
          <WandSparkles size={16} />
          <span>Interactive Story Maker</span>
        </div>

        <h2>
          ✨ What shall we create today,{" "}
          <span className="child-name-highlight">{childName || "Friend"}</span>?
        </h2>

        <p>
          Pick your favorite characters, places, and feelings. Tap any card to
          hear it aloud, or hit <strong>Magic Surprise</strong> to let the stars
          choose!
        </p>

        {/* Story Recipe & Surprise Me Bar */}
        <div className="magic-recipe-bar">
          <div className="recipe-items">
            <span className="recipe-pill">
              ⭐ <strong>Hero:</strong> {getSummaryCharacterName()}
            </span>
            <span className="recipe-pill">
              🎨 <strong>Theme:</strong> {selectedInterests.join(" + ")}
            </span>
            <span className="recipe-pill">
              💕 <strong>Mood:</strong> {selectedMood}
            </span>
            <span className="recipe-pill">
              🌱 <strong>Level:</strong> {selectedLevel}
            </span>
          </div>

          <button
            className="surprise-me-btn"
            onClick={handleSurpriseMe}
            title="Randomly mix a magical adventure!"
          >
            <Shuffle size={16} />
            <span>Surprise Me! 🎲</span>
          </button>
        </div>
      </section>

      <main className="create-story-content">
        {/* ============================================
            STEP 1 — WHAT SHOULD YOUR STORY BE ABOUT?
        ============================================ */}
        <section className="story-option-card">
          <div className="option-heading">
            <span className="option-number">1</span>
            <div className="option-text-wrapper">
              <div className="option-title-row">
                <h3>🌈 What should your story be about?</h3>
                <button
                  className="read-heading-btn"
                  onClick={() =>
                    handleSpeak(
                      "Step 1: What should your story be about? Tap one or more things you love!",
                      "heading-1"
                    )
                  }
                  title="Listen to instructions"
                >
                  <Volume2 size={16} />
                </button>
              </div>
              <p>Pick one or more ideas that make you smile!</p>
            </div>
          </div>

          <div className="interest-grid">
            {interests.map((interest) => {
              const isSelected = selectedInterests.includes(interest.name);
              return (
                <button
                  key={interest.name}
                  className={`interest-card ${isSelected ? "selected" : ""}`}
                  onClick={() => toggleInterest(interest.name)}
                  disabled={isGenerating || generatedStory}
                >
                  {isSelected && (
                    <span className="selected-check">
                      <Check size={14} />
                    </span>
                  )}

                  <span className="interest-icon">{interest.icon}</span>

                  <strong className="interest-name">{interest.name}</strong>

                  <small className="interest-desc">{interest.description}</small>

                  <button
                    className="card-audio-speaker"
                    onClick={(e) =>
                      handleSpeak(
                        `${interest.name}! ${interest.description}`,
                        `interest-${interest.name}`,
                        e
                      )
                    }
                    title={`Hear ${interest.name} aloud`}
                  >
                    <Volume2 size={13} />
                  </button>
                </button>
              );
            })}
          </div>
        </section>

        {/* ============================================
            STEP 2 — WHO IS THE HERO?
        ============================================ */}
        <section className="story-option-card">
          <div className="option-heading">
            <span className="option-number">2</span>
            <div className="option-text-wrapper">
              <div className="option-title-row">
                <h3>🧑 Who is the hero of the adventure?</h3>
                <button
                  className="read-heading-btn"
                  onClick={() =>
                    handleSpeak(
                      "Step 2: Who is the hero of the adventure? Every great story needs a fun character!",
                      "heading-2"
                    )
                  }
                  title="Listen to instructions"
                >
                  <Volume2 size={16} />
                </button>
              </div>
              <p>Every adventure needs someone special to lead the way.</p>
            </div>
          </div>

          <div className="character-grid">
            {characters.map((character) => {
              const isSelected = selectedCharacter === character.name;
              return (
                <button
                  key={character.name}
                  className={`character-card ${isSelected ? "selected" : ""}`}
                  onClick={() => handleCharacterSelect(character.name)}
                  disabled={isGenerating || generatedStory}
                >
                  {isSelected && (
                    <span className="selected-check">
                      <Check size={14} />
                    </span>
                  )}

                  <span className="character-icon">{character.icon}</span>

                  <strong className="character-title">{character.title}</strong>

                  <small className="character-desc">{character.description}</small>

                  <button
                    className="card-audio-speaker"
                    onClick={(e) =>
                      handleSpeak(
                        `${character.title}! ${character.description}`,
                        `char-${character.name}`,
                        e
                      )
                    }
                    title={`Hear ${character.title} aloud`}
                  >
                    <Volume2 size={13} />
                  </button>
                </button>
              );
            })}
          </div>

          {selectedCharacter === "Custom" && (
            <div className="custom-character-box">
              <label>
                <UserRound size={17} />
                What is your hero's name?
              </label>

              <input
                type="text"
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                placeholder="e.g. Luna, Leo, Barnaby, Captain Sparkle..."
                maxLength={30}
                disabled={isGenerating || generatedStory}
              />
            </div>
          )}
        </section>

        {/* ============================================
            STEP 3 — HOW SHOULD THE STORY FEEL?
        ============================================ */}
        <section className="story-option-card">
          <div className="option-heading">
            <span className="option-number">3</span>
            <div className="option-text-wrapper">
              <div className="option-title-row">
                <h3>💕 How should the story feel?</h3>
                <button
                  className="read-heading-btn"
                  onClick={() =>
                    handleSpeak(
                      "Step 3: How should the story feel? Choose a cozy or silly mood for your tale.",
                      "heading-3"
                    )
                  }
                  title="Listen to instructions"
                >
                  <Volume2 size={16} />
                </button>
              </div>
              <p>Pick the feeling of your adventure.</p>
            </div>
          </div>

          <div className="mood-grid">
            {moods.map((mood) => {
              const isSelected = selectedMood === mood.name;
              return (
                <button
                  key={mood.name}
                  className={`mood-card ${isSelected ? "selected" : ""}`}
                  onClick={() => handleMoodSelect(mood.name)}
                  disabled={isGenerating || generatedStory}
                >
                  <span className="mood-icon">{mood.icon}</span>
                  <strong className="mood-name">{mood.name}</strong>
                  <small className="mood-sub">{mood.label}</small>
                </button>
              );
            })}
          </div>
        </section>

        {/* ============================================
            STEP 4 — READING LEVEL
        ============================================ */}
        <section className="story-option-card">
          <div className="option-heading">
            <span className="option-number">4</span>
            <div className="option-text-wrapper">
              <div className="option-title-row">
                <h3>🌱 Choose your reading level</h3>
                <button
                  className="read-heading-btn"
                  onClick={() =>
                    handleSpeak(
                      "Step 4: Choose your reading level. We will tailor the words to be just right for you.",
                      "heading-4"
                    )
                  }
                  title="Listen to instructions"
                >
                  <Volume2 size={16} />
                </button>
              </div>
              <p>We'll tune sentence length and vocabulary for comfortable reading.</p>
            </div>
          </div>

          <div className="level-grid">
            {levels.map((level) => {
              const isSelected = selectedLevel === level.name;
              return (
                <button
                  key={level.name}
                  className={`level-card ${isSelected ? "selected" : ""}`}
                  onClick={() => handleLevelSelect(level.name)}
                  disabled={isGenerating || generatedStory}
                >
                  <span className="level-icon">{level.icon}</span>
                  <div className="level-info">
                    <div className="level-header-line">
                      <strong>{level.name}</strong>
                      <span className="level-badge">{level.badge}</span>
                    </div>
                    <small>{level.description}</small>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ============================================
            STEP 5 — STORY LENGTH
        ============================================ */}
        <section className="story-option-card">
          <div className="option-heading">
            <span className="option-number">5</span>
            <div className="option-text-wrapper">
              <div className="option-title-row">
                <h3>⏰ How long should your adventure be?</h3>
                <button
                  className="read-heading-btn"
                  onClick={() =>
                    handleSpeak(
                      "Step 5: How long should your adventure be? Pick a quick read or a longer journey.",
                      "heading-5"
                    )
                  }
                  title="Listen to instructions"
                >
                  <Volume2 size={16} />
                </button>
              </div>
              <p>Pick how much reading time feels comfortable today.</p>
            </div>
          </div>

          <div className="length-grid">
            {lengths.map((length) => {
              const isSelected = selectedLength === length.name;
              return (
                <button
                  key={length.name}
                  className={`length-card ${isSelected ? "selected" : ""}`}
                  onClick={() => handleLengthSelect(length.name)}
                  disabled={isGenerating || generatedStory}
                >
                  <span className="length-icon">{length.icon}</span>
                  <div className="length-info">
                    <strong>{length.name}</strong>
                    <span className="length-time">{length.time}</span>
                  </div>
                  <span className="length-tag">{length.badge}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ============================================
            ERROR MESSAGE
        ============================================ */}
        {errorMessage && (
          <div className="story-error">
            <span>💛</span>
            <p>{errorMessage}</p>
          </div>
        )}

        {/* ============================================
            SUMMARY CALLOUT
        ============================================ */}
        <section className="story-summary">
          <div className="summary-icon">
            <BookOpen size={28} />
          </div>

          <div className="summary-content">
            <span className="summary-label">YOUR SPECIAL ADVENTURE POTION</span>
            <h3>Ready to brew your story!</h3>
            <p>
              A <strong>{selectedLength.toLowerCase()}</strong>,{" "}
              <strong>{selectedMood.toLowerCase()}</strong> adventure about{" "}
              <strong>{selectedInterests.join(" & ")}</strong>, starring{" "}
              <strong>{getSummaryCharacterName()}</strong> at the{" "}
              <strong>{selectedLevel}</strong> reading level.
            </p>
          </div>
        </section>

        {/* ============================================
            CREATE BUTTON
        ============================================ */}
        <button
          className="create-story-button"
          onClick={handleCreateStory}
          disabled={
            selectedInterests.length === 0 || isGenerating || generatedStory
          }
        >
          <Sparkles size={22} className="sparkle-spin" />
          <span>{isGenerating ? "Weaving Story Magic..." : "✨ Create My Story Now!"}</span>
          <ChevronRight size={22} />
        </button>

        <p className="create-story-footer">
          🌟 Your adventure is saved automatically into <strong>My AI Stories</strong> so you can reread it anytime!
        </p>
      </main>
    </div>
  );
}

export default CreateStory;