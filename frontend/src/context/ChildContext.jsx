// =========================================================
// LUMILEX CHILD CONTEXT
// Fetches the authenticated child's user ID, name & saved theme directly from PostgreSQL.
// Also synchronizes the selected comfort theme with PostgreSQL.
// =========================================================

import { createContext, useContext, useEffect, useState } from "react";

const ChildContext = createContext({
  userId: null,
  childName: "Reader",
  theme: "forest",
  setTheme: () => {},
  loading: true,
  refreshChildData: () => {},
});

export const AVAILABLE_THEMES = [
  { id: "forest", name: "Magic Forest", icon: "🌳", bg: "#eefbf3", accent: "#2bb673", desc: "Calm soft greens & woodland friends" },
  { id: "ocean", name: "Ocean Breeze", icon: "🌊", bg: "#eaf7ff", accent: "#00a2ff", desc: "Soothing cool blues & sea life" },
  { id: "space", name: "Starry Space", icon: "🚀", bg: "#f3f0ff", accent: "#8a5cf6", desc: "Deep cosmic purples & glowing stars" },
  { id: "candy", name: "Candy Cloud", icon: "🍬", bg: "#fff0f7", accent: "#ff6ea7", desc: "Playful soft pinks & sweet pastel vibes" },
];

export function ChildProvider({ children }) {
  const [userId, setUserId] = useState(null);
  const [childName, setChildName] = useState("Reader");
  const [theme, setThemeState] = useState("forest");
  const [loading, setLoading] = useState(true);

  async function loadChildData() {
    try {
      // 1. Fetch authenticated user from DB
      const userRes = await fetch("http://localhost:5000/api/auth/me", {
        credentials: "include",
      });

      if (!userRes.ok) {
        setUserId(null);
        setLoading(false);
        return;
      }

      const userData = await userRes.json();
      const currentUserId = userData.user?.id ? String(userData.user.id) : null;
      setUserId(currentUserId);

      // 2. Fetch child profile from DB
      const profRes = await fetch("http://localhost:5000/api/profile", {
        credentials: "include",
      });
      if (profRes.ok) {
        const profData = await profRes.json();
        if (profData.profile?.child_name) {
          setChildName(profData.profile.child_name);
        }
      }

      // 3. Fetch saved theme & state from DB
      if (currentUserId) {
        const stateRes = await fetch("http://localhost:5000/api/learning/state", {
          credentials: "include",
        });
        if (stateRes.ok) {
          const stateData = await stateRes.json();
          if (stateData.preferences?.theme) {
            setThemeState(stateData.preferences.theme);
            localStorage.setItem(`lumilex_theme_${currentUserId}`, stateData.preferences.theme);
          }
        } else {
          // Fallback to local storage cache for this user
          const cachedTheme = localStorage.getItem(`lumilex_theme_${currentUserId}`);
          if (cachedTheme) setThemeState(cachedTheme);
        }
      }
    } catch (err) {
      console.warn("ChildContext fetch error (offline / unauthenticated):", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadChildData();
  }, []);

  // Apply theme class to <body> and document root whenever it changes
  useEffect(() => {
    const themeClassNames = AVAILABLE_THEMES.map((t) => `theme-${t.id}`);
    themeClassNames.forEach((cls) => document.body.classList.remove(cls));
    document.body.classList.add(`theme-${theme}`);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  async function setTheme(newTheme) {
    setThemeState(newTheme);
    if (userId) {
      localStorage.setItem(`lumilex_theme_${userId}`, newTheme);
      // Persist to PostgreSQL database for this user
      try {
        await fetch("http://localhost:5000/api/learning/theme", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ theme: newTheme }),
        });
      } catch (e) {
        console.warn("Could not sync theme to database:", e);
      }
    }
  }

  return (
    <ChildContext.Provider
      value={{
        userId,
        childName,
        theme,
        setTheme,
        loading,
        refreshChildData: loadChildData,
      }}
    >
      {children}
    </ChildContext.Provider>
  );
}

export function useChild() {
  return useContext(ChildContext);
}
