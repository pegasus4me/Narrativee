"use client";

import { useCallback } from "react";

interface TrackEventParams {
  eventName: string;
  eventData?: Record<string, unknown>;
}

function pushToDataLayer(data: Record<string, unknown>) {
  if (typeof window !== "undefined") window.dataLayer?.push(data);
}

export const useGTMTracking = () => {
  const trackEvent = useCallback(
    ({ eventName, eventData = {} }: TrackEventParams) => {
      pushToDataLayer({ event: eventName, ...eventData });
    },
    [],
  );
  const trackSignUp = useCallback((method?: string) => {
    pushToDataLayer({ event: "sign_up", method: method || "email" });
  }, []);

  return { trackEvent, trackSignUp };
};

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}
