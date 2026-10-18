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
  Filter
} from "lucide-react";
import "./StoryLibrary.css";
import { playTapSound, speakText } from "../utils/childAudio";
import { useChild } from "../context/ChildContext";

// Topic emojis and soft background badges for child-friendly visual appeal
const TOPIC_METADATA = {
  All: { icon: "🌈", color: "#6366f1", bg: "#eef2ff" },
  Animals: { icon: "🐾", color: "#10b981", bg: "#ecfdf5" },
  Adventure: { icon: "🧭", color: "#f59e0b", bg: "#fef3c7" },
  Friendship: { icon: "🤝", color: "#ec4899", bg: "#fdf2f8" },
  Nature: { icon: "🌿", color: "#16a34a", bg: "#dcfce7" },
  Space: { icon: "🚀", color: "#8b5cf6", bg: "#f3e8ff" },
  Fantasy: { icon: "✨", color: "#06b6d4", bg: "#ecfeff" },
};

function getStoryEmoji(story) {
  const t = (story.title + " " + story.topic).toLowerCase();
  if (t.includes("owl")) return "🦉";
  if (t.includes("cloud") || t.includes("lemonade")) return "☁️";
  if (t.includes("bear") || t.includes("honey")) return "🐻";
  if (t.includes("rocket") || t.includes("space")) return "🚀";
  if (t.includes("seahorse") || t.includes("pearl")) return "🐡";
  if (t.includes("dragon")) return "🐲";
  if (t.includes("kangaroo") || t.includes("hop")) return "🦘";
  if (t.includes("brook") || t.includes("pebble")) return "⛵";
  if (t.includes("otter") || t.includes("treasure")) return "🦦";
  if (t.includes("picnic") || t.includes("forest")) return "🧺";
  if (t.includes("cat")) return "🐱";
  if (t.includes("bee") || t.includes("sunflower")) return "🐝";
  if (t.includes("star")) return "⭐";
  if (t.includes("rabbit")) return "🐰";
  if (t.includes("dog") || t.includes("puppy")) return "🐶";
  if (t.includes("fox")) return "🦊";
  if (t.includes("ocean")) return "🌊";
  return "📖";
}

function estimateReadingMinutes(content) {
  if (!content) return 1;
  const wordCount = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / 65));
}

export default function StoryLibrary() {
  const navigate = useNavigate();
  const { childName } = useChild();

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const categories = [
    "All",
    "Animals",
    "Adventure",
    "Friendship",
    "Nature",
    "Space",
    "Fantasy",
  ];

  useEffect(() => {
    const fetchStories = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("http://localhost:5000/api/stories", {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch stories");
        }

        const data = await response.json();
        const libraryStories = data.filter((s) => s.story_type === "library");
        setStories(libraryStories);
      } catch (err) {
        console.error("Error loading stories:", err);
        setError("Unable to load stories. Please make sure the server is running.");
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, []);

  // Filter by category AND search query
  const filteredStories = useMemo(() => {
    return stories.filter((story) => {
      const matchesCategory =
        selectedCategory === "All" || story.topic === selectedCategory;
      const matchesSearch =
        searchQuery === "" ||
        story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        story.topic.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [stories, selectedCategory, searchQuery]);

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

      {/* MAIN CONTENT AREA */}
      <main className="story-content">
        {/* CATEGORY FILTER CHIPS */}
        <div className="category-scroll-strip">
          {categories.map((category) => {
            const isSelected = selectedCategory === category;
            const meta = TOPIC_METADATA[category] || { icon: "📖" };
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
                {isSelected && <span className="category-pill-count">({filteredStories.length})</span>}
              </button>
            );
          })}
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
              const meta = TOPIC_METADATA[story.topic] || { color: "#10b981", bg: "#ecfdf5" };

              return (
                <div
                  key={story.id}
                  className="story-card interactive-card"
                  onClick={() => openStory(story)}
                >
                  <div className="story-card-topbar">
                    <span
                      className="story-topic-badge"
                      style={{ backgroundColor: meta.bg, color: meta.color }}
                    >
                      {story.topic}
                    </span>

                    <button
                      type="button"
                      className="read-title-aloud-btn"
                      onClick={(e) => readTitleAloud(e, story.title)}
                      title="Hear title aloud"
                    >
                      <Volume2 size={16} />
                    </button>
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
                  </div>

                  <div className="story-card-footer">
                    <div className="story-meta-pill">
                      <Clock size={13} />
                      <span>{readTime} min read</span>
                    </div>

                    <div className="story-difficulty-pill">
                      <span>{story.difficulty || "Beginner"}</span>
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
            <h3>No stories found for "{searchQuery || selectedCategory}"</h3>
            <p>Try clicking "All" or typing another exciting search word!</p>
            <button
              type="button"
              className="reset-search-btn"
              onClick={() => {
                setSelectedCategory("All");
                setSearchQuery("");
              }}
            >
              Show All Stories
            </button>
          </div>
        )}
      </main>
    </div>
  );
}