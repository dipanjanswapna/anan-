import { ImageResponse } from "next/og";

export const alt = "ANAN — Everyday shopping, made delightful";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{
      width: "100%", height: "100%", display: "flex", flexDirection: "column",
      justifyContent: "space-between", padding: "76px",
      background: "linear-gradient(135deg, #f3edff 0%, #ffffff 55%, #e9dcff 100%)",
      color: "#281743", fontFamily: "Arial, sans-serif",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <div style={{
          width: 66, height: 66, borderRadius: 18, background: "#7540c8",
          color: "white", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 46, fontWeight: 800,
        }}>a</div>
        <div style={{ fontSize: 48, fontWeight: 800, letterSpacing: -3 }}>anan.</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ fontSize: 62, lineHeight: 1.08, fontWeight: 800, letterSpacing: -2 }}>
          Everyday shopping,<br />made delightful.
        </div>
        <div style={{ fontSize: 28, color: "#705d8c" }}>Discover thoughtful finds from Bangladesh.</div>
      </div>
      <div style={{ display: "flex", fontSize: 22, color: "#7540c8", fontWeight: 700 }}>
        Fashion · Electronics · Beauty · Home &amp; more
      </div>
    </div>,
    { ...size },
  );
}
