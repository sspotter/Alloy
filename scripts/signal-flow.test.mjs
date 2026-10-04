import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

test('Signal & Flow preserves all homepage sections after the hero', async () => {
  const [original, variant] = await Promise.all([read('index.html'), read('signal-flow.html')]);
  const sections = page => page.slice(page.indexOf('<section class="intro wrap"'));
  assert.equal(sections(variant), sections(original));
  const links = page => [...page.matchAll(/href="([^"]+)"/g)].map(match => match[1]).filter(href => !href.endsWith('.css'));
  assert.deepEqual(links(variant), links(original));
});

test('local preview and deployment include the separate variant', async () => {
  const [server, deployment] = await Promise.all([read('server.mjs'), read('vercel.json')]);
  assert.ok(server.includes("'signal-flow.html'"));
  assert.ok(JSON.parse(deployment).buildCommand.includes('signal-flow.html'));
});

test('hover colors the lines and reduced motion never starts an animation loop', async () => {
  const source = await read('assets/signal-flow.js');
  const listeners = {};
  const strokes = [];
  let frames = 0;
  const context = {
    setTransform() {}, clearRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, arc() {}, fill() {},
    stroke() { strokes.push(this.strokeStyle); },
    createRadialGradient() { return { addColorStop() {} }; },
  };
  const canvas = { getContext: () => context, style: {} };
  const stage = { clientWidth: 1000, clientHeight: 400,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 400 }),
    addEventListener: (type, listener) => { listeners[type] = listener; },
  };
  const media = { matches: true, addEventListener() {} };
  runInNewContext(source, {
    document: { querySelector: selector => selector === '.flow-canvas' ? canvas : stage, hidden: false, addEventListener() {} },
    window: { devicePixelRatio: 1, matchMedia: () => media },
    ResizeObserver: class { observe() {} },
    IntersectionObserver: class { observe() {} },
    requestAnimationFrame: () => { frames++; return frames; }, cancelAnimationFrame() {}, performance: { now: () => 0 },
  });
  assert.ok(strokes.length > 0, 'the static background is drawn immediately');
  const initialCount = strokes.length;
  listeners.pointermove({ clientX: 500, clientY: 200, pointerType: 'mouse' });
  assert.ok(strokes.slice(initialCount).some(color => color.includes('108,229,255')), 'hover draws cyan glow');
  assert.equal(frames, 0, 'reduced motion uses static redraws');
});
