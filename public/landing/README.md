# Landing background assets — "The Gap"

`components/LandingHero.tsx` looks for two files here:

| File            | What it is                                                            |
| --------------- | --------------------------------------------------------------------- |
| `gap-loop.mp4`  | Your **forward-only** clip (the Veo3 / AI Studio output). No need to bake a reverse — `LandingHero` boomerangs it in code (play forward, then ease back, forever). |
| `gap-poster.jpg`| _Optional._ First-frame still — used as the `<video>` poster + reduced-motion fallback. Use the generated **start_frame** image. If absent, the CSS ribbons show until the clip loads. |

Until these exist, `LandingHero` renders an on-brand CSS "Gap" ribbon animation, so
the page is never broken.

## Drop-in
1. Name your clip **`gap-loop.mp4`** and put it in this folder. That's it — the page
   plays it forward then in reverse on a loop.
2. (Optional) Export `gap-poster.jpg` from the start frame and drop it here too.
3. Keep the clip lean (short, muted, no audio track).

Pacing/loop are controlled in code by `PLAYBACK_SPEED` in `components/LandingHero.tsx`
(`<1` = slower / more cinematic; it also paces the reverse leg). No ffmpeg required.
