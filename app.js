const projects = [...document.querySelectorAll('.project')];
const filterButtons = [...document.querySelectorAll('[data-filter]')];

const imageDialog = document.querySelector('#image-dialog');
document.querySelectorAll('[data-image-popup]').forEach((trigger) => {
  trigger.addEventListener('click', (event) => {
    event.preventDefault();
    const image = trigger.querySelector('img');
    const preview = imageDialog.querySelector('img');
    preview.src = image.src;
    preview.alt = image.alt;
    preview.classList.toggle('portrait', Boolean(trigger.closest('.team-avatar')));
    imageDialog.querySelector('figcaption').textContent = trigger.closest('figure')?.querySelector('figcaption')?.textContent || image.alt;
    imageDialog.showModal();
  });
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
