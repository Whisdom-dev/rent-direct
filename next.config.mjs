/** @type {import('next').NextConfig} */
const SUPABASE_PROJECT = "akqefbpyjnrvszfagous"; // Change this if your project ref changes

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `connect-src 'self' https://${SUPABASE_PROJECT}.supabase.co wss://${SUPABASE_PROJECT}.supabase.co;`,
          },
        ],
      },
    ];
  },
}

export default nextConfig
