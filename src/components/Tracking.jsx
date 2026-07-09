import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { initTracking, trackEvent, trackingSettings } from "../services/tracking";

export function Tracking() {
  const location = useLocation();

  useEffect(() => {
    // Silently handle any tracking initialization errors
    initTracking().catch(() => {
      // Tracking is non‑critical – fail silently
    });
  }, []);

  useEffect(() => {
    trackingSettings()
      .then((settings) => {
        if (settings.virtualPageviews === false) return;
        trackEvent("page_view", {
          title: document.title,
          path: location.pathname,
          search: location.search,
        });
      })
      .catch(() => {}); // Ignore errors
  }, [location.pathname, location.search]);

  return null;
}