const OPTION_RESTRICTED = /\b(restricted|login(\s+required)?)\b/i;
const OPTION_NEW_TAB = /\bnew\s*tab\b/i;

/**
 * Opens the file in a new tab. If the browser blocks the tab (no click to
 * open it from), a "ready" link is shown instead.
 */
function openInNewTab(href, block) {
  // no 'noopener' feature: it makes window.open return null even on success
  const win = window.open(href, '_blank');
  if (win) {
    win.opener = null;
    return;
  }
  if (!block || block.querySelector('.cta-ready')) return;
  const ready = document.createElement('p');
  ready.className = 'cta-ready';
  ready.setAttribute('role', 'status');
  const link = document.createElement('a');
  link.href = href;
  link.target = '_blank';
  link.rel = 'noopener';
  link.textContent = 'Your download is ready – open it';
  ready.append(link);
  block.append(ready);
}

/**
 * Login-gated link (AEM data-attr-isrestricted): signed-in visitors get the
 * file in a new tab; others sign in through the header's login and are then
 * taken to the file.
 */
function gate(link, block) {
  link.dataset.restricted = 'true';
  link.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      const { isUserLoggedIn, startLogin } = await import('../header/header.js');
      if (isUserLoggedIn()) openInNewTab(link.href, block);
      else await startLogin(link.href);
    } catch {
      // login unavailable: don't leave a dead button
      openInNewTab(link.href, block);
    }
  });
}

function buildButton(row, block) {
  const cells = [...row.children];
  const linkCell = cells.find((cell) => cell.querySelector('a'));
  const link = linkCell?.querySelector('a');
  if (!link) return null;

  const options = cells.filter((cell) => cell !== linkCell).map((cell) => cell.textContent).join(' ');
  const restricted = OPTION_RESTRICTED.test(options);
  const newTab = restricted || OPTION_NEW_TAB.test(options);

  const label = link.textContent.trim();
  link.className = 'cta-button';
  link.textContent = label;
  if (newTab) {
    link.target = '_blank';
    link.rel = 'noopener';
    link.setAttribute('aria-label', `${label} (opens in a new tab)`);
  }
  if (restricted) gate(link, block);
  return link;
}

/**
 * cta – migrated from the AEM "cta" component (ctaComp): a centered call to
 * action button, optionally login-restricted (e.g. "Download Catalogue").
 *
 * Authoring (DA table):
 *
 * | cta                                          |              |
 * | -------------------------------------------- | ------------ |
 * | [Download Catalogue](https://…/catalogue.pdf) | Restricted   |
 * | ...optional: one row per extra button...      |              |
 *
 * - Row 1: block name, optionally with variants: "cta (filled)",
 *   "cta (left)", "cta (right)", "cta (filled, left)".
 *   - outline (default): white button, purple border and text (AEM whiteBtn)
 *   - filled: purple button with white text
 *   - left / right: alignment (default centered)
 * - Rows 2+ – one button per row:
 *   - Column 1 – Link (required): the button label is the link text, the
 *     target is the link URL (page or file, e.g. the catalogue PDF). Use the
 *     full URL (https://www.asianpaints.com/...) for files on asianpaints.com.
 *     AEM: CTA title + link / restricted path
 *   - Column 2 – Options (optional), any of:
 *     - "Restricted": login required (AEM: isRestricted). Signed-in visitors
 *       get the file in a new tab; others are sent through the header's
 *       Keycloak login (blocks/header/header.js) and, once signed in, the
 *       header takes them to the file. If the login can't start, the file
 *       opens directly.
 *     - "New tab": open the link in a new tab.
 *
 * @param {Element} block
 */
export default function decorate(block) {
  const buttons = [...block.children].map((row) => buildButton(row, block)).filter(Boolean);
  const wrap = document.createElement('div');
  wrap.className = 'cta-buttons';
  wrap.append(...buttons);
  block.replaceChildren(wrap);
}
