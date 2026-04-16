import type { Metadata } from "next";

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://aivolearning.com";

  export const metadata: Metadata = {
    title: "Start Your Free Trial - AIVO Learning",
    description: "Create a free AIVO Learning account. Get AI-powered adaptive tutoring for your child with 14 specialized tutors. No credit card required.",
    openGraph: {
      title: "Start Your Free Trial - AIVO Learning",
      description: "Create a free AIVO Learning account. Get AI-powered adaptive tutoring for your child with 14 specialized tutors. No credit card required.",
      url: `${SITE_URL}/signup`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Start Your Free Trial - AIVO Learning",
      description: "Create a free AIVO Learning account. Get AI-powered adaptive tutoring for your child with 14 specialized tutors. No credit card required.",
    },
    alternates: {
      canonical: `${SITE_URL}/signup`,
    },
  };

  export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
  }
  