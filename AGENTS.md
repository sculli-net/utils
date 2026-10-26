# sculli-utils

Monorepo for the `@sculli/*` utility packages and the single Astro site that documents them.
Each package is published to npm on its own; the site is never published.

```
sculli-utils/
├── packages/
│   ├── qr-utils/        @sculli/qr-utils   (QR generation + SVG/PNG/HTML rendering)
│   └── text-utils/      @sculli/text-utils (text matching)
├── app/
│   └── website/         @sculli/utils-website (private): docs + playgrounds for every package
├── tsconfig.base.json   shared compiler options, extended by every package
├── pnpm-workspace.yaml  packages/* and app/*
└── package.json         private workspace root: scripts only
```

Package-specific instructions live next to the code: read `packages/qr-utils/AGENTS.md` (it points at
`documentation/SETUP.md` and the QR spec notes) before working on the QR library. Astro tips for the site
are in `app/website/AGENTS.md`, and the site's design system is `app/website/DESIGN.md`.

## Scripts (run from the root)

| Script | What it does |
| -- | -- |
| `pnpm site:dev` / `site:build` / `site:preview` / `site:check` | Run the website |
| `pnpm build` / `typecheck` / `test` | Run across every package in `packages/*` |
| `pnpm qr:build` / `qr:test` / `qr:typecheck` | One package (`text:*` has build and typecheck; it has no tests yet) |
| `pnpm qr:publish` | Typecheck, test, then `pnpm publish` `@sculli/qr-utils` (`prepack` builds `dist/`) |
| `pnpm text:publish` | Typecheck, then `pnpm publish` `@sculli/text-utils` |

`pnpm publish` refuses to run with uncommitted changes or off the default branch. Bump the package's
`version` before publishing. Both packages have `publishConfig.access: public`.

When starting the dev server as an agent, use background mode from `app/website`:
`npx astro dev --background` (then `astro dev stop` / `status` / `logs`).

## Packages

Each package is self-contained and laid out the same way:

- `lib/` holds the source. qr-utils uses one folder per entry point (`lib/core/src`, `lib/render/src`, with
  tests in `lib/*/test`) and `lib/index.ts` re-exports them. text-utils is still flat (`lib/index.ts`,
  `lib/matching/*`); move it to `lib/<entry>/src` when it gets subpath exports.
- `tsconfig.json` is for the editor and `typecheck` (no emit, Node types on). `tsconfig.build.json` emits
  `dist/` with `"types": []`, so library code can't use Node globals like `process` by accident.
- Both extend `../../tsconfig.base.json` (`NodeNext` resolution), so relative imports need the `.js`
  extension (`./qr.js`). The website uses Astro's `Bundler` resolution, where extensionless imports work.
- `exports`, `files` and `main`/`types` in each `package.json` point at `dist/`. Add a subpath to
  `exports` and to the website aliases (below) together.
- Each package declares its own dev tools (`typescript`, `@types/node`, `vitest`…). The root only has
  `typescript` (for the editor, see `.vscode/settings.json`) and `@astrojs/ts-plugin`.

## Website (`app/website`)

One Astro app, one set of components and styles, with every package under its own route prefix:

| Route | Page |
| -- | -- |
| `/` | Ecosystem homepage (`src/pages/index.astro`). Currently a placeholder listing the packages; deliberately not a redirect, so no redirect gets cached for `/` |
| `/[pkg]` | Home: banner + install command |
| `/[pkg]/docs`, `/[pkg]/docs/[...id]` | Docs from that package's content collection |
| `/[pkg]/playground` | That package's playground |

`[pkg]` is the package id (`qr`, `text`).

### Where things live

- **`src/lib/packages.ts`** is the package registry: id, npm name, sidebar label, app title, ASCII banner.
  Every `[pkg]` page gets its paths from `packagePaths()`, and links are built with `pkgHref(pkg, 'docs')`.
  Never hard-code `/docs` or `/playground`.
- **`src/content.config.ts`** defines one docs collection per package, named after its id and loaded
  from `src/content/[id]`. `src/content/[id]/index.json` is the docs root (`__root`, with an `index`
  ordering its children), and isn't rendered as a page. `src/lib/collections.ts` (`getDocList(id)`) builds the nav tree.
- **`src/components/playground/[id]/`** holds each playground (React, `client:load`). They're picked in
  `src/pages/[pkg]/playground.astro` with one line per package, because hydrated components need a static import.
- **Banner**: `Banner.astro` takes the art from the registry and sizes it from its widest line
  (`bannerMetrics`). The source `.md` files are in `public/ascii/`.
