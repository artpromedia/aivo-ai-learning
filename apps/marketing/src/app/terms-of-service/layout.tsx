import type { Metadata } from "next";

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://aivolearning.com";

  export const metadata: Metadata = {
    title: "Terms of Service - AIVO Learning Platform Agreement",
    description: "Review the terms and conditions for using the AIVO Learning platform, including service agreements and usage policies.",
    openGraph: {
      title: "Terms of Service - AIVO Learning Platform Agreement",
      description: "Review the terms and conditions for using the AIVO Learning platform, including service agreements and usage policies.",
      url: `${SITE_URL}/terms-of-service`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Terms of Service - AIVO Learning Platform Agreement",
      description: "Review the terms and conditions for using the AIVO Learning platform, including service agreements and usage policies.",
    },
    alternates: {
      canonical: `${SITE_URL}/terms-of-service`,
    },
  };

  export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
  }
  