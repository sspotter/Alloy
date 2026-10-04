const projects = [...document.querySelectorAll('.project')];
const filterButtons = [...document.querySelectorAll('[data-filter]')];

const imageDialog = document.querySelector('#image-dialog');
let popupImages = [];
let popupIndex = 0;

function showPopupImage() {
  const trigger = popupImages[popupIndex];
  const image = trigger.querySelector('img');
  const preview = imageDialog.querySelector('img');
  preview.src = image.src;
  preview.alt = image.alt;
  preview.classList.toggle('portrait', Boolean(trigger.closest('.team-avatar')));
  imageDialog.querySelector('figcaption').textContent = trigger.closest('figure')?.querySelector('figcaption')?.textContent || image.alt;
  imageDialog.querySelector('.popup-count').textContent = `${popupIndex + 1} / ${popupImages.length}`;
  imageDialog.querySelector('.image-frame').classList.toggle('single-image', popupImages.length === 1);
  imageDialog.querySelectorAll('[data-popup-step]').forEach(button => { button.hidden = popupImages.length < 2; });
}

function stepPopupImage(step) {
  popupIndex = (popupIndex + step + popupImages.length) % popupImages.length;
  showPopupImage();
}

document.querySelectorAll('[data-image-popup]').forEach((trigger) => {
  trigger.addEventListener('click', (event) => {
    event.preventDefault();
    const group = trigger.closest('[data-gallery]') || trigger.closest('.team-grid');
    popupImages = group ? [...group.querySelectorAll('[data-image-popup]')] : [trigger];
    popupIndex = popupImages.indexOf(trigger);
    showPopupImage();
    imageDialog.showModal();
  });
});
imageDialog.querySelectorAll('[data-popup-step]').forEach(button => {
  button.addEventListener('click', () => stepPopupImage(Number(button.dataset.popupStep)));
});
imageDialog.addEventListener('keydown', (event) => {
  if (popupImages.length < 2 || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
  event.preventDefault();
  stepPopupImage(event.key === 'ArrowLeft' ? -1 : 1);
});
imageDialog.querySelector('[data-close-image]').addEventListener('click', () => imageDialog.close());
imageDialog.addEventListener('click', (event) => {
  if (event.target !== imageDialog) return;
  const bounds = imageDialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) imageDialog.close();
});

document.querySelectorAll('[data-project-total]').forEach((total) => {
  total.textContent = projects.length;
});

document.querySelectorAll('[data-gallery]').forEach((gallery) => {
  const slides = [...gallery.querySelectorAll('[data-gallery-slide]')];
  const controls = gallery.querySelector('.gallery-controls');
  if (!controls) return;
  controls.hidden = false;
  let current = 0;
  gallery.querySelectorAll('[data-gallery-step]').forEach((button) => {
    button.addEventListener('click', () => {
      slides[current].hidden = true;
      current = (current + Number(button.dataset.galleryStep) + slides.length) % slides.length;
      slides[current].hidden = false;
      gallery.querySelector('.gallery-count').textContent = `${current + 1} / ${slides.length}`;
    });
  });
});

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const category = button.dataset.filter;
    filterButtons.forEach((item) => {
      const selected = item === button;
      item.classList.toggle('active', selected);
      item.setAttribute('aria-pressed', String(selected));
    });
    projects.forEach((project) => {
      project.hidden = category !== 'all' && project.dataset.category !== category;
    });
    const count = projects.filter((project) => !project.hidden).length;
    document.querySelector('.work-count').textContent = `Showing ${count} project${count === 1 ? '' : 's'}`;
  });
});

document.querySelectorAll('[data-expand]').forEach((button) => {
  button.addEventListener('click', () => {
    const details = document.getElementById(button.getAttribute('aria-controls'));
    const expanded = details.hidden;
    details.hidden = !expanded;
    document.querySelectorAll(`[data-expand="${button.dataset.expand}"]`).forEach((control) => {
      control.setAttribute('aria-expanded', String(expanded));
    });
  });
});
