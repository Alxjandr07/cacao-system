/* =====================================================
   CacaoGest — ventas.js (formulario de registro multi-producto)
   ===================================================== */
const API_VENTAS = 'http://localhost:8081/api/ventas';
const API_FACT   = 'http://localhost:8081/api/facturacion';
const API_CLIENTES = 'http://localhost:8081/api/clientes';

let clientes  = [];
let productos = [];
let lineas    = [];
let cfg = { iva: 15, bolsa: false, precio: 0, fechaPrecio: null };

// ── USUARIO SIDEBAR ─────────────────────────────────
const u = JSON.parse(localStorage.getItem('usuario') || '{}');
if (u.nombres) document.getElementById('sidebarNombre').textContent = u.nombres + ' ' + (u.apellidos || '');
if (u.rol)     document.getElementById('sidebarRol').textContent = u.rol;
if (u.username) document.getElementById('usuarioRegistra').value = u.username;

function cerrarSesion() {
  localStorage.removeItem('usuario');
  window.location.href = 'login.html';
}

// ── UTILS ──────────────────────────────────────────
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => t.className = 'toast', 3500);
}

function fmtMoney(v) {
  return '$' + (parseFloat(v) || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// ── CARGA / KPIs ────────────────────────────────────
async function cargarKPIs() {
  try {
    const res = await fetch(API_FACT);
    if (!res.ok) throw new Error();
    const facturas = await res.json();
    document.getElementById('kpiTotal').textContent = facturas.length;
    document.getElementById('kpiEmitidas').textContent = facturas.filter(f => f.estado === 'EMITIDA').length;
    document.getElementById('kpiPagadas').textContent = facturas.filter(f => f.estado === 'PAGADA').length;
    document.getElementById('kpiAnuladas').textContent = facturas.filter(f => f.estado === 'ANULADA').length;
  } catch {}
}

async function cargarClientes() {
  try {
    const res = await fetch(API_CLIENTES);
    if (!res.ok) throw new Error();
    clientes = await res.json();
    const sel = document.getElementById('fCliente');
    sel.innerHTML = '<option value="">— Seleccionar cliente —</option>' +
      clientes.filter(c => c.activo !== false)
        .map(c => `<option value="${c.id}">${c.nombre}${c.cedula ? ' · ' + c.cedula : ''}${c.ruc ? ' · ' + c.ruc : ''}</option>`).join('');
  } catch {}
}

async function cargarProductos() {
  try {
    const res = await fetch(`${API_VENTAS}/productos`);
    if (!res.ok) throw new Error();
    productos = await res.json();
    if (lineas.length) renderLineas();
  } catch {}
}

function init() {
  document.getElementById('fechaVenta').value = new Date().toISOString().slice(0, 10);
  generarNumero();
  cargarKPIs();
  cargarClientes();
  cargarProductos();
  cargarConfig();
  agregarLinea();
  setInterval(evaluarAlertaBolsa, 60000);
}

function cerrarModal(id) { document.getElementById(id).classList.remove('open'); }

// ── CONFIG PRECIO / IVA ────────────────────────────
async function cargarConfig() {
  try {
    const res = await fetch(`${API_VENTAS}/config`);
    if (!res.ok) throw new Error();
    const d = await res.json();
    cfg.iva = parseFloat(d.ivaPorcentaje) || 0;
    cfg.bolsa = !!d.usarPrecioBolsa;
    cfg.precio = parseFloat(d.precioBolsa) || 0;
    cfg.fechaPrecio = d.fechaPrecioBolsa || null;
  } catch {}
  aplicarConfig();
}

function aplicarConfig() {
  document.getElementById('fIvaLabel').textContent = `IVA (${cfg.iva}%)`;
  const badge = document.getElementById('modoPrecioBadge');
  if (cfg.bolsa && cfg.precio > 0) {
    badge.style.display = 'inline-block';
    badge.textContent = `Bolsa $${cfg.precio.toFixed(2)}/kg`;
    lineas.forEach(l => { l.precio = cfg.precio; });
  } else {
    badge.style.display = 'none';
  }
  renderLineas();
  evaluarAlertaBolsa();
}

function fechaHoyLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function evaluarAlertaBolsa() {
  const mostrar = cfg.bolsa && cfg.fechaPrecio !== fechaHoyLocal();
  document.getElementById('bannerBolsa').style.display = mostrar ? 'flex' : 'none';
  if (mostrar) document.getElementById('bannerBolsaPrecio').textContent = '$' + cfg.precio.toFixed(2) + '/kg';
}

function abrirModalConfig() {
  document.getElementById('cfgIva').value = cfg.iva;
  document.getElementById('cfgBolsaOn').checked = cfg.bolsa;
  document.getElementById('cfgBolsaPrecio').value = cfg.precio || '';
  document.getElementById('cfgBolsaFecha').textContent = cfg.fechaPrecio
    ? 'Última actualización del precio de bolsa: ' + cfg.fechaPrecio
    : 'Aún no se ha definido el precio de bolsa';
  document.getElementById('modalConfig').classList.add('open');
}

async function guardarConfig() {
  const iva = parseFloat(document.getElementById('cfgIva').value);
  const bolsaOn = document.getElementById('cfgBolsaOn').checked;
  const precioRaw = document.getElementById('cfgBolsaPrecio').value;
  const precio = precioRaw === '' ? null : parseFloat(precioRaw);
  if (!(iva >= 0) || iva > 100) { showToast('El IVA debe estar entre 0 y 100', 'error'); return; }
  if (bolsaOn && !(precio > 0)) { showToast('Define el precio de bolsa para activar el modo bolsa', 'error'); return; }
  try {
    const res = await fetch(`${API_VENTAS}/config`, {
      method: 'PUT', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ ivaPorcentaje: iva, usarPrecioBolsa: bolsaOn, precioBolsa: precio })
    });
    const data = await res.json();
    if (!res.ok) { showToast('Error: ' + (data.error || 'No se pudo guardar'), 'error'); return; }
    cfg.iva = parseFloat(data.ivaPorcentaje) || 0;
    cfg.bolsa = !!data.usarPrecioBolsa;
    cfg.precio = parseFloat(data.precioBolsa) || 0;
    cfg.fechaPrecio = data.fechaPrecioBolsa || null;
    cerrarModal('modalConfig');
    showToast('Configuración guardada ✓');
    aplicarConfig();
  } catch { showToast('Error al guardar la configuración', 'error'); }
}

