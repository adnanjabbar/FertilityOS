import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  typescript: {
    // Allow build to succeed when @types are not installed (e.g. production npm install --omit=dev)
    ignoreBuildErrors: true,
  },
};

export default withNextIntl(nextConfig);
