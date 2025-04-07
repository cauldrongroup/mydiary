import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  generateEtags: true,
  poweredByHeader: false,
  reactStrictMode: true,
  /* config options here */
};

export default nextConfig;
