// medications.js - Gestión de Medicamentos con LocalStorage

// Clase para manejar las operaciones de medicamentos
class MedicationManager {
  constructor() {
    this.storageKey = 'medications';
    this.medications = this.loadMedications();
  }

  // Cargar medicamentos desde LocalStorage
  loadMedications() {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : [];
  }

  // Guardar medicamentos en LocalStorage
  saveMedications() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.medications));
  }

  // Agregar un nuevo medicamento
  addMedication(medication) {
    const newMedication = {
      id: Date.now(),
      nombre: medication.nombre,
      dosis: medication.dosis,
      frecuencia: medication.frecuencia,
      observaciones: medication.observaciones || '',
      fechaRegistro: new Date().toLocaleDateString('es-AR')
    };
    this.medications.push(newMedication);
    this.saveMedications();
    return newMedication;
  }

  // Eliminar un medicamento
  deleteMedication(id) {
    this.medications = this.medications.filter(med => med.id !== id);
    this.saveMedications();
  }

  // Editar un medicamento
  updateMedication(id, updatedData) {
    const index = this.medications.findIndex(med => med.id === id);
    if (index !== -1) {
      this.medications[index] = { ...this.medications[index], ...updatedData };
      this.saveMedications();
      return true;
    }
    return false;
  }

  // Obtener todos los medicamentos
  getAllMedications() {
    return this.medications;
  }

  // Buscar medicamentos
  searchMedications(query) {
    const searchTerm = query.toLowerCase();
    return this.medications.filter(med => 
      med.nombre.toLowerCase().includes(searchTerm) ||
      med.dosis.toLowerCase().includes(searchTerm) ||
      med.frecuencia.toLowerCase().includes(searchTerm)
    );
  }
}

// Instancia del gestor de medicamentos
const medicationManager = new MedicationManager();

// Renderizar la tabla de medicamentos
function renderMedicationsTable(medications = null) {
  const tableBody = document.getElementById('medicationsTableBody');
  const emptyState = document.getElementById('emptyState');
  const medicationsTable = document.getElementById('medicationsTable');
  
  if (!tableBody) return;
  
  const medsToRender = medications || medicationManager.getAllMedications();
  
  // Limpiar tabla
  tableBody.innerHTML = '';
  
  if (medsToRender.length === 0) {
    if (emptyState) emptyState.style.display = 'block';
    if (medicationsTable) medicationsTable.style.display = 'none';
    return;
  }
  
  if (emptyState) emptyState.style.display = 'none';
  if (medicationsTable) medicationsTable.style.display = 'table';
  
  // Crear filas de la tabla
  medsToRender.forEach(medication => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${escapeHtml(medication.nombre)}</td>
      <td>${escapeHtml(medication.dosis)}</td>
      <td>${escapeHtml(medication.frecuencia)}</td>
      <td>${escapeHtml(medication.observaciones)}</td>
      <td class="actions-cell">
        <button class="btn-edit" onclick="editMedication(${medication.id})" title="Editar">✏️</button>
        <button class="btn-delete" onclick="deleteMedication(${medication.id})" title="Eliminar">🗑️</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

// Función para escapar HTML y prevenir XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Eliminar medicamento
function deleteMedication(id) {
  if (confirm('¿Estás seguro de que deseas eliminar este medicamento?')) {
    medicationManager.deleteMedication(id);
    renderMedicationsTable();
    showNotification('Medicamento eliminado exitosamente', 'success');
  }
}

// Editar medicamento
function editMedication(id) {
  const medications = medicationManager.getAllMedications();
  const medication = medications.find(med => med.id === id);
  
  if (!medication) return;
  
  // Rellenar el formulario con los datos del medicamento
  document.getElementById('medicationName').value = medication.nombre;
  document.getElementById('medicationDose').value = medication.dosis;
  document.getElementById('medicationFrequency').value = medication.frecuencia;
  document.getElementById('medicationNotes').value = medication.observaciones;
  
  // Cambiar el comportamiento del formulario para actualizar en lugar de agregar
  const form = document.getElementById('medicationForm');
  form.dataset.editingId = id;
  
  // Cambiar texto del botón
  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.textContent = 'Actualizar Medicamento';
  
  // Scroll al formulario
  document.getElementById('medicationFormContainer').scrollIntoView({ behavior: 'smooth' });
}

// Mostrar notificación
function showNotification(message, type = 'info') {
  // Crear elemento de notificación
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
    color: white;
    border-radius: 5px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    z-index: 1000;
    animation: slideIn 0.3s ease-out;
  `;
  
  document.body.appendChild(notification);
  
  // Eliminar después de 3 segundos
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-in';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Buscar medicamentos
function searchMedications(query) {
  if (!query.trim()) {
    renderMedicationsTable();
    return;
  }
  
  const results = medicationManager.searchMedications(query);
  renderMedicationsTable(results);
}

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  // Renderizar medicamentos existentes
  renderMedicationsTable();
  
  // Manejar envío del formulario
  const form = document.getElementById('medicationForm');
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Obtener datos del formulario
      const formData = {
        nombre: document.getElementById('medicationName').value.trim(),
        dosis: document.getElementById('medicationDose').value.trim(),
        frecuencia: document.getElementById('medicationFrequency').value.trim(),
        observaciones: document.getElementById('medicationNotes').value.trim()
      };
      
      // Validar que los campos requeridos no estén vacíos
      if (!formData.nombre || !formData.dosis || !formData.frecuencia) {
        showNotification('Por favor, completa todos los campos requeridos', 'error');
        return;
      }
      
      // Verificar si estamos editando o agregando
      const editingId = form.dataset.editingId;
      
      if (editingId) {
        // Actualizar medicamento existente
        medicationManager.updateMedication(parseInt(editingId), formData);
        showNotification('Medicamento actualizado exitosamente', 'success');
        delete form.dataset.editingId;
        form.querySelector('button[type="submit"]').textContent = 'Guardar Medicamento';
      } else {
        // Agregar nuevo medicamento
        medicationManager.addMedication(formData);
        showNotification('Medicamento agregado exitosamente', 'success');
      }
      
      // Limpiar formulario
      form.reset();
      
      // Actualizar tabla
      renderMedicationsTable();
    });
  }
  
  // Manejar búsqueda
  const searchInput = document.getElementById('searchMedication');
  if (searchInput) {
    searchInput.addEventListener('input', function(e) {
      searchMedications(e.target.value);
    });
  }
  
  // Agregar estilos para las animaciones
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
    
    .btn-edit, .btn-delete {
      margin: 0 5px;
      padding: 5px 10px;
      border: none;
      border-radius: 3px;
      cursor: pointer;
      font-size: 14px;
    }
    
    .btn-edit {
      background: #2196f3;
      color: white;
    }
    
    .btn-delete {
      background: #f44336;
      color: white;
    }
    
    .btn-edit:hover {
      background: #1976d2;
    }
    
    .btn-delete:hover {
      background: #d32f2f;
    }
    
    .actions-cell {
      white-space: nowrap;
    }
  `;
  document.head.appendChild(style);
});

// Exponer funciones globalmente para uso en el HTML
window.deleteMedication = deleteMedication;
window.editMedication = editMedication;
