/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'app.warera.io',
            },
        ],
    },
};

export default nextConfig;
