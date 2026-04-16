import type { Metadata } from "next";

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://aivolearning.com";

  export const metadata: Metadata = {
    title: "AIVO Blog - Education Technology Insights & Updates",
    description: "Stay up to date with the latest in AI-powered education, adaptive learning research, and tips for parents and educators.",
    openGraph: {
      title: "AIVO Blog - Education Technology Insights & Updates",
      description: "Stay up to date with the latest in AI-powered education, adaptive learning research, and tips for parents and educators.",
      url: `${SITE_URL}/blog`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "AIVO Blog - Education Technology Insights & Updates",
      description: "Stay up to date with the latest in AI-powered education, adaptive learning research, and tips for parents and educators.",
    },
    alternates: {
      canonical: `${SITE_URL}/blog`,
    },
  };

  export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
  }
  