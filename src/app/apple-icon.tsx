import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/**
 * Home-screen icon: the sectional-chart airport glyph from icon.svg on the
 * night canvas. Generated so there's no binary to keep in sync with the SVG.
 */
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
          background: "#0e1424",
        }}
      >
        <svg width="132" height="132" viewBox="0 0 32 32" fill="none">
          <g stroke="#ff4d8d" strokeWidth="2.75" strokeLinecap="round">
            <circle cx="16" cy="16" r="6.5" />
            <line x1="16" y1="3" x2="16" y2="7" />
            <line x1="16" y1="25" x2="16" y2="29" />
            <line x1="3" y1="16" x2="7" y2="16" />
            <line x1="25" y1="16" x2="29" y2="16" />
          </g>
        </svg>
      </div>
    ),
    size,
  );
}
