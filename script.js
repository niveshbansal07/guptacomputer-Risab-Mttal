/* Gupta Computers — Interactions (vanilla JS)
 - Mobile nav toggle and sticky shrink
 - Smooth scroll for internal links
 - Service enquire prefill and docs checklist integration
 - Contact form client-side validation and simulated submission
 - Toast notifications, copy-to-clipboard, mailto fallback
 - Accessible accordion (native <details>) and printable summary modal
 - Simple fade-up on-scroll animations (reduced-motion aware)
*/

(function () {
  const qs = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));

  // Sticky header shrink
  const header = qs('.site-header');
  const onScroll = () => {
    if (window.scrollY > 8) header.classList.add('shrink');
    else header.classList.remove('shrink');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile nav toggle
  const navToggle = qs('.nav-toggle');
  const nav = qs('#site-nav');
  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
    // Close on link click
    qsa('a[href^="#"]', nav).forEach((a) => a.addEventListener('click', () => {
      nav.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    }));
  }

  // Smooth scroll enhancement is native via CSS; ensure focus after scroll
  qsa('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      if (!id || id === '#') return;
      const target = qs(id);
      if (!target) return;
      // allow default smooth scroll; then move focus
      setTimeout(() => target.setAttribute('tabindex', '-1'), 0);
      setTimeout(() => target.focus({ preventScroll: true }), 400);
    });
  });

  // Fade-up on-scroll animations
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const obs = new IntersectionObserver((entries, ob) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('_visible');
          ob.unobserve(entry.target);
        }
      }
    }, { threshold: 0.14 });
    qsa('[data-animate]').forEach((el) => obs.observe(el));
  } else {
    qsa('[data-animate]').forEach((el) => el.classList.add('_visible'));
  }

  // Toast helper
  const toastEl = qs('#toast');
  let toastTimer; 
  function showToast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toastEl.hidden = true), 3500);
  }

  // Prefill contact form from service cards
  const form = qs('#contact-form');
  const serviceSelect = qs('#service');
  const messageField = qs('#message');
  qsa('.enquire-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const svc = btn.getAttribute('data-service') || '';
      if (serviceSelect) {
        serviceSelect.value = svc;
      }
      if (messageField) {
        messageField.value = `Hello, I would like to enquire about: ${svc}.`;
      }
      // Scroll to contact
      const contact = qs('#contact');
      if (contact) contact.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // Docs checklist prefill -> message body
  const docsPrefill = qs('#docs-prefill');
  if (docsPrefill) {
    docsPrefill.addEventListener('click', () => {
      const targetService = docsPrefill.getAttribute('data-service') || '';
      if (serviceSelect) serviceSelect.value = targetService;
      const checked = qsa('input[name="doc"]:checked').map((i) => i.value);
      const txt = checked.length
        ? `I have the following documents ready: ${checked.join(', ')}.`
        : 'I am checking the required documents.';
      if (messageField) {
        const base = messageField.value.trim();
        messageField.value = base ? base + '\n' + txt : txt;
      }
      showToast('Details added to your message.');
      const contact = qs('#contact');
      if (contact) contact.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // Validate and simulate submission
  function isValidEmail(email) {
    return /.+@.+\..+/.test(email);
  }
  function isValidPhone(phone) {
    return /^\d{10}$/.test(phone);
  }
  function buildSummary(data) {
    return (
      `Enquiry — Gupta Computers\n` +
      `Name: ${data.name}\n` +
      `Phone: ${data.phone}\n` +
      `Email: ${data.email}\n` +
      `Service: ${data.service}\n` +
      (data.fileName ? `File (local): ${data.fileName}\n` : '') +
      `Message:\n${data.message || '(none)'}`
    );
  }

  function mailtoHref(data) {
    const subject = encodeURIComponent(`Enquiry — ${data.name} — ${data.service}`);
    const body = encodeURIComponent(buildSummary(data));
    return `mailto:guptacomputers2024@gmail.com?subject=${subject}&body=${body}`;
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = qs('#name').value.trim();
      const phone = qs('#phone').value.trim();
      const email = qs('#email').value.trim();
      const service = serviceSelect.value || '';
      const message = messageField.value.trim();
      const fileInput = qs('#file');
      const fileName = fileInput && fileInput.files && fileInput.files[0] ? fileInput.files[0].name : '';

      // Client-side validation
      if (!name || !phone || !email || !service) {
        showToast('Please complete all required fields.');
        return;
      }
      if (!isValidPhone(phone)) { showToast('Enter a valid 10-digit phone number.'); return; }
      if (!isValidEmail(email)) { showToast('Enter a valid email address.'); return; }

      const data = { name, phone, email, service, message, fileName };
      const summary = buildSummary(data);

      // Copy to clipboard summary
      try {
        await navigator.clipboard.writeText(summary);
        showToast('Summary copied to clipboard. Opening email…');
      } catch {
        showToast('Opening email… (copy failed)');
      }

      // Open mailto fallback
      const href = mailtoHref(data);
      const a = document.createElement('a');
      a.href = href;
      a.click();
    });
  }

  // Printable summary modal
  const summaryModal = qs('#summary-modal');
  const printSummaryBtn = qs('#print-summary');
  const summaryBody = qs('#summary-body');
  const summaryPrint = qs('#summary-print');
  if (printSummaryBtn && summaryModal && summaryBody) {
    printSummaryBtn.addEventListener('click', () => {
      const name = qs('#name').value.trim() || '(Your name)';
      const phone = qs('#phone').value.trim() || '(Phone)';
      const email = qs('#email').value.trim() || '(Email)';
      const service = serviceSelect.value || '(Service)';
      const msg = messageField.value.trim() || '';
      const fileInput = qs('#file');
      const fileName = fileInput && fileInput.files && fileInput.files[0] ? fileInput.files[0].name : '';
      summaryBody.textContent = buildSummary({ name, phone, email, service, message: msg, fileName });
      summaryModal.showModal();
    });
  }
  if (summaryPrint) {
    summaryPrint.addEventListener('click', (e) => {
      // allow dialog to close after print
      e.preventDefault();
      window.print();
    });
  }
})();


