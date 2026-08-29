/* =====================================================
   CacaoGest — facturacion.js (multi-producto, recibo)
   ===================================================== */
const API          = 'http://localhost:8081/api/facturacion';
const API_CLIENTES = 'http://localhost:8081/api/clientes';
const API_INV      = 'http://localhost:8081/api/inventario/productos';

let facturas  = [];
let clientes  = [];
let productos = [];
let lineas    = [];

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

function fmtMoney(v) {
  return '$' + (parseFloat(v) || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// ── CARGA ───────────────────────────────────────────
async function cargarFacturas(conToast) {
  try {
    const res = await fetch(API);
    if (!res.ok) throw new Error();
    facturas = await res.json();
    filtrar();
    actualizarKPIs();
    if (conToast) showToast('Datos actualizados correctamente ✓');
  } catch {
    if (conToast) showToast('No se pudieron actualizar los datos', 'error');
    if (!facturas.length) {
      document.getElementById('tablaBody').innerHTML =
        '<tr><td colspan="9" class="empty-state">⚠ No se pudo conectar con el servidor</td></tr>';
    }
  }
}

async function cargarClientes() {
  try {
    const res = await fetch(API_CLIENTES);
    if (!res.ok) throw new Error();
    clientes = await res.json();
    const sel = document.getElementById('fCliente');
    const activos = clientes.filter(c => c.activo !== false);
    sel.innerHTML = '<option value="">— Seleccionar cliente —</option>' +
      activos.map(c => `<option value="${c.id}">${c.nombre}${c.cedula ? ' · ' + c.cedula : ''}${c.ruc ? ' · ' + c.ruc : ''}</option>`).join('');
  } catch {}
}

async function cargarProductos() {
  try {
    const res = await fetch(API_INV);
    if (!res.ok) throw new Error();
    productos = await res.json();
  } catch {}
}

function init() {
  cargarFacturas();
  cargarClientes();
  cargarProductos();
}

function actualizarKPIs() {
  document.getElementById('kpiTotal').textContent = facturas.length;
  document.getElementById('kpiEmitidas').textContent = facturas.filter(f => f.estado === 'EMITIDA').length;
  document.getElementById('kpiPagadas').textContent = facturas.filter(f => f.estado === 'PAGADA').length;
  document.getElementById('kpiAnuladas').textContent = facturas.filter(f => f.estado === 'ANULADA').length;
}

// ── RENDER TABLA ────────────────────────────────────
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
      <td class="mono">${f.cedulaCliente || '—'}${f.rucCliente ? '<br><small>RUC: ' + f.rucCliente + '</small>' : ''}</td>
      <td>${formatFecha(f.fechaEmision)}</td>
      <td class="mono">${fmtMoney(f.subtotal)}</td>
      <td class="mono">${fmtMoney(f.iva)}</td>
      <td class="mono"><strong>${fmtMoney(f.total)}</strong></td>
      <td>${estadoBadge}</td>
      <td>
        <button class="action-btn" onclick="abrirEditar(${f.id})">✎ Editar</button>
        ${f.estado === 'EMITIDA'
          ? `<button class="action-btn ok" onclick="cambiarEstado(${f.id}, 'PAGADA')">✓ Marcar pagada</button>`
          : f.estado === 'PAGADA'
            ? `<button class="action-btn ok" onclick="cambiarEstado(${f.id}, 'EMITIDA')">↺ Marcar emitida</button>`
            : ''}
        ${f.estado !== 'ANULADA' ? `<button class="action-btn" onclick="verRecibo(${f.id})">🧾</button>` : ''}
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

// ── LINEAS DE FACTURA ───────────────────────────────
function opcionesProductos() {
  return productos.map(p =>
    `<option value="${p.id}" data-nombre="${p.nombre.replace(/"/g,'&quot;')}" data-unidad="${p.unidadMedida}">${p.nombre} (${p.unidadMedida}) — disp ${parseFloat(p.stockActual)}</option>`
  ).join('');
}

function agregarLinea() {
  const id = Date.now();
  lineas.push({ id, productoId: '', nombre: '', unidad: '', cantidad: 1, precio: 0, subtotal: 0 });
  renderLineas();
}

function eliminarLinea(lid) {
  lineas = lineas.filter(l => l.id !== lid);
  renderLineas();
}

function onLineaProducto(lid, sel) {
  const linea = lineas.find(l => l.id === lid);
  const opt   = sel.options[sel.selectedIndex];
  const prod  = productos.find(p => p.id === Number(sel.value));
  if (linea) {
    linea.productoId = sel.value;
    linea.nombre  = prod ? prod.nombre : (opt ? opt.getAttribute('data-nombre') : '');
    linea.unidad  = prod ? prod.unidadMedida : (opt ? opt.getAttribute('data-unidad') : '');
    recalcularLinea(lid);
  }
}

function onLineaCantidad(lid, val) {
  const linea = lineas.find(l => l.id === lid);
  if (linea) { linea.cantidad = parseFloat(val) || 0; recalcularLinea(lid); }
}

function onLineaPrecio(lid, val) {
  const linea = lineas.find(l => l.id === lid);
  if (linea) { linea.precio = parseFloat(val) || 0; recalcularLinea(lid); }
}

function recalcularLinea(lid) {
  const linea = lineas.find(l => l.id === lid);
  if (linea) {
    linea.subtotal = linea.cantidad * linea.precio;
    const row = document.getElementById('sub-' + lid);
    if (row) row.textContent = fmtMoney(linea.subtotal);
  }
  recalcularTotales();
}

function renderLineas() {
  const tbody = document.getElementById('lineasBody');
  if (!lineas.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Agrega productos a la factura</td></tr>';
  } else {
    tbody.innerHTML = lineas.map(l => `
      <tr>
        <td>
          <select class="linea-prod" onchange="onLineaProducto(${l.id}, this)">
            <option value="">Seleccionar producto</option>
            ${opcionesProductos()}
          </select>
        </td>
        <td><input type="number" class="linea-num" min="0.01" step="0.01" value="${l.cantidad}" oninput="onLineaCantidad(${l.id}, this.value)"></td>
        <td><input type="number" class="linea-num" min="0" step="0.01" placeholder="0.00" oninput="onLineaPrecio(${l.id}, this.value)"></td>
        <td class="mono" id="sub-${l.id}">${fmtMoney(l.subtotal)}</td>
        <td><button class="action-btn danger" onclick="eliminarLinea(${l.id})">✕</button></td>
      </tr>`).join('');
  }
  recalcularTotales();
}

function recalcularTotales() {
  const subtotal = lineas.reduce((s, l) => s + (l.subtotal || 0), 0);
  const iva      = subtotal * 0.15;
  const total    = subtotal + iva;
  document.getElementById('fSubtotal').textContent = fmtMoney(subtotal);
  document.getElementById('fIva').textContent      = fmtMoney(iva);
  document.getElementById('fTotal').textContent    = fmtMoney(total);
  actualizarRecibo();
}

// ── CLIENTE ─────────────────────────────────────────
function onClienteSeleccionado() {
  const id = document.getElementById('fCliente').value;
  const c  = clientes.find(x => x.id === Number(id));
  document.getElementById('fCedulaCliente').value = (c && c.cedula) || '';
  document.getElementById('fRucCliente').value    = (c && c.ruc) || '';
  document.getElementById('fTelefono').value      = (c && c.telefono) || '';
  document.getElementById('fDireccion').value     = (c && c.direccion) || '';
  actualizarRecibo();
}

// ── MODAL FACTURA ────────────────────────────────────
async function abrirModalFactura() {
  document.getElementById('modalFacturaTitulo').textContent = 'Nueva factura';
  document.getElementById('facturaId').value = '';
  document.getElementById('fEstado').value = 'EMITIDA';
  document.getElementById('fCliente').value = '';
  onClienteSeleccionado();
  document.getElementById('fObservaciones').value = '';
  lineas = [];
  renderLineas();

  try {
    const res  = await fetch(`${API}/generar-numero`);
    const data = await res.json();
    document.getElementById('fNumero').value = data.numero;
  } catch {
    document.getElementById('fNumero').value = '';
  }
  document.getElementById('modalFactura').classList.add('open');
  actualizarRecibo();
}

function abrirEditar(id) {
  const f = facturas.find(x => x.id === id);
  if (!f) return;
  document.getElementById('modalFacturaTitulo').textContent = 'Editar factura';
  document.getElementById('facturaId').value      = f.id;
  document.getElementById('fNumero').value        = f.numeroFactura;
  document.getElementById('fEstado').value        = f.estado;
  const cli = clientes.find(c =>
    (f.cedulaCliente && c.cedula === f.cedulaCliente) ||
    (f.rucCliente && c.ruc === f.rucCliente) ||
    (f.nombreCliente && c.nombre === f.nombreCliente)
  );
  document.getElementById('fCliente').value = cli ? String(cli.id) : '';
  document.getElementById('fCedulaCliente').value = f.cedulaCliente || '';
  document.getElementById('fRucCliente').value    = f.rucCliente || '';
  document.getElementById('fTelefono').value      = f.telefonoCliente || '';
  document.getElementById('fDireccion').value     = f.direccionCliente || '';
  document.getElementById('fObservaciones').value = f.observaciones || '';

  lineas = (f.detalles || []).map(d => ({
    id: Date.now() + Math.random(),
    productoId: '', nombre: d.descripcion || '', unidad: '', cantidad: d.cantidad, precio: d.precioUnitario, subtotal: d.subtotal
  }));
  renderLineas();
  document.getElementById('modalFactura').classList.add('open');
  actualizarRecibo();
}

async function guardarFactura() {
  const clienteId = document.getElementById('fCliente').value;
  if (!clienteId) { showToast('Selecciona un cliente', 'error'); return; }
  if (!lineas.length) { showToast('Agrega al menos una línea de producto', 'error'); return; }

  const ce = clientes.find(c => c.id === Number(clienteId));
  const detalleValidos = lineas.map(l => ({
    descripcion: l.nombre || 'Producto',
    cantidad: l.cantidad,
    precioUnitario: l.precio,
    subtotal: l.subtotal
  }));

  const subtotal = lineas.reduce((s, l) => s + (l.subtotal || 0), 0);
  const iva      = subtotal * 0.15;
  const total    = subtotal + iva;

  const id   = document.getElementById('facturaId').value;
  const body = {
    numeroFactura:    document.getElementById('fNumero').value,
    estado:           document.getElementById('fEstado').value,
    nombreCliente:    ce ? ce.nombre : '',
    cedulaCliente:    ce ? (ce.cedula || '') : '',
    rucCliente:       ce ? (ce.ruc || '') : '',
    telefonoCliente:  ce ? (ce.telefono || '') : '',
    direccionCliente: ce ? (ce.direccion || '') : '',
    subtotal:         Number(subtotal.toFixed(2)),
    iva:              Number(iva.toFixed(2)),
    total:            Number(total.toFixed(2)),
    observaciones:    document.getElementById('fObservaciones').value.trim(),
    detalles:         detalleValidos
  };

  const url    = id ? `${API}/${id}` : API;
  const method = id ? 'PUT' : 'POST';
  try {
    const res = await fetch(url, { method, headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) { showToast('Error: ' + (data.error || 'No se pudo guardar'), 'error'); return; }
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

async function cambiarEstado(id, estado) {
  try {
    const res = await fetch(`${API}/${id}/estado`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      showToast('Error: ' + (data.error || 'No se pudo cambiar el estado'), 'error');
      return;
    }
    showToast(estado === 'PAGADA' ? 'Factura marcada como pagada ✓' : 'Factura marcada como emitida');
    cargarFacturas();
  } catch { showToast('Error al cambiar el estado', 'error'); }
}

// ── RECIBO ──────────────────────────────────────────
function datosReciboActual() {
  const ce = clientes.find(c => c.id === Number(document.getElementById('fCliente').value));
  const subtotal = lineas.reduce((s, l) => s + (l.subtotal || 0), 0);
  const iva      = subtotal * 0.15;
  return {
    numero:  document.getElementById('fNumero').value || '',
    cliente: ce ? ce.nombre : '',
    cedula:  ce ? (ce.cedula || '') : '',
    ruc:     ce ? (ce.ruc || '') : '',
    telefono: ce ? (ce.telefono || '') : '',
    direccion: ce ? (ce.direccion || '') : '',
    fecha: formatFecha(new Date().toISOString()),
    lineas: lineas.filter(l => l.nombre),
    subtotal, iva, total: subtotal + iva
  };
}

function pintarRecibo(r) {
  const html = `
    <div class="recibo-head">
      <div class="recibo-titulo">CACAOGEST</div>
      <div class="recibo-sub">Ciclo 2026 · RUC 0000000000001</div>
      <div class="recibo-centro">Av. Principal s/n, Ecuador</div>
    </div>
    <div class="recibo-meta">
      <div>FACTURA <strong>${r.numero}</strong></div>
      <div>Fecha: ${r.fecha}</div>
      <div>Cliente: <strong>${r.cliente}</strong></div>
      ${r.cedula ? `<div>Cédula: ${r.cedula}</div>` : ''}
      ${r.ruc ? `<div>RUC: ${r.ruc}</div>` : ''}
      ${r.telefono ? `<div>Tel: ${r.telefono}</div>` : ''}
      ${r.direccion ? `<div>Dir: ${r.direccion}</div>` : ''}
    </div>
    <table class="recibo-tabla">
      <thead><tr><th>Cant</th><th>Detalle</th><th>P.Unit</th><th>Subtotal</th></tr></thead>
      <tbody>
        ${r.lineas.map(l => `<tr><td>${l.cantidad}</td><td>${l.nombre}</td><td>${fmtMoney(l.precio)}</td><td>${fmtMoney(l.subtotal)}</td></tr>`).join('')}
      </tbody>
    </table>
    <div class="recibo-totales">
      <div>Subtotal: <strong>${fmtMoney(r.subtotal)}</strong></div>
      <div>IVA (15%): <strong>${fmtMoney(r.iva)}</strong></div>
      <div class="recibo-grand">TOTAL: <strong>${fmtMoney(r.total)}</strong></div>
    </div>
    <div class="recibo-pie">¡Gracias por su preferencia!</div>`;
  document.getElementById('reciboContenido').innerHTML = html;
}

function actualizarRecibo() {
  pintarRecibo(datosReciboActual());
}

function abrirPanelRecibo() {
  document.getElementById('reciboOverlay').classList.add('open');
}

function cerrarRecibo() {
  document.getElementById('reciboOverlay').classList.remove('open');
}

function previsualizarRecibo() {
  actualizarRecibo();
  abrirPanelRecibo();
}

function imprimirRecibo() {
  actualizarRecibo();
  const cont = document.getElementById('reciboContenido');
  const printArea = document.getElementById('reciboPrint');
  printArea.innerHTML = cont.innerHTML;
  printArea.classList.add('listo');
  setTimeout(() => { window.print(); }, 100);
  document.addEventListener('afterprint', () => printArea.classList.remove('listo'), { once: true });
}

function verRecibo(id) {
  const f = facturas.find(x => x.id === id);
  if (!f) return;
  pintarRecibo({
    numero: f.numeroFactura,
    cliente: f.nombreCliente,
    cedula: f.cedulaCliente || '',
    ruc: f.rucCliente || '',
    telefono: f.telefonoCliente || '',
    direccion: f.direccionCliente || '',
    fecha: formatFecha(f.fechaEmision),
    lineas: (f.detalles || []).map(d => ({ cantidad: d.cantidad, nombre: d.descripcion, precio: d.precioUnitario, subtotal: d.subtotal })),
    subtotal: f.subtotal, iva: f.iva, total: f.total
  });
  abrirPanelRecibo();
}

// ── HELPERS ──────────────────────────────────────────
function cerrarModal(id) { document.getElementById(id).classList.remove('open'); }

init();
