import type { Metadata } from "next";

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://aivolearning.com";

  export const metadata: Metadata = {
    title: "AIVO Press Kit - Media Resources & Brand Assets",
    description: "Download AIVO Learning press materials, logos, brand guidelines, and media resources for news coverage.",
    openGraph: {
      title: "AIVO Press Kit - Media Resources & Brand Assets",
      description: "Download AIVO Learning press materials, logos, brand guidelines, and media resources for news coverage.",
      url: `${SITE_URL}/press-kit`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "AIVO Press Kit - Media Resources & Brand Assets",
      description: "Download AIVO Learning press materials, logos, brand guidelines, and media resources for news coverage.",
    },
    alternates: {
      canonical: `${SITE_URL}/press-kit`,
    },
  };

  export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
  }
  