import { px } from "framer-motion";
import * as React from "react";

const MOBILE_BREAKPOINT = 830;

export function useMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined
  );

  const [fourHundredPx, setFourHundredPx] = React.useState<boolean | undefined>(
    undefined
  );

  const [threeHundredPx, setThreeHundredPx] = React.useState<
    boolean | undefined
  >(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
      setFourHundredPx(window.innerWidth < 400);
      setThreeHundredPx(window.innerWidth < 300);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    setFourHundredPx(window.innerWidth < 400);
    setThreeHundredPx(window.innerWidth < 300);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return {
    isMobile,
    fourHundredPx,
    threeHundredPx,
  };
}
