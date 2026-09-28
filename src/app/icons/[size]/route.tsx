import { ImageResponse } from "next/og";

// The brand mark as SVG (same drawing as src/components/Logo.tsx and public/icon.svg).
const MARK = (rounded: boolean) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3b55e6"/><stop offset="0.55" stop-color="#6a4ef0"/><stop offset="1" stop-color="#8b4fe6"/></linearGradient></defs><rect width="512" height="512" rx="${rounded ? 118 : 0}" fill="url(#g)"/><g transform="${rounded ? "" : "translate(51 51) scale(0.8)"}"><path d="M92 176c58-26 116-24 158 8v206c-42-30-100-34-158-8z" fill="#fff"/><path d="M262 184c42-32 100-34 158-8v206c-58-26-116-22-158 8z" fill="#fff" fill-opacity="0.78"/><path d="M140 330l74-62 50 36 104-100" fill="none" stroke="#fbbf24" stroke-width="34" stroke-linecap="round" stroke-linejoin="round"/><path d="M318 196h66v66" fill="none" stroke="#fbbf24" stroke-width="34" stroke-linecap="round" stroke-linejoin="round"/></g></svg>`;

// PNG app icons for installation (Android and desktop need 192px and 512px PNGs; "maskable" fills the whole square).
export async function GET(_req: Request, ctx: { params: Promise<{ size: string }> }) {
  const { size: raw } = await ctx.params;
  const size = raw.startsWith("512") ? 512 : 192;
  const maskable = raw.includes("maskable");
  const src = `data:image/svg+xml;base64,${Buffer.from(MARK(!maskable)).toString("base64")}`;
  return new ImageResponse(
    (
      <div style={{ width: size, height: size, display: "flex" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} width={size} height={size} alt="" />
      </div>
    ),
    { width: size, height: size, headers: { "cache-control": "public, max-age=86400" } },
  );
}
