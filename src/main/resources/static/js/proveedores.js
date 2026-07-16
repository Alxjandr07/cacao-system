const API = 'http://localhost:8080/api/proveedores';
let proveedores = [];

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
  return document.querySelector('input[name="pEstado"]:checked')?.value === 'true';
}

function setEstadoValue(activo) {
  document.querySelectorAll('input[name="pEstado"]').forEach(r => {
    r.checked = (r.value === 'true') === activo;
    r.closest('.estado-option').classList.toggle('selected', r.checked);
  });
}

async function cargarProveedores() {
  try {
    const res = await fetch(API);
    if (!res.ok) throw new Error();
    proveedores = await res.json();
    filtrar();
  } catch {
    document.getElementById('tablaBody').innerHTML =
      '<tr><td colspan="8" class="empty-state">⚠ No se pudo conectar con el servidor</td></tr>';
  }
}

function renderTabla(lista) {
  const tbody = document.getElementById('tablaBody');
  if (!lista.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No hay proveedores registrados</td></tr>';
    return;
  }
  tbody.innerHTML = lista.map(p => `
    <tr>
      <td class="mono">${p.ruc || '—'}</td>
      <td class="name">${p.nombre}</td>
      <td>${p.representante || '—'}</td>
      <td class="mono">${p.telefono || '—'}</td>
      <td>${p.ciudad}</td>
      <td><span class="badge badge-cacao">${formatearTipo(p.tipo)}</span></td>
      <td>${p.activo
        ? '<span class="badge badge-completada">✓ Activo</span>'
        : '<span class="badge badge-cancelada">✕ Inactivo</span>'}</td>
      <td>
        <button class="action-btn" onclick="editarProveedor(${p.id})">✎ Editar</button>
        <button class="action-btn" onclick="toggleEstadoProveedor(${p.id})">${p.activo ? '🔒 Desactivar' : '🔓 Activar'}</button>
        <button class="action-btn danger" onclick="eliminarProveedor(${p.id})">✕ Eliminar</button>
      </td>
    </tr>
  `).join('');
}

function formatearTipo(tipo) {
  const mapa = { PERSONA_NATURAL: 'Persona Natural', SOCIEDAD: 'Sociedad', COOPERATIVA: 'Cooperativa', OTRO: 'Otro' };
  return mapa[tipo] || tipo;
}

function filtrar() {
  const texto = document.getElementById('searchInput').value.toLowerCase().trim();
  const estado = document.getElementById('filtroEstado').value;
  renderTabla(proveedores.filter(p =>
    (!texto || p.ruc?.includes(texto) || p.nombre?.toLowerCase().includes(texto) || p.ciudad?.toLowerCase().includes(texto)) &&
    (estado === '' || p.activo.toString() === estado)
  ));
}
document.getElementById('searchInput').addEventListener('input', filtrar);

function abrirModalProveedor() {
  document.getElementById('modalTitulo').textContent = 'Nuevo proveedor';
  document.getElementById('proveedorId').value = '';
  document.getElementById('pRuc').value = '';
  document.getElementById('pRuc').readOnly = false;
  document.getElementById('pNombre').value = '';
  document.getElementById('pRepresentante').value = '';
  document.getElementById('pTipo').value = '';
  document.getElementById('pTelefono').value = '';
  document.getElementById('pEmail').value = '';
  document.getElementById('pDireccion').value = '';
  document.getElementById('pCiudad').value = '';
  setEstadoValue(true);
  document.getElementById('rucError').classList.add('hidden');
  document.getElementById('rucError').textContent = '';
  document.getElementById('modalProveedor').classList.add('open');
}

