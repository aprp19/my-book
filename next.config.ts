import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  serverExternalPackages: ["impit"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "meo.comick.pictures" },
      { protocol: "https", hostname: "uploads.mangadex.org" },
      { protocol: "https", hostname: "api.mangadex.org" },
      { protocol: "https", hostname: "**.mangadex.network" },
      { protocol: "https", hostname: "s4.anilist.co" },
    ],
  },
};

export default nextConfig;
