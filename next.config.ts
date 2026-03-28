import type { NextConfig } from "next";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

const nextConfig: NextConfig = {
  reactCompiler: true,
  async rewrites() {
    return [
      {
        source: "/hls/:path*",
        destination: `${API_BASE}/hls/:path*`,
      },
      {
        source: "/thumbnails/:path*",
        destination: `${API_BASE}/thumbnails/:path*`,
      },
    ];
  },
};

export default nextConfig;

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
