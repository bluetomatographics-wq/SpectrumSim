export const siteUrl = 'https://spectrumsimulations.com/';
export const creatorName = 'David B. Stevens';
export const contactEmail = 'info@spectrumsimulations.com';
export const buildCredit = 'BUILT BY GPT6 ASTRA';
export const siteTitle = 'Spectrum Simulations — Explore Light, Images & Experiments';
export const siteDescription = 'Compare real telescope images, try X-ray, thermal and photon-counting experiments, and create 14 photo effects. Free, private, and browser-based.';
export const appSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  '@id': siteUrl + '#app',
  name: 'Spectrum',
  creator: { '@type': 'Person', name: creatorName, email: contactEmail },
  url: siteUrl,
  description: siteDescription + ' Educational models use RGB photos and user assumptions, not measurements of invisible radiation.',
  applicationCategory: 'MultimediaApplication',
  operatingSystem: 'Any',
  browserRequirements: 'Requires JavaScript and a modern browser with Canvas support.',
  inLanguage: 'en',
  isAccessibleForFree: true,
  featureList: [
    'Three real telescope image comparisons with source credits',
    'Three guided experiments: X-ray materials, thermal signal, and photon counting',
    '14 creative electromagnetic spectrum simulations',
    'Editable material assumptions, wavelength controls, and display palettes',
    'X-ray attenuation, thermal radiance, and hypothetical source models',
    'Comparison with a user-supplied, aligned sensor reference image',
    'Six stock photographs and private local image uploads',
    'Effect opacity, strength, and two-effect mixing',
    'Split comparison with synchronized zoom and pan',
    'Spectrum playback and RGB pixel inspection',
    'Device-local favorite settings',
    'PNG image and comparison exports and animated GIF exports',
  ],
};