- **Favicons and manifest**: per package in `public/favicons/[id]/`, chosen by `Layout.astro`. **The
  text-utils set is a copy of the qr-utils icons.** Replace the files in `public/favicons/text/` with the same
  names, and bump the `?v=` query in `Layout.astro` and `site.webmanifest` so browsers pick them up.
  `public/favicon.ico` is a qr fallback for browsers that ask for `/favicon.ico` directly.
- **Library code**: the Vite aliases in `astro.config.mjs` and the `paths` in `app/website/tsconfig.json`
  point `@sculli/*` imports at `packages/*/lib` source, so the site never needs a package build first.

### Sidebar and package switcher

`Sidebar.astro` shows the current package's name as a button that opens a popover (`#package-switcher`,
using the Popover API with CSS anchor positioning) listing every package. Switching keeps the current
section: `/qr/playground` → `/text/playground`. Doc pages differ between packages, so a doc page switches to
the other package's docs index.

The sidebar uses `transition:persist={`sidebar-${pkg.id}`}`. It persists between pages of the same package
(so the moving highlight glides), and is replaced when the package changes. Its script re-queries the DOM on
every `astro:page-load` because of this. Don't cache element references at module level.

### Adding a package

1. Create `packages/<name>/` from an existing package: `package.json` (`@sculli/<name>`), `tsconfig.json`,
   `tsconfig.build.json`, `lib/`, `LICENCE`.
2. Add root scripts `<id>:build`, `<id>:typecheck`, `<id>:publish` (and `<id>:test`).
3. In the website: add an entry to `src/lib/packages.ts` and a collection to `src/content.config.ts` (key = id),
   then create `src/content/<id>/index.json`, `src/components/playground/<id>/Playground.tsx` and its line in
   `pages/[pkg]/playground.astro`, `public/favicons/<id>/`, and the Vite alias + tsconfig path. Also add
   `"@sculli/<name>": "workspace:*"` to `app/website/package.json`.

## Migration notes (2026-10-25)

This repo was assembled from two standalone repos, which were **left in place and unchanged**:
`../qr-utils` (git history up to `bf5c653`, plus uncommitted work in its website docs nav and collections)
and `../text-utils` (no commits yet). Nothing was moved with git, so neither history is in this repo.

- The working trees were copied as they stood, including uncommitted changes. `node_modules`, `dist`,
  `.astro`, `.vercel`, `.DS_Store` and `qr-utils/ref` (gitignored reference material) were not copied.
- **Website**: started from the qr-utils site, which already had the newer docs nav, breadcrumb and
  collections work. text-utils' docs content, banner and placeholder playground were brought in as the second package.
  qr's `DESIGN.md` and `.impeccable/` came with it. The surfaces in
  `.impeccable/surfaces/` still name the old `src/pages/index.astro` and `playground.astro` paths.
- **Install command**: takes `packageName` and `playgroundHref` props. Its remembered package manager is
  now stored under `sculli-utils:package-manager` (was `qr-util:package-manager`).
- **qr-utils `package.json`**: lost the `site:*` scripts, `packageManager`, `@astrojs/ts-plugin` (now at
  the root) and `cn`, which only the website used and is now in its `package.json`.
- **Root `.impeccable/config.json`**: the qr playground ignore was re-pointed to `playground/qr/`, and the
  text playground's ignore was carried over.
- **Checked after the move**: `pnpm typecheck` passed, `pnpm test` passed (qr: 197 tests), `pnpm build`
  built both `dist/`s, and `pnpm site:build` built 15 pages. In the browser, the package switcher, section
  switching, per-package favicons and docs links all worked.
  `qr:publish` / `text:publish` were **not** run or dry-run.

### Open items

- **Site URL**: `site` in `astro.config.mjs` is a placeholder (`https://utils.sculli.dev`). The sitemap
  uses it, and `app/website/vercel.json` should be checked against the new Vercel project (root directory
  `app/website`).
- **Package `repository` fields** still point at the old `sculli-net/qr-utils` and `sculli-net/text-utils`
  repos. Update them (with `"directory": "packages/<name>"`) once this repo has a remote.
- **The ecosystem homepage at `/`** is a placeholder. It doesn't use `Layout.astro`/`Sidebar.astro`,
  which need a package, so a package-less variant of both is needed for the real page. Don't add a redirect for `/`.
- **`packages/qr-utils/PRODUCT.md`** (impeccable product context) describes qr-utils alone. A site-level
  `PRODUCT.md` at the root would suit the multi-package site better.
- **`pnpm site:check`** prompts to install `@astrojs/check`, which isn't a dependency yet.
- **Leftovers carried over from the originals:** a `console.log` dumping each doc in
  `components/navigation/DocClickable.astro` (noisy builds), an invalid `li[]` selector in `Sidebar.astro`,
  the unused `components/Sidebar.js`, the placeholder `setup.json` in the qr docs, and the Astro starter README in `app/website`.
