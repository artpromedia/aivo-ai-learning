import Link from "next/link";

export const metadata = { title: "AIVO — Three Design Directions" };

const DIRECTIONS = [
  { slug: "stillwater", name: "Stillwater", tagline: "calm · minimal · focus-first", color: "#5B7CFF", bg: "#F8FAFD", text: "#2E3A4F" },
  { slug: "lumen", name: "Lumen", tagline: "warm · narrative · companion", color: "#E76F51", bg: "#FBF1E5", text: "#2A1810" },
  { slug: "quest", name: "Quest", tagline: "playful · gamified · momentum", color: "#FBBF24", bg: "#1A1B3A", text: "#FFFFFF" },
];

export default function ShowcaseIndexPage() {
  return (
    <main style={{ minHeight: "100vh", padding: 48, background: "#fafafa", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 32, marginBottom: 8 }}>AIVO — Three Design Directions</h1>
      <p style={{ color: "#666", marginBottom: 32 }}>Click any direction to explore the live, interactive showcase.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, maxWidth: 1200 }}>
        {DIRECTIONS.map((d) => (
          <Link
            key={d.slug}
            href={`/showcase/${d.slug}`}
            style={{
              display: "block",
              background: d.bg,
              color: d.text,
              padding: 32,
              borderRadius: 16,
              textDecoration: "none",
              borderTop: `6px solid ${d.color}`,
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>{d.name}</div>
            <div style={{ opacity: 0.75 }}>{d.tagline}</div>
          </Link>
        ))}
      </div>
    </main>
  );
}
