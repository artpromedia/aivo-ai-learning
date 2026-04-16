import type { Metadata } from "next";

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://aivolearning.com";

  export const metadata: Metadata = {
    title: "Accessibility Statement - AIVO Learning for All Abilities",
    description: "AIVO Learning is committed to digital accessibility. Learn about our WCAG compliance and accessibility features for all learners.",
    openGraph: {
      title: "Accessibility Statement - AIVO Learning for All Abilities",
      description: "AIVO Learning is committed to digital accessibility. Learn about our WCAG compliance and accessibility features for all learners.",
      url: `${SITE_URL}/accessibility`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Accessibility Statement - AIVO Learning for All Abilities",
      description: "AIVO Learning is committed to digital accessibility. Learn about our WCAG compliance and accessibility features for all learners.",
    },
    alternates: {
      canonical: `${SITE_URL}/accessibility`,
    },
  };

  export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
  }
  