function editarProveedor(id) {
  const p = proveedores.find(x => x.id === id);
  if (!p) return;
  document.getElementById('modalTitulo').textContent = 'Editar proveedor';
  document.getElementById('proveedorId').value = p.id;
  document.getElementById('pRuc').value = p.ruc || '';
  document.getElementById('pRuc').readOnly = true;
  document.getElementById('pNombre').value = p.nombre || '';
  document.getElementById('pRepresentante').value = p.representante || '';
  document.getElementById('pTipo').value = p.tipo || '';
  document.getElementById('pTelefono').value = p.telefono || '';
  document.getElementById('pEmail').value = p.email || '';
  document.getElementById('pDireccion').value = p.direccion || '';
  document.getElementById('pCiudad').value = p.ciudad || '';
  setEstadoValue(p.activo);
  document.getElementById('rucError').classList.add('hidden');
  document.getElementById('rucError').textContent = '';
  document.getElementById('modalProveedor').classList.add('open');
}

async function validarRucEnTiempoReal() {
  const ruc = document.getElementById('pRuc').value.trim();
  const error = document.getElementById('rucError');
  if (ruc.length === 13 && /^\d{13}$/.test(ruc)) {
    try {
      const res = await fetch(`${API}/ruc/${ruc}`);
      const data = await res.json();
      if (data.existe) {
        error.textContent = '⚠ Este RUC ya está registrado.';
        error.classList.remove('hidden');
      } else {
        error.classList.add('hidden');
      }
    } catch {
      error.classList.add('hidden');
    }
  } else {
    error.classList.add('hidden');
  }
}

