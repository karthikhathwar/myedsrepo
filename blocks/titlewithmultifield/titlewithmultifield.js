export default function decorate(block) {
  const rows = [...block.children];

  if (rows.length < 3) return;

  const headingRow = rows.shift();
  const disclaimerRow = rows.pop();

  const headingText =
    headingRow.children[0]?.textContent.trim() || '';

  const wrapper = document.createElement('div');
  wrapper.classList.add('pack-sizes');

  const heading = document.createElement('h2');
  heading.classList.add('pack-sizes__heading');
  heading.textContent = headingText;

  wrapper.appendChild(heading);

  const cardsContainer = document.createElement('div');
  cardsContainer.classList.add('pack-sizes__cards');

  rows.forEach((row) => {
    const cols = [...row.children];

    const image = cols[0]?.querySelector('picture');
    const size = cols[1]?.textContent.trim() || '';
    const price = cols[2]?.textContent.trim() || '';
    const tax = cols[3]?.textContent.trim() || '';

    const card = document.createElement('div');
    card.classList.add('pack-sizes__card');

    if (size === '1 L') {
      card.classList.add('size-1');
    } else if (size === '4 L') {
      card.classList.add('size-4');
    } else if (size === '10 L') {
      card.classList.add('size-10');
    } else if (size === '20 L') {
      card.classList.add('size-20');
    }

    const imageWrapper = document.createElement('div');
    imageWrapper.classList.add('pack-sizes__image');

    if (image) {
      imageWrapper.appendChild(image.cloneNode(true));
    }

    const sizeLabel = document.createElement('div');
    sizeLabel.classList.add('pack-sizes__size');
    sizeLabel.textContent = size;

    imageWrapper.appendChild(sizeLabel);

    const priceEl = document.createElement('div');
    priceEl.classList.add('pack-sizes__price');
    priceEl.textContent = price;

    const taxEl = document.createElement('div');
    taxEl.classList.add('pack-sizes__tax');
    taxEl.textContent = tax;

    card.append(
      imageWrapper,
      priceEl,
      taxEl,
    );

    cardsContainer.appendChild(card);
  });

  wrapper.appendChild(cardsContainer);

  const note = document.createElement('div');
  note.classList.add('pack-sizes__note');
  note.textContent =
    disclaimerRow.children[0]?.textContent.trim() || '';

  wrapper.appendChild(note);

  block.innerHTML = '';
  block.appendChild(wrapper);
}