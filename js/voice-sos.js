/* voice-sos.js
 * Initializes Web Speech API voice recognition for SOS, builds SOS contact form UI,
 * and wires the Life/SOS button on index.html to start/stop listening and simulate alerts.
 */

(function () {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition;
  let isListening = false;

  // Simple pub/sub for simulated alert sending
  const SOS = {
    subscribers: [],
    subscribe(fn) { this.subscribers.push(fn); },
    notify(payload) { this.subscribers.forEach(fn => fn(payload)); }
  };

  function ensureContainer() {
    let container = document.getElementById('sos-container');
    if (!container) {
      container = document.createElement('section');
      container.id = 'sos-container';
      container.style.border = '1px solid #ddd';
      container.style.borderRadius = '8px';
      container.style.padding = '12px';
      container.style.margin = '12px 0';
      container.style.background = '#fafafa';
      container.innerHTML = `
        <h3 style="margin-top:0">Contacto SOS</h3>
        <form id="sos-form" autocomplete="on">
          <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:8px;">
            <label style="flex:1 1 220px">Nombre
              <input id="sos-name" name="name" type="text" placeholder="Persona de contacto" required style="width:100%" />
            </label>
            <label style="flex:1 1 220px">Teléfono
              <input id="sos-phone" name="phone" type="tel" placeholder="+54 9 11 5555-5555" pattern="[+0-9 ()-]{6,}" required style="width:100%" />
            </label>
            <label style="flex:1 1 260px">Email (opcional)
              <input id="sos-email" name="email" type="email" placeholder="contacto@ejemplo.com" style="width:100%" />
            </label>
          </div>
          <label style="display:block; margin-bottom:8px;">Mensaje SOS
            <textarea id="sos-message" name="message" rows="2" placeholder="Necesito ayuda" style="width:100%"></textarea>
          </label>
          <div style="display:flex; gap:8px; align-items:center;">
            <button type="submit" id="sos-save" style="padding:6px 10px">Guardar contacto</button>
            <button type="button" id="sos-test" style="padding:6px 10px">Probar alerta</button>
            <span id="sos-status" aria-live="polite" style="margin-left:auto; font-size:0.9em; color:#555"></span>
          </div>
        </form>
      `;
      const mount = document.getElementById('sos-mount') || document.body;
      mount.prepend(container);
    }
    return container;
  }

  function loadSavedContact() {
    try {
      const raw = localStorage.getItem('sosContact');
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function saveContact(data) {
    localStorage.setItem('sosContact', JSON.stringify(data));
  }

  function hydrateForm() {
    ensureContainer();
    const contact = loadSavedContact() || { name: '', phone: '', email: '', message: 'Necesito ayuda' };
    const name = document.getElementById('sos-name');
    const phone = document.getElementById('sos-phone');
    const email = document.getElementById('sos-email');
    const message = document.getElementById('sos-message');
    if (name) name.value = contact.name || '';
    if (phone) phone.value = contact.phone || '';
    if (email) email.value = contact.email || '';
    if (message) message.value = contact.message || 'Necesito ayuda';
  }

  function wireForm() {
    const form = document.getElementById('sos-form');
    const status = document.getElementById('sos-status');
    const testBtn = document.getElementById('sos-test');

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = {
          name: document.getElementById('sos-name').value.trim(),
          phone: document.getElementById('sos-phone').value.trim(),
          email: document.getElementById('sos-email').value.trim(),
          message: document.getElementById('sos-message').value.trim() || 'Necesito ayuda',
        };
        saveContact(data);
        if (status) { status.textContent = 'Contacto guardado'; setTimeout(()=> status.textContent='', 2000); }
      });
    }

    if (testBtn) {
      testBtn.addEventListener('click', () => {
        const contact = loadSavedContact();
        simulateAlert('TEST', contact);
      });
    }
  }

  function simulateAlert(reason, contact) {
    const payload = {
      reason,
      transcript: lastTranscript,
      contact: contact || loadSavedContact(),
      at: new Date().toISOString(),
    };
    SOS.notify(payload);
    // Visual feedback only (no real send)
    const status = document.getElementById('sos-status');
    if (status) {
      const who = payload.contact?.name || payload.contact?.phone || payload.contact?.email || 'contacto SOS';
      status.textContent = `Alerta simulada enviada a ${who}`;
      setTimeout(()=> status.textContent='', 3000);
    }
    console.log('[SOS] Simulación de envío', payload);
  }

  let lastTranscript = '';

  function setupRecognition() {
    if (!SpeechRecognition) {
      console.warn('Web Speech API no disponible en este navegador.');
      return null;
    }
    const rec = new SpeechRecognition();
    rec.lang = 'es-ES';
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        const text = res[0].transcript.trim();
        if (res.isFinal) {
          lastTranscript = text;
          handleTranscript(text);
        } else {
          interim += text + ' ';
        }
      }
      const status = document.getElementById('sos-status');
      if (status) status.textContent = interim ? `Escuchando… ${interim}` : 'Escuchando…';
    };

    rec.onerror = (e) => {
      console.warn('Reconocimiento error', e);
      const status = document.getElementById('sos-status');
      if (status) status.textContent = 'Error de micrófono';
      isListening = false;
    };

    rec.onend = () => {
      const status = document.getElementById('sos-status');
      if (status) status.textContent = 'Micrófono detenido';
      isListening = false;
    };

    return rec;
  }

  function handleTranscript(text) {
    // Triggers: "auxilio", "ayuda", "sos", "emergencia"
    const t = text.toLowerCase();
    if (/\b(auxilio|ayuda|sos|emergencia)\b/.test(t)) {
      simulateAlert('VOICE_TRIGGER', loadSavedContact());
    }
  }

  function toggleListening(force) {
    if (!recognition) recognition = setupRecognition();
    if (!recognition) return;

    const target = typeof force === 'boolean' ? force : !isListening;
    if (target && !isListening) {
      try { recognition.start(); isListening = true; } catch (_) {}
    } else if (!target && isListening) {
      try { recognition.stop(); isListening = false; } catch (_) {}
    }
  }

  function wireLifeButton() {
    // Looks for a button with id="sos-button" or data-role="sos" or text content
    const byId = document.getElementById('sos-button');
    const byData = document.querySelector('[data-role="sos"], [data-action="sos"]');
    let byText = null;
    if (!byId && !byData) {
      byText = Array.from(document.querySelectorAll('button, a')).find(el => /vida|sos|ayuda|auxilio/i.test(el.textContent || '')) || null;
    }
    const btn = byId || byData || byText;
    if (btn && !btn.dataset.sosWired) {
      btn.dataset.sosWired = '1';
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        toggleListening();
      });
    }
  }

  // Expose a tiny API for other modules if needed
  window.VoiceSOS = {
    start: () => toggleListening(true),
    stop: () => toggleListening(false),
    isListening: () => isListening,
    onAlert: (fn) => SOS.subscribe(fn),
  };

  // Initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    ensureContainer();
    hydrateForm();
    wireForm();
    wireLifeButton();

    // Example subscriber that logs and could integrate with existing notifications
    SOS.subscribe((payload) => {
      // Hook to your notifications or backend here (simulated)
      console.info('Alerta SOS:', payload);
    });
  });
})();
