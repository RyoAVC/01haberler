"use client";

import { useEffect, useState } from "react";
import { SunIcon, MoonIcon } from "@/components/ui/Icons";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("01h-theme", next ? "dark" : "light");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Açık temaya geç" : "Koyu temaya geç"}
      className="flex h-11 w-11 items-center justify-center text-ink-secondary transition-colors hover:text-brand-red dark:text-ink-dark-secondary"
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
