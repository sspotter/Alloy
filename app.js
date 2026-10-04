const projects = [...document.querySelectorAll('.project')];
const filterButtons = [...document.querySelectorAll('[data-filter]')];

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
