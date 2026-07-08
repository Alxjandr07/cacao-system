/* =====================================================
   CacaoGest — cosecha.js
   ===================================================== */
const API_COSECHA    = 'http://localhost:8080/api/cosecha';
const API_PARCELAS   = 'http://localhost:8080/api/cultivo/parcelas';
const API_INVENTARIO = 'http://localhost:8080/api/inventario/productos';

let cosechas  = [];
let parcelas  = [];
let productos = [];

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
function calidadBadge(c) {
  const map = {
    EXTRA:         ['badge-extra',    '★ Extra'],
    PRIMERA:       ['badge-primera',  '◆ Primera'],
    SEGUNDA:       ['badge-segunda',  '◇ Segunda'],
    CACAO_EN_BABA: ['badge-baba',     '○ En baba']
  };
  const [cls, label] = map[c] || ['', c];
  return `<span class="badge ${cls}">${label}</span>`;
}

// ── CARGA ───────────────────────────────────────────
async function cargarTodo() {
  await Promise.all([cargarParcelas(), cargarProductos(), cargarCosechas()]);
}

async function cargarParcelas() {
  try {
    const res = await fetch(API_PARCELAS);
    parcelas  = await res.json();
    document.getElementById('cParcelaId').innerHTML =
      parcelas.map(p => `<option value="${p.id}">${p.nombre}</option>`).join('');
  } catch {}
}

async function cargarProductos() {
  try {
    const res = await fetch(API_INVENTARIO);
    productos = await res.json();
    document.getElementById('cProductoId').innerHTML =
      productos.map(p =>
        `<option value="${p.id}">${p.nombre} (${p.stockActual} ${p.unidadMedida})</option>`
      ).join('');
  } catch {}
}

async function cargarCosechas() {
  try {
    const res = await fetch(API_COSECHA);
    cosechas  = await res.json();
    actualizarKPIs();
    filtrar();
  } catch {
    document.getElementById('tablaBody').innerHTML =
      '<tr><td colspan="9" class="empty-state">⚠ No se pudo conectar con el servidor</td></tr>';
  }
}

// ── KPIs ────────────────────────────────────────────
function actualizarKPIs() {
  document.getElementById('kpiTotal').textContent = cosechas.length;
  const totalKg = cosechas.reduce((sum, c) => sum + parseFloat(c.cantidadKg || 0), 0);
  document.getElementById('kpiKg').textContent =
    totalKg.toLocaleString('es-EC', { maximumFractionDigits: 1 });
  if (cosechas.length > 0) {
    const ultimo = cosechas[0];
    document.getElementById('kpiUltimoLote').textContent  = ultimo.numeroLote || '—';
    document.getElementById('kpiUltimaFecha').textContent = formatFecha(ultimo.fechaCosecha);
  }
  const conteo = {};
  cosechas.forEach(c => conteo[c.calidad] = (conteo[c.calidad] || 0) + 1);
  const top = Object.entries(conteo).sort((a, b) => b[1] - a[1])[0];
  if (top) {
    const labels = { EXTRA:'Extra', PRIMERA:'Primera', SEGUNDA:'Segunda', CACAO_EN_BABA:'En baba' };
    document.getElementById('kpiCalidad').textContent = labels[top[0]] || top[0];
  }
}

// ── FILTROS ─────────────────────────────────────────
function filtrar() {
  const texto   = document.getElementById('searchInput').value.toLowerCase().trim();
  const calidad = document.getElementById('filtroCalidad').value;
  const inicio  = document.getElementById('filtroInicio').value;
  const fin     = document.getElementById('filtroFin').value;
  renderTabla(cosechas.filter(c =>
    (!texto   || c.numeroLote?.toLowerCase().includes(texto) ||
                 c.parcela?.nombre?.toLowerCase().includes(texto)) &&
    (!calidad || c.calidad === calidad) &&
    (!inicio  || c.fechaCosecha >= inicio) &&
    (!fin     || c.fechaCosecha <= fin)
  ));
}
document.getElementById('searchInput').addEventListener('input', filtrar);

function limpiarFiltros() {
  ['searchInput','filtroCalidad','filtroInicio','filtroFin'].forEach(id =>
    document.getElementById(id).value = '');
  filtrar();
}

