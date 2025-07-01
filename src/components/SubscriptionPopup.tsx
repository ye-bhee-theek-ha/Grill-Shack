// src/components/SubscriptionPopup.tsx
import React, { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase/ClientApp";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

import bg from "@/../public/Images/popupbg.webp";

import RiveEmbed from "./RiveEmbed";

// (Keep the CloseIcon component as before)
const CloseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-6 h-6"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

// Configuration for the popup's appearance and behavior
export interface PopupConfig {
  mode: "automatic" | "redirect"; // Determines behavior after submit
  title: string;
  message: string;
  submitButtonText: string;
  targetUrl?: string; // Only used in 'redirect' mode
}

// Props for the component
export interface SubscriptionPopupProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  config: PopupConfig | null; // Pass null when not open
}

const SubscriptionPopup: React.FC<SubscriptionPopupProps> = ({
  isOpen,
  setIsOpen,
  config,
}) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // const [noMarketing, setNoMarketing] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false); // Tracks internal submission success state
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Reset form when popup is closed or config changes while closed
  useEffect(() => {
    if (!isOpen && hasMounted) {
      const resetTimer = setTimeout(() => {
        setEmail("");
        setIsLoading(false);
        // setNoMarketing(false);
        setError("");
        setIsSubmitted(false); // Reset internal success state
      }, 300); // Delay for animations
      return () => clearTimeout(resetTimer);
    }
  }, [isOpen, hasMounted]);

  const handleClose = useCallback((): void => {
    if (config?.mode === "automatic") {
      console.log("Closing automatic popup, setting session flag.");
      try {
        sessionStorage.setItem("automaticPopupClosedThisSession", "true");
      } catch (error) {
        console.error("Could not write to sessionStorage:", error);
      }
    } else {
      console.log("Closing non-automatic popup.");
    }
    setIsOpen(false);
  }, [config, setIsOpen]);

  const handleRedirect = (url: string): void => {
    console.log("Redirecting to:", url);
    window.location.href = url;
  };

  const handleSubmit = async (e?: React.FormEvent): Promise<void> => {
    if (e) e.preventDefault();

    if (!config) return;

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      console.log(process.env.NEXT_PUBLIC_FIREBASE_RESTAURANT_ID);
      const subscribersCollectionRef = collection(
        db,
        `Restaurants/${process.env.NEXT_PUBLIC_FIREBASE_RESTAURANT_ID}/Subscribers`
      );
      await addDoc(subscribersCollectionRef, {
        email: email,
        subscribedAt: serverTimestamp(),
        // noMarketing: noMarketing,
        date: new Date().toISOString(),
      });

      console.log("Submission successful");
      setIsSubmitted(true);
      localStorage.setItem("newsletterSubscribed", "true");

      setTimeout(() => {
        handleClose();
        if (config.mode === "redirect" && config.targetUrl) {
          handleRedirect(config.targetUrl);
        }
      }, 1500);
    } catch (err) {
      console.error("Error adding document: ", err);
      setError("Subscription failed. Please try again.");
      setIsLoading(false);
    }
  };

  if (!isOpen || !hasMounted || !config) {
    return null;
  }

  // Show success message if submitted, otherwise show form
  const showSuccessMessage = isSubmitted;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 bg-opacity-60 backdrop-blur-sm p-4 pb-0"
      onClick={handleClose}
    >
      <div
        className="relative overflow-hidden w-full max-w-md z-60 bg-white rounded-lg shadow-xl px-6 pt-6 sm:px-8 sm:pt-8 text-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="-z-10 absolute top-0 left-0 h-full w-1/2"
          style={{ backgroundImage: `url(${bg.src})` }}
        ></div>
        <div
          className="-z-10 absolute top-0 right-0 rotate-y-180 h-full w-1/2"
          style={{ backgroundImage: `url(${bg.src})` }}
        ></div>

        <div className="z-100">
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 transition-colors p-1 rounded-full bg-gray-100/80 hover:bg-gray-100"
            aria-label="Close popup"
          >
            <CloseIcon />
          </button>

          {showSuccessMessage ? (
            // Success State
            <div className="text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-16 h-16 mx-auto text-green-500 mb-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h2 className="text-xl font-semibold mb-2">Thank You!</h2>
              <p className="text-gray-600">
                {config.mode === "redirect"
                  ? "Redirecting you now..."
                  : "You're subscribed!"}
              </p>
            </div>
          ) : (
            // Form State - Use config for text
            <>
              <h2 className="text-primary-dark text-h5 font-semibold mb-3 text-center font-not-east">
                {config.title}
              </h2>
              <p className="text-grey mb-6 text-center text-normal4 sm:text-normal3">
                {config.message}
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="newsletter-email" className="sr-only">
                    Email address
                  </label>
                  <input
                    type="email"
                    id="newsletter-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    required
                    className="w-full px-4 py-2 border border-gray-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-dark focus:border-transparent transition-shadow"
                    disabled={isLoading}
                  />
                </div>
                {/* <div className="flex items-start">
                                    <div className="flex items-center h-5">
                                        <input
                                            id="no-marketing"
                                            type="checkbox"
                                            checked={noMarketing}
                                            onChange={(e) => setNoMarketing(e.target.checked)}
                                            className="w-4 h-4 border border-gray-300 rounded focus:ring-2 focus:ring-primary-dark"
                                        />
                                    </div>
                                    <div className="ml-3 text-sm ">
                                        <label htmlFor="no-marketing" className="text-gray-600">
                                            Use this email for updates, not promotions!
                                        </label>
                                    </div>
                                </div> */}
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <div className="flex justify-center mb-0">
                  <RiveEmbed onBtnPress={handleSubmit} isDisabled={isLoading} />
                </div>
                {config.mode === "redirect" && (
                  <button
                    className="-translate-y-6 text-center w-full text-normal3 cursor-pointer text-black/70 underline"
                    onClick={() => handleRedirect(config.targetUrl || "")}
                  >
                    skip this time
                  </button>
                )}
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPopup;
