import type { Metadata } from "next";

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://aivolearning.com";

  export const metadata: Metadata = {
    title: "Careers at AIVO - Join Our Education Technology Team",
    description: "Join AIVO Learning and help build the future of personalized education. See open positions in engineering, education, and design.",
    openGraph: {
      title: "Careers at AIVO - Join Our Education Technology Team",
      description: "Join AIVO Learning and help build the future of personalized education. See open positions in engineering, education, and design.",
      url: `${SITE_URL}/careers`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Careers at AIVO - Join Our Education Technology Team",
      description: "Join AIVO Learning and help build the future of personalized education. See open positions in engineering, education, and design.",
    },
    alternates: {
      canonical: `${SITE_URL}/careers`,
    },
  };

  export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
  }
  