// ── RENDER ──────────────────────────────────────────
function renderTabla(lista) {
  const tbody = document.getElementById('tablaBody');
  if (!lista.length) {
    tbody.innerHTML = '<tr><td colspan="9" class="empty-state">No hay registros de cosecha</td></tr>';
    return;
  }
  tbody.innerHTML = lista.map(c => `
    <tr>
      <td class="lote">${c.numeroLote || '—'}</td>
      <td class="name">${c.parcela?.nombre || '—'}</td>
      <td class="mono">${formatFecha(c.fechaCosecha)}</td>
      <td class="mono">${parseFloat(c.cantidadKg).toLocaleString('es-EC')} kg</td>
      <td>${calidadBadge(c.calidad)}</td>
      <td style="font-size:11px;color:var(--text-main)">${c.productoInventario?.nombre || '—'}</td>
      <td style="font-size:12px">${c.responsable || '—'}</td>
      <td style="font-size:11px;color:var(--text-main);max-width:140px">${c.observaciones || '—'}</td>
      <td>
        <button class="action-btn" onclick="abrirEditar(${c.id})">✎</button>
        <button class="action-btn danger" onclick="eliminar(${c.id})">✕</button>
      </td>
    </tr>`).join('');
}

// ── MODAL ───────────────────────────────────────────
function abrirModal() {
  document.getElementById('modalTitulo').textContent  = 'Registrar cosecha';
  document.getElementById('cosechaId').value          = '';
  document.getElementById('cFecha').value             = new Date().toISOString().split('T')[0];
  document.getElementById('cCantidad').value          = '';
  document.getElementById('cCalidad').value           = 'EXTRA';
  document.getElementById('cResponsable').value       = '';
  document.getElementById('cObservaciones').value     = '';
  document.getElementById('infoLote').style.display   = '';
  cargarProductos();
  document.getElementById('modalCosecha').classList.add('open');
}

function abrirEditar(id) {
  const c = cosechas.find(x => x.id === id);
  if (!c) return;
  document.getElementById('modalTitulo').textContent      = 'Editar cosecha ' + c.numeroLote;
  document.getElementById('cosechaId').value              = c.id;
  document.getElementById('cParcelaId').value             = c.parcela?.id || '';
  document.getElementById('cProductoId').value            = c.productoInventario?.id || '';
  document.getElementById('cFecha').value                 = c.fechaCosecha || '';
  document.getElementById('cCantidad').value              = c.cantidadKg;
  document.getElementById('cCalidad').value               = c.calidad;
  document.getElementById('cResponsable').value           = c.responsable   || '';
  document.getElementById('cObservaciones').value         = c.observaciones || '';
  document.getElementById('infoLote').style.display       = 'none';
  document.getElementById('modalCosecha').classList.add('open');
}

async function guardar() {
  const id         = document.getElementById('cosechaId').value;
  const parcelaId  = document.getElementById('cParcelaId').value;
  const productoId = document.getElementById('cProductoId').value;
  const fecha      = document.getElementById('cFecha').value;
  const cantidad   = document.getElementById('cCantidad').value;
  if (!parcelaId || !productoId || !fecha || !cantidad) {
    showToast('Completa todos los campos obligatorios', 'error'); return;
  }
  const body = {
    fechaCosecha:  fecha,
    cantidadKg:    parseFloat(cantidad),
    calidad:       document.getElementById('cCalidad').value,
    responsable:   document.getElementById('cResponsable').value.trim()   || null,
    observaciones: document.getElementById('cObservaciones').value.trim() || null
  };
  try {
    const url    = id
      ? `${API_COSECHA}/${id}`
      : `${API_COSECHA}/parcela/${parcelaId}/producto/${productoId}`;
    const method = id ? 'PUT' : 'POST';
    const res    = await fetch(url, { method, headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
    const data   = await res.json();
    if (!res.ok) { showToast('Error: ' + (data.error || 'Verifica los datos'), 'error'); return; }
    cerrarModal();
    showToast(id ? 'Cosecha actualizada ✓' : `Cosecha registrada ✓ — Lote ${data.numeroLote}`);
    cargarTodo();
  } catch { showToast('Error al guardar', 'error'); }
}

async function eliminar(id) {
  const c = cosechas.find(x => x.id === id);
  if (!confirm(`¿Eliminar lote ${c?.numeroLote}? Se revertirán ${c?.cantidadKg} kg del inventario.`)) return;
  try {
    const res = await fetch(`${API_COSECHA}/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json();
      showToast('Error: ' + data.error, 'error'); return;
    }
    showToast('Cosecha eliminada y stock revertido');
    cargarTodo();
  } catch { showToast('Error al eliminar', 'error'); }
}

function cerrarModal() { document.getElementById('modalCosecha').classList.remove('open'); }
document.getElementById('modalCosecha').addEventListener('click', e => {
  if (e.target === document.getElementById('modalCosecha'))
    document.getElementById('modalCosecha').classList.remove('open');
});

cargarTodo();
