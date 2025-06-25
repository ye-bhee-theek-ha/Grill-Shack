"use client";

import React from "react";
import Image from "next/image";
import defaultProfile from "@/../public/Svgs/profile.svg";

const ProfileButton: React.FC<{
  profile: any | null;
  onClick: () => void;
}> = ({ profile, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="flex items-center space-x-2 relative group"
      aria-label="User profile"
    >
      <div className="h-10 w-10 rounded-full flex items-center justify-center overflow-hidden border-2 border-gray-200 group-hover:border-primary transition-colors">
        <Image
          src={profile?.photoURL || defaultProfile}
          alt="Profile"
          width={40}
          height={40}
          className="object-fill h-full w-full"
        />
      </div>
      <div className="hidden lg:block text-left">
        <p className="text-normal3 font-medium text-white truncate max-w-[120px]">
          {profile?.displayName || ""}
        </p>
        <p className="text-xs text-gray-200 truncate max-w-[120px]">
          {profile?.email || ""}
        </p>
      </div>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4 text-gray-500 group-hover:text-primary transition-colors hidden md:block"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </button>
  );
};

export default ProfileButton;
