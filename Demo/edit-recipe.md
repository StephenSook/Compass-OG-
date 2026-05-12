# Compass — F.1 demo edit recipe

The 3-minute video at <https://www.youtube.com/watch?v=vg5WZHmlzZI> was edited from a single-take screen recording via ffmpeg, no NLE (iMovie/Resolve) involved. This file documents the pipeline so the next edit (v0.6 or a re-cut) is reproducible.

## Source

- Path: `~/Downloads/Demo Compass.mp4` (excluded from git)
- Specs out of QuickTime: 1920×1080 @ 16fps, H.264 Constrained Baseline, AAC mono 16 kHz, 173.3s, single take with live voiceover
- Recorder: Microsoft Teams meeting (left visible: webcam selfie cam + "Stephen Sookra" name tag; removed via blackbox: macOS menu bar + Teams attendee label + Chrome "Ask Gemini" extension pill)

## Pipeline (7 stages)

All paths assume `WORK="$HOME/Desktop/Compass/Compass-OG-/Demo/build"` and `HANDS="$HOME/Desktop/Compass/Compass-OG-/Demo/assets/persona/hands-sink.png"`.

### Stage 1 — cleanup (trim silences, blackbox unwanted UI)

```bash
ffmpeg -y -ss 5.4 -i "$WORK/00-source.mp4" -t 161.9 \
  -vf "drawbox=x=0:y=0:w=1920:h=40:color=black@1:t=fill,\
       drawbox=x=1450:y=45:w=210:h=50:color=black@1:t=fill,\
       drawbox=x=0:y=1050:w=200:h=30:color=black@1:t=fill" \
  -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -profile:v high -level 4.0 \
  -c:a aac -b:a 192k -ar 48000 -ac 2 \
  -movflags +faststart \
  "$WORK/01-cleaned.mp4"
```

What this does:

- `-ss 5.4 -t 161.9` — trims 5.4s lead-in silence + 6s trailing silence → 161.9s of voice content
- Three `drawbox` filters cover, in order: macOS menu bar (top strip), Chrome "Ask Gemini" pill (small box, leaves selfie cam visible), Teams attendee label (bottom-left)
- Re-encode H.264 High profile @ CRF 18 (visually lossless)
- AAC upsampled 16 kHz mono → 48 kHz stereo
- Faststart moov atom for immediate playback

### Stage 2 — Beat 2 hands-sink Ken Burns

```bash
ffmpeg -y -loop 1 -i "$HANDS" -t 13.4 \
  -vf "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,\
       zoompan=z='min(zoom+0.000374,1.08)':\
       x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':\
       d=214:s=1920x1080:fps=16,format=yuv420p" \
  -an -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -profile:v high -level 4.0 \
  "$WORK/02-beat2-video.mp4"
```

13.4-second slow Ken Burns push-in from 1.00 to 1.08 zoom (subtle, cinematic). The 2048×2048 source `hands-sink.png` is centered-cropped to 16:9 then zoomed. Increment per frame = (1.08 − 1.00) / 214 = 0.000374. Frame target = 13.4s × 16 fps = 214.

### Stage 3 — composite Beat 2 into cleaned video

```bash
ffmpeg -y -i "$WORK/01-cleaned.mp4" -i "$WORK/02-beat2-video.mp4" \
  -filter_complex "[0:v]trim=0:11.6,setpts=PTS-STARTPTS[vA];\
                   [1:v]trim=0:13.4,setpts=PTS-STARTPTS[vB];\
                   [0:v]trim=25:161.875,setpts=PTS-STARTPTS[vC];\
                   [vA][vB][vC]concat=n=3:v=1:a=0[outv]" \
  -map "[outv]" -map "0:a" \
  -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -profile:v high \
  -c:a copy \
  "$WORK/03-composed.mp4"
```

