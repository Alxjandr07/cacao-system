/* =====================================================
   CacaoGest — trazabilidad.js
   ===================================================== */
const API = 'http://localhost:8081/api/trazabilidad';
let lotes = [];

Pag.registrar('lotes', 'tablaBody', 'pag-tablaBody');

// ── USUARIO SIDEBAR ─────────────────────────────────
const u = JSON.parse(localStorage.getItem('usuario') || '{}');
if (u.nombres) document.getElementById('sidebarNombre').textContent = u.nombres + ' ' + (u.apellidos || '');
if (u.rol)     document.getElementById('sidebarRol').textContent = u.rol;

// ── UTILS ──────────────────────────────────────────
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

function formatFechaHora(isoStr) {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  return d.toLocaleDateString('es-EC', { day:'2-digit', month:'2-digit', year:'numeric' }) + ' ' +
    d.toLocaleTimeString('es-EC', { hour:'2-digit', minute:'2-digit' });
}

function estadoBadge(estado) {
  const map = {
    'COSECHADO':    `<span class="badge badge-bajo"><span class="badge-dot dot-amber"></span>Cosechado</span>`,
    'EN_PROCESO':   `<span class="badge badge-en-proceso"><span class="badge-dot dot-blue"></span>En Proceso</span>`,
    'EN_INVENTARIO':`<span class="badge badge-cacao"><span class="badge-dot" style="background:#155724"></span>En Inventario</span>`,
    'VENDIDO':      `<span class="badge badge-disponible"><span class="badge-dot dot-blue"></span>Vendido</span>`,
    'PARCIAL':      `<span class="badge badge-insumo"><span class="badge-dot" style="background:#6f2da8"></span>Parcial</span>`
  };
  return map[estado] || estado;
}

// ── CARGA ───────────────────────────────────────────
async function cargarLotes(conToast) {
  try {
    const res = await fetch(API);
    if (!res.ok) throw new Error();
    lotes = await res.json();
    filtrar();
    actualizarKPIs();
    if (conToast) showToast('Datos actualizados correctamente ✓');
  } catch {
    if (conToast) showToast('No se pudieron actualizar los datos', 'error');
    if (!lotes.length) {
      Pag.pintar('lotes', [], '<tr><td colspan="11" class="empty-state">⚠ No se pudo conectar con el servidor</td></tr>');
    }
  }
}

function esPendiente(l) {
  return !l.trazabilidadCompleta && (l.estadoLote === 'VENDIDO' || l.estadoLote === 'PARCIAL');
}

function textoSecado(l) {
  if (l.diasSecado == null) return '—';
  return `${l.diasSecado} día(s) · ${l.secadoMaquina ? 'Máquina' : 'Sol'}`;
}

function trazaBadge(l) {
  return l.trazabilidadCompleta
    ? `<span class="badge badge-disponible"><span class="badge-dot dot-blue"></span>Completa</span>`
    : `<span class="badge badge-bajo"><span class="badge-dot dot-amber"></span>Pendiente</span>`;
}

function actualizarKPIs() {
  document.getElementById('kpiTotal').textContent      = lotes.length;
  document.getElementById('kpiVendidos').textContent   = lotes.filter(l => l.estadoLote === 'VENDIDO' || l.estadoLote === 'PARCIAL').length;
  document.getElementById('kpiPendientes').textContent = lotes.filter(esPendiente).length;
  document.getElementById('kpiCompletas').textContent  = lotes.filter(l => l.trazabilidadCompleta).length;
  const n = lotes.filter(esPendiente).length;
  document.getElementById('bannerPendientesCount').textContent = n;
  document.getElementById('bannerPendientes').style.display = n ? 'flex' : 'none';
}

function verPendientes() {
  document.getElementById('filtroPend').checked = true;
  filtrar();
  document.querySelector('.table-wrap').scrollIntoView({ behavior: 'smooth' });
}

// ── RENDER ──────────────────────────────────────────
function renderTabla(lista) {
  const filas = lista.map(l => `<tr>
    <td class="lote">${l.codigoLote}</td>
    <td class="name">${l.parcela || '—'}</td>
    <td>${formatFecha(l.fechaCosecha)}</td>
    <td class="name">${l.producto || '—'}</td>
    <td class="mono">${l.cantidadVendida ? l.cantidadVendida + ' kg' : '—'}</td>
    <td>${l.nombreCliente || '—'}</td>
    <td class="mono">${l.numeroFactura || '—'}</td>
    <td class="mono">${formatFechaHora(l.fechaVenta)}</td>
    <td>${textoSecado(l)}</td>
    <td>${trazaBadge(l)}</td>
    <td>
      <button class="action-btn" onclick="abrirEditar(${l.id})">✎ Editar</button>
      <button class="action-btn danger" onclick="eliminar(${l.id})">✕</button>
    </td>
  </tr>`);
  Pag.pintar('lotes', filas, '<tr><td colspan="11" class="empty-state">No hay lotes registrados</td></tr>');
}

