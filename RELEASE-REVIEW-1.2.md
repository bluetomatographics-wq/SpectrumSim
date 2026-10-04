# Spectrum Simulations 1.2 review

Prepared October 3, 2026 in `E:\Projects\Spectrum Simulations`.

## Scope

Three clearly labeled activities: real telescope observations, calculated experiments, and creative photo effects. No change to hosting or GitHub publication is included in this local release.

### Presentation

- Default landing activity: real visible/near-infrared comparison with a short discovery prompt.
- A single photo-band selector sits immediately above the viewer; duplicated band controls removed.
- Landscape-format city photo replaces the portrait mountain default in the photo studio; split view starts enabled.
- Photo effects have a concise purpose statement, optional advanced controls, and an accessible modal drawer on phones.
- Non-visible bands are separated visually from a small visible-light rainbow. The guide is explicitly not to scale.
- Radio and gamma show a hypothetical-source explanation and a link to the detector experiment; selecting them turns split view on.
- Updated metadata and a 1200 × 630 social preview derived from the existing approved Facebook artwork.

### Real images

Pillars of Creation (visible / near infrared), Whirlpool Galaxy (visible / X-ray), and Crab Nebula (visible / infrared). Six local WebP assets, preserved publisher framing and color mappings, visible credits, linked sources, reveal questions, and comparison links. See OBSERVATION-SOURCES.md for reuse basis and exact assets.

### Experiments

- X-ray: three equal-thickness material slabs, NIST attenuation coefficients, transmission percentages and fixed grayscale.
- Thermal: equal-temperature surfaces with different emissivity, ambient reflection, and a fixed radiance display range.
- Detector: fixed-flux source, Gaussian blur, exact Poisson sampling, and exposure-normalized count rates.

These are bounded educational calculations, not calibrated instrument simulations. Photo effects retain their existing qualitative assumptions. The observation library does not claim numerical sensor accuracy or recover data from RGB photographs.

## Validation

- TypeScript check passed.
- Existing processing suite passed: 84 stock-photo/band combinations, alpha, opacity, mixing, favorites, continuous zoom, GIF decoding/cancellation, and modeled-renderer invariants.
- New numerical checks passed: thermal equilibrium/reflection, fixed scale endpoints, X-ray slab behavior, Poisson mean/variance, blur flux conservation, reduced count-rate error at longer exposure, and repeatable samples.
- Public build checks cover all six observation assets, image dimensions, credits, local hashed assets, social-image metadata, SEO, and portable paths.
- Offline bundle checks ensure all six reference images are embedded alongside the six original stock photos.
- Browser checks: all three observation pairs, divider endpoints, explanation toggles, navigation, three experiment views, numerical endpoints, private stock-image upload, mobile drawer positioning/focus and dismissal, and no horizontal overflow at 390 px.
- Observed in-browser: zero-thickness slabs each show 100% transmission; both thermal surfaces at 20 °C show 18.7% of the fixed display range. Exposure changes update the detector label and rendering.

## Handoff

Local preview: http://127.0.0.1:4180/ while the preview server is running.
Upload the contents of the refreshed `Spectrum-Website` folder or website ZIP to the site's document root after approving the preview. Upload assets before replacing index.html. The source ZIP contains the working source, including this release's changes; it is not evidence of a GitHub push.

Before publication, the owner can review the three activity names and the educational direction. No account, new tracking, image-server upload, third-party model, or API key is required.
