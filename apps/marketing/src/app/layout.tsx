import type { Metadata } from "next";
import { Fredoka, Nunito } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { I18nProvider } from "@/providers/i18n-provider";
import enMessages from "@/i18n/messages/en.json";

const fredoka = Fredoka({
  subsets: ["latin"],
  variable: "--font-fredoka",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://aivolearning.com";
const GA_ID = process.env.NEXT_PUBLIC_GA4_ID || "";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "AIVO - AI-Powered Adaptive Learning for Every Child",
    template: "%s | AIVO Learning",
  },
  description:
    "AIVO uses AI to personalize education for every child. 14 expert AI tutors, 5 functioning levels, Brain Clone technology. COPPA & FERPA compliant. Start free today.",
  icons: { icon: "/images/favicon-192.png" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "AIVO Learning",
    title: "AIVO - AI-Powered Adaptive Learning for Every Child",
    description:
      "Personalized AI tutoring that meets every child where they are. 14 specialized tutors, adaptive Brain Clone technology, COPPA compliant.",
    images: [
      {
        url: `${SITE_URL}/images/og-banner.png`,
        width: 1200,
        height: 630,
        alt: "AIVO Learning - AI-Powered Adaptive Learning",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AIVO - AI-Powered Adaptive Learning for Every Child",
    description:
      "Personalized AI tutoring that meets every child where they are. 14 specialized tutors, adaptive Brain Clone technology.",
    images: [`${SITE_URL}/images/og-banner.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: SITE_URL,
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "AIVO Learning",
  url: SITE_URL,
  logo: `${SITE_URL}/images/aivo-logo-purple.png`,
  description:
    "AI-Powered Adaptive Learning platform for every child, featuring 14 specialized AI tutors and Brain Clone technology.",
  sameAs: [],
  contactPoint: {
    "@type": "ContactPoint",
    email: "hello@aivo.education",
    contactType: "customer support",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fredoka.variable} ${nunito.variable}`} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body className="font-body antialiased bg-white text-slate-800">
        <I18nProvider initialMessages={enMessages}>
          {children}
        </I18nProvider>
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}',{send_page_view:true});`}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
