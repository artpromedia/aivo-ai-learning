import type { NextConfig } from "next";

const webAppUrl = process.env.NEXT_PUBLIC_WEB_APP_URL || "https://app.aivolearning.com";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  allowedDevOrigins: [
    "*.replit.dev",
    "*.replit.app",
    "*.janeway.replit.dev",
    "*.riker.replit.dev",
  ],
  async redirects() {
    return [
      {
        source: "/login",
        destination: `${webAppUrl}/login`,
        permanent: false,
      },
      {
        source: "/signup",
        destination: `${webAppUrl}/signup`,
        permanent: false,
        has: [{ type: "query" as const, key: "plan" }],
      },
      {
        source: "/signup",
        destination: `${webAppUrl}/signup`,
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
