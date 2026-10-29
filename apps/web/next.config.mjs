/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  async rewrites() {
    const apiTarget = process.env.INTERNAL_API_URL || "http://localhost:8080";
    return [
      {
        source: "/healthz",
        destination: `${apiTarget}/healthz`,
      },
      {
        source: "/swagger/:path*",
        destination: `${apiTarget}/swagger/:path*`,
      },
    ];
  },
};

export default nextConfig;
