"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Sparkles, Eye, Zap, Sliders, Play, RotateCcw } from "lucide-react";

export type SnakeTheme = "emerald" | "gold" | "crimson" | "obsidian" | "silver";

export interface SnakeConfig {
  theme: SnakeTheme;
  speed: number;
  segmentCount: number;
  eyeGlowIntensity: number;
  followCursor: boolean;
  showFoodOrbs: boolean;
}

interface SnakeCanvasProps {
  config: SnakeConfig;
  onOpenControls?: () => void;
}

interface Point {
  x: number;
  y: number;
}

interface Segment {
  x: number;
  y: number;
  angle: number;
}

interface Orb {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  glow: string;
  energy: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export function SnakeCanvas({ config, onOpenControls }: SnakeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Snake physical state
  const mousePosRef = useRef<Point>({ x: -1000, y: -1000 });
  const hasMouseRef = useRef<boolean>(false);
  const headPosRef = useRef<Point>({ x: 300, y: 300 });
  const headAngleRef = useRef<number>(0);
  const segmentsRef = useRef<Segment[]>([]);
  const tongueTimerRef = useRef<number>(0);
  const wanderAngleRef = useRef<number>(Math.PI / 4);
  const wanderTimerRef = useRef<number>(0);
  const orbsRef = useRef<Orb[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const scoreRef = useRef<number>(0);
  const [orbScore, setOrbScore] = useState<number>(0);
  const isSprintingRef = useRef<boolean>(false);

  // Initialize segments
  useEffect(() => {
    const segments: Segment[] = [];
    const count = config.segmentCount || 45;
    const initialX = typeof window !== "undefined" ? window.innerWidth / 2 : 500;
    const initialY = typeof window !== "undefined" ? window.innerHeight / 2 : 400;

    for (let i = 0; i < count; i++) {
      segments.push({
        x: initialX - i * 12,
        y: initialY,
        angle: 0,
      });
    }
    segmentsRef.current = segments;
    headPosRef.current = { x: initialX, y: initialY };
  }, [config.segmentCount]);

  // Spawn energy orbs
  const spawnOrbs = useCallback((width: number, height: number) => {
    const orbs: Orb[] = [];
    const orbColors = [
      { color: "#f59e0b", glow: "rgba(245, 158, 11, 0.7)" },
      { color: "#10b981", glow: "rgba(16, 185, 129, 0.7)" },
      { color: "#ef4444", glow: "rgba(239, 68, 68, 0.7)" },
      { color: "#38bdf8", glow: "rgba(56, 189, 248, 0.7)" },
      { color: "#ec4899", glow: "rgba(236, 72, 153, 0.7)" },
    ];

    for (let i = 0; i < 5; i++) {
      const palette = orbColors[i % orbColors.length];
      orbs.push({
        x: Math.random() * (width - 160) + 80,
        y: Math.random() * (height - 160) + 80,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        radius: 7,
        color: palette.color,
        glow: palette.glow,
        energy: 1,
      });
    }
    orbsRef.current = orbs;
  }, []);

  // Theme palettes
  const getThemePalette = useCallback((theme: SnakeTheme) => {
    switch (theme) {
      case "emerald":
        return {
          head: "#0d2b22",
          headHighlight: "#10b981",
          body1: "#064e3b",
          body2: "#042f2e",
          belly: "#134e4a",
          ridge: "#34d399",
          scales: "rgba(52, 211, 153, 0.4)",
          glow: "rgba(16, 185, 129, 0.35)",
        };
      case "gold":
        return {
          head: "#2c1c04",
          headHighlight: "#f59e0b",
          body1: "#78350f",
          body2: "#451a03",
          belly: "#92400e",
          ridge: "#fbbf24",
          scales: "rgba(251, 191, 36, 0.4)",
          glow: "rgba(245, 158, 11, 0.35)",
        };
      case "crimson":
        return {
          head: "#2b0a11",
          headHighlight: "#ef4444",
          body1: "#881337",
          body2: "#4c0519",
          belly: "#9f1239",
          ridge: "#fb7185",
          scales: "rgba(251, 113, 133, 0.4)",
          glow: "rgba(239, 68, 68, 0.35)",
        };
      case "silver":
        return {
          head: "#1e293b",
          headHighlight: "#94a3b8",
          body1: "#334155",
          body2: "#1e293b",
          belly: "#475569",
          ridge: "#cbd5e1",
          scales: "rgba(203, 213, 225, 0.4)",
          glow: "rgba(148, 163, 184, 0.35)",
        };
      case "obsidian":
      default:
        return {
          head: "#0f172a",
          headHighlight: "#38bdf8",
          body1: "#1e293b",
          body2: "#0f172a",
          belly: "#1e293b",
          ridge: "#38bdf8",
          scales: "rgba(56, 189, 248, 0.3)",
          glow: "rgba(56, 189, 248, 0.25)",
        };
    }
  }, []);

  // Main canvas animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      if (orbsRef.current.length === 0) {
        spawnOrbs(width, height);
      }
    };

