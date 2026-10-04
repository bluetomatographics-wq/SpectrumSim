// Display-ready telescope observations, not synthetic bands or radiometric data.
// Source URLs, reuse guidance and transformations: OBSERVATION-SOURCES.md.
export const observations = [
  {
    id: 'pillars', title: 'Look through the dust', object: 'Pillars of Creation',
    left: '/observations/pillars-visible.webp', right: '/observations/pillars-infrared.webp',
    leftLabel: 'Visible · Hubble', rightLabel: 'Near infrared · Hubble',
    question: 'Where do the extra stars come from?',
    prompt: 'Slide toward the infrared view. Look inside the dark pillars and in the space around them.',
    answer: 'Many stars were already there, hidden by dust in the visible view. Near-infrared observations reveal more of them. A color filter applied to the visible photograph cannot reconstruct those missing stars.',
    colors: 'Published color mappings combine telescope filters. Infrared light itself is invisible to our eyes; blue and gold are display colors.',
    context: 'Hubble observations from 2014, presented in a common landscape framing by NASA’s Scientific Visualization Studio. This is near-infrared imaging, not a thermal camera view.',
    credit: 'NASA, ESA, and the Hubble Heritage Team (STScI/AURA)',
    source: 'https://svs.gsfc.nasa.gov/31007/',
    lesson: 'Different wavelengths can reveal information absent from a visible photograph.'
  },
  {
    id: 'whirlpool', title: 'Find the energetic regions', object: 'Whirlpool Galaxy',
    left: '/observations/whirlpool-visible.webp', right: '/observations/whirlpool-xray.webp',
    leftLabel: 'Visible · Hubble', rightLabel: 'X-ray · Chandra',
    question: 'Is an X-ray view an inverted photograph?',
    prompt: 'Follow the spiral arms, then compare the centers of the two galaxies. Which features remain prominent?',
    answer: 'The X-ray image records emission associated with energetic sources and very hot gas. It is a separate observation, not a negative of the optical image. It also differs from a medical radiograph, which records X-rays transmitted through an object.',
    colors: 'The X-ray colors are assigned for display. Compare structures rather than treating the colors or brightness as a shared temperature scale.',
    context: 'Hubble and Chandra observations, arranged for comparison by NASA’s Scientific Visualization Studio (2018 release). Different instruments and exposures; not a simultaneous snapshot.',
    credit: 'Optical image: NASA and The Hubble Heritage Team (STScI). X-ray image: NASA/Chandra/CXC',
    source: 'https://svs.gsfc.nasa.gov/30952/',
    lesson: 'An astronomical X-ray image and an X-ray transmission experiment answer different questions.'
  },
  {
    id: 'crab', title: 'One nebula, different structures', object: 'Crab Nebula',
    left: '/observations/crab-visible.webp', right: '/observations/crab-infrared.webp',
    leftLabel: 'Visible · Hubble', rightLabel: 'Infrared · Spitzer',
    question: 'Does the same structure stand out in both views?',
    prompt: 'Compare the central glow with the network of filaments around it. Watch how their relative prominence changes.',
    answer: 'Each telescope collects a different part of the spectrum. Features can change in prominence and texture between these published views. Their display colors and contrast also differ, so a brighter pixel alone is not a calibrated cross-band measurement.',
    colors: 'Green and yellow are assigned display colors in this published set. They are not the colors that an eye would see in infrared.',
    context: 'Hubble and Spitzer observations in NASA’s 2018 multiwavelength presentation. Images share the publisher’s framing, with different instrument resolution and processing.',
    credit: 'Optical image: NASA, ESA, and Hubble (STScI). Infrared image: NASA/Spitzer/JPL-Caltech',
    source: 'https://svs.gsfc.nasa.gov/30944/',
    lesson: 'Compare the structures, and always ask how an observation was captured and displayed.'
  }
] as const;
