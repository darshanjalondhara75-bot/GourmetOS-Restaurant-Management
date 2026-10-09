"use client";

import React from "react";

export function LuxuryBackground() {
  return (
    <div
      className="fixed inset-0 pointer-events-none -z-50 overflow-hidden select-none luxury-bg-container"
      aria-hidden="true"
    >
      {/* Animated High-Resolution Luxury Imagery with Ken-Burns Zoom In/Out */}
      <div className="absolute inset-0">
        <div
          className="w-full h-full transform-gpu luxury-ken-burns"
          style={{
            backgroundImage: "url('/images/luxury_bg_grand.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center center",
            backgroundRepeat: "no-repeat",
            willChange: "transform",
          }}
        />
      </div>

      {/* Warm Candlelight / Golden Amber Shimmer Overlay */}
      <div className="absolute inset-0 z-20 pointer-events-none luxury-ambient-glow" />

      {/* Dark Mode: Transparent Liquid Glass Midnight Vignette */}
      <div className="absolute inset-0 z-30 pointer-events-none hidden dark:block luxury-dark-overlay" />

      {/* Light Mode: Transparent Liquid Glass Frosted Silk Veil */}
      <div className="absolute inset-0 z-30 pointer-events-none block dark:hidden luxury-light-overlay" />
    </div>
  );
}
