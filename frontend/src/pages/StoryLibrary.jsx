import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Sparkles,
  Clock,
  BookOpen,
  Search,
  Volume2,
  Star,
  Award,
  Heart,
  ChevronRight,
  Filter,
  CheckCircle2
} from "lucide-react";
import "./StoryLibrary.css";
import { playTapSound, speakText } from "../utils/childAudio";
import { useChild } from "../context/ChildContext";
import { fetchLatestStoryPractice, fetchStorySessions } from "../utils/gemmaAdaptive";
import LessonPlayerModal from "../components/LessonPlayerModal";

// Topic emojis and soft background badges for child-friendly visual appeal
const TOPIC_METADATA = {
  All: { icon: "🌈", color: "#6366f1", bg: "#eef2ff" },
  Animals: { icon: "🐾", color: "#10b981", bg: "#ecfdf5" },
  Adventure: { icon: "🧭", color: "#f59e0b", bg: "#fef3c7" },
  Friendship: { icon: "🤝", color: "#ec4899", bg: "#fdf2f8" },
  School: { icon: "🎒", color: "#3b82f6", bg: "#eff6ff" },
  Nature: { icon: "🌿", color: "#16a34a", bg: "#dcfce7" },
  Fantasy: { icon: "✨", color: "#8b5cf6", bg: "#f3e8ff" },
  Vehicles: { icon: "🚗", color: "#ea580c", bg: "#fff7ed" },
  Sports: { icon: "⚽", color: "#0284c7", bg: "#f0f9ff" },
  Everyday: { icon: "🏡", color: "#059669", bg: "#ecfdf5" },
  Space: { icon: "🚀", color: "#7c3aed", bg: "#f5f3ff" },
};

const LEVEL_OPTIONS = [
  { id: "All", label: "All Levels", short: "All", icon: "📚" },
  { id: "Level 1", label: "Level 1 — First Words", short: "Level 1", icon: "🌱" },
  { id: "Level 2", label: "Level 2 — Word Builders", short: "Level 2", icon: "🧱" },
  { id: "Level 3", label: "Level 3 — Sentence Readers", short: "Level 3", icon: "📖" },
  { id: "Level 4", label: "Level 4 — Little Adventures", short: "Level 4", icon: "🧭" },
  { id: "Level 5", label: "Level 5 — Confident Readers", short: "Level 5", icon: "🌟" },
];

function getStoryEmoji(story) {
  const t = (story.title + " " + (story.topic || "") + " " + (story.content || "")).toLowerCase();
  // Vehicles
  if (t.includes("bus")) return "🚌";
  if (t.includes("tugboat") || t.includes("boat")) return "🚢";
  if (t.includes("fire truck") || t.includes("fire engine")) return "🚒";
  if (t.includes("train") || t.includes("locomotive") || t.includes("steam")) return "🚂";
  if (t.includes("bicycle") || t.includes("bike")) return "🚲";
  if (t.includes("scooter")) return "🛴";
  if (t.includes("rocket") || t.includes("spaceship")) return "🚀";
  // Sports & Games
  if (t.includes("soccer") || t.includes("goal")) return "⚽";
  if (t.includes("baseball") || t.includes("bat") || t.includes("ball")) return "⚾";
  if (t.includes("jump rope")) return "🪢";
  if (t.includes("puzzle")) return "🧩";
  if (t.includes("chess")) return "♟️";
  if (t.includes("roller skate") || t.includes("skate")) return "🛼";
  // School
  if (t.includes("spelling bee") || t.includes("champion")) return "🏆";
  if (t.includes("mural") || t.includes("art")) return "🎨";
  if (t.includes("pen") || t.includes("pencil")) return "✏️";
  if (t.includes("show and tell") || t.includes("classroom") || t.includes("school")) return "🎒";
  if (t.includes("library") || t.includes("mystery book")) return "📖";
  // Everyday
  if (t.includes("pan") || t.includes("scrub") || t.includes("clean")) return "🍳";
  if (t.includes("cookie") || t.includes("baking")) return "🍪";
  if (t.includes("community garden") || t.includes("vegetable")) return "🥕";
  if (t.includes("snow shovel") || t.includes("shovel")) return "❄️";
  if (t.includes("quilt") || t.includes("blanket")) return "🧵";
  if (t.includes("sled")) return "🛷";
  if (t.includes("envelope") || t.includes("letter") || t.includes("card")) return "💌";
  // Animals
  if (t.includes("owl")) return "🦉";
  if (t.includes("cloud") || t.includes("lemonade")) return "☁️";
  if (t.includes("bear") || t.includes("honey")) return "🐻";
  if (t.includes("seahorse") || t.includes("pearl")) return "🐡";
  if (t.includes("dragon")) return "🐲";
  if (t.includes("kangaroo") || t.includes("hop")) return "🦘";
  if (t.includes("otter") || t.includes("treasure")) return "🦦";
  if (t.includes("cat") || t.includes("kitten")) return "🐱";
  if (t.includes("bee") || t.includes("sunflower")) return "🐝";
  if (t.includes("star") || t.includes("sprite")) return "⭐";
  if (t.includes("rabbit") || t.includes("bunny")) return "🐰";
  if (t.includes("pup") || t.includes("dog")) return "🐶";
  if (t.includes("fox")) return "🦊";
  if (t.includes("turtle")) return "🐢";
  if (t.includes("duck")) return "🦆";
  if (t.includes("robin") || t.includes("bluebird") || t.includes("bird")) return "🐦";
  if (t.includes("bug")) return "🐞";
  if (t.includes("acorn") || t.includes("oak")) return "🌰";
  if (t.includes("waterfall")) return "🌊";
  if (t.includes("pixie") || t.includes("elf") || t.includes("fairy")) return "🧚";
  if (t.includes("kite")) return "🪁";
  return "📖";
}

