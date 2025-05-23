/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  // Otimizações para ambiente de desenvolvimento
  reactStrictMode: false, // Desabilita o modo estrito em dev para evitar renderização dupla
  // swcMinify foi removido pois não é mais necessário nas versões mais recentes do Next.js
  webpack: (config) => {
    // Otimizações para webpack
    config.optimization.moduleIds = 'deterministic';
    return config;
  },
  // Configuração para o Turbopack
  experimental: {
    turbo: {
      rules: {
        // Regras específicas para o Turbopack se necessário
      }
    }
  }
};

module.exports = nextConfig;
