import type { NextConfig } from "next";
const config: NextConfig = {
  distDir: process.env.NEXT_BUILD_DIR || '.next',
  env: { NEXT_PUBLIC_DATABASE_FREE_DEMO: process.env.DATABASE_FREE_DEMO || (process.env.VERCEL && !process.env.DATABASE_URL ? 'true' : 'false') },
  serverExternalPackages: ["knex", "better-sqlite3", "pg"],
  images: {
    remotePatterns: [
      { hostname: "images.unsplash.com" },
      { hostname: "images.pexels.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: `default-src 'self'; script-src 'self' 'unsafe-inline' ${process.env.NODE_ENV === "development" ? "'unsafe-eval'" : ""}; style-src 'self' 'unsafe-inline'; img-src 'self' https: data: blob:; font-src 'self'; connect-src 'self'; frame-src https://www.google.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'`,
          },
        ],
      },
    ];
  },
};
export default config;
