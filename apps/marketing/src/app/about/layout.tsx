import type { Metadata } from "next";

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://aivolearning.com";

  export const metadata: Metadata = {
    title: "About AIVO - Our Mission to Transform Education",
    description: "Learn about AIVO Learning's mission to provide AI-powered adaptive education for every child. Meet our team and discover our core values.",
    openGraph: {
      title: "About AIVO - Our Mission to Transform Education",
      description: "Learn about AIVO Learning's mission to provide AI-powered adaptive education for every child. Meet our team and discover our core values.",
      url: `${SITE_URL}/about`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "About AIVO - Our Mission to Transform Education",
      description: "Learn about AIVO Learning's mission to provide AI-powered adaptive education for every child. Meet our team and discover our core values.",
    },
    alternates: {
      canonical: `${SITE_URL}/about`,
    },
  };

  export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
  }
  