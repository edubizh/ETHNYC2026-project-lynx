# Landing background assets — "The Gap"

`components/LandingHero.tsx` looks for two files here:

| File            | What it is                                                            |
| --------------- | --------------------------------------------------------------------- |
| `gap-loop.mp4`  | A **pre-baked boomerang**: forward + reversed, slowed, interpolated to 48fps. The browser loops it natively — always playing *forward* (no seeking → no buffering), and because a boomerang ends on its own first frame the loop point is invisible. |
| `gap-poster.jpg`| _Optional._ First-frame still — `<video>` poster + reduced-motion fallback. Use the generated **start_frame** image. If absent, the CSS ribbons show until the clip loads. |

Until these exist, `LandingHero` renders an on-brand CSS "Gap" ribbon animation, so
the page is never broken.

## Regenerating from a new forward-only clip
The looping/quality lives in the file, not in code (seek-based reverse in JS is janky and
buffery — don't go back to that). To rebuild from a fresh AI Studio export `clip.mp4`:

```sh
# slow ~1.4x, interpolate to 48fps for smooth slow-motion, bake forward+reverse,
# web-optimized (faststart), no audio:
ffmpeg -y -i clip.mp4 \
  -filter_complex "[0:v]reverse[r];[0:v][r]concat=n=2:v=1[bm];[bm]setpts=1.4*PTS,minterpolate=fps=48:mi_mode=blend[v]" \
  -map "[v]" -an -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -movflags +faststart gap-loop.mp4
```

Tuning: bump `setpts` (e.g. `1.7*PTS`) for slower/longer; raise `fps`/lower `crf` for
smoother/higher quality (bigger file). For even slower playback without re-encoding, drop
`PLAYBACK_SPEED` (`< 1`) in `components/LandingHero.tsx`.
