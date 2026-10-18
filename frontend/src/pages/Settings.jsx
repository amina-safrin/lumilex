import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Settings as SettingsIcon,
  User,
  Sparkles,
  BookOpen,
  Volume2,
  CheckCircle2,
  Save,
  LogOut
} from "lucide-react";
import { useChild } from "../context/ChildContext";
import ThemePicker from "../components/ThemePicker";
import "./Settings.css";

export default function Settings() {
  const navigate = useNavigate();
  const { userId, childName, theme, refreshChildData } = useChild();

  const [name, setName] = useState(childName || "");
  const [age, setAge] = useState("");
  const [readingLevel, setReadingLevel] = useState("beginner");
  const [interests, setInterests] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");

  const availableInterests = [
    "Animals",
    "Space",
    "Adventure",
    "Nature",
    "Fantasy",
    "Science",
  ];

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("http://localhost:5000/api/profile", {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            setName(data.profile.child_name || "");
            setAge(data.profile.age || "");
            setReadingLevel(data.profile.reading_level || "beginner");
            setInterests(data.profile.interests || []);
          }
        }
      } catch (err) {
        console.warn("Could not load profile:", err);
      }
    }
    loadProfile();
  }, []);

  const toggleInterest = (item) => {
    setInterests((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setSaveError("");

    try {
      const res = await fetch("http://localhost:5000/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          childName: name,
          age: Number(age) || 7,
          interests,
          readingLevel,
        }),
      });

      // If already exists (409 Conflict), profile is already created
      if (res.ok || res.status === 409) {
        setSaveSuccess(true);
        if (refreshChildData) refreshChildData();
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        const errData = await res.json();
        setSaveError(errData.message || "Could not save profile");
      }
    } catch (err) {
      setSaveError("Connection error while saving");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:5000/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      navigate("/login");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="settings-page">
      <header className="settings-topbar">
        <button
          type="button"
          className="settings-back-btn"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft size={18} /> <span>Back to Dashboard</span>
        </button>
        <div className="settings-header-title">
          <SettingsIcon size={20} />
          <h1>Settings & Preferences</h1>
        </div>
      </header>

      <main className="settings-main-container">
        {/* ===================================================
            SECTION 1: READING COMFORT THEME (MOVED FROM DASHBOARD)
        =================================================== */}
        <section className="settings-section">
          <div className="section-intro">
            <h2>🎨 Visual Reading Comfort Themes</h2>
            <p>
              Every child processes light and contrast differently. Choose the color theme that feels softest and easiest on your eyes.
            </p>
          </div>
          <ThemePicker />
        </section>

        {/* ===================================================
            SECTION 2: CHILD PROFILE DETAILS
        =================================================== */}
        <section className="settings-section profile-card-section">
          <div className="section-intro">
            <h2>🌱 Reader Profile</h2>
            <p>Personalize reading lessons, stories, and recommendations.</p>
          </div>

          <form onSubmit={handleSaveProfile} className="settings-form">
            <div className="form-group">
              <label htmlFor="child-name">Child's Name</label>
              <input
                id="child-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Leo"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="child-age">Age</label>
              <input
                id="child-age"
                type="number"
                min="3"
                max="18"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 7"
              />
            </div>

            <div className="form-group">
              <label htmlFor="reading-level">Reading Level</label>
              <select
                id="reading-level"
                value={readingLevel}
                onChange={(e) => setReadingLevel(e.target.value)}
              >
                <option value="beginner">Beginner (Letters & Sounds)</option>
                <option value="intermediate">Intermediate (Short Words & Sentences)</option>
                <option value="advanced">Advanced (Stories & Chapters)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Favorite Story Topics</label>
              <div className="interests-grid">
                {availableInterests.map((item) => {
                  const selected = interests.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      className={`interest-tag ${selected ? "active" : ""}`}
                      onClick={() => toggleInterest(item)}
                    >
                      {item} {selected && "✓"}
                    </button>
                  );
                })}
              </div>
            </div>

            {saveSuccess && (
              <div className="alert-banner success">
                <CheckCircle2 size={18} /> Profile preferences saved!
              </div>
            )}
            {saveError && (
              <div className="alert-banner error">{saveError}</div>
            )}

            <div className="settings-actions">
              <button
                type="submit"
                className="save-button"
                disabled={saving}
              >
                <Save size={16} />
                <span>{saving ? "Saving..." : "Save Preferences"}</span>
              </button>

              <button
                type="button"
                className="logout-button"
                onClick={handleLogout}
              >
                <LogOut size={16} />
                <span>Log Out</span>
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
