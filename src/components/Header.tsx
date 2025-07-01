"use client";

import React, { useState } from "react";
import { AnimatedMenuButton } from "./Menu_Header_btn";
import {
  AnimatedCTAButton_LoggedIn,
  AnimatedCTAButton_LoggedOut,
} from "./CTA_header_btn";
import useAuth from "../hooks/useAuth";
import AuthModal from "./Auth/AuthForm";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";

interface HeaderProps {
  handleOrderNowClick: () => void;
}

function Header({ handleOrderNowClick }: HeaderProps) {
  const { isAuthenticated, authLoading } = useAuth();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "signup">(
    "login"
  );

  const router = useRouter();
  const pathname = usePathname();

  const handleSignInClick = () => {
    setAuthModalMode("login");
    setIsAuthModalOpen(true);
  };

  const OnLoginRequired = () => {
    setAuthModalMode("login");
    setIsAuthModalOpen(true);
  };

  const scrollToSection = (sectionId: string) => {
    if (pathname === "/") {
      const section = document.getElementById(sectionId);
      if (section) {
        section.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        console.warn(`Scroll target not found on home page: #${sectionId}`);
      }
    } else {
      router.push(`/#${sectionId}`);
    }
  };

  return (
    <div className="p-[20px] w-full">
      <div className="w-full grid grid-cols-2 md:grid-cols-3 items-center">
        {/* Left Section */}
        <div className="flex justify-start">
          <AnimatedMenuButton
            menuItems={[
              {
                name: "Blogs",
                onclick: () => {
                  router.push("/blogs");
                },
              },
              {
                name: "Home",
                onclick: () => {
                  scrollToSection("Home");
                },
              },
              {
                name: "Menu",
                onclick: () => {
                  scrollToSection("Menu");
                },
              },
              {
                name: "Reviews",
                onclick: () => {
                  scrollToSection("Reviews");
                },
              },
              // {
              //   name: "Our Story",
              //   onclick: () => {
              //     scrollToSection("Story");
              //   },
              // },
              {
                name: "Featuring",
                onclick: () => {
                  scrollToSection("Featuring");
                },
              },
              {
                name: "FAQ's",
                onclick: () => {
                  scrollToSection("FAQ's");
                },
              },
              {
                name: "Location",
                onclick: () => {
                  scrollToSection("Location");
                },
              },
            ]}
          />
        </div>

        {/* Center Section (Always Centered) */}
        <div className="justify-center hidden md:flex">
          <div className="h-[50px] w-[50px] ">{/* TODO logo here */}</div>
        </div>

        {/* Right Section */}
        <div className="flex justify-end flex-row">
          {isAuthenticated ? (
            <AnimatedCTAButton_LoggedIn
              handelOrderNowClick={handleOrderNowClick}
            />
          ) : (
            <AnimatedCTAButton_LoggedOut
              onSignInClick={handleSignInClick}
              handelOrderNowClick={handleOrderNowClick}
            />
          )}
          {isAuthModalOpen && (
            <AuthModal
              isOpen={isAuthModalOpen}
              onClose={() => setIsAuthModalOpen(false)}
              initialMode="login"
              key={isAuthModalOpen ? "login" : "signup"}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default Header;
