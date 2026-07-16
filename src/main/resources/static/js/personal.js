const API = 'http://localhost:8080/api/personal';
const API_USUARIOS = 'http://localhost:8080/api/usuarios';
let personal = [];

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

async function cargarPersonal() {
  try {
    const res = await fetch(API);
    if (!res.ok) throw new Error();
    personal = await res.json();
    filtrar();
  } catch {
    document.getElementById('tablaBody').innerHTML =
      '<tr><td colspan="9" class="empty-state">⚠ No se pudo conectar con el servidor</td></tr>';
  }
}

function renderTabla(lista) {
  const tbody = document.getElementById('tablaBody');
  if (!lista.length) {
    tbody.innerHTML = '<tr><td colspan="9" class="empty-state">No hay empleados registrados</td></tr>';
    return;
  }
  tbody.innerHTML = lista.map(p => `
    <tr>
      <td class="mono">${p.cedula || '—'}</td>
      <td class="name">${p.nombres}</td>
      <td class="name">${p.apellidos}</td>
      <td>${p.cargo}</td>
      <td class="mono">${p.telefono || '—'}</td>
      <td>${p.email || '—'}</td>
      <td class="mono">${p.fechaIngreso ? formatearFecha(p.fechaIngreso) : '—'}</td>
      <td>${p.activo
        ? '<span class="badge badge-completada">✓ Activo</span>'
        : '<span class="badge badge-cancelada">✕ Inactivo</span>'}</td>
      <td>
        <button class="action-btn" onclick="editarPersonal(${p.id})">✎ Editar</button>
        <button class="action-btn" onclick="toggleEstadoPersonal(${p.id})">${p.activo ? '🔒 Desactivar' : '🔓 Activar'}</button>
        <button class="action-btn danger" onclick="eliminarPersonal(${p.id})">✕ Eliminar</button>
      </td>
    </tr>
  `).join('');
}

