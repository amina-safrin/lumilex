import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import {
  BookOpen,
  LayoutDashboard,
  Library,
  Dumbbell,
  BarChart3,
  Settings,
  LogOut,
  Flame,
  Clock3,
  Target,
  Sparkles,
  ArrowRight,
  Sprout,
  Star,
  Crown,
  Volume2,
  Clock,
} from "lucide-react";
import "./Dashboard.css";
import { getLearningState, getGardenStage } from "../utils/learningRewards";
import { getErrorTrackerState } from "../utils/errorTracker";
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
  Science: { icon: "🔬", color: "#3b82f6", bg: "#eff6ff" },
};

const INTEREST_KEYWORDS = {
  Animals: ["animal", "animals", "rabbit", "fox", "bear", "cat", "dog", "owl", "seahorse", "kangaroo", "otter", "bird", "bluebird", "puppy", "finley"],
  Space: ["space", "moon", "star", "rocket", "planet", "galaxy", "astronaut", "fairies", "sky"],
  Adventure: ["adventure", "brave", "treasure", "quest", "journey", "explore", "secret", "captain", "race", "hop"],
  Nature: ["nature", "garden", "forest", "tree", "treehouse", "brook", "flower", "rainbow", "cloud", "river", "sunflower", "pebble", "lake"],
  Fantasy: ["fantasy", "dragon", "magic", "fairy", "fairies", "cloud", "lemonade", "castle"],
  Science: ["science", "space", "star", "rocket", "moon", "planet", "nature", "tree", "water", "brook", "explorer", "lemonade"],
  Friendship: ["friendship", "friend", "share", "shared", "together", "kindness", "bakes", "pie", "friendly"],
};

function getStoryEmoji(story) {
  const t = ((story.title || "") + " " + (story.topic || "")).toLowerCase();
  if (t.includes("owl")) return "🦉";
  if (t.includes("cloud") || t.includes("lemonade")) return "☁️";
  if (t.includes("bear") || t.includes("honey") || t.includes("pie")) return "🐻";
  if (t.includes("rocket") || t.includes("space") || t.includes("moon")) return "🚀";
  if (t.includes("seahorse") || t.includes("pearl") || t.includes("ocean")) return "🐡";
  if (t.includes("dragon")) return "🐲";
  if (t.includes("kangaroo") || t.includes("hop")) return "🦘";
  if (t.includes("brook") || t.includes("pebble") || t.includes("boat")) return "⛵";
  if (t.includes("otter") || t.includes("treasure")) return "🦦";
  if (t.includes("picnic") || t.includes("forest") || t.includes("garden")) return "🌿";
  if (t.includes("cat")) return "🐱";
  if (t.includes("bee") || t.includes("sunflower")) return "🐝";
  if (t.includes("star")) return "⭐";
  if (t.includes("rabbit")) return "🐰";
  if (t.includes("dog") || t.includes("puppy")) return "🐶";
  if (t.includes("fox")) return "🦊";
  if (t.includes("treehouse") || t.includes("tree")) return "🌳";
  if (t.includes("captain") || t.includes("adventure")) return "🧭";
  return "📖";
}

function estimateReadingMinutes(content) {
  if (!content) return 2;
  const wordCount = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / 65));
}

function Dashboard() {
  const { userId } = useChild();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [rewards, setRewards] = useState(() => getLearningState(userId));
  const [errorTracker, setErrorTracker] = useState(() => getErrorTrackerState(userId));
  const [stories, setStories] = useState([]);
  const [storiesLoading, setStoriesLoading] = useState(true);
  const [selectedInterestFilter, setSelectedInterestFilter] = useState("ALL");

  useEffect(() => {
    const refreshRewards = () => {
      setRewards(getLearningState(userId));
      setErrorTracker(getErrorTrackerState(userId));
    };
    window.addEventListener("storage", refreshRewards);
    window.addEventListener("focus", refreshRewards);
    return () => {
      window.removeEventListener("storage", refreshRewards);
      window.removeEventListener("focus", refreshRewards);
    };
  }, [userId]);

  const garden = getGardenStage(rewards);

  // =====================================================
  // LOAD USER + CHILD PROFILE + STORIES
  // =====================================================

  useEffect(() => {
    async function loadData() {
      try {
        const userResponse = await fetch(
          "http://localhost:5000/api/auth/me",
          {
            credentials: "include",
          }
        );

        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData.user);
        }

        const profileResponse = await fetch(
          "http://localhost:5000/api/profile",
          {
            credentials: "include",
          }
        );

        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          setProfile(profileData.profile);
        }

        const storiesResponse = await fetch(
          "http://localhost:5000/api/stories",
          {
            credentials: "include",
          }
        );

        if (storiesResponse.ok) {
          const storiesData = await storiesResponse.json();
          setStories(storiesData);
        }
      } catch (error) {
        console.error("Dashboard loading error:", error);
      } finally {
        setStoriesLoading(false);
      }
    }

    loadData();
  }, []);

  // =====================================================
  // LOGOUT
  // =====================================================

  async function handleLogout() {
    try {
      await fetch(
        "http://localhost:5000/api/auth/logout",
        {
          method: "POST",
          credentials: "include",
        }
      );

      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  }

  // =====================================================
  // CHILD NAME & PERSONALIZED STORY SUGGESTIONS
  // =====================================================

  const childName = profile?.child_name || "Reader";

  const childInterests = useMemo(() => {
    if (!profile?.interests) return [];
    if (Array.isArray(profile.interests)) return profile.interests;
    return [profile.interests];
  }, [profile?.interests]);

  const libraryStories = useMemo(() => {
    return stories.filter((s) => s.story_type === "library");
  }, [stories]);

  const suggestedStories = useMemo(() => {
    if (!libraryStories.length) return [];

    // Score stories based on child interests
    const scored = libraryStories.map((story) => {
      let score = 0;
      let matchedInterest = null;

      const storyTopic = (story.topic || "").toLowerCase();
      const storyTitle = (story.title || "").toLowerCase();
      const storyContent = (story.content || "").toLowerCase();

      for (const interest of childInterests) {
        const interestLower = interest.toLowerCase();
        const keywords = INTEREST_KEYWORDS[interest] || [interestLower];

        // 1. Direct topic match
        if (
          storyTopic === interestLower ||
          storyTopic.includes(interestLower) ||
          interestLower.includes(storyTopic)
        ) {
          score += 20;
          if (!matchedInterest) matchedInterest = interest;
        }

        // 2. Keyword match in title
        for (const kw of keywords) {
          if (storyTitle.includes(kw)) {
            score += 10;
            if (!matchedInterest) matchedInterest = interest;
          }
          if (storyContent.includes(kw)) {
            score += 2;
            if (!matchedInterest) matchedInterest = interest;
          }
        }
      }

      return {
        ...story,
        matchScore: score,
        matchedInterest: matchedInterest || story.topic || "Adventure",
        isMatched: score > 0,
      };
    });

    // If an interest filter tab is selected by the child
    if (selectedInterestFilter !== "ALL") {
      const selLower = selectedInterestFilter.toLowerCase();
      const kws = INTEREST_KEYWORDS[selectedInterestFilter] || [selLower];
      const filtered = scored.filter((s) => {
        const sTopic = (s.topic || "").toLowerCase();
        const sTitle = (s.title || "").toLowerCase();
        return (
          s.matchedInterest?.toLowerCase() === selLower ||
          sTopic.includes(selLower) ||
          kws.some((kw) => sTitle.includes(kw))
        );
      });
      return filtered.sort((a, b) => b.matchScore - a.matchScore).slice(0, 6);
    }

    // Default: ALL
    if (childInterests.length > 0) {
      const matched = scored
        .filter((s) => s.matchScore > 0)
        .sort((a, b) => b.matchScore - a.matchScore);

      if (matched.length >= 6) {
        return matched.slice(0, 6);
      }
      // Fill remainder with other beginner stories
      const others = scored.filter((s) => s.matchScore === 0);
      return [...matched, ...others].slice(0, 6);
    }

    // Fallback if no interests: top beginner stories
    return scored.slice(0, 6);
  }, [libraryStories, childInterests, selectedInterestFilter]);

  // =====================================================
  // DASHBOARD
  // =====================================================

  return (
    <div className="dashboard">

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside className="sidebar">

        {/* LOGO */}

        <div className="sidebar-logo">
          <div className="logo-mark">
            <BookOpen size={21} />
          </div>

          <span>LumiLex</span>
        </div>

        <div className="sidebar-label">
          YOUR SPACE
        </div>

        {/* NAVIGATION */}

        <nav className="sidebar-nav">

          {/* DASHBOARD */}

          <button
            className="side-link active"
            onClick={() => navigate("/dashboard")}
          >
            <LayoutDashboard size={18} />

            <span>Dashboard</span>
          </button>

          {/* STORY LIBRARY */}

<button
  className="side-link"
  onClick={() => navigate("/stories")}
>
  <Library size={18} />

  <span>Story Library</span>
</button>

{/* MY AI STORIES */}

<button
  className="side-link"
  onClick={() => navigate("/my-stories")}
>
  <Sparkles size={18} />

  <span>My AI Stories</span>
</button>

          {/* LEARNING JOURNEY */}
          <button className="side-link" onClick={() => navigate("/learning-journey")}>
            <Sprout size={18} />
            <span>Learning Journey</span>
          </button>

          {/* PRACTICE */}
          <button className="side-link" onClick={() => navigate("/practice")}>
            <Dumbbell size={18} />
            <span>Practice</span>
          </button>

          {/* PROGRESS */}

          <button
            className="side-link"
            onClick={() => {
              // Progress will be added in a future sprint
            }}
          >
            <BarChart3 size={18} />

            <span>Progress</span>

            <span className="coming-soon">
              Soon
            </span>
          </button>

        </nav>

        {/* SIDEBAR BOTTOM */}

        <div className="sidebar-bottom">

          <button
            className="side-link"
            onClick={() => navigate("/settings")}
          >
            <Settings size={18} />

            <span>Settings</span>
          </button>

          <button
            className="side-link logout-link"
            onClick={handleLogout}
          >
            <LogOut size={18} />

            <span>Log out</span>
          </button>

        </div>

      </aside>

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <main className="dashboard-main">

        {/* HEADER */}

        <header className="dashboard-header">

          <div>

            <span className="dashboard-eyebrow">
              READING SPACE
            </span>

            <h1>
              Good morning, {childName} 🌱
            </h1>

            <p>
              Let's make today's reading adventure
              a little brighter.
            </p>

          </div>

          <div className="profile-avatar">
            {childName.charAt(0).toUpperCase()}
          </div>

        </header>

        {/* =================================================
            STATS
        ================================================= */}

        <section className="dashboard-stats">

          {/* STREAK */}
          <div className="dashboard-stat">
            <div className="stat-symbol">
              <Flame size={19} color="#ff7a00" />
            </div>
            <div>
              <strong>{errorTracker.streakDays} {errorTracker.streakDays === 1 ? "day" : "days"}</strong>
              <span>Reading streak</span>
            </div>
          </div>

          {/* GEMS */}
          <div className="dashboard-stat">
            <div className="stat-symbol">
              <Sparkles size={19} color="#1cb0f6" />
            </div>
            <div>
              <strong>{errorTracker.gems} gems</strong>
              <span>Star crystals</span>
            </div>
          </div>

          {/* PERFECT LESSON CROWNS */}
          <div className="dashboard-stat">
            <div className="stat-symbol">
              <Crown size={19} color="#e5a100" />
            </div>
            <div>
              <strong>{errorTracker.perfectLessonsCount} {errorTracker.perfectLessonsCount === 1 ? "crown" : "crowns"}</strong>
              <span>Perfect lessons</span>
            </div>
          </div>

        </section>

        {/* REWARDS SNAPSHOT */}
        <section className="dashboard-rewards-strip">
          <div className="dashboard-reward-item"><span className="dashboard-reward-icon">⭐</span><div><strong>{rewards.stars} stars</strong><small>Stars earned through effort</small></div></div>
          <div className="dashboard-reward-item"><span className="dashboard-reward-icon">🏅</span><div><strong>{rewards.badges.length} badges</strong><small>Learning milestones</small></div></div>
          <div className="dashboard-reward-item garden-reward"><span className="dashboard-reward-icon">{garden.emoji}</span><div><strong>{garden.name}</strong><small>{garden.description}</small></div></div>
          <button className="dashboard-reward-button" onClick={() => navigate("/learning-journey")}>Open learning journey <ArrowRight size={15} /></button>
        </section>

        {/* =================================================
            TODAY'S ADVENTURE
        ================================================= */}

        <section className="reading-adventure">

          <div className="adventure-content">

            <div className="adventure-label">

              <Sparkles size={15} />

              TODAY'S ADVENTURE

            </div>

            <h2>
              Your next story is waiting.
            </h2>

            <p>
              Explore our story collection and
              choose a reading adventure that
              interests you.
            </p>

            {/* EXPLORE STORIES BUTTON */}

            <button
              className="primary-button"
              onClick={() => navigate("/stories")}
            >
              Explore Stories

              <ArrowRight size={15} />

            </button>
            <button className="primary-button dashboard-practice-cta" onClick={() => navigate("/practice")}>
              Practise skills <ArrowRight size={15} />
            </button>

            <span className="feature-note">
              Discover stories created for young readers.
            </span>

          </div>

          {/* ADVENTURE ART */}

          <div className="adventure-art">

            <div className="moon">
              ☼
            </div>

            <div className="hill hill-back"></div>

            <div className="hill hill-front"></div>

            <div className="adventure-tree">
              🌳
            </div>

            <div className="tiny-star star-one">
              ✦
            </div>

            <div className="tiny-star star-two">
              ✦
            </div>

          </div>

        </section>

        {/* =================================================
            LOWER GRID
        ================================================= */}

        <section className="dashboard-grid">

          {/* =================================================
              READING JOURNEY
          ================================================= */}

          <div className="journey-card">

            <div className="section-heading">

              <div>

                <span className="section-label">
                  YOUR JOURNEY
                </span>

                <h3>
                  Reading progress
                </h3>

              </div>

              <BarChart3 size={20} />

            </div>

            <div className="journey-progress">

              <div className="progress-header">

                <span>
                  Level {Math.min(rewards.currentLevel, 5)} of 5 · {rewards.completedSessions} practice sessions
                </span>

                <strong>
                  {Math.round(((rewards.currentLevel - 1) / 4) * 100)}%
                </strong>

              </div>

              <div className="progress-track">

                <div className="progress-value" style={{ width: `${Math.round(((rewards.currentLevel - 1) / 4) * 100)}%` }}></div>

              </div>

            </div>

            <div className="journey-message">

              <Sparkles size={17} />

              <p>
                Practise at your own pace. Two strong practice sessions at a level help unlock the next reading adventure.
              </p>

            </div>

          </div>

          {/* =================================================
              INTERESTS
          ================================================= */}

          <div className="interest-summary">

            <div className="section-heading">

              <div>

                <span className="section-label">
                  ABOUT YOUR READER
                </span>

                <h3>
                  Interests
                </h3>

              </div>

            </div>

            <div className="dashboard-chips">

              {profile?.interests?.length > 0 ? (

                profile.interests.map(
                  (interest) => (
                    <span key={interest}>
                      {interest}
                    </span>
                  )
                )

              ) : (

                <span className="empty-chip">
                  No interests selected
                </span>

              )}

            </div>

            <div className="reading-level">

              <span>
                Reading level
              </span>

              <strong>
                {profile?.reading_level ||
                  "Beginner"}
              </strong>

            </div>

          </div>

        </section>

        {/* =================================================
            RECOMMENDED STORIES BASED ON CHILD'S INTERESTS
        ================================================= */}

        <section className="dashboard-story-suggestions">
          <div className="suggestions-header">
            <div className="suggestions-title-group">
              <span className="suggestion-badge">
                <Sparkles size={14} />
                {childInterests.length > 0
                  ? "Picked Just For You"
                  : "Recommended Stories"}
              </span>

              <h2>
                {childInterests.length > 0 ? (
                  <>Stories Based on What You Love 🌟</>
                ) : (
                  <>Explore Stories You'll Love 📖</>
                )}
              </h2>

              <p>
                {childInterests.length > 0 ? (
                  <>
                    Hand-picked for <strong>{childName}</strong> based on your interest in{" "}
                    <strong>{childInterests.join(", ")}</strong>! Tap any story to start reading.
                  </>
                ) : (
                  <>
                    Hand-picked beginner adventures for <strong>{childName}</strong>. Select your favorite
                    topics in{" "}
                    <span
                      className="settings-link"
                      onClick={() => navigate("/settings")}
                    >
                      Settings
                    </span>{" "}
                    for personalized suggestions!
                  </>
                )}
              </p>
            </div>

            <button
              className="view-all-stories-btn"
              onClick={() => {
                playTapSound();
                navigate("/stories");
              }}
            >
              <span>Explore Library ({libraryStories.length || 22})</span>
              <ArrowRight size={15} />
            </button>
          </div>

          {/* Child's Selected Interest Filter Tabs (if child selected multiple interests) */}
          {childInterests.length > 1 && (
            <div className="interest-filter-pills">
              <span className="interest-filter-label">Filter by:</span>

              <button
                type="button"
                className={`interest-pill ${selectedInterestFilter === "ALL" ? "active" : ""}`}
                onClick={() => {
                  playTapSound();
                  setSelectedInterestFilter("ALL");
                }}
              >
                ✨ All My Picks
              </button>

              {childInterests.map((interest) => {
                const meta = TOPIC_METADATA[interest] || { icon: "⭐" };
                const isActive = selectedInterestFilter === interest;
                return (
                  <button
                    key={interest}
                    type="button"
                    className={`interest-pill ${isActive ? "active" : ""}`}
                    onClick={() => {
                      playTapSound();
                      setSelectedInterestFilter(interest);
                    }}
                  >
                    <span>{meta.icon}</span>
                    <span>{interest}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Prompt banner if child has 0 interests selected */}
          {childInterests.length === 0 && (
            <div className="no-interests-banner">
              <div className="no-interests-banner-text">
                <Sparkles size={18} />
                <span>
                  Tell us what you like (Animals, Space, Adventure, Nature...) to get custom story picks!
                </span>
              </div>
              <button
                type="button"
                className="no-interests-banner-btn"
                onClick={() => {
                  playTapSound();
                  navigate("/settings");
                }}
              >
                Choose Interests
              </button>
            </div>
          )}

          {/* Suggestions Grid */}
          <div className="suggested-stories-grid">
            {storiesLoading ? (
              <>
                <div className="suggestion-skeleton-card" />
                <div className="suggestion-skeleton-card" />
                <div className="suggestion-skeleton-card" />
              </>
            ) : suggestedStories.length > 0 ? (
              suggestedStories.map((story) => {
                const topicKey = story.topic || "Adventure";
                const meta = TOPIC_METADATA[topicKey] || {
                  icon: "✨",
                  color: "#059669",
                  bg: "#ecfdf5",
                };
                const emoji = getStoryEmoji(story);
                const readingMinutes = estimateReadingMinutes(story.content);

                return (
                  <div
                    key={story.id}
                    className="suggested-story-card"
                    onClick={() => {
                      playTapSound();
                      navigate(`/story/${story.id}`);
                    }}
                  >
                    {/* Visual Cover Header */}
                    <div className="suggested-story-cover">
                      <div className="suggested-story-cover-top">
                        <span
                          className="suggested-topic-badge"
                          style={{
                            backgroundColor: meta.bg,
                            color: meta.color,
                          }}
                        >
                          {meta.icon} {story.topic || "Adventure"}
                        </span>

                        {story.isMatched && (
                          <span className="suggested-match-pill">
                            ★ Matches: {story.matchedInterest}
                          </span>
                        )}
                      </div>

                      <div className="suggested-story-emoji-center">
                        {emoji}
                      </div>

                      <div className="suggested-reading-time">
                        <Clock size={11} />
                        <span>{readingMinutes} min read</span>
                      </div>
                    </div>

                    {/* Content Details */}
                    <div className="suggested-story-body">
                      <h4 className="suggested-story-title">{story.title}</h4>

                      <p className="suggested-story-excerpt">
                        {story.content
                          ? story.content.slice(0, 95) + "..."
                          : "A warm and gentle adventure crafted for beginning readers."}
                      </p>

                      <div className="suggested-story-meta">
                        <span className="suggested-difficulty-pill">
                          {story.difficulty === "Intermediate"
                            ? "🌟 Intermediate"
                            : "🌱 Beginner"}
                        </span>
                      </div>

                      {/* Card Action Buttons */}
                      <div className="suggested-card-footer">
                        <button
                          type="button"
                          className="card-sound-btn"
                          title="Listen to story title"
                          onClick={(e) => {
                            e.stopPropagation();
                            speakText(story.title);
                          }}
                        >
                          <Volume2 size={15} />
                          <span>Listen</span>
                        </button>

                        <button
                          type="button"
                          className="card-read-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            playTapSound();
                            navigate(`/story/${story.id}`);
                          }}
                        >
                          <span>Read</span>
                          <ArrowRight size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p>No story suggestions found right now.</p>
            )}
          </div>

          {/* Quick Navigation Toolbar */}
          <div className="dashboard-quick-links">
            <span className="dashboard-quick-links-label">Quick Links:</span>

            <button
              type="button"
              className="quick-link-chip"
              onClick={() => {
                playTapSound();
                navigate("/stories");
              }}
            >
              <BookOpen size={15} />
              <span>Story Library</span>
            </button>

            <button
              type="button"
              className="quick-link-chip"
              onClick={() => {
                playTapSound();
                navigate("/my-stories");
              }}
            >
              <Sparkles size={15} />
              <span>My AI Stories</span>
            </button>

            <button
              type="button"
              className="quick-link-chip"
              onClick={() => {
                playTapSound();
                navigate("/create-story");
              }}
            >
              <Sparkles size={15} />
              <span>Create Story</span>
            </button>

            <button
              type="button"
              className="quick-link-chip"
              onClick={() => {
                playTapSound();
                navigate("/learning-journey");
              }}
            >
              <Sprout size={15} />
              <span>Learning Journey</span>
            </button>

            <button
              type="button"
              className="quick-link-chip"
              onClick={() => {
                playTapSound();
                navigate("/practice");
              }}
            >
              <Dumbbell size={15} />
              <span>Practice Room</span>
            </button>
          </div>
        </section>

      </main>

    </div>
  );
}

export default Dashboard;