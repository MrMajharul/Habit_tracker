"use client";

import * as React from "react";

export function PwaRegister() {
  React.useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      // In development mode, actively unregister any service worker to prevent stale Turbopack/HMR chunk caching
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
      });
      if ("caches" in window) {
        caches.keys().then((keys) => {
          for (const key of keys) {
            caches.delete(key);
          }
        });
      }
      return;
    }

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        console.log("Istiqamaah ServiceWorker registered:", reg.scope);
      })
      .catch((err) => {
        console.warn("Istiqamaah ServiceWorker registration failed:", err);
      });
  }, []);

  return null;
}
