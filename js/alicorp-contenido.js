/* Se carga en contenido.html y en las tres páginas de negocio.
   Cuando la página se muestra dentro del marco de index.html, avisa a la página
   principal de su alto y de la posición de sus secciones. Si se abre sola, no hace nada. */
(() => {
  'use strict';
  if (window.parent === window) return;

  document.documentElement.classList.add('en-marco');
  const page = location.pathname.split('/').pop() || 'index.html';
  let lastKey = '';

  function report() {
    const height = Math.ceil(document.body.getBoundingClientRect().height);
    const sections = {};
    document.querySelectorAll('section[id]').forEach(section => {
      sections[section.id] = Math.round(section.getBoundingClientRect().top + window.scrollY);
    });
    const key = page + '|' + height + '|' + JSON.stringify(sections);
    if (key === lastKey) return;
    lastKey = key;
    window.parent.postMessage({ type: 'alicorp:layout', page, height, sections }, '*');
  }

  let queued = false;
  const schedule = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; report(); });
  };

  // Los enlaces internos (#sección) los resuelve la página principal.
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    const id = link ? link.getAttribute('href').slice(1) : '';
    if (!id) return;
    event.preventDefault();
    window.parent.postMessage({ type: 'alicorp:goto', id }, '*');
  });

  if ('ResizeObserver' in window) new ResizeObserver(schedule).observe(document.body);
  window.addEventListener('resize', schedule);
  window.addEventListener('load', schedule);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);
  schedule();
})();
