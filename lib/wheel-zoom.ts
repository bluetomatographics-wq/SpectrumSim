import { wheelZoomValue, zoomPose, type Point, type Size, type ViewPose } from './viewer';

type AnimationClock = {
  request: (callback: FrameRequestCallback) => number;
  cancel: (id: number) => void;
  now: () => number;
  reducedMotion: () => boolean;
};

export function bindWheelZoom(element: HTMLElement, image: Size, viewport: Size, readPose: () => ViewPose, updatePose: (pose: ViewPose) => void, isPanning: () => boolean, clock: AnimationClock = {
  request: callback => window.requestAnimationFrame(callback),
  cancel: id => window.cancelAnimationFrame(id),
  now: () => window.performance.now(),
  reducedMotion: () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
}) {
  let frame: number | null = null;
  let target = readPose().zoom;
  let anchor: Point = { x: viewport.width / 2, y: viewport.height / 2 };
  let lastTime = 0;
  let direction = 0;
  const cancel = () => {
    if (frame !== null) clock.cancel(frame);
    frame = null;
    direction = 0;
  };
  const tick = (time: number) => {
    frame = null;
    if (isPanning()) { direction = 0; return; }
    const current = readPose();
    const elapsed = Math.max(0, time - lastTime);
    lastTime = time;
    // Ease in logarithmic zoom space, with the same timing at every frame rate.
    const distance = Math.log(target / current.zoom);
    const amount = clock.reducedMotion() ? 1 : 1 - Math.exp(-elapsed / 70);
    const nextZoom = current.zoom * Math.exp(distance * amount);
    const done = amount === 1 || Math.abs(Math.log(target / nextZoom)) < .00005;
    updatePose(zoomPose(image, viewport, current, done ? target : nextZoom, anchor));
    if (!done) frame = clock.request(tick);
    else direction = 0;
  };
  const wheel = (event: WheelEvent) => {
    // Keep browser accessibility zoom and horizontal scrolling available.
    if (event.ctrlKey || event.metaKey) { cancel(); return; }
    if (!event.cancelable || !event.deltaY || !Number.isFinite(event.deltaY) || viewport.width <= 0 || viewport.height <= 0) return;
    const bounds = element.getBoundingClientRect();
    if (bounds.width <= 0 || bounds.height <= 0) return;
    event.preventDefault();
    if (isPanning()) { cancel(); return; }
    anchor = { x: (event.clientX - bounds.left) * viewport.width / bounds.width, y: (event.clientY - bounds.top) * viewport.height / bounds.height };
    const current = readPose();
    const nextDirection = Math.sign(event.deltaY);
    // Accumulate wheel input; reversing direction immediately changes course.
    target = wheelZoomValue(frame !== null && direction === nextDirection ? target : current.zoom, event.deltaY, event.deltaMode, viewport.height);
    direction = nextDirection;
    if (clock.reducedMotion()) {
      cancel();
      updatePose(zoomPose(image, viewport, current, target, anchor));
    } else if (frame === null && target !== current.zoom) {
      lastTime = clock.now();
      frame = clock.request(tick);
    }
  };
  // React's delegated wheel handlers can be passive, so bind directly to the stage.
  element.addEventListener('wheel', wheel, { passive: false });
  element.addEventListener('pointerdown', cancel);
  return {
    cancel,
    destroy: () => {
      cancel();
      element.removeEventListener('wheel', wheel);
      element.removeEventListener('pointerdown', cancel);
    },
  };
}
