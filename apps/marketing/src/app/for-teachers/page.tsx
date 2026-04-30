import type { Metadata } from "next";
import { AudiencePage, audienceMetadata } from "@/components/marketing/AudiencePage";
import { AUDIENCES } from "@/lib/landing-content";

const audience = AUDIENCES.find((a) => a.slug === "for-teachers")!;

export const metadata: Metadata = audienceMetadata(audience);

export default function Page() {
  return <AudiencePage audience={audience} />;
}