function estimateReadingMinutes(content) {
  if (!content) return 1;
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 65));
}

function getWordCount(story) {
  if (story.word_count && story.word_count > 0) return story.word_count;
  if (!story.content) return 0;
  return story.content.trim().split(/\s+/).filter(Boolean).length;
}

export default function StoryLibrary() {
  const navigate = useNavigate();
  const { childName, userId } = useChild();

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedLevel, setSelectedLevel] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [stories, setStories] = useState([]);
  const [storySessions, setStorySessions] = useState([]);
  const [gemmaStoryPractice, setGemmaStoryPractice] = useState(null);
  const [activePracticeModal, setActivePracticeModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const categories = [
    "All",
    "Animals",
    "Adventure",
    "Friendship",
    "School",
    "Nature",
    "Fantasy",
    "Vehicles",
    "Sports",
    "Everyday",
    "Space",
  ];

  useEffect(() => {
    let isMounted = true;
    const fetchLibraryData = async () => {
      try {
        setLoading(true);
        setError("");

        const [storiesRes, sessions, practiceData] = await Promise.all([
          fetch("http://localhost:5000/api/stories", { credentials: "include" }),
          fetchStorySessions(),
          fetchLatestStoryPractice(userId),
        ]);

        if (!storiesRes.ok) {
          throw new Error("Failed to fetch stories");
        }

        const data = await storiesRes.json();
        const libraryStories = data.filter((s) => s.story_type === "library");

        if (isMounted) {
          setStories(libraryStories);
          setStorySessions(sessions || []);
          if (practiceData && practiceData.hasPractice && practiceData.gemmaPractice) {
            setGemmaStoryPractice(practiceData);
          }
        }
      } catch (err) {
        console.error("Error loading library data:", err);
        if (isMounted) {
          setError("Unable to load stories. Please make sure the server is running.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchLibraryData();
    return () => {
      isMounted = false;
    };
  }, [userId]);

  // Filter by category, reading level AND search query
  const filteredStories = useMemo(() => {
    return stories.filter((story) => {
      // Category filter
      const matchesCategory =
        selectedCategory === "All" || story.topic === selectedCategory;

      // Reading level filter
      const matchesLevel =
        selectedLevel === "All" ||
        (story.difficulty && story.difficulty.startsWith(selectedLevel)) ||
        (selectedLevel === "Level 1" && story.difficulty === "Beginner" && getWordCount(story) <= 50) ||
        (selectedLevel === "Level 2" && story.difficulty === "Beginner" && getWordCount(story) > 50) ||
        (selectedLevel === "Level 3" && story.difficulty === "Intermediate");

      // Search query
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        query === "" ||
        story.title.toLowerCase().includes(query) ||
        (story.topic && story.topic.toLowerCase().includes(query)) ||
        (story.phonics_focus && story.phonics_focus.toLowerCase().includes(query)) ||
        (story.difficulty && story.difficulty.toLowerCase().includes(query));

      return matchesCategory && matchesLevel && matchesSearch;
    });
  }, [stories, selectedCategory, selectedLevel, searchQuery]);

  const openStory = (story) => {
    playTapSound();
    navigate(`/story/${story.id}`);
  };

  const readTitleAloud = (e, title) => {
    e.stopPropagation();
    playTapSound();
    speakText(title);
  };

  return (
    <div className="story-library">
      {/* HEADER */}
      <header className="story-header">
        <button className="back-button" onClick={() => navigate("/dashboard")}>
          <ArrowLeft size={18} />
          <span>Back to Dashboard</span>
        </button>

        <div className="story-header-title">
          <BookOpen size={26} className="library-logo-icon" />
          <div>
            <h1>Story Library</h1>
            <p>Listen, read, and explore wonderful tale worlds, {childName}!</p>
          </div>
        </div>

        <button className="create-story-link" onClick={() => navigate("/create-story")}>
          <Sparkles size={18} />
          <span>Create AI Story</span>
        </button>
      </header>

      {/* HERO HEROIC BANNER */}
      <section className="library-hero-banner">
        <div className="hero-banner-content">
          <span className="hero-tag">✨ {stories.length} Child-Friendly Adventures</span>
          <h2>Pick a magical story and grow your reading powers!</h2>
          <p>
            Every story features extra spacing, friendly phonics, syllable guides, and spoken narration.
          </p>

          {/* SEARCH BAR */}
          <div className="story-search-bar">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stories (e.g. owl, rocket, dragon, bear)..."
            />
            {searchQuery && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearchQuery("")}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="hero-mascot-art">
          <div className="hero-mascot-circle">📚</div>
        </div>
      </section>

      {/* GEMMA AI ADAPTIVE STORY PRACTICE BANNER */}
      {gemmaStoryPractice && gemmaStoryPractice.gemmaPractice && (
        <section className="gemma-library-practice-banner">
          <div className="gemma-banner-left">
            <div className="gemma-banner-badge">
              <Sparkles size={14} />
              <span>Gemma AI Adaptive Practice</span>
            </div>
            <h2 className="gemma-banner-title">
              Special Practice for {gemmaStoryPractice.storyTitle || "Your Recent Story"}
            </h2>
            <p className="gemma-banner-desc">
              {gemmaStoryPractice.gemmaPractice.coachFeedback ||
                "Gemma AI analyzed the words you read and created 5 custom exercises to strengthen your reading superpowers!"}
            </p>
            {gemmaStoryPractice.gemmaPractice.trickyWords?.length > 0 && (
              <div className="gemma-banner-words">
                <span className="words-label">Target words:</span>
                {gemmaStoryPractice.gemmaPractice.trickyWords.map((word, idx) => (
                  <span key={idx} className="gemma-word-pill">
                    {word}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="gemma-banner-right">
            <button
              type="button"
              className="gemma-banner-action-btn"
              onClick={() => {
                playTapSound();
                setActivePracticeModal({
                  lesson: {
                    id: `story-practice-${gemmaStoryPractice.storyId || "latest"}`,
                    title: `Story Practice: ${gemmaStoryPractice.storyTitle || "Tale"}`,
                    subtitle: "Crafted by Gemma AI",
                    icon: "📖",
                    xp: 20,
                    gemsReward: 8,
                  },
                  unit: {
                    id: 1,
                    unitNumber: 1,
                    title: gemmaStoryPractice.storyTitle || "Story Practice",
                    icon: "📖",
                  },
                  questions: gemmaStoryPractice.gemmaPractice.practiceQuestions || [],
                });
              }}
            >
              <Sparkles size={18} />
              <span>Start Practice (5 Questions) 🎯</span>
            </button>
          </div>
        </section>
      )}

      {/* MAIN CONTENT AREA */}
      <main className="story-content">
        {/* READING LEVEL FILTER STRIP */}
        <div className="level-filter-container">
          <div className="filter-section-header">
            <span className="filter-section-label">Reading Level:</span>
          </div>
          <div className="level-scroll-strip">
            {LEVEL_OPTIONS.map((lvl) => {
              const isSelected = selectedLevel === lvl.id;
              const count =
                lvl.id === "All"
                  ? stories.length
                  : stories.filter((s) => s.difficulty && s.difficulty.startsWith(lvl.id)).length;
              return (
                <button
                  key={lvl.id}
                  type="button"
                  className={`level-pill-btn ${isSelected ? "active" : ""}`}
                  onClick={() => {
                    playTapSound();
                    setSelectedLevel(lvl.id);
                  }}
                  title={lvl.label}
                >
                  <span className="level-pill-icon">{lvl.icon}</span>
                  <span className="level-pill-text">{lvl.label}</span>
                  <span className="level-pill-count">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* THEME / CATEGORY FILTER CHIPS */}
        <div className="category-filter-container">
          <div className="filter-section-header">
            <span className="filter-section-label">Story Theme:</span>
          </div>
          <div className="category-scroll-strip">
            {categories.map((category) => {
              const isSelected = selectedCategory === category;
              const meta = TOPIC_METADATA[category] || { icon: "📖" };
              const count =
                category === "All"
                  ? stories.length
                  : stories.filter((s) => s.topic === category).length;
              return (
                <button
                  key={category}
                  type="button"
                  className={`category-pill-btn ${isSelected ? "active" : ""}`}
                  onClick={() => {
                    playTapSound();
                    setSelectedCategory(category);
                  }}
                >
                  <span className="category-pill-icon">{meta.icon}</span>
                  <span>{category}</span>
                  <span className="category-pill-count">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* LOADING STATE */}
        {loading && (
          <div className="no-stories-box">
            <BookOpen size={40} className="pulse-icon" />
            <h3>Opening the magical library books...</h3>
            <p>Loading friendly reading tales for you!</p>
          </div>
        )}

        {/* ERROR STATE */}
        {!loading && error && (
          <div className="no-stories-box error">
            <h3>Oops! We couldn't fetch the library books</h3>
            <p>{error}</p>
          </div>
        )}

        {/* STORY GRID */}
        {!loading && !error && filteredStories.length > 0 && (
          <div className="story-grid">
            {filteredStories.map((story) => {
              const emoji = getStoryEmoji(story);
              const readTime = estimateReadingMinutes(story.content);
              const meta = TOPIC_METADATA[story.topic] || { icon: "📖", color: "#10b981", bg: "#ecfdf5" };
              const session = storySessions.find((s) => Number(s.story_id) === Number(story.id));
              const levelShort = story.difficulty ? story.difficulty.split(" — ")[0] : "Level 1";

              return (
                <div
                  key={story.id}
                  className="story-card interactive-card"
                  onClick={() => openStory(story)}
                >
                  <div className="story-card-topbar">
                    <div className="story-badge-cluster">
                      <span
                        className="story-topic-badge"
                        style={{ backgroundColor: meta.bg, color: meta.color }}
                      >
                        {meta.icon} {story.topic}
                      </span>
                      <span className="story-level-badge">
                        {levelShort}
                      </span>
                    </div>

                    <div className="story-topbar-actions">
                      {session && (
                        <span className="story-read-badge" title={`Read with ${session.accuracy}% accuracy`}>
                          <CheckCircle2 size={12} />
                          <span>{session.accuracy}%</span>
                        </span>
                      )}

                      <button
                        type="button"
                        className="read-title-aloud-btn"
                        onClick={(e) => readTitleAloud(e, story.title)}
                        title="Hear title aloud"
                      >
                        <Volume2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* EMOJI COVER ART */}
                  <div className="story-card-cover">
                    <span className="story-cover-emoji">{emoji}</span>
                  </div>

                  <div className="story-card-body">
                    <h3 className="story-card-title">{story.title}</h3>
                    <p className="story-card-snippet">
                      {story.content ? story.content.split("\n")[0] : ""}
                    </p>

                    {story.phonics_focus && (
                      <div className="story-phonics-badge" title={`Phonics focus: ${story.phonics_focus}`}>
                        <Sparkles size={12} className="phonics-sparkle" />
                        <span>Phonics: <strong>{story.phonics_focus}</strong></span>
                      </div>
                    )}
                  </div>

                  <div className="story-card-footer">
                    <div className="story-meta-pill" title={`${getWordCount(story)} words`}>
                      <BookOpen size={13} />
                      <span>{getWordCount(story)} words</span>
                    </div>

                    <div className="story-meta-pill">
                      <Clock size={13} />
                      <span>{readTime} min</span>
                    </div>

                    <div className="story-start-cta">
                      <span>Read</span>
                      <ChevronRight size={16} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* NO STORIES MATCHING FILTER */}
        {!loading && !error && filteredStories.length === 0 && (
          <div className="no-stories-box">
            <span className="empty-emoji">🔍</span>
            <h3>No stories found for your search</h3>
            <p>Try clicking "All Levels" or "All" themes to explore all {stories.length} stories!</p>
            <button
              type="button"
              className="reset-search-btn"
              onClick={() => {
                setSelectedCategory("All");
                setSelectedLevel("All");
                setSearchQuery("");
              }}
            >
              Show All Stories
            </button>
          </div>
        )}
      </main>

      {/* Interactive Lesson Modal for Gemma Practice */}
      {activePracticeModal && (
        <LessonPlayerModal
          lessonSession={activePracticeModal}
          onClose={() => setActivePracticeModal(null)}
          onCompleted={() => {
            setActivePracticeModal(null);
            playTapSound();
          }}
          userId={userId}
          childName={childName}
        />
      )}
    </div>
  );
}