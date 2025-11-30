import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    BACKEND_API: process.env.BACKEND_API,
  },
};

export default nextConfig;
