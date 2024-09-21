/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, {}) => {
    // Exclude the streamer folder from being processed by Next.js
    config.module.rules.push({
      test: /\.(ts|tsx|js|jsx)$/,
      exclude: [/node_modules/, /src\/streamer/],
    });

    return config;
  },
};

export default nextConfig;
