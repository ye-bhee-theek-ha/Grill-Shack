"use client";

import { useState, useEffect } from "react";

const ThemeSwitcher = () => {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (prefersDark) {
      setTheme("dark");
    }
  }, []);

  // This effect runs whenever the theme state changes.
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      // Add 'dark' class to the <html> element
      root.classList.add("dark");
    } else {
      // Remove 'dark' class from the <html> element
      root.classList.remove("dark");
    }
    // Save the user's preference to localStorage
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  return (
    <main className=" transition-colors duration-700 ease-in-out flex items-center justify-center ">
      <button
        onClick={toggleTheme}
        aria-label="Switch theme"
        // Base container styles
        className={`
          relative w-[56px] h-[26px] rounded-full cursor-pointer
          border border-[#1c2135] dark:border-[#f0f0e8]
          bg-[#0dbdf6] dark:bg-[#272a30]
          transition-all duration-700 ease-in-out overflow-hidden
        `}
      >
        {/* Sun/Moon element */}
        <div
          className={`
            absolute top-[2px] left-[2px] w-[20px] h-[20px] rounded-full
            bg-[#fabc1c] dark:bg-white
            transform transition-all duration-700 ease-in-out
            ${theme === "dark" ? "translate-x-[30px]" : "translate-x-0"}
          `}
        />
        {/* Moon overlay to create the crescent shape */}
        <div
          className={`
            absolute top-[4px] w-[18px] h-[18px] rounded-full
            bg-[#272a30]
            transform transition-transform duration-700 ease-in-out
            ${theme === "dark" ? "translate-x-[30px] scale-100" : "translate-x-0 scale-0"}
          `}
        />

        {/* Cloud/Star Elements */}
        <div className="absolute inset-0 overflow-hidden rounded-full">
          {/* Stars */}
          <div
            className={`
              absolute w-0.5 h-0.5 bg-white rounded-full
              transition-all duration-700 ease-in-out
              ${theme === "dark" ? "opacity-100 top-[16px] left-[16px]" : "opacity-0 top-[8px] left-[12px]"}
            `}
          />
          <div
            className={`
              absolute w-0.5 h-0.5 bg-white rounded-full
              transition-all duration-700 ease-in-out
              ${theme === "dark" ? "opacity-100 top-[3px] left-[22px]" : "opacity-0 top-[8px] left-[17px]"}
            `}
          />
          <div
            className={`
              absolute w-0.5 h-0.5 bg-white rounded-full
              transition-all duration-700 ease-in-out
              ${theme === "dark" ? "opacity-100 top-[10px] left-[29px]" : "opacity-0 top-[8px] left-[22px]"}
            `}
          />
          <div
            className={`
              absolute w-0.5 h-0.5 bg-white rounded-full
              transition-all duration-700 ease-in-out
              ${theme === "dark" ? "opacity-100 top-[5px] left-[34px]" : "opacity-0 top-[6px] left-[17px]"}
            `}
          />

          {/* Clouds */}
          <div
            className={`
              absolute w-[9px] h-[9px] bg-white rounded-full
              transition-all duration-700 ease-in-out
              ${theme === "dark" ? "opacity-0" : "opacity-100 top-[8px] left-[12px]"}
            `}
          />
          <div
            className={`
              absolute w-[9px] h-[9px] bg-white rounded-full
              transition-all duration-700 ease-in-out
              ${theme === "dark" ? "opacity-0" : "opacity-100 top-[8px] left-[17px]"}
            `}
          />
          <div
            className={`
              absolute w-[9px] h-[9px] bg-white rounded-full
              transition-all duration-700 ease-in-out
              ${theme === "dark" ? "opacity-0" : "opacity-100 top-[8px] left-[22px]"}
            `}
          />
          <div
            className={`
              absolute w-[9px] h-[9px] bg-white rounded-full
              transition-all duration-700 ease-in-out
              ${theme === "dark" ? "opacity-0" : "opacity-100 top-[6px] left-[17px]"}
            `}
          />
        </div>
      </button>
    </main>
  );
};

export default ThemeSwitcher;
