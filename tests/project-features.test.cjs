const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.resolve(__dirname, '../scripts/project-dialog.js'), 'utf8');
function functionsBetween(first, next) {
  return source.slice(source.indexOf(`  function ${first}(`), source.indexOf(`  ${next}`));
}
const feature = {
  id: 'ai-search', title: 'AI Search', src: '/assets/bing-app/ai-search.webp?v=board', width: 2560, height: 1440,
  video: {
    type: 'video', src: '/assets/bing-app/ai-search.mp4?v=video', poster: '/assets/bing-app/ai-search-poster.webp', width: 780, height: 1690,
    frame: { x: 213, y: 265, width: 484, height: 1047.425537109375, radius: 49.641029357910156, stroke: 2.482051372528076 },
  },
};
const ui = { invalidMedia: 'invalid media', invalidSections: 'invalid sections', pauseVideo: 'Pause video', playVideo: 'Play video', video: title => `${title} prototype demo`, portfolio: title => `${title} portfolio` };
const validation = vm.createContext({ ui, URLSearchParams, projects: { 'bing-app': { id: 'bing-app' } } });
vm.runInContext(functionsBetween('validProjectAsset', 'async function getManifest') + functionsBetween('readPortfolioLink', 'function openLinkedPortfolio'), validation);
validation.validateFeatureBoards([feature], 'bing-app');
for (const mutate of [
  f => { f.width = 0; },
  f => { f.height = Infinity; },
  f => { f.title = ' '; },
  f => { f.src = '/assets/copilot-macos-ui-kit/other.webp'; },
  f => { f.src = '/assets/bing-app/%2e%2e/private.webp'; },
  f => { f.src = '/assets/bing-app/bad%zz.webp'; },
  f => { f.video.poster = 'https://example.test/temporary.webp'; },
  f => { f.video.width = -1; },
  f => { f.video.frame.x = -1; },
  f => { f.video.frame.width = 3000; },
  f => { f.video.frame.y = 500; },
  f => { f.video.frame.radius = 300; },
  f => { f.video.frame.stroke = 484; },
]) {
  const invalid = structuredClone(feature);
  mutate(invalid);
  assert.throws(() => validation.validateFeatureBoards([invalid], 'bing-app'), /invalid media/);
}
assert.throws(() => validation.validateFeatureBoards([feature, feature], 'bing-app'), /invalid media/);
assert.throws(() => validation.validateFeatureBoards([], 'bing-app'), /invalid media/);
assert.equal(validation.readPortfolioLink('?project=__proto__&section=china-ai'), null);
assert.equal(validation.readPortfolioLink('?project=unknown'), null);
assert.equal(validation.readPortfolioLink('?section=china-ai'), null);
const linked = validation.readPortfolioLink('?project=bing-app&section=china-ai&unrelated=keep');
assert.equal(linked.config.id, 'bing-app');
assert.equal(linked.sectionId, 'china-ai');

