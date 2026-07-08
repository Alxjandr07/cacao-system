/* =====================================================
   CacaoGest — inventario.js
   ===================================================== */
const API = 'http://localhost:8080/api/inventario';
let productos = [];

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
  const hoy  = new Date();
  const ayer = new Date(); ayer.setDate(ayer.getDate() - 1);
  if (d.toDateString() === hoy.toDateString())  return 'Hoy';
  if (d.toDateString() === ayer.toDateString()) return 'Ayer';
  return d.toLocaleDateString('es-EC', { day:'2-digit', month:'2-digit', year:'numeric' });
}

// ── CARGA ───────────────────────────────────────────
async function cargarProductos() {
  try {
    const res = await fetch(`${API}/productos`);
    if (!res.ok) throw new Error();
    productos = await res.json();
    filtrar();
    cargarAlertas();
  } catch {
    document.getElementById('tablaBody').innerHTML =
      '<tr><td colspan="7" class="empty-state">⚠ No se pudo conectar con el servidor</td></tr>';
  }
}

async function cargarAlertas() {
  try {
    const res    = await fetch(`${API}/alertas`);
    const alertas = await res.json();
    const banner  = document.getElementById('alertaBanner');
    if (alertas.length > 0) {
      banner.classList.remove('hidden');
      document.getElementById('alertaTexto').textContent =
        `${alertas.length} producto(s) con stock bajo o crítico: ${alertas.map(p => p.nombre).join(', ')}`;
    } else {
      banner.classList.add('hidden');
    }
  } catch {}
}

// ── RENDER ──────────────────────────────────────────
function renderTabla(lista) {
  const tbody = document.getElementById('tablaBody');
  if (!lista.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No hay productos registrados</td></tr>';
    return;
  }
  tbody.innerHTML = lista.map(p => {
    const stock  = parseFloat(p.stockActual);
    const min    = parseFloat(p.stockMinimo);
    const critico    = stock === 0;
    const bajo       = !critico && stock <= min;

    const estadoBadge = critico
      ? `<span class="badge badge-critico"><span class="badge-dot dot-red"></span>Crítico</span>`
      : bajo
        ? `<span class="badge badge-bajo"><span class="badge-dot dot-amber"></span>Stock bajo</span>`
        : `<span class="badge badge-disponible"><span class="badge-dot dot-blue"></span>Disponible</span>`;

    const tipoBadge = p.tipo === 'CACAO'
      ? `<span class="badge badge-cacao">Cacao</span>`
      : `<span class="badge badge-insumo">Insumo</span>`;

    return `<tr>
      <td class="name">${p.nombre}</td>
      <td>${tipoBadge}</td>
      <td class="mono">${stock.toLocaleString('es-EC')} ${p.unidadMedida}</td>
      <td class="mono">${min.toLocaleString('es-EC')}  ${p.unidadMedida}</td>
      <td>${formatFecha(p.actualizadoEn)}</td>
      <td>${estadoBadge}</td>
      <td>
        <button class="action-btn" onclick="abrirMovimiento(${p.id})">↕ Mov.</button>
        <button class="action-btn" onclick="abrirEditar(${p.id})">✎ Editar</button>
        <button class="action-btn danger" onclick="eliminar(${p.id})">✕</button>
      </td>
    </tr>`;
  }).join('');
}

// ── FILTROS ─────────────────────────────────────────
function filtrar() {
  const tipo  = document.getElementById('filtroTipo').value;
  const texto = document.getElementById('searchInput').value.toLowerCase().trim();
  renderTabla(productos.filter(p =>
    (!tipo  || p.tipo === tipo) &&
    (!texto || p.nombre.toLowerCase().includes(texto))
  ));
}
document.getElementById('searchInput').addEventListener('input', filtrar);

