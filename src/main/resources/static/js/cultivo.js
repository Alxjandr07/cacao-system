/* =====================================================
   CacaoGest — cultivo.js
   ===================================================== */
const API = 'http://localhost:8080/api/cultivo';
let parcelas    = [];
let actividades = [];
let tabActual   = 'parcelas';

// ── UTILS ──────────────────────────────────────────
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => t.className = 'toast', 3000);
}
function formatFecha(f) {
  if (!f) return '—';
  const [y, m, d] = f.split('-');
  return `${d}/${m}/${y}`;
}
function tipoBadge(tipo) {
  const map = {
    PODA:['badge-poda','Poda'], FUMIGACION:['badge-fumigacion','Fumigación'],
    RIEGO:['badge-riego','Riego'], FERTILIZACION:['badge-fertilizacion','Fertilización'],
    CONTROL_PLAGAS:['badge-control','Control plagas'],
    LIMPIEZA:['badge-limpieza','Limpieza'], OTRO:['badge-otro','Otro']
  };
  const [cls, label] = map[tipo] || ['badge-otro', tipo];
  return `<span class="badge ${cls}">${label}</span>`;
}
function estadoBadge(estado) {
  const map = {
    PENDIENTE:['badge-pendiente','⏳ Pendiente'],
    EN_PROCESO:['badge-en-proceso','🔄 En proceso'],
    COMPLETADA:['badge-completada','✓ Completada'],
    CANCELADA:['badge-cancelada','✕ Cancelada']
  };
  const [cls, label] = map[estado] || ['badge-otro', estado];
  return `<span class="badge ${cls}">${label}</span>`;
}

// ── TABS ────────────────────────────────────────────
function switchTab(tab) {
  tabActual = tab;
  document.getElementById('vistaParcelas').style.display    = tab === 'parcelas'    ? '' : 'none';
  document.getElementById('vistaActividades').style.display = tab === 'actividades' ? '' : 'none';
  document.getElementById('tabParcelas').className    = 'tab' + (tab === 'parcelas'    ? ' active' : '');
  document.getElementById('tabActividades').className = 'tab' + (tab === 'actividades' ? ' active' : '');
  document.getElementById('btnNuevo').textContent = tab === 'parcelas' ? '+ Nueva parcela' : '+ Nueva actividad';
  document.getElementById('btnNuevo').onclick     = tab === 'parcelas' ? abrirModalParcela : abrirModalActividad;
  if (tab === 'actividades') cargarActividades();
}

// ── PARCELAS ────────────────────────────────────────
async function cargarParcelas() {
  try {
    const res = await fetch(`${API}/parcelas`);
    parcelas  = await res.json();
    renderParcelas(parcelas);
    poblarSelectParcelas();
    cargarVencidas();
  } catch {
    document.getElementById('parcelasGrid').innerHTML =
      '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--border-color)">⚠ No se pudo conectar</div>';
  }
}

function renderParcelas(lista) {
  const grid = document.getElementById('parcelasGrid');
  if (!lista.length) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--border-color)">No hay parcelas registradas</div>';
    return;
  }
  grid.innerHTML = lista.map(p => `
    <div class="parcela-card">
      <div class="parcela-name">🌿 ${p.nombre}</div>
      <div class="parcela-meta">📍 ${p.ubicacion}</div>
      ${p.hectareas    ? `<div class="parcela-meta">📐 ${p.hectareas} ha</div>` : ''}
      ${p.variedadCacao? `<div class="parcela-meta">🫘 ${p.variedadCacao}</div>` : ''}
      ${p.responsable  ? `<div class="parcela-meta">👤 ${p.responsable}</div>` : ''}
      ${p.observaciones? `<div class="parcela-meta" style="color:var(--border-color);font-style:italic">📝 ${p.observaciones}</div>` : ''}
      <div class="parcela-actions">
        <button class="action-btn" onclick="verHistorial(${p.id})">📋 Ver actividades</button>
        <button class="action-btn" onclick="abrirEditarParcela(${p.id})">✎ Editar</button>
        <button class="action-btn danger" onclick="eliminarParcela(${p.id})">✕</button>
      </div>
    </div>`).join('');
}

function poblarSelectParcelas() {
  ['aParcelaId','filtroParcelaAct'].forEach(id => {
    const sel      = document.getElementById(id);
    const firstOpt = id === 'filtroParcelaAct' ? '<option value="">Todas las parcelas</option>' : '';
    sel.innerHTML  = firstOpt + parcelas.map(p =>
      `<option value="${p.id}">${p.nombre}</option>`).join('');
  });
}

