/* =====================================================
   CacaoGest — trazabilidad.js
   ===================================================== */
const API = 'http://localhost:8080/api/trazabilidad';
let lotes = [];

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
async function cargarLotes() {
  try {
    const res = await fetch(API);
    if (!res.ok) throw new Error();
    lotes = await res.json();
    filtrar();
    actualizarKPIs();
  } catch {
    document.getElementById('tablaBody').innerHTML =
      '<tr><td colspan="10" class="empty-state">⚠ No se pudo conectar con el servidor</td></tr>';
  }
}

function actualizarKPIs() {
  document.getElementById('kpiTotal').textContent     = lotes.length;
  document.getElementById('kpiCosechados').textContent = lotes.filter(l => l.estadoLote === 'COSECHADO').length;
  document.getElementById('kpiInventario').textContent = lotes.filter(l => l.estadoLote === 'EN_INVENTARIO').length;
  document.getElementById('kpiVendidos').textContent   = lotes.filter(l => l.estadoLote === 'VENDIDO').length;
}

// ── RENDER ──────────────────────────────────────────
function renderTabla(lista) {
  const tbody = document.getElementById('tablaBody');
  if (!lista.length) {
    tbody.innerHTML = '<tr><td colspan="10" class="empty-state">No hay lotes registrados</td></tr>';
    return;
  }
  tbody.innerHTML = lista.map(l => `<tr>
    <td class="lote">${l.codigoLote}</td>
    <td class="name">${l.parcela || '—'}</td>
    <td>${formatFecha(l.fechaCosecha)}</td>
    <td class="mono">${l.cantidadCosechada ? l.cantidadCosechada + ' kg' : '—'}</td>
    <td class="mono">${l.cantidadProcesada ? l.cantidadProcesada + ' kg' : '—'}</td>
    <td class="mono">${l.cantidadVendida ? l.cantidadVendida + ' kg' : '—'}</td>
    <td>${l.nombreCliente || '—'}</td>
    <td class="mono">${l.numeroFactura || '—'}</td>
    <td>${estadoBadge(l.estadoLote)}</td>
    <td>
      <button class="action-btn" onclick="abrirEditar(${l.id})">✎ Editar</button>
      <button class="action-btn danger" onclick="eliminar(${l.id})">✕</button>
    </td>
  </tr>`).join('');
}

// ── FILTROS ─────────────────────────────────────────
function filtrar() {
  const estado = document.getElementById('filtroEstado').value;
  const texto  = document.getElementById('searchInput').value.toLowerCase().trim();
  renderTabla(lotes.filter(l =>
    (!estado || l.estadoLote === estado) &&
    (!texto  || l.codigoLote.toLowerCase().includes(texto) || (l.nombreCliente || '').toLowerCase().includes(texto))
  ));
}
document.getElementById('searchInput').addEventListener('input', filtrar);

// ── MODAL LOTE ───────────────────────────────────────
async function abrirModalLote() {
  document.getElementById('modalLoteTitulo').textContent = 'Nuevo lote';
  document.getElementById('loteId').value = '';
  document.getElementById('lEstado').value = 'COSECHADO';
  ['lParcela','lFechaCosecha','lCosechada','lProcesada','lVendida','lNumeroFactura','lCliente','lObservaciones']
    .forEach(id => document.getElementById(id).value = '');

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
document.querySelectorAll('.modal-overlay').forEach(m => {
  m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); });
});

cargarLotes();