    window.addEventListener("resize", handleResize);
    spawnOrbs(width, height);

    const handleMouseMove = (e: MouseEvent) => {
      mousePosRef.current = { x: e.clientX, y: e.clientY };
      hasMouseRef.current = true;
    };

    const handleMouseDown = () => {
      isSprintingRef.current = true;
    };

    const handleMouseUp = () => {
      isSprintingRef.current = false;
    };

    const handleMouseLeave = () => {
      hasMouseRef.current = false;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mouseleave", handleMouseLeave);

    let lastTime = performance.now();

    const render = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      ctx.clearRect(0, 0, width, height);

      const palette = getThemePalette(config.theme);
      const sprintMultiplier = isSprintingRef.current ? 1.8 : 1.0;
      const baseSpeed = (config.speed || 3.5) * 60 * sprintMultiplier;

      // 1. Determine target heading
      let targetX = 0;
      let targetY = 0;

      if (config.followCursor && hasMouseRef.current) {
        targetX = mousePosRef.current.x;
        targetY = mousePosRef.current.y;
      } else {
        // Autonomous wandering
        wanderTimerRef.current += dt;
        if (wanderTimerRef.current > 1.2) {
          wanderTimerRef.current = 0;
          wanderAngleRef.current += (Math.random() - 0.5) * 1.5;
        }

        // Keep inside bounds smoothly
        const margin = 120;
        const head = headPosRef.current;
        if (head.x < margin) wanderAngleRef.current = 0 + (Math.random() - 0.5);
        if (head.x > width - margin) wanderAngleRef.current = Math.PI + (Math.random() - 0.5);
        if (head.y < margin) wanderAngleRef.current = Math.PI / 2 + (Math.random() - 0.5);
        if (head.y > height - margin) wanderAngleRef.current = -Math.PI / 2 + (Math.random() - 0.5);

        targetX = head.x + Math.cos(wanderAngleRef.current) * 150;
        targetY = head.y + Math.sin(wanderAngleRef.current) * 150;
      }

      // Compute head angle steering
      const head = headPosRef.current;
      const dx = targetX - head.x;
      const dy = targetY - head.y;
      const distToTarget = Math.hypot(dx, dy);
      const desiredAngle = Math.atan2(dy, dx);

      // Smooth angle interpolation
      let angleDiff = desiredAngle - headAngleRef.current;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;

      const turnSpeed = config.followCursor && hasMouseRef.current ? 7.5 : 4.0;
      headAngleRef.current += angleDiff * Math.min(1, turnSpeed * dt);

      // Add snake sinuous lateral slither wave
      const slitherFreq = isSprintingRef.current ? 12 : 6.5;
      const slitherAmp = isSprintingRef.current ? 0.35 : 0.22;
      const undulation = Math.sin(time * 0.005 * slitherFreq) * slitherAmp;
      const moveAngle = headAngleRef.current + undulation;

      // Advance head
      const stepDist = Math.min(distToTarget * 0.15 + 1.5, baseSpeed * dt);
      if (distToTarget > 15 || !config.followCursor || !hasMouseRef.current) {
        head.x += Math.cos(moveAngle) * stepDist;
        head.y += Math.sin(moveAngle) * stepDist;
      }

      // Keep within viewport boundaries
      head.x = Math.max(20, Math.min(width - 20, head.x));
      head.y = Math.max(20, Math.min(height - 20, head.y));

      // 2. Inverse Kinematics for body segments
      const segments = segmentsRef.current;
      const segmentDistance = 11;

      if (segments.length > 0) {
        segments[0].x = head.x;
        segments[0].y = head.y;
        segments[0].angle = headAngleRef.current;

        for (let i = 1; i < segments.length; i++) {
          const prev = segments[i - 1];
          const curr = segments[i];

          const segDx = prev.x - curr.x;
          const segDy = prev.y - curr.y;
          const segAngle = Math.atan2(segDy, segDx);

          curr.angle = segAngle;
          curr.x = prev.x - Math.cos(segAngle) * segmentDistance;
          curr.y = prev.y - Math.sin(segAngle) * segmentDistance;
        }
      }

      // 3. Orbs & Food Particles
      if (config.showFoodOrbs) {
        for (let i = 0; i < orbsRef.current.length; i++) {
          const orb = orbsRef.current[i];
          orb.x += orb.vx;
          orb.y += orb.vy;

          if (orb.x < 50 || orb.x > width - 50) orb.vx *= -1;
          if (orb.y < 50 || orb.y > height - 50) orb.vy *= -1;

          // Check if snake head swallows orb
          const orbDist = Math.hypot(head.x - orb.x, head.y - orb.y);
          if (orbDist < 30) {
            // Burst particles
            for (let p = 0; p < 14; p++) {
              const pAngle = Math.random() * Math.PI * 2;
              const pSpeed = Math.random() * 4 + 1.5;
              particlesRef.current.push({
                x: orb.x,
                y: orb.y,
                vx: Math.cos(pAngle) * pSpeed,
                vy: Math.sin(pAngle) * pSpeed,
                life: 0,
                maxLife: 0.6 + Math.random() * 0.4,
                color: orb.color,
                size: Math.random() * 3.5 + 1.5,
              });
            }

            // Respawn orb elsewhere
            orb.x = Math.random() * (width - 200) + 100;
            orb.y = Math.random() * (height - 200) + 100;
            scoreRef.current += 1;
            setOrbScore(scoreRef.current);
          }

          // Draw Glowing Orb
          ctx.save();
          ctx.shadowColor = orb.color;
          ctx.shadowBlur = 14;
          ctx.beginPath();
          ctx.arc(orb.x, orb.y, orb.radius + Math.sin(time * 0.005 + i) * 1.5, 0, Math.PI * 2);
          ctx.fillStyle = orb.color;
          ctx.fill();

          // Core bright center
          ctx.beginPath();
          ctx.arc(orb.x, orb.y, orb.radius * 0.45, 0, Math.PI * 2);
          ctx.fillStyle = "#ffffff";
          ctx.fill();
          ctx.restore();
        }
      }

      // 4. Update & Draw Sparkle Particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.life += dt;
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.94;
        p.vy *= 0.94;

        if (p.life >= p.maxLife) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        const alpha = 1 - p.life / p.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 5. Draw Snake Body (from tail to neck)
      if (segments.length > 2) {
        // A. Subtle soft shadow / floor glow under snake
        ctx.save();
        ctx.shadowColor = palette.glow;
        ctx.shadowBlur = 20;
        ctx.strokeStyle = "rgba(0, 0, 0, 0.45)";
        ctx.lineWidth = 14;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(segments[segments.length - 1].x, segments[segments.length - 1].y);
        for (let i = segments.length - 2; i >= 0; i--) {
          ctx.lineTo(segments[i].x, segments[i].y);
        }
        ctx.stroke();
        ctx.restore();

        // B. Body Segments with tapered luxury scale ribs
        const total = segments.length;
        for (let i = total - 1; i >= 1; i--) {
          const seg = segments[i];
          const t = i / total; // 0 at head, 1 at tail

          // Thickness profile: widest at neck/chest, tapering down to tail
          let radius = 15;
          if (t < 0.15) {
            radius = 12 + t * 24; // neck flare
          } else if (t < 0.6) {
            radius = 15.5 - (t - 0.15) * 5; // muscular chest
          } else {
            radius = 13.25 * (1 - (t - 0.6) / 0.4) + 2.5; // tail taper
          }

          ctx.save();
          ctx.translate(seg.x, seg.y);
          ctx.rotate(seg.angle);

          // Body ellipse
          const grad = ctx.createLinearGradient(0, -radius, 0, radius);
          grad.addColorStop(0, palette.headHighlight);
          grad.addColorStop(0.3, palette.body1);
          grad.addColorStop(0.7, palette.body2);
          grad.addColorStop(1, palette.belly);

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.ellipse(0, 0, radius * 1.05, radius * 0.9, 0, 0, Math.PI * 2);
          ctx.fill();

          // Scale border
          ctx.strokeStyle = palette.scales;
          ctx.lineWidth = 1.2;
          ctx.stroke();

          // Spinal iridescent ridge line
          if (i % 2 === 0 && radius > 6) {
            ctx.fillStyle = palette.ridge;
            ctx.beginPath();
            ctx.ellipse(0, 0, radius * 0.28, radius * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.restore();
        }

        // 6. Draw Detailed Viper Head
        ctx.save();
        ctx.translate(head.x, head.y);
        ctx.rotate(headAngleRef.current);

        // Tongue flicking animation
        tongueTimerRef.current += dt;
        const tongueCycle = tongueTimerRef.current % 3.2;
        if (tongueCycle < 0.45) {
          const tongueExt = Math.sin((tongueCycle / 0.45) * Math.PI) * 22;
          ctx.save();
          ctx.strokeStyle = "#e11d48";
          ctx.fillStyle = "#e11d48";
          ctx.lineWidth = 2.2;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(18, 0);
          ctx.lineTo(18 + tongueExt, 0);
          // Bifurcated tips
          ctx.lineTo(18 + tongueExt + 6, -4);
          ctx.moveTo(18 + tongueExt, 0);
          ctx.lineTo(18 + tongueExt + 6, 4);
          ctx.stroke();
          ctx.restore();
        }

        // Head Outer Shell (Aerodynamic Viper Silhouette)
        const headGrad = ctx.createRadialGradient(2, 0, 3, 4, 0, 22);
        headGrad.addColorStop(0, palette.headHighlight);
        headGrad.addColorStop(0.4, palette.head);
        headGrad.addColorStop(1, "#030712");

        ctx.fillStyle = headGrad;
        ctx.beginPath();
        // Snout
        ctx.moveTo(22, 0);
        // Right jaw flare
        ctx.bezierCurveTo(18, 9, 8, 16, -6, 15);
        ctx.bezierCurveTo(-14, 14, -18, 8, -16, 0);
        // Left jaw flare
        ctx.bezierCurveTo(-18, -8, -14, -14, -6, -15);
        ctx.bezierCurveTo(8, -16, 18, -9, 22, 0);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = palette.scales;
        ctx.lineWidth = 1.6;
        ctx.stroke();

        // Front nostrils
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.beginPath();
        ctx.arc(17, -3, 1.2, 0, Math.PI * 2);
        ctx.arc(17, 3, 1.2, 0, Math.PI * 2);
        ctx.fill();

        // Viper Crown / Scale armor plates
        ctx.fillStyle = palette.headHighlight;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.moveTo(12, 0);
        ctx.lineTo(4, 5);
        ctx.lineTo(-4, 0);
        ctx.lineTo(4, -5);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1.0;

        // ==============================================================
        // 7. GLOWING RED SNAKE EYES (Crimson Ruby Glow with Slit Pupils)
        // ==============================================================
        const eyeIntensity = config.eyeGlowIntensity || 1.0;
        const eyeGlowRadius = 14 * eyeIntensity;
        const eyeOffsetX = 6;
        const eyeOffsetY = 9.5;

        // Render both left and right red eyes
        [-1, 1].forEach((side) => {
          const eyeY = eyeOffsetY * side;

          ctx.save();
          // Multi-layer glowing crimson aura
          ctx.shadowColor = "#ff003c";
          ctx.shadowBlur = eyeGlowRadius;

          // Ruby eye socket background
          ctx.fillStyle = "#4c0519";
          ctx.beginPath();
          ctx.ellipse(eyeOffsetX, eyeY, 5.2, 3.4, (side * Math.PI) / 10, 0, Math.PI * 2);
          ctx.fill();

          // Searing Neon Red Iris
          const eyeIrisGrad = ctx.createRadialGradient(
            eyeOffsetX,
            eyeY,
            0.5,
            eyeOffsetX,
            eyeY,
            4
          );
          eyeIrisGrad.addColorStop(0, "#ff2a55");
          eyeIrisGrad.addColorStop(0.65, "#dc2626");
          eyeIrisGrad.addColorStop(1, "#7f1d1d");

          ctx.fillStyle = eyeIrisGrad;
          ctx.beginPath();
          ctx.ellipse(eyeOffsetX, eyeY, 4.4, 2.7, (side * Math.PI) / 10, 0, Math.PI * 2);
          ctx.fill();

          // Piercing Vertical Slit Pupil (tracks forward with slight dilation)
          ctx.fillStyle = "#090103";
          ctx.beginPath();
          ctx.ellipse(
            eyeOffsetX + 0.5,
            eyeY,
            1.2,
            isSprintingRef.current ? 2.5 : 2.2,
            0,
            0,
            Math.PI * 2
          );
          ctx.fill();

          // Specular high-gloss glassy reflection dot
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(eyeOffsetX - 1.2, eyeY - 1, 0.8, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        });

        ctx.restore(); // end head transform
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [config, getThemePalette, spawnOrbs]);

  return (
    <>
      {/* Interactive Snake Canvas Layer */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-10 w-full h-full"
        style={{ mixBlendMode: "screen" }}
        aria-hidden="true"
      />

      {/* Floating Snake Quick Status & Controls Pill */}
      <aside
        aria-label="Viper Status and Controls"
        className="fixed bottom-3 right-3 z-40 flex items-center gap-2 rounded-full border border-red-500/30 bg-slate-900/90 py-1.5 pl-3 pr-2 text-white shadow-2xl shadow-red-950/50 backdrop-blur-md transition-all select-none hover:scale-105 sm:bottom-6 sm:right-6 sm:gap-3 sm:py-2 sm:pl-4 sm:pr-3"
      >
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Animated Glowing Red Snake Eye Icon */}
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600 shadow-[0_0_12px_#ff003c]"></span>
          </span>
          <div className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wide sm:gap-1.5 sm:text-xs">
            <span className="text-[9px] font-bold uppercase tracking-wider text-red-400 sm:text-[11px]">
              Viper Online
            </span>
            <span className="hidden text-slate-400 sm:inline">•</span>
            <span className="hidden text-[11px] text-slate-300 sm:inline">
              {config.followCursor ? "Tracking Mouse" : "Ambient Patrol"}
            </span>
          </div>
        </div>

        {config.showFoodOrbs && (
          <div className="flex items-center gap-1 rounded-full border border-red-500/20 bg-red-950/60 px-1.5 py-0.5 font-mono text-[9px] font-bold text-amber-300 sm:px-2 sm:text-[10px]">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>{orbScore} Orbs</span>
          </div>
        )}

        {onOpenControls && (
          <button
            onClick={onOpenControls}
            type="button"
            className="flex cursor-pointer items-center gap-1 rounded-full bg-red-600 px-2 py-1 text-[11px] font-semibold text-white shadow-md transition-all hover:bg-red-500 active:scale-95 sm:px-2.5"
            title="Open Snake Viper Studio Controls (Slide Animation)"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Viper Settings</span>
          </button>
        )}
      </aside>
    </>
  );
}