class Node {
  constructor(tag) {
    this.tagName = tag;
    this.children = [];
    this.style = {};
    this.dataset = {};
    this.attributes = {};
    this.events = {};
    this.classList = { add() {}, remove() {} };
    if (tag === 'video') { this.paused = true; this.plays = 0; this.pauses = 0; }
  }
  append(...children) { this.children.push(...children); }
  addEventListener(type, callback) { this.events[type] = callback; }
  removeEventListener(type) { delete this.events[type]; }
  setAttribute(name, value) { this.attributes[name] = value; }
  closest(selector) {
    if (this.hiddenSection) return {};
    return selector === 'button' && this.tagName === 'button' ? this : null;
  }
  play() { this.paused = false; this.plays++; this.events.play?.(); return Promise.resolve(); }
  pause() { this.paused = true; this.pauses++; this.events.pause?.(); }
}
const featureVideoControls = new Map();
const rendering = vm.createContext({
  ui, document: { createElement: tag => new Node(tag) }, mediaFailed() {},
  featureVideoControls, dialog: { open: true }, viewer: { contains: () => true },
});
vm.runInContext(functionsBetween('createPortfolioVideo', 'function createVideoGroup'), rendering);
const board = rendering.createFeatureBoard(feature, { title: 'Bing App' });
assert.equal(board.style.aspectRatio, '2560 / 1440');
assert.equal(board.dataset.featureId, 'ai-search');
assert.equal(board.children.length, 2, 'The playback control stays inside the existing video overlay.');
const [image, frame] = board.children;
assert.equal(image.alt, 'AI Search · Bing App portfolio');
assert.equal(image.width, 2560);
assert.equal(image.height, 1440);
const video = frame.children[0];
assert.equal(video.muted, true);
assert.equal(video.defaultMuted, true);
assert.equal(video.loop, true);
assert.equal(video.playsInline, true);
assert.equal(video.preload, 'none');
assert.equal(video.tabIndex, -1);
assert.equal(video.controls, undefined, 'The recording uses a separate control instead of native video controls.');
assert.equal(video.src, feature.video.src);
assert.equal(video.poster, feature.video.poster);
// Reconstruct source-board pixels from the responsive percentages. The
// underlying export retains the stroke instead of a second CSS border.
const inset = feature.video.frame.stroke / 2;
assert.ok(Math.abs(parseFloat(frame.style.left) / 100 * 2560 - (213 + inset)) < 1e-8);
assert.ok(Math.abs(parseFloat(frame.style.top) / 100 * 1440 - (265 + inset)) < 1e-8);
assert.ok(Math.abs(parseFloat(frame.style.width) / 100 * 2560 - (484 - 2 * inset)) < 1e-8);
assert.ok(Math.abs(parseFloat(frame.style.height) / 100 * 1440 - (1047.425537109375 - 2 * inset)) < 1e-8);
assert.match(frame.style.borderRadius, /% \/ .*%$/);
const control = featureVideoControls.get(video);
const toggle = frame.children[1];
assert.equal(toggle.className, 'project-video-toggle project-feature-video-toggle');
assert.equal(toggle.attributes['aria-label'], 'Play video · AI Search');
assert.equal(toggle.dataset.paused, 'true');
control.setActive(true);
assert.equal(video.paused, false, 'Visible videos autoplay initially.');
assert.equal(toggle.attributes['aria-label'], 'Pause video · AI Search');
assert.equal(toggle.dataset.paused, 'false', 'Playing hides the pointer/touch overlay.');
frame.events.click({ target: frame });
assert.equal(video.paused, true, 'Clicking the recording pauses without a visible control.');
assert.equal(toggle.dataset.paused, 'true', 'Pausing exposes the persistent play button.');
let propagationStopped = false;
toggle.events.click({ stopPropagation() { propagationStopped = true; } });
assert.equal(propagationStopped, true);
assert.equal(video.paused, false);
frame.events.click({ target: toggle });
assert.equal(video.paused, false, 'A play-button click is not toggled twice by the recording surface.');
frame.events.click({ target: new Node('button') });
assert.equal(video.paused, false, 'A media-retry button does not also toggle playback.');
assert.equal(toggle.dataset.paused, 'false');
toggle.events.click();
assert.equal(video.paused, true);
control.setActive(false);
control.setActive(true);
assert.equal(video.paused, true, 'A manual pause survives leaving and reentering the viewport.');
const secondVideo = new Node('video');
const secondToggle = rendering.createFeatureVideoControl(secondVideo, 'Second');
const secondControl = featureVideoControls.get(secondVideo);
secondControl.setActive(true);
assert.equal(secondVideo.paused, false, 'Pausing one prototype does not pause another.');
toggle.events.click();
assert.equal(video.paused, false);
control.setActive(false);
assert.equal(video.paused, true);
toggle.events.click();
assert.equal(video.paused, false, 'The user can play from a visible control below the visibility threshold.');
control.setActive(false);
assert.equal(video.paused, true, 'Leaving the viewport stops an explicitly resumed video too.');

const videos = [0, 1, 2, 3].map(() => ({
  plays: 0, pauses: 0, closest() { return null; },
  play() { this.plays++; return Promise.resolve(); }, pause() { this.pauses++; },
}));
const observers = [];
const dialog = { open: true };
const lifecycle = vm.createContext({
  videoRows: new Map(), featureVideoControls: new Map(), dialog, videoObserver: undefined,
  viewer: { querySelectorAll: () => videos, contains: video => videos.includes(video) },
  IntersectionObserver: class {
    constructor(callback, options) { this.callback = callback; this.options = options; this.targets = []; observers.push(this); }
    observe(target) { this.targets.push(target); }
    disconnect() { this.disconnected = true; }
  },
});
vm.runInContext(functionsBetween('stopPortfolioVideos', 'function setActiveSection'), lifecycle);
lifecycle.observePortfolioVideos();
assert.equal(observers[0].targets.length, 4);
observers[0].callback([{ target: videos[0], isIntersecting: true, intersectionRatio: .8 }]);
assert.equal(videos[0].plays, 1);
assert.equal(videos[0].autoplay, true);
observers[0].callback([{ target: videos[0], isIntersecting: false, intersectionRatio: 0 }]);
assert.equal(videos[0].pauses, 1);
assert.equal(videos[0].autoplay, false);
dialog.open = false;
observers[0].callback([{ target: videos[1], isIntersecting: true, intersectionRatio: 1 }]);
assert.equal(videos[1].plays, 0, 'A queued observer callback cannot start playback after close.');
lifecycle.stopPortfolioVideos();
assert.equal(observers[0].disconnected, true);
assert.ok(videos.every(video => video.autoplay === false && video.pauses > 0));

