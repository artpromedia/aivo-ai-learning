import { DirectionShowcase } from "@/components/showcase/DirectionShowcase";
import { QUEST } from "@/components/showcase/tokens";

export const metadata = { title: "AIVO — Quest Showcase" };

export default function QuestPage() {
  return <DirectionShowcase t={QUEST} />;
}