document.getElementById('searchParcela').addEventListener('input', function () {
  const txt = this.value.toLowerCase();
  renderParcelas(parcelas.filter(p => p.nombre.toLowerCase().includes(txt)));
});

// ── ACTIVIDADES ─────────────────────────────────────
async function cargarActividades() {
  try {
    const res   = await fetch(`${API}/actividades`);
    actividades = await res.json();
    filtrarActividades();
  } catch {
    document.getElementById('actividadesBody').innerHTML =
      '<tr><td colspan="8" class="empty-state">⚠ No se pudo conectar</td></tr>';
  }
}

async function cargarVencidas() {
  try {
    const res     = await fetch(`${API}/actividades/vencidas`);
    const vencidas = await res.json();
    const banner   = document.getElementById('alertaBanner');
    if (vencidas.length > 0) {
      banner.classList.remove('hidden');
      document.getElementById('alertaTexto').textContent =
        `${vencidas.length} actividad(es) vencida(s) sin completar. Revisa la pestaña de Actividades.`;
    } else { banner.classList.add('hidden'); }
  } catch {}
}

function filtrarActividades() {
  const parcelaF = document.getElementById('filtroParcelaAct').value;
  const estadoF  = document.getElementById('filtroEstado').value;
  const tipoF    = document.getElementById('filtroTipoAct').value;
  renderActividades(actividades.filter(a =>
    (!parcelaF || String(a.parcela?.id) === parcelaF) &&
    (!estadoF  || a.estado === estadoF) &&
    (!tipoF    || a.tipo   === tipoF)
  ));
}

function renderActividades(lista) {
  const tbody = document.getElementById('actividadesBody');
  if (!lista.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No hay actividades registradas</td></tr>';
    return;
  }
  tbody.innerHTML = lista.map(a => `
    <tr>
      <td class="name">${a.parcela?.nombre || '—'}</td>
      <td>${tipoBadge(a.tipo)}</td>
      <td>${a.responsable || '—'}</td>
      <td class="mono">${formatFecha(a.fechaProgramada)}</td>
      <td class="mono">${formatFecha(a.fechaRealizada)}</td>
      <td style="max-width:180px;font-size:11px;color:var(--text-main)">${a.insumosUsados || '—'}</td>
      <td>${estadoBadge(a.estado)}</td>
      <td>
        <button class="action-btn" onclick="abrirEditarActividad(${a.id})">✎</button>
        <button class="action-btn danger" onclick="eliminarActividad(${a.id})">✕</button>
      </td>
    </tr>`).join('');
}

function verHistorial(parcelaId) {
  switchTab('actividades');
  setTimeout(() => {
    document.getElementById('filtroParcelaAct').value = parcelaId;
    filtrarActividades();
  }, 100);
}

// ── MODAL PARCELA ────────────────────────────────────
function abrirModalParcela() {
  document.getElementById('modalParcelaTitulo').textContent = 'Nueva parcela';
  document.getElementById('parcelaId').value = '';
  ['pNombre','pUbicacion','pVariedad','pResponsable','pObservaciones'].forEach(id =>
    document.getElementById(id).value = '');
  document.getElementById('pHectareas').value = '';
  document.getElementById('modalParcela').classList.add('open');
}

function abrirEditarParcela(id) {
  const p = parcelas.find(x => x.id === id);
  if (!p) return;
  document.getElementById('modalParcelaTitulo').textContent = 'Editar parcela';
  document.getElementById('parcelaId').value      = p.id;
  document.getElementById('pNombre').value        = p.nombre;
  document.getElementById('pUbicacion').value     = p.ubicacion;
  document.getElementById('pHectareas').value     = p.hectareas || '';
  document.getElementById('pVariedad').value      = p.variedadCacao || '';
  document.getElementById('pResponsable').value   = p.responsable || '';
  document.getElementById('pObservaciones').value = p.observaciones || '';
  document.getElementById('modalParcela').classList.add('open');
}

