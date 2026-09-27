import { ImageResponse } from "next/og";

// PNG app icons for installation (Android and desktop need 192px and 512px PNGs).
export async function GET(_req: Request, ctx: { params: Promise<{ size: string }> }) {
  const { size: raw } = await ctx.params;
  const size = raw.startsWith("512") ? 512 : 192;
  const maskable = raw.includes("maskable");
  const pad = maskable ? size * 0.12 : 0;
  return new ImageResponse(
    (
      <div style={{ width: size, height: size, display: "flex", background: maskable ? "#2f5bea" : "transparent" }}>
        <div
          style={{
            margin: pad,
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#2f5bea",
            borderRadius: maskable ? 0 : size * 0.22,
            color: "white",
            fontSize: size * 0.56,
            fontWeight: 800,
            fontFamily: "sans-serif",
          }}
        >
          P
        </div>
      </div>
    ),
    { width: size, height: size, headers: { "cache-control": "public, max-age=604800, immutable" } },
  );
}
