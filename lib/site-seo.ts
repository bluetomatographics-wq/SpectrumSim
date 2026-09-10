export const siteUrl = 'https://spectrumsimulations.com/';
export const creatorName = 'David B. Stevens';
export const contactEmail = 'info@spectrumsimulations.com';
export const buildCredit = 'BUILT BY GPT6 ALPHA';
export const siteTitle = 'Spectrum — Infrared, UV & Electromagnetic Photo Effects';
export const siteDescription = 'Explore 14 simulated photo effects from radio to gamma rays. Upload an image, mix infrared and UV looks, compare views, and export images or animations.';
export const appSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  '@id': siteUrl + '#app',
  name: 'Spectrum',
  creator: { '@type': 'Person', name: creatorName, email: contactEmail },
  url: siteUrl,
  description: siteDescription + ' These creative effects use RGB pixels, not measurements of invisible radiation.',
  applicationCategory: 'MultimediaApplication',
  operatingSystem: 'Any',
  browserRequirements: 'Requires JavaScript and a modern browser with Canvas support.',
  inLanguage: 'en',
  isAccessibleForFree: true,
  featureList: [
    '14 creative electromagnetic spectrum simulations',
    'Six stock photographs and private local image uploads',
    'Effect opacity, strength, and two-effect mixing',
    'Split comparison with synchronized zoom and pan',
    'Spectrum playback and RGB pixel inspection',
    'Device-local favorite settings',
    'PNG image and comparison exports and animated GIF exports',
  ],
};
