import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: [
    "*.replit.dev",
    "*.replit.app",
    "*.janeway.replit.dev",
  ],
  async rewrites() {
    return [
      { source: "/api/admin/:path*", destination: "http://localhost:3001/api/admin/:path*" },
      { source: "/api/auth/:path*", destination: "http://localhost:3001/api/auth/:path*" },
      { source: "/api/users/:path*", destination: "http://localhost:3001/api/users/:path*" },
      { source: "/api/consent/:path*", destination: "http://localhost:3001/api/consent/:path*" },
      { source: "/api/curriculum/:path*", destination: "http://localhost:3001/api/curriculum/:path*" },
      { source: "/api/assessments/:path*", destination: "http://localhost:3003/api/assessments/:path*" },
      { source: "/api/iep/:path*", destination: "http://localhost:3003/api/iep/:path*" },
      { source: "/api/brain/:path*", destination: "http://localhost:3002/api/brain/:path*" },
      { source: "/api/ai/:path*", destination: "http://localhost:3004/api/ai/:path*" },
      { source: "/api/learning/:path*", destination: "http://localhost:3005/api/learning/:path*" },
      { source: "/api/tutors/:path*", destination: "http://localhost:3006/api/tutors/:path*" },
      { source: "/api/tutor/:path*", destination: "http://localhost:3006/api/tutor/:path*" },
      { source: "/api/family/:path*", destination: "http://localhost:3007/api/family/:path*" },
      { source: "/api/engagement/:path*", destination: "http://localhost:3008/api/engagement/:path*" },
    ];
  },
};

export default nextConfig;