async function generarNumero() {
  try {
    const res  = await fetch(`${API_VENTAS}/generar-numero`);
    const data = await res.json();
    document.getElementById('numeroFactura').value = data.numero;
  } catch {
    document.getElementById('numeroFactura').value = '';
  }
}

// ── CLIENTE ─────────────────────────────────────────
function onClienteSeleccionado() {
  const id = document.getElementById('fCliente').value;
  const c  = clientes.find(x => x.id === Number(id));
  document.getElementById('fCedula').value   = (c && c.cedula) || '';
  document.getElementById('fRuc').value      = (c && c.ruc) || '';
  document.getElementById('fTelefono').value = (c && c.telefono) || '';
  document.getElementById('fDireccion').value = (c && c.direccion) || '';
  actualizarRecibo();
}

// ── LINEAS DE VENTA ────────────────────────────────
function opcionesProductos(lid, selectedId) {
  const usados = lineas
    .filter(l => l.id !== lid && l.productoId)
    .map(l => l.productoId);
  return productos.map(p => {
    const yaUsado = usados.includes(p.id);
    return `<option value="${p.id}" ${selectedId === p.id ? 'selected' : ''} ${yaUsado ? 'disabled' : ''} data-nombre="${(p.nombre||'').replace(/"/g,'&quot;')}" data-stock="${p.stockActual}">${p.nombre} (${p.unidadMedida}) ${yaUsado ? '· ya agregado' : ''} — disp ${parseFloat(p.stockActual)}</option>`;
  }).join('');
}

function agregarLinea() {
  const id = Date.now() + Math.random();
  lineas.push({ id, productoId: '', nombre: '', calidad: 'PRIMERA', cantidad: 1,
    precio: (cfg.bolsa && cfg.precio > 0) ? cfg.precio : 0, subtotal: 0, stock: 0 });
  renderLineas();
}

function eliminarLinea(lid) {
  lineas = lineas.filter(l => l.id !== lid);
  renderLineas();
}

function onLineaProducto(lid, sel) {
  const linea = lineas.find(l => l.id === lid);
  const prod  = productos.find(p => p.id === Number(sel.value));
  const yaUsado = linea && prod && lineas.some(l => l.id !== lid && l.productoId === prod.id);
  if (yaUsado) {
    sel.value = linea.productoId ? String(linea.productoId) : '';
    sel.classList.add('input-error');
    setTimeout(() => sel.classList.remove('input-error'), 900);
    return;
  }
  if (linea && prod) {
    linea.productoId = prod.id;
    linea.nombre = prod.nombre;
    linea.stock = parseFloat(prod.stockActual) || 0;
    linea.unidad = prod.unidadMedida || 'kg';
    const row = document.getElementById('stock-' + lid);
    if (row) row.textContent = linea.stock + ' ' + linea.unidad;
    marcaStock(lid);
  }
}

