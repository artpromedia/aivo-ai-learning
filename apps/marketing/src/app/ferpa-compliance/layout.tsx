import type { Metadata } from "next";

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://aivolearning.com";

  export const metadata: Metadata = {
    title: "FERPA Compliance - Student Education Records Protection",
    description: "Understand AIVO Learning's FERPA compliance for protecting student education records in schools and districts.",
    openGraph: {
      title: "FERPA Compliance - Student Education Records Protection",
      description: "Understand AIVO Learning's FERPA compliance for protecting student education records in schools and districts.",
      url: `${SITE_URL}/ferpa-compliance`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "FERPA Compliance - Student Education Records Protection",
      description: "Understand AIVO Learning's FERPA compliance for protecting student education records in schools and districts.",
    },
    alternates: {
      canonical: `${SITE_URL}/ferpa-compliance`,
    },
  };

  export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
  }
  