const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Small DOM fixture for state and lifecycle checks; actual layout is checked
// in the browser so this test does not encode CSS or screenshots.
const document = { activeElement: null };
class Element extends EventTarget {
  constructor(tagName) {
    super();
    this.tagName = tagName;
    this.children = [];
    this.parentElement = null;
    this.dataset = {};
    this.attributes = new Map();
    this.className = '';
    this.style = { setProperty() {} };
    this.hidden = false;
    this.classList = {
      contains: value => this.className.split(/\s+/).includes(value),
      add: value => { if (!this.classList.contains(value)) this.className += ` ${value}`; },
    };
  }
  append(...elements) { elements.forEach(element => { element.parentElement = this; this.children.push(element); }); }
  replaceChildren(...elements) {
    this.children.forEach(element => { element.parentElement = null; });
    this.children = [];
    this.append(...elements);
  }
  get firstElementChild() { return this.children[0] || null; }
  set textContent(value) { this._text = String(value); this.replaceChildren(); }
  get textContent() { return (this._text || '') + this.children.map(element => element.textContent).join(''); }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  focus(options) { document.activeElement = this; this.focusOptions = options; }
  closest(selector) {
    const key = { '[data-toast-dismiss]': 'toastDismiss', '[data-toast-action]': 'toastAction' }[selector];
    for (let element = this; element; element = element.parentElement) {
      if (key && Object.hasOwn(element.dataset, key)) return element;
    }
    return null;
  }
}
document.createElement = tagName => new Element(tagName);
const window = {};
vm.runInNewContext(fs.readFileSync(path.resolve(__dirname, '../scripts/toast-showcase.js'), 'utf8'), {
  window, document, AbortController,
});

function all(root, predicate) {
  return [root, ...root.children.flatMap(element => all(element, () => true))].filter(predicate);
}
const hasClass = name => element => element.classList.contains(name);
function one(root, predicate) {
  const found = all(root, predicate);
  assert.equal(found.length, 1, 'Expected one fixture element');
  return found[0];
}
function fire(element, type, target = element) {
  const event = new Event(type);
  Object.defineProperty(event, 'target', { value: target });
  element.dispatchEvent(event);
}
function fixture(options) {
  const instance = window.createToastShowcase(options);
  const root = instance.element;
  const preview = one(root, hasClass('toast-preview-content'));
  const select = one(root, element => element.tagName === 'select');
  const replay = one(root, hasClass('toast-showcase-button'));
  const reset = one(root, hasClass('toast-showcase-reset'));
  const notice = one(root, hasClass('toast-preview-notice'));
  const toggle = key => one(root, element => element.tagName === 'input' && element.name === key);
  return {
    ...instance, root, preview, select, replay, reset, notice, toggle,
    toast: () => one(preview, hasClass('copilot-toast')),
    changeClass(value) { select.value = value; fire(select, 'change'); },
    changeProperty(key, checked) { const input = toggle(key); input.checked = checked; fire(input, 'change'); },
  };
}

const page = fixture();
const variants = all(page.root, element => Object.hasOwn(element.dataset, 'toastVariant'));
assert.equal(variants.length, 19);
assert.equal(new Set(variants.map(element => element.dataset.toastVariant)).size, 19);
assert.equal(variants[0].dataset.toastVariant, 'feature-wrap');
assert.equal(variants.at(-1).dataset.toastVariant, 'settings-hug');
assert.equal(variants.some(element => element.dataset.toastVariant === 'survey-wrap'), false);

// Changes affect the live preview, never the source-variant gallery.
const firstGalleryToast = one(variants[0], hasClass('copilot-toast'));
const firstGalleryText = firstGalleryToast.textContent;
page.changeProperty('showImage', false);
page.changeProperty('showDescription', false);
assert.equal(all(page.toast(), hasClass('copilot-toast-image')).length, 0);
assert.equal(all(page.toast(), hasClass('copilot-toast-description')).length, 0);
assert.equal(one(variants[0], hasClass('copilot-toast')), firstGalleryToast);
assert.equal(firstGalleryToast.textContent, firstGalleryText);
assert.equal(all(firstGalleryToast, hasClass('copilot-toast-image')).length, 1);

// Picking a class applies its base properties. Survey has no wrapped variant.
page.changeClass('podcast');
assert.equal(page.toggle('showImage').checked, true);
assert.equal(page.toggle('showDescription').checked, true);
assert.equal(one(page.toast(), hasClass('copilot-toast-action')).textContent, 'Listen');
page.changeClass('survey');
assert.equal(page.toggle('wrap').checked, false);
assert.equal(page.toggle('wrap').disabled, true);
assert.equal(page.toast().dataset.wrap, 'false');
page.changeClass('critical');
assert.equal(page.toggle('wrap').disabled, false);
assert.equal(page.toggle('showImage').checked, false);
assert.equal(page.toggle('showIcon').checked, true);
assert.equal(page.toggle('showButton').checked, false);
assert.equal(page.toggle('showDismiss').checked, false);
assert.equal(all(page.toast(), hasClass('copilot-toast-icon')).length, 1);

// Reset restores the first class. A click on a nested dismiss icon is handled
// like the button itself; Replay remains focusable after its toast disappears.
fire(page.reset, 'click');
assert.equal(page.select.value, 'feature');
assert.equal(page.toggle('wrap').checked, true);
assert.equal(page.toggle('showImage').checked, true);
const action = one(page.toast(), hasClass('copilot-toast-action'));
fire(page.preview, 'click', action);
assert.match(page.notice.textContent, /Explore/);
const dismiss = one(page.toast(), hasClass('copilot-toast-dismiss'));
fire(page.preview, 'click', dismiss.firstElementChild);
assert.equal(page.preview.hidden, true);
assert.equal(document.activeElement, page.replay);
assert.equal(page.replay.focusOptions.preventScroll, true);
fire(page.replay, 'click');
assert.equal(page.preview.hidden, false);
assert.equal(page.toast().dataset.toastClass, 'feature');

// A closed reader must leave no active showcase handlers, and opening another
// reader constructs an independent initial state rather than restoring edits.
page.changeClass('podcast');
page.changeProperty('showImage', false);
const retiredToast = page.toast();
const retiredNotice = page.notice.textContent;
page.destroy();
page.destroy();
page.changeClass('critical');
page.changeProperty('showImage', false);
fire(page.preview, 'click', one(retiredToast, hasClass('copilot-toast-dismiss')));
fire(page.replay, 'click');
assert.equal(page.toast(), retiredToast);
assert.equal(page.preview.hidden, false);
assert.equal(page.notice.textContent, retiredNotice);
const reopened = fixture({ isEnglish: true });
assert.equal(reopened.toast().dataset.toastClass, 'feature');
assert.equal(reopened.toggle('wrap').checked, true);
assert.equal(reopened.toggle('showImage').checked, true);
assert.equal(reopened.replay.textContent, 'Replay');
reopened.destroy();
console.log('Passed: 19 variants, isolated preview properties, class defaults, Survey constraints, dismiss/replay focus, cleanup, and fresh reopen.');
