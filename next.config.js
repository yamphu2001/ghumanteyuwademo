/** @type {import('next').NextConfig} */
const nextConfig = {
  // Add any existing Next.js settings here if you have them
};

const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
});

module.exports = withPWA(nextConfig);