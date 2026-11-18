const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Exercise the cursor handler shipped to both locales. The DOM fixture only
// models closest() and the browser's normalized input.type property.
const inputTypes = new Set([
  'button', 'checkbox', 'color', 'date', 'datetime-local', 'email', 'file',
  'hidden', 'image', 'month', 'number', 'password', 'radio', 'range', 'reset',
  'search', 'submit', 'tel', 'text', 'time', 'url', 'week',
]);
class Element {
  constructor(tagName, attributes = {}, parentElement = null) {
    this.tagName = tagName.toUpperCase();
    this.attributes = attributes;
    this.parentElement = parentElement;
    if (this.tagName === 'INPUT') {
      const type = String(attributes.type || '').toLowerCase();
      this.type = inputTypes.has(type) ? type : 'text';
    }
  }
  closest(selector) {
    const selectors = selector.split(',').map(value => value.trim());
    for (let element = this; element; element = element.parentElement) {
      if (selectors.some(value => {
        const attribute = value.match(/^\[([\w-]+)=['"]([^'"]+)['"]\]$/);
        return attribute
          ? element.attributes[attribute[1]] === attribute[2]
          : element.tagName.toLowerCase() === value;
      })) return element;
    }
    return null;
  }
}

const source = fs.readFileSync(path.resolve(__dirname, '../_next/static/chunks/684-2a599787e13dd047.js'), 'utf8');
const cursorEffect = source.indexOf('document.querySelector(".cursor-fx")');
assert.notEqual(cursorEffect, -1, 'Expected the custom cursor effect');
const start = source.indexOf('a=t=>{', cursorEffect);
assert.notEqual(start, -1, 'Expected the shipped cursor hover handler');
const end = source.indexOf(',l=()=>{t=!1,n=!1,r=!1', start);
assert.notEqual(end, -1, 'Expected the cursor reset following its hover handler');
const classes = new Set();
const cursor = { classList: { toggle(name, enabled) { enabled ? classes.add(name) : classes.delete(name); } } };
const runtime = { Element, cursor };
vm.runInNewContext(`let n=false,r=false;const e=cursor;const handler=(${source.slice(start + 2, end)});this.hover=target=>handler({target});`, runtime);

function hover(target, text, link, message) {
  runtime.hover(target);
  assert.equal(classes.has('is-text'), text, `${message}: text cursor`);
  assert.equal(classes.has('is-link'), link, `${message}: clickable cursor`);
}

for (const type of ['text', 'search', 'email', 'url', 'tel', 'password', 'number', undefined, 'invalid', 'TEXT']) {
  hover(new Element('input', { type }), true, false, `Input ${type ?? 'without type'}`);
}
hover(new Element('textarea'), true, false, 'Textarea');
hover(new Element('span', {}, new Element('div', { contenteditable: 'true' })), true, false, 'Editable descendant');

for (const type of ['checkbox', 'radio', 'range', 'file', 'color', 'date', 'datetime-local', 'month', 'time', 'week', 'button', 'submit', 'reset', 'image']) {
  hover(new Element('input', { type: 'text' }), true, false, 'Previous text field');
  hover(new Element('input', { type }), false, true, `Input ${type}`);
}

// Moving onto the switch itself must retain the label's clickable cursor,
// while leaving controls or re-entering text fields clears stale modes.
const label = new Element('label');
const switchInput = new Element('input', { type: 'checkbox', role: 'switch' }, label);
hover(new Element('span', {}, label), false, true, 'Switch label');
hover(switchInput, false, true, 'Switch input');
hover(new Element('input', { type: 'text' }), true, false, 'Text field after switch');
hover(new Element('div'), false, false, 'Background after text field');
for (const role of ['switch', 'checkbox', 'radio', 'button']) {
  hover(new Element('div', { role }), false, true, `Custom ${role}`);
}
hover(new Element('div'), false, false, 'Background after control');
hover(switchInput, false, true, 'Switch before non-element target');
hover(null, false, true, 'Null target ignored');
hover({}, false, true, 'Non-element target ignored');

console.log('Passed: text fields, normalized input types, switch/control cursor modes, label transitions, background reset, and non-element targets.');
