/* =====================================================
   CacaoGest — ventas.js
   ===================================================== */
const API = 'http://localhost:8080/api/ventas';

// ── USUARIO SIDEBAR ─────────────────────────────────
const u = JSON.parse(localStorage.getItem('usuario') || '{}');
if (u.nombres) document.getElementById('sidebarNombre').textContent = u.nombres + ' ' + (u.apellidos || '');
if (u.rol)     document.getElementById('sidebarRol').textContent = u.rol;
if (u.username) document.getElementById('usuarioRegistra').value = u.username;

// ── STATE ───────────────────────────────────────────
let productos = [];
let stockSeleccionado = 0;

// ── INIT ────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('fechaVenta').value = new Date().toISOString().slice(0, 10);
  cargarNumeroFactura();
  cargarProductos();
});

// ── TOAST ────────────────────────────────────────────
function showToast(msg, type) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type || 'success'} show`;
  setTimeout(() => t.className = 'toast', 3500);
}

// ── AUTOCOMPLETE CLIENTE ─────────────────────────────
const clienteInput = document.getElementById('clienteBusqueda');
const clienteDropdown = document.getElementById('clienteDropdown');
let debounceTimer;

clienteInput.addEventListener('input', () => {
  clearTimeout(debounceTimer);
  const q = clienteInput.value.trim();
  if (!q) {
    clienteDropdown.classList.remove('open');
    return;
  }
  debounceTimer = setTimeout(() => buscarClientes(q), 300);
});

clienteInput.addEventListener('blur', () => {
  setTimeout(() => clienteDropdown.classList.remove('open'), 200);
});

clienteInput.addEventListener('focus', () => {
  const q = clienteInput.value.trim();
  if (q.length >= 3) buscarClientes(q);
});

async function buscarClientes(q) {
  try {
    const res = await fetch(`${API}/clientes?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    renderClientes(data);
  } catch {
    clienteDropdown.classList.remove('open');
  }
}

function renderClientes(lista) {
  if (!lista.length) {
    clienteDropdown.classList.remove('open');
    return;
  }
  clienteDropdown.innerHTML = lista.map(c => `
    <div class="autocomplete-item" data-id="${c.id}"
         data-nombre="${c.nombre}" data-cedula="${c.cedula}" data-ruc="${c.ruc}"
         data-telefono="${c.telefono}" data-direccion="${c.direccion}"
         data-activo="${c.activo}" onclick="seleccionarCliente(this)">
      <div class="cli-name">${c.nombre}</div>
      <div class="cli-meta">
        <span>${c.cedula ? 'C.C: ' + c.cedula : ''}${c.cedula && c.ruc ? ' | ' : ''}${c.ruc ? 'RUC: ' + c.ruc : ''}</span>
        <span>${c.direccion || ''}</span>
      </div>
    </div>
  `).join('');
  clienteDropdown.classList.add('open');
}

function seleccionarCliente(el) {
  document.getElementById('clienteId').value = el.dataset.id;
  document.getElementById('clienteBusqueda').value = el.dataset.nombre;
  document.getElementById('clienteCedula').value = el.dataset.cedula;
  document.getElementById('clienteRuc').value = el.dataset.ruc;
  document.getElementById('clienteTelefono').value = el.dataset.telefono;
  document.getElementById('clienteDireccion').value = el.dataset.direccion;
  const estado = document.getElementById('clienteEstado');
  if (el.dataset.activo === 'true') {
    estado.className = 'badge badge-disponible';
    estado.textContent = '● Activo';
  } else {
    estado.className = 'badge badge-critico';
    estado.textContent = '● Inactivo';
  }
  clienteDropdown.classList.remove('open');
}

// ── NÚMERO DE FACTURA ────────────────────────────────
async function cargarNumeroFactura() {
  try {
    const res = await fetch(`${API}/generar-numero`);
    const data = await res.json();
    document.getElementById('numeroFactura').value = data.numero;
  } catch {}
}

// ── PRODUCTOS ────────────────────────────────────────
async function cargarProductos() {
  try {
    const res = await fetch(`${API}/productos`);
    productos = await res.json();
    const select = document.getElementById('productoSelect');
    select.innerHTML = '<option value="">Selecciona un producto...</option>' +
      productos.map(p => `<option value="${p.id}">${p.nombre}</option>`).join('');
  } catch {}
}

