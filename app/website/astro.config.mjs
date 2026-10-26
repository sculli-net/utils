import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { componentList } from '@/components/mdx';


/** Resolves a file inside a package's lib folder, i.e. resolveLib('qr-utils', 'index.ts') */
const resolveLib = (pkg, path) => fileURLToPath(new URL(`../../packages/${pkg}/lib/${path}`, import.meta.url));

// https://astro.build/config
export default defineConfig({
    // TODO: set the final domain; each package lives under /[id] (see src/lib/packages.ts)
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
    adapter: vercel(),
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
});
