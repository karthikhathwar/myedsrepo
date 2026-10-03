// author label rows in the DA table; removed before rendering
const LABELS = [
  'Section title',
  'Tag label',
  'Tag link',
];

const URL_TEXT = /^(https?:\/\/|\/)\S+$/i;

// URL of a cell holding only a URL (a link whose text is the URL, or plain text)
function urlOf(cell) {
  const text = cell.textContent.trim();
  if (!URL_TEXT.test(text)) return '';
  const a = cell.querySelector('a');
  return a ? a.href : new URL(text, window.location.href).href;
}

/**
 * Tags in a row. Column layout: "Tag label | Tag link (URL)". Also accepts
 * linked labels ("[Label](URL)"), one or several per row.
 */
function tagsOf(row) {
  const cells = [...row.children];
  const urlCell = cells.find(urlOf);
  if (urlCell) {
    const labelCell = cells.find((cell) => cell !== urlCell && cell.textContent.trim());
    const label = labelCell?.textContent.trim();
    return label ? [{ label, href: urlOf(urlCell) }] : [];
  }
  return [...row.querySelectorAll('a')]
    .map((a) => ({ label: a.textContent.trim(), href: a.href, target: a.target }))
    .filter((t) => t.label && t.href);
}

function removeLabelRows(block, labels) {
  const norm = (t) => t.replace(/\s*\([^)]*\)\s*$/, '').replace(/\s+/g, ' ').trim().toLowerCase();
  const known = new Set(labels.map(norm));
  [...block.children].forEach((row) => {
    if (row.querySelector('a, picture, img')) return;
    const texts = [...row.children].map((cell) => cell.textContent.trim()).filter(Boolean);
    if (texts.length && texts.every((t) => known.has(norm(t)))) row.remove();
  });
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

/**
 * popular-tags – migrated from the AEM "popularTags" component (with its
 * "title" heading): a section title and a wrapping row of tag-style links,
 * e.g. "Related Products".
 *
 * Authoring (DA table):
 *
 * | popular-tags              |                      |
 * | ------------------------- | -------------------- |
 * | Section title             |                      |  <- label row (optional)
 * | Related Products          |                      |
 * | Tag label                 | Tag link             |  <- label row (optional)
 * | Apcolite All Protek Matte | https://www.asian... |
 * | ...one row per tag...     |                      |
 *
 * - Row 1: block name only ("popular-tags").
 * - Section title (optional): first row without a tag, rendered as an h3,
 *   e.g. "Related Products". AEM: Title component above the tags.
 * - Tag rows (one per tag):
 *   - Column 1 – Tag label: text shown on the tag (in capitals).
 *   - Column 2 – Tag link: page the tag opens (URL as plain text or a link).
 *   AEM: popular tags (label + link). A linked label ("[Label](URL)") in a
 *   single cell also works, one or several per row.
 * - Label rows ("Section title", "Tag label | Tag link") guide authors and
 *   are removed before rendering.
 *
 * @param {Element} block
 */
export default function decorate(block) {
  removeLabelRows(block, LABELS);
  const rows = [...block.children].filter((row) => row.textContent.trim());

  let title;
  if (rows[0] && !tagsOf(rows[0]).length) {
    const cell = [...rows.shift().children].find((c) => c.textContent.trim());
    title = cell?.querySelector('h1, h2, h3, h4, h5, h6') || el('h3', '', cell?.textContent.trim());
    title.classList.add('popular-tags-title');
  }

  const list = el('ul', 'popular-tags-list');
  rows.forEach((row) => {
    tagsOf(row).forEach(({ label, href, target }) => {
      const link = el('a', 'popular-tags-link', label);
      link.href = href;
      if (target) link.target = target;
      const item = el('li', 'popular-tags-item');
      item.append(link);
      list.append(item);
    });
  });

  block.replaceChildren(...(title ? [title] : []), list);
}
