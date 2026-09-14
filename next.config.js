/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["pdfreader", "mammoth", "firebase-admin"],
  },
};

module.exports = nextConfig;