async function guardarProveedor() {
  const id = document.getElementById('proveedorId').value;
  const ruc = document.getElementById('pRuc').value.trim();
  const nombre = document.getElementById('pNombre').value.trim();
  const representante = document.getElementById('pRepresentante').value.trim();
  const tipo = document.getElementById('pTipo').value;
  const telefono = document.getElementById('pTelefono').value.trim();
  const email = document.getElementById('pEmail').value.trim();
  const direccion = document.getElementById('pDireccion').value.trim();
  const ciudad = document.getElementById('pCiudad').value.trim();
  const activo = getEstadoValue();

  let errores = [];

  if (!ruc) errores.push('El RUC es obligatorio.');
  else if (!/^\d{13}$/.test(ruc)) errores.push('El RUC debe tener exactamente 13 dígitos.');

  if (!nombre) errores.push('El nombre o razón social es obligatorio.');

  if (telefono && !/^\d{10}$/.test(telefono)) errores.push('El teléfono debe tener exactamente 10 dígitos.');

  if (email && !/^[\w.-]+@[\w.-]+\.\w{2,}$/.test(email)) errores.push('El correo debe tener un formato válido.');

  if (!direccion) errores.push('La dirección es obligatoria.');

  if (!ciudad) errores.push('La ciudad es obligatoria.');

  if (!tipo) errores.push('Debe seleccionarse un tipo de proveedor.');

  if (errores.length) { errores.forEach(e => showToast(e, 'error')); return; }

  const body = { ruc, nombre, representante: representante || undefined, tipo, telefono: telefono || undefined, email: email || undefined, direccion, ciudad, activo };

  try {
    if (!id) {
      const check = await fetch(`${API}/ruc/${ruc}`);
      const checkData = await check.json();
      if (checkData.existe) { showToast('El RUC ya está registrado.', 'error'); return; }
    }
    const res = id
      ? await fetch(`${API}/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      : await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!res.ok) {
      const errData = await res.json();
      showToast(errData.error || 'Error al guardar', 'error');
      return;
    }
    showToast(id ? 'Proveedor actualizado ✓' : 'Proveedor creado ✓');
    document.getElementById('modalProveedor').classList.remove('open');
    await cargarProveedores();
  } catch {
    showToast('Error al guardar el proveedor', 'error');
  }
}

async function toggleEstadoProveedor(id) {
  const p = proveedores.find(x => x.id === id);
  if (!p) return;
  const nuevaAccion = p.activo ? 'desactivar' : 'activar';
  if (!confirm(`¿${nuevaAccion === 'desactivar' ? 'Desactivar' : 'Activar'} a ${p.nombre}?`)) return;
  try {
    const res = await fetch(`${API}/${id}/toggle-estado`, { method: 'PUT' });
    if (!res.ok) throw new Error();
    showToast(`Proveedor ${nuevaAccion === 'desactivar' ? 'desactivado' : 'activado'} ✓`);
    await cargarProveedores();
  } catch {
    showToast('Error al cambiar estado', 'error');
  }
}

async function eliminarProveedor(id) {
  const p = proveedores.find(x => x.id === id);
  if (!p) return;
  if (!confirm(`¿Eliminar a ${p.nombre}?`)) return;
  try {
    const res = await fetch(`${API}/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error();
    showToast('Proveedor eliminado ✓');
    await cargarProveedores();
  } catch {
    showToast('Error al eliminar proveedor', 'error');
  }
}

function generarReporte() {
  if (!proveedores.length) {
    showToast('No hay proveedores para generar un reporte.', 'error');
    return;
  }
  const texto = document.getElementById('searchInput').value.toLowerCase().trim();
  const estado = document.getElementById('filtroEstado').value;
  const filtrados = proveedores.filter(p =>
    (!texto || p.ruc?.includes(texto) || p.nombre?.toLowerCase().includes(texto) || p.ciudad?.toLowerCase().includes(texto)) &&
    (estado === '' || p.activo.toString() === estado)
  );
  if (!filtrados.length) {
    showToast('No hay datos que coincidan con los filtros para generar el reporte.', 'error');
    return;
  }
  let html = `<html><head><meta charset="UTF-8"><title>Reporte de Proveedores</title>
    <style>
      body { font-family: 'DM Sans', sans-serif; padding: 40px; color: #1a1a1a; }
      h1 { color: #7baa2f; font-size: 22px; margin-bottom: 4px; }
      .sub { color: #5a6b5e; font-size: 13px; margin-bottom: 24px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th { background: #3b1f13; color: #fff; padding: 10px 12px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.8px; }
      td { padding: 9px 12px; border-bottom: 1px solid #eee; }
      .activo { color: #155724; background: #d4edda; padding: 2px 8px; border-radius: 4px; font-size: 10px; }
      .inactivo { color: #6b7280; background: #f3f4f6; padding: 2px 8px; border-radius: 4px; font-size: 10px; }
      .footer { margin-top: 30px; font-size: 11px; color: #9aab9e; }
    </style></head><body>
    <h1>Reporte de Proveedores</h1>
    <div class="sub">CacaoGest — Ciclo 2026 | Generado: ${new Date().toLocaleDateString('es-EC')}</div>
    <table><thead><tr><th>RUC</th><th>Razón Social</th><th>Representante</th><th>Teléfono</th><th>Email</th><th>Dirección</th><th>Ciudad</th><th>Tipo</th><th>Estado</th></tr></thead><tbody>`;
  filtrados.forEach(p => {
    html += `<tr>
      <td>${p.ruc}</td>
      <td>${p.nombre}</td>
      <td>${p.representante || '—'}</td>
      <td>${p.telefono || '—'}</td>
      <td>${p.email || '—'}</td>
      <td>${p.direccion}</td>
      <td>${p.ciudad}</td>
      <td>${formatearTipo(p.tipo)}</td>
      <td><span class="${p.activo ? 'activo' : 'inactivo'}">${p.activo ? 'Activo' : 'Inactivo'}</span></td>
    </tr>`;
  });
  html += `</tbody></table><div class="footer">Total de proveedores: ${filtrados.length}</div></body></html>`;
  const ventana = window.open('', '_blank');
  ventana.document.write(html);
  ventana.document.close();
}

function cerrarModal(id) { document.getElementById(id).classList.remove('open'); }

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.estado-toggle').forEach(toggle => {
    toggle.addEventListener('click', e => {
      const option = e.target.closest('.estado-option');
      if (!option) return;
      const radio = option.querySelector('input');
      if (!radio) return;
      radio.checked = true;
      option.closest('.estado-toggle').querySelectorAll('.estado-option').forEach(el => el.classList.remove('selected'));
      option.classList.add('selected');
    });
  });
  cargarProveedores();
});
