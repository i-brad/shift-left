import type { NextConfig } from 'next';

const config: NextConfig = {
  transpilePackages: ['@shift-left/ui', '@shift-left/iso', '@shift-left/sim', '@shift-left/lessons'],
};

export default config;
