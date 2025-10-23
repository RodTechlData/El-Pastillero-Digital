// Gestión de Pacientes - El Pastillero Digital
// LocalStorage Manager
const STORAGE_KEY = 'el_pastillero_pacientes';

// Estado
let pacienteEditando = null; // id o índice

// Helpers de almacenamiento
const getPacientes = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
const setPacientes = (arr) => localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));

// Selección de elementos (coinciden con index.html)
const els = {};
function q(id){ return document.getElementById(id); }

function initRefs(){
  els.btnNuevo = q('btn-nuevo-paciente');
  els.modal = q('modal-paciente');
  els.btnCerrar = q('modal-close');
  els.btnCancelar = q('modal-cancelar');
  els.btnGuardar = q('modal-guardar');
  els.form = q('form-paciente');
  els.lista = q('lista-pacientes');
  els.titulo = q('modal-title');
  els.busqueda = q('buscar-paciente');
  els.inNombre = q('paciente-nombre');
  els.inDni = q('paciente-dni');
  els.inEdad = q('paciente-edad');
  els.inDireccion = q('paciente-direccion');
  els.inTelefono = q('paciente-telefono');
  els.inMedicamentos = q('paciente-medicamentos');
  els.chips = q('chips-container');
}

// Modal
function abrirModal(modo){
  els.modal.setAttribute('aria-hidden','false');
  els.modal.classList.add('open');
  els.titulo.textContent = modo === 'editar' ? 'Editar paciente' : 'Nuevo paciente';
}
function cerrarModal(){
  els.modal.setAttribute('aria-hidden','true');
  els.modal.classList.remove('open');
}

function limpiarForm(){
  pacienteEditando = null;
  els.form.reset();
  els.chips.innerHTML = '';
}

function abrirNuevo(){
  limpiarForm();
  abrirModal('nuevo');
}

// Validaciones
function validar(){
  const nombre = els.inNombre.value.trim();
  const dni = els.inDni.value.trim();
  if(!nombre){
    els.inNombre.focus();
    return { ok:false, msg:'El nombre es obligatorio' };
  }
  if(!dni){
    els.inDni.focus();
    return { ok:false, msg:'El DNI es obligatorio' };
  }
  if(els.inEdad.value && Number(els.inEdad.value) < 0){
    els.inEdad.focus();
    return { ok:false, msg:'La edad no puede ser negativa' };
  }
  return { ok:true };
}

// Chips dinámicos de medicamentos
function renderChips(list){
  els.chips.innerHTML = '';
  list.filter(Boolean).forEach((m,i)=>{
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.textContent = m.trim();
    const rm = document.createElement('button');
    rm.className = 'chip-close';
    rm.type = 'button';
    rm.innerHTML = '&times;';
    rm.addEventListener('click', ()=>{
      const meds = getMedicamentosFromInput().filter((_,idx)=> idx!==i);
      setMedicamentosToInput(meds);
      renderChips(meds);
    });
    chip.appendChild(rm);
    els.chips.appendChild(chip);
  });
}
function getMedicamentosFromInput(){
  const raw = els.inMedicamentos.value || '';
  return raw.split(',').map(s=>s.trim()).filter(Boolean);
}
function setMedicamentosToInput(arr){
  els.inMedicamentos.value = arr.join(', ');
}

// CRUD
function guardar(e){
  e?.preventDefault();
  const v = validar();
  if(!v.ok){
    alert(v.msg);
    return;
  }
  const paciente = {
    id: pacienteEditando ?? Date.now(),
    nombre: els.inNombre.value.trim(),
    dni: els.inDni.value.trim(),
    edad: els.inEdad.value ? Number(els.inEdad.value) : null,
    direccion: els.inDireccion.value.trim(),
    telefono: els.inTelefono.value.trim(),
    medicamentos: getMedicamentosFromInput()
  };
  const arr = getPacientes();
  const idx = arr.findIndex(p=> String(p.id) === String(paciente.id));
  if(idx>=0){
    arr[idx] = paciente;
  } else {
    arr.push(paciente);
  }
  setPacientes(arr);
  renderLista(arr);
  cerrarModal();
}

