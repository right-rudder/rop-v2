import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/**
 * Home-screen icon: the radar mark (components/ui/Logo.tsx) on the night
 * canvas. Generated so there's no binary to keep in sync with the SVG.
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
        <svg width="136" height="136" viewBox="0 0 32 32" fill="none">
          <g stroke="#ff4d8d" strokeLinecap="round">
            <circle cx="16" cy="16" r="14.5" strokeWidth="1.5" opacity="0.9" />
            <circle cx="16" cy="16" r="10" strokeWidth="1.25" strokeDasharray="1.5 3" opacity="0.55" />
            <path d="M16 16 L16 1.5 A14.5 14.5 0 0 1 28.6 8.8 Z" fill="#ff4d8d" stroke="none" opacity="0.22" />
            <line x1="16" y1="16" x2="28.6" y2="8.8" strokeWidth="1.5" opacity="0.9" />
            <circle cx="23.5" cy="20.5" r="1.9" fill="#ff4d8d" stroke="none" />
            <g strokeWidth="2.4">
              <circle cx="16" cy="16" r="4.2" />
              <line x1="16" y1="8.5" x2="16" y2="10.6" />
              <line x1="16" y1="21.4" x2="16" y2="23.5" />
              <line x1="8.5" y1="16" x2="10.6" y2="16" />
              <line x1="21.4" y1="16" x2="23.5" y2="16" />
            </g>
          </g>
        </svg>
      </div>
    ),
    size,
  );
}
