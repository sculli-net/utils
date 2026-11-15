/**
 * Every package the site documents. Each one gets its own home, docs and playground under
 * `/[id]`, a docs content collection named after its id (see content.config.ts) and an entry
 * in the sidebar's package switcher.
 */

// Font: dos-rebel. Banner.astro layers the full art (with ░ shading) under the solid blocks.
const qrBanner = `    ██████    ███████████              █████  █████ ███████████ █████ █████        █████████ 
  ███░░░░███ ░░███░░░░░███            ░░███  ░░███ ░█░░░███░░░█░░███ ░░███        ███░░░░░███
 ███    ░░███ ░███    ░███             ░███   ░███ ░   ░███  ░  ░███  ░███       ░███    ░░░ 
░███     ░███ ░██████████   ██████████ ░███   ░███     ░███     ░███  ░███       ░░█████████ 
░███   ██░███ ░███░░░░░███ ░░░░░░░░░░  ░███   ░███     ░███     ░███  ░███        ░░░░░░░░███
░░███ ░░████  ░███    ░███             ░███   ░███     ░███     ░███  ░███      █ ███    ░███
 ░░░██████░██ █████   █████            ░░████████      █████    █████ ███████████░░█████████ 
   ░░░░░░ ░░ ░░░░░   ░░░░░              ░░░░░░░░      ░░░░░    ░░░░░ ░░░░░░░░░░░  ░░░░░░░░░  
                                                                                             `;

const textBanner = ` ███████████ ██████████ █████ █████ ███████████            █████  █████ ███████████ █████ █████        █████████ 
░█░░░███░░░█░░███░░░░░█░░███ ░░███ ░█░░░███░░░█           ░░███  ░░███ ░█░░░███░░░█░░███ ░░███        ███░░░░░███
░   ░███  ░  ░███  █ ░  ░░███ ███  ░   ░███  ░             ░███   ░███ ░   ░███  ░  ░███  ░███       ░███    ░░░ 
    ░███     ░██████     ░░█████       ░███     ██████████ ░███   ░███     ░███     ░███  ░███       ░░█████████ 
    ░███     ░███░░█      ███░███      ░███    ░░░░░░░░░░  ░███   ░███     ░███     ░███  ░███        ░░░░░░░░███
    ░███     ░███ ░   █  ███ ░░███     ░███                ░███   ░███     ░███     ░███  ░███      █ ███    ░███
    █████    ██████████ █████ █████    █████               ░░████████      █████    █████ ███████████░░█████████ 
   ░░░░░    ░░░░░░░░░░ ░░░░░ ░░░░░    ░░░░░                 ░░░░░░░░      ░░░░░    ░░░░░ ░░░░░░░░░░░  ░░░░░░░░░  
                                                                                                                 `;

export const packages = {
    qr: {
        id: 'qr',
        name: '@sculli/qr-utils',
        label: 'qr-utils',
        title: 'QR Utils',
        description: 'Headless QR code generation & rendering',
        banner: qrBanner,
        bannerLabel: 'QR-UTILS',
    },
    text: {
        id: 'text',
        name: '@sculli/text-utils',
        label: 'text-utils',
        title: 'Text Utils',
        description: 'Text matching patterns for fuzzy search',
        banner: textBanner,
        bannerLabel: 'TEXT-UTILS',
    },
} as const;

export type PackageId = keyof typeof packages;
export type Package = (typeof packages)[PackageId];

export const packageList: Package[] = Object.values(packages);

/** `getStaticPaths` result for pages under `src/pages/[pkg]` */
export const packagePaths = () => packageList.map((pkg) => ({ params: { pkg: pkg.id }, props: { pkg } }));

/** Joins a site path onto a package's base, i.e. `pkgHref(qr, 'docs')` → `/qr/docs` */
export const pkgHref = (pkg: Package, path = '') => `/${pkg.id}${path ? `/${path.replace(/^\//, '')}` : ''}`;

/** Fira Mono glyphs are 0.6em wide, less 0.0667em tracking = 0.533em per banner column */
const BANNER_EM_PER_COLUMN = 0.5333;
const BANNER_MAX_FONT_PX = 15;

/** Sizes a banner so its widest line fills ~99% of its container, capped at 15px text */
export const bannerMetrics = (banner: string) => {
    const columns = Math.max(...banner.split('\n').map((line) => [...line].length));
    const em = columns * BANNER_EM_PER_COLUMN;
    return {
        columns,
        fontSize: `clamp(4px, ${(99 / em).toFixed(2)}cqi, ${BANNER_MAX_FONT_PX}px)`,
        /** Width of the banner at its largest size */
        maxWidth: `${((em * BANNER_MAX_FONT_PX) / 16).toFixed(2)}rem`,
    };
};