function onLineaCalidad(lid, val) {
  const linea = lineas.find(l => l.id === lid);
  if (linea) linea.calidad = val;
}

function onLineaCantidad(lid, val) {
  const linea = lineas.find(l => l.id === lid);
  if (linea) { linea.cantidad = parseFloat(val) || 0; recalcularLinea(lid); marcaStock(lid); }
}

function onLineaPrecio(lid, val) {
  const linea = lineas.find(l => l.id === lid);
  if (linea) { linea.precio = parseFloat(val) || 0; recalcularLinea(lid); }
}

function marcaStock(lid) {
  const linea = lineas.find(l => l.id === lid);
  const qty = document.getElementById('qty-' + lid);
  const msg = document.getElementById('stockMsg-' + lid);
  if (!linea || !qty) return;
  const excede = linea.productoId && linea.cantidad > linea.stock;
  qty.classList.toggle('input-error', excede);
  if (msg) {
    const disp = linea.unidad || 'kg';
    msg.textContent = `Stock insuf.: ${linea.stock} ${disp} disp.`;
    msg.style.display = excede ? 'block' : 'none';
  }
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
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Haz clic en "+ Agregar producto" para iniciar la venta</td></tr>';
  } else {
    tbody.innerHTML = lineas.map(l => `
      <tr>
        <td>
          <select class="linea-prod" onchange="onLineaProducto(${l.id}, this)">
            <option value="">Seleccionar producto</option>
            ${opcionesProductos(l.id, l.productoId)}
          </select>
        </td>
        <td>
          <select class="linea-prod" onchange="onLineaCalidad(${l.id}, this.value)">
            <option value="EXTRA">Extra</option>
            <option value="PRIMERA" ${l.calidad === 'PRIMERA' ? 'selected' : ''}>Primera</option>
            <option value="SEGUNDA">Segunda</option>
            <option value="CACAO_EN_BABA">En baba</option>
          </select>
        </td>
        <td>
          <input type="number" id="qty-${l.id}" class="linea-num ${l.productoId && l.cantidad > l.stock ? 'input-error' : ''}" min="0.01" step="0.01" value="${l.cantidad}" oninput="onLineaCantidad(${l.id}, this.value)">
          <div id="stockMsg-${l.id}" class="linea-err" style="display:${l.productoId && l.cantidad > l.stock ? 'block' : 'none'}">Stock insuf.: ${l.stock} disp.</div>
        </td>
        <td><input type="number" class="linea-num" min="0" step="0.01" placeholder="Precio / kg" value="${l.precio || ''}" oninput="onLineaPrecio(${l.id}, this.value)" ${cfg.bolsa ? 'disabled title="Precio de bolsa global (cámbialo en ⚙ Precio e IVA)"' : ''}></td>
        <td class="mono" id="sub-${l.id}">${fmtMoney(l.subtotal)}</td>
        <td class="mono" id="stock-${l.id}">${l.stock || '—'}</td>
        <td><button class="action-btn danger" onclick="eliminarLinea(${l.id})">✕</button></td>
      </tr>`).join('');
  }
  recalcularTotales();
}

function recalcularTotales() {
  const subtotal = lineas.reduce((s, l) => s + (l.subtotal || 0), 0);
  const iva      = subtotal * (cfg.iva / 100);
  const total    = subtotal + iva;
  document.getElementById('fSubtotal').textContent = fmtMoney(subtotal);
  document.getElementById('fIva').textContent      = fmtMoney(iva);
  document.getElementById('fTotal').textContent    = fmtMoney(total);
  actualizarRecibo();
}

