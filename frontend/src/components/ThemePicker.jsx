import { Sparkles, Check } from "lucide-react";
import { useChild, AVAILABLE_THEMES } from "../context/ChildContext";
import { playTapSound } from "../utils/childAudio";

export default function ThemePicker() {
  const { theme, setTheme, childName } = useChild();

  const handleSelectTheme = (themeId) => {
    playTapSound();
    setTheme(themeId);
  };

  return (
    <section className="theme-selector-card">
      <div className="theme-selector-header">
        <div>
          <h3>
            <Sparkles size={18} color="#e5a100" />
            Pick Your Reading Comfort Theme
          </h3>
          <p>
            Choose a comforting color world that feels gentle on your eyes, {childName}!
          </p>
        </div>
      </div>

      <div className="theme-chips-grid">
        {AVAILABLE_THEMES.map((item) => {
          const isSelected = theme === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`theme-chip-btn ${isSelected ? "active" : ""}`}
              onClick={() => handleSelectTheme(item.id)}
              style={{
                borderColor: isSelected ? item.accent : undefined,
                backgroundColor: isSelected ? item.bg : undefined,
              }}
              title={item.desc}
            >
              <span className="theme-chip-icon">{item.icon}</span>
              <span className="theme-chip-name">{item.name}</span>
              <span className="theme-chip-tag" style={{ color: item.accent }}>
                {isSelected ? "Active ✓" : "Choose"}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
