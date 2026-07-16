const API = 'http://localhost:8080/api/clientes';
let clientes = [];

const u = JSON.parse(localStorage.getItem('usuario') || '{}');
if (u.nombres) document.getElementById('userName').textContent = u.nombres + ' ' + (u.apellidos || '');
if (u.rol)     document.getElementById('userRol').textContent = u.rol;

function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => t.className = 'toast', 3000);
}

function getEstadoValue() {
  return document.querySelector('input[name="cEstado"]:checked')?.value === 'true';
}

function setEstadoValue(activo) {
  document.querySelectorAll('input[name="cEstado"]').forEach(r => {
    r.checked = (r.value === 'true') === activo;
    r.closest('.estado-option').classList.toggle('selected', r.checked);
  });
}

async function cargarClientes() {
  try {
    const res = await fetch(API);
    if (!res.ok) throw new Error();
    clientes = await res.json();
    filtrar();
  } catch {
    document.getElementById('tablaBody').innerHTML =
      '<tr><td colspan="8" class="empty-state">⚠ No se pudo conectar con el servidor</td></tr>';
  }
}

function renderTabla(lista) {
  const tbody = document.getElementById('tablaBody');
  if (!lista.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No hay clientes registrados</td></tr>';
    return;
  }
  tbody.innerHTML = lista.map(c => `
    <tr>
      <td class="name">${c.nombre}</td>
      <td class="mono">${c.cedula || '—'}</td>
      <td class="mono">${c.ruc || '—'}</td>
      <td>${c.telefono || '—'}</td>
      <td>${c.direccion || '—'}</td>
      <td>${c.email || '—'}</td>
      <td>${c.activo
        ? '<span class="badge badge-completada">✓ Activo</span>'
        : '<span class="badge badge-cancelada">✕ Inactivo</span>'}</td>
      <td>
        <button class="action-btn" onclick="editarCliente(${c.id})">✎ Editar</button>
        <button class="action-btn danger" onclick="eliminarCliente(${c.id})">✕ Eliminar</button>
      </td>
    </tr>
  `).join('');
}

function filtrar() {
  const texto = document.getElementById('searchInput').value.toLowerCase().trim();
  renderTabla(clientes.filter(c =>
    !texto || c.nombre.toLowerCase().includes(texto) || (c.cedula && c.cedula.includes(texto)) || (c.ruc && c.ruc.includes(texto))
  ));
}
document.getElementById('searchInput').addEventListener('input', filtrar);

function abrirModalCliente() {
  document.getElementById('modalTitulo').textContent = 'Nuevo cliente';
  document.getElementById('clienteId').value = '';
  document.getElementById('cNombre').value = '';
  document.getElementById('cCedula').value = '';
  document.getElementById('cRuc').value = '';
  document.getElementById('cTelefono').value = '';
  document.getElementById('cDireccion').value = '';
  document.getElementById('cEmail').value = '';
  setEstadoValue(true);
  document.getElementById('modalCliente').classList.add('open');
}

function editarCliente(id) {
  const c = clientes.find(x => x.id === id);
  if (!c) return;
  document.getElementById('modalTitulo').textContent = 'Editar cliente';
  document.getElementById('clienteId').value = c.id;
  document.getElementById('cNombre').value = c.nombre;
  document.getElementById('cCedula').value = c.cedula || '';
  document.getElementById('cRuc').value = c.ruc || '';
  document.getElementById('cTelefono').value = c.telefono || '';
  document.getElementById('cDireccion').value = c.direccion || '';
  document.getElementById('cEmail').value = c.email || '';
  setEstadoValue(c.activo);
  document.getElementById('modalCliente').classList.add('open');
}

async function guardarCliente() {
  const id = document.getElementById('clienteId').value;
  const nombre = document.getElementById('cNombre').value.trim();
  const cedula = document.getElementById('cCedula').value.trim();
  const ruc = document.getElementById('cRuc').value.trim();
  const telefono = document.getElementById('cTelefono').value.trim();
  const direccion = document.getElementById('cDireccion').value.trim();
  const email = document.getElementById('cEmail').value.trim();
  const activo = getEstadoValue();

  let errores = [];
  if (!nombre || nombre.length < 2) errores.push('El nombre es obligatorio.');
  if (cedula && !/^\d{10}$/.test(cedula)) errores.push('La cédula debe tener exactamente 10 dígitos.');
  if (ruc && !/^\d{13}$/.test(ruc)) errores.push('El RUC debe tener exactamente 13 dígitos.');

  if (errores.length) { errores.forEach(e => showToast(e, 'error')); return; }

  try {
    const body = { nombre, cedula: cedula || undefined, ruc: ruc || undefined, telefono: telefono || undefined, direccion: direccion || undefined, email: email || undefined, activo };
    const res = id
      ? await fetch(`${API}/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) })
      : await fetch(API, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
    if (!res.ok) throw new Error();
    showToast(id ? 'Cliente actualizado ✓' : 'Cliente creado ✓');
    document.getElementById('modalCliente').classList.remove('open');
    await cargarClientes();
  } catch {
    showToast('Error al guardar el cliente', 'error');
  }
}

async function eliminarCliente(id) {
  if (!confirm('¿Eliminar este cliente?')) return;
  try {
    const res = await fetch(`${API}/${id}`, { method:'DELETE' });
    if (!res.ok) throw new Error();
    showToast('Cliente eliminado');
    await cargarClientes();
  } catch {
    showToast('Error al eliminar cliente', 'error');
  }
}

function cerrarModal(id) { document.getElementById(id).classList.remove('open'); }

document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('.estado-toggle')?.addEventListener('click', e => {
    const option = e.target.closest('.estado-option');
    if (!option) return;
    const radio = option.querySelector('input');
    if (!radio) return;
    radio.checked = true;
    document.querySelectorAll('.estado-option').forEach(el => el.classList.remove('selected'));
    option.classList.add('selected');
  });
  cargarClientes();
});
