const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Small DOM fixture for state and lifecycle checks; actual layout is checked
// in the browser so this test does not encode CSS or screenshots.
const document = {};
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
  const reset = one(root, hasClass('toast-showcase-reset'));
  const toggle = key => one(root, element => element.tagName === 'input' && element.name === key);
  return {
    ...instance, root, preview, select, reset, toggle,
    toast: () => one(preview, hasClass('copilot-toast')),
    changeClass(value) { select.value = value; fire(select, 'change'); },
    changeProperty(key, checked) { const input = toggle(key); input.checked = checked; fire(input, 'change'); },
  };
}

const page = fixture();
const variants = all(page.root, element => Object.hasOwn(element.dataset, 'toastVariant'));
const retainedVariants = [
  'feature-wrap', 'podcast-hug', 'survey-hug', 'research-wrap', 'critical-wrap',
  'warning-wrap', 'inline-hug', 'info-single-hug', 'info-multi-wrap', 'settings-hug',
];
assert.equal(variants.length, 10);
assert.equal(new Set(variants.map(element => element.dataset.toastVariant)).size, 10);
assert.deepEqual(variants.map(element => element.dataset.toastVariant), retainedVariants);
assert.match(one(page.root, hasClass('toast-gallery-heading')).textContent, /10/);
assert.equal(page.preview.attributes.get('aria-label'), 'Toast 预览');

// The display has no replay, instructions, or action feedback. Only the
// properties panel contains controls; every toast remains a static sample.
for (const name of ['toast-preview-toolbar', 'toast-showcase-button', 'toast-preview-empty', 'toast-preview-notice']) {
  assert.equal(all(page.root, hasClass(name)).length, 0, `${name} should not be rendered`);
}
const heading = one(page.root, hasClass('toast-showcase-heading'));
assert.equal(all(heading, element => element.tagName === 'p').length, 0);
for (const toast of all(page.root, hasClass('copilot-toast'))) {
  assert.equal(all(toast, element => ['button', 'a', 'input', 'select', 'textarea'].includes(element.tagName)
    || element.attributes.has('tabindex') || element.attributes.get('role') === 'button'
    || Object.hasOwn(element.dataset, 'toastAction') || Object.hasOwn(element.dataset, 'toastDismiss')).length, 0);
}

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
// Choosing one gallery sample per class must not constrain the preview's
// independent wrap control, including classes whose retained sample is hug.
for (const preset of ['podcast', 'inline']) {
  page.changeClass(preset);
  assert.equal(page.toggle('wrap').disabled, false);
  page.changeProperty('wrap', false);
  assert.equal(page.toast().dataset.wrap, 'false');
  page.changeProperty('wrap', true);
  assert.equal(page.toast().dataset.wrap, 'true');
}
assert.deepEqual(variants.map(element => element.dataset.toastVariant), retainedVariants);
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

// Reset restores the first class. Clicking either visual control, including
// the nested dismiss icon, cannot alter or dismiss the preview.
fire(page.reset, 'click');
assert.equal(page.select.value, 'feature');
assert.equal(page.toggle('wrap').checked, true);
assert.equal(page.toggle('showImage').checked, true);
const action = one(page.toast(), hasClass('copilot-toast-action'));
const staticToast = page.toast();
const staticText = page.root.textContent;
assert.equal(action.tagName, 'span');
fire(action, 'click');
fire(page.preview, 'click', action);
const dismiss = one(page.toast(), hasClass('copilot-toast-dismiss'));
assert.equal(dismiss.tagName, 'span');
fire(dismiss, 'click');
fire(page.preview, 'click', dismiss.firstElementChild);
assert.equal(page.preview.hidden, false);
assert.equal(page.toast(), staticToast);
assert.equal(page.root.textContent, staticText);

// Turning off all content leaves a blank stage without status wording, and
// the properties panel can bring the sample back.
for (const key of ['showImage', 'showIcon', 'showTitle', 'showDescription', 'showButton', 'showDismiss']) {
  page.changeProperty(key, false);
}
assert.equal(page.preview.hidden, true);
assert.equal(page.toast().textContent, '');
page.changeProperty('showTitle', true);
assert.equal(page.preview.hidden, false);
assert.equal(all(page.toast(), hasClass('copilot-toast-title')).length, 1);

// A closed reader must leave no active showcase handlers, and opening another
// reader constructs an independent initial state rather than restoring edits.
page.changeClass('podcast');
page.changeProperty('showImage', false);
const retiredToast = page.toast();
page.destroy();
page.destroy();
page.changeClass('critical');
page.changeProperty('showImage', false);
fire(page.preview, 'click', one(retiredToast, hasClass('copilot-toast-dismiss')));
fire(page.reset, 'click');
assert.equal(page.toast(), retiredToast);
assert.equal(page.preview.hidden, false);
const reopened = fixture({ isEnglish: true });
assert.equal(reopened.toast().dataset.toastClass, 'feature');
assert.equal(reopened.toggle('wrap').checked, true);
assert.equal(reopened.toggle('showImage').checked, true);
assert.equal(reopened.preview.attributes.get('aria-label'), 'Toast preview');
assert.equal(reopened.reset.textContent, 'Reset');
assert.doesNotMatch(reopened.root.textContent, /Interactive preview|Replay|Notification (?:shown|dismissed)|Turn on a property/);
reopened.destroy();
console.log('Passed: 10 selected static variants, unrestricted preview wrap controls, property-only changes, class defaults, Survey constraints, blank/restore, cleanup, and fresh reopen.');