// ── FILTROS ─────────────────────────────────────────
function filtrar() {
  const estado = document.getElementById('filtroEstado').value;
  const texto  = document.getElementById('searchInput').value.toLowerCase().trim();
  const soloPend = document.getElementById('filtroPend').checked;
  renderTabla(lotes.filter(l =>
    (!estado || l.estadoLote === estado) &&
    (!soloPend || esPendiente(l)) &&
    (!texto  || l.codigoLote.toLowerCase().includes(texto)
      || (l.nombreCliente || '').toLowerCase().includes(texto)
      || (l.parcela || '').toLowerCase().includes(texto)
      || (l.producto || '').toLowerCase().includes(texto)
      || (l.numeroFactura || '').toLowerCase().includes(texto))
  ));
}
document.getElementById('searchInput').addEventListener('input', filtrar);

// ── MODAL LOTE ───────────────────────────────────────
async function abrirModalLote() {
  document.getElementById('modalLoteTitulo').textContent = 'Nuevo lote';
  document.getElementById('loteId').value = '';
  document.getElementById('lEstado').value = 'COSECHADO';
  ['lParcela','lFechaCosecha','lCosechada','lProcesada','lVendida','lNumeroFactura','lCliente',
   'lProducto','lInsumos','lTratamiento','lDiasSecado','lObservaciones']
    .forEach(id => document.getElementById(id).value = '');
  document.getElementById('lSecadoMaquina').checked = false;
  document.getElementById('lCompleta').checked = false;

  try {
    const res  = await fetch(`${API}/generar-codigo`);
    const data = await res.json();
    document.getElementById('lCodigo').value = data.codigo;
  } catch {
    document.getElementById('lCodigo').value = '';
  }
  document.getElementById('modalLote').classList.add('open');
}

function abrirEditar(id) {
  const l = lotes.find(x => x.id === id);
  if (!l) return;
  document.getElementById('modalLoteTitulo').textContent = 'Editar lote';
  document.getElementById('loteId').value          = l.id;
  document.getElementById('lCodigo').value         = l.codigoLote;
  document.getElementById('lEstado').value         = l.estadoLote;
  document.getElementById('lParcela').value        = l.parcela || '';
  document.getElementById('lFechaCosecha').value   = l.fechaCosecha ? l.fechaCosecha.slice(0,16) : '';
  document.getElementById('lCosechada').value      = l.cantidadCosechada || '';
  document.getElementById('lProcesada').value      = l.cantidadProcesada || '';
  document.getElementById('lVendida').value        = l.cantidadVendida || '';
  document.getElementById('lNumeroFactura').value  = l.numeroFactura || '';
  document.getElementById('lCliente').value        = l.nombreCliente || '';
  document.getElementById('lProducto').value       = l.producto || '';
  document.getElementById('lInsumos').value        = l.insumosUtilizados || '';
  document.getElementById('lTratamiento').value    = l.tratamiento || '';
  document.getElementById('lDiasSecado').value     = l.diasSecado ?? '';
  document.getElementById('lSecadoMaquina').checked = !!l.secadoMaquina;
  document.getElementById('lCompleta').checked      = !!l.trazabilidadCompleta;
  document.getElementById('lObservaciones').value  = l.observaciones || '';
  document.getElementById('modalLote').classList.add('open');
}

async function guardarLote() {
  const id   = document.getElementById('loteId').value;
  const body = {
    codigoLote:        document.getElementById('lCodigo').value,
    estadoLote:        document.getElementById('lEstado').value,
    parcela:           document.getElementById('lParcela').value.trim(),
    fechaCosecha:      document.getElementById('lFechaCosecha').value || null,
    cantidadCosechada: parseFloat(document.getElementById('lCosechada').value) || null,
    cantidadProcesada: parseFloat(document.getElementById('lProcesada').value) || null,
    cantidadVendida:   parseFloat(document.getElementById('lVendida').value) || null,
    numeroFactura:     document.getElementById('lNumeroFactura').value.trim() || null,
    nombreCliente:     document.getElementById('lCliente').value.trim() || null,
    producto:          document.getElementById('lProducto').value.trim() || null,
    insumosUtilizados: document.getElementById('lInsumos').value.trim() || null,
    tratamiento:       document.getElementById('lTratamiento').value.trim() || null,
    diasSecado:        document.getElementById('lDiasSecado').value === '' ? null : parseInt(document.getElementById('lDiasSecado').value),
    secadoMaquina:     document.getElementById('lSecadoMaquina').checked,
    trazabilidadCompleta: document.getElementById('lCompleta').checked,
    observaciones:     document.getElementById('lObservaciones').value.trim() || null
  };

  const url    = id ? `${API}/${id}` : API;
  const method = id ? 'PUT' : 'POST';
  try {
    const res = await fetch(url, { method, headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
    if (!res.ok) throw new Error();
    cerrarModal('modalLote');
    showToast(id ? 'Lote actualizado ✓' : 'Lote registrado ✓');
    cargarLotes();
  } catch { showToast('Error al guardar el lote', 'error'); }
}

async function eliminar(id) {
  if (!confirm('¿Eliminar este lote de trazabilidad?')) return;
  try {
    await fetch(`${API}/${id}`, { method: 'DELETE' });
    showToast('Lote eliminado');
    cargarLotes();
  } catch { showToast('Error al eliminar', 'error'); }
}

// ── HELPERS ──────────────────────────────────────────
function cerrarModal(id) { document.getElementById(id).classList.remove('open'); }
//document.querySelectorAll('.modal-overlay').forEach(m => {
//m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); });
//});

cargarLotes();