Video: cleaned[0:11.6] + beat2(13.4s) + cleaned[25:161.875] = 161.875s. Audio: cleaned[0:161.875] passthrough (the user's harm narration plays over the hands-sink visual at 11.6 → 25s).

### Stage 4 — Beat 6 title card

ffmpeg lacks `drawtext` in this Homebrew build, so render the title card as a PNG via PIL first:

```python
from PIL import Image, ImageDraw, ImageFont
img = Image.new('RGB', (1920, 1080), (0, 0, 0))
draw = ImageDraw.Draw(img)
font_main = ImageFont.truetype('/System/Library/Fonts/Supplemental/Andale Mono.ttf', 38)
font_punch = ImageFont.truetype('/System/Library/Fonts/Supplemental/Andale Mono.ttf', 42)
line1, line2 = '15M migrant workers across APAC.', 'We start with Maria.'
b1 = draw.textbbox((0,0), line1, font=font_main); w1, h1 = b1[2]-b1[0], b1[3]-b1[1]
b2 = draw.textbbox((0,0), line2, font=font_punch); w2, h2 = b2[2]-b2[0], b2[3]-b2[1]
y1 = 680; y2 = y1 + h1 + 30
draw.text(((1920-w1)//2, y1), line1, fill=(128,128,128), font=font_main)
draw.text(((1920-w2)//2, y2), line2, fill=(200,200,200), font=font_punch)
img.save('beat6-card.png', 'PNG', optimize=True)
```

Then loop for 10s with silent audio:

```bash
ffmpeg -y -loop 1 -i "$WORK/beat6-card.png" \
  -f lavfi -i anullsrc=channel_layout=stereo:sample_rate=48000 \
  -t 10 -r 16 -vf "format=yuv420p" \
  -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -profile:v high -level 4.0 \
  -c:a aac -b:a 192k -ar 48000 -ac 2 \
  "$WORK/04-beat6.mp4"
```

### Stage 5 — concat composed + Beat 6

```bash
ffmpeg -y -i "$WORK/03-composed.mp4" -i "$WORK/04-beat6.mp4" \
  -filter_complex "[0:v][0:a][1:v][1:a]concat=n=2:v=1:a=1[outv][outa]" \
  -map "[outv]" -map "[outa]" \
  -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -profile:v high -level 4.0 \
  -c:a aac -b:a 192k -ar 48000 -ac 2 \
  "$WORK/05-master.mp4"
```

Total = 161.875s + 10s = 171.875s = 2:52, under the 3:00 HackQuest cap.

### Stage 6 — audio loudnorm to YouTube spec

```bash
ffmpeg -y -i "$WORK/05-master.mp4" \
  -af "loudnorm=I=-14:LRA=11:TP=-1.5:print_format=summary" \
  -c:v copy \
  -c:a aac -b:a 192k -ar 48000 -ac 2 \
  -movflags +faststart \
  "$HOME/Desktop/Compass/Compass-OG-/Demo/compass-demo-final.mp4"
```

Input integrated loudness was -20.58 LUFS (quiet); output target -14 LUFS / -1.5 dBTP matches YouTube delivery spec.

### Stage 7 — upload

YouTube Studio → Upload → set Visibility = Unlisted → copy the URL into:

- `README.md` hero "Watch the demo" block
- `Demo/x-post-final.md` primary + short variants (replace `[DEMO_VIDEO_URL]`)
- `docs/distribution/dorahacks-listing.md` + `docs/distribution/devpost-listing.md`
- Vercel prod env `NEXT_PUBLIC_COMPASS_DEMO_VIDEO_URL` (activates the sticky `<DemoCta>` primitive site-wide)
- `CHANGELOG.md` new wave entry

## Why this approach over an NLE

- **Reproducible** — every edit is a versioned shell command, not a click-trail
- **No interactive software** — runs entirely from terminal; can be triggered in CI for a future v2 demo recut
- **Visually lossless** — CRF 18 H.264 + AAC 192 kbps is broadcast quality
- **Loudness compliant** — `loudnorm` filter targets YouTube's -14 LUFS dynamic spec exactly

## When to re-record

If the v0.6 push changes the `/onboard` UX significantly (e.g., the 3-step → 5-step migration, the wallet pill redesign, or the receipt-mint affordance), re-record the source video. Re-run this pipeline with updated Stage 3 trim points (the `11.6` and `25` boundaries) to fit the new pacing.
