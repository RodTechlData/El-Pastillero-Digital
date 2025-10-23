// app.js - Recordatorios con LocalStorage y notificaciones animadas

(function () {
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  // Elements
  const form = $('#reminderForm');
  const medInput = $('#reminderMedication');
  const dateInput = $('#reminderDate');
  const timeInput = $('#reminderTime');
  const noteInput = $('#reminderNote');
  const tbody = $('#remindersTableBody');
  const notification = $('#notification');

  const STORAGE_KEY = 'epd.reminders.v1';

  // Utils
  const uid = () => crypto?.randomUUID?.() || 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
  const pad = (n) => String(n).padStart(2, '0');
  const toISODate = (d) => {
    const dt = new Date(d);
    return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
  };

  // Storage helpers
  function loadReminders() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Error leyendo LocalStorage', e);
      return [];
    }
  }
  function saveReminders(list) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('Error guardando LocalStorage', e);
    }
  }

  // Notification (animated toast)
  function showToast(msg, type = 'info') {
    if (!notification) return;
    notification.textContent = msg;
    notification.className = `notification show ${type}`; // CSS must animate .notification.show
    // Auto hide
    setTimeout(() => {
      notification.classList.remove('show');
    }, 2500);
  }

  // CRUD
  function render() {
    if (!tbody) return;
    const items = loadReminders().sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    tbody.innerHTML = '';
    if (items.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 5;
      td.textContent = 'No hay recordatorios. Crea el primero arriba.';
      td.className = 'empty-row';
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }

    items.forEach((it) => {
      const tr = document.createElement('tr');

      const tdMed = document.createElement('td');
      tdMed.textContent = it.medication;

      const tdDate = document.createElement('td');
      tdDate.textContent = it.date;

      const tdTime = document.createElement('td');
      tdTime.textContent = it.time;

      const tdNote = document.createElement('td');
      tdNote.textContent = it.note || '';

      const tdActions = document.createElement('td');
      tdActions.className = 'actions-cell';

      const btnEdit = document.createElement('button');
      btnEdit.type = 'button';
      btnEdit.className = 'btn icon edit';
      btnEdit.title = 'Editar';
      btnEdit.textContent = '✏️';
      btnEdit.addEventListener('click', () => startEdit(it.id));

      const btnDelete = document.createElement('button');
      btnDelete.type = 'button';
      btnDelete.className = 'btn icon delete';
      btnDelete.title = 'Eliminar';
      btnDelete.textContent = '🗑️';
      btnDelete.addEventListener('click', () => removeItem(it.id));

      tdActions.append(btnEdit, btnDelete);

      tr.append(tdMed, tdDate, tdTime, tdNote, tdActions);
      tbody.appendChild(tr);
    });
  }

  function createItem({ medication, date, time, note }) {
    const list = loadReminders();
    list.push({ id: uid(), medication, date, time, note });
    saveReminders(list);
    render();
    showToast('Recordatorio creado', 'success');
  }

  function startEdit(id) {
    const list = loadReminders();
    const item = list.find((x) => x.id === id);
    if (!item) return;
    // Fill form for edit mode
    medInput.value = item.medication;
    dateInput.value = item.date;
    timeInput.value = item.time;
    noteInput.value = item.note || '';
    form.dataset.editing = id; // flag editing mode
    form.querySelector('button[type="submit"]').textContent = 'Guardar Cambios';
    showToast('Editando recordatorio…', 'info');
  }

  function updateItem(id, { medication, date, time, note }) {
    const list = loadReminders();
    const idx = list.findIndex((x) => x.id === id);
    if (idx === -1) return;
    list[idx] = { ...list[idx], medication, date, time, note };
    saveReminders(list);
    render();
    showToast('Recordatorio actualizado', 'success');
  }

  function removeItem(id) {
    const list = loadReminders();
    const newList = list.filter((x) => x.id !== id);
    saveReminders(newList);
    render();
    showToast('Recordatorio eliminado', 'warning');
  }

  // Form submit
  function onSubmit(e) {
    e.preventDefault();
    const medication = medInput.value.trim();
    const date = dateInput.value;
    const time = timeInput.value;
    const note = noteInput.value.trim();

    if (!medication || !date || !time) {
      showToast('Completa medicamento, fecha y hora', 'error');
      return;
    }

    // Normalize date to YYYY-MM-DD
    const safeDate = toISODate(date);

    const editingId = form.dataset.editing;
    if (editingId) {
      updateItem(editingId, { medication, date: safeDate, time, note });
      delete form.dataset.editing;
      form.querySelector('button[type="submit"]').textContent = 'Crear Recordatorio';
    } else {
      createItem({ medication, date: safeDate, time, note });
    }

    form.reset();
  }

  // Init
  function init() {
    if (!form || !tbody) return; // page may not include the section
    form.addEventListener('submit', onSubmit);
    render();

    // Optional: simple check every minute to notify upcoming reminders within next 1 minute
    setInterval(checkUpcoming, 60000);
    // Run once on load
    checkUpcoming();
  }

  function parseDateTime(dateStr, timeStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const [hh = 0, mm = 0] = (timeStr || '00:00').split(':').map(Number);
    return new Date(y, (m || 1) - 1, d || 1, hh, mm, 0, 0);
  }

  let notifiedIds = new Set();
  function checkUpcoming() {
    const now = new Date();
    const items = loadReminders();
    items.forEach((it) => {
      const when = parseDateTime(it.date, it.time);
      const diff = when - now; // ms
      if (diff <= 60000 && diff >= -60000) { // within ±1 min
        if (!notifiedIds.has(it.id)) {
          notifiedIds.add(it.id);
          showToast(`⏰ Toma ${it.medication} a las ${it.time}`, 'info');
          // Auto-clear notification memory after some time to allow future days
          setTimeout(() => notifiedIds.delete(it.id), 60 * 60 * 1000);
        }
      }
    });
  }

  // Expose for debugging
  window.EPD = {
    loadReminders,
    saveReminders,
    render,
    createItem,
    updateItem,
    removeItem,
  };

  // Start
  document.addEventListener('DOMContentLoaded', init);
})();
