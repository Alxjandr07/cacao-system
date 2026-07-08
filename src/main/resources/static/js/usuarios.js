/* =====================================================
   CacaoGest — usuarios.js
   ===================================================== */
const API_USUARIOS = 'http://localhost:8080/api/usuarios';
const API_ROLES    = 'http://localhost:8080/api/roles';
const API_PERMISOS = 'http://localhost:8080/api/permisos';

let usuarios = [];
let roles    = [];
let permisos = [];

// ── UTILS ──────────────────────────────────────────
function togglePassword() {
  const pw = document.getElementById('uPassword');
  pw.type = pw.type === 'password' ? 'text' : 'password';
}

function getEstadoValue() {
  return document.querySelector('input[name="uEstado"]:checked')?.value === 'true';
}

function setEstadoValue(activo) {
  document.querySelectorAll('input[name="uEstado"]').forEach(r => {
    r.checked = (r.value === 'true') === activo;
    r.closest('.estado-option').classList.toggle('selected', r.checked);
  });
}

function selectEstadoTab(e) {
  document.querySelectorAll('.estado-option').forEach(el => el.classList.remove('selected'));
  e.currentTarget.classList.add('selected');
}
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => t.className = 'toast', 3000);
}

function formatFecha(isoStr) {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  return d.toLocaleDateString('es-EC', { day:'2-digit', month:'2-digit', year:'numeric' });
}

function limpiarErrores(contenedorId) {
  document.querySelectorAll(`#${contenedorId} .field-error`).forEach(e => e.remove());
  document.querySelectorAll(`#${contenedorId} .input-error`).forEach(e => e.classList.remove('input-error'));
}

function marcarError(inputId, msg) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.classList.add('input-error');
  const err = document.createElement('span');
  err.className = 'field-error';
  err.textContent = msg;
  input.parentNode.appendChild(err);
}

// ── PERMISOS ──────────────────────────────────────────
async function cargarPermisos() {
  try {
    const res = await fetch(API_PERMISOS);
    if (!res.ok) throw new Error();
    permisos = await res.json();
  } catch {
    showToast('Error al cargar permisos', 'error');
  }
}

function renderizarPermisosEnModal(selectedIds = new Set()) {
  const container = document.getElementById('permisosContainer');
  if (!permisos.length) {
    container.innerHTML = '<span style="color:var(--border-color);font-size:12px">No hay permisos disponibles</span>';
    return;
  }
  const categorias = [...new Set(permisos.map(p => p.categoria))];
  container.innerHTML = categorias.map(cat => `
    <div class="permisos-group">
      <div class="permisos-group-label">■ ${cat}</div>
      <div class="permisos-grid">
        ${permisos.filter(p => p.categoria === cat).map(p => `
          <label class="permiso-check">
            <input type="checkbox" value="${p.id}" ${selectedIds.has(p.id) ? 'checked' : ''}>
            ${p.descripcion}
          </label>
        `).join('')}
      </div>
    </div>
  `).join('');
}

// ── TABS ────────────────────────────────────────────
function switchTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById('vistaUsuarios').style.display = tab === 'usuarios' ? '' : 'none';
  document.getElementById('vistaRoles').style.display = tab === 'roles' ? '' : 'none';
  document.getElementById(tab === 'usuarios' ? 'tabUsuarios' : 'tabRoles').classList.add('active');
  if (tab === 'roles') cargarPermisos();
  const btn = document.getElementById('btnNuevo');
  if (tab === 'roles') {
    btn.textContent = '+ Nuevo rol';
    btn.onclick = abrirModalRol;
  } else {
    btn.textContent = '+ Nuevo usuario';
    btn.onclick = abrirModalUsuario;
  }
}

// ── CRUD ROLES ──────────────────────────────────────
async function cargarRoles() {
  try {
    const res = await fetch(API_ROLES);
    if (!res.ok) throw new Error();
    roles = await res.json();
    renderizarRoles();
    poblarSelectRoles();
  } catch {
    showToast('Error al cargar roles', 'error');
  }
}

function renderizarRoles() {
  const body = document.getElementById('tablaRolesBody');
  if (roles.length === 0) {
    body.innerHTML = '<tr><td colspan="5" class="empty-state">No hay roles registrados</td></tr>';
    return;
  }
  body.innerHTML = roles.map(r => `
    <tr>
      <td class="name">${r.nombre}</td>
      <td>${r.descripcion || '—'}</td>
      <td style="max-width:200px">${(r.permisos || []).map(p =>
        `<span class="badge badge-disponible" style="margin:1px">${p.descripcion || p.nombre}</span>`
      ).join(' ') || '<span style="color:var(--border-color);font-size:11px">—</span>'}</td>
      <td class="mono">${r.usuarios ? r.usuarios.length : 0}</td>
      <td>
        <button class="action-btn" onclick="editarRol(${r.id})">✎ Editar</button>
        <button class="action-btn danger" onclick="eliminarRol(${r.id})">✕ Eliminar</button>
      </td>
    </tr>
  `).join('');
}