// ── GUARDAR VENTA ───────────────────────────────────
async function confirmarVenta() {
  const clienteId = document.getElementById('fCliente').value;
  if (!clienteId) { showToast('Selecciona un cliente', 'error'); return; }
  const lineasValidas = lineas.filter(l => l.productoId);
  if (!lineasValidas.length) { showToast('Agrega al menos un producto con cantidad', 'error'); return; }

  for (const l of lineasValidas) {
    if (!(l.cantidad > 0)) { showToast(`Revisa la cantidad del producto '${l.nombre}'`, 'error'); return; }
    if (!(l.precio > 0)) { showToast(`Indica el precio por kg (P. /kg) de '${l.nombre}'`, 'error'); return; }
    if (l.cantidad > l.stock) {
      showToast(`Stock insuficiente: '${l.nombre}' solo tiene ${l.stock} kg disponibles`, 'error');
      marcaStock(l.id);
      return;
    }
  }

  const ce = clientes.find(c => c.id === Number(clienteId));
  const productosPayload = lineasValidas.map(l => ({
    productoId: l.productoId,
    calidad: l.calidad,
    precioKg: l.precio,
    cantidadKg: l.cantidad
  }));

  const body = {
    clienteNombre: ce ? ce.nombre : '',
    clienteCedula: ce ? (ce.cedula || '') : '',
    clienteRuc: ce ? (ce.ruc || '') : '',
    clienteTelefono: ce ? (ce.telefono || '') : '',
    clienteDireccion: ce ? (ce.direccion || '') : '',
    numeroFactura: document.getElementById('numeroFactura').value,
    usuarioRegistra: u.username || '',
    productos: productosPayload
  };

  try {
    const res  = await fetch(`${API_VENTAS}/registrar`, {
      method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) {
      showToast('Error: ' + (data.error || 'No se pudo registrar'), 'error'); return;
    }
    showToast('Venta registrada · Factura ' + data.numeroFactura + ' ✓');
    if (data.trazabilidadPendiente > 0) {
      setTimeout(() => showToast(`⚠ ${data.trazabilidadPendiente} lote(s) vendido(s) pendiente(s) de asignar trazabilidad`, 'warning'), 3600);
    }
    await cargarProductos();
    await cargarKPIs();
    limpiarFormulario();
  } catch { showToast('Error al registrar la venta', 'error'); }
}

function limpiarFormulario() {
  document.getElementById('fCliente').value = '';
  onClienteSeleccionado();
  document.getElementById('fechaVenta').value = new Date().toISOString().slice(0, 10);
  lineas = [];
  renderLineas();
  agregarLinea();
  generarNumero();
}

// ── RECIBO / FACTURA ────────────────────────────────
function datosReciboActual() {
  const ce = clientes.find(c => c.id === Number(document.getElementById('fCliente').value));
  const lineaValidas = lineas.filter(l => l.productoId);
  const subtotal = lineaValidas.reduce((s, l) => s + (l.subtotal || 0), 0);
  const iva      = subtotal * (cfg.iva / 100);
  return {
    ivaPct: cfg.iva,
    numero:  document.getElementById('numeroFactura').value || '',
    cliente: ce ? ce.nombre : '',
    cedula:  ce ? (ce.cedula || '') : '',
    ruc:     ce ? (ce.ruc || '') : '',
    telefono: ce ? (ce.telefono || '') : '',
    direccion: ce ? (ce.direccion || '') : '',
    fecha: document.getElementById('fechaVenta').value
      ? new Date(document.getElementById('fechaVenta').value).toLocaleDateString('es-EC')
      : new Date().toLocaleDateString('es-EC'),
    lineas: lineaValidas,
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
        ${r.lineas.map(l => `<tr><td>${l.cantidad}</td><td>${l.nombre} · ${l.calidad || ''}</td><td>${fmtMoney(l.precio)}</td><td>${fmtMoney(l.subtotal)}</td></tr>`).join('')}
      </tbody>
    </table>
    <div class="recibo-totales">
      <div>Subtotal: <strong>${fmtMoney(r.subtotal)}</strong></div>
      <div>IVA (${r.ivaPct}%): <strong>${fmtMoney(r.iva)}</strong></div>
      <div class="recibo-grand">TOTAL: <strong>${fmtMoney(r.total)}</strong></div>
    </div>
    <div class="recibo-pie">¡Gracias por su preferencia!</div>`;
  document.getElementById('reciboContenido').innerHTML = html;
}

function actualizarRecibo() { pintarRecibo(datosReciboActual()); }

function abrirPanelRecibo() { document.getElementById('reciboOverlay').classList.add('open'); }
function cerrarRecibo() { document.getElementById('reciboOverlay').classList.remove('open'); }

function previsualizarRecibo() {
  actualizarRecibo();
  abrirPanelRecibo();
}

function imprimirRecibo() {
  actualizarRecibo();
  const cont = document.getElementById('reciboContenido');
  const printArea = document.getElementById('reciboPrint');
  if (!cont || !printArea) return;
  printArea.innerHTML = cont.innerHTML;
  printArea.classList.add('listo');
  setTimeout(() => { window.print(); }, 100);
  document.addEventListener('afterprint', () => printArea.classList.remove('listo'), { once: true });
}

init();
