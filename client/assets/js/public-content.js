(function () {
  function esc(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  async function loadSettings() {
    const base = typeof window.apiBase === 'function' ? window.apiBase() : 'http://127.0.0.1:4000';
    const res = await fetch(`${base}/api/settings`);
    if (!res.ok) throw new Error('Could not load content');
    const data = await res.json();
    return data.settings || {};
  }

  function fillAbout(settings) {
    const about = settings.about || {};
    const tagline = document.getElementById('about-tagline');
    const lead = document.getElementById('about-lead');
    const points = document.getElementById('about-points');
    const close = document.getElementById('about-close');
    const deposit = document.getElementById('deposit-list');
    if (tagline && about.tagline) tagline.textContent = about.tagline;
    if (lead && about.lead) lead.textContent = about.lead;
    if (points && Array.isArray(about.points) && about.points.length) {
      points.innerHTML = about.points.map((line, index) => `
        <article>
          <span class="doc-index" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
          <p>${esc(line)}</p>
        </article>`).join('');
    }
    if (close && about.close) close.textContent = about.close;
    if (deposit && Array.isArray(about.depositPoints) && about.depositPoints.length) {
      deposit.innerHTML = about.depositPoints.map((line) => `<li>${esc(line)}</li>`).join('');
    }
  }

  function fillTerms(settings) {
    const terms = settings.terms || {};
    const company = document.getElementById('terms-company');
    const date = document.getElementById('terms-date');
    const site = document.getElementById('terms-site');
    const law = document.getElementById('terms-law');
    const nav = document.getElementById('terms-nav');
    const grid = document.getElementById('terms-grid');
    const companyName = document.getElementById('terms-company-name');
    if (company && terms.company) company.textContent = terms.company;
    if (companyName && terms.company) companyName.textContent = terms.company;
    if (date && terms.effectiveDate) date.textContent = terms.effectiveDate;
    if (site && terms.website) site.textContent = terms.website;
    if (law && terms.jurisdiction) law.textContent = terms.jurisdiction;
    const sections = Array.isArray(terms.sections) ? terms.sections : [];
    if (!sections.length) return;
    if (nav) {
      nav.innerHTML = sections.map((section, index) => {
        const label = String(section.title || '').replace(/^\d+\.\s*/, '');
        return `<a href="#term-${index + 1}"><span>${index + 1}</span>${esc(label)}</a>`;
      }).join('');
    }
    if (grid) {
      grid.innerHTML = sections.map((section, index) => `
        <article class="card box terms-item" id="term-${index + 1}">
          <span class="terms-num" aria-hidden="true">${index + 1}</span>
          <div>
            <h2>${esc(section.title)}</h2>
            ${(section.paragraphs || []).map((line) => `<p>${esc(line)}</p>`).join('')}
          </div>
        </article>`).join('');
    }
  }

  function mountListProperty(settings) {
    const tg = String(settings.supportTelegramUsername || '').replace(/^@/, '');
    const wa = String(settings.supportWhatsappNumber || '').replace(/\D/g, '');
    const text = 'I want to list my property on Emirates Properties.';
    let href = '#';
    if (tg) href = `https://t.me/${encodeURIComponent(tg)}?text=${encodeURIComponent(text)}`;
    else if (wa) href = `https://wa.me/${encodeURIComponent(wa)}?text=${encodeURIComponent(text)}`;
    document.querySelectorAll('.list-property-btn').forEach((link) => {
      link.href = href;
      if (href === '#') {
        link.removeAttribute('target');
        link.addEventListener('click', (event) => {
          event.preventDefault();
          document.getElementById('support-fab')?.classList.add('is-open');
        });
      }
    });
  }

  function mountSupportFab(settings) {
    const root = document.getElementById('support-fab');
    if (!root) return;
    const tg = String(settings.supportTelegramUsername || '').replace(/^@/, '');
    const wa = String(settings.supportWhatsappNumber || '').replace(/\D/g, '');
    const tgLink = document.getElementById('support-fab-tg');
    const waLink = document.getElementById('support-fab-wa');
    const btn = root.querySelector('.support-fab-btn');
    if (!tg && !wa) return;
    root.hidden = false;
    if (tgLink) {
      if (tg) {
        tgLink.href = `https://t.me/${encodeURIComponent(tg)}`;
        tgLink.hidden = false;
      } else tgLink.hidden = true;
    }
    if (waLink) {
      if (wa) {
        waLink.href = `https://wa.me/${encodeURIComponent(wa)}`;
        waLink.hidden = false;
      } else waLink.hidden = true;
    }
    const open = () => {
      root.classList.add('is-open');
      if (btn) btn.setAttribute('aria-expanded', 'true');
    };
    const close = () => {
      root.classList.remove('is-open');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    };
    root.addEventListener('mouseenter', open);
    root.addEventListener('mouseleave', close);
    root.addEventListener('focusin', open);
    root.addEventListener('focusout', (event) => {
      if (!root.contains(event.relatedTarget)) close();
    });
    btn?.addEventListener('click', () => {
      if (root.classList.contains('is-open')) close();
      else open();
    });
  }

  async function boot() {
    try {
      const settings = await loadSettings();
      fillAbout(settings);
      fillTerms(settings);
      mountListProperty(settings);
      mountSupportFab(settings);
    } catch {
      /* keep static markup */
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
}());
