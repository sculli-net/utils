import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { componentList } from '@/components/mdx';


import cloudflare from '@astrojs/cloudflare';


/** Resolves a file inside a package's lib folder, i.e. resolveLib('qr-utils', 'index.ts') */
const resolveLib = (pkg, path) => fileURLToPath(new URL(`../../packages/${pkg}/lib/${path}`, import.meta.url));

// https://astro.build/config
export default defineConfig({
    site: `https://utils.sculli.dev`,   
    prefetch: true,
    integrations: [react(), sitemap(), mdx({
        shikiConfig: {
            theme: 'tokyo-night',
        },
        optimize: {
            ignoreElementNames: [ ...componentList ]
        }
    })],
    build: { format: 'preserve' },
    adapter: cloudflare(),
    vite: {
        plugins: [tailwindcss()],
        resolve: {
            // Use the library sources directly so the site never needs a prior `pnpm build`
            alias: [
                { find: /^@sculli\/qr-utils$/, replacement: resolveLib('qr-utils', 'index.ts') },
                { find: /^@sculli\/qr-utils\/core$/, replacement: resolveLib('qr-utils', 'core/src/index.ts') },
                { find: /^@sculli\/qr-utils\/core\/sjis$/, replacement: resolveLib('qr-utils', 'core/src/sjis.ts') },
                { find: /^@sculli\/qr-utils\/render$/, replacement: resolveLib('qr-utils', 'render/src/index.ts') },
                { find: /^@sculli\/text-utils$/, replacement: resolveLib('text-utils', 'index.ts') },
            ],
        },
    },
    experimental: {
        clientPrerender: true,
    },
});