function poblarSelectRoles() {
  const sel = document.getElementById('uRolId');
  sel.innerHTML = '<option value="">Selecciona rol...</option>' +
    roles.map(r => `<option value="${r.id}">${r.nombre}</option>`).join('');
}

function abrirModalRol() {
  limpiarErrores('modalRol');
  document.getElementById('rolId').value = '';
  document.getElementById('rNombre').value = '';
  document.getElementById('rDescripcion').value = '';
  document.getElementById('modalRolTitulo').textContent = 'Nuevo rol';
  renderizarPermisosEnModal();
  document.getElementById('modalRol').classList.add('open');
}

function editarRol(id) {
  const r = roles.find(x => x.id === id);
  if (!r) return;
  limpiarErrores('modalRol');
  document.getElementById('rolId').value = r.id;
  document.getElementById('rNombre').value = r.nombre;
  document.getElementById('rDescripcion').value = r.descripcion || '';
  document.getElementById('modalRolTitulo').textContent = 'Editar rol';
  const selectedIds = new Set((r.permisos || []).map(p => p.id));
  renderizarPermisosEnModal(selectedIds);
  document.getElementById('modalRol').classList.add('open');
}

async function guardarRol() {
  limpiarErrores('modalRol');
  const id = document.getElementById('rolId').value;
  const nombre = document.getElementById('rNombre').value.trim().toUpperCase();
  const descripcion = document.getElementById('rDescripcion').value.trim();
  let errores = [];
  if (!nombre) errores.push('El nombre del rol es obligatorio.');
  if (nombre && nombre.length < 2) errores.push('El nombre debe tener al menos 2 caracteres.');
  if (errores.length) { errores.forEach(e => showToast(e, 'error')); return; }
  const checked = document.querySelectorAll('#permisosContainer input[type="checkbox"]:checked');
  const permisosIds = Array.from(checked).map(cb => ({ id: parseInt(cb.value) }));
  try {
    const body = { nombre, descripcion: descripcion || undefined, permisos: permisosIds };
    const res = id
      ? await fetch(`${API_ROLES}/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) })
      : await fetch(API_ROLES, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
    if (!res.ok) throw new Error();
    showToast(id ? 'Rol actualizado' : 'Rol creado');
    document.getElementById('modalRol').classList.remove('open');
    await Promise.all([cargarRoles(), cargarUsuarios()]);
  } catch {
    showToast('Error al guardar rol', 'error');
  }
}

async function eliminarRol(id) {
  if (!confirm('¿Eliminar este rol?')) return;
  try {
    const res = await fetch(`${API_ROLES}/${id}`, { method:'DELETE' });
    if (!res.ok) throw new Error();
    showToast('Rol eliminado');
    await Promise.all([cargarRoles(), cargarUsuarios()]);
  } catch {
    showToast('Error al eliminar rol. Puede tener usuarios asociados.', 'error');
  }
}

// ── CRUD USUARIOS ───────────────────────────────────
async function cargarUsuarios() {
  try {
    const res = await fetch(API_USUARIOS);
    if (!res.ok) throw new Error();
    usuarios = await res.json();
    renderizarUsuarios();
  } catch {
    showToast('Error al cargar usuarios', 'error');
  }
}

function renderizarUsuarios() {
  const body = document.getElementById('tablaUsuariosBody');
  if (usuarios.length === 0) {
    body.innerHTML = '<tr><td colspan="8" class="empty-state">No hay usuarios registrados</td></tr>';
    return;
  }
  body.innerHTML = usuarios.map(u => `
    <tr>
      <td class="name">${u.username}</td>
      <td>${u.nombres || '—'}</td>
      <td>${u.apellidos || '—'}</td>
      <td>${u.email}</td>
      <td><span class="badge ${u.rol && u.rol.nombre === 'ADMIN' ? 'badge-disponible' : 'badge-insumo'}">${u.rol ? u.rol.nombre : '—'}</span></td>
      <td>${u.activo ? '<span class="badge badge-completada">✓ Activo</span>' : '<span class="badge badge-cancelada">✕ Inactivo</span>'}</td>
      <td class="mono">${formatFecha(u.createdAt)}</td>
      <td>
        <button class="action-btn" onclick="editarUsuario(${u.id})">✎ Editar</button>
        <button class="action-btn danger" onclick="eliminarUsuario(${u.id})">✕ Eliminar</button>
      </td>
    </tr>
  `).join('');
}

function abrirModalUsuario() {
  limpiarErrores('modalUsuario');
  document.getElementById('usuarioId').value = '';
  document.getElementById('uNombres').value = '';
  document.getElementById('uApellidos').value = '';
  document.getElementById('uUsername').value = '';
  document.getElementById('uEmail').value = '';
  document.getElementById('uPassword').value = '';
  document.getElementById('uPassword').type = 'password';
  document.getElementById('uPassword').disabled = false;
  document.getElementById('uShowPw').checked = false;
  setEstadoValue(true);
  document.getElementById('modalUsuarioTitulo').textContent = 'Nuevo usuario';
  document.getElementById('modalUsuario').classList.add('open');
}

function editarUsuario(id) {
  const u = usuarios.find(x => x.id === id);
  if (!u) return;
  limpiarErrores('modalUsuario');
  document.getElementById('usuarioId').value = u.id;
  document.getElementById('uNombres').value = u.nombres || '';
  document.getElementById('uApellidos').value = u.apellidos || '';
  document.getElementById('uUsername').value = u.username;
  document.getElementById('uEmail').value = u.email;
  document.getElementById('uPassword').value = '';
  document.getElementById('uPassword').type = 'password';
  document.getElementById('uPassword').disabled = false;
  document.getElementById('uShowPw').checked = false;
  setEstadoValue(u.activo);
  document.getElementById('modalUsuarioTitulo').textContent = 'Editar usuario';
  document.getElementById('modalUsuario').classList.add('open');
  if (document.getElementById('uRolId').querySelector(`option[value="${u.rol ? u.rol.id : ''}"]`)) {
    document.getElementById('uRolId').value = u.rol ? u.rol.id : '';
  }
}

async function guardarUsuario() {
  limpiarErrores('modalUsuario');
  const id = document.getElementById('usuarioId').value;
  const nombres = document.getElementById('uNombres').value.trim();
  const apellidos = document.getElementById('uApellidos').value.trim();
  const username = document.getElementById('uUsername').value.trim();
  const email = document.getElementById('uEmail').value.trim();
  const password = document.getElementById('uPassword').value;
  const rolId = document.getElementById('uRolId').value;
  const activo = getEstadoValue();
  let errores = [];
  if (!nombres || nombres.length < 2) errores.push('Los nombres son obligatorios.');
  if (!apellidos || apellidos.length < 2) errores.push('Los apellidos son obligatorios.');
  if (!username || username.length < 3) errores.push('El usuario debe tener al menos 3 caracteres.');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errores.push('Ingresa un email válido.');
  if (!id && (!password || password.length < 6)) errores.push('La contraseña debe tener al menos 6 caracteres.');
  if (!rolId) errores.push('Selecciona un rol.');
  if (errores.length) { errores.forEach(e => showToast(e, 'error')); return; }
  try {
    const body = { username, nombres, apellidos, email, activo, rol: { id: parseInt(rolId) } };
    if (password) body.password = password;
    const res = id
      ? await fetch(`${API_USUARIOS}/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) })
      : await fetch(API_USUARIOS, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
    if (!res.ok) {
      const text = await res.text();
      if (res.status === 400) throw new Error('El usuario o email ya existe');
      throw new Error();
    }
    showToast(id ? 'Usuario actualizado' : 'Usuario creado');
    document.getElementById('modalUsuario').classList.remove('open');
    await cargarUsuarios();
  } catch (e) {
    showToast(e.message || 'Error al guardar usuario', 'error');
  }
}

async function eliminarUsuario(id) {
  if (!confirm('¿Eliminar este usuario?')) return;
  try {
    const res = await fetch(`${API_USUARIOS}/${id}`, { method:'DELETE' });
    if (!res.ok) throw new Error();
    showToast('Usuario eliminado');
    await cargarUsuarios();
  } catch {
    showToast('Error al eliminar usuario', 'error');
  }
}

function cerrarModal(id) {
  document.getElementById(id).classList.remove('open');
}

// ── INICIO ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const userData = JSON.parse(localStorage.getItem('usuario'));
  if (userData) {
    document.getElementById('userName').textContent = userData.nombres
      ? `${userData.nombres} ${userData.apellidos || ''}`
      : userData.username;
    document.getElementById('userRol').textContent = userData.rol || '';
  }
  document.querySelector('.estado-toggle')?.addEventListener('click', e => {
    const option = e.target.closest('.estado-option');
    if (!option) return;
    const radio = option.querySelector('input');
    if (!radio) return;
    radio.checked = true;
    document.querySelectorAll('.estado-option').forEach(el => el.classList.remove('selected'));
    option.classList.add('selected');
  });
  Promise.all([cargarUsuarios(), cargarRoles(), cargarPermisos()]);
});
