# Landing background assets — "The Gap"

`components/LandingHero.tsx` looks for two files here:

| File            | What it is                                                            |
| --------------- | --------------------------------------------------------------------- |
| `gap-loop.mp4`  | A **boomerang**: forward then reversed, so it plays forward→backward→forward forever. The duplicate frames at each turnaround are dropped (no blink), then slowed 1.4x + interpolated to 48fps. The browser loops it natively → seamless ping-pong. |
| `gap-poster.jpg`| _Optional._ First-frame still — `<video>` poster + reduced-motion fallback. Use the generated **start_frame** image. If absent, the CSS ribbons show until the clip loads. |

Until these exist, `LandingHero` renders an on-brand CSS "Gap" ribbon animation, so
the page is never broken.

## Regenerating from a new clip
The looping/quality lives in the file, not in code (seek-based reverse in JS is janky —
don't do that). We bake a **boomerang** so the motion runs back and forth. The key detail
is dropping the duplicated frame at each turnaround, else you get a visible blink. `N` =
source frame count (`ffmpeg -i clip.mp4 -map 0:v:0 -c copy -f null -` prints it); use
`N-2` below.

```sh
# N=192 here → keep reversed frames 1..190 (drop the two duplicate endpoints).
# Slow 1.4x + interpolate to 48fps → ~22s seamless ping-pong:
ffmpeg -y -i clip.mp4 -filter_complex "\
[0:v]format=yuv420p[fwd];\
[0:v]reverse,select='between(n\,1\,190)',setpts=PTS-STARTPTS,format=yuv420p[rev];\
[fwd][rev]concat=n=2:v=1[bm];\
[bm]setpts=1.4*PTS,minterpolate=fps=48:mi_mode=blend[v]" \
-map "[v]" -an -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -movflags +faststart gap-loop.mp4
```

Tuning: bump `setpts` (e.g. `1.8*PTS`) for slower/longer; lower `crf` / raise `fps` for
higher quality (bigger file). For even slower playback without re-encoding, drop
`PLAYBACK_SPEED` (`< 1`) in `components/LandingHero.tsx`.
