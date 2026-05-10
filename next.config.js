// import type { NextConfig } from "next";
// import withBundleAnalyzer from "@next/bundle-analyzer";

// const nextConfig: NextConfig = {
//   /* your existing config options here */
// };

// // Wrap the config with the analyzer
// const bundleAnalyzer = withBundleAnalyzer({
//   enabled: process.env.ANALYZE === "true",
// });

// export default bundleAnalyzer(nextConfig);


// next.config.js
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig = {
  /* your existing config options here */
  reactStrictMode: true,
};

module.exports = withBundleAnalyzer(nextConfig);