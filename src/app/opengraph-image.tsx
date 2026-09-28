import { ImageResponse } from "next/og";
import { BRAND } from "@/config/brand";

// Share image for WhatsApp, Google, Facebook, X, etc.
export const alt = `${BRAND.name}: study planner, timer and attendance`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Brand mark on a white tile so it stands out on the gradient background.
const MARK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="118" fill="#fff"/><path d="M92 176c58-26 116-24 158 8v206c-42-30-100-34-158-8z" fill="#3b55e6"/><path d="M262 184c42-32 100-34 158-8v206c-58-26-116-22-158 8z" fill="#6a4ef0"/><path d="M140 330l74-62 50 36 104-100" fill="none" stroke="#f59e0b" stroke-width="34" stroke-linecap="round" stroke-linejoin="round"/><path d="M318 196h66v66" fill="none" stroke="#f59e0b" stroke-width="34" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, color: "white", background: "linear-gradient(135deg, #3b55e6 0%, #6a4ef0 55%, #8b4fe6 100%)", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`data:image/svg+xml;base64,${Buffer.from(MARK).toString("base64")}`} width={96} height={96} alt="" style={{ borderRadius: 24, boxShadow: "0 8px 24px rgba(0,0,0,0.25)" }} />
          <div style={{ fontSize: 52, fontWeight: 800 }}>{BRAND.name}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.1 }}>Plan. Study. Track. Improve.</div>
          <div style={{ fontSize: 32, opacity: 0.92 }}>Daily plan · Focus timer · Paper timer · Attendance · Alarms · Shayari</div>
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