function onProductoChange() {
  const id = parseInt(document.getElementById('productoSelect').value);
  if (!id) {
    stockSeleccionado = 0;
    document.getElementById('stockValor').textContent = '0';
    document.getElementById('productoCategoria').value = '';
    ocultarWarningStock();
    recalcularTotal();
    return;
  }
  const p = productos.find(x => x.id === id);
  if (p) {
    stockSeleccionado = parseFloat(p.stockActual) || 0;
    document.getElementById('stockValor').textContent = stockSeleccionado;
    document.getElementById('productoCategoria').value = p.unidadMedida || 'Cacao';
    validarStock();
    recalcularTotal();
  }
}

// ── VALIDACIÓN PRECIO ────────────────────────────────
function onPrecioChange() {
  const input = document.getElementById('precioKg');
  const error = document.getElementById('precioError');
  const val = input.value.trim();
  const regex = /^\d+(\.\d{1,2})?$/;
  if (val && !regex.test(val)) {
    input.classList.add('input-error');
    error.classList.remove('hidden');
    return;
  }
  input.classList.remove('input-error');
  error.classList.add('hidden');
  recalcularTotal();
}

// ── VALIDACIÓN STOCK ────────────────────────────────
function onCantidadChange() {
  validarStock();
  recalcularTotal();
}

function validarStock() {
  const cantidad = parseFloat(document.getElementById('cantidadKg').value) || 0;
  const stockVal = document.getElementById('stockValor');
  const warning = document.getElementById('stockWarning');
  const warningMsg = document.getElementById('stockWarningMsg');
  const btn = document.getElementById('btnConfirmar');
  const cantInput = document.getElementById('cantidadKg');

  if (cantidad > stockSeleccionado && stockSeleccionado > 0) {
    warning.classList.remove('hidden');
    warningMsg.textContent =
      `Stock insuficiente. Disponible: ${stockSeleccionado} kg — No es posible vender más stock del disponible. Ajusta la cantidad antes de confirmar.`;
    cantInput.classList.add('input-error');
    btn.disabled = true;
    btn.style.opacity = '0.5';
    btn.style.cursor = 'not-allowed';
  } else {
    ocultarWarningStock();
  }
}

function ocultarWarningStock() {
  const warning = document.getElementById('stockWarning');
  warning.classList.add('hidden');
  document.getElementById('cantidadKg').classList.remove('input-error');
  const btn = document.getElementById('btnConfirmar');
  btn.disabled = false;
  btn.style.opacity = '1';
  btn.style.cursor = 'pointer';
}

