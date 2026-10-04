(() => {
  const canvas = document.querySelector('.flow-canvas');
  const stage = document.querySelector('.flow-stage');
  const context = canvas.getContext('2d');
  if (!context) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const colors = ['108,229,255', '203,164,255', '140,255,188'];
  const pointer = { x: -1000, y: -1000, active: false };
  let width = 0;
  let height = 0;
  let frame = 0;
  let visible = true;
  let phase = 0;
  let previousTime = 0;
  let glow = 0;

  function lineY(x, line) {
    const position = x / width;
    const spread = Math.pow(Math.abs(position - .5) * 2, .72);
    const wave = Math.sin(position * Math.PI * 4 + line * .42 + phase) * height * .12;
    return height * .5 + ((line - 17.5) * height * .019 + wave) * spread;
  }

  function drawLine(line) {
    context.beginPath();
    context.strokeStyle = `rgba(205,230,139,${line % 5 === 0 ? .38 : .16})`;
    context.lineWidth = line % 5 === 0 ? 1.2 : .7;
    for (let point = 0; point <= 100; point++) {
      const x = width * point / 100;
      const y = lineY(x, line);
      if (point === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.stroke();
    if (glow < .01) return;

    // Draw only nearby segments, so color follows the pointer along each string.
    const radius = Math.min(190, width * .35);
    const color = colors[line % colors.length];
    for (let point = 0; point < 100; point++) {
      const x = width * point / 100;
      const y = lineY(x, line);
      const distance = Math.hypot(x - pointer.x, y - pointer.y);
      const strength = Math.pow(Math.max(0, 1 - distance / radius), 2) * glow;
      if (strength < .015) continue;
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(width * (point + 1) / 100, lineY(width * (point + 1) / 100, line));
      context.strokeStyle = `rgba(${color},${strength})`;
      context.lineWidth = 1.7;
      context.shadowBlur = 12 * strength;
      context.shadowColor = `rgb(${color})`;
      context.stroke();
    }
    context.shadowBlur = 0;
  }

  function draw() {
    context.clearRect(0, 0, width, height);
    for (let line = 0; line < 36; line++) drawLine(line);
    for (let node = 0; node < 10; node++) {
      const x = width * (.07 + ((node * .097 + phase * .014) % .86));
      const y = lineY(x, node * 3 + 3);
      const gradient = context.createRadialGradient(x, y, 0, x, y, 16);
      gradient.addColorStop(0, 'rgba(231,255,170,.4)');
      gradient.addColorStop(1, 'rgba(231,255,170,0)');
      context.fillStyle = gradient;
      context.beginPath(); context.arc(x, y, 16, 0, Math.PI * 2); context.fill();
      context.fillStyle = '#e3f6af';
      context.beginPath(); context.arc(x, y, node % 3 === 0 ? 3.3 : 2, 0, Math.PI * 2); context.fill();
    }
  }

  function animate(time) {
    frame = 0;
    const elapsed = previousTime ? Math.min(time - previousTime, 40) : 16;
    previousTime = time;
    phase += elapsed * .00012;
    glow += ((pointer.active ? 1 : 0) - glow) * (1 - Math.exp(-elapsed / 120));
    draw();
    frame = requestAnimationFrame(animate);
  }

  function syncAnimation() {
    cancelAnimationFrame(frame);
    frame = 0;
    previousTime = 0;
    if (visible && !document.hidden && !reducedMotion.matches) frame = requestAnimationFrame(animate);
    else draw();
  }

  function resize() {
    width = stage.clientWidth;
    height = stage.clientHeight;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    draw();
  }

  stage.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch') return;
    const bounds = stage.getBoundingClientRect();
    pointer.x = event.clientX - bounds.left;
    pointer.y = event.clientY - bounds.top;
    pointer.active = true;
    if (reducedMotion.matches) { glow = 1; draw(); }
  });
  stage.addEventListener('pointerleave', () => {
    pointer.active = false;
    if (reducedMotion.matches) { glow = 0; draw(); }
  });
  reducedMotion.addEventListener('change', syncAnimation);
  document.addEventListener('visibilitychange', syncAnimation);
  new ResizeObserver(resize).observe(stage);
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    syncAnimation();
  }).observe(stage);
  resize();
  syncAnimation();
})();
