export function SpectrumGuide() {
  return <section className="spectrum-guide" aria-labelledby="guide-title">
    <div><div className="eyebrow">ABOUT SPECTRUM</div><h2 id="guide-title">Explore infrared, ultraviolet, and more through photo effects</h2>
      <p>Spectrum is a free photo effects app for exploring creative interpretations of the electromagnetic spectrum. Start with one of six photographs—landscape, cityscape, portrait, animal, flowers, or coast—or upload your own JPG, PNG, or WebP image.</p>
      <p>Try 14 simulated bands: radio, microwave, thermal infrared, near infrared, red, orange, yellow, green, cyan, blue, violet, ultraviolet, X-ray, and gamma ray. Adjust opacity and effect strength, mix two bands, and compare the result with the original using a movable split divider.</p>
    </div>
    <div className="guide-questions">
      <details><summary>Are these real infrared or ultraviolet images?</summary><p>No. Spectrum transforms the red, green, and blue pixels in an ordinary photo into artistic effects. It cannot measure temperature, invisible radiation, UV fluorescence, internal structures, or radio emissions. Real spectral measurements require specialized sensors and data.</p></details>
      <details><summary>How can I inspect and compare my image?</summary><p>Scroll over the image to zoom from 1× to 5×, then drag to pan. Both sides of a split comparison stay aligned. Turn on the pixel inspector to compare original and processed RGB values, or play an automatic sweep through the bands and pause on a look you like.</p></details>
      <details><summary>Can I save my results?</summary><p>Download a PNG of the processed image or split comparison, or export a looping animated GIF of the spectrum. PNG images use the app’s processed resolution of up to 1,600 pixels along the longer edge. GIF animations use a 480-pixel image and a limited color palette. Favorite settings stay in this browser on this device.</p></details>
      <details><summary>Are uploaded photos sent to a server?</summary><p>No. Your image is processed locally in your browser. Uploads are not sent to a server or saved with favorite settings, and reloading clears the uploaded image. Downloads are saved only when you choose to export them.</p></details>
    </div>
  </section>;
}