// ── CÁLCULO TOTAL ────────────────────────────────────
function recalcularTotal() {
  const precio = parseFloat(document.getElementById('precioKg').value) || 0;
  const cantidad = parseFloat(document.getElementById('cantidadKg').value) || 0;
  const regex = /^\d+(\.\d{1,2})?$/;
  if (document.getElementById('precioKg').value.trim() && !regex.test(document.getElementById('precioKg').value.trim())) {
    document.getElementById('totalEstimado').textContent = '$ 0.00';
    return;
  }
  const total = precio * cantidad;
  document.getElementById('totalEstimado').textContent =
    '$ ' + total.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// ── SPINNER ─────────────────────────────────────────
function mostrarSpinner() {
  document.getElementById('spinnerOverlay').classList.add('open');
}

function ocultarSpinner() {
  document.getElementById('spinnerOverlay').classList.remove('open');
}

// ── CONFIRMACIÓN Y ENVÍO ────────────────────────────
function confirmarVenta() {
  const errores = validarFormulario();
  if (errores.length > 0) {
    showToast(errores[0], 'error');
    return;
  }
  if (!confirm('¿Registrar esta venta? Los cambios no se podrán deshacer.')) return;
  enviarVenta();
}

function validarFormulario() {
  const errores = [];

  if (!document.getElementById('clienteId').value) {
    errores.push('Debes seleccionar un cliente de la lista.');
  }

  if (!document.getElementById('productoSelect').value) {
    errores.push('Debes seleccionar un producto.');
  }

  if (!document.getElementById('precioKg').value.trim()) {
    errores.push('Debes ingresar un precio por kilogramo.');
  } else {
    const regex = /^\d+(\.\d{1,2})?$/;
    if (!regex.test(document.getElementById('precioKg').value.trim())) {
      errores.push('El precio debe ser un valor numérico válido (ej: 3.50).');
    }
  }

  const cantidad = parseFloat(document.getElementById('cantidadKg').value);
  if (!cantidad || cantidad <= 0) {
    errores.push('Debes ingresar una cantidad válida en kilogramos.');
  }

  if (cantidad > stockSeleccionado && stockSeleccionado > 0) {
    errores.push(`Stock insuficiente. Disponible: ${stockSeleccionado} kg.`);
  }

  const cedulaV = document.getElementById('clienteCedula').value.trim();
  if (cedulaV && !/^\d{10}$/.test(cedulaV)) {
    errores.push('La cédula debe tener exactamente 10 dígitos.');
  }

  const ruc = document.getElementById('clienteRuc').value.trim();
  if (ruc && !/^\d{13}$/.test(ruc)) {
    errores.push('El RUC debe tener exactamente 13 dígitos.');
  }

  const telefono = document.getElementById('clienteTelefono').value.trim();
  if (telefono && !/^\d+$/.test(telefono)) {
    errores.push('El teléfono solo debe contener dígitos.');
  } else if (telefono && (telefono.length < 7 || telefono.length > 10)) {
    errores.push('El teléfono debe tener entre 7 y 10 dígitos.');
  }

  if (!document.getElementById('fechaVenta').value) {
    errores.push('Debes seleccionar una fecha de venta.');
  }

  return errores;
}

async function enviarVenta() {
  mostrarSpinner();

  const body = {
    clienteNombre: document.getElementById('clienteBusqueda').value.trim(),
    clienteCedula: document.getElementById('clienteCedula').value.trim(),
    clienteRuc: document.getElementById('clienteRuc').value.trim(),
    clienteTelefono: document.getElementById('clienteTelefono').value.trim(),
    clienteDireccion: document.getElementById('clienteDireccion').value.trim(),
    numeroFactura: document.getElementById('numeroFactura').value.trim(),
    usuarioRegistra: document.getElementById('usuarioRegistra').value.trim(),
    productos: [{
      productoId: parseInt(document.getElementById('productoSelect').value),
      calidad: document.getElementById('calidadSelect').value,
      precioKg: parseFloat(document.getElementById('precioKg').value.trim()),
      cantidadKg: parseFloat(document.getElementById('cantidadKg').value)
    }]
  };

  try {
    const res = await fetch(`${API}/registrar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (!res.ok) {
      ocultarSpinner();
      showToast(data.error || 'No fue posible registrar la venta.', 'error');
      return;
    }

    ocultarSpinner();
    showToast('Venta registrada correctamente ✓', 'success');
    limpiarFormulario();

  } catch {
    ocultarSpinner();
    showToast('No fue posible conectar con el servidor.', 'error');
  }
}

function limpiarFormulario() {
  document.getElementById('clienteId').value = '';
  document.getElementById('clienteBusqueda').value = '';
  document.getElementById('clienteCedula').value = '';
  document.getElementById('clienteRuc').value = '';
  document.getElementById('clienteTelefono').value = '';
  document.getElementById('clienteDireccion').value = '';
  document.getElementById('clienteEstado').className = 'badge badge-disponible';
  document.getElementById('clienteEstado').textContent = '● Activo';
  document.getElementById('productoSelect').value = '';
  document.getElementById('productoCategoria').value = '';
  document.getElementById('precioKg').value = '';
  document.getElementById('precioKg').classList.remove('input-error');
  document.getElementById('precioError').classList.add('hidden');
  document.getElementById('cantidadKg').value = '';
  document.getElementById('stockValor').textContent = '0';
  stockSeleccionado = 0;
  ocultarWarningStock();
  document.getElementById('totalEstimado').textContent = '$ 0.00';
  document.getElementById('fechaVenta').value = new Date().toISOString().slice(0, 10);
  cargarNumeroFactura();
  cargarProductos();
  clienteDropdown.classList.remove('open');
  const btn = document.getElementById('btnConfirmar');
  btn.disabled = false;
  btn.style.opacity = '1';
  btn.style.cursor = 'pointer';
}
