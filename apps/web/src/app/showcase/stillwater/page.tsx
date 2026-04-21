import { DirectionShowcase } from "@/components/showcase/DirectionShowcase";
import { STILLWATER } from "@/components/showcase/tokens";

export const metadata = { title: "AIVO — Stillwater Showcase" };

export default function StillwaterPage() {
  return <DirectionShowcase t={STILLWATER} />;
}
