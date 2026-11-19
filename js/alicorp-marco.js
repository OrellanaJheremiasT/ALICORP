/* index.html: muestra contenido.html (o una página de negocio) entre el encabezado y el pie,
   lleva a la sección elegida en el menú y marca la opción activa. */
(() => {
  'use strict';
  const frame = document.getElementById('contenido');
  const navbar = document.querySelector('.navbar');
  const collapseEl = document.getElementById('navbarNav');
  const navLinks = Array.from(document.querySelectorAll('.navbar .nav-link'));
  const CONTENT = 'contenido.html';

  let currentPage = null;
  let lastPage = null;
  let sections = {};
  let pending = location.hash.slice(1) || null;   // sección a mostrar cuando cargue el contenido
  let ticking = false;

  const idOf = link => (link.getAttribute('href') || '').split('#')[1] || '';
  const frameTop = () => frame.getBoundingClientRect().top + window.scrollY;
  const navHeight = () => {
    // Si el menú móvil está desplegado, se descuenta: se cierra al elegir una opción.
    const open = collapseEl && collapseEl.classList.contains('show') ? collapseEl.offsetHeight : 0;
    return navbar.offsetHeight - open;
  };

  function scrollToSection(id) {
    const top = id in sections ? sections[id] : 0;
    window.scrollTo({ top: Math.max(0, frameTop() + top - navHeight() - 16), behavior: 'smooth' });
  }

  function scrollToFrameStart() {
    window.scrollTo({ top: Math.max(0, frameTop() - navHeight()), behavior: 'smooth' });
  }

  function goTo(id) {
    if (history.replaceState) history.replaceState(null, '', '#' + id);
    if (currentPage === CONTENT) {
      pending = null;
      scrollToSection(id);
    } else {
      pending = id;                       // viene de una página de negocio: se vuelve a cargar contenido.html
      frame.src = CONTENT;
    }
  }

  function updateActive() {
    ticking = false;
    let activeId = '';
    if (currentPage && currentPage !== CONTENT) {
      activeId = 'negocios';              // consumo-masivo / soluciones-b2b / acuicultura pertenecen a Negocios
    } else if (currentPage === CONTENT) {
      const rel = window.scrollY + navHeight() + 40 - frameTop();
      let best = -Infinity;
      navLinks.forEach(link => {
        const id = idOf(link);
        if (id in sections && sections[id] <= rel && sections[id] > best) { best = sections[id]; activeId = id; }
      });
    }
    navLinks.forEach(link => {
      const on = activeId !== '' && idOf(link) === activeId;
      link.classList.toggle('active', on);
      if (on) link.setAttribute('aria-current', 'true'); else link.removeAttribute('aria-current');
    });
  }
  const requestActive = () => { if (!ticking) { ticking = true; requestAnimationFrame(updateActive); } };

  // Menú y pie: siempre muestran contenido.html y van a la sección elegida.
  document.querySelectorAll('a[href^="contenido.html#"]').forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      goTo(idOf(link));
      if (collapseEl && collapseEl.classList.contains('show') && window.bootstrap) {
        window.bootstrap.Collapse.getOrCreateInstance(collapseEl).hide();
      }
    });
  });

  window.addEventListener('message', event => {
    if (event.source !== frame.contentWindow || !event.data) return;
    const data = event.data;

    if (data.type === 'alicorp:goto' && typeof data.id === 'string') { goTo(data.id); return; }
    if (data.type !== 'alicorp:layout') return;

    currentPage = data.page;
    sections = data.sections || {};
    frame.style.height = data.height + 'px';

    if (currentPage === CONTENT && pending !== null) {
      const id = pending; pending = null;
      requestAnimationFrame(() => scrollToSection(id));
    } else if (currentPage !== lastPage && lastPage !== null) {
      requestAnimationFrame(scrollToFrameStart);   // se abrió otra página en el marco: mostrarla desde arriba
    }
    lastPage = currentPage;
    requestActive();
  });

  window.addEventListener('scroll', requestActive, { passive: true });
  window.addEventListener('resize', requestActive);
})();
