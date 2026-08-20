"use client";

/**
 * Last-resort boundary: replaces the root layout when it fails, so it must
 * render its own <html>/<body> and can't rely on globals.css.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#f8fafc",
          color: "#0f172a",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>
            Something went wrong
          </h1>
          <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>
            Flight School Finder hit an unexpected error.
            {error.digest ? ` Reference: ${error.digest}` : ""}
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              background: "#1d4ed8",
              color: "#fff",
              border: 0,
              borderRadius: "0.5rem",
              padding: "0.75rem 1.5rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
