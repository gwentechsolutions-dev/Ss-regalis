"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export default function Intro() {
  const [phase, setPhase] = useState<"off" | "loading" | "playing" | "leaving">(
    "off",
  );
  const root = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const skip = useRef<HTMLButtonElement>(null);
  const dismissed = useRef(false);
  const finish = useCallback(() => {
    dismissed.current = true;
    delete document.documentElement.dataset.introPending;
    video.current?.pause();
    try {
      localStorage.setItem("regalis-intro", "seen");
    } catch {}
    setPhase("off");
  }, []);
  useEffect(() => {
    if (document.documentElement.dataset.introExpired) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    try {
      if (localStorage.getItem("regalis-intro") === "seen") {
        delete document.documentElement.dataset.introPending;
        return;
      }
    } catch {}
    if (motion.matches) {
      delete document.documentElement.dataset.introPending;
      return;
    }
    setPhase("loading");
    const change = () => {
      if (motion.matches) finish();
    };
    motion.addEventListener("change", change);
    return () => motion.removeEventListener("change", change);
  }, [finish]);
  const active = phase !== "off";
  useEffect(() => {
    if (!active) return;
    // The mounted opaque intro now replaces the pre-hydration cover.
    delete document.documentElement.dataset.introPending;
    const old = document.body.style.overflow;
    const focus = document.activeElement as HTMLElement;
    document.body.style.overflow = "hidden";
    const targets = Array.from(
      document.querySelectorAll<HTMLElement>("header, footer, main > *"),
    ).filter((e) => e !== root.current && !e.contains(root.current));
    const states = targets.map((e) => e.inert);
    targets.forEach((e) => {
      e.inert = true;
    });
    skip.current?.focus({ preventScroll: true });
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
      if (e.key === "Tab") {
        e.preventDefault();
        skip.current?.focus();
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = old;
      targets.forEach((e, i) => {
        e.inert = states[i];
      });
      document.removeEventListener("keydown", key);
      if (focus?.isConnected) focus.focus({ preventScroll: true });
    };
  }, [active, finish]);
  useEffect(() => {
    if (!active) return;
    const media = video.current;
    if (!media) {
      finish();
      return;
    }
    let watchdog: ReturnType<typeof setTimeout>;
    const arm = () => {
      clearTimeout(watchdog);
      watchdog = setTimeout(finish, 5000);
    };
    const progress = () => {
      if (!media.paused) arm();
    };
    arm();
    media.addEventListener("timeupdate", progress);
    media.play().catch(finish);
    const hidden = () => {
      if (document.hidden) finish();
    };
    document.addEventListener("visibilitychange", hidden);
    return () => {
      clearTimeout(watchdog);
      media.pause();
      media.removeEventListener("timeupdate", progress);
      document.removeEventListener("visibilitychange", hidden);
    };
  }, [active, finish]);
  useEffect(() => {
    if (phase !== "leaving") return;
    const timer = setTimeout(finish, 600);
    return () => clearTimeout(timer);
  }, [phase, finish]);
  if (!active) return null;
  return (
    <div
      ref={root}
      className={`temple-intro intro-${phase}`}
      role="dialog"
      aria-modal="true"
      aria-label="SS Regalis temple entrance introduction"
    >
      <video
        ref={video}
        className="temple-video"
        src="/videos/temple-entrance.mp4"
        autoPlay
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
        aria-hidden="true"
        onPlaying={() => {
          if (!dismissed.current) setPhase("playing");
        }}
        onEnded={() => {
          if (!dismissed.current) setPhase("leaving");
        }}
        onError={finish}
      />
      <div className="temple-intro-footer">
        <span>
          {phase === "loading"
            ? "A moment before a new beginning…"
            : "From heritage to new beginnings."}
        </span>
        <button ref={skip} onClick={finish}>
          Skip Intro <span aria-hidden="true">↗</span>
        </button>
      </div>
    </div>
  );
}