const openings = [];
const frames = [];
let booting = true;
let loader = true;
let routeObserver;
const hydratedTrigger = { matches: () => false };
const route = vm.createContext({
  triggerSelector: '[data-project-open]', location: { search: '?project=bing-app&section=china-ai' },
  readPortfolioLink: () => linked,
  openPortfolio: (...args) => openings.push(args),
  window: { requestAnimationFrame: callback => frames.push(callback) },
  document: {
    documentElement: { classList: { contains: () => booting } },
    querySelector: selector => selector === '.site-loader' ? loader : hydratedTrigger,
  },
  MutationObserver: class {
    constructor(callback) { this.callback = callback; routeObserver = this; }
    observe() {} disconnect() { this.disconnected = true; }
  },
});
vm.runInContext(functionsBetween('openLinkedPortfolio', 'if (document.readyState'), route);
route.openLinkedPortfolio();
assert.equal(openings.length, 0);
booting = false;
routeObserver.callback();
assert.equal(frames.length, 0, 'The route waits until the loader has unmounted.');
loader = false;
routeObserver.callback();
routeObserver.callback();
assert.equal(frames.length, 1, 'Repeated hydration mutations schedule a single open.');
while (frames.length) frames.shift()();
assert.equal(openings.length, 1);
assert.equal(openings[0][1], hydratedTrigger);
assert.equal(openings[0][3], 'china-ai');
assert.equal(routeObserver.disconnected, true);
routeObserver.callback();
assert.equal(openings.length, 1, 'A linked portfolio opens only once.');

async function manifest(data) {
  const context = vm.createContext({
    ui, manifestCache: new Map(), manifestRequests: new Map(),
    fetch: async () => ({ ok: true, json: async () => data }),
  });
  const start = source.indexOf('  async function getManifest(');
  const end = source.indexOf('  function mediaFailed(');
  vm.runInContext(functionsBetween('validProjectAsset', 'async function getManifest') + source.slice(start, end), context);
  return context.getManifest({ id: 'bing-app' });
}
(async () => {
  const blockedVideo = new Node('video');
  blockedVideo.play = function () { this.plays++; return Promise.reject(new Error('Autoplay blocked')); };
  const blockedToggle = rendering.createFeatureVideoControl(blockedVideo, 'Blocked');
  const blockedControl = featureVideoControls.get(blockedVideo);
  blockedControl.setActive(true);
  await Promise.resolve();
  assert.equal(blockedToggle.attributes['aria-label'], 'Play video · Blocked');
  blockedVideo.play = Node.prototype.play;
  blockedToggle.events.click();
  assert.equal(blockedVideo.paused, false, 'A click retries blocked playback.');
  blockedVideo.hiddenSection = true;
  blockedControl.setActive(true);
  blockedToggle.events.click();
  assert.equal(blockedVideo.paused, true, 'Controls cannot restart a hidden chapter.');
  let rejectOldPlay;
  const rapidVideo = new Node('video');
  rapidVideo.play = function () {
    this.paused = false;
    this.events.play?.();
    return new Promise((resolve, reject) => { rejectOldPlay = reject; });
  };
  const rapidToggle = rendering.createFeatureVideoControl(rapidVideo, 'Rapid');
  featureVideoControls.get(rapidVideo).setActive(true);
  rapidToggle.events.click();
  assert.equal(rapidVideo.paused, true);
  rapidVideo.play = Node.prototype.play;
  rapidToggle.events.click();
  rejectOldPlay(new Error('Old request aborted'));
  await Promise.resolve();
  assert.equal(rapidVideo.paused, false);
  assert.equal(rapidToggle.attributes['aria-label'], 'Pause video · Rapid', 'An old rejected request cannot overwrite a newer successful play.');
  const featureObserver = observers[0];
  lifecycle.featureVideoControls.set(videos[2], { setActive: next => { lifecycle.featureActive = next; }, destroy() { lifecycle.featureDestroyed = true; } });
  dialog.open = true;
  featureObserver.callback([{ target: videos[2], isIntersecting: true, intersectionRatio: 1 }]);
  assert.equal(lifecycle.featureActive, true, 'The observer delegates controlled prototypes.');
  dialog.open = false;
  lifecycle.stopPortfolioVideos();
  assert.equal(lifecycle.featureDestroyed, true);
  assert.equal(lifecycle.featureVideoControls.size, 0);
  control.destroy();
  assert.equal(video.paused, true);
  assert.equal(toggle.events.click, undefined, 'Closing removes stale controls.');
  const text = { id: 'china-ai', title: 'Bing China AI', type: 'text', paragraphs: { zh: ['介绍'], en: ['Introduction'] } };
  await manifest({ sections: [text] });
  await manifest({ sections: [{ ...text, features: [feature] }] });
  await assert.rejects(manifest({ sections: [{ ...text, features: [feature], pages: [feature] }] }), /invalid sections/);
  await assert.rejects(manifest({ sections: [{ id: 'image', title: 'Image', features: [feature] }] }), /invalid sections/);
  await assert.rejects(manifest({ sections: [{ ...text, features: [] }] }), /invalid media/);
  console.log('Passed: feature assets/frame validation, responsive geometry, independent playback controls, persistent manual pause, blocked-play retry, close cleanup, text manifests, and hydration-safe links.');
})().catch(error => { console.error(error); process.exitCode = 1; });
