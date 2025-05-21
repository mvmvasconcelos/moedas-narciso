import type {NextConfig} from 'next';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {

    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  allowedDevOrigins: ['*.cluster-vpxjqdstfzgs6qeiaf7rdlsqrc.cloudworkstations.dev'],
};

export default nextConfig;
