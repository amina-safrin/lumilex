import { useEffect, useState } from "react";
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
} from "lucide-react";
import { getLearningState, getGardenStage } from "../utils/learningRewards";

function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [rewards, setRewards] = useState(() => getLearningState());

  useEffect(() => {
    const refreshRewards = () => setRewards(getLearningState());
    window.addEventListener("storage", refreshRewards);
    window.addEventListener("focus", refreshRewards);
    return () => {
      window.removeEventListener("storage", refreshRewards);
      window.removeEventListener("focus", refreshRewards);
    };
  }, []);

  const garden = getGardenStage(rewards);

  // =====================================================
  // LOAD USER + CHILD PROFILE
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
      } catch (error) {
        console.error("Dashboard loading error:", error);
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
          <button className="side-link" onClick={() => navigate("/learning-journey")}>
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

          <button className="side-link">
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
              <Flame size={19} />
            </div>

            <div>
              <strong>0 days</strong>

              <span>
                Reading streak
              </span>
            </div>

          </div>

          {/* READING TIME */}

          <div className="dashboard-stat">

            <div className="stat-symbol">
              <Clock3 size={19} />
            </div>

            <div>
              <strong>0 min</strong>

              <span>
                Reading time
              </span>
            </div>

          </div>

          {/* WEEKLY GOAL */}

          <div className="dashboard-stat">

            <div className="stat-symbol">
              <Target size={19} />
            </div>

            <div>
              <strong>Starting</strong>

              <span>
                Weekly goal
              </span>
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
            <button className="primary-button dashboard-practice-cta" onClick={() => navigate("/learning-journey")}>
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
            EXPLORE STORIES
        ================================================= */}

        <section className="coming-section">

          <div>

            <span className="section-label">
              EXPLORE
            </span>

            <h2>
              Find your next reading adventure.
            </h2>

            <p>
              Explore stories about friendship,
              nature, animals, space and adventure.
              Pick one that sounds exciting and
              start reading.
            </p>

          </div>

          <div className="coming-features">

            {/* STORY LIBRARY */}

            <div
              className="clickable-feature"
              onClick={() => navigate("/stories")}
            >
              <BookOpen size={19} />

              <span>
                Story Library
              </span>

              <ArrowRight size={15} />

            </div>

            {/* MY AI STORIES */}

<div
  className="clickable-feature"
  onClick={() => navigate("/my-stories")}
>
  <Sparkles size={19} />

  <span>
    My AI Stories
  </span>

  <ArrowRight size={15} />
</div>

            {/* LEARNING JOURNEY */}
            <div className="clickable-feature" onClick={() => navigate("/learning-journey")}>
              <Sprout size={19} />
              <span>Learning Journey</span>
              <ArrowRight size={15} />
            </div>

            {/* AI SUPPORT */}

            <div>

              <Sparkles size={19} />

              <span>
                AI Reading Support
              </span>

              <small>
                Coming soon
              </small>

            </div>

            {/* PROGRESS */}

            <div>

              <BarChart3 size={19} />

              <span>
                Progress Insights
              </span>

              <small>
                Coming soon
              </small>

            </div>

          </div>

        </section>

      </main>

    </div>
  );
}

export default Dashboard;