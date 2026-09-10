# Spectrum

Explore photographs with 14 creative electromagnetic spectrum simulations, from radio and microwave through infrared, visible light, ultraviolet, X-rays, and gamma rays.

**Created and designed by David B. Stevens**  
**BUILT BY GPT6 ALPHA**  
Contact: [info@spectrumsimulations.com](mailto:info@spectrumsimulations.com)  
Live app: [spectrumsimulations.com](https://spectrumsimulations.com/)

## What it does

- Six stock photographs: landscape, cityscape, people, animals, flowers, and coast.
- Local JPG, PNG, and WebP uploads up to 20 MB (40 megapixels maximum).
- Fourteen simulated bands, plus the original image and an all-bands gallery.
- Adjustable opacity and strength, and blending between two effects.
- Split comparison with a draggable divider, smooth cursor-centered wheel zoom, and panning.
- Automatic spectrum playback, saved favorite settings, and an RGB pixel inspector.
- PNG image/comparison downloads and animated GIF spectrum exports.

These are **artistic simulations derived from ordinary RGB photos**. They do not recover invisible wavelengths or detect heat, radiation, internal anatomy, or radio signals.

## Run locally

Install **Node.js 24 or later** and **pnpm 11.19.0**. From the repository folder:

```sh
npm install --global pnpm@11.19.0
pnpm install --frozen-lockfile
pnpm build
pnpm start
```

Open `http://127.0.0.1:4173`. Stop the server with Ctrl+C. After editing source files, run `pnpm build` again and refresh the page. `pnpm dev` builds and starts the same local preview; it does not watch for changes.

No API keys, accounts, database, Codex installation, or proprietary hosting services are required to build or run the app. The build downloads dependencies during installation; the resulting app keeps its images, font, scripts, and styles local.

## Build and deploy

`pnpm build` creates:

- `outputs/public_html/`: optimized, pre-rendered static website, with local assets, SEO metadata, sitemap, robots.txt, and optional Apache caching rules.
- `outputs/Spectrum.html`: self-contained offline app with embedded images. Open it directly in a browser.

Upload the **contents** of `outputs/public_html/` to your domain's document root. Apache can use the included `.htaccess`; other static hosts can serve the HTML and assets without it. For a GitHub Pages project, publish those same contents. Relative asset links support subfolders; change `siteUrl` in `lib/site-seo.ts` to your deployment URL, including any subfolder and a trailing slash, before building a fork. The supplied canonical URL is `https://spectrumsimulations.com/`.

The GitHub workflow runs checks on pushes and pull requests and provides downloadable build artifacts. A tag such as `v1.0.0` also creates a GitHub Release with the website ZIP and offline HTML. Website hosting is separate; the workflow does not change the live domain.

## Checks

```sh
pnpm check
```

Checks cover TypeScript, image processing, opacity and mixing, transparent pixels, zoom geometry and animation, favorites validation, GIF decoding and cancellation, and generated website content/assets. Test images stay local. `.build/` and `outputs/` are generated and excluded from Git.

## Source layout

- `app/page.tsx`, `app/globals.css`: application interface and styles.
- `components/`: viewer, controls, guide, and UI primitives.
- `lib/`: spectrum effects, zoom, exports, favorites, and site metadata.
- `public/photos/`: sample photographs and original credits.
- `scripts/`: portable static/offline build and local preview server.
- `tests/`: processing, interaction, and export checks.

## Privacy

Uploaded photos are processed in the browser and are not sent to a server by this app. Favorite settings are stored in the current browser's local storage; image data is not stored with them. Exports are saved when requested. The app includes no analytics or tracking code. Your hosting provider may keep normal web access logs.

## License and contributions

Original application code is released under the [MIT license](LICENSE), copyright 2026 David B. Stevens. The sample photos, Geist font, and third-party software retain their own licenses; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). The MIT license requires preservation of copyright/license notices; it does not require visible UI attribution in forks.

Bug reports and pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md). For a security issue, see [SECURITY.md](SECURITY.md).
