// components/ClientLayout.tsx

"use client";

import React, { useState, useEffect } from "react"; // Import React and hooks
import Header from "@/components/Header";
import SubscriptionPopup, { PopupConfig } from "@/components/SubscriptionPopup";
import Footer from "./Footer";
import { useRouter } from "next/navigation";

const mealKeywayOrderUrl =
  "https://order.mealkeyway.com/customer/release/index?mid=674a336c694d346a53507453652b6d614b742b7345673d3d&utm_source=google&rwg_token=AAiGsoYpD58QwquOM6IMU90kRl7Z3Vb_vkjRnP4hMqMNDNB4aFqMwAmKRhCCAe8TPcMRH72Qc2irT-q3EAOXEg1OP0_L8QaiuA%3D%3D#/main";

const automaticPopupConfig: PopupConfig = {
  mode: "automatic",
  title: "Stay Updated!",
  message: "Get exclusive discounts by joining our family.",
  submitButtonText: "Subscribe Now",
};

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [popupConfig, setPopupConfig] = useState<PopupConfig | null>(null);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    console.log("Layout Mounted: ", hasMounted);
    console.log("Layout Popup State: ", isPopupOpen);
    if (!hasMounted) return;

    const timer = setTimeout(() => {
      const alreadySubscribed =
        localStorage.getItem("newsletterSubscribed") === "true";

      let dismissedAutomaticPopup = false;
      try {
        dismissedAutomaticPopup =
          sessionStorage.getItem("automaticPopupClosedThisSession") === "true";
      } catch (error) {
        console.error("Could not read from sessionStorage:", error);
      }

      if (!alreadySubscribed && !isPopupOpen && !dismissedAutomaticPopup) {
        console.log("Layout Timer: Opening automatic popup...");
        setPopupConfig(automaticPopupConfig);
        setIsPopupOpen(true);
      } else {
        console.log(
          "Layout Timer: Automatic popup skipped (already subscribed or popup open)."
        );
      }
    }, 10000);
    return () => clearTimeout(timer);
  }, [hasMounted, isPopupOpen]);

  const router = useRouter();

  return (
    <>
      <Header
        handleOrderNowClick={() => {
          router.push("/MenuPage");
        }}
      />

      {hasMounted && (
        <SubscriptionPopup
          isOpen={isPopupOpen}
          setIsOpen={setIsPopupOpen}
          config={popupConfig}
        />
      )}

      <main>{children}</main>

      <Footer />
    </>
  );
}
