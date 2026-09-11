# Third-party notices

The root MIT license covers original Spectrum application code. It does not relicense the photographs, fonts, or third-party packages listed below.

## Sample photographs

The six files in `public/photos/` are distributed under the [Unsplash License](https://unsplash.com/license). That license permits downloading, copying, modifying, distributing, and using the images, including commercially. Unmodified image sales and compiling images into a competing service are restricted. These photographs are **not MIT-licensed**. Photographer attribution is retained in the app and `public/photos/credits.json`.

| File | Photographer | Original photograph |
| --- | --- | --- |
| landscape.jpg | Thomas Jarrand | https://unsplash.com/photos/9cY21AG4oDA |
| city.jpg | Zulfugar Karimov | https://unsplash.com/photos/6QP45DUayio |
| people.jpg | Kermen Tutkunova | https://unsplash.com/photos/h3hJzV0y_PY |
| animal.jpg | Scott Walsh | https://unsplash.com/photos/7LzKELgdzzI |
| flowers.jpg | Kier in Sight Archives | https://unsplash.com/photos/GknCIf4CCCY |
| coast.jpg | Ilyuza Mingazova | https://unsplash.com/photos/V-ONABe_ygs |

The Unsplash copyright license does not itself grant model, trademark, or other third-party rights. Review those rights for new uses such as endorsements. Forks may replace the examples with their own appropriately licensed images.

## Scientific references

The modeled renderer includes NIST mass attenuation coefficients for water, polyethylene, and iron at 60, 80, and 100 keV, and an implementation of the analytic CIE color-matching approximations described by Wyman, Sloan, and Shirley (2013). [RENDERING-NOTES.md](RENDERING-NOTES.md) records the exact sources and assumptions. No third-party model weights, reference-dataset images, or measured reflectance library are bundled. External sensor-example links retain their providers' terms.

## Geist font

`assets/geist.woff2` is an unmodified Geist font subset. Copyright (c) 2023 Vercel, in collaboration with basement.studio. Distributed under the SIL Open Font License 1.1. The full notice is in [licenses/Geist-OFL.txt](licenses/Geist-OFL.txt). Source: https://github.com/vercel/geist-font.

## Interface components and software

The interface includes shadcn-derived UI components and uses React, Base UI, Lucide icons, Tailwind CSS, and other packages recorded in `package.json` and `pnpm-lock.yaml`. Each package retains its own copyright and license; installing it does not transfer ownership to Spectrum's creator.

Complete available license and notice files from the installed dependency tree are collected in [licenses/DEPENDENCIES.txt](licenses/DEPENDENCIES.txt), including the notices for shadcn and its component sources. The build preserves JavaScript legal comments and embeds the applicable font and dependency notices in both downloadable app formats. Regenerate notices with `node scripts/collect-licenses.mjs` after installing or updating dependencies.
