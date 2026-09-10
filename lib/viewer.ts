export type Size = { width: number; height: number };
export type Point = { x: number; y: number };
export type ViewPose = { zoom: number; pan: Point };
export const initialPose: ViewPose = { zoom: 1, pan: { x: 0, y: 0 } };

const limit = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

// Both versions use this exact rectangle, so zooming and panning cannot drift.
export function imageRectangle(image: Size, viewport: Size, pose: ViewPose) {
  const zoom = limit(pose.zoom, 1, 5);
  const fit = Math.min(viewport.width / image.width, viewport.height / image.height);
  const width = image.width * fit * zoom;
  const height = image.height * fit * zoom;
  const maxX = Math.max(0, (width - viewport.width) / 2);
  const maxY = Math.max(0, (height - viewport.height) / 2);
  const pan = { x: limit(pose.pan.x, -maxX, maxX), y: limit(pose.pan.y, -maxY, maxY) };
  return { width, height, left: (viewport.width - width) / 2 + pan.x, top: (viewport.height - height) / 2 + pan.y, pan, zoom };
}

export function zoomPose(image: Size, viewport: Size, pose: ViewPose, requestedZoom: number, anchor: Point = { x: viewport.width / 2, y: viewport.height / 2 }): ViewPose {
  const current = imageRectangle(image, viewport, pose);
  const zoom = limit(requestedZoom, 1, 5);
  const ratio = zoom / current.zoom;
  // Preserve the image point beneath the cursor, subject to the image's pan bounds.
  const next = imageRectangle(image, viewport, { zoom, pan: {
    x: current.pan.x * ratio + (anchor.x - viewport.width / 2) * (1 - ratio),
    y: current.pan.y * ratio + (anchor.y - viewport.height / 2) * (1 - ratio),
  } });
  return { zoom, pan: next.pan };
}

export function wheelZoomValue(zoom: number, deltaY: number, deltaMode: number, viewportHeight: number) {
  if (!Number.isFinite(deltaY)) return limit(zoom, 1, 5);
  // Wheels may report pixels, text lines, or pages. Small trackpad deltas stay smooth.
  const pixels = deltaY * (deltaMode === 1 ? 16 : deltaMode === 2 ? viewportHeight : 1);
  return limit(zoom * Math.exp(-limit(pixels, -240, 240) * .002), 1, 5);
}

// The effects preserve source transparency. Blend their RGB values directly,
// keeping that alpha instead of double-compositing semitransparent images.
export function blendPixels(source: Uint8ClampedArray, effect: Uint8ClampedArray, opacity: number): Uint8ClampedArray<ArrayBuffer> {
  if (source.length !== effect.length || source.length % 4) throw new Error('Pixel buffers must contain matching RGBA images');
  const amount = limit(opacity, 0, 100) / 100;
  const output = new Uint8ClampedArray(source.length);
  for (let i = 0; i < source.length; i += 4) {
    output[i] = source[i] * (1 - amount) + effect[i] * amount;
    output[i + 1] = source[i + 1] * (1 - amount) + effect[i + 1] * amount;
    output[i + 2] = source[i + 2] * (1 - amount) + effect[i + 2] * amount;
    output[i + 3] = source[i + 3];
  }
  return output;
}
