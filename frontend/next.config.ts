import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow ngrok and any other external tunnel origins to access the dev server.
  // Next.js 16 blocks external origins by default for security.
  allowedDevOrigins: [
    "spearmint-liftoff-scribing.ngrok-free.dev",
    "*.ngrok-free.app",
    "*.ngrok.io",
  ],

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        // Ensure proper headers are returned on all API proxy responses
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
};

export default nextConfig;