function formatearFecha(fecha) {
  if (!fecha) return '—';
  const d = new Date(fecha + 'T00:00:00');
  return d.toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function filtrar() {
  const texto = document.getElementById('searchInput').value.toLowerCase().trim();
  const estado = document.getElementById('filtroEstado').value;
  renderTabla(personal.filter(p =>
    (!texto || p.cedula?.includes(texto) || p.nombres?.toLowerCase().includes(texto) || p.apellidos?.toLowerCase().includes(texto) || p.cargo?.toLowerCase().includes(texto)) &&
    (estado === '' || p.activo.toString() === estado)
  ));
}
document.getElementById('searchInput').addEventListener('input', filtrar);

function abrirModalPersonal() {
  document.getElementById('modalTitulo').textContent = 'Nuevo empleado';
  document.getElementById('personalId').value = '';
  document.getElementById('pCedula').value = '';
  document.getElementById('pCedula').readOnly = false;
  document.getElementById('pNombres').value = '';
  document.getElementById('pApellidos').value = '';
  document.getElementById('pCargo').value = '';
  document.getElementById('pTelefono').value = '';
  document.getElementById('pEmail').value = '';
  document.getElementById('pDireccion').value = '';
  document.getElementById('pFechaIngreso').value = '';
  setEstadoValue(true);
  document.getElementById('cedulaError').classList.add('hidden');
  document.getElementById('cedulaError').textContent = '';
  document.getElementById('modalPersonal').classList.add('open');
}

function editarPersonal(id) {
  const p = personal.find(x => x.id === id);
  if (!p) return;
  document.getElementById('modalTitulo').textContent = 'Editar empleado';
  document.getElementById('personalId').value = p.id;
  document.getElementById('pCedula').value = p.cedula || '';
  document.getElementById('pCedula').readOnly = true;
  document.getElementById('pNombres').value = p.nombres || '';
  document.getElementById('pApellidos').value = p.apellidos || '';
  document.getElementById('pCargo').value = p.cargo || '';
  document.getElementById('pTelefono').value = p.telefono || '';
  document.getElementById('pEmail').value = p.email || '';
  document.getElementById('pDireccion').value = p.direccion || '';
  document.getElementById('pFechaIngreso').value = p.fechaIngreso || '';
  setEstadoValue(p.activo);
  document.getElementById('cedulaError').classList.add('hidden');
  document.getElementById('cedulaError').textContent = '';
  document.getElementById('modalPersonal').classList.add('open');
}

async function validarCedulaEnTiempoReal() {
  const cedula = document.getElementById('pCedula').value.trim();
  const error = document.getElementById('cedulaError');
  if (cedula.length === 10 && /^\d{10}$/.test(cedula)) {
    try {
      const res = await fetch(`${API}/cedula/${cedula}`);
      const data = await res.json();
      if (data.existe) {
        error.textContent = '⚠ Esta cédula ya está registrada.';
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

async function guardarPersonal() {
  const id = document.getElementById('personalId').value;
  const cedula = document.getElementById('pCedula').value.trim();
  const nombres = document.getElementById('pNombres').value.trim();
  const apellidos = document.getElementById('pApellidos').value.trim();
  const cargo = document.getElementById('pCargo').value;
  const telefono = document.getElementById('pTelefono').value.trim();
  const email = document.getElementById('pEmail').value.trim();
  const direccion = document.getElementById('pDireccion').value.trim();
  const fechaIngreso = document.getElementById('pFechaIngreso').value;
  const activo = getEstadoValue();

  let errores = [];

  if (!cedula) errores.push('La cédula es obligatoria.');
  else if (!/^\d{10}$/.test(cedula)) errores.push('La cédula debe tener exactamente 10 dígitos.');

  if (!nombres) errores.push('Los nombres son obligatorios.');
  else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(nombres)) errores.push('Los nombres solo permiten letras y espacios.');

  if (!apellidos) errores.push('Los apellidos son obligatorios.');
  else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(apellidos)) errores.push('Los apellidos solo permiten letras y espacios.');

  if (!cargo) errores.push('Debe seleccionarse un cargo.');

  if (telefono && !/^\d{10}$/.test(telefono)) errores.push('El teléfono debe tener exactamente 10 dígitos.');

  if (email && !/^[\w.-]+@[\w.-]+\.\w{2,}$/.test(email)) errores.push('El correo debe tener un formato válido.');

  if (!direccion) errores.push('La dirección no puede quedar vacía.');

  if (fechaIngreso) {
    const hoy = new Date().toISOString().split('T')[0];
    if (fechaIngreso > hoy) errores.push('La fecha de ingreso no puede ser mayor a la fecha actual.');
  }

  if (errores.length) { errores.forEach(e => showToast(e, 'error')); return; }

  const body = { cedula, nombres, apellidos, cargo, telefono: telefono || undefined, email: email || undefined, direccion, fechaIngreso: fechaIngreso || undefined, activo };

  try {
    if (!id) {
      const check = await fetch(`${API}/cedula/${cedula}`);
      const checkData = await check.json();
      if (checkData.existe) { showToast('La cédula ya está registrada.', 'error'); return; }
    }
    const res = id
      ? await fetch(`${API}/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      : await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!res.ok) {
      const errData = await res.json();
      showToast(errData.error || 'Error al guardar', 'error');
      return;
    }
    showToast(id ? 'Empleado actualizado ✓' : 'Empleado creado ✓');
    document.getElementById('modalPersonal').classList.remove('open');
    await cargarPersonal();
  } catch {
    showToast('Error al guardar el empleado', 'error');
  }
}

async function toggleEstadoPersonal(id) {
  const p = personal.find(x => x.id === id);
  if (!p) return;
  const nuevaAccion = p.activo ? 'desactivar' : 'activar';
  if (!confirm(`¿${nuevaAccion === 'desactivar' ? 'Desactivar' : 'Activar'} a ${p.nombres} ${p.apellidos}?`)) return;
  try {
    const res = await fetch(`${API}/${id}/toggle-estado`, { method: 'PUT' });
    if (!res.ok) throw new Error();
    showToast(`Empleado ${nuevaAccion === 'desactivar' ? 'desactivado' : 'activado'} ✓`);
    await cargarPersonal();
  } catch {
    showToast('Error al cambiar estado', 'error');
  }
}

async function eliminarPersonal(id) {
  const p = personal.find(x => x.id === id);
  if (!p) return;
  if (p.cargo === 'Administrador' && p.activo) {
    showToast('No se puede eliminar al administrador principal.', 'error');
    return;
  }
  if (!confirm(`¿Eliminar a ${p.nombres} ${p.apellidos}?`)) return;
  try {
    const res = await fetch(`${API}/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error();
    showToast('Empleado eliminado ✓');
    await cargarPersonal();
  } catch {
    showToast('Error al eliminar empleado', 'error');
  }
}

function generarReporte() {
  if (!personal.length) {
    showToast('No hay empleados para generar un reporte.', 'error');
    return;
  }
  const texto = document.getElementById('searchInput').value.toLowerCase().trim();
  const estado = document.getElementById('filtroEstado').value;
  const filtrados = personal.filter(p =>
    (!texto || p.cedula?.includes(texto) || p.nombres?.toLowerCase().includes(texto) || p.apellidos?.toLowerCase().includes(texto) || p.cargo?.toLowerCase().includes(texto)) &&
    (estado === '' || p.activo.toString() === estado)
  );
  if (!filtrados.length) {
    showToast('No hay datos que coincidan con los filtros para generar el reporte.', 'error');
    return;
  }
  let html = `<html><head><meta charset="UTF-8"><title>Reporte de Personal</title>
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
    <h1>Reporte de Personal</h1>
    <div class="sub">CacaoGest — Ciclo 2026 | Generado: ${new Date().toLocaleDateString('es-EC')}</div>
    <table><thead><tr><th>Cédula</th><th>Nombres</th><th>Apellidos</th><th>Cargo</th><th>Teléfono</th><th>Email</th><th>Fecha Ingreso</th><th>Estado</th></tr></thead><tbody>`;
  filtrados.forEach(p => {
    html += `<tr>
      <td>${p.cedula || '—'}</td>
      <td>${p.nombres}</td>
      <td>${p.apellidos}</td>
      <td>${p.cargo}</td>
      <td>${p.telefono || '—'}</td>
      <td>${p.email || '—'}</td>
      <td>${p.fechaIngreso ? formatearFecha(p.fechaIngreso) : '—'}</td>
      <td><span class="${p.activo ? 'activo' : 'inactivo'}">${p.activo ? 'Activo' : 'Inactivo'}</span></td>
    </tr>`;
  });
  html += `</tbody></table><div class="footer">Total de empleados: ${filtrados.length}</div></body></html>`;
  const ventana = window.open('', '_blank');
  ventana.document.write(html);
  ventana.document.close();
}

// ── CAMBIAR CONTRASEÑA ────────────────────────────────

async function abrirModalPassword() {
  document.getElementById('pwUserId').value = '';
  document.getElementById('pwUsername').value = '';
  document.getElementById('pwActual').value = '';
  document.getElementById('pwNueva').value = '';
  document.getElementById('pwConfirmar').value = '';
  document.getElementById('modalPassword').classList.add('open');
}

async function cambiarContrasena() {
  const userId = document.getElementById('pwUserId').value;
  const actual = document.getElementById('pwActual').value;
  const nueva = document.getElementById('pwNueva').value;
  const confirmar = document.getElementById('pwConfirmar').value;

  if (!actual || !nueva || !confirmar) {
    showToast('Todos los campos son obligatorios.', 'error');
    return;
  }
  if (nueva.length < 8) {
    showToast('La nueva contraseña debe tener mínimo 8 caracteres.', 'error');
    return;
  }
  if (!/[a-zA-Z]/.test(nueva) || !/\d/.test(nueva)) {
    showToast('La contraseña debe contener letras y números.', 'error');
    return;
  }
  if (nueva === actual) {
    showToast('La nueva contraseña no puede ser igual a la anterior.', 'error');
    return;
  }
  if (nueva !== confirmar) {
    showToast('La confirmación no coincide.', 'error');
    return;
  }

  const idLocal = JSON.parse(localStorage.getItem('usuario') || '{}').id;
  const targetId = userId || idLocal;
  if (!targetId) { showToast('Debes iniciar sesión para cambiar la contraseña.', 'error'); return; }

  try {
    const res = await fetch(`${API_USUARIOS}/${targetId}/cambiar-contrasena`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contrasenaActual: actual, nuevaContrasena: nueva, confirmarContrasena: confirmar })
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || 'Error al cambiar contraseña', 'error');
      return;
    }
    showToast('Contraseña cambiada correctamente ✓');
    document.getElementById('modalPassword').classList.remove('open');
  } catch {
    showToast('Error al conectar con el servidor', 'error');
  }
}

function togglePasswordVisibility(checkbox) {
  const fields = ['pwActual', 'pwNueva', 'pwConfirmar'];
  fields.forEach(id => {
    document.getElementById(id).type = checkbox.checked ? 'text' : 'password';
  });
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
  cargarPersonal();
});
