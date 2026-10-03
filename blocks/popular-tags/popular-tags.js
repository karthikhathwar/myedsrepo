// author label rows in the DA table; removed before rendering
const LABELS = [
  'Section title',
  'Tag link',
];

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
 * | popular-tags                                |
 * | ------------------------------------------- |
 * | Section title                               |  <- label row (optional)
 * | Related Products                            |
 * | Tag link                                    |  <- label row (optional)
 * | [Apcolite All Protek Matte](https://…)      |
 * | [Interior Waterproofing Solutions](https://…) |
 * | ...one row per tag...                       |
 *
 * - Row 1: block name only ("popular-tags").
 * - Section title (optional): first row without a link, rendered as an h3,
 *   e.g. "Related Products". AEM: Title component above the tags.
 * - Tag rows: one link per row; the link text is the tag label (shown in
 *   capitals) and the link URL is where it goes. A row may also hold several
 *   links (e.g. a bulleted list of links). AEM: popular tags (label + link).
 * - Label rows ("Section title", "Tag link") guide authors and are removed
 *   before rendering.
 *
 * @param {Element} block
 */
export default function decorate(block) {
  removeLabelRows(block, LABELS);
  const rows = [...block.children].filter((row) => row.textContent.trim());

  let title;
  if (rows[0] && !rows[0].querySelector('a')) {
    const cell = [...rows.shift().children].find((c) => c.textContent.trim());
    title = cell?.querySelector('h1, h2, h3, h4, h5, h6') || el('h3', '', cell?.textContent.trim());
    title.classList.add('popular-tags-title');
  }

  const list = el('ul', 'popular-tags-list');
  rows.forEach((row) => {
    row.querySelectorAll('a').forEach((a) => {
      const label = a.textContent.trim();
      if (!label || !a.href) return;
      const link = el('a', 'popular-tags-link', label);
      link.href = a.href;
      if (a.target) link.target = a.target;
      const item = el('li', 'popular-tags-item');
      item.append(link);
      list.append(item);
    });
  });

  block.replaceChildren(...(title ? [title] : []), list);
}
