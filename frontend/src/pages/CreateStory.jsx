import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Sparkles,
  BookOpen,
  UserRound,
  ChevronRight,
  Check,
  WandSparkles,
} from "lucide-react";
import "./CreateStory.css";

function CreateStory() {
  const navigate = useNavigate();

  // ============================================
  // STORY SELECTIONS
  // ============================================

  const [selectedInterests, setSelectedInterests] = useState([]);
  const [selectedCharacter, setSelectedCharacter] = useState("Me");
  const [characterName, setCharacterName] = useState("");
  const [selectedMood, setSelectedMood] = useState("Happy");
  const [selectedLevel, setSelectedLevel] = useState("Beginner");
  const [selectedLength, setSelectedLength] = useState("Short");

  // ============================================
  // GENERATION STATE
  // ============================================

  const [isGenerating, setIsGenerating] = useState(false);

  const [generationMessage, setGenerationMessage] = useState(
    "Creating your story..."
  );

  const [errorMessage, setErrorMessage] = useState("");

  // Stores the story returned by the backend
  const [generatedStory, setGeneratedStory] = useState(null);

  // ============================================
  // OPTIONS
  // ============================================

  const interests = [
    {
      name: "Animals",
      icon: "🐱",
      description: "Cute animal adventures",
    },
    {
      name: "Space",
      icon: "🚀",
      description: "Explore the stars",
    },
    {
      name: "Ocean",
      icon: "🌊",
      description: "Discover underwater worlds",
    },
    {
      name: "Adventure",
      icon: "🗺️",
      description: "Go on an exciting journey",
    },
    {
      name: "Fantasy",
      icon: "🐉",
      description: "Enter a magical world",
    },
    {
      name: "Nature",
      icon: "🌳",
      description: "Explore the great outdoors",
    },
  ];

  const characters = [
    {
      name: "Me",
      icon: "🌟",
      title: "Me!",
      description: "Put me in the story",
    },
    {
      name: "Animal Friend",
      icon: "🐾",
      title: "Animal friend",
      description: "A cute animal hero",
    },
    {
      name: "Magical Character",
      icon: "🧚",
      title: "Magic friend",
      description: "A magical hero",
    },
    {
      name: "Custom",
      icon: "✏️",
      title: "My own character",
      description: "I'll choose one",
    },
  ];

  const moods = [
    {
      name: "Happy",
      icon: "😊",
    },
    {
      name: "Funny",
      icon: "😂",
    },
    {
      name: "Adventurous",
      icon: "🗺️",
    },
    {
      name: "Magical",
      icon: "✨",
    },
    {
      name: "Heartwarming",
      icon: "💖",
    },
  ];

  const levels = [
    {
      name: "Beginner",
      icon: "🌱",
      description: "Simple and easy to read",
    },
    {
      name: "Intermediate",
      icon: "🌿",
      description: "A little more challenging",
    },
    {
      name: "Advanced",
      icon: "🌳",
      description: "More detailed reading",
    },
  ];

  const lengths = [
    {
      name: "Short",
      time: "5 min",
      icon: "🌱",
    },
    {
      name: "Medium",
      time: "8 min",
      icon: "🌿",
    },
    {
      name: "Long",
      time: "12 min",
      icon: "🌳",
    },
  ];

  // ============================================
  // GENERATION MESSAGE ANIMATION
  // ============================================

  useEffect(() => {
    if (!isGenerating) return;

    const messages = [
      "Creating your story...",
      "Finding a fun adventure...",
      "Choosing the perfect words...",
      "Adding some magic...",
      "Making it easy to read...",
      "Almost ready...",
    ];

    let index = 0;

    const interval = setInterval(() => {
      index = (index + 1) % messages.length;
      setGenerationMessage(messages[index]);
    }, 1800);

    return () => clearInterval(interval);
  }, [isGenerating]);

  // ============================================
  // SELECT INTEREST
  // ============================================

  const toggleInterest = (interest) => {
    setErrorMessage("");

    if (selectedInterests.includes(interest)) {
      setSelectedInterests(
        selectedInterests.filter((item) => item !== interest)
      );
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  // ============================================
  // SELECT CHARACTER
  // ============================================

  const handleCharacterSelect = (character) => {
    setSelectedCharacter(character);
    setErrorMessage("");

    if (character !== "Custom") {
      setCharacterName("");
    }
  };

  // ============================================
  // CREATE STORY
  // ============================================

  const handleCreateStory = async () => {
    setErrorMessage("");
    setGeneratedStory(null);

    // Validate interests
    if (selectedInterests.length === 0) {
      setErrorMessage(
        "Pick at least one story idea before creating your adventure! ✨"
      );
      return;
    }

    // Validate custom character
    if (selectedCharacter === "Custom" && !characterName.trim()) {
      setErrorMessage("Give your character a name first! 😊");
      return;
    }

    try {
      setIsGenerating(true);
      setGenerationMessage("Creating your story...");

      const response = await fetch(
        "http://localhost:5000/api/stories/generate",
        {
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
              selectedCharacter === "Custom"
                ? characterName.trim()
                : "",

            mood: selectedMood,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Something went wrong while creating your story."
        );
      }

      console.log("Generated story:", data.story);

      // Make sure the backend returned the story
      if (!data.story || !data.story.id) {
        throw new Error(
          "Story was created, but its ID was not returned."
        );
      }

      // ============================================
      // STORY CREATED SUCCESSFULLY
      // ============================================

      // Stop the loading overlay
      setIsGenerating(false);

      // Store the generated story
      // This will display the "Your Story Is Ready!" card
      setGeneratedStory(data.story);
    } catch (error) {
      console.error("Error creating story:", error);

      setIsGenerating(false);

      setErrorMessage(
        error.message ||
          "Something went wrong while creating your story. Please try again."
      );
    }
  };

  // ============================================
  // READ GENERATED STORY
  // ============================================

  const handleReadGeneratedStory = () => {
    if (!generatedStory?.id) {
      return;
    }

    navigate(`/story/${generatedStory.id}`);
  };

  // ============================================
  // CREATE ANOTHER STORY
  // ============================================

  const handleCreateAnotherStory = () => {
    setGeneratedStory(null);
    setErrorMessage("");
  };

  // ============================================
  // SUMMARY TEXT
  // ============================================

  const getSummaryText = () => {
    if (selectedInterests.length === 0) {
      return "Choose what you like and let's make a story!";
    }

    const topicText =
      selectedInterests.length === 1
        ? selectedInterests[0]
        : selectedInterests.join(" + ");

    let characterText = "";

    if (selectedCharacter === "Me") {
      characterText = "you";
    } else if (selectedCharacter === "Custom") {
      characterText = characterName.trim() || "your character";
    } else {
      characterText = selectedCharacter.toLowerCase();
    }

    return `A ${selectedLength.toLowerCase()} ${selectedMood.toLowerCase()} story about ${topicText}, starring ${characterText}.`;
  };

  return (
    <div className="create-story-page">

      {/* ============================================
          GENERATING OVERLAY
      ============================================ */}

      {isGenerating && (
        <div className="story-generating-overlay">

          <div className="story-generating-card">

            <div className="generation-sparkle sparkle-one">
              ✨
            </div>

            <div className="generation-sparkle sparkle-two">
              ⭐
            </div>

            <div className="generation-sparkle sparkle-three">
              ✨
            </div>

            <div className="generation-sparkle sparkle-four">
              🌟
            </div>

            <div className="generation-book">

              <div className="book-page book-left">
                <BookOpen size={55} />
              </div>

              <div className="book-page book-right">
                <BookOpen size={55} />
              </div>

            </div>

            <h2>{generationMessage}</h2>

            <p>
              LumiLex is creating a special adventure
              just for you. 💚
            </p>

            <div className="generation-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>

          </div>

        </div>
      )}

      {/* ============================================
          GENERATED STORY SUCCESS CARD
      ============================================ */}

      {generatedStory && !isGenerating && (
        <div className="generated-story-overlay">

          <div className="generated-story-card">

            {/* Decorative sparkles */}

            <div className="generated-story-sparkles">
              ✨ ⭐ ✨
            </div>

            {/* Book icon */}

            <div className="generated-story-icon">
              <BookOpen size={38} />
            </div>

            {/* Label */}

            <span className="generated-story-label">
              YOUR STORY IS READY!
            </span>

            {/* Story title */}

            <h2>{generatedStory.title}</h2>

            {/* Message */}

            <p className="generated-story-message">
              You created a special adventure!
              <br />
              Are you ready to read it? 🌟
            </p>

            {/* Story details */}

            <div className="generated-story-details">

              <span>
                🌱 {generatedStory.difficulty}
              </span>

              <span>
                📚 {generatedStory.topic}
              </span>

            </div>

            {/* Read story */}

            <button
              className="read-generated-story-button"
              onClick={handleReadGeneratedStory}
            >
              <BookOpen size={20} />

              Read My Story

              <ChevronRight size={19} />
            </button>

            {/* Create another */}

            <button
              className="create-another-story-button"
              onClick={handleCreateAnotherStory}
            >
              ✨ Create Another Story
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
          onClick={() => navigate("/stories")}
          disabled={isGenerating || generatedStory}
        >
          <ArrowLeft size={18} />
          Back to Stories
        </button>

        <div className="create-story-title">

          <Sparkles size={24} />

          <h1>
            Create My Story
          </h1>

        </div>

      </header>

      {/* ============================================
          INTRO
      ============================================ */}

      <section className="create-story-intro">

        <div className="intro-badge">
          <WandSparkles size={16} />
          Your imagination, your story
        </div>

        <h2>
          ✨ Let's make a story!
        </h2>

        <p>
          Pick a few things you like and LumiLex
          will turn your ideas into a story made
          especially for you.
        </p>

      </section>

      <main className="create-story-content">

        {/* ============================================
            STEP 1 — INTERESTS
        ============================================ */}

        <section className="story-option-card">

          <div className="option-heading">

            <span className="option-number">
              1
            </span>

            <div>
              <h3>
                🌈 What should your story be about?
              </h3>

              <p>
                Pick one or more things you love.
              </p>
            </div>

          </div>

          <div className="interest-grid">

            {interests.map((interest) => (

              <button
                key={interest.name}
                className={`interest-card ${
                  selectedInterests.includes(
                    interest.name
                  )
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  toggleInterest(interest.name)
                }
                disabled={isGenerating || generatedStory}
              >

                {selectedInterests.includes(
                  interest.name
                ) && (
                  <span className="selected-check">
                    <Check size={13} />
                  </span>
                )}

                <span className="interest-icon">
                  {interest.icon}
                </span>

                <strong>
                  {interest.name}
                </strong>

                <small>
                  {interest.description}
                </small>

              </button>

            ))}

          </div>

        </section>

        {/* ============================================
            STEP 2 — CHARACTER
        ============================================ */}

        <section className="story-option-card">

          <div className="option-heading">

            <span className="option-number">
              2
            </span>

            <div>
              <h3>
                🧑 Who is going on the adventure?
              </h3>

              <p>
                Every story needs a fun character!
              </p>
            </div>

          </div>

          <div className="character-grid">

            {characters.map((character) => (

              <button
                key={character.name}
                className={`character-card ${
                  selectedCharacter === character.name
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  handleCharacterSelect(
                    character.name
                  )
                }
                disabled={isGenerating || generatedStory}
              >

                <span className="character-icon">
                  {character.icon}
                </span>

                <strong>
                  {character.title}
                </strong>

                <small>
                  {character.description}
                </small>

              </button>

            ))}

          </div>

          {selectedCharacter === "Custom" && (
            <div className="custom-character-box">

              <label>
                <UserRound size={16} />
                What is your character's name?
              </label>

              <input
                type="text"
                value={characterName}
                onChange={(e) =>
                  setCharacterName(e.target.value)
                }
                placeholder="e.g. Luna, Max, Star..."
                maxLength={30}
                disabled={isGenerating || generatedStory}
              />

            </div>
          )}

        </section>

        {/* ============================================
            STEP 3 — MOOD
        ============================================ */}

        <section className="story-option-card">

          <div className="option-heading">

            <span className="option-number">
              3
            </span>

            <div>
              <h3>
                💕 How should your story feel?
              </h3>

              <p>
                Choose the kind of adventure you want.
              </p>
            </div>

          </div>

          <div className="mood-grid">

            {moods.map((mood) => (

              <button
                key={mood.name}
                className={`mood-card ${
                  selectedMood === mood.name
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  setSelectedMood(mood.name)
                }
                disabled={isGenerating || generatedStory}
              >

                <span>
                  {mood.icon}
                </span>

                <strong>
                  {mood.name}
                </strong>

              </button>

            ))}

          </div>

        </section>

        {/* ============================================
            STEP 4 — LEVEL
        ============================================ */}

        <section className="story-option-card">

          <div className="option-heading">

            <span className="option-number">
              4
            </span>

            <div>
              <h3>
                🌱 Choose your reading level
              </h3>

              <p>
                We'll make the story comfortable to read.
              </p>
            </div>

          </div>

          <div className="level-grid">

            {levels.map((level) => (

              <button
                key={level.name}
                className={`level-card ${
                  selectedLevel === level.name
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  setSelectedLevel(level.name)
                }
                disabled={isGenerating || generatedStory}
              >

                <span className="level-icon">
                  {level.icon}
                </span>

                <div>
                  <strong>
                    {level.name}
                  </strong>

                  <small>
                    {level.description}
                  </small>
                </div>

              </button>

            ))}

          </div>

        </section>

        {/* ============================================
            STEP 5 — LENGTH
        ============================================ */}

        <section className="story-option-card">

          <div className="option-heading">

            <span className="option-number">
              5
            </span>

            <div>
              <h3>
                ⏰ How long should your adventure be?
              </h3>

              <p>
                Pick how much reading time you'd like.
              </p>
            </div>

          </div>

          <div className="length-grid">

            {lengths.map((length) => (

              <button
                key={length.name}
                className={`length-card ${
                  selectedLength === length.name
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  setSelectedLength(length.name)
                }
                disabled={isGenerating || generatedStory}
              >

                <span className="length-icon">
                  {length.icon}
                </span>

                <strong>
                  {length.name}
                </strong>

                <span>
                  {length.time}
                </span>

              </button>

            ))}

          </div>

        </section>

        {/* ============================================
            ERROR
        ============================================ */}

        {errorMessage && (
          <div className="story-error">

            <span>💛</span>

            <p>
              {errorMessage}
            </p>

          </div>
        )}

        {/* ============================================
            STORY SUMMARY
        ============================================ */}

        <section className="story-summary">

          <div className="summary-icon">
            <BookOpen size={24} />
          </div>

          <div className="summary-content">

            <span className="summary-label">
              YOUR STORY
            </span>

            <h3>
              A little adventure is waiting...
            </h3>

            <p>
              {getSummaryText()}
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
            selectedInterests.length === 0 ||
            isGenerating ||
            generatedStory
          }
        >

          <Sparkles size={20} />

          {isGenerating
            ? "Creating your story..."
            : "✨ Create My Story"}

          <ChevronRight size={19} />

        </button>

        <p className="create-story-footer">
          🌟 Your story will be saved to My Stories
          so you can read it again anytime.
        </p>

      </main>

    </div>
  );
}

export default CreateStory;