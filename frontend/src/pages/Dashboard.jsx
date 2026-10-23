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
  GraduationCap,
} from "lucide-react";
import { getLearningState, getGardenStage, setLearningStateLocally } from "../utils/learningRewards";
import { getErrorTrackerState, setErrorTrackerLocally } from "../utils/errorTracker";
import { useChild } from "../context/ChildContext";
import { playTapSound, speakText, playCelebrationFanfare, playGemEarnedSound } from "../utils/childAudio";
import { getCachedRecommendation, fetchLatestRecommendation } from "../utils/gemmaAdaptive";
import GemmaAdaptiveCoachCard from "../components/GemmaAdaptiveCoachCard";
import "./Dashboard.css";

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

function getStoryEmoji(story) {
  const t = ((story.title || "") + " " + (story.topic || "")).toLowerCase();
  if (t.includes("owl")) return "🦉";
  if (t.includes("cloud") || t.includes("lemonade")) return "☁️";
  if (t.includes("bear") || t.includes("honey")) return "🐻";
  if (t.includes("rocket") || t.includes("space") || t.includes("planet") || t.includes("moon")) return "🚀";
  if (t.includes("seahorse") || t.includes("pearl") || t.includes("ocean") || t.includes("sea")) return "🐡";
  if (t.includes("dragon")) return "🐲";
  if (t.includes("kangaroo") || t.includes("hop")) return "🦘";
  if (t.includes("brook") || t.includes("pebble") || t.includes("river")) return "⛵";
  if (t.includes("otter") || t.includes("treasure")) return "🦦";
  if (t.includes("picnic") || t.includes("forest") || t.includes("tree")) return "🧺";
  if (t.includes("cat") || t.includes("kitten")) return "🐱";
  if (t.includes("bee") || t.includes("sunflower")) return "🐝";
  if (t.includes("star") || t.includes("galaxy")) return "⭐";
  if (t.includes("rabbit") || t.includes("bunny")) return "🐰";
  if (t.includes("dog") || t.includes("puppy")) return "🐶";
  if (t.includes("fox")) return "🦊";
  if (t.includes("lion")) return "🦁";
  if (t.includes("dinosaur") || t.includes("dino")) return "🦖";
  if (t.includes("wizard") || t.includes("magic") || t.includes("wand")) return "🪄";
  if (t.includes("robot")) return "🤖";
  if (t.includes("science")) return "🔬";
  if (t.includes("adventure") || t.includes("explore")) return "🧭";
  return "📖";
}

