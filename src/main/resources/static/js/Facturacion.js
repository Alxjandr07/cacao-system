/* =====================================================
   CacaoGest — facturacion.js
   ===================================================== */
const API = 'http://localhost:8080/api/facturacion';
let facturas = [];

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

function calcularTotal() {
  const subtotal = parseFloat(document.getElementById('fSubtotal').value) || 0;
  const iva = subtotal * 0.15;
  const total = subtotal + iva;
  document.getElementById('fIva').value = iva.toFixed(2);
  document.getElementById('fTotal').value = total.toFixed(2);
}

// ── CARGA ───────────────────────────────────────────
async function cargarFacturas() {
  try {
    const res = await fetch(API);
    if (!res.ok) throw new Error();
    facturas = await res.json();
    filtrar();
    actualizarKPIs();
  } catch {
    document.getElementById('tablaBody').innerHTML =
      '<tr><td colspan="9" class="empty-state">⚠ No se pudo conectar con el servidor</td></tr>';
  }
}

function actualizarKPIs() {
  document.getElementById('kpiTotal').textContent = facturas.length;
  document.getElementById('kpiEmitidas').textContent = facturas.filter(f => f.estado === 'EMITIDA').length;
  document.getElementById('kpiPagadas').textContent = facturas.filter(f => f.estado === 'PAGADA').length;
  document.getElementById('kpiAnuladas').textContent = facturas.filter(f => f.estado === 'ANULADA').length;
}

// ── RENDER ──────────────────────────────────────────
function renderTabla(lista) {
  const tbody = document.getElementById('tablaBody');
  if (!lista.length) {
    tbody.innerHTML = '<tr><td colspan="9" class="empty-state">No hay facturas registradas</td></tr>';
    return;
  }
  tbody.innerHTML = lista.map(f => {
    const estadoBadge = f.estado === 'PAGADA'
      ? `<span class="badge badge-disponible"><span class="badge-dot dot-blue"></span>Pagada</span>`
      : f.estado === 'ANULADA'
        ? `<span class="badge badge-critico"><span class="badge-dot dot-red"></span>Anulada</span>`
        : `<span class="badge badge-bajo"><span class="badge-dot dot-amber"></span>Emitida</span>`;

    return `<tr>
      <td class="lote">${f.numeroFactura}</td>
      <td class="name">${f.nombreCliente}</td>
      <td class="mono">${f.cedulaCliente || '—'}</td>
      <td>${formatFecha(f.fechaEmision)}</td>
      <td class="mono">$${parseFloat(f.subtotal).toFixed(2)}</td>
      <td class="mono">$${parseFloat(f.iva).toFixed(2)}</td>
      <td class="mono"><strong>$${parseFloat(f.total).toFixed(2)}</strong></td>
      <td>${estadoBadge}</td>
      <td>
        <button class="action-btn" onclick="abrirEditar(${f.id})">✎ Editar</button>
        ${f.estado !== 'ANULADA' ? `<button class="action-btn danger" onclick="anular(${f.id})">✕ Anular</button>` : ''}
      </td>
    </tr>`;
  }).join('');
}

// ── FILTROS ─────────────────────────────────────────
function filtrar() {
  const estado = document.getElementById('filtroEstado').value;
  const texto  = document.getElementById('searchInput').value.toLowerCase().trim();
  renderTabla(facturas.filter(f =>
    (!estado || f.estado === estado) &&
    (!texto  || f.numeroFactura.toLowerCase().includes(texto) || f.nombreCliente.toLowerCase().includes(texto))
  ));
}
document.getElementById('searchInput').addEventListener('input', filtrar);

// ── MODAL FACTURA ────────────────────────────────────
async function abrirModalFactura() {
  document.getElementById('modalFacturaTitulo').textContent = 'Nueva factura';
  document.getElementById('facturaId').value = '';
  document.getElementById('fEstado').value = 'EMITIDA';
  ['fNombreCliente','fCedulaCliente','fDireccion','fObservaciones'].forEach(id => document.getElementById(id).value = '');
  ['fSubtotal','fIva','fTotal'].forEach(id => document.getElementById(id).value = '');

  try {
    const res  = await fetch(`${API}/generar-numero`);
    const data = await res.json();
    document.getElementById('fNumero').value = data.numero;
  } catch {
    document.getElementById('fNumero').value = '';
  }
  document.getElementById('modalFactura').classList.add('open');
}

function abrirEditar(id) {
  const f = facturas.find(x => x.id === id);
  if (!f) return;
  document.getElementById('modalFacturaTitulo').textContent = 'Editar factura';
  document.getElementById('facturaId').value      = f.id;
  document.getElementById('fNumero').value        = f.numeroFactura;
  document.getElementById('fEstado').value        = f.estado;
  document.getElementById('fNombreCliente').value = f.nombreCliente;
  document.getElementById('fCedulaCliente').value = f.cedulaCliente || '';
  document.getElementById('fDireccion').value     = f.direccionCliente || '';
  document.getElementById('fSubtotal').value      = f.subtotal;
  document.getElementById('fIva').value           = f.iva;
  document.getElementById('fTotal').value         = f.total;
  document.getElementById('fObservaciones').value = f.observaciones || '';
  document.getElementById('modalFactura').classList.add('open');
}

async function guardarFactura() {
  const nombre   = document.getElementById('fNombreCliente').value.trim();
  const subtotal = document.getElementById('fSubtotal').value;
  if (!nombre || !subtotal) { showToast('Completa los campos obligatorios', 'error'); return; }

  const id   = document.getElementById('facturaId').value;
  const body = {
    numeroFactura:    document.getElementById('fNumero').value,
    estado:           document.getElementById('fEstado').value,
    nombreCliente:    nombre,
    cedulaCliente:    document.getElementById('fCedulaCliente').value.trim(),
    direccionCliente: document.getElementById('fDireccion').value.trim(),
    subtotal:         parseFloat(subtotal),
    iva:              parseFloat(document.getElementById('fIva').value),
    total:            parseFloat(document.getElementById('fTotal').value),
    observaciones:    document.getElementById('fObservaciones').value.trim()
  };

  const url    = id ? `${API}/${id}` : API;
  const method = id ? 'PUT' : 'POST';
  try {
    const res = await fetch(url, { method, headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
    if (!res.ok) throw new Error();
    cerrarModal('modalFactura');
    showToast(id ? 'Factura actualizada ✓' : 'Factura creada ✓');
    cargarFacturas();
  } catch { showToast('Error al guardar la factura', 'error'); }
}

async function anular(id) {
  if (!confirm('¿Anular esta factura?')) return;
  try {
    await fetch(`${API}/${id}/anular`, { method: 'PUT' });
    showToast('Factura anulada');
    cargarFacturas();
  } catch { showToast('Error al anular', 'error'); }
}

// ── HELPERS ──────────────────────────────────────────
function cerrarModal(id) { document.getElementById(id).classList.remove('open'); }
//document.querySelectorAll('.modal-overlay').forEach(m => {
//m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); });
//});

cargarFacturas();