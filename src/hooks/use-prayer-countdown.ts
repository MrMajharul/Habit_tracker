"use client";

import { useEffect, useState } from "react";

import { formatCountdown } from "@/lib/dates";

export function usePrayerCountdown(target: Date | null) {
  const [countdown, setCountdown] = useState("—");

  useEffect(() => {
    if (!target) return;

    const update = () => setCountdown(formatCountdown(target));
    update();

    const interval = setInterval(update, 30_000);
    return () => clearInterval(interval);
  }, [target]);

  return countdown;
}
