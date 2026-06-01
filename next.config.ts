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
    skipWaiting: true,                             // New SW activates immediately without waiting for old one to die
    clientsClaim: true,                            // New SW takes control of all open tabs immediately
    // Increase the max asset size limit — Next.js chunks can be large
    maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB
  },
});

const nextConfig: NextConfig = {
  /* Your existing configuration options here */
  reactCompiler: true,
  turbopack: {},
};

// Wrap your configuration with the PWA compiler wrapper
export default withPWA(nextConfig);