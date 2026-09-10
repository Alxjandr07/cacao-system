const API = 'http://localhost:8081/api/proveedores';
let proveedores = [];
let proveedorActual = null;
let insumos = [];

Pag.registrar('proveedores', 'tablaBody', 'pag-tablaBody');
Pag.registrar('insumos', 'insumosBody', 'pag-insumosBody');

const SUMINISTROS = {
  QUIMICOS:     { label: '🧪 Químicos',     cls: 'badge-poda' },
  FERTILIZANTES:{ label: '🌿 Fertilizantes',cls: 'badge-cacao' },
  HERRAMIENTAS: { label: '🔧 Herramientas', cls: 'badge-primera' },
  PLANTAS_CACAO:{ label: '🌱 Plantas de cacao', cls: 'badge-pendiente' },
  OTROS:        { label: '📦 Otros',        cls: 'badge-otro' }
};

function formatearSuministros(p) {
  const lista = (p.suministros || '').split(',').map(s => s.trim()).filter(Boolean);
  if (!lista.length) return '<span style="font-size:11px;color:var(--border-color)">—</span>';
  return lista.map(s => SUMINISTROS[s]
    ? `<span class="badge ${SUMINISTROS[s].cls}">${SUMINISTROS[s].label}</span>`
    : `<span class="badge badge-otro">${s}</span>`).join(' ');
}

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

async function cargarProveedores(conToast) {
  try {
    const res = await fetch(API);
    if (!res.ok) throw new Error();
    proveedores = await res.json();
    filtrar();
    if (conToast) showToast('Datos actualizados correctamente ✓');
  } catch {
    if (conToast) showToast('No se pudieron actualizar los datos', 'error');
    if (!proveedores.length) {
      Pag.pintar('proveedores', [], '<tr><td colspan="9" class="empty-state">⚠ No se pudo conectar con el servidor</td></tr>');
    }
  }
}

function renderTabla(lista) {
  const filas = lista.map(p => `
    <tr>
      <td class="mono">${p.ruc || '—'}</td>
      <td class="name">${p.nombre}</td>
      <td>${p.representante || '—'}</td>
      <td class="mono">${p.telefono || '—'}</td>
      <td>${p.ciudad}</td>
      <td><span class="badge badge-cacao">${formatearTipo(p.tipo)}</span></td>
      <td style="max-width:220px">${formatearSuministros(p)}</td>
      <td>${p.activo
        ? '<span class="badge badge-completada">✓ Activo</span>'
        : '<span class="badge badge-cancelada">✕ Inactivo</span>'}</td>
      <td>
        <button class="action-btn" onclick="abrirInsumos(${p.id})">📦 Insumos</button>
        <button class="action-btn" onclick="editarProveedor(${p.id})">✎ Editar</button>
        <button class="action-btn" onclick="toggleEstadoProveedor(${p.id})">${p.activo ? '🔒 Desactivar' : '🔓 Activar'}</button>
        <button class="action-btn danger" onclick="eliminarProveedor(${p.id})">✕ Eliminar</button>
      </td>
    </tr>
  `);
  Pag.pintar('proveedores', filas, '<tr><td colspan="9" class="empty-state">No hay proveedores registrados</td></tr>');
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
  setSuministros([]);
  document.getElementById('rucError').classList.add('hidden');
  document.getElementById('rucError').textContent = '';
  document.getElementById('modalProveedor').classList.add('open');
}

function setSuministros(lista) {
  const opciones = ['QUIMICOS','FERTILIZANTES','HERRAMIENTAS','PLANTAS_CACAO','OTROS'];
  opciones.forEach(v => {
    const cb = document.querySelector(`#pSuministrosGroup input[value="${v}"]`);
    if (cb) cb.checked = lista.includes(v);
  });
}

function getSuministros() {
  return [...document.querySelectorAll('#pSuministrosGroup input:checked')].map(c => c.value).join(',') || null;
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
  setSuministros((p.suministros || '').split(',').map(s => s.trim()).filter(Boolean));
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

  const body = { ruc, nombre, representante: representante || undefined, tipo, telefono: telefono || undefined, email: email || undefined, direccion, ciudad, suministros: getSuministros(), activo };

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

// ── INSUMOS DEL PROVEEDOR (vinculados a inventario) ─────────
async function abrirInsumos(proveedorId) {
  const p = proveedores.find(x => x.id === proveedorId);
  if (!p) return;
  proveedorActual = p;
  document.getElementById('insumosTitulo').textContent = `Insumos de ${p.nombre}`;
  document.getElementById('iNombre').value = '';
  document.getElementById('iUnidad').value = 'unidades';
  document.getElementById('iStockMin').value = '0';
  document.getElementById('modalInsumos').classList.add('open');
  await cargarInsumos(proveedorId);
}

async function cargarInsumos(proveedorId) {
  try {
    const res = await fetch(`${API}/${proveedorId}/insumos`);
    if (!res.ok) throw new Error();
    insumos = await res.json();
    renderInsumos();
  } catch {
    Pag.pintar('insumos', [], '<tr><td colspan="5" class="empty-state">⚠ No se pudieron cargar los insumos</td></tr>');
  }
}

function renderInsumos() {
  const filas = insumos.map(i => `
    <tr>
      <td class="name">${i.nombre}</td>
      <td>${i.unidadMedida}</td>
      <td class="mono">${i.stockMinimo ?? 0}</td>
      <td class="mono">${i.producto?.stockActual ?? 0} ${i.producto?.unidadMedida || i.unidadMedida}</td>
      <td>
        <button class="action-btn" style="font-size:11px;color:var(--green-dark)" onclick="verEnInventario(${i.id})">📦 Ver</button>
        <button class="action-btn danger" onclick="eliminarInsumo(${i.id})">✕</button>
      </td>
    </tr>`);
  Pag.pintar('insumos', filas, '<tr><td colspan="5" class="empty-state">Este proveedor aún no registra insumos</td></tr>');
}

async function guardarInsumo() {
  const nombre = document.getElementById('iNombre').value.trim();
  const unidad = document.getElementById('iUnidad').value;
  const stockMin = document.getElementById('iStockMin').value;
  if (!nombre || nombre.length < 3) { showToast('El nombre del insumo debe tener al menos 3 caracteres.', 'error'); return; }
  if (!proveedorActual) return;
  try {
    const res = await fetch(`${API}/${proveedorActual.id}/insumos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, unidadMedida: unidad, stockMinimo: stockMin || 0 })
    });
    const data = await res.json();
    if (!res.ok) { showToast(data.error || 'Error al agregar insumo', 'error'); return; }
    document.getElementById('iNombre').value = '';
    document.getElementById('iStockMin').value = '0';
    showToast('Insumo creado y agregado a Inventario ✓');
    await cargarInsumos(proveedorActual.id);
  } catch { showToast('Error al guardar insumo', 'error'); }
}

async function eliminarInsumo(insumoId) {
  const i = insumos.find(x => x.id === insumoId);
  if (!i) return;
  if (!confirm(`¿Quitar "${i.nombre}" del catálogo de ${proveedorActual.nombre}?`)) return;
  try {
    const res = await fetch(`${API}/insumos/${insumoId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error();
    showToast('Insumo quitado del proveedor (el inventario se conserva)');
    await cargarInsumos(proveedorActual.id);
  } catch { showToast('Error al eliminar insumo', 'error'); }
}

function verEnInventario(insumoId) {
  const i = insumos.find(x => x.id === insumoId);
  if (!i?.producto) return;
  window.open(`inventario.html?producto=${i.producto.id}`, '_blank');
}

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
