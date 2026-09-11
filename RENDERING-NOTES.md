# Spectrum Simulations 1.1 — rendering notes

Created and designed by David B. Stevens · BUILT BY GPT6 ALPHA  
Contact: info@spectrumsimulations.com

## What changed

Modeled rendering replaces the default brightness/tint filters with a combination of physical equations and explicit scene assumptions. Classic retains the original effects, including the inverted-image X-ray look. Saved favorites from the original release reopen in Classic mode. This is an educational photo explorer, not a sensor simulator with established predictive accuracy.

An RGB photograph does not uniquely determine its visible spectrum, much less temperature, UV reflectance, interior structure, radar return, or radiation sources. This release uses no AI, pretrained model, depth estimator, or automatic anatomical reconstruction. It does not manufacture hidden bones or present detected radiation.

## Common processing and material assumptions

The app decodes sRGB into linear light where optical luminance is needed. Small local luminance differences supply illustrative surface texture. Transparent pixels retain their alpha; invisible RGB values do not influence neighboring texture. The full image is limited to 1,600 pixels on its longer edge, and animated exports use a 480-pixel limit.

Automatic material hints use soft memberships from visible color and image position. Examples include green-dominant vegetation, blue upper-image sky, and warm colors in the portrait profile. These can be wrong: green fabric can look like vegetation, and a blue building can look like sky. Membership weights blend material responses with a general surface to avoid abrupt threshold boundaries. The material map displays the strongest hint, not a confidence or measurement map.

Users can choose one material for all unmarked pixels and stamp up to 48 circular regions. Stamps override hints completely; the latest overlapping stamp wins. Their coordinates and radii are normalized to image dimensions so favorites and resized exports use the same regions. Marks clear when the photograph changes. Favorites retain marks and model settings but never store photos or reference images.

Vegetation, water, skin, fabric/fur, wood/soil, metal, glass, and sky have **qualitative** infrared, UV, emissivity, temperature-offset, and radar parameters. Those values are not a measured material library. No USGS reflectance dataset is imported.

## Visible bands: approximate spectral filtering

Seven visible bands use a smooth spectral prior built from three Gaussian RGB basis functions. The app integrates that assumed spectrum through a Gaussian wavelength filter, then uses analytic approximations to the CIE 1931 observer to convert to XYZ and display RGB. Wavelength shift and filter bandwidth change the integration. Negative display components are clipped.

The filter is normalized to its transmitted white maximum so narrow filters remain visible. Consequently, displayed brightness is not absolute optical throughput. The RGB basis is a chosen prior, not an inverse calibrated camera response, and cannot recover metameric spectral differences. Wider bandwidth will change color mixing without necessarily producing a brighter display.

