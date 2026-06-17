/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  experimental: {
    // Turbopack options often moved to top-level 'turbo' in recent versions
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  reactStrictMode: false,
};

module.exports = nextConfig;
