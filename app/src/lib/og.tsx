import { ImageResponse } from "next/og";

// Shared template for dynamic OG (Open Graph) images. Each route's
// opengraph-image.tsx imports this + supplies its own copy. The output
// is a 1200×630 PNG that X / LinkedIn / Slack / Discord unfurl as the
// hero card when someone shares a link.
//
// Why this matters: every link shared on social media is a free hero ad.
// Without per-route OG images every share uses the default title text
// only — no visual hook. With them, every share carries the route's
// punchline rendered on the canonical black background.
//
// Font choice: Satori (the engine behind ImageResponse) does not support
// CSS @font-face; we'd need to fetch the TTF bytes and pass them in.
// For hackathon scope we use Satori's built-in serif fallback for the
// italic accent — sub-optimal vs the on-page Instrument Serif, but
// shippable in minutes vs hours of font-loading plumbing. The OG image's
// job is layout + words; brand polish is on-page.

export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = "image/png" as const;

type OgProps = {
  eyebrow: string;
  title: string;
  accent?: string;
  subtitle?: string;
  footer?: string;
};

export function renderOg({
  eyebrow,
  title,
  accent,
  subtitle,
  footer,
}: OgProps): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#000",
          color: "#fff",
          padding: "72px 96px",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 30% 20%, rgba(80,100,140,0.25), transparent 50%), radial-gradient(circle at 80% 80%, rgba(100,80,140,0.18), transparent 55%)",
            opacity: 0.7,
            display: "flex",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            zIndex: 1,
          }}
        >
          <div
            style={{
              fontSize: 18,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              fontFamily: "monospace",
              color: "rgba(255,255,255,0.5)",
            }}
          >
            {eyebrow}
          </div>
          <div
            style={{
              fontSize: 32,
              fontFamily: "serif",
              fontStyle: "italic",
              letterSpacing: "-0.02em",
              color: "rgba(255,255,255,0.85)",
            }}
          >
            Compass
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            justifyContent: "center",
            zIndex: 1,
          }}
        >
          <div
            style={{
              fontSize: 76,
              fontWeight: 500,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              maxWidth: 980,
              display: "flex",
              flexWrap: "wrap",
            }}
          >
            <span>{title}</span>
            {accent ? (
              <span
                style={{
                  fontFamily: "serif",
                  fontStyle: "italic",
                  fontWeight: 400,
                  marginLeft: 16,
                }}
              >
                {accent}
              </span>
            ) : null}
          </div>

          {subtitle ? (
            <div
              style={{
                marginTop: 36,
                fontSize: 26,
                lineHeight: 1.4,
                color: "rgba(255,255,255,0.65)",
                maxWidth: 960,
                display: "flex",
              }}
            >
              {subtitle}
            </div>
          ) : null}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            zIndex: 1,
            fontSize: 18,
            fontFamily: "monospace",
            color: "rgba(255,255,255,0.4)",
            letterSpacing: "0.15em",
          }}
        >
          <div style={{ display: "flex" }}>app-psi-pied.vercel.app</div>
          {footer ? (
            <div style={{ display: "flex" }}>{footer}</div>
          ) : (
            <div style={{ display: "flex" }}>0G APAC Hackathon · Track 5</div>
          )}
        </div>
      </div>
    ),
    { ...OG_SIZE },
  );
}
