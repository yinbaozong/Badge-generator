import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const token = (loadEnv(mode, process.cwd(), 'VITE_').VITE_CLOUDFLARE_ANALYTICS_TOKEN || '').trim();
  if (token && !/^[a-f0-9]{32}$/i.test(token)) {
    throw new Error('VITE_CLOUDFLARE_ANALYTICS_TOKEN must be the 32-character Web Analytics site token.');
  }
  return {
  plugins: [{
    name: 'cloudflare-web-analytics',
    apply: 'build',
    transformIndexHtml() {
      if (!token) return;
      return [{
        tag: 'script',
        attrs: {
          defer: true,
          src: 'https://static.cloudflareinsights.com/beacon.min.js',
          'data-cf-beacon': JSON.stringify({ token, spa: false }),
        },
        injectTo: 'body',
      }];
    },
  }],
  base: './',
  worker: { format: 'es' },
  build: { target: 'es2022', assetsInlineLimit: 0 },
  };
});
