import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Apple-touch-icon — required for iOS Safari Add-to-Home-Screen. Same
// black-with-italic-C mark as the standard icon, sized for iOS specifically.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#000",
          color: "#fff",
          fontSize: 130,
          fontFamily: "serif",
          fontStyle: "italic",
          letterSpacing: "-0.04em",
        }}
      >
        C
      </div>
    ),
    { ...size },
  );
}
