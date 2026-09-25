"use client";

import * as React from "react";

export function PwaRegister() {
  React.useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("Istiqamah ServiceWorker registered:", reg.scope);
        })
        .catch((err) => {
          console.warn("Istiqamah ServiceWorker registration failed:", err);
        });
    }
  }, []);

  return null;
}