function editar(id){
  const p = getPacientes().find(p=> String(p.id)===String(id));
  if(!p) return;
  pacienteEditando = p.id;
  els.inNombre.value = p.nombre || '';
  els.inDni.value = p.dni || '';
  els.inEdad.value = p.edad ?? '';
  els.inDireccion.value = p.direccion || '';
  els.inTelefono.value = p.telefono || '';
  setMedicamentosToInput(p.medicamentos || []);
  renderChips(p.medicamentos || []);
  abrirModal('editar');
}

function eliminar(id){
  if(!confirm('¿Eliminar paciente?')) return;
  const arr = getPacientes().filter(p=> String(p.id)!==String(id));
  setPacientes(arr);
  renderLista(arr);
}

function ver(id){
  const p = getPacientes().find(p=> String(p.id)===String(id));
  if(!p) return;
  alert(`Paciente: ${p.nombre}\nDNI: ${p.dni}\nEdad: ${p.edad ?? '-'}\nTel: ${p.telefono || '-'}\nMeds: ${(p.medicamentos||[]).join(', ')||'-'}`);
}

// Render
function renderLista(arr = getPacientes()){
  if(!els.lista) return;
  if(arr.length === 0){
    els.lista.innerHTML = '<div class="empty">No hay pacientes aún</div>';
    return;
  }
  els.lista.innerHTML = arr.map(p=>`
    <div class="card patient" data-id="${p.id}">
      <div class="patient-main">
        <strong>${p.nombre}</strong><br/>
        DNI ${p.dni}${p.edad?` · ${p.edad} años`:''}
      </div>
      <div class="actions">
        <button class="btn btn-light btn-ver" data-id="${p.id}">Ver</button>
        <button class="btn btn-light btn-editar" data-id="${p.id}">Editar</button>
        <button class="btn btn-danger btn-eliminar" data-id="${p.id}">Eliminar</button>
      </div>
    </div>`).join('');

  // wire actions
  els.lista.querySelectorAll('.btn-ver').forEach(b=> b.addEventListener('click', e=> ver(e.currentTarget.dataset.id)));
  els.lista.querySelectorAll('.btn-editar').forEach(b=> b.addEventListener('click', e=> editar(e.currentTarget.dataset.id)));
  els.lista.querySelectorAll('.btn-eliminar').forEach(b=> b.addEventListener('click', e=> eliminar(e.currentTarget.dataset.id)));
}

// Filtro búsqueda
function filtrar(){
  const qtxt = (els.busqueda?.value || '').toLowerCase();
  const arr = getPacientes().filter(p=>
    p.nombre?.toLowerCase().includes(qtxt) ||
    p.dni?.toLowerCase().includes(qtxt)
  );
  renderLista(arr);
}

// Router simple (ya hay HTML que maneja secciones via hash en index.html)
function ensureRoute(){
  const hash = location.hash || '#/pacientes';
  if(!hash.startsWith('#/pacientes')){
    location.hash = '#/pacientes';
  }
}

// Inicio
document.addEventListener('DOMContentLoaded', ()=>{
  initRefs();
  ensureRoute();

  // Semilla de datos si vacío
  if(getPacientes().length === 0){
    setPacientes([{ id: Date.now(), nombre:'Juan Pérez', dni:'12345678', edad:45, medicamentos:['Aspirina'] }]);
  }

  renderLista();

  // Eventos UI
  els.btnNuevo?.addEventListener('click', abrirNuevo);
  els.btnCerrar?.addEventListener('click', cerrarModal);
  els.btnCancelar?.addEventListener('click', (e)=>{ e.preventDefault(); cerrarModal(); });
  els.btnGuardar?.addEventListener('click', guardar);
  els.form?.addEventListener('submit', guardar);
  els.modal?.addEventListener('click', (e)=>{ if(e.target === els.modal) cerrarModal(); });
  els.busqueda?.addEventListener('input', filtrar);

  // Chips: actualizar en input change
  els.inMedicamentos?.addEventListener('input', ()=>{
    renderChips(getMedicamentosFromInput());
  });

  // Render chips iniciales
  renderChips(getMedicamentosFromInput());
});
