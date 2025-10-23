// Gestión de Pacientes - El Pastillero Digital
// LocalStorage Manager
const STORAGE_KEY = 'el_pastillero_pacientes';

// Elementos del DOM
let btnNuevoPaciente, modalPaciente, cerrarModal, btnCancelar;
let formPaciente, listaPacientes, estadoVacio, modalTitulo;
let pacienteEditando = null;

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  // Obtener referencias a elementos del DOM
  btnNuevoPaciente = document.getElementById('btnNuevoPaciente');
  modalPaciente = document.getElementById('modalPaciente');
  cerrarModal = document.getElementById('cerrarModal');
  btnCancelar = document.getElementById('btnCancelar');
  formPaciente = document.getElementById('formPaciente');
  listaPacientes = document.getElementById('listaPacientes');
  estadoVacio = document.getElementById('estadoVacio');
  modalTitulo = document.getElementById('modalTitulo');

  // Event Listeners
  btnNuevoPaciente?.addEventListener('click', abrirModalNuevo);
  cerrarModal?.addEventListener('click', cerrarModalPaciente);
  btnCancelar?.addEventListener('click', cerrarModalPaciente);
  formPaciente?.addEventListener('submit', guardarPaciente);
  
  // Cerrar modal al hacer clic fuera de él
  modalPaciente?.addEventListener('click', (e) => {
    if (e.target === modalPaciente) {
      cerrarModalPaciente();
    }
  });

  // Renderizar pacientes existentes
  renderizarPacientes();
});

// Funciones de LocalStorage
function obtenerPacientes() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

function guardarEnStorage(pacientes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pacientes));
}

// Funciones de Modal
function abrirModalNuevo() {
  pacienteEditando = null;
  formPaciente.reset();
  modalTitulo.innerHTML = '<i class="fa-solid fa-user-plus"></i> Nuevo Paciente';
  modalPaciente.classList.add('show');
  modalPaciente.setAttribute('aria-hidden', 'false');
  // Focus en primer campo
  setTimeout(() => document.getElementById('nombre')?.focus(), 100);
}

function abrirModalEditar(id) {
  const pacientes = obtenerPacientes();
  const paciente = pacientes.find(p => p.id === id);
  
  if (!paciente) return;
  
  pacienteEditando = id;
  modalTitulo.innerHTML = '<i class="fa-solid fa-user-edit"></i> Editar Paciente';
  
  // Rellenar el formulario
  document.getElementById('nombre').value = paciente.nombre || '';
  document.getElementById('documento').value = paciente.documento || '';
  document.getElementById('edad').value = paciente.edad || '';
  document.getElementById('telefono').value = paciente.telefono || '';
  document.getElementById('direccion').value = paciente.direccion || '';
  document.getElementById('notas').value = paciente.notas || '';
  
  modalPaciente.classList.add('show');
  modalPaciente.setAttribute('aria-hidden', 'false');
}

function cerrarModalPaciente() {
  modalPaciente.classList.remove('show');
  modalPaciente.setAttribute('aria-hidden', 'true');
  formPaciente.reset();
  pacienteEditando = null;
}

// Validación y guardado
function guardarPaciente(e) {
  e.preventDefault();
  
  // Obtener valores del formulario
  const nombre = document.getElementById('nombre').value.trim();
  const documento = document.getElementById('documento').value.trim();
  const edad = parseInt(document.getElementById('edad').value);
  const telefono = document.getElementById('telefono').value.trim();
  const direccion = document.getElementById('direccion').value.trim();
  const notas = document.getElementById('notas').value.trim();
  
  // Validación adicional
  if (!nombre || !documento || !edad) {
    alert('⚠️ Por favor, completa todos los campos obligatorios.');
    return;
  }
  
  if (edad < 0 || edad > 120) {
    alert('⚠️ Por favor, ingresa una edad válida (0-120).');
    return;
  }
  
  const pacientes = obtenerPacientes();
  
  if (pacienteEditando) {
    // Editar paciente existente
    const index = pacientes.findIndex(p => p.id === pacienteEditando);
    if (index !== -1) {
      pacientes[index] = {
        ...pacientes[index],
        nombre,
        documento,
        edad,
        telefono,
        direccion,
        notas,
        fechaModificacion: new Date().toISOString()
      };
    }
  } else {
    // Crear nuevo paciente
    const nuevoPaciente = {
      id: Date.now().toString(),
      nombre,
      documento,
      edad,
      telefono,
      direccion,
      notas,
      fechaCreacion: new Date().toISOString(),
      fechaModificacion: new Date().toISOString()
    };
    pacientes.push(nuevoPaciente);
  }
  
  guardarEnStorage(pacientes);
  cerrarModalPaciente();
  renderizarPacientes();
  
  // Feedback visual
  mostrarNotificacion(pacienteEditando ? 'Paciente actualizado correctamente' : 'Paciente creado correctamente');
}

