/* =====================================================
   CacaoGest — auditoria.js
   ===================================================== */
const API_AUDITORIA = 'http://localhost:8081/api/auditoria';
const API_BACKUPS   = 'http://localhost:8081/api/backups';

Pag.registrar('auditoria', 'tablaAuditoriaBody', 'pag-tablaAuditoriaBody');
Pag.registrar('respaldos', 'tablaRespaldosBody', 'pag-tablaRespaldosBody');

function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => t.className = 'toast', 3000);
}

function formatFechaHora(isoStr) {
  if (!isoStr) return '—';
  const tgl = isoStr.includes('T') ? isoStr : isoStr + 'T00:00:00';
  const d = new Date(tgl);
  if (isNaN(d.getTime())) return isoStr;
  const p = n => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return '—';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function escapaHtml(s) {
  return (s == null ? '' : String(s))
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const BADGE_ACCION = {
  'LOGIN':          'badge-completada',
  'LOGIN_FALLIDO':  'badge-cancelada',
  'LOGOUT':         'badge-otro',
  'INSERT':         'badge-disponible',
  'UPDATE':         'badge-pendiente',
  'DELETE':         'badge-critico',
  'RESPALDO':       'badge-cacao',
  'RESTAURACION':   'badge-insumo',
  'ELIMINAR_BACKUP':'badge-critico'
};

// ── TABS ────────────────────────────────────────────
function switchTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById('vistaAuditoria').style.display = tab === 'auditoria' ? '' : 'none';
  document.getElementById('vistaRespaldos').style.display = tab === 'respaldos' ? '' : 'none';
  document.getElementById(tab === 'auditoria' ? 'tabAuditoria' : 'tabRespaldos').classList.add('active');
  if (tab === 'respaldos') {
    cargarRespaldos();
    cargarProgramacion();
  }
}

// ── AUDITORÍA ───────────────────────────────────────
async function cargarAuditoria() {
  const params = new URLSearchParams();
  const u = document.getElementById('fUsuario').value.trim();
  const a = document.getElementById('fAccion').value;
  const e = document.getElementById('fEntidad').value.trim();
  const d = document.getElementById('fDesde').value;
  const h = document.getElementById('fHasta').value;
  if (u) params.set('usuario', u);
  if (a) params.set('accion', a);
  if (e) params.set('entidad', e);
  if (d) params.set('desde', d + ':00');
  if (h) params.set('hasta', h + ':00');
  params.set('limite', '800');

  Pag.pintar('auditoria', [], '<tr><td colspan="7" class="empty-state">Cargando auditoría...</td></tr>');
  try {
    const res = await fetch(`${API_AUDITORIA}?${params}`);
    if (!res.ok) throw new Error();
    const registros = await res.json();
    if (!registros.length) {
      Pag.pintar('auditoria', [], '<tr><td colspan="7" class="empty-state">No hay registros para los filtros seleccionados</td></tr>');
      return;
    }
    const filas = registros.map(aud => {
      const badge = BADGE_ACCION[aud.accion] || 'badge-otro';
      const detalle = aud.detalle || '—';
      return `
        <tr>
          <td class="mono" style="font-size:11px">${formatFechaHora(aud.fecha)}</td>
          <td class="name">${aud.usuario}</td>
          <td><span class="badge ${badge}">${aud.accion}</span></td>
          <td>${aud.entidad}</td>
          <td class="mono">${aud.entidadId != null ? aud.entidadId : '—'}</td>
          <td class="mono" style="font-size:11px">${aud.ip || '—'}</td>
          <td><button class="action-btn ok" data-detalle="${escapaHtml(detalle)}" onclick="verDetalle(this)">Ver detalles</button></td>
        </tr>`;
    });
    Pag.pintar('auditoria', filas);
  } catch {
    Pag.pintar('auditoria', [], '<tr><td colspan="7" class="empty-state">Error al cargar la auditoría</td></tr>');
    showToast('Error al cargar la auditoría', 'error');
  }
}

function aplicarFiltros() { cargarAuditoria(); }

function verDetalle(btn) {
  document.getElementById('detalleTexto').textContent = btn.getAttribute('data-detalle') || '';
  document.getElementById('modalDetalle').classList.add('open');
}

function cerrarDetalle() {
  document.getElementById('modalDetalle').classList.remove('open');
}

function limpiarFiltros() {
  document.getElementById('fUsuario').value = '';
  document.getElementById('fAccion').value = '';
  document.getElementById('fEntidad').value = '';
  document.getElementById('fDesde').value = '';
  document.getElementById('fHasta').value = '';
  cargarAuditoria();
}

// ── RESPALDOS ───────────────────────────────────────
async function cargarRespaldos() {
  Pag.pintar('respaldos', [], '<tr><td colspan="4" class="empty-state">Cargando respaldos...</td></tr>');
  try {
    const res = await fetch(API_BACKUPS);
    if (!res.ok) throw new Error();
    const backups = await res.json();
    if (!backups.length) {
      Pag.pintar('respaldos', [], '<tr><td colspan="4" class="empty-state">Aún no hay respaldos. Genera el primero pulsando el botón superior.</td></tr>');
      return;
    }
    const filas = backups.map(b => `
      <tr>
        <td class="mono" style="font-size:12px">${b.nombre}</td>
        <td class="mono">${formatBytes(b.tamanoBytes)}</td>
        <td class="mono" style="font-size:12px">${formatFechaHora(b.fecha)}</td>
        <td>
          <button class="action-btn ok" onclick="descargarRespaldo('${b.nombre}')">⬇ Descargar</button>
          <button class="action-btn" onclick="restaurarRespaldo('${b.nombre}')">↺ Restaurar</button>
          <button class="action-btn danger" onclick="eliminarRespaldo('${b.nombre}')">✕ Eliminar</button>
        </td>
      </tr>`);
    Pag.pintar('respaldos', filas);
  } catch {
    Pag.pintar('respaldos', [], '<tr><td colspan="4" class="empty-state">Error al cargar los respaldos</td></tr>');
    showToast('Error al cargar los respaldos', 'error');
  }
}

async function generarRespaldo() {
  try {
    showToast('Generando respaldo, espera unos segundos...', 'success');
    const res = await fetch(`${API_BACKUPS}/export`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error');
    showToast(`Respaldo generado: ${data.archivo}`);
    cargarRespaldos();
  } catch (e) {
    showToast(e.message || 'Error al generar el respaldo', 'error');
  }
}

function descargarRespaldo(nombre) {
  window.location.href = `${API_BACKUPS}/download/${encodeURIComponent(nombre)}`;
}

async function restaurarRespaldo(nombre) {
  if (!confirm(`⚠️ ¿Restaurar la base de datos desde "${nombre}"?\nSe reemplazarán los datos actuales con los del respaldo.`)) return;
  try {
    const res = await fetch(`${API_BACKUPS}/restore/${encodeURIComponent(nombre)}`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error');
    showToast(data.mensaje || 'Base de datos restaurada');
  } catch (e) {
    showToast(e.message || 'Error al restaurar', 'error');
  }
}

async function eliminarRespaldo(nombre) {
  if (!confirm(`¿Eliminar el respaldo "${nombre}"?`)) return;
  try {
    const res = await fetch(`${API_BACKUPS}/${encodeURIComponent(nombre)}`, { method: 'DELETE' });
    if (!res.ok) throw new Error();
    showToast('Respaldo eliminado');
    cargarRespaldos();
  } catch {
    showToast('Error al eliminar el respaldo', 'error');
  }
}

// ── PROGRAMACIÓN DE RESPALDOS ───────────────────────
const DIAS_SEMANA = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];

function poblarSelectoresProgramacion() {
  const ds = document.getElementById('cfgDiaSemana');
  ds.innerHTML = DIAS_SEMANA.map((d, i) => `<option value="${i + 1}">${d}</option>`).join('');
  const dm = document.getElementById('cfgDiaMes');
  dm.innerHTML = Array.from({ length: 31 }, (_, i) => i + 1)
    .map(d => `<option value="${d}">Día ${d}</option>`).join('');
}

function toggleCamposProgramacion() {
  const f = document.getElementById('cfgFrecuencia').value;
  document.getElementById('cfgDiaSemanaWrap').style.display = f === 'SEMANAL' ? 'flex' : 'none';
  document.getElementById('cfgDiaMesWrap').style.display = f === 'MENSUAL' ? 'flex' : 'none';
}

async function cargarProgramacion() {
  try {
    const res = await fetch(`${API_BACKUPS}/config`);
    if (!res.ok) throw new Error();
    const c = await res.json();
    document.getElementById('cfgFrecuencia').value = c.frecuencia || 'DESACTIVADO';
    if (c.hora) document.getElementById('cfgHora').value = c.hora.substring(0, 5);
    if (c.diaSemana) document.getElementById('cfgDiaSemana').value = c.diaSemana;
    if (c.diaMes) document.getElementById('cfgDiaMes').value = c.diaMes;
    document.getElementById('cfgActivo').checked = !!c.activo;
    toggleCamposProgramacion();
    renderEstadoProgramacion(c);
  } catch {
    showToast('Error al cargar la programación', 'error');
  }
}

function renderEstadoProgramacion(c) {
  const el = document.getElementById('cfgEstado');
  if (!c || c.frecuencia === 'DESACTIVADO' || !c.activo) {
    el.textContent = '⏸ Programación desactivada.';
    return;
  }
  const hora = (c.hora || '--:--').substring(0, 5);
  const cuando = c.frecuencia === 'DIARIO' ? 'Todos los días'
    : c.frecuencia === 'SEMANAL' ? `Cada ${DIAS_SEMANA[(c.diaSemana || 1) - 1]}`
    : `El día ${c.diaMes || 1} de cada mes`;
  el.textContent = `🔁 ${cuando} a las ${hora}. Próximo respaldo: ${proximaEjecucion(c)}.`;
}

function proximaEjecucion(c) {
  const ahora = new Date();
  const [hh, mm] = (c.hora || '00:00').split(':').map(Number);
  if (c.frecuencia === 'DIARIO') {
    const d = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), hh, mm, 0);
    if (d <= ahora) d.setDate(d.getDate() + 1);
    return formatFechaHora(d.toISOString());
  }
  if (c.frecuencia === 'SEMANAL') {
    const diaObj = (c.diaSemana || 1) % 7;
    for (let i = 0; i < 8; i++) {
      const d = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + i, hh, mm, 0);
      if (d.getDay() === diaObj && d > ahora) return formatFechaHora(d.toISOString());
    }
  }
  if (c.frecuencia === 'MENSUAL') {
    for (let i = 0; i < 13; i++) {
      const d = new Date(ahora.getFullYear(), ahora.getMonth() + i, (c.diaMes || 1), hh, mm, 0);
      if (d > ahora) return formatFechaHora(d.toISOString());
    }
  }
  return '—';
}

