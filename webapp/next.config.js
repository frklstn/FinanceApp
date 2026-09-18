/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  experimental: {
    // Turbopack options often moved to top-level 'turbo' in recent versions
  },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'picsum.photos' }],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  reactStrictMode: false,
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://127.0.0.1:3006/api/v1/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
