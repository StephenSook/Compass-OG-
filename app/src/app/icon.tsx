import { ImageResponse } from "next/og";

export const size = { width: 192, height: 192 };
export const contentType = "image/png";

// Dynamic favicon. Black square with a white "C" mark in Instrument-Serif-
// inspired letterform (using system serif fallback inside Satori — see
// the OG card template for why custom font fetch is deferred to OG only).
export default function Icon() {
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
          fontSize: 140,
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
