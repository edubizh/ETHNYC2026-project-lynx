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

// The clip is a pre-baked boomerang (forward + reversed, slowed + interpolated to 48fps —
// see public/landing/README.md), so the browser just loops it natively: always forward,
// no seeking, seamless loop point (it ends on its own first frame). Until it exists the
// CSS "Gap" ribbons below stand in, so the page never looks broken.
const VIDEO_SRC = "/landing/gap-loop.mp4";
const POSTER_SRC = "/landing/gap-poster.jpg";

// Extra pacing on top of the baked slowdown. 1 = as baked; <1 = even slower (still smooth
// on forward playback). Tune to taste.
const PLAYBACK_SPEED = 1;

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

  // Render the clip even under reduced-motion (shown as a still); motion is gated below.
  const showVideo = !videoFailed;

  // The file is a pre-baked boomerang looped natively (see VIDEO_SRC note). This effect
  // only ensures it actually starts: force muted (React's `muted` attr isn't reliably
  // reflected to the DOM property, so play() can be treated as a blocked unmuted autoplay)
  // and kick playback, with a first-interaction retry as a fallback.
  useEffect(() => {
    if (videoFailed) return;
    const v = videoRef.current;
    if (!v) return;

    v.muted = true;
    v.defaultMuted = true;
    v.playsInline = true;

    // Reduced-motion: hold the first frame as a still, no playback.
    if (reduced) {
      try {
        v.pause();
        v.currentTime = 0;
      } catch {}
      return;
    }

    v.playbackRate = PLAYBACK_SPEED;
    const play = () => v.play().catch(() => {});

    // Some browsers still block muted autoplay until the first interaction — retry then.
    window.addEventListener("pointerdown", play, { once: true });
    if (v.readyState >= 2) play();
    else v.addEventListener("loadeddata", play, { once: true });

    return () => {
      window.removeEventListener("pointerdown", play);
      v.removeEventListener("loadeddata", play);
    };
  }, [reduced, videoFailed]);

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
          loop
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
            "radial-gradient(ellipse 52% 46% at 50% 54%, rgba(10,11,15,0.5) 0%, rgba(10,11,15,0.16) 52%, transparent 78%), linear-gradient(180deg, rgba(10,11,15,0.42) 0%, transparent 16%, transparent 80%, rgba(10,11,15,0.55) 100%)",
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
                textShadow: "0 2px 30px rgba(0,0,0,0.55)",
              }}
            >
              Index funds for
              <br />
              prediction markets
            </h1>

            <p style={{ margin: "22px auto 0", maxWidth: 540, fontSize: 16, lineHeight: 1.55, color: "#c2c8d2", textShadow: "0 1px 18px rgba(0,0,0,0.55)" }}>
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
