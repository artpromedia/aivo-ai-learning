import type { Metadata } from "next";

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://aivolearning.com";

  export const metadata: Metadata = {
    title: "COPPA Compliance - Children's Online Privacy Protection",
    description: "Learn how AIVO Learning complies with COPPA regulations to protect children's online privacy and data security.",
    openGraph: {
      title: "COPPA Compliance - Children's Online Privacy Protection",
      description: "Learn how AIVO Learning complies with COPPA regulations to protect children's online privacy and data security.",
      url: `${SITE_URL}/coppa-compliance`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "COPPA Compliance - Children's Online Privacy Protection",
      description: "Learn how AIVO Learning complies with COPPA regulations to protect children's online privacy and data security.",
    },
    alternates: {
      canonical: `${SITE_URL}/coppa-compliance`,
    },
  };

  export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
  }
  