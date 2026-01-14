import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    reactCompiler: false,
    poweredByHeader: false,
    images: {
        unoptimized: true
    },
    experimental: {
        serverComponentsHmrCache: false
    }
};

export default nextConfig;
