# Landing background assets — "The Gap"

`components/LandingHero.tsx` looks for two files here:

| File            | What it is                                                            |
| --------------- | --------------------------------------------------------------------- |
| `gap-loop.mp4`  | A **forward-only seamless loop**: the clip's last ~1.2s is crossfaded back into its first ~1.2s, then slowed 2x + interpolated to 48fps. It **never reverses** (so there's no visible "bounce"/blink at the turnaround) — the browser just loops it natively. |
| `gap-poster.jpg`| _Optional._ First-frame still — `<video>` poster + reduced-motion fallback. Use the generated **start_frame** image. If absent, the CSS ribbons show until the clip loads. |

Until these exist, `LandingHero` renders an on-brand CSS "Gap" ribbon animation, so
the page is never broken.

## Regenerating from a new clip
The looping/quality lives in the file, not in code. We use a **crossfade loop** (dissolve
the end into the start) rather than a boomerang — a boomerang reverses direction at each
turnaround, which is visible on directional motion. To rebuild from a fresh export
`clip.mp4` (here D = source duration in seconds, X = crossfade length):

```sh
# D=8, X=1.2 → seamless loop of (D-X)=6.8s, then slowed 2x to ~13.6s @48fps:
ffmpeg -y -i clip.mp4 -filter_complex "\
[0:v]trim=0:1.2,setpts=PTS-STARTPTS[head];\
[0:v]trim=6.8:8,setpts=PTS-STARTPTS[wrap];\
[0:v]trim=1.2:6.8,setpts=PTS-STARTPTS,format=yuv420p[body];\
[head]format=yuva420p,fade=t=in:st=0:d=1.2:alpha=1[hf];\
[wrap]format=yuva420p,fade=t=out:st=0:d=1.2:alpha=1[wf];\
[wf][hf]overlay=format=auto,format=yuv420p[xf];\
[xf][body]concat=n=2:v=1[cat];\
[cat]setpts=2.0*PTS,minterpolate=fps=48:mi_mode=blend[v]" \
-map "[v]" -an -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -movflags +faststart gap-loop.mp4
```

Tuning: longer crossfade `X` = softer/less-noticeable transition (but shorter loop body);
bump `setpts` for slower/longer; lower `crf` / raise `fps` for higher quality (bigger file).
For even slower playback without re-encoding, drop `PLAYBACK_SPEED` (`< 1`) in
`components/LandingHero.tsx`.
