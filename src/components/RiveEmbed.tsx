"use client";

import { useRive, useStateMachineInput } from "@rive-app/react-canvas";
import { useCallback, useEffect } from "react";

interface RiveButtonProps {
  onBtnPress: () => Promise<void> | void;
  isDisabled?: boolean;
}

export default function RiveButton({
  onBtnPress,
  isDisabled = false,
}: RiveButtonProps) {
  const { rive, RiveComponent } = useRive({
    src: "/rive/bird_button.riv",
    stateMachines: "State Machine 1",
    autoplay: true,
    // artboard: "YourArtboardName", // Optional: Specify artboard if needed

    // Lifecycle Callbacks (useful for debugging)
    onLoad: () => console.log("Rive: Loaded"),
    onLoadError: (error: any) => console.error("Rive: Load Error", error),
    onStateChange: (e: any) => console.log("Rive: State Change", e.data),
  });

  // State Machine Inputs - Ensure names match your Rive file
  const hoverInput = useStateMachineInput(
    rive,
    "State Machine 1",
    "hvrd",
    false
  );
  const clickInput = useStateMachineInput(
    rive,
    "State Machine 1",
    "clck",
    false
  );

  const handleMouseEnter = useCallback(() => {
    if (hoverInput) hoverInput.value = true;
  }, [hoverInput]);

  const handleMouseLeave = useCallback(() => {
    if (hoverInput) hoverInput.value = false;
  }, [hoverInput]);

  const handleClick = useCallback(async () => {
    if (isDisabled) return;

    if (clickInput) {
      clickInput.value = true;
      setTimeout(() => {
        if (clickInput) clickInput.value = false;
      }, 1000);
    }

    if (onBtnPress) {
      try {
        await onBtnPress();
      } catch (error) {
        console.error("Error during onBtnPress:", error);
        if (clickInput) clickInput.value = false;
      }
    }
  }, [clickInput, onBtnPress, isDisabled]);

  // Resize Rive canvas to fit its container
  useEffect(() => {
    if (rive) {
      const resizeCanvas = () => rive.resizeDrawingSurfaceToCanvas();
      resizeCanvas();
      window.addEventListener("resize", resizeCanvas);
      return () => window.removeEventListener("resize", resizeCanvas);
    }
  }, [rive]);

  return (
    <div
      className="w-[380px] h-[110px] cursor-pointer -translate-x-2 -translate-y-4"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleClick();
      }}
      aria-pressed={false} // Adjust if it's a toggle
      title="Interactive Rive button"
    >
      <RiveComponent style={{ width: "100%", height: "100%" }} />
    </div>
  );
}

/*
  Reminder for alternative hover (Boolean input):
  1. Rive Editor: Change "hvrd" from Trigger to Boolean (e.g., "isHovered").
  2. React: 
     const isHoveredInput = useStateMachineInput(rive, "State Machine 1", "isHovered");
     handleMouseEnter: () => { isHoveredInput && (isHoveredInput.value = true); }
     handleMouseLeave: () => { isHoveredInput && (isHoveredInput.value = false); }
*/
