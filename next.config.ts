// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
//   reactCompiler: true,
// };

// export default nextConfig;



import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

// Configure the PWA settings safely according to its strict TypeScript definitions
const withPWA = withPWAInit({
  dest: "public",                                  // Where the service worker files will be generated
  disable: process.env.NODE_ENV === "development", // Don't run caching in development mode
  register: true,                                  // Automatically register the offline service worker
  workboxOptions: {
    skipWaiting: true,                             // Correctly placed inside workboxOptions to avoid type errors
  },
});

const nextConfig: NextConfig = {
  /* Your existing configuration options here */
  reactCompiler: true,
};

// Wrap your configuration with the PWA compiler wrapper
export default withPWA(nextConfig);