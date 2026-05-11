# Hero video sourcing + asset-prep guide (E.1)

When you want to ship a moving hero background beyond the AmbientSphere
SVG, this is the cookbook. Stays env-gated via
`NEXT_PUBLIC_COMPASS_HERO_VIDEO_URL` so the default build is unchanged
until you opt in.

## 1. Pick a source

Project plan 7.5.2.a suggests royalty-free Pexels searches that align
with the Cinematic Privacy aesthetic without literalizing Maria's
context (which would feel manipulative):

- **abstract data flow particles** — closest match to the AmbientSphere
  vocabulary; safest aesthetic choice
- **rain on glass window** — atmospheric, no identity, dignified
- **Hong Kong skyline at dawn** — environmental shot, no human subjects

Avoid: footage of any vulnerable person, any real worker, any documentary
b-roll that could read as exploitative. Per the persona-imagery rule
(plan 7.5.1.c) the home page hero should NEVER show identifiable people.

Direct URL: <https://www.pexels.com/search/videos/abstract-data-flow/>

## 2. Trim + encode

Aim for a seamless 8–12s loop, ≤ 2 MB per clip. Project plan 7.5.2.c
specifies H.264 + HEVC + AV1 fallback for cross-browser coverage; for
demo scope, H.264 alone is acceptable.

```bash
# 1. Download Pexels MP4 (web export, 1080p)
# 2. Trim to loopable region (start, length 10s)
ffmpeg -ss 00:00:02 -i input.mp4 -t 10 \
  -c:v libx264 -preset slower -crf 26 \
  -movflags +faststart \
  -an \
  -vf "scale=1920:-2,fps=30" \
  hero-h264.mp4

# 3. (Optional) Generate HLS playlist for adaptive bitrate
ffmpeg -i hero-h264.mp4 \
  -codec: copy \
  -start_number 0 -hls_time 2 -hls_list_size 0 \
  -f hls hero.m3u8
```

Verify the file is under 2 MB:

```bash
ls -lh hero-h264.mp4
```

## 3. Host

Three honest options, in order of complexity:

**a. Vercel static (simplest).** Put the file at
`app/public/videos/hero-h264.mp4`. Reference as `/videos/hero-h264.mp4`
in the env var. No external account. Vercel's CDN serves the bytes.
Suitable for files ≤ 2 MB and demo-day traffic. Not adaptive bitrate.

**b. Mux Stream (project-plan canonical).** Sign up at <https://mux.com>.
Upload the MP4; Mux generates an HLS playlist URL. Pricing: free for
first $20 of traffic, then ~$0.005/min streamed. Use the `.m3u8`
playback URL in the env var.

**c. Cloudflare Stream.** Sign up at <https://www.cloudflare.com/products/cloudflare-stream/>.
Upload, get HLS playlist. $5/month base + $1 per 1k minutes streamed.

For hackathon scope option (a) is recommended unless you have a
sponsorship credit or already-paid Mux/Cloudflare account.

## 4. Wire the env var

In Vercel project settings → Environment Variables, add:

```
NEXT_PUBLIC_COMPASS_HERO_VIDEO_URL=/videos/hero-h264.mp4
# Optional poster image to render before the first frame loads:
NEXT_PUBLIC_COMPASS_HERO_VIDEO_POSTER=/videos/hero-poster.jpg
```

For local dev, add the same lines to `app/.env`. Redeploy. The home page
home-hero switches from AmbientSphere to VideoBackground on the next
page load.

## 5. LCP check after activation

Per project risk register R16, Lighthouse mobile must not drop below 85
with the hero video loaded. Run after deploy:

```bash
npx lighthouse https://app-psi-pied.vercel.app --view --preset=mobile
```

If LCP regresses past the 85 floor:
1. First fallback: re-encode with `-crf 30` (smaller file) and re-test
2. Second fallback: switch hosting to Mux Stream HLS (adaptive bitrate
   loads lower-res chunks on slow connections, fixing LCP)
3. Third fallback: unset the env var. AmbientSphere is back automatically.

The component renders null on env-unset, so the rollback is instant.

## 6. Cross-browser HLS coverage (v1.5)

Safari decodes `.m3u8` natively; Chrome and Firefox do not. v1 of this
component ships without hls.js, so:

- Safari users: see HLS adaptive bitrate
- Chrome/Firefox users: silently fail to play the HLS playlist

To fix in v1.5 install hls.js and attach it client-side:

```bash
cd app && npm install hls.js
```

Then in `app/src/components/primitives/VideoBackground.tsx` add a
`useEffect` that checks `video.canPlayType("application/vnd.apple.mpegurl")`
and falls back to hls.js when missing. MP4 path is unaffected.

For v1 demo, host MP4 directly (option a above) — works across all
browsers, simpler.
