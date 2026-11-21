/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'mysupportinfo.vercel.app',
          },
        ],
        destination: 'https://mysupportinfo.com/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.mysupportinfo.com',
          },
        ],
        destination: 'https://mysupportinfo.com/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
