(() => {
  const pageLinks = {
    home: '02_accueil.html',
    services: '03_services.html',
    neighbors: '11_voisins.html',
    activities: '06_mes_activites.html',
    local: '09_vie_locale.html',
    messages: '08_messages.html',
  };

  const icons = {
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v10h13V10M9.5 20v-6h5v6"/></svg>',
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>',
    services: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 6h16M4 12h16M4 18h10"/><circle cx="18" cy="18" r="2"/></svg>',
    neighbors: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="10" r="2.5"/><path d="M3.5 20c.5-4 2.3-6 5.5-6s5 2 5.5 6M14 15c3.6-.6 5.8 1.1 6.5 4"/></svg>',
    messages: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 5h16v11H9l-5 4V5Z"/><path d="M8 9h8M8 12h5"/></svg>',
  };

  function headerMarkup(active, notificationsOpen) {
    const nav = [
      ['home', 'Accueil'],
      ['services', 'Services'],
      ['neighbors', 'Voisins'],
      ['activities', 'Mes activités'],
      ['local', 'Vie locale'],
      ['messages', 'Messages'],
    ];
    const links = nav.map(([key, label]) => `<a href="${pageLinks[key]}" ${active === key ? 'aria-current="page"' : ''}>${label}</a>`).join('');
    const mobileItems = [
      ['home', 'Accueil', icons.home],
      ['services', 'Services', icons.services],
      ['neighbors', 'Voisins', icons.neighbors],
      ['messages', 'Messages', icons.messages],
    ];
    const mobileLinks = mobileItems.map(([key, label, icon]) => `<a href="${pageLinks[key]}" ${active === key ? 'aria-current="page"' : ''}>${icon}<span>${label}</span></a>`).join('');
    const initiallyOpen = notificationsOpen && !window.matchMedia('(max-width: 620px)').matches;
    const currentPage = window.location.pathname.split('/').pop() || '02_accueil.html';
    const mobileBackLinks = {
      '04_service_detail.html': ['03_services.html', 'Retour aux services'],
      '05_service_publication.html': ['03_services.html', 'Retour aux services'],
      '07_contrat_signature.html': ['06_mes_activites.html', 'Retour à mes activités'],
      '12_profil_voisin.html': ['11_voisins.html', 'Retour aux voisins'],
    };
    const backLink = mobileBackLinks[currentPage];
    const mobileLeading = backLink
      ? `<a class="mobile-header-leading mobile-back-leading" href="${backLink[0]}" aria-label="${backLink[1]}">←</a>`
      : '<span class="mobile-header-leading mobile-cn-mark" aria-label="Connected Neighbours">CN</span>';
    return `
      <a class="skip-link" href="#main-content">Aller au contenu</a>
      <header class="site-header">
        <div class="topbar">
          ${mobileLeading}
          <a class="brand" href="02_accueil.html" aria-label="Connected Neighbours, accueil">
            <span class="brand-mark">${icons.home}</span>
            <span class="brand-name">Connected Neighbours</span>
          </a>
          <nav class="main-nav" aria-label="Navigation principale">${links}</nav>
          <div class="top-actions">
            <a class="points-chip" href="10_profil.html#points" title="Consulter mes points"><strong>75</strong><span>points disponibles</span></a>
            <div class="notification-wrap">
              <button class="icon-button" type="button" data-notification-toggle aria-label="Ouvrir les notifications" aria-expanded="${initiallyOpen ? 'true' : 'false'}">
                ${icons.bell}<span class="notification-dot">3</span>
              </button>
              <div class="popover notification-panel ${initiallyOpen ? 'is-open' : ''}" data-notification-panel role="dialog" aria-label="Notifications">
                <div class="popover-header"><strong>Notifications</strong><div><button type="button" data-mark-read>Tout marquer comme lu</button><button class="notification-close" type="button" data-notification-close aria-label="Fermer les notifications">×</button></div></div>
                <div class="notification-list">
                  <a class="notification-item" href="04_service_detail.html#candidatures"><span class="unread"></span><span><p>Bob a candidaté à votre service.</p><time>Il y a 12 min</time></span></a>
                  <a class="notification-item" href="07_contrat_signature.html"><span class="unread"></span><span><p>Votre contrat attend votre signature.</p><time>Il y a 1 h</time></span></a>
                  <a class="notification-item" href="12_profil_voisin.html"><span class="unread"></span><span><p>Bob Dupont a commencé à vous suivre.</p><time>Il y a 2 h</time></span></a>
                  <a class="notification-item" href="09_vie_locale.html#votes"><span class="unread"></span><span><p>Un nouveau vote est ouvert dans Quartier Centre.</p><time>Hier</time></span></a>
                  <a class="notification-item" href="06_mes_activites.html"><span></span><span><p>Bob a déclaré le service comme réalisé.</p><time>À consulter</time></span></a>
                  <a class="notification-item" href="10_profil.html#points"><span></span><span><p>15 points ont été transférés pour le cours de maths.</p><time>Historique</time></span></a>
                </div>
              </div>
            </div>
            <div class="profile-wrap">
              <button class="profile-button" type="button" data-profile-toggle aria-expanded="false">
                <span class="avatar">AM</span>
                <span class="profile-copy"><strong>Alice Martin</strong><span>Quartier Centre</span></span>
                <span class="profile-chevron">⌄</span>
              </button>
              <div class="popover profile-menu" data-profile-menu>
                <a href="10_profil.html">Mon profil</a>
                <a href="10_profil.html#points">Mes points</a>
                <a href="10_profil.html#settings">Paramètres</a>
                <a href="10_profil.html#privacy">Confidentialité</a>
                <a class="danger-link" href="01_connexion_inscription.html">Déconnexion</a>
              </div>
            </div>
          </div>
        </div>
      </header>
      <nav class="mobile-nav" data-mobile-nav aria-label="Menu complémentaire"><a href="06_mes_activites.html">Mes activités</a><a href="09_vie_locale.html">Vie locale</a><a href="10_profil.html">Mon profil</a><a href="10_profil.html#settings">Paramètres</a></nav>
      <nav class="mobile-primary-nav" aria-label="Navigation mobile">${mobileLinks}<button type="button" data-mobile-toggle aria-label="Ouvrir le menu" aria-expanded="false">${icons.menu}<span>Menu</span></button></nav>`;
  }

  function footerMarkup() {
    return `<footer class="site-footer"><div class="container footer-inner"><span>© 2026 Connected Neighbours</span><div class="footer-links"><a href="10_profil.html#privacy">Confidentialité</a><a href="10_profil.html#settings">Accessibilité</a><a href="10_profil.html">Aide</a></div></div></footer>`;
  }

  document.querySelectorAll('[data-site-header]').forEach((node) => {
    node.outerHTML = headerMarkup(node.dataset.active || '', node.dataset.notificationsOpen === 'true');
  });
  document.querySelectorAll('[data-site-footer]').forEach((node) => {
    node.outerHTML = footerMarkup();
  });

  const profileDestinations = {
    'Alice Martin': '10_profil.html',
    'Bob Dupont': '12_profil_voisin.html',
    'Claire Bernard': '11_voisins.html#claire',
    'Nadia Petit': '11_voisins.html#nadia',
  };
  document.querySelectorAll('.person:not(a)').forEach((person) => {
    const name = person.querySelector('strong')?.textContent.trim();
    if (!profileDestinations[name]) return;
    const link = document.createElement('a');
    link.className = person.className;
    link.href = profileDestinations[name];
    link.innerHTML = person.innerHTML;
    person.replaceWith(link);
  });
  document.querySelectorAll('.service-card h3').forEach((title) => {
    if (title.closest('a')) return;
    const link = document.createElement('a');
    link.className = 'service-title-link';
    link.href = '04_service_detail.html';
    title.replaceWith(link);
    link.appendChild(title);
  });

  const serviceCategoryIcons = {
    M: '<svg viewBox="0 0 24 24"><path d="m14.7 6.3 3-3a5 5 0 0 1-6.4 6.4L5 16l3 3 6.3-6.3a5 5 0 0 1 6.4-6.4l-3 3-3-3Z"/></svg>',
    C: '<svg viewBox="0 0 24 24"><circle cx="7.5" cy="8" r="2"/><circle cx="16.5" cy="8" r="2"/><circle cx="5" cy="13" r="1.7"/><circle cx="19" cy="13" r="1.7"/><path d="M8 17.2c0-2.1 1.8-4.2 4-4.2s4 2.1 4 4.2c0 2-1.7 2.8-4 2.8s-4-.8-4-2.8Z"/></svg>',
    '∑': '<svg viewBox="0 0 24 24"><path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H11v17H7.5A3.5 3.5 0 0 0 4 22V5.5ZM20 5.5A3.5 3.5 0 0 0 16.5 2H13v17h3.5A3.5 3.5 0 0 1 20 22V5.5Z"/></svg>',
    P: '<svg viewBox="0 0 24 24"><path d="M12 21V10M12 13c-4.5 0-7-2.5-7-7 4.5 0 7 2.5 7 7ZM12 16c4.5 0 7-2.5 7-7-4.5 0-7 2.5-7 7Z"/></svg>',
    '@': '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4M7 9h10M7 12h6"/></svg>',
    V: '<svg viewBox="0 0 24 24"><circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="m6 17 4-8h4l4 8M9 17h6l-3-6M9 6h3"/></svg>',
  };
  document.querySelectorAll('.service-symbol').forEach((symbol) => {
    const icon = serviceCategoryIcons[symbol.textContent.trim()];
    if (!icon) return;
    symbol.innerHTML = icon;
    symbol.classList.add('has-category-icon');
    symbol.setAttribute('aria-hidden', 'true');
  });

  const closePopovers = (except) => {
    document.querySelectorAll('.popover.is-open').forEach((popover) => {
      if (popover !== except) {
        popover.classList.remove('is-open');
        const selector = popover.matches('[data-notification-panel]') ? '[data-notification-toggle]' : '[data-profile-toggle]';
        document.querySelector(selector)?.setAttribute('aria-expanded', 'false');
      }
    });
  };

  document.addEventListener('click', (event) => {
    const target = event.target;
    const profileToggle = target.closest('[data-profile-toggle]');
    const notificationToggle = target.closest('[data-notification-toggle]');
    const notificationClose = target.closest('[data-notification-close]');

    if (notificationClose) {
      document.querySelector('[data-notification-panel]')?.classList.remove('is-open');
      document.querySelector('[data-notification-toggle]')?.setAttribute('aria-expanded', 'false');
      return;
    }

    if (profileToggle) {
      const menu = document.querySelector('[data-profile-menu]');
      const open = !menu.classList.contains('is-open');
      closePopovers(menu);
      menu.classList.toggle('is-open', open);
      profileToggle.setAttribute('aria-expanded', String(open));
      return;
    }

    if (notificationToggle) {
      const panel = document.querySelector('[data-notification-panel]');
      const open = !panel.classList.contains('is-open');
      closePopovers(panel);
      panel.classList.toggle('is-open', open);
      notificationToggle.setAttribute('aria-expanded', String(open));
      return;
    }

    if (!target.closest('.profile-wrap') && !target.closest('.notification-wrap')) closePopovers();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closePopovers();
      document.querySelector('[data-mobile-nav]')?.classList.remove('is-open');
      document.querySelectorAll('[data-mobile-toggle]').forEach((button) => button.setAttribute('aria-expanded', 'false'));
    }
  });

  document.querySelectorAll('[data-mobile-toggle]').forEach((button) => {
    button.addEventListener('click', () => {
      const nav = document.querySelector('[data-mobile-nav]');
      const open = !nav.classList.contains('is-open');
      nav.classList.toggle('is-open', open);
      button.setAttribute('aria-expanded', String(open));
    });
  });

  document.querySelector('[data-mark-read]')?.addEventListener('click', () => {
    document.querySelectorAll('.notification-item .unread').forEach((dot) => dot.classList.remove('unread'));
    const badge = document.querySelector('.notification-dot');
    if (badge) badge.remove();
  });

  const revealScrollableTab = (button, behavior = 'auto') => {
    const tabs = button?.closest('.tabs');
    if (!tabs) return;
    const targetLeft = button.offsetLeft - ((tabs.clientWidth - button.offsetWidth) / 2);
    tabs.scrollTo({ left: Math.max(0, targetLeft), behavior });
  };

  const updateTabsOverflow = (tabs) => {
    const shell = tabs.closest('.tabs-scroll-shell');
    if (!shell) return;
    const overflowing = tabs.scrollWidth > tabs.clientWidth + 2;
    shell.classList.toggle('has-overflow', overflowing);
    shell.classList.toggle('is-at-start', tabs.scrollLeft <= 2);
    shell.classList.toggle('is-at-end', tabs.scrollLeft + tabs.clientWidth >= tabs.scrollWidth - 2);
  };

  document.querySelectorAll('.tabs:not(.auth-tabs)').forEach((tabs) => {
    if (tabs.closest('.tabs-scroll-shell')) return;
    const shell = document.createElement('div');
    shell.className = 'tabs-scroll-shell';
    if (tabs.style.marginTop) {
      shell.style.marginTop = tabs.style.marginTop;
      tabs.style.marginTop = '';
    }
    tabs.parentNode.insertBefore(shell, tabs);
    shell.appendChild(tabs);
    tabs.addEventListener('scroll', () => updateTabsOverflow(tabs), { passive: true });
    window.addEventListener('resize', () => updateTabsOverflow(tabs));
    window.requestAnimationFrame(() => updateTabsOverflow(tabs));
  });

  document.querySelectorAll('[data-tabs]').forEach((tabs) => {
    const buttons = [...tabs.querySelectorAll('[data-tab]')];
    const scope = tabs.closest('[data-tab-scope]') || document;
    const panels = [...scope.querySelectorAll('[data-tab-panel]')];
    tabs.setAttribute('role', 'tablist');
    buttons.forEach((button, index) => {
      const panel = panels.find((item) => item.dataset.tabPanel === button.dataset.tab);
      const tabId = button.id || `tab-${button.dataset.tab}-${index}`;
      const panelId = panel?.id || `panel-${button.dataset.tab}-${index}`;
      button.id = tabId;
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-controls', panelId);
      if (panel) {
        panel.id = panelId;
        panel.setAttribute('role', 'tabpanel');
        panel.setAttribute('aria-labelledby', tabId);
      }
    });
    const activate = (name, shouldScroll = false) => {
      buttons.forEach((button) => {
        const active = button.dataset.tab === name;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-selected', String(active));
        button.tabIndex = active ? 0 : -1;
        if (active && shouldScroll) revealScrollableTab(button);
      });
      panels.forEach((panel) => { panel.hidden = panel.dataset.tabPanel !== name; });
      document.dispatchEvent(new CustomEvent('mockup:tab-change', { detail: { name, scope } }));
    };
    buttons.forEach((button) => button.addEventListener('click', () => activate(button.dataset.tab, true)));
    tabs.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const current = Math.max(0, buttons.indexOf(document.activeElement));
      const next = event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? buttons.length - 1
          : (current + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
      buttons[next]?.focus();
      activate(buttons[next]?.dataset.tab, true);
    });
    const hashName = window.location.hash.replace('#', '');
    const initial = buttons.some((button) => button.dataset.tab === hashName)
      ? hashName
      : buttons.find((button) => button.classList.contains('is-active'))?.dataset.tab || buttons[0]?.dataset.tab;
    if (initial) activate(initial, true);
  });

  document.querySelectorAll('[data-tab-jump]').forEach((button) => {
    button.addEventListener('click', () => {
      const target = document.querySelector(`[data-tab="${button.dataset.tabJump}"]`);
      target?.click();
      target?.focus();
    });
  });

  document.querySelectorAll('[data-accordion-button]').forEach((button) => {
    button.addEventListener('click', () => {
      const accordion = button.closest('.accordion');
      const open = !accordion.classList.contains('is-open');
      accordion.classList.toggle('is-open', open);
      button.setAttribute('aria-expanded', String(open));
    });
  });

  const modal = document.querySelector('[data-modal]');
  let pendingModalAction = '';
  let modalReturnFocus = null;
  const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';
  const openModal = (title, body, confirmLabel = 'Confirmer') => {
    if (!modal) return;
    modalReturnFocus = document.activeElement;
    modal.querySelector('[data-modal-title]').textContent = title;
    modal.querySelector('[data-modal-body]').textContent = body;
    modal.querySelector('[data-modal-confirm-action]').textContent = confirmLabel;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    modal.querySelector('[data-modal-close]')?.focus();
  };
  document.querySelectorAll('[data-modal-open]').forEach((button) => {
    button.addEventListener('click', () => {
      pendingModalAction = button.dataset.modalAction || '';
      openModal(button.dataset.modalTitle, button.dataset.modalBody, button.dataset.modalConfirmLabel);
    });
  });
  const closeModal = () => {
    modal?.classList.remove('is-open');
    modal?.setAttribute('aria-hidden', 'true');
    modalReturnFocus?.focus?.();
  };
  document.querySelectorAll('[data-modal-close]').forEach((button) => {
    button.addEventListener('click', closeModal);
  });
  modal?.addEventListener('click', (event) => {
    if (event.target === modal) closeModal();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal?.classList.contains('is-open')) closeModal();
  });
  modal?.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    const focusable = [...modal.querySelectorAll(focusableSelector)].filter((element) => !element.hidden);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  const toast = document.querySelector('[data-toast]');
  const showToast = (message) => {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    window.setTimeout(() => toast.classList.remove('is-visible'), 2500);
  };
  document.querySelector('[data-modal-confirm-action]')?.addEventListener('click', () => {
    closeModal();
    document.dispatchEvent(new CustomEvent('mockup:modal-confirmed', { detail: { action: pendingModalAction } }));
    pendingModalAction = '';
    showToast('Action confirmée. Votre suivi a été mis à jour.');
  });
  document.querySelectorAll('[data-toast-message]').forEach((button) => {
    button.addEventListener('click', () => showToast(button.dataset.toastMessage));
  });

  const setupMfaFlow = (root, onSuccess) => {
    if (!root) return { reset() {} };
    const form = root.querySelector('[data-mfa-form]');
    const code = root.querySelector('[data-mfa-code]');
    const feedback = root.querySelector('[data-mfa-feedback]');
    const loading = root.querySelector('[data-mfa-loading]');
    const success = root.querySelector('[data-mfa-success]');
    const recovery = root.querySelector('[data-mfa-recovery]');
    const recoveryCode = root.querySelector('[data-mfa-recovery-code]');
    const reset = () => {
      form.hidden = false;
      loading.hidden = true;
      success.hidden = true;
      recovery.hidden = true;
      code.value = '';
      if (recoveryCode) recoveryCode.value = '';
      feedback.textContent = '';
      code.removeAttribute('aria-invalid');
      root.removeAttribute('aria-busy');
    };
    form?.addEventListener('submit', (event) => {
      event.preventDefault();
      const usesRecovery = !recovery.hidden;
      const value = (usesRecovery ? recoveryCode?.value : code?.value)?.trim() || '';
      const valid = usesRecovery ? /^[-A-Z0-9]{8,}$/i.test(value) : /^\d{6}$/.test(value);
      if (!valid || value === '000000') {
        feedback.textContent = value === '000000' ? 'Ce code est incorrect ou expiré.' : 'Saisissez un code valide avant de continuer.';
        code.setAttribute('aria-invalid', 'true');
        (usesRecovery ? recoveryCode : code)?.focus();
        return;
      }
      feedback.textContent = '';
      code.removeAttribute('aria-invalid');
      form.hidden = true;
      loading.hidden = false;
      root.setAttribute('aria-busy', 'true');
      window.setTimeout(() => {
        loading.hidden = true;
        success.hidden = false;
        root.removeAttribute('aria-busy');
        success.querySelector('a, button')?.focus();
        onSuccess?.();
      }, 700);
    });
    root.querySelector('[data-mfa-resend]')?.addEventListener('click', () => {
      feedback.textContent = 'Un nouveau code vient d’être envoyé.';
      code.focus();
    });
    root.querySelector('[data-mfa-recovery-toggle]')?.addEventListener('click', () => {
      recovery.hidden = !recovery.hidden;
      root.querySelector('[data-mfa-recovery-toggle]').textContent = recovery.hidden
        ? 'Utiliser un code de récupération'
        : 'Utiliser le code à 6 chiffres';
      (recovery.hidden ? code : recoveryCode)?.focus();
    });
    reset();
    return { reset };
  };

  const mfaTriggers = [...document.querySelectorAll('[data-mfa-trigger]')];
  if (mfaTriggers.length) {
    document.body.insertAdjacentHTML('beforeend', '<div class="modal-backdrop mfa-backdrop" data-mfa-dialog aria-hidden="true"><div class="modal mfa-modal" role="dialog" aria-modal="true" aria-labelledby="mfa-dialog-title"><button class="icon-button modal-close-icon" type="button" data-mfa-close aria-label="Fermer la vérification">×</button><div data-mfa-flow><div class="mfa-heading"><span class="mfa-shield" aria-hidden="true">✓</span><div><span class="badge badge-green">Vérification renforcée</span><h2 id="mfa-dialog-title">Confirmez votre identité</h2></div></div><p class="muted">Saisissez le code à 6 chiffres reçu pour <strong data-mfa-purpose>confirmer cette action</strong>.</p><form class="stack" data-mfa-form><div class="field"><label for="sensitive-mfa-code">Code de vérification</label><input class="input mfa-code-input" id="sensitive-mfa-code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]{6}" placeholder="000000" data-mfa-code aria-describedby="sensitive-mfa-feedback"><span class="field-error" id="sensitive-mfa-feedback" data-mfa-feedback aria-live="polite"></span></div><div class="mfa-inline-actions"><button class="btn btn-primary" type="submit" data-mfa-verify>Vérifier</button><button class="btn btn-ghost" type="button" data-mfa-resend>Renvoyer le code</button></div><button class="section-link text-button mfa-recovery-link" type="button" data-mfa-recovery-toggle>Utiliser un code de récupération</button><div class="field" data-mfa-recovery hidden><label for="sensitive-recovery-code">Code de récupération</label><input class="input" id="sensitive-recovery-code" autocomplete="off" placeholder="XXXX-XXXX" data-mfa-recovery-code></div></form><div class="mfa-loading" data-mfa-loading hidden role="status"><span class="spinner" aria-hidden="true"></span><strong>Vérification en cours…</strong></div><div class="auth-success compact" data-mfa-success hidden><span class="auth-success-icon" aria-hidden="true">✓</span><h2>Identité confirmée</h2><p data-mfa-success-copy>Vous pouvez poursuivre cette action.</p><button class="btn btn-primary" type="button" data-mfa-finish>Continuer</button></div><p class="mfa-target-note">Ce composant décrit le parcours de sécurité prévu par la maquette.</p></div></div></div>');
    const dialog = document.querySelector('[data-mfa-dialog]');
    const flow = dialog.querySelector('[data-mfa-flow]');
    let trigger = null;
    let action = '';
    let successCopy = '';
    let mfaReturnFocus = null;
    const controller = setupMfaFlow(flow);
    const closeMfa = () => {
      dialog.classList.remove('is-open');
      dialog.setAttribute('aria-hidden', 'true');
      mfaReturnFocus?.focus?.();
    };
    mfaTriggers.forEach((button) => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        trigger = button;
        action = button.dataset.mfaAction || '';
        successCopy = button.dataset.mfaSuccess || 'Vous pouvez poursuivre cette action.';
        mfaReturnFocus = button;
        dialog.querySelector('[data-mfa-purpose]').textContent = button.dataset.mfaPurpose || 'confirmer cette action';
        dialog.querySelector('[data-mfa-success-copy]').textContent = successCopy;
        controller.reset();
        dialog.classList.add('is-open');
        dialog.setAttribute('aria-hidden', 'false');
        window.setTimeout(() => dialog.querySelector('[data-mfa-code]')?.focus(), 0);
      });
    });
    dialog.querySelector('[data-mfa-close]')?.addEventListener('click', closeMfa);
    dialog.querySelector('[data-mfa-finish]')?.addEventListener('click', () => {
      closeMfa();
      document.dispatchEvent(new CustomEvent('mockup:mfa-confirmed', { detail: { action, trigger } }));
      showToast(successCopy);
    });
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) closeMfa();
    });
    dialog.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeMfa();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = [...dialog.querySelectorAll(focusableSelector)].filter((element) => !element.hidden && element.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  const wizard = document.querySelector('[data-wizard]');
  if (wizard) {
    let step = 1;
    const total = 3;
    const paymentInputs = [...wizard.querySelectorAll('input[name="payment"]')];
    const syncPaymentState = () => {
      const mode = paymentInputs.find((input) => input.checked)?.value || 'paid';
      const paid = mode === 'paid';
      wizard.querySelectorAll('[data-paid-only]').forEach((element) => { element.hidden = !paid; });
      const points = wizard.querySelector('[data-points-input]');
      if (points) {
        points.disabled = !paid;
        points.required = paid;
      }
      const previewPrice = wizard.querySelector('[data-payment-preview]');
      if (previewPrice) previewPrice.textContent = paid ? `${points?.value || 25} points` : 'Gratuit';
      const contractNotice = wizard.querySelector('[data-contract-notice]');
      if (contractNotice) {
        contractNotice.innerHTML = paid
          ? '<strong>Service en points : contrat obligatoire.</strong><br>Après le choix d’un candidat, les points seront réservés jusqu’à la validation.'
          : '<strong>Service gratuit.</strong><br>Aucun point n’est réservé et aucun contrat payant n’est généré.';
      }
    };
    const render = () => {
      wizard.querySelectorAll('[data-wizard-step]').forEach((panel) => { panel.hidden = Number(panel.dataset.wizardStep) !== step; });
      wizard.querySelector('[data-progress-value]').style.width = `${(step / total) * 100}%`;
      wizard.querySelector('[data-progress-copy]').textContent = `Étape ${step} sur ${total}`;
      wizard.querySelector('[data-wizard-prev]').disabled = step === 1;
      const next = wizard.querySelector('[data-wizard-next]');
      next.textContent = step === total ? 'Publier le service' : 'Continuer';
    };
    wizard.querySelector('[data-wizard-prev]').addEventListener('click', () => { step = Math.max(1, step - 1); render(); });
    wizard.querySelector('[data-wizard-next]').addEventListener('click', () => {
      if (step < total) {
        if (step === 2) {
          const paid = paymentInputs.find((input) => input.checked)?.value === 'paid';
          const amount = Number(wizard.querySelector('[data-points-input]')?.value || 0);
          if (paid && amount < 1) {
            showToast('Indiquez un nombre de points supérieur à zéro.');
            wizard.querySelector('[data-points-input]')?.focus();
            return;
          }
        }
        step += 1;
        syncPaymentState();
        render();
      } else {
        openModal('Publier votre demande ?', 'Votre service sera visible par les habitants de Quartier Centre. Vous pourrez encore l’annuler depuis Mes activités.', 'Publier');
      }
    });
    paymentInputs.forEach((input) => input.addEventListener('change', syncPaymentState));
    wizard.querySelector('[data-points-input]')?.addEventListener('input', syncPaymentState);
    syncPaymentState();
    render();
  }

  const serviceSearch = document.querySelector('[data-service-search]');
  const serviceCards = [...document.querySelectorAll('[data-service-card]')];
  const emptyResults = document.querySelector('[data-empty-results]');
  const resultCount = document.querySelector('[data-result-count]');
  const serviceGrid = document.querySelector('[data-service-grid]');
  const serviceFilterKeys = ['category', 'type', 'distance', 'points', 'date'];
  const serviceFilterControl = (key) => document.querySelector(`[data-service-${key}]`);
  const mobileServiceFilterControl = (key) => document.querySelector(`[data-mobile-service-${key}]`);
  const serviceFilterDrawer = document.querySelector('[data-filter-drawer]');
  const serviceFilterSheet = document.querySelector('.mobile-filter-sheet');
  const serviceFilterToggle = document.querySelector('[data-filter-toggle]');
  const activeFilterChips = document.querySelector('[data-active-filter-chips]');
  const mobileFilterCount = document.querySelector('[data-mobile-filter-count]');
  let serviceFilterReturnFocus = null;
  let serviceView = 'all';
  let showAllMobileServices = false;

  const syncMobileServiceFilters = () => {
    serviceFilterKeys.forEach((key) => {
      const source = serviceFilterControl(key);
      const target = mobileServiceFilterControl(key);
      if (source && target) target.value = source.value;
    });
    const desktopSort = document.querySelector('[data-service-sort]');
    const mobileSort = document.querySelector('[data-mobile-service-sort]');
    if (desktopSort && mobileSort) mobileSort.value = desktopSort.value;
  };

  const updateServiceFilterSummary = () => {
    if (!activeFilterChips) return;
    const active = serviceFilterKeys
      .map((key) => ({ key, control: serviceFilterControl(key) }))
      .filter(({ control }) => control && control.value !== 'all');
    if (mobileFilterCount) {
      mobileFilterCount.textContent = `(${active.length})`;
      mobileFilterCount.hidden = active.length === 0;
    }
    activeFilterChips.replaceChildren();
    activeFilterChips.hidden = active.length === 0;
    active.forEach(({ key, control }) => {
      const chip = document.createElement('button');
      const label = control.options[control.selectedIndex]?.textContent || control.value;
      chip.className = 'filter-chip';
      chip.type = 'button';
      chip.dataset.filterChip = key;
      chip.setAttribute('aria-label', `Retirer le filtre ${label}`);
      chip.innerHTML = `<span>${label}</span><span aria-hidden="true">×</span>`;
      chip.addEventListener('click', () => {
        control.value = 'all';
        const mobileControl = mobileServiceFilterControl(key);
        if (mobileControl) mobileControl.value = 'all';
        showAllMobileServices = false;
        applyServiceFilters();
      });
      activeFilterChips.appendChild(chip);
    });
  };

  const applyServiceFilters = () => {
    if (!serviceSearch) return;
    const query = serviceSearch.value.trim().toLocaleLowerCase('fr');
    const category = document.querySelector('[data-service-category]')?.value || 'all';
    const type = document.querySelector('[data-service-type]')?.value || 'all';
    const distance = document.querySelector('[data-service-distance]')?.value || 'all';
    const points = document.querySelector('[data-service-points]')?.value || 'all';
    const date = document.querySelector('[data-service-date]')?.value || 'all';
    const sort = document.querySelector('[data-service-sort]')?.value || 'distance';
    const matches = [];
    serviceCards.forEach((card) => {
      const amount = Number(card.dataset.points || 0);
      const kilometers = Number(card.dataset.distance || 0);
      const viewMatch = serviceView === 'all'
        || (serviceView === 'urgent' && card.dataset.urgent === 'true')
        || (serviceView === 'recommended' && card.dataset.recommended === 'true')
        || card.dataset.type === serviceView;
      const pointsMatch = points === 'all'
        || (points === 'free' && amount === 0)
        || (points === 'low' && amount > 0 && amount <= 20)
        || (points === 'high' && amount > 20);
      const match = (!query || card.textContent.toLocaleLowerCase('fr').includes(query))
        && (category === 'all' || card.dataset.category === category)
        && (type === 'all' || card.dataset.type === type)
        && (distance === 'all' || kilometers <= Number(distance))
        && pointsMatch
        && (date === 'all' || card.dataset.date === date)
        && viewMatch;
      card.hidden = !match;
      card.classList.remove('mobile-card-hidden');
      if (match) matches.push(card);
    });
    matches.sort((first, second) => {
      if (sort === 'points') return Number(second.dataset.points) - Number(first.dataset.points);
      if (sort === 'recent') return Number(second.dataset.order) - Number(first.dataset.order);
      if (sort === 'urgent') return Number(second.dataset.urgent === 'true') - Number(first.dataset.urgent === 'true');
      return Number(first.dataset.distance) - Number(second.dataset.distance);
    });
    matches.forEach((card) => serviceGrid?.appendChild(card));
    if (window.matchMedia('(max-width: 620px)').matches && !showAllMobileServices) {
      matches.slice(4).forEach((card) => card.classList.add('mobile-card-hidden'));
    }
    const moreButton = document.querySelector('[data-mobile-more]');
    if (moreButton) moreButton.hidden = matches.length <= 4 || showAllMobileServices;
    if (resultCount) resultCount.textContent = `${matches.length} service${matches.length > 1 ? 's' : ''}`;
    if (emptyResults) emptyResults.hidden = matches.length !== 0;
    updateServiceFilterSummary();
  };
  serviceSearch?.addEventListener('input', applyServiceFilters);
  document.querySelectorAll('[data-service-category], [data-service-type], [data-service-distance], [data-service-points], [data-service-date], [data-service-sort]').forEach((control) => {
    control.addEventListener('change', applyServiceFilters);
  });
  const closeServiceFilterDrawer = ({ restoreFocus = true } = {}) => {
    if (!serviceFilterDrawer || serviceFilterDrawer.hidden) return;
    serviceFilterDrawer.hidden = true;
    serviceFilterDrawer.setAttribute('aria-hidden', 'true');
    serviceFilterToggle?.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('has-service-filter-drawer');
    if (restoreFocus && serviceFilterReturnFocus instanceof HTMLElement) serviceFilterReturnFocus.focus();
  };
  const openServiceFilterDrawer = () => {
    if (!serviceFilterDrawer || !serviceFilterSheet) return;
    syncMobileServiceFilters();
    serviceFilterReturnFocus = document.activeElement instanceof HTMLElement && document.activeElement !== document.body
      ? document.activeElement
      : serviceFilterToggle;
    serviceFilterDrawer.hidden = false;
    serviceFilterDrawer.setAttribute('aria-hidden', 'false');
    serviceFilterToggle?.setAttribute('aria-expanded', 'true');
    document.body.classList.add('has-service-filter-drawer');
    requestAnimationFrame(() => document.querySelector('[data-filter-close]')?.focus());
  };
  serviceFilterToggle?.addEventListener('click', openServiceFilterDrawer);
  document.querySelector('[data-filter-close]')?.addEventListener('click', () => closeServiceFilterDrawer());
  serviceFilterDrawer?.addEventListener('click', (event) => {
    if (event.target === serviceFilterDrawer) closeServiceFilterDrawer();
  });
  serviceFilterSheet?.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeServiceFilterDrawer();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = [...serviceFilterSheet.querySelectorAll(focusableSelector)]
      .filter((element) => !element.hidden && element.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
  document.querySelector('[data-mobile-filter-form]')?.addEventListener('submit', (event) => {
    event.preventDefault();
    serviceFilterKeys.forEach((key) => {
      const source = mobileServiceFilterControl(key);
      const target = serviceFilterControl(key);
      if (source && target) target.value = source.value;
    });
    showAllMobileServices = false;
    applyServiceFilters();
    closeServiceFilterDrawer();
  });
  document.querySelector('[data-mobile-filter-reset]')?.addEventListener('click', () => {
    serviceFilterKeys.forEach((key) => {
      const control = mobileServiceFilterControl(key);
      if (control) control.value = 'all';
    });
    mobileServiceFilterControl('category')?.focus();
  });
  document.querySelector('[data-mobile-service-sort]')?.addEventListener('change', (event) => {
    const desktopSort = document.querySelector('[data-service-sort]');
    if (desktopSort) desktopSort.value = event.currentTarget.value;
    showAllMobileServices = false;
    applyServiceFilters();
  });
  const serviceViewButtons = [...document.querySelectorAll('[data-service-view]')];
  const activateServiceView = (button, shouldFocus = false) => {
    if (!button) return;
    serviceView = button.dataset.serviceView;
    serviceViewButtons.forEach((item) => {
      const active = item === button;
      item.classList.toggle('is-active', active);
      item.setAttribute('role', 'tab');
      item.setAttribute('aria-selected', String(active));
      item.setAttribute('aria-controls', 'service-results');
      item.tabIndex = active ? 0 : -1;
    });
    revealScrollableTab(button);
    if (shouldFocus) button.focus();
    applyServiceFilters();
  };
  serviceViewButtons.forEach((button) => {
    button.addEventListener('click', () => activateServiceView(button));
  });
  serviceViewButtons[0]?.closest('[role="tablist"]')?.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const current = Math.max(0, serviceViewButtons.indexOf(document.activeElement));
    const next = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? serviceViewButtons.length - 1
        : (current + (event.key === 'ArrowRight' ? 1 : -1) + serviceViewButtons.length) % serviceViewButtons.length;
    activateServiceView(serviceViewButtons[next], true);
  });
  activateServiceView(serviceViewButtons.find((button) => button.classList.contains('is-active')) || serviceViewButtons[0]);
  document.querySelector('[data-mobile-more]')?.addEventListener('click', () => {
    showAllMobileServices = true;
    applyServiceFilters();
  });
  document.querySelectorAll('[data-clear-filters]').forEach((button) => {
    button.addEventListener('click', () => {
      if (serviceSearch) serviceSearch.value = '';
      document.querySelectorAll('.filters select').forEach((select) => { select.selectedIndex = 0; });
      document.querySelectorAll('.results-row select').forEach((select) => { select.selectedIndex = 0; });
      serviceView = 'all';
      showAllMobileServices = false;
      serviceViewButtons.forEach((item) => {
        const active = item.dataset.serviceView === 'all';
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-selected', String(active));
        item.tabIndex = active ? 0 : -1;
      });
      syncMobileServiceFilters();
      applyServiceFilters();
    });
  });
  syncMobileServiceFilters();
  applyServiceFilters();

  document.querySelectorAll('[data-vote-option]').forEach((option) => {
    option.addEventListener('change', () => {
      document.querySelector('[data-vote-submit]')?.removeAttribute('disabled');
    });
  });
  document.querySelector('[data-vote-submit]')?.addEventListener('click', () => {
    showToast('Votre vote a bien été enregistré.');
    document.querySelectorAll('[data-vote-option]').forEach((input) => { input.disabled = true; });
    document.querySelector('[data-vote-submit]').disabled = true;
    document.querySelector('[data-vote-feedback]').hidden = false;
  });

  const contractSelect = document.querySelector('[data-contract-state]');
  const contractStatePanels = [...document.querySelectorAll('[data-contract-panel]')];
  const mobileProcedureAction = document.querySelector('[data-mobile-procedure-action]');
  let contractSigned = false;
  const renderContractState = () => {
    const requestedState = new URLSearchParams(window.location.search).get('state');
    const state = requestedState || contractSelect?.value || 'signature';
    contractStatePanels.forEach((panel) => { panel.hidden = panel.dataset.contractPanel !== state; });
    if (mobileProcedureAction) mobileProcedureAction.hidden = state !== 'signature' || contractSigned;
  };
  contractSelect?.addEventListener('change', renderContractState);
  renderContractState();

  const activateAuthMode = (mode) => {
    document.querySelectorAll('[data-auth-mode]').forEach((item) => {
      const active = item.dataset.authMode === mode;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-selected', String(active));
    });
    document.querySelectorAll('[data-auth-panel]').forEach((panel) => { panel.hidden = panel.dataset.authPanel !== mode; });
  };
  document.querySelectorAll('[data-auth-mode]').forEach((button) => {
    button.addEventListener('click', () => activateAuthMode(button.dataset.authMode));
  });
  const loginMfa = document.querySelector('[data-login-mfa]');
  const loginMfaController = setupMfaFlow(loginMfa);
  document.querySelector('[data-auth-login]')?.addEventListener('click', () => {
    const email = document.querySelector('#login-email');
    const password = document.querySelector('#login-password');
    if (!email?.value.trim() || !password?.value.trim()) {
      showToast('Saisissez votre adresse e-mail et votre mot de passe.');
      return;
    }
    loginMfaController.reset();
    activateAuthMode('mfa');
    loginMfa?.querySelector('[data-mfa-code]')?.focus();
  });
  document.querySelector('[data-auth-back]')?.addEventListener('click', () => {
    activateAuthMode('login');
    document.querySelector('#login-email')?.focus();
  });
  if (new URLSearchParams(window.location.search).get('state') === 'mfa') {
    activateAuthMode('mfa');
  }

  const registerFlow = document.querySelector('[data-register-flow]');
  if (registerFlow) {
    let registerStep = 1;
    let neighborhoodSelected = false;
    const renderRegisterStep = () => {
      registerFlow.querySelectorAll('[data-register-step]').forEach((panel) => {
        panel.hidden = Number(panel.dataset.registerStep) !== registerStep;
      });
      registerFlow.querySelectorAll('[data-register-progress]').forEach((item) => {
        item.classList.toggle('is-active', Number(item.dataset.registerProgress) <= registerStep);
      });
    };
    registerFlow.querySelector('[data-register-next]')?.addEventListener('click', () => {
      const fields = ['#register-name', '#register-email', '#register-password', '#register-confirm'].map((selector) => registerFlow.querySelector(selector));
      const validFields = fields.every((field) => field?.value.trim());
      const matchingPasswords = fields[2]?.value === fields[3]?.value;
      const accepted = registerFlow.querySelector('[data-register-terms]')?.checked;
      if (!validFields || !matchingPasswords || !accepted) {
        showToast('Complétez les champs, confirmez le mot de passe et acceptez les conditions.');
        return;
      }
      registerStep = 2;
      renderRegisterStep();
    });
    registerFlow.querySelector('[data-register-prev]')?.addEventListener('click', () => {
      registerStep = 1;
      renderRegisterStep();
    });
    registerFlow.querySelector('[data-neighborhood-select]')?.addEventListener('click', (event) => {
      neighborhoodSelected = true;
      event.currentTarget.textContent = 'Quartier choisi';
      event.currentTarget.classList.add('is-selected');
      registerFlow.querySelector('[data-register-confirm]').disabled = false;
      registerFlow.querySelector('[data-register-neighborhood-hint]').textContent = 'Quartier Centre sera utilisé pour personnaliser vos contenus locaux.';
    });
    registerFlow.querySelector('[data-register-confirm]')?.addEventListener('click', () => {
      if (!neighborhoodSelected) return;
      registerFlow.querySelectorAll('[data-register-step], .register-progress').forEach((element) => { element.hidden = true; });
      registerFlow.querySelector('[data-register-success]').hidden = false;
    });
    renderRegisterStep();
  }

  document.querySelector('[data-neighborhood-search]')?.addEventListener('click', () => {
    document.querySelector('[data-neighborhood-result]').hidden = false;
  });

  const neighborCards = [...document.querySelectorAll('[data-neighbor-card]')];
  const neighborSearch = document.querySelector('[data-neighbor-search]');
  const readBlockedUsers = () => {
    try {
      return new Set(JSON.parse(window.sessionStorage.getItem('cn-blocked-users') || '["louis"]'));
    } catch {
      return new Set();
    }
  };
  const saveBlockedUsers = (blocked) => window.sessionStorage.setItem('cn-blocked-users', JSON.stringify([...blocked]));
  let blockedUsers = readBlockedUsers();
  let neighborFilter = 'all';
  const applyNeighborFilters = () => {
    if (!neighborCards.length) return;
    const query = neighborSearch?.value.trim().toLocaleLowerCase('fr') || '';
    let visible = 0;
    neighborCards.forEach((card) => {
      const filterMatch = neighborFilter === 'all'
        || (neighborFilter === 'following' && card.dataset.following === 'true')
        || (neighborFilter === 'top' && card.dataset.top === 'true')
        || (neighborFilter === 'recent' && card.dataset.recent === 'true');
      const match = !blockedUsers.has(card.dataset.userId) && filterMatch && (!query || card.dataset.name.includes(query));
      card.hidden = !match;
      if (match) visible += 1;
    });
    const count = document.querySelector('[data-neighbor-count]');
    if (count) count.textContent = `${visible} voisin${visible > 1 ? 's' : ''}`;
    const empty = document.querySelector('[data-neighbor-empty]');
    if (empty) empty.hidden = visible !== 0;
  };
  neighborSearch?.addEventListener('input', applyNeighborFilters);
  document.querySelectorAll('[data-neighbor-filter]').forEach((button) => {
    button.addEventListener('click', () => {
      neighborFilter = button.dataset.neighborFilter;
      document.querySelectorAll('[data-neighbor-filter]').forEach((item) => item.classList.toggle('is-active', item === button));
      applyNeighborFilters();
    });
  });
  document.querySelector('[data-neighbor-reset]')?.addEventListener('click', () => {
    if (neighborSearch) neighborSearch.value = '';
    neighborFilter = 'all';
    document.querySelectorAll('[data-neighbor-filter]').forEach((item) => item.classList.toggle('is-active', item.dataset.neighborFilter === 'all'));
    applyNeighborFilters();
  });

  document.querySelectorAll('[data-follow-button]').forEach((button) => {
    const syncFollowLabel = () => {
      const following = button.dataset.following === 'true';
      button.classList.toggle('is-following', following);
      button.querySelector('[data-follow-label]').textContent = following ? '✓ Suivi' : 'Suivre';
      button.setAttribute('aria-label', following ? 'Se désabonner de ce voisin' : 'Suivre ce voisin');
      button.title = following ? 'Se désabonner' : 'Suivre';
    };
    syncFollowLabel();
    button.addEventListener('click', () => {
      if (blockedUsers.has(button.dataset.userId)) return;
      const following = button.dataset.following !== 'true';
      button.dataset.following = String(following);
      syncFollowLabel();
      button.closest('[data-neighbor-card]')?.setAttribute('data-following', String(following));
      const followerCount = document.querySelector('[data-follower-count]');
      if (followerCount) followerCount.textContent = String(Number(followerCount.textContent) + (following ? 1 : -1));
      showToast(following ? 'Vous suivez maintenant ce voisin.' : 'Vous ne suivez plus ce voisin.');
      applyNeighborFilters();
    });
  });

  const applyStoredBlockState = () => {
    if (!blockedUsers.has('louis')) {
      document.querySelector('[data-blocked-account="louis"]')?.setAttribute('hidden', '');
      document.querySelector('[data-unblock-note]')?.removeAttribute('hidden');
    }
    if (!blockedUsers.has('bob') || !document.querySelector('[data-public-profile="bob"]')) return;
    document.querySelector('[data-public-profile-blocked]')?.removeAttribute('hidden');
    document.querySelectorAll('[data-follow-button][data-user-id="bob"]').forEach((button) => {
      button.dataset.following = 'false';
      button.disabled = true;
      button.classList.remove('is-following');
      button.querySelector('[data-follow-label]').textContent = 'Bloqué';
    });
    const messageLink = document.querySelector('[data-profile-message]');
    messageLink?.removeAttribute('href');
    messageLink?.setAttribute('aria-disabled', 'true');
    messageLink?.classList.add('is-disabled');
    document.querySelector('[data-public-activity]')?.setAttribute('hidden', '');
  };
  applyNeighborFilters();
  applyStoredBlockState();

  const conversations = {
    bob: {
      userId: 'bob',
      name: 'Bob Dupont',
      initials: 'BD',
      avatarClass: 'blue',
      presence: 'Actif récemment',
      profileUrl: '12_profil_voisin.html',
      typeLabel: 'Liée à un service',
      neighborhood: 'Quartier Centre',
      reputation: '4,9 / 5',
      context: '<div class="service-context-card"><div><span class="badge badge-amber">Contrat à signer</span><strong>Aide pour monter un meuble</strong><span>Samedi 27 juillet · 25 points réservés</span></div><div class="inline"><a class="btn btn-secondary btn-small" href="04_service_detail.html">Voir le service</a><a class="btn btn-primary btn-small" href="07_contrat_signature.html">Voir le contrat</a><button class="icon-button context-collapse" type="button" data-context-toggle aria-label="Réduire le contexte">⌃</button></div></div>',
      files: '<div class="shared-file"><span>PDF</span><div><strong>notice-montage-armoire.pdf</strong><small>1,8 Mo</small></div></div>',
      messages: [
        '<div class="message-day">Aujourd’hui</div>',
        '<div class="system-message">Candidature acceptée · contrat généré</div>',
        '<div class="message-v2 theirs"><p>Bonjour Alice, je peux apporter une perceuse et un niveau samedi.</p><span class="message-meta">10:38</span></div>',
        '<div class="message-v2 mine"><p>Parfait, merci. Les chevilles sont déjà dans le colis.</p><span class="message-meta">10:40 · Lu</span></div>',
        '<div class="message-v2 theirs"><div class="reply-preview">Alice · Les chevilles sont déjà dans le colis.</div><p>Très bien. 9 h 30 me convient toujours.</p><div class="message-reaction">👍 1</div><span class="message-meta">10:42</span></div>',
      ],
    },
    claire: {
      userId: 'claire',
      name: 'Claire Bernard',
      initials: 'CB',
      avatarClass: 'rose',
      presence: 'Active hier',
      profileUrl: '11_voisins.html#claire',
      typeLabel: 'Conversation personnelle',
      neighborhood: 'Quartier Centre',
      reputation: '4,7 / 5',
      context: '',
      files: '<div class="shared-file image-file"><span>IMG</span><div><strong>atelier-jardin.jpg</strong><small>Photo partagée hier</small></div></div>',
      messages: [
        '<div class="message-day">Hier</div>',
        '<div class="message-v2 theirs"><p>Bonjour Alice, merci pour l’adresse de l’atelier jardinage !</p><span class="message-meta">18:04</span></div>',
        '<div class="message-v2 mine"><p>Avec plaisir. L’entrée se fait par la cour de la maison de quartier.</p><span class="message-meta">18:11 · Lu</span></div>',
        '<div class="message-v2 theirs"><div class="message-image" role="img" aria-label="Photo de plantes sur une table">Atelier jardinage</div><p>Parfait, je préparerai quelques boutures à partager.</p><div class="message-reaction">🌿 2</div><span class="message-meta">18:16</span></div>',
      ],
    },
    nadia: {
      userId: 'nadia',
      name: 'Atelier réparation vélo',
      initials: 'AV',
      avatarClass: 'amber',
      presence: '8 participants · 3 actifs récemment',
      profileUrl: '09_vie_locale.html#events',
      typeLabel: 'Groupe lié à un événement',
      neighborhood: 'Quartier Centre',
      reputation: '8 participants',
      isGroup: true,
      context: '<div class="event-context-card"><div><span class="badge badge-blue">Groupe événement</span><strong>Atelier réparation vélo</strong><span>Samedi 3 août · 14 h · 8 participants</span><span class="group-avatars" aria-label="Participants récents"><span class="avatar amber">NP</span><span class="avatar rose">CB</span><span class="avatar blue">BD</span><span class="avatar more">+5</span></span></div><a class="btn btn-secondary btn-small" href="09_vie_locale.html#events">Voir l’événement</a></div>',
      files: '<p class="muted">Aucun fichier partagé.</p>',
      messages: [
        '<div class="message-day">Lundi</div>',
        '<div class="system-message">Vous avez rejoint la conversation de l’événement</div>',
        '<div class="message-v2 theirs group-message"><strong class="message-sender">Nadia Petit</strong><p>Bonjour tout le monde, l’atelier est confirmé samedi à 14 h. Vous pouvez apporter votre vélo.</p><span class="message-meta">09:15</span></div>',
        '<div class="message-v2 theirs group-message"><strong class="message-sender">Claire Bernard</strong><p>Je peux apporter une pompe et quelques rustines.</p><span class="message-meta">09:21</span></div>',
        '<div class="message-v2 mine"><div class="reply-preview">Nadia · L’atelier est confirmé samedi.</div><p>Merci, je serai là un peu avant pour aider à installer.</p><span class="message-meta">09:28 · Lu par 4</span></div>',
      ],
    },
    empty: {
      userId: 'claire',
      name: 'Nouvelle conversation',
      initials: 'NC',
      avatarClass: 'rose',
      presence: 'Aucun message',
      profileUrl: '11_voisins.html',
      typeLabel: 'Conversation personnelle',
      neighborhood: 'Quartier Centre',
      reputation: 'Nouveau contact',
      context: '',
      files: '<p class="muted">Aucun fichier partagé.</p>',
      messages: ['<div class="conversation-start"><strong>Commencez la conversation</strong><span>Présentez-vous en quelques mots.</span></div>'],
    },
  };

  const messagingShell = document.querySelector('[data-messaging-shell]');
  let currentConversation = 'bob';
  const renderConversation = (id, openOnMobile = false) => {
    if (!messagingShell || !conversations[id]) return;
    currentConversation = id;
    const conversation = conversations[id];
    document.querySelectorAll('[data-conversation]').forEach((item) => {
      const active = item.dataset.conversation === id;
      item.classList.toggle('is-active', active);
      if (active) {
        item.dataset.unread = 'false';
        item.querySelector('.unread-count')?.remove();
      }
    });
    const avatar = document.querySelector('[data-chat-avatar]');
    avatar.className = `avatar ${conversation.avatarClass}`;
    avatar.textContent = conversation.initials;
    document.querySelector('[data-chat-name]').textContent = conversation.name;
    document.querySelector('[data-chat-presence]').textContent = conversation.presence;
    document.querySelector('[data-chat-profile-link]').href = conversation.profileUrl;
    document.querySelector('[data-chat-profile-button]').href = conversation.profileUrl;
    const context = document.querySelector('[data-chat-context]');
    context.innerHTML = conversation.context;
    context.hidden = !conversation.context;
    document.querySelector('[data-message-stack]').innerHTML = conversation.messages.join('');
    document.querySelector('[data-message-input]').placeholder = `Écrire à ${conversation.name.split(' ')[0]}…`;
    const infoAvatar = document.querySelector('[data-info-avatar]');
    infoAvatar.className = `avatar public-avatar ${conversation.avatarClass}`;
    infoAvatar.textContent = conversation.initials;
    infoAvatar.href = conversation.profileUrl;
    document.querySelector('[data-info-name]').textContent = conversation.name;
    document.querySelector('[data-info-presence]').textContent = conversation.presence;
    document.querySelector('[data-info-profile-button]').href = conversation.profileUrl;
    document.querySelector('[data-info-neighborhood]').textContent = conversation.neighborhood;
    document.querySelector('[data-info-reputation]').textContent = conversation.reputation;
    document.querySelector('[data-info-conversation-type]').textContent = conversation.typeLabel;
    document.querySelector('.chat-shared-media').innerHTML = '<div class="section-heading"><div><h3>Fichiers partagés</h3></div></div>' + conversation.files;
    const followButton = document.querySelector('[data-chat-info] [data-follow-button]');
    if (followButton) {
      followButton.hidden = Boolean(conversation.isGroup);
      followButton.dataset.userId = conversation.userId || '';
    }
    document.querySelector('[data-chat-profile-button]').textContent = conversation.isGroup ? 'Détails' : 'Profil';
    document.querySelector('[data-info-profile-button]').textContent = conversation.isGroup ? 'Voir l’événement' : 'Voir le profil';
    const blockConversationButton = document.querySelector('.chat-action-menu .danger-link');
    if (blockConversationButton) blockConversationButton.hidden = Boolean(conversation.isGroup);
    if (openOnMobile || !window.matchMedia('(max-width: 620px)').matches) messagingShell.classList.add('has-open-chat');
    window.setTimeout(() => {
      const messageList = document.querySelector('[data-message-list]');
      if (messageList) messageList.scrollTop = messageList.scrollHeight;
    }, 0);
  };

  document.querySelectorAll('[data-conversation]').forEach((button) => {
    button.addEventListener('click', () => renderConversation(button.dataset.conversation, true));
  });
  const conversationSearch = document.querySelector('[data-conversation-search]');
  let conversationFilter = 'all';
  const applyConversationFilters = () => {
    if (!messagingShell) return;
    const query = conversationSearch?.value.trim().toLocaleLowerCase('fr') || '';
    let visible = 0;
    document.querySelectorAll('[data-conversation]').forEach((item) => {
      const filterMatch = conversationFilter === 'all'
        || (conversationFilter === 'unread' && item.dataset.unread === 'true')
        || item.dataset.type === conversationFilter;
      const match = filterMatch && (!query || item.textContent.toLocaleLowerCase('fr').includes(query));
      item.hidden = !match;
      if (match) visible += 1;
    });
    document.querySelector('[data-conversation-empty]').hidden = visible !== 0;
  };
  conversationSearch?.addEventListener('input', applyConversationFilters);
  document.querySelectorAll('[data-conversation-filter]').forEach((button) => {
    button.addEventListener('click', () => {
      conversationFilter = button.dataset.conversationFilter;
      document.querySelectorAll('[data-conversation-filter]').forEach((item) => item.classList.toggle('is-active', item === button));
      applyConversationFilters();
    });
  });
  document.querySelector('[data-chat-back]')?.addEventListener('click', () => {
    messagingShell?.classList.remove('has-open-chat');
    document.querySelector('[data-chat-info]')?.classList.remove('is-open');
  });
  document.querySelector('[data-chat-info-toggle]')?.addEventListener('click', () => document.querySelector('[data-chat-info]')?.classList.add('is-open'));
  document.querySelector('[data-chat-info-close]')?.addEventListener('click', () => document.querySelector('[data-chat-info]')?.classList.remove('is-open'));
  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-context-toggle]')) event.target.closest('.service-context-card')?.classList.toggle('is-collapsed');
  });

  const attachmentToggle = document.querySelector('[data-attachment-toggle]');
  const attachmentMenu = document.querySelector('[data-attachment-menu]');
  const closeAttachmentMenu = () => {
    if (!attachmentMenu) return;
    attachmentMenu.hidden = true;
    attachmentToggle?.setAttribute('aria-expanded', 'false');
  };
  attachmentToggle?.addEventListener('click', (event) => {
    event.stopPropagation();
    const open = attachmentMenu.hidden;
    attachmentMenu.hidden = !open;
    attachmentToggle.setAttribute('aria-expanded', String(open));
    if (open) attachmentMenu.querySelector('button')?.focus();
  });
  attachmentMenu?.addEventListener('click', () => closeAttachmentMenu());
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.attachment-wrap')) closeAttachmentMenu();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeAttachmentMenu();
  });

  const messageInput = document.querySelector('[data-message-input]');
  const audioButton = document.querySelector('.audio-button');
  const sendButton = document.querySelector('[data-send-message]');
  const syncComposerActions = () => {
    const hasMessage = Boolean(messageInput?.value.trim());
    if (audioButton) audioButton.hidden = hasMessage;
    if (sendButton) sendButton.hidden = !hasMessage;
  };
  messageInput?.addEventListener('input', syncComposerActions);
  syncComposerActions();

  document.querySelector('[data-message-form]')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const input = messageInput;
    if (!input?.value.trim()) return;
    const message = document.createElement('div');
    message.className = 'message-v2 mine';
    const copy = document.createElement('p');
    copy.textContent = input.value.trim();
    const meta = document.createElement('span');
    meta.className = 'message-meta';
    meta.textContent = 'À l’instant · Envoyé';
    message.append(copy, meta);
    document.querySelector('[data-message-stack]')?.appendChild(message);
    input.value = '';
    syncComposerActions();
    message.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  const requestedConversation = new URLSearchParams(window.location.search).get('conversation');
  if (messagingShell) renderConversation(conversations[requestedConversation] ? requestedConversation : 'bob', Boolean(requestedConversation));

  const updateLocalPrimary = (tabName) => {
    const action = document.querySelector('[data-local-primary]');
    if (!action) return;
    const labels = {
      events: ['Proposer un événement', 'Proposer un événement', 'Décrivez le rendez-vous, le lieu et la date proposés.', 'Continuer'],
      votes: ['Proposer un vote', 'Proposer un vote', 'Présentez une question claire et les choix soumis aux habitants.', 'Continuer'],
      incidents: ['Signaler un incident', 'Signaler un incident', 'Indiquez le type, le lieu et une description précise.', 'Commencer'],
      map: ['', '', '', ''],
    };
    const [label, title, body, confirm] = labels[tabName] || labels.events;
    action.hidden = !label;
    action.innerHTML = label ? '<span aria-hidden="true">＋</span> ' + label : '';
    action.dataset.modalTitle = title;
    action.dataset.modalBody = body;
    action.dataset.modalConfirmLabel = confirm;
    document.querySelectorAll('[data-local-form]').forEach((form) => {
      form.hidden = form.dataset.localForm !== tabName;
    });
  };
  document.addEventListener('mockup:tab-change', (event) => updateLocalPrimary(event.detail.name));
  if (document.querySelector('[data-local-primary]')) updateLocalPrimary(window.location.hash.replace('#', '') || 'events');

  document.querySelector('[data-profile-edit]')?.addEventListener('click', () => {
    document.querySelector('[data-profile-read]').hidden = true;
    document.querySelector('[data-profile-form]').hidden = false;
  });
  document.querySelector('[data-profile-cancel]')?.addEventListener('click', () => {
    document.querySelector('[data-profile-form]').hidden = true;
    document.querySelector('[data-profile-read]').hidden = false;
  });
  const completeProfileSave = () => {
    document.querySelector('[data-profile-form]').hidden = true;
    document.querySelector('[data-profile-read]').hidden = false;
    showToast('Votre profil a été mis à jour.');
  };
  document.querySelector('[data-profile-save]')?.addEventListener('click', (event) => {
    if (!event.currentTarget.matches('[data-mfa-trigger]')) completeProfileSave();
  });

  document.addEventListener('mockup:mfa-confirmed', (event) => {
    if (event.detail.action === 'profile-identifiers') completeProfileSave();
    if (event.detail.action === 'sign-contract') {
      contractSigned = true;
      const signaturePanel = document.querySelector('[data-contract-panel="signature"]');
      const fullSignButton = signaturePanel?.querySelector('[data-mfa-action="sign-contract"]');
      if (fullSignButton) fullSignButton.hidden = true;
      const status = document.querySelector('.signature-box .badge');
      if (status) {
        status.textContent = 'Signée';
        status.className = 'badge badge-green';
      }
      const title = signaturePanel?.querySelector('h2');
      const copy = signaturePanel?.querySelector('p.muted');
      if (title) title.textContent = 'Signature enregistrée';
      if (copy) copy.textContent = 'Bob doit maintenant signer avant que le contrat devienne actif.';
      renderContractState();
    }
  });

  document.addEventListener('mockup:modal-confirmed', (event) => {
    const action = event.detail.action;
    if (action === 'unblock-louis') {
      blockedUsers.delete('louis');
      saveBlockedUsers(blockedUsers);
      document.querySelector('[data-blocked-account="louis"]')?.setAttribute('hidden', '');
      document.querySelector('[data-unblock-note]')?.removeAttribute('hidden');
      showToast('Louis est débloqué. Aucun abonnement n’a été restauré.');
      return;
    }
    if (action === 'block-bob' || action === 'block-current') {
      const userId = action === 'block-bob' ? 'bob' : conversations[currentConversation]?.userId;
      if (!userId) return;
      blockedUsers.add(userId);
      saveBlockedUsers(blockedUsers);
      document.querySelectorAll(`[data-follow-button][data-user-id="${userId}"]`).forEach((button) => {
        button.dataset.following = 'false';
        button.classList.remove('is-following');
        button.disabled = true;
        button.querySelector('[data-follow-label]').textContent = 'Bloqué';
      });
      document.querySelector(`[data-neighbor-card][data-user-id="${userId}"]`)?.setAttribute('hidden', '');
      if (document.querySelector('[data-public-profile="bob"]') && userId === 'bob') {
        document.querySelector('[data-public-profile-blocked]')?.removeAttribute('hidden');
        const messageLink = document.querySelector('[data-profile-message]');
        messageLink?.removeAttribute('href');
        messageLink?.setAttribute('aria-disabled', 'true');
        messageLink?.classList.add('is-disabled');
        document.querySelector('[data-public-activity]')?.setAttribute('hidden', '');
      }
      if (action === 'block-current') {
        document.querySelector('[data-message-input]')?.setAttribute('disabled', '');
        document.querySelector('[data-message-input]')?.setAttribute('placeholder', 'Conversation indisponible');
        document.querySelector('[data-message-form]')?.classList.add('is-disabled');
      }
      applyNeighborFilters();
      showToast('Ce profil est bloqué et retiré de vos suggestions.');
      return;
    }
    if (action !== 'accept-bob') return;
    document.querySelector('[data-selection-before]')?.setAttribute('hidden', '');
    document.querySelector('[data-selection-after]')?.removeAttribute('hidden');
    document.querySelector('[data-service-status]').textContent = 'Candidat choisi';
    document.querySelector('[data-service-status]').className = 'badge badge-amber';
    document.querySelector('[data-contract-before]')?.setAttribute('hidden', '');
    document.querySelector('[data-contract-after]')?.removeAttribute('hidden');
    const summaryStatus = document.querySelector('[data-summary-status]');
    if (summaryStatus) {
      summaryStatus.textContent = 'Contrat à signer';
      summaryStatus.className = 'badge badge-amber';
    }
    const summaryCard = summaryStatus?.closest('.summary-card');
    const firstValue = summaryCard?.querySelector('.summary-list li strong');
    if (firstValue) firstValue.textContent = 'Bob Dupont retenu';
    const summaryAction = summaryCard?.querySelector('[data-tab-jump]');
    if (summaryAction) {
      summaryAction.dataset.tabJump = 'contract';
      summaryAction.textContent = 'Consulter le contrat';
    }
  });
})();
