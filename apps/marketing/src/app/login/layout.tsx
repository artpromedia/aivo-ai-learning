import type { Metadata } from "next";

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://aivolearning.com";

  export const metadata: Metadata = {
    title: "Sign In to AIVO Learning",
    description: "Log in to your AIVO Learning account to access personalized AI tutoring, progress dashboards, and learning tools.",
    openGraph: {
      title: "Sign In to AIVO Learning",
      description: "Log in to your AIVO Learning account to access personalized AI tutoring, progress dashboards, and learning tools.",
      url: `${SITE_URL}/login`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Sign In to AIVO Learning",
      description: "Log in to your AIVO Learning account to access personalized AI tutoring, progress dashboards, and learning tools.",
    },
    alternates: {
      canonical: `${SITE_URL}/login`,
    },
  };

  export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
  }
  