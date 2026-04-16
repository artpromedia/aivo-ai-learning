import type { Metadata } from "next";

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://aivolearning.com";

  export const metadata: Metadata = {
    title: "Contact AIVO - Get in Touch or Request a Demo",
    description: "Contact the AIVO team for questions, support, or to schedule a personalized demo for your school or district.",
    openGraph: {
      title: "Contact AIVO - Get in Touch or Request a Demo",
      description: "Contact the AIVO team for questions, support, or to schedule a personalized demo for your school or district.",
      url: `${SITE_URL}/contact`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Contact AIVO - Get in Touch or Request a Demo",
      description: "Contact the AIVO team for questions, support, or to schedule a personalized demo for your school or district.",
    },
    alternates: {
      canonical: `${SITE_URL}/contact`,
    },
  };

  export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
  }
  