import { ImageResponse } from "next/og";

export const alt = "Flight School Finder – Find Pilot Training Schools Across the USA";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Default social card: paper canvas, sectional rings, site name. */
export default function OpenGraphImage() {
  const rings = [110, 210, 310, 410];
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#fafaf8",
          color: "#0e1424",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <svg
          width="900"
          height="900"
          viewBox="0 0 900 900"
          style={{ position: "absolute", right: -260, top: -140, opacity: 0.16 }}
        >
          {rings.map((r, i) => (
            <circle
              key={r}
              cx="450"
              cy="450"
              r={r}
              fill="none"
              stroke="#e0246e"
              strokeWidth="2"
              strokeDasharray={i % 2 === 0 ? "3 14" : "18 12"}
            />
          ))}
          <circle cx="450" cy="450" r="22" fill="none" stroke="#e0246e" strokeWidth="4" />
        </svg>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "72px 80px",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
              <g stroke="#e0246e" strokeWidth="2.75" strokeLinecap="round">
                <circle cx="16" cy="16" r="7" />
                <line x1="16" y1="1.5" x2="16" y2="6" />
                <line x1="16" y1="26" x2="16" y2="30.5" />
                <line x1="1.5" y1="16" x2="6" y2="16" />
                <line x1="26" y1="16" x2="30.5" y2="16" />
              </g>
            </svg>
            <span style={{ fontSize: 30, fontWeight: 700, letterSpacing: -0.5 }}>
              Flight School Finder
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 820 }}>
            <span
              style={{
                fontSize: 76,
                fontWeight: 800,
                lineHeight: 1,
                letterSpacing: -2.5,
              }}
            >
              Find pilot training schools across the USA
            </span>
            <span
              style={{
                fontSize: 24,
                color: "#5b6478",
                fontFamily: "ui-monospace, Menlo, monospace",
                letterSpacing: 1,
              }}
            >
              SEARCH BY AIRPORT · CITY · STATE · SCHOOL
            </span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
