/* Interacciones añadidas; no sustituye js/app.js. */
(() => {
  'use strict';
  const cards = Array.from(document.querySelectorAll('.product-item'));
  const searchForm = document.getElementById('product-search-form');
  const searchInput = document.getElementById('product-search-input');
  const resultMessage = document.getElementById('product-results');
  const emptyMessage = document.getElementById('product-empty');
  const filters = Array.from(document.querySelectorAll('.category-filter'));
  let activeFilter = 'all';

  // Permite buscar «Amarás»/«amaras» y «Bolívar»/«bolivar» por igual.
  const normalizeSearch = value => String(value || '').normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim();
  function updateProducts() {
    const query = normalizeSearch(searchInput?.value);
    let visible = 0;
    cards.forEach(card => {
      // No indexar el texto de botones ni la ficha pendiente oculta.
      const searchableText = [card.dataset.name, card.dataset.categoryLabel,
        card.querySelector('h3')?.textContent,
        card.querySelector('.product-card > p:not(.brand-detail)')?.textContent].join(' ');
      const matchesText = normalizeSearch(searchableText).includes(query);
      const matchesCategory = activeFilter === 'all' || card.dataset.category === activeFilter;
      const show = matchesText && matchesCategory;
      card.hidden = !show;
      if (show) visible += 1;
    });
    if (resultMessage) resultMessage.textContent = `Se muestran ${visible} ${visible === 1 ? 'marca' : 'marcas'}.`;
    if (emptyMessage) emptyMessage.hidden = visible !== 0;
  }
  searchInput?.addEventListener('input', updateProducts);
  searchForm?.addEventListener('submit', event => { event.preventDefault(); updateProducts(); searchInput?.focus(); });
  filters.forEach(button => button.addEventListener('click', () => {
    activeFilter = button.dataset.filter || 'all';
    filters.forEach(item => { const selected = item === button; item.classList.toggle('active', selected); item.setAttribute('aria-pressed', String(selected)); });
    updateProducts();
  }));
  document.querySelectorAll('.brand-more').forEach(button => button.addEventListener('click', () => {
    const detail = button.parentElement?.querySelector('.brand-detail');
    if (!detail) return;
    const expanded = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', String(!expanded)); button.textContent = expanded ? 'Ver más' : 'Ver menos'; detail.hidden = expanded;
  }));

  const form = document.getElementById('contact-form');
  const status = document.getElementById('contact-status');
  const fields = [
    { id:'contact-name', errorId:'contact-name-error', validate:v => v.trim().length >= 2 ? '' : 'Escribe al menos 2 caracteres.' },
    { id:'contact-email', errorId:'contact-email-error', validate:v => { const s=v.trim(); const at=s.indexOf('@'); const dot=s.lastIndexOf('.'); return at>0 && dot>at+1 && dot<s.length-1 && !s.includes(' ') ? '' : 'Escribe un correo electrónico válido.' } },
    { id:'contact-subject', errorId:'contact-subject-error', validate:v => v ? '' : 'Selecciona un asunto.' },
    { id:'contact-message', errorId:'contact-message-error', validate:v => v.trim().length >= 10 ? '' : 'Escribe un mensaje de al menos 10 caracteres.' }
  ];
  function validateField(field) {
    const input = document.getElementById(field.id); const error = document.getElementById(field.errorId);
    if (!input || !error) return true;
    const message = field.validate(input.value); error.textContent = message; input.setAttribute('aria-invalid', String(Boolean(message))); return !message;
  }
  fields.forEach(field => document.getElementById(field.id)?.addEventListener('blur', () => validateField(field)));
  const subjectField = fields.find(field => field.id === 'contact-subject');
  document.getElementById('contact-subject')?.addEventListener('change', () => validateField(subjectField));
  form?.addEventListener('submit', async event => {
    event.preventDefault();
    const valid = fields.map(validateField).every(Boolean);
    if (!status) return;
    status.classList.remove('is-success', 'is-error');
    if (!valid) {
      status.textContent = 'Revisa los campos señalados.';
      status.classList.add('is-error');
      form.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }

    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    status.textContent = 'Guardando mensaje...';
    try {
      const response = await fetch('/api/contacto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: document.getElementById('contact-name').value.trim(),
          email: document.getElementById('contact-email').value.trim(),
          asunto: document.getElementById('contact-subject').value,
          mensaje: document.getElementById('contact-message').value.trim()
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'No se pudo guardar el mensaje.');
      status.textContent = 'Mensaje guardado correctamente en datos/contactos.xlsx.';
      status.classList.add('is-success');
      form.reset();
      fields.forEach(field => {
        const input = document.getElementById(field.id);
        const error = document.getElementById(field.errorId);
        if (input) input.removeAttribute('aria-invalid');
        if (error) error.textContent = '';
      });
    } catch (error) {
      status.textContent = error.message || 'Error al guardar el mensaje.';
      status.classList.add('is-error');
    } finally {
      button.disabled = false;
    }
  });
  updateProducts();
})();
