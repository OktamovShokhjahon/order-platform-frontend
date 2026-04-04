import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '5000' },
      { protocol: 'https', hostname: 'order-platform-backend.onrender.com' },
    ],
  },
};

export default withNextIntl(nextConfig);
