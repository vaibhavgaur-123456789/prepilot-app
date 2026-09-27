import { ImageResponse } from "next/og";
import { BRAND } from "@/config/brand";

// Share image for WhatsApp, Google, Facebook, X, etc.
export const alt = `${BRAND.name}: study planner, timer and attendance`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, color: "white", background: "linear-gradient(135deg, #3b55e6 0%, #6a4ef0 55%, #8b4fe6 100%)", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 84, height: 84, borderRadius: 22, background: "white", color: "#3b55e6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 56, fontWeight: 800 }}>P</div>
          <div style={{ fontSize: 52, fontWeight: 800 }}>{BRAND.name}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.1 }}>Plan. Study. Track. Improve.</div>
          <div style={{ fontSize: 32, opacity: 0.92 }}>Daily plan · Focus timer · Attendance · Alarms · Revision · Mock tests</div>
        </div>
        <div style={{ display: "flex", gap: 16, fontSize: 28 }}>
          {["SSC", "Railway", "Banking", "Boards", "Your own syllabus"].map((x) => (
            <div key={x} style={{ padding: "8px 20px", borderRadius: 999, background: "rgba(255,255,255,0.18)" }}>{x}</div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
