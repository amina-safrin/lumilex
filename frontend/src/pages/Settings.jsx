import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Settings as SettingsIcon,
  Palette,
  User,
  Volume2,
  VolumeX,
  Trash2,
  ChevronDown,
  ChevronUp,
  Save,
  CheckCircle2,
  AlertTriangle,
  Lock,
  LogOut
} from "lucide-react";
import { useChild } from "../context/ChildContext";
import ThemePicker from "../components/ThemePicker";
import {
  getSoundVolume,
  setSoundVolume as setAudioEngineVolume,
  isSoundsMuted,
  toggleMuteSounds,
  playTapSound,
  playSuccessChime,
} from "../utils/childAudio";
import "./Settings.css";

export default function Settings() {
  const navigate = useNavigate();
  const { userId, childName, refreshChildData } = useChild();

  // Accordion bar open/close state: 'themes' | 'profile' | 'sound' | 'delete'
  const [openBars, setOpenBars] = useState({
    themes: true,
    profile: false,
    sound: false,
    delete: false,
  });

  const toggleBar = (barKey) => {
    playTapSound();
    setOpenBars((prev) => ({
      ...prev,
      [barKey]: !prev[barKey],
    }));
  };

  // -------------------------------------------------------------
  // PROFILE STATE
  // -------------------------------------------------------------
  const [name, setName] = useState(childName || "");
  const [age, setAge] = useState("");
  const [readingLevel, setReadingLevel] = useState("beginner");
  const [interests, setInterests] = useState([]);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState("");

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
    setSavingProfile(true);
    setProfileSuccess(false);
    setProfileError("");

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

      if (res.ok || res.status === 409) {
        setProfileSuccess(true);
        if (refreshChildData) refreshChildData();
        setTimeout(() => setProfileSuccess(false), 3000);
      } else {
        const errData = await res.json();
        setProfileError(errData.message || "Could not save profile");
      }
    } catch (err) {
      setProfileError("Connection error while saving");
    } finally {
      setSavingProfile(false);
    }
  };

  // -------------------------------------------------------------
  // SOUND LEVEL STATE
  // -------------------------------------------------------------
  const [volume, setVolume] = useState(() => Math.round(getSoundVolume() * 100));
  const [muted, setMuted] = useState(() => isSoundsMuted());

  const handleVolumeChange = (e) => {
    const newVolPercent = parseInt(e.target.value, 10);
    setVolume(newVolPercent);
    setAudioEngineVolume(newVolPercent / 100);
  };

  const handleToggleMute = () => {
    const isNowMuted = toggleMuteSounds();
    setMuted(isNowMuted);
    if (!isNowMuted) {
      playSuccessChime();
    }
  };

  const handleTestSound = () => {
    playSuccessChime();
  };

  // -------------------------------------------------------------
  // DELETE ACCOUNT STATE
  // -------------------------------------------------------------
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      setDeleteError("Please type DELETE to confirm account removal");
      return;
    }

    if (!window.confirm("Are you sure? This will permanently erase your account, all reading badges, crowns, and progress.")) {
      return;
    }

    setIsDeleting(true);
    setDeleteError("");

    try {
      const res = await fetch("http://localhost:5000/api/auth/account", {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        // Clear all local caches
        localStorage.clear();
        alert("Account and reading data deleted. Returning to login.");
        navigate("/login");
      } else {
        const data = await res.json();
        setDeleteError(data.message || "Failed to delete account");
      }
    } catch (err) {
      setDeleteError("Network error deleting account");
    } finally {
      setIsDeleting(false);
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
          <SettingsIcon size={22} />
          <h1>Settings & Preferences</h1>
        </div>
      </header>

      <main className="settings-main-container">
        {/* =========================================================
            BAR 1: READING COMFORT THEMES
        ========================================================= */}
        <div className={`settings-accordion-bar ${openBars.themes ? "open" : ""}`}>
          <button
            type="button"
            className="accordion-header-btn"
            onClick={() => toggleBar("themes")}
          >
            <div className="bar-title-left">
              <span className="bar-icon-badge themes-badge">
                <Palette size={20} />
              </span>
              <div>
                <h2>Reading Comfort Themes</h2>
                <p>Choose gentle dyslexia-friendly color worlds (Forest, Ocean, Space, Candy, Night)</p>
              </div>
            </div>
            <div className="accordion-arrow">
              {openBars.themes ? <ChevronUp size={22} /> : <ChevronDown size={22} />}
            </div>
          </button>

          {openBars.themes && (
            <div className="accordion-content">
              <ThemePicker />
            </div>
          )}
        </div>

        {/* =========================================================
            BAR 2: EDIT PROFILE
        ========================================================= */}
        <div className={`settings-accordion-bar ${openBars.profile ? "open" : ""}`}>
          <button
            type="button"
            className="accordion-header-btn"
            onClick={() => toggleBar("profile")}
          >
            <div className="bar-title-left">
              <span className="bar-icon-badge profile-badge">
                <User size={20} />
              </span>
              <div>
                <h2>Edit Reader Profile</h2>
                <p>Change child's name, age, reading level, and favorite reading topics</p>
              </div>
            </div>
            <div className="accordion-arrow">
              {openBars.profile ? <ChevronUp size={22} /> : <ChevronDown size={22} />}
            </div>
          </button>

          {openBars.profile && (
            <div className="accordion-content">
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

                <div className="form-row">
                  <div className="form-group flex-1">
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

                  <div className="form-group flex-1">
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

                {profileSuccess && (
                  <div className="alert-banner success">
                    <CheckCircle2 size={18} /> Profile details updated successfully!
                  </div>
                )}
                {profileError && (
                  <div className="alert-banner error">{profileError}</div>
                )}

                <div className="bar-actions-row">
                  <button type="submit" className="save-button" disabled={savingProfile}>
                    <Save size={16} />
                    <span>{savingProfile ? "Saving..." : "Save Profile Details"}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* =========================================================
            BAR 3: SOUND LEVEL & VOLUME
        ========================================================= */}
        <div className={`settings-accordion-bar ${openBars.sound ? "open" : ""}`}>
          <button
            type="button"
            className="accordion-header-btn"
            onClick={() => toggleBar("sound")}
          >
            <div className="bar-title-left">
              <span className="bar-icon-badge sound-badge">
                {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </span>
              <div>
                <h2>Sound Level & Audio Volume</h2>
                <p>Adjust narration volume, chime level, or mute sound effects</p>
              </div>
            </div>
            <div className="accordion-arrow">
              {openBars.sound ? <ChevronUp size={22} /> : <ChevronDown size={22} />}
            </div>
          </button>

          {openBars.sound && (
            <div className="accordion-content">
              <div className="sound-controls-card">
                <div className="sound-slider-group">
                  <div className="sound-slider-header">
                    <span className="slider-label">Master Volume: <strong>{muted ? "Muted" : `${volume}%`}</strong></span>
                    <button
                      type="button"
                      className={`mute-toggle-btn ${muted ? "muted" : ""}`}
                      onClick={handleToggleMute}
                    >
                      {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                      <span>{muted ? "Unmute" : "Mute All Sounds"}</span>
                    </button>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={muted ? 0 : volume}
                    disabled={muted}
                    onChange={handleVolumeChange}
                    className="volume-range-slider"
                  />
                  <div className="slider-ticks">
                    <span>Quiet</span>
                    <span>Gentle</span>
                    <span>Standard</span>
                    <span>Clear</span>
                  </div>
                </div>

                <div className="sound-test-row">
                  <p>Check if the sound is comfortable for your child's ears:</p>
                  <button
                    type="button"
                    className="test-chime-btn"
                    onClick={handleTestSound}
                  >
                    🎵 Test Sound Chime
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* =========================================================
            BAR 4: DELETE MY ACCOUNT (DANGER ZONE)
        ========================================================= */}
        <div className={`settings-accordion-bar danger-bar ${openBars.delete ? "open" : ""}`}>
          <button
            type="button"
            className="accordion-header-btn"
            onClick={() => toggleBar("delete")}
          >
            <div className="bar-title-left">
              <span className="bar-icon-badge danger-badge">
                <Trash2 size={20} />
              </span>
              <div>
                <h2>Delete My Account</h2>
                <p>Permanently remove account, child profile, stories, and reading progress</p>
              </div>
            </div>
            <div className="accordion-arrow">
              {openBars.delete ? <ChevronUp size={22} /> : <ChevronDown size={22} />}
            </div>
          </button>

          {openBars.delete && (
            <div className="accordion-content danger-content">
              <div className="danger-warning-box">
                <AlertTriangle size={22} color="#dc2626" />
                <div>
                  <strong>Warning: This action is permanent!</strong>
                  <p>
                    All of your child's stars, crowns, badges, reading history, and personalized practice sessions will be completely erased from the database.
                  </p>
                </div>
              </div>

              <div className="delete-confirm-box">
                <label htmlFor="confirm-delete">
                  Type <strong>DELETE</strong> below to confirm:
                </label>
                <div className="delete-input-row">
                  <input
                    id="confirm-delete"
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Type DELETE"
                  />
                  <button
                    type="button"
                    className="confirm-delete-btn"
                    disabled={deleteConfirmText !== "DELETE" || isDeleting}
                    onClick={handleDeleteAccount}
                  >
                    <Trash2 size={16} />
                    <span>{isDeleting ? "Deleting..." : "Delete My Account"}</span>
                  </button>
                </div>
              </div>

              {deleteError && (
                <div className="alert-banner error">{deleteError}</div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