async function guardarProgramacion() {
  const frecuencia = document.getElementById('cfgFrecuencia').value;
  const hora = document.getElementById('cfgHora').value;
  const diaSemana = frecuencia === 'SEMANAL' ? document.getElementById('cfgDiaSemana').value : null;
  const diaMes = frecuencia === 'MENSUAL' ? document.getElementById('cfgDiaMes').value : null;
  const activo = document.getElementById('cfgActivo').checked;

  if (!hora) { showToast('Selecciona una hora', 'error'); return; }
  if (frecuencia === 'SEMANAL' && !diaSemana) { showToast('Selecciona el día de la semana', 'error'); return; }
  if (frecuencia === 'MENSUAL' && !diaMes) { showToast('Selecciona el día del mes', 'error'); return; }

  try {
    const res = await fetch(`${API_BACKUPS}/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        frecuencia,
        hora,
        diaSemana: diaSemana ? parseInt(diaSemana) : null,
        diaMes: diaMes ? parseInt(diaMes) : null,
        activo
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al guardar');
    showToast('Programación guardada ✓');
    renderEstadoProgramacion(data);
  } catch (e) {
    showToast(e.message || 'Error al guardar la programación', 'error');
  }
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
  poblarSelectoresProgramacion();
  cargarAuditoria();
});