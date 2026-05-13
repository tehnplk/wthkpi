"use client";

import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";

const storageKey = "wthkpi-theme";

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function ThemeToggle() {
  const toggleTheme = () => {
    const currentTheme = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    window.localStorage.setItem(storageKey, nextTheme);
    applyTheme(nextTheme);
  };

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
    >
      <span className="theme-toggle-track" aria-hidden="true">
        <span className="theme-toggle-thumb">
          <Moon className="theme-icon theme-icon-moon" size={14} strokeWidth={2.2} />
          <Sun className="theme-icon theme-icon-sun" size={14} strokeWidth={2.2} />
        </span>
      </span>
    </button>
  );
}
