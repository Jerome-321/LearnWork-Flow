import { useState, useEffect } from "react";
import { MobileLayout } from "./MobileLayout";
import { GmailStyleNav } from "./GmailStyleNav";

export function ResponsiveLayout() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // For now, let's use Gmail-style navigation (desktop layout)
  return <GmailStyleNav />;
}