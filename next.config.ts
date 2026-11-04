import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Pedido de orçamento com fotos (até 6; o browser reduz cada uma antes de enviar).
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