// Renderizado de pacientes
function renderizarPacientes() {
  const pacientes = obtenerPacientes();
  
  if (pacientes.length === 0) {
    listaPacientes.innerHTML = '';
    estadoVacio.style.display = 'flex';
    return;
  }
  
  estadoVacio.style.display = 'none';
  
  listaPacientes.innerHTML = pacientes.map(paciente => `
    <div class="paciente-card" data-id="${paciente.id}">
      <div class="paciente-card-header">
        <div class="paciente-avatar">
          <i class="fa-solid fa-user"></i>
        </div>
        <div class="paciente-info">
          <h3 class="paciente-nombre">${escapeHtml(paciente.nombre)}</h3>
          <p class="paciente-detalle"><i class="fa-solid fa-id-card"></i> ${escapeHtml(paciente.documento)}</p>
        </div>
      </div>
      <div class="paciente-card-body">
        <div class="paciente-dato">
          <i class="fa-solid fa-cake-candles"></i>
          <span>${paciente.edad} años</span>
        </div>
        ${paciente.telefono ? `
          <div class="paciente-dato">
            <i class="fa-solid fa-phone"></i>
            <span>${escapeHtml(paciente.telefono)}</span>
          </div>
        ` : ''}
        ${paciente.direccion ? `
          <div class="paciente-dato">
            <i class="fa-solid fa-location-dot"></i>
            <span>${escapeHtml(paciente.direccion)}</span>
          </div>
        ` : ''}
        ${paciente.notas ? `
          <div class="paciente-notas">
            <i class="fa-solid fa-note-sticky"></i>
            <span>${escapeHtml(paciente.notas)}</span>
          </div>
        ` : ''}
      </div>
      <div class="paciente-card-footer">
        <button class="btn-icon btn-edit" onclick="abrirModalEditar('${paciente.id}')" title="Editar">
          <i class="fa-solid fa-pen-to-square"></i>
        </button>
        <button class="btn-icon btn-delete" onclick="eliminarPaciente('${paciente.id}')" title="Eliminar">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    </div>
  `).join('');
}

// Eliminar paciente
function eliminarPaciente(id) {
  const pacientes = obtenerPacientes();
  const paciente = pacientes.find(p => p.id === id);
  
  if (!paciente) return;
  
  if (confirm(`¿ Estás seguro de que quieres eliminar a ${paciente.nombre}?\n\nEsta acción no se puede deshacer.`)) {
    const nuevosPacientes = pacientes.filter(p => p.id !== id);
    guardarEnStorage(nuevosPacientes);
    renderizarPacientes();
    mostrarNotificacion('Paciente eliminado correctamente');
  }
}

// Funciones auxiliares
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function mostrarNotificacion(mensaje) {
  // Crear elemento de notificación
  const notificacion = document.createElement('div');
  notificacion.className = 'notificacion';
  notificacion.innerHTML = `
    <i class="fa-solid fa-check-circle"></i>
    <span>${mensaje}</span>
  `;
  
  document.body.appendChild(notificacion);
  
  // Mostrar con animación
  setTimeout(() => notificacion.classList.add('show'), 10);
  
  // Ocultar y eliminar después de 3 segundos
  setTimeout(() => {
    notificacion.classList.remove('show');
    setTimeout(() => notificacion.remove(), 300);
  }, 3000);
}

// Exponer funciones globalmente para los onclick del HTML
window.abrirModalEditar = abrirModalEditar;
window.eliminarPaciente = eliminarPaciente;
