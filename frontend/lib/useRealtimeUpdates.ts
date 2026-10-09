"use client";

import { useEffect, useRef } from "react";

const REALTIME_ACTIVITY_EVENT = "gourmet:realtime-activity";
const allResources = ["all"];

export interface RealtimeActivity {
  resource: string;
}

export function dispatchRealtimeActivity(activity: RealtimeActivity): void {
  window.dispatchEvent(new CustomEvent<RealtimeActivity>(REALTIME_ACTIVITY_EVENT, { detail: activity }));
}

export function useRealtimeUpdates(
  onActivity: () => void | Promise<void>,
  resources: string[] = allResources
): void {
  const callback = useRef(onActivity);
  const resourceFilter = useRef(resources);
  const refreshing = useRef(false);
  const refreshAgain = useRef(false);

  useEffect(() => {
    callback.current = onActivity;
    resourceFilter.current = resources;
  }, [onActivity, resources]);

  useEffect(() => {
    const refresh = async () => {
      if (document.visibilityState !== "visible") return;
      if (refreshing.current) {
        refreshAgain.current = true;
        return;
      }
      refreshing.current = true;
      do {
        refreshAgain.current = false;
        try {
          await callback.current();
        } catch (error) {
          console.error("Unable to refresh data after a live update.", error);
        }
      } while (refreshAgain.current && document.visibilityState === "visible");
      refreshing.current = false;
    };
    const handleActivity = (event: Event) => {
      const activity = (event as CustomEvent<RealtimeActivity>).detail;
      if (
        activity &&
        (activity.resource === "all" ||
          resourceFilter.current.includes("all") ||
          resourceFilter.current.includes(activity.resource))
      ) {
        void refresh();
      }
    };
    const refreshWhenVisible = () => {
      void refresh();
    };
    const interval = window.setInterval(refreshWhenVisible, 30000);
    window.addEventListener(REALTIME_ACTIVITY_EVENT, handleActivity);
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener(REALTIME_ACTIVITY_EVENT, handleActivity);
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, []);
}
