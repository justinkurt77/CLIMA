import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // Default to light mode as requested, but preserve user's manual toggle if stored
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("clima-theme");
    return saved || "light";
  });

  useEffect(() => {
    localStorage.setItem("clima-theme", theme);
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
    }

    // Update Android / mobile status bar meta tag
    const metaTheme = document.querySelector('meta[name="theme-color"]:not([media])');
    if (metaTheme) {
      metaTheme.content = theme === "dark" ? "#000000" : "#f8f9fa";
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark: theme === "dark", toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
