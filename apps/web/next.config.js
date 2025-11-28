/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["pg"], 

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
