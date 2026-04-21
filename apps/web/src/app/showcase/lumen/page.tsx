import { DirectionShowcase } from "@/components/showcase/DirectionShowcase";
import { LUMEN } from "@/components/showcase/tokens";

export const metadata = { title: "AIVO — Lumen Showcase" };

export default function LumenPage() {
  return <DirectionShowcase t={LUMEN} />;
}
