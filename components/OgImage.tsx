import { ImageResponse } from "next/og";

export const alt = "CronExplain – cron expression explainer & generator";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function renderOgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "linear-gradient(135deg, #1e1b4b 0%, #4f46e5 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 40, opacity: 0.85 }}>CronExplain</div>
        <div style={{ fontSize: 72, fontWeight: 700, marginTop: 16, lineHeight: 1.1 }}>Cron expression explainer & generator</div>
        <div
          style={{
            display: "flex",
            marginTop: 48,
            fontSize: 56,
            fontFamily: "monospace",
            background: "rgba(255,255,255,0.12)",
            borderRadius: 16,
            padding: "16px 32px",
            alignSelf: "flex-start",
          }}
        >
          */15 9-17 * * 1-5
        </div>
        <div style={{ fontSize: 30, marginTop: 40, opacity: 0.85 }}>crontab · Quartz · AWS · GitHub Actions · Kubernetes · Spring</div>
      </div>
    ),
    size,
  );
}