function estimateReadingMinutes(content) {
  if (!content) return 1;
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
  const [loadingStories, setLoadingStories] = useState(true);
  const [rewardModal, setRewardModal] = useState(null);
  const [isClaimingReward, setIsClaimingReward] = useState(false);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [gemmaRecommendation, setGemmaRecommendation] = useState(() => getCachedRecommendation(userId));

  useEffect(() => {
    const refreshRewards = () => {
      setRewards(getLearningState(userId));
      setErrorTracker(getErrorTrackerState(userId));
    };
    refreshRewards(); // Immediately sync when userId is available/changed
    window.addEventListener("storage", refreshRewards);
    window.addEventListener("focus", refreshRewards);
    return () => {
      window.removeEventListener("storage", refreshRewards);
      window.removeEventListener("focus", refreshRewards);
    };
  }, [userId]);

  const garden = getGardenStage(rewards);

  // =====================================================
  // LOAD USER + CHILD PROFILE + STORIES + REWARDS
  // =====================================================

  useEffect(() => {
    async function loadData() {
      try {
        setLoadingStories(true);

        const userResponse = await fetch(
          "http://localhost:5000/api/auth/me",
          {
            credentials: "include",
          }
        );

        let currentUid = userId;
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData.user);
          if (userData.user?.id) {
            currentUid = String(userData.user.id);
          }
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

        // Fetch authoritative learning progress, gems, streak, and check daily learning bonus
        const stateResponse = await fetch(
          "http://localhost:5000/api/learning/state",
          {
            credentials: "include",
          }
        );

        if (stateResponse.ok) {
          const stateData = await stateResponse.json();
          if (stateData.progress) {
            setRewards(stateData.progress);
            setLearningStateLocally(stateData.progress, currentUid);
            if (stateData.progress.latestRecommendation) {
              setGemmaRecommendation(stateData.progress.latestRecommendation);
            } else {
              fetchLatestRecommendation(currentUid).then((rec) => {
                if (rec) setGemmaRecommendation(rec);
              });
            }
          }
          if (stateData.preferences) {
            setErrorTracker(stateData.preferences);
            setErrorTrackerLocally(stateData.preferences, currentUid);
          }
          // Priority 1: Welcome reward for newly created accounts (gems start at 0)
          // Priority 2: Daily learning reward for coming to learn daily, just like streak
          if (stateData.welcomeReward?.available) {
            setRewardModal(stateData.welcomeReward);
            playCelebrationFanfare();
          } else if (stateData.dailyReward?.available) {
            setRewardModal(stateData.dailyReward);
            playCelebrationFanfare();
          }
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
        setLoadingStories(false);
      }
    }

    loadData();
  }, [userId]);

  const handleClaimReward = async () => {
    if (!rewardModal) return;
    try {
      setIsClaimingReward(true);
      playGemEarnedSound();
      const endpoint =
        rewardModal.type === "welcome"
          ? "http://localhost:5000/api/learning/claim-welcome-reward"
          : "http://localhost:5000/api/learning/claim-daily-reward";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setRewardClaimed(true);
        if (data.totalGems !== undefined) {
          setErrorTracker((prev) => ({
            ...prev,
            gems: data.totalGems,
            welcomeRewardClaimed: true,
          }));
          setErrorTrackerLocally(
            {
              gems: data.totalGems,
              welcomeRewardClaimed: true,
              lastDailyBonusDate: new Date().toISOString().split("T")[0],
            },
            userId
          );
        }
        setTimeout(() => {
          setRewardModal(null);
          setRewardClaimed(false);
          setIsClaimingReward(false);
        }, 1200);
      } else {
        setIsClaimingReward(false);
        setRewardModal(null);
      }
    } catch (e) {
      console.warn("Failed to claim reward:", e);
      setIsClaimingReward(false);
      setRewardModal(null);
    }
  };

  // =====================================================
  // RECOMMENDATIONS BASED ON CHILD'S INTERESTS
  // =====================================================

  const childInterests = useMemo(() => {
    return profile?.interests || [];
  }, [profile?.interests]);

  // Match interest logic
  const getMatchingInterest = (story) => {
    if (!childInterests || childInterests.length === 0) return null;
    const text = ((story.topic || "") + " " + (story.title || "")).toLowerCase();
    for (const interest of childInterests) {
      const lowerInt = interest.toLowerCase();
      if (text.includes(lowerInt)) {
        return interest;
      }
      if (
        lowerInt === "science" &&
        (text.includes("space") ||
          text.includes("rocket") ||
          text.includes("star") ||
          text.includes("planet") ||
          text.includes("moon"))
      ) {
        return interest;
      }
      if (
        lowerInt === "nature" &&
        (text.includes("forest") ||
          text.includes("cloud") ||
          text.includes("tree") ||
          text.includes("brook") ||
          text.includes("lemonade"))
      ) {
        return interest;
      }
    }
    return null;
  };

  const recommendedStories = useMemo(() => {
    if (!stories.length) return [];

    const libraryStories = stories.filter(
      (s) => s.story_type === "library" || !s.story_type
    );

    if (childInterests.length === 0) {
      // Default to top 4 library stories if child hasn't chosen interests yet
      return libraryStories.slice(0, 4).map((s) => ({
        ...s,
        matchedInterest: null,
      }));
    }

    const matched = [];
    const unmatched = [];

    // Prioritize library stories that match the child's interests
    libraryStories.forEach((story) => {
      const match = getMatchingInterest(story);
      if (match) {
        matched.push({ ...story, matchedInterest: match });
      } else {
        unmatched.push({ ...story, matchedInterest: null });
      }
    });

    // If matches exist, show them up to 4, filling with others if fewer than 4
    if (matched.length > 0) {
      if (matched.length < 4) {
        return [...matched, ...unmatched.slice(0, 4 - matched.length)];
      }
      return matched.slice(0, 4);
    }

    // Fallback if no direct match found
    return libraryStories.slice(0, 4).map((s) => ({
      ...s,
      matchedInterest: null,
    }));
  }, [stories, childInterests]);

  const handleReadStory = (storyId) => {
    playTapSound();
    navigate(`/story/${storyId}`);
  };

  const handleSpeakTitle = (e, title) => {
    e.stopPropagation();
    playTapSound();
    speakText(title);
  };

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
  // CHILD NAME
  // =====================================================

  const childName = profile?.child_name || "Reader";

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

          {/* DUOLINGO-STYLE LESSONS */}

          <button
            className="side-link"
            onClick={() => {
              playTapSound();
              navigate("/lessons");
            }}
          >
            <GraduationCap size={18} />

            <span>Lessons</span>
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

        {/* REWARD CLAIM POPUP MODAL (WELCOME GIFT & DAILY LEARNING REWARD) */}
        {rewardModal && (
          <div className="daily-reward-overlay" role="dialog" aria-modal="true">
            <div className={`daily-reward-modal-card ${rewardModal.type === "welcome" ? "welcome-modal-card" : ""}`}>
              {/* Playful Floating Sparkles */}
              <div className="modal-sparkle sparkle-tl">✨</div>
              <div className="modal-sparkle sparkle-tr">✦</div>
              <div className="modal-sparkle sparkle-bl">🎉</div>
              <div className="modal-sparkle sparkle-br">⭐</div>

              <button
                type="button"
                className="modal-close-btn"
                onClick={() => {
                  playTapSound();
                  setRewardModal(null);
                }}
                title="Close"
              >
                ✕
              </button>

              {/* Glowing animated gem / gift */}
              <div className={`reward-modal-gem-ring ${rewardModal.type === "welcome" ? "welcome-gem-ring" : ""}`}>
                <div className={`reward-modal-gem ${rewardClaimed ? "gem-claimed" : ""}`}>
                  {rewardModal.type === "welcome" ? "🎁" : "💎"}
                </div>
              </div>

              {rewardModal.type === "welcome" ? (
                <>
                  <span className="reward-modal-eyebrow welcome-eyebrow">
                    <Sparkles size={14} />
                    NEW ACCOUNT WELCOME GIFT 🎉
                  </span>

                  <h2>Welcome to LumiLex, {childName}! 🌟</h2>

                  <p className="reward-modal-desc">
                    {rewardModal.message || "We're so thrilled you're here! Claim your special 20 Star Gems welcome gift to start your reading adventure."}
                  </p>
                </>
              ) : (
                <>
                  <span className="reward-modal-eyebrow">
                    {rewardModal.streak > 0 ? (
                      <>
                        <Flame size={14} color="#f59e0b" />
                        {rewardModal.streak}-DAY LEARNING STREAK 🔥
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        DAILY LEARNING GIFT 🌟
                      </>
                    )}
                  </span>

                  <h2>{rewardModal.title || `Welcome Back, ${childName}! 🌟`}</h2>

                  <p className="reward-modal-desc">
                    {rewardModal.message || "You showed up to learn today! Claim your sparkly daily star gems and keep your reading powers growing."}
                  </p>
                </>
              )}

              <div className="reward-gem-amount-badge">
                <span className="gem-plus">+{rewardModal.gems || (rewardModal.type === "welcome" ? 20 : 5)}</span>
                <span className="gem-text">Star Gems 💎</span>
              </div>

              <button
                type="button"
                className={`reward-claim-main-btn ${rewardModal.type === "welcome" ? "welcome-btn" : ""} ${rewardClaimed ? "claimed" : ""}`}
                onClick={handleClaimReward}
                disabled={isClaimingReward || rewardClaimed}
              >
                <Sparkles size={18} />
                <span>
                  {rewardClaimed
                    ? `Claimed! +${rewardModal.gems || (rewardModal.type === "welcome" ? 20 : 5)} Gems Added 🎉`
                    : isClaimingReward
                    ? "Collecting Crystals..."
                    : rewardModal.type === "welcome"
                    ? "Claim Welcome Gift 💎"
                    : "Claim Daily Reward 💎"}
                </span>
              </button>

              <button
                type="button"
                className="reward-modal-later-link"
                onClick={() => {
                  playTapSound();
                  setRewardModal(null);
                }}
              >
                I'll claim later
              </button>
            </div>
          </div>
        )}

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
              <span>
                {errorTracker.streakDays === 0
                  ? "Day 1 (Streak starts tomorrow)"
                  : "Reading streak"}
              </span>
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

        {/* GEMMA AI ADAPTIVE READING COACH SNAPSHOT */}
        {gemmaRecommendation && (
          <section style={{ margin: "1.25rem 0" }}>
            <GemmaAdaptiveCoachCard
              recommendation={gemmaRecommendation}
              childName={childName}
              onActionClick={() => {
                playTapSound();
                navigate("/practice");
              }}
              actionButtonText="Open Practice Quest 🚀"
              title="Gemma AI Reading Coach"
            />
          </section>
        )}


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

        <section className="dashboard-recommendations-section">

          <div className="recommendations-header">

            <div>

              <div className="recommendations-eyebrow">
                <Sparkles size={16} />
                <span>RECOMMENDED FOR YOU</span>
                {childInterests.length > 0 && (
                  <span className="interests-pill-tag">
                    {childInterests.slice(0, 3).join(" • ")}
                  </span>
                )}
              </div>

              <h2>
                Stories You Might Love, {childName}! 📚
              </h2>

              <p>
                {childInterests.length > 0 ? (
                  <>
                    Handpicked stories matched to your love for{" "}
                    <strong>{childInterests.join(", ")}</strong>. Choose one and dive into your adventure!
                  </>
                ) : (
                  <>
                    Magical reading adventures hand-picked for you. You can customize your favorite topics anytime in Settings!
                  </>
                )}
              </p>

            </div>

            <button
              className="view-library-button"
              onClick={() => {
                playTapSound();
                navigate("/stories");
              }}
            >
              <Library size={16} />
              <span>Explore Story Library</span>
              <ArrowRight size={15} />
            </button>

          </div>

          {/* STORY CARDS GRID */}
          {loadingStories ? (
            <div className="recommendations-loading">
              <span className="recommendation-spinner">✨</span>
              <p>Finding stories matched to your interests...</p>
            </div>
          ) : recommendedStories.length > 0 ? (
            <div className="recommendations-grid">
              {recommendedStories.map((story) => {
                const emoji = getStoryEmoji(story);
                const readTime = estimateReadingMinutes(story.content);
                const meta = TOPIC_METADATA[story.topic] || {
                  icon: "📖",
                  color: "#10b981",
                  bg: "#ecfdf5",
                };
                const snippet = story.content
                  ? story.content.split("\n")[0]
                  : "A wonderful adventure waiting to be read.";

                return (
                  <div
                    key={story.id}
                    className="suggestion-story-card"
                    onClick={() => handleReadStory(story.id)}
                  >
                    <div className="suggestion-card-topbar">
                      <span
                        className="suggestion-topic-badge"
                        style={{
                          backgroundColor: meta.bg,
                          color: meta.color,
                        }}
                      >
                        {meta.icon} {story.topic}
                      </span>

                      {story.matchedInterest ? (
                        <span
                          className="suggestion-match-badge"
                          title={`Picked because you like ${story.matchedInterest}`}
                        >
                          💖 For You
                        </span>
                      ) : null}

                      <button
                        type="button"
                        className="suggestion-voice-btn"
                        onClick={(e) => handleSpeakTitle(e, story.title)}
                        title="Hear title aloud"
                      >
                        <Volume2 size={15} />
                      </button>
                    </div>

                    <div className="suggestion-card-illustration">
                      <div className="suggestion-emoji-avatar">
                        {emoji}
                      </div>
                    </div>

                    <div className="suggestion-card-body">
                      <h3 className="suggestion-title">
                        {story.title}
                      </h3>
                      <p className="suggestion-snippet">
                        {snippet}
                      </p>
                    </div>

                    <div className="suggestion-card-footer">
                      <div className="suggestion-meta-tags">
                        <span className="suggestion-meta-pill">
                          <Clock size={12} />
                          {readTime}m read
                        </span>
                        <span className="suggestion-difficulty-pill">
                          <Target size={12} />
                          {story.difficulty || "Beginner"}
                        </span>
                      </div>

                      <button
                        type="button"
                        className="suggestion-read-cta"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReadStory(story.id);
                        }}
                      >
                        <span>Read</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="recommendations-empty">
              <p>No stories found. Head over to the Story Library to pick a book!</p>
              <button
                className="primary-button"
                onClick={() => navigate("/stories")}
              >
                Go to Story Library <ArrowRight size={15} />
              </button>
            </div>
          )}

          {/* AI STORY CREATOR PROMPT & EXPLORE SHORTCUTS */}
          <div className="recommendations-bottom-bar">

            <div className="ai-story-callout">
              <div className="ai-callout-icon">✨</div>
              <div className="ai-callout-text">
                <h4>
                  {childInterests.length > 0
                    ? `Want a brand new ${childInterests[0]} story?`
                    : `Want a custom story made just for you?`}
                </h4>
                <p>
                  Use our magical AI story maker to craft a new adventure starring {childName}!
                </p>
              </div>

              <button
                className="ai-create-shortcut-btn"
                onClick={() => {
                  playTapSound();
                  navigate("/create-story", {
                    state: {
                      interest: childInterests[0] || "Animals",
                    },
                  });
                }}
              >
                <Sparkles size={16} />
                <span>
                  Create {childInterests[0] || "AI"} Story
                </span>
                <ArrowRight size={15} />
              </button>
            </div>

            {/* QUICK FEATURE NAVIGATION PILLS */}
            <div className="dashboard-quick-links">
              <button
                className="quick-link-pill"
                onClick={() => {
                  playTapSound();
                  navigate("/stories");
                }}
              >
                <BookOpen size={16} />
                <span>Story Library</span>
              </button>

              <button
                className="quick-link-pill"
                onClick={() => {
                  playTapSound();
                  navigate("/my-stories");
                }}
              >
                <Sparkles size={16} />
                <span>My AI Stories</span>
              </button>

              <button
                className="quick-link-pill"
                onClick={() => {
                  playTapSound();
                  navigate("/learning-journey");
                }}
              >
                <Sprout size={16} />
                <span>Learning Journey</span>
              </button>

              <button
                className="quick-link-pill"
                onClick={() => {
                  playTapSound();
                  navigate("/practice");
                }}
              >
                <Dumbbell size={16} />
                <span>Practice Skills</span>
              </button>
            </div>

          </div>

        </section>

      </main>

    </div>
  );
}

export default Dashboard;