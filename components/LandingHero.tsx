"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LandingNav } from "@/components/LandingNav";

const DISPLAY = "'Inter Tight', system-ui, sans-serif";
const BODY = "'IBM Plex Sans', system-ui, sans-serif";
const MONO = "'IBM Plex Mono', monospace";

// Two-voice palette (DESIGN.md): amber = real assets, azure = belief markets.
const AMBER = "#E0A33C";
const AZURE = "#5B8DEF";
const CTA = "linear-gradient(180deg,#F4F6F8,#C4C9D1)";

// Drop your forward-only clip + (optional) poster here (see public/landing/README.md).
// Until they exist the CSS "Gap" ribbons below stand in, so the page never looks broken.
const VIDEO_SRC = "/landing/gap-loop.mp4";
const POSTER_SRC = "/landing/gap-poster.jpg";

// Background-video pacing. <1 plays slower / more cinematic; the same factor paces the
// reverse leg so the boomerang is symmetric. Tune to taste.
const PLAYBACK_SPEED = 0.6;

export function LandingHero() {
  const [reduced, setReduced] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const showVideo = !reduced && !videoFailed;

  // In-code boomerang: play forward, then ease back in reverse, forever. Lets a plain
  // forward clip ping-pong ("run it back") with no ffmpeg/baked-reverse step. Native
  // negative playbackRate isn't reliable across browsers, so the reverse leg steps
  // currentTime by real elapsed time (frame-rate independent, paced by PLAYBACK_SPEED).
  useEffect(() => {
    if (!showVideo) return;
    const v = videoRef.current;
    if (!v) return;

    // React doesn't reliably reflect the `muted` *attribute* to the DOM property, so a
    // programmatic play() can be treated as an unmuted autoplay and blocked. Force it.
    v.muted = true;
    v.defaultMuted = true;
    v.playsInline = true;
    v.playbackRate = PLAYBACK_SPEED;
    let raf = 0;
    let last = 0;
    let reversing = false;

    const stepBack = (ts: number) => {
      if (last === 0) last = ts;
      const dt = (ts - last) / 1000;
      last = ts;
      const next = v.currentTime - dt * PLAYBACK_SPEED;
      if (next <= 0) {
        v.currentTime = 0;
        reversing = false;
        v.play().catch(() => {});
        return;
      }
      v.currentTime = next;
      raf = requestAnimationFrame(stepBack);
    };

    const onEnded = () => {
      // Forward leg finished — reverse back to the start, then forward again.
      reversing = true;
      last = 0;
      raf = requestAnimationFrame(stepBack);
    };

    const start = () => {
      if (!reversing) v.play().catch(() => {});
    };

    v.addEventListener("ended", onEnded);
    if (v.readyState >= 2) start();
    else v.addEventListener("loadeddata", start, { once: true });

    return () => {
      v.removeEventListener("ended", onEnded);
      v.removeEventListener("loadeddata", start);
      cancelAnimationFrame(raf);
    };
  }, [showVideo]);

  return (
    <section
      style={{
        position: "relative",
        minHeight: "100dvh",
        overflow: "hidden",
        background: "#0a0b0f",
        color: "#fff",
        fontFamily: BODY,
      }}
    >
      {/* ── Background: faint terminal grid, faded toward the edges ── */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          backgroundImage:
            "linear-gradient(rgba(42,46,58,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(42,46,58,0.35) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse 80% 70% at 50% 50%, #000 28%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 70% at 50% 50%, #000 28%, transparent 100%)",
          opacity: 0.5,
        }}
      />

      {/* ── Background: CSS "Gap" ribbons — fallback before the video exists + reduced-motion still ── */}
      <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 0, overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            left: "-12%",
            right: "-12%",
            top: "26%",
            height: 170,
            background: `radial-gradient(ellipse 58% 100% at 50% 50%, ${AMBER}, transparent 72%)`,
            opacity: 0.22,
            filter: "blur(46px)",
            animation: reduced ? undefined : "gapBreatheTop 17s ease-in-out infinite alternate",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "-12%",
            right: "-12%",
            bottom: "26%",
            height: 170,
            background: `radial-gradient(ellipse 58% 100% at 50% 50%, ${AZURE}, transparent 72%)`,
            opacity: 0.2,
            filter: "blur(46px)",
            animation: reduced ? undefined : "gapBreatheBottom 17s ease-in-out infinite alternate",
          }}
        />
      </div>

      {/* ── Background: generated video (covers the ribbons once dropped in) ── */}
      {showVideo && (
        <video
          ref={videoRef}
          muted
          playsInline
          preload="auto"
          poster={POSTER_SRC}
          onError={() => setVideoFailed(true)}
          style={{ position: "absolute", inset: 0, zIndex: 1, width: "100%", height: "100%", objectFit: "cover" }}
        >
          <source src={VIDEO_SRC} type="video/mp4" />
        </video>
      )}

      {/* ── Scrim: holds a calm, legible pocket for the button + edge vignette ── */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          background:
            "radial-gradient(ellipse 46% 42% at 50% 52%, rgba(10,11,15,0.72) 0%, rgba(10,11,15,0.34) 46%, transparent 76%), linear-gradient(180deg, rgba(10,11,15,0.55) 0%, transparent 22%, transparent 70%, rgba(10,11,15,0.72) 100%)",
        }}
      />

      {/* ── Foreground ── */}
      <div style={{ position: "relative", zIndex: 3, display: "flex", flexDirection: "column", minHeight: "100dvh" }}>
        <LandingNav />

        <div style={{ flex: 1, display: "grid", placeItems: "center", padding: 24 }}>
          <div
            style={{
              textAlign: "center",
              maxWidth: 720,
              animation: reduced ? undefined : "landingRise .7s cubic-bezier(.2,.7,.3,1) both",
            }}
          >
            {/* two-voice signal — echoes the animation's meaning (not an uppercase eyebrow kicker) */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 14,
                fontFamily: MONO,
                fontSize: 11.5,
                color: "#9aa3b2",
                marginBottom: 22,
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: AZURE }}>●</span> belief
              </span>
              <span style={{ color: "#3a3f4a" }}>/</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: AMBER }}>◆</span> assets
              </span>
            </div>

            <h1
              style={{
                margin: 0,
                fontFamily: DISPLAY,
                fontWeight: 700,
                letterSpacing: "-0.03em",
                lineHeight: 1.02,
                fontSize: "clamp(40px, 7vw, 76px)",
                color: "#fff",
              }}
            >
              Index funds for
              <br />
              prediction markets
            </h1>

            <p style={{ margin: "22px auto 0", maxWidth: 540, fontSize: 16, lineHeight: 1.55, color: "#aab1bc" }}>
              Belief markets, crossed with the real assets of the same narrative — bought in one signature, into your own
              wallet.
            </p>

            <div style={{ marginTop: 34, display: "flex", justifyContent: "center" }}>
              <Link
                href="/browse"
                className="launch-btn"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  height: 52,
                  padding: "0 30px",
                  background: CTA,
                  color: "#0A0B0E",
                  borderRadius: 10,
                  textDecoration: "none",
                  fontFamily: DISPLAY,
                  fontWeight: 700,
                  fontSize: 16,
                  letterSpacing: "-0.01em",
                }}
              >
                Launch App
                <span style={{ fontSize: 15 }}>→</span>
              </Link>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "0 0 26px",
            fontFamily: MONO,
            fontSize: 11,
            color: "#5C636D",
          }}
        >
          Non-custodial · positions land in your wallet
        </div>
      </div>
    </section>
  );
}
