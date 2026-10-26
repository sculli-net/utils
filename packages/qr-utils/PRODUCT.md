# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **App developers (primary):** JavaScript/TypeScript developers adding QR generation to a Node or browser app. They want a well-typed API, sensible defaults and clear errors, so they don't have to learn the QR spec to get a correct symbol.
- **Brand/design developers (primary):** developers or designers who need styled, on-brand QR codes (custom shapes, per-pattern styling, room for a logo) that still scan reliably.

People learning how QR codes work are not a primary audience for this product, though the packages also power the "Learn QR" site on sculli.net.

## Product Purpose

qr-util is a QR code toolkit published to npm as two packages:

- `@qr-util/core` generates symbols and exposes the module matrix in several formats, along with landmarks (function patterns) and codeword metadata.
- `@qr-util/render` turns a core `QR` into SVG (the default), PNG or HTML, with shapes, per-pattern module styles and logo excavation.

The website (`app/website`, deployed to qr-utils.sculli.dev and never published to npm) hosts the docs and an interactive playground for both packages.

Success means a developer installs the packages, gets a correct, scannable symbol from defaults in a line or two, and can then reach every spec option and styling control without switching libraries.

## Positioning

- **Full spec coverage, verified.** It supports Model 1, Model 2, Micro QR and rMQR, with every version, ECC level, mask, encoding mode, ECI, FNC1, Structured Append and explicit segmentation. The test suite decodes every symbol type with zxing-cpp, rather than only checking that output was produced.
- **Landmark-aware output.** Core reports where the function patterns and codewords sit, so a renderer can treat finders, timing and alignment patterns separately from data modules, and excavation can remove only what error correction can recover.
- **Isomorphic and strictly typed.** The same API runs in Node and browsers. The TypeScript types block contradictory options (for example, `version` and `versionRange` can't both be set), and every public option has JSDoc with examples.

## Operating Context

- Developers use it in code: installed from npm (pnpm, npm, yarn or bun), called through either the object-oriented `QR` / `RenderQR` classes or the `createQR(data, { format })` helper, and read through editor IntelliSense/JSDoc.
- They evaluate it on the website: they read the docs and try options in the playground before installing.
- Core never renders images. All visual output belongs to `@qr-util/render`.

## Capabilities and Constraints

- Core options: symbol type, version or version range, error correction (L/M/Q/H), encoding mode, character encoding/ECI, mask pattern, segmentation, Structured Append (up to 16 symbols), FNC1, quiet zone. All are optional, and anything left unset is chosen automatically (smallest version that fits, auto-selected mask).
- Incompatible options throw explicit errors that state the numbers involved (for example, data bits vs available bits for a given version and ECC level).
- Render options: size, padding, quietZone, backgroundColor, color, excavate, shape, modules, plus className (SVG/HTML) and compression (PNG).
- Website stack (already in place): Astro with React islands, MDX, Tailwind CSS v4, deployed on Vercel. The site imports the library sources directly, so it never needs a prior package build.
- Licence: MIT. Author: Matt Scullino. Based on code from soldair/node-qrcode.
- **Open decision, canonical naming:** the packages are `@qr-util/core` and `@qr-util/render` (the unscoped `qr-util` name is taken on npm), the README uses "qr-util", the site title and manifest use "QR Utils", the domain is qr-utils.sculli.dev, and the homepage install command says `qr-utils`. On 2026-10-23 the user chose to keep `qr-utils` in the install command rather than switch it to the `@qr-util/*` names. Which name is canonical overall still hasn't been decided. Don't standardise on one without asking.

## Brand Commitments

- An ASCII "QR-UTILS" banner (dos-rebel figlet font, layered shading) is already used on the homepage, at `app/website/src/components/Banner.astro`. The alternatives considered are in `app/website/public/ascii/QR-UTILS-banner.md`.
- A favicon and app-icon set exists in `app/website/public/`.

## Evidence on Hand

- A decode-verified test suite (`lib/core/test`, `lib/render/test`) covers every Model 2 version, ECC level and mask, every Micro QR version, level and mask, all 32 rMQR versions at M and H, Model 1, ECI, FNC1, Kanji and Structured Append, plus decoded PNG renders (plain, shaped, styled, excavated).
- The package READMEs (`lib/core/README.md`, `lib/render/README.md`) and JSDoc are the API reference sources.
- There are no testimonials, adopters, download numbers, benchmarks or press yet. Don't invent any.

## Product Principles

1. **Correct before clever.** Every output must scan. Styling and excavation never trade away decodability.
2. **Defaults do the spec work.** Zero-config use gives the best-practice result, and every spec parameter stays reachable when someone needs it.
3. **Expose structure, don't hide it.** Landmarks and codeword metadata are first-class data, because styling depends on them.
4. **Errors explain themselves.** When options conflict, the error names the values involved and the limit that was exceeded.
5. **One API everywhere.** Node and browser behave identically, and the types catch misuse before runtime.
