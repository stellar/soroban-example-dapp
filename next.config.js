/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
    async rewrites() {
    return [
      {
        source: '/api/horizon/:path*',
        destination: 'http://localhost:8080/:path*' // Proxy to Backend
      }
    ]
  }
};
