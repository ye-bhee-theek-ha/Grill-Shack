// components/ui/MenuItemMissingIcon.tsx
"use client";

import { div } from "framer-motion/client";
import React from "react";

const MenuItemMissingIcon: React.FC<{
  className?: string;
  containerClassName?: string;
}> = ({ className, containerClassName }) => {
  return (
    <div
      className={`flex items-center justify-center h-full w-full rounded-[12px] ${containerClassName}`}
    >
      <svg
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        className={className || "w-12 h-12 text-white"}
      >
        <path d="m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8"></path>
        <path d="M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c.7.7 2 .7 2.8 0L15 15Zm0 0 7 7"></path>
        <path d="m2.1 21.8 6.4-6.3"></path>
        <path d="m19 5-7 7"></path>
      </svg>
    </div>
  );
};

export default MenuItemMissingIcon;