// ── MODAL PRODUCTO ───────────────────────────────────
function abrirModalProducto() {
  document.getElementById('modalProductoTitulo').textContent = 'Nuevo producto';
  document.getElementById('productoId').value = '';
  ['pNombre','pUnidad','pDescripcion'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('pTipo').value     = 'CACAO';
  document.getElementById('pStock').value    = '';
  document.getElementById('pStockMin').value = '';
  document.getElementById('modalProducto').classList.add('open');
}

function abrirEditar(id) {
  const p = productos.find(x => x.id === id);
  if (!p) return;
  document.getElementById('modalProductoTitulo').textContent = 'Editar producto';
  document.getElementById('productoId').value    = p.id;
  document.getElementById('pNombre').value       = p.nombre;
  document.getElementById('pTipo').value         = p.tipo;
  document.getElementById('pUnidad').value       = p.unidadMedida;
  document.getElementById('pStock').value        = p.stockActual;
  document.getElementById('pStockMin').value     = p.stockMinimo;
  document.getElementById('pDescripcion').value  = p.descripcion || '';
  document.getElementById('modalProducto').classList.add('open');
}

async function guardarProducto() {
  const nombre = document.getElementById('pNombre').value.trim();
  const unidad = document.getElementById('pUnidad').value.trim();
  const stock  = document.getElementById('pStock').value;
  const stockM = document.getElementById('pStockMin').value;
  if (!nombre || !unidad || stock === '' || stockM === '') {
    showToast('Completa todos los campos obligatorios', 'error'); return;
  }
  const id   = document.getElementById('productoId').value;
  const body = {
    nombre, tipo: document.getElementById('pTipo').value,
    unidadMedida: unidad,
    stockActual: parseFloat(stock), stockMinimo: parseFloat(stockM),
    descripcion: document.getElementById('pDescripcion').value.trim()
  };
  const url    = id ? `${API}/productos/${id}` : `${API}/productos`;
  const method = id ? 'PUT' : 'POST';
  try {
    const res = await fetch(url, { method, headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
    if (!res.ok) throw new Error();
    cerrarModal('modalProducto');
    showToast(id ? 'Producto actualizado ✓' : 'Producto creado ✓');
    cargarProductos();
  } catch { showToast('Error al guardar el producto', 'error'); }
}

async function eliminar(id) {
  if (!confirm('¿Eliminar este producto del inventario?')) return;
  try {
    await fetch(`${API}/productos/${id}`, { method: 'DELETE' });
    showToast('Producto eliminado');
    cargarProductos();
  } catch { showToast('Error al eliminar', 'error'); }
}

// ── MODAL MOVIMIENTO ─────────────────────────────────
function abrirMovimiento(id) {
  document.getElementById('movProductoId').value = id;
  document.getElementById('movCantidad').value   = '';
  document.getElementById('movMotivo').value     = '';
  document.querySelector('input[name=movTipo][value=ENTRADA]').checked = true;
  updateMovLabel();
  document.getElementById('modalMovimiento').classList.add('open');
}

function updateMovLabel() {
  const val = document.querySelector('input[name=movTipo]:checked').value;
  document.getElementById('labelEntrada').className =
    'mov-type-label' + (val === 'ENTRADA' ? ' selected-entrada' : '');
  document.getElementById('labelSalida').className =
    'mov-type-label' + (val === 'SALIDA'  ? ' selected-salida'  : '');
}

async function guardarMovimiento() {
  const cantidad = document.getElementById('movCantidad').value;
  if (!cantidad || parseFloat(cantidad) <= 0) {
    showToast('Ingresa una cantidad válida', 'error'); return;
  }
  const body = {
    productoId: document.getElementById('movProductoId').value,
    tipo:       document.querySelector('input[name=movTipo]:checked').value,
    cantidad,
    motivo:     document.getElementById('movMotivo').value.trim()
  };
  try {
    const res  = await fetch(`${API}/movimientos`, {
      method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) { showToast('Error: ' + (data.error || 'Stock insuficiente'), 'error'); return; }
    cerrarModal('modalMovimiento');
    showToast('Movimiento registrado ✓');
    cargarProductos();
  } catch { showToast('Error al registrar movimiento', 'error'); }
}

// ── HELPERS ──────────────────────────────────────────
function cerrarModal(id) { document.getElementById(id).classList.remove('open'); }
document.querySelectorAll('.modal-overlay').forEach(m => {
  m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); });
});

cargarProductos();
