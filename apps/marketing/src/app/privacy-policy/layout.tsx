import type { Metadata } from "next";

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://aivolearning.com";

  export const metadata: Metadata = {
    title: "Privacy Policy - How AIVO Protects Your Data",
    description: "Read AIVO Learning's privacy policy. Learn how we protect children's data with COPPA and FERPA compliance.",
    openGraph: {
      title: "Privacy Policy - How AIVO Protects Your Data",
      description: "Read AIVO Learning's privacy policy. Learn how we protect children's data with COPPA and FERPA compliance.",
      url: `${SITE_URL}/privacy-policy`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Privacy Policy - How AIVO Protects Your Data",
      description: "Read AIVO Learning's privacy policy. Learn how we protect children's data with COPPA and FERPA compliance.",
    },
    alternates: {
      canonical: `${SITE_URL}/privacy-policy`,
    },
  };

  export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
  }
  