/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['pdf-parse', 'faiss-node'],
  turbopack: {},
}

export default nextConfig;
