/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // 排除 re2 模塊，因為它是一個原生模塊
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        're2': false,
      };
    }
    
    return config;
  },
};

module.exports = nextConfig; 