async function guardarParcela() {
  const nombre    = document.getElementById('pNombre').value.trim();
  const ubicacion = document.getElementById('pUbicacion').value.trim();
  if (!nombre || !ubicacion) { showToast('Nombre y ubicación son obligatorios', 'error'); return; }
  const id   = document.getElementById('parcelaId').value;
  const body = {
    nombre, ubicacion,
    hectareas:     document.getElementById('pHectareas').value    || null,
    variedadCacao: document.getElementById('pVariedad').value.trim()     || null,
    responsable:   document.getElementById('pResponsable').value.trim()  || null,
    observaciones: document.getElementById('pObservaciones').value.trim()|| null
  };
  const url    = id ? `${API}/parcelas/${id}` : `${API}/parcelas`;
  const method = id ? 'PUT' : 'POST';
  try {
    const res = await fetch(url, { method, headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
    if (!res.ok) throw new Error();
    cerrarModal('modalParcela');
    showToast(id ? 'Parcela actualizada ✓' : 'Parcela creada ✓');
    cargarParcelas();
  } catch { showToast('Error al guardar parcela', 'error'); }
}

async function eliminarParcela(id) {
  if (!confirm('¿Eliminar esta parcela? También se eliminarán sus actividades.')) return;
  try {
    await fetch(`${API}/parcelas/${id}`, { method: 'DELETE' });
    showToast('Parcela eliminada');
    cargarParcelas();
  } catch { showToast('Error al eliminar', 'error'); }
}

// ── MODAL ACTIVIDAD ──────────────────────────────────
function abrirModalActividad() {
  document.getElementById('modalActividadTitulo').textContent = 'Nueva actividad';
  document.getElementById('actividadId').value  = '';
  document.getElementById('aTipo').value        = 'PODA';
  document.getElementById('aEstado').value      = 'PENDIENTE';
  document.getElementById('aFechaProg').value   = '';
  document.getElementById('aFechaReal').value   = '';
  ['aResponsable','aInsumos','aObservaciones'].forEach(id =>
    document.getElementById(id).value = '');
  document.getElementById('modalActividad').classList.add('open');
}

function abrirEditarActividad(id) {
  const a = actividades.find(x => x.id === id);
  if (!a) return;
  document.getElementById('modalActividadTitulo').textContent = 'Editar actividad';
  document.getElementById('actividadId').value     = a.id;
  document.getElementById('aParcelaId').value      = a.parcela?.id || '';
  document.getElementById('aTipo').value           = a.tipo;
  document.getElementById('aEstado').value         = a.estado;
  document.getElementById('aFechaProg').value      = a.fechaProgramada || '';
  document.getElementById('aFechaReal').value      = a.fechaRealizada  || '';
  document.getElementById('aResponsable').value    = a.responsable     || '';
  document.getElementById('aInsumos').value        = a.insumosUsados   || '';
  document.getElementById('aObservaciones').value  = a.observaciones   || '';
  document.getElementById('modalActividad').classList.add('open');
}

async function guardarActividad() {
  const parcelaId = document.getElementById('aParcelaId').value;
  const fechaProg = document.getElementById('aFechaProg').value;
  if (!parcelaId || !fechaProg) { showToast('Parcela y fecha programada son obligatorias', 'error'); return; }
  const id   = document.getElementById('actividadId').value;
  const body = {
    tipo:            document.getElementById('aTipo').value,
    estado:          document.getElementById('aEstado').value,
    fechaProgramada: fechaProg,
    fechaRealizada:  document.getElementById('aFechaReal').value || null,
    responsable:     document.getElementById('aResponsable').value.trim() || null,
    insumosUsados:   document.getElementById('aInsumos').value.trim()     || null,
    observaciones:   document.getElementById('aObservaciones').value.trim()|| null
  };
  const url    = id ? `${API}/actividades/${id}` : `${API}/actividades/parcela/${parcelaId}`;
  const method = id ? 'PUT' : 'POST';
  try {
    const res  = await fetch(url, { method, headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) { showToast('Error: ' + (data.error || 'Verifica los datos'), 'error'); return; }
    cerrarModal('modalActividad');
    showToast(id ? 'Actividad actualizada ✓' : 'Actividad creada ✓');
    cargarActividades();
  } catch { showToast('Error al guardar actividad', 'error'); }
}

async function eliminarActividad(id) {
  if (!confirm('¿Eliminar esta actividad?')) return;
  try {
    await fetch(`${API}/actividades/${id}`, { method: 'DELETE' });
    showToast('Actividad eliminada');
    cargarActividades();
  } catch { showToast('Error al eliminar', 'error'); }
}

// ── HELPERS ──────────────────────────────────────────
function cerrarModal(id) { document.getElementById(id).classList.remove('open'); }
document.querySelectorAll('.modal-overlay').forEach(m => {
  m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); });
});

cargarParcelas();
