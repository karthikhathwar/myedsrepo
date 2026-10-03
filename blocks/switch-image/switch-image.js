import { createOptimizedPicture } from '../../scripts/aem.js';

// author label rows in the DA table; removed before rendering
const LABELS = [
  'Section title',
  'Section description',
  'Tab title',
  'Desktop image',
  'Mobile image',
];

function removeLabelRows(block, labels) {
  const norm = (t) => t.replace(/\s*\([^)]*\)\s*$/, '').replace(/\s+/g, ' ').trim().toLowerCase();
  const known = new Set(labels.map(norm));
  [...block.children].forEach((row) => {
    if (row.querySelector('picture, img')) return;
    const texts = [...row.children].map((cell) => cell.textContent.trim()).filter(Boolean);
    if (texts.length && texts.every((t) => known.has(norm(t)))) row.remove();
  });
}

const DESKTOP_MQ = window.matchMedia('(width >= 992px)');

function optimize(picture, breakpoints) {
  const img = picture?.querySelector('img');
  if (!img) return null;
  // only media bus (same-origin) images support the optimization params
  if (new URL(img.src, window.location.href).origin !== window.location.origin) return picture;
  return createOptimizedPicture(img.src, img.alt, false, breakpoints);
}

function setActive(block, index) {
  block.querySelectorAll('.switch-image-item').forEach((item, i) => {
    const active = i === index;
    item.classList.toggle('active', active);
    item.querySelector('.switch-image-tab').setAttribute('aria-expanded', active);
  });
  block.querySelectorAll('.switch-image-stage > picture').forEach((pic, i) => {
    pic.classList.toggle('active', i === index);
  });
}

function buildHeader(cells) {
  const header = document.createElement('div');
  header.className = 'switch-image-header';
  cells.forEach((cell, i) => {
    if (cell.querySelector('h1, h2, h3, h4, h5, h6')) {
      header.append(...cell.childNodes);
      return;
    }
    const el = document.createElement(i === 0 ? 'h2' : 'p');
    el.textContent = cell.textContent.trim();
    header.append(el);
  });
  return header.children.length ? header : null;
}

/**
 * switch-image – migrated from the AEM "switch-image" component.
 * Desktop (>= 992px): tabs switch the large image above them.
 * Mobile/tablet (< 992px): accordion, the open item shows its image inline.
 *
 * Authoring (DA table):
 * Label rows (the LABELS above, e.g. "Section title") may sit above any row
 * to guide authors; they are removed before rendering.
 *
 * | switch-image                    |                    |                     |
 * | ------------------------------ | ------------------ | ------------------- |
 * | Container title                | Container          |                     |
 * | (e.g. "Benefits")              | description        |                     |
 * | Item title (tab / accordion    | Desktop image      | Mobile image        |
 * | label, plain text)             | (1440 x 545)       | (768 x 400)         |
 * | ...one row per item...         |                    |                     |
 *
 * - Row 1: block name only ("switch-image").
 * - Row 2 – Header (optional, no images): shown centered above the block.
 *   - Column 1 – Container title, rendered as an h2 (a heading authored
 *     here keeps its level). AEM dialog: ./containerTitle
 *   - Column 2 – Container description, rendered as a paragraph.
 *     AEM dialog: ./containerDesc
 *   - Both may also be authored in a single cell (heading + paragraph).
 * - Rows 3+ – Items (one row per tab / accordion item):
 *   - Column 1 – Title (required): text shown on the tab and accordion
 *     button. AEM dialog: ./stainTitle
 *   - Column 2 – Desktop image (required): large image shown above the tabs.
 *     Its alt text is used for accessibility. AEM dialog: ./desktopImagePath
 *   - Column 3 – Mobile image (optional): image shown inside the open
 *     accordion item on mobile/tablet; falls back to the desktop image.
 *     AEM dialog: ./mobileImagePath
 *   - Add or remove rows to change the number of items; the first is active.
 *
 * @param {Element} block
 */
export default function decorate(block) {
  removeLabelRows(block, LABELS);
  const stage = document.createElement('div');
  stage.className = 'switch-image-stage';

  const tabs = document.createElement('div');
  tabs.className = 'switch-image-tabs';

  const rows = [...block.children].filter((row) => row.textContent.trim() || row.querySelector('picture'));

  // optional header row: first row without images -> title + description
  let header;
  if (rows[0] && !rows[0].querySelector('picture')) {
    const cells = [...rows.shift().children].filter((cell) => cell.textContent.trim());
    header = buildHeader(cells);
  }

  rows.forEach((row, index) => {
    const cells = [...row.children];
    const titleCell = cells.find((cell) => !cell.querySelector('picture') && cell.textContent.trim());
    const pictures = [...row.querySelectorAll('picture')];
    const [desktopPic, mobilePic = desktopPic] = pictures;
    const id = `switch-image-${Math.random().toString(36).slice(2, 8)}-${index}`;

    const item = document.createElement('div');
    item.className = 'switch-image-item';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'switch-image-tab';
    button.setAttribute('aria-controls', `${id}-mobile ${id}-desktop`);
    const label = document.createElement('span');
    label.className = 'switch-image-label';
    label.textContent = titleCell ? titleCell.textContent.trim() : '';
    button.append(label);
    button.addEventListener('click', () => setActive(block, index));
    item.append(button);

    const mobile = optimize(mobilePic, [{ width: '768' }]);
    if (mobile) {
      const panel = document.createElement('div');
      panel.className = 'switch-image-mobile';
      panel.id = `${id}-mobile`;
      panel.append(mobile);
      item.append(panel);
    }

    const desktop = optimize(desktopPic, [{ media: '(width >= 992px)', width: '2000' }, { width: '992' }]);
    if (desktop) {
      desktop.id = `${id}-desktop`;
      stage.append(desktop);
    }

    tabs.append(item);
  });

  block.replaceChildren(...(header ? [header] : []), stage, tabs);
  if (rows.length) setActive(block, 0);

  // keep image stage accessible only where it is visible
  const syncStage = () => stage.setAttribute('aria-hidden', !DESKTOP_MQ.matches);
  syncStage();
  DESKTOP_MQ.addEventListener('change', syncStage);
}