Sources: [Wyman, Sloan & Shirley, analytic color-matching functions (2013)](https://jcgt.org/published/0002/02/01/), [Physically Based Rendering: RGB-to-spectrum ambiguity](https://www.pbr-book.org/3ed-2018/Color_and_Radiometry/The_SampledSpectrum_Class).

## Near infrared

Assumed vegetation has higher NIR response and water lower response. A modest wavelength-dependent adjustment illustrates changes across 720–1,000 nm; this is not interpolation of measured spectra. Visible shading and local texture retain photographic structure. A display transfer curve and optional pink false color make the result legible.

Visible color does not reliably identify NIR reflectance. Manual materials can illustrate two visually identical surfaces with different assumed NIR responses. Sources: [EPFL: near-infrared imaging and materials](https://www.epfl.ch/labs/ivrl/research/near-infrared/infrared-imaging/), [NASA: near-infrared examples](https://science.nasa.gov/ems/08_nearinfraredwaves/).

## Thermal infrared

A relative Planck-radiance calculation samples the 8–14 µm band at 1 µm intervals. Each material contributes its emissivity times its assumed radiance, plus reflected ambient radiance weighted by one minus emissivity. Exposed skin uses the selected skin temperature; fur in the wildlife profile uses a temperature 5 °C lower. Other materials use illustrative ambient offsets, scaled by sun, shade, or night.

The display window runs from ambient minus 15 °C to the greater of ambient plus 25 °C or the selected skin temperature plus 10 °C. It adapts when settings change, so cross-setting brightness is not an absolute thermometer. A small texture term is artistic. The model omits atmospheric transmission, distance, real illumination, sensor spectral response, and thermal history. The °C controls are input assumptions; the app never measures temperatures from RGB.

Source: [FLIR: emissivity and reflected surroundings](https://www.flir.com/discover/professional-tools/how-does-emissivity-affect-thermal-imaging/).

## Ultraviolet

The UV control separates reflected near-UV from UV-induced visible fluorescence. These are distinct imaging processes. Each uses qualitative material response and visible shading. Fluorescence hues and strengths are illustrative; the app cannot reveal invisible flower markings, sunscreen, pigments, or chemicals.

Source: [Reflected UV and UV-induced fluorescence imaging methods](https://www.nature.com/articles/BMC2050-7445-2-8).

## X-ray transmission

The modeled X-ray view uses Beer–Lambert transmission:

`I / I0 = exp(−(μ/ρ) × density × thickness_cm)`

It uses these NIST mass attenuation samples in cm²/g:

| Material | Density, g/cm³ | 60 keV | 80 keV | 100 keV |
| --- | ---: | ---: | ---: | ---: |
| Water | 1.000 | 0.2059 | 0.1837 | 0.1707 |
| Polyethylene | 0.930 | 0.1970 | 0.1823 | 0.1719 |
| Iron | 7.874 | 1.205 | 0.5952 | 0.3717 |

Other materials use density-scaled water or polyethylene proxies. Soft automatic hints interpolate attenuation per unit thickness; explicit material regions use their assigned proxy directly. The thickness control sets a single slab depth; optional visible-edge texture adds assumed relief. This is not depth recovery. With texture at zero and a uniform material, changing photo brightness has no effect on transmission. Dense-white mode displays `1 − I/I0`; the alternative displays transmission directly.

The energy control is monoenergetic photon energy, not an X-ray tube kVp setting. The model omits polychromatic spectra, beam hardening, scatter, detector response, projection geometry, and internal layers. Actual radiographs require real acquisition or suitable volumetric geometry; a color photograph cannot supply it.

Sources: [NIST attenuation equation](https://physics.nist.gov/PhysRefData/XrayMassCoef/chap2.html), [water coefficients](https://physics.nist.gov/PhysRefData/XrayMassCoef/ComTab/water.html), [polyethylene coefficients](https://physics.nist.gov/PhysRefData/XrayMassCoef/ComTab/polyethylene.html), [iron coefficients](https://physics.nist.gov/PhysRefData/XrayMassCoef/ElemTab/z26.html), [compound densities](https://physics.nist.gov/PhysRefData/XrayMassCoef/tab2.html), [element densities](https://physics.nist.gov/PhysRefData/XrayMassCoef/tab1.html).

## Microwave / radar

A simplified backscatter field combines material response, roughness, assumed moisture, incidence angle, and local optical texture. Deterministic exponential noise supplies adjustable multiplicative speckle. Increasing incidence angle reduces the modeled return; roughness and moisture generally increase it in this illustrative model. Real radar responses are much more dependent on wavelength, polarization, surface geometry, and material dielectric properties.

This is not synthetic aperture radar reconstruction, and does not reproduce layover, shadowing, double-bounce scattering, or hidden geometry. Source: [NASA SERVIR SAR Handbook](https://earthdata.nasa.gov/s3fs-public/2025-04/SARHB_FullRes_2019.pdf).

## Radio and gamma

These bands now use one user-positioned hypothetical source, independently of optical brightness. Radio uses a bounded radial falloff and logarithmic display. Gamma uses a Gaussian source footprint with adjustable blur, power, exposure, and counting-noise strength. Its counting noise uses a deterministic normal approximation, not an exact Poisson sampler; low-count behavior is only illustrative.

Positions and spreads are percentages of the photo plane. Power and exposure are relative controls with no physical units. These are not calibrated field strength, activity, or photon counts. The app does not model propagation through buildings or establish that a source exists. Use opacity or split comparison to relate the assumed field to the photograph.

For actual gamma imaging, compare [NASA Fermi sky imagery](https://fermi.gsfc.nasa.gov/science/constellations/).

## Palettes, comparisons, and exports

Display palettes are separate from the modeled scalar field. Strength adjusts displayed intensity in Modeled mode; Classic retains its original contrast behavior. Mixing combines processed display colors, then opacity blends them with the original photo. These operations are creative display choices, not combinations of physical measurements. Alternative palettes and clipped values cannot be treated as a radiometric scale.

The reference panel accepts a user-supplied JPG, PNG, or WebP of the same scene and crop, within 3% of the photo's aspect ratio. It resizes the reference and displays it on the left of the split. It does not register images, decode radiometric metadata, confirm authenticity, or compute an accuracy score. All-band previews, full PNG exports, split PNGs, favorites, and animated sweeps use the model settings. Split PNGs preserve the reference, divider, zoom, and pan. Reference images are session-only. Material-map mode disables animation export because every band would show the same map.

The app links to the [EPFL corresponding RGB/NIR scene dataset](https://www.epfl.ch/labs/ivrl/research/downloads/rgb-nir-scene-dataset/) for investigation. Dataset and other reference photographs are not redistributed with this release.

## Validation scope

Automated checks cover all 84 stock-photo/band combinations, alpha preservation, spectral selectivity, linear-light conversion, a numerical NIST water-slab reference, monotonic attenuation and temperature behavior, uniform slab independence from optical brightness, material overrides, source independence, normalized regions, Classic favorite migration, zoom, mixing, PNG processing paths, and decoded GIF frames/cancellation.

Browser checks exercise material editing, reference upload and reset, palettes, band selection, and responsive layout. Loading the same RGB image as a reference is a functional comparison test, not sensor validation. This release has **not** been quantitatively validated against calibrated multispectral, thermal, radar, X-ray, or gamma captures.
