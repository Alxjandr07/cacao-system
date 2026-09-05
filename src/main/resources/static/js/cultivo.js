/* =====================================================
   CacaoGest — cultivo.js (con validaciones + provincia/cantón)
   ===================================================== */
const API = 'http://localhost:8081/api/cultivo';
const API_PERSONAL = 'http://localhost:8081/api/personal';
let parcelas    = [];
let actividades = [];
let pagosPorActividad = {};
let sueldosEmpleadoSel = {};
let tabActual   = 'parcelas';

// ── DATOS ECUADOR ────────────────────────────────────
const ECUADOR = {
  "Azuay":           ["Cuenca","Girón","Gualaceo","Nabón","Paute","Pucará","San Fernando","Santa Isabel","Sigsig","Oña","Chordeleg","El Pan","Sevilla de Oro","Guachapala","Camilo Ponce Enríquez"],
  "Bolívar":         ["Guaranda","Chillanes","Chimbo","Echeandía","San Miguel","Caluma","Las Naves"],
  "Cañar":           ["Azogues","Biblián","Cañar","La Troncal","El Tambo","Déleg","Suscal"],
  "Carchi":          ["Tulcán","Bolívar","Espejo","Mira","Montúfar","San Pedro de Huaca"],
  "Chimborazo":      ["Riobamba","Alausí","Colta","Chambo","Chunchi","Guamote","Guano","Pallatanga","Penipe","Cumandá"],
  "Cotopaxi":        ["Latacunga","La Maná","Pangua","Pujilí","Salcedo","Saquisilí","Sigchos"],
  "El Oro":          ["Machala","Arenillas","Atahualpa","Balsas","Chilla","El Guabo","Huaquillas","Marcabelí","Pasaje","Piñas","Portovelo","Santa Rosa","Zaruma","Las Lajas"],
  "Esmeraldas":      ["Esmeraldas","Atacames","Eloy Alfaro","Muisne","Quinindé","San Lorenzo","Río Verde"],
  "Galápagos":       ["Puerto Baquerizo Moreno","Puerto Ayora","Puerto Villamil"],
  "Guayas":          ["Guayaquil","Alfredo Baquerizo Moreno","Balao","Balzar","Colimes","Daule","Durán","El Empalme","El Triunfo","Milagro","Naranjal","Naranjito","Palestina","Pedro Carbo","Samborondón","Santa Lucía","Salitre","San Jacinto de Yaguachi","Playas","Simón Bolívar","Coronel Marcelino Maridueña","Lomas de Sargentillo","Nobol","General Antonio Elizalde","Isidro Ayora"],
  "Imbabura":        ["Ibarra","Antonio Ante","Cotacachi","Otavalo","Pimampiro","San Miguel de Urcuquí"],
  "Loja":            ["Loja","Calvas","Catamayo","Celica","Chaguarpamba","Espíndola","Gonzanamá","Macará","Paltas","Puyango","Saraguro","Sozoranga","Zapotillo","Pindal","Quilanga","Olmedo"],
  "Los Ríos":        ["Babahoyo","Baba","Montalvo","Puebloviejo","Quevedo","Urdaneta","Ventanas","Vínces","Palenque","Buena Fé","Valencia","Mocache","Quinsaloma"],
  "Manabí":          ["Portoviejo","Bolívar","Chone","El Carmen","Flavio Alfaro","Jipijapa","Junín","Manta","Montecristi","Paján","Pichincha","Rocafuerte","Santa Ana","Sucre","Tosagua","24 de Mayo","Pedernales","Olmedo","Puerto López","Jama","Jaramijó","San Vicente"],
  "Morona Santiago": ["Macas","Gualaquiza","Huamboya","Limón Indanza","Logroño","Morona","Pablo Sexto","Palora","San Juan Bosco","Santiago","Sucúa","Taisha","Tiwintza"],
  "Napo":            ["Tena","Archidona","El Chaco","Quijos","Carlos Julio Arosemena Tola"],
  "Orellana":        ["Puerto Francisco de Orellana","Aguarico","La Joya de los Sachas","Loreto"],
  "Pastaza":         ["Puyo","Arajuno","Mera","Santa Clara"],
  "Pichincha":       ["Quito","Cayambe","Mejía","Pedro Moncayo","Rumiñahui","San Miguel de los Bancos","Pedro Vicente Maldonado","Puerto Quito"],
  "Santa Elena":     ["Santa Elena","La Libertad","Salinas"],
  "Santo Domingo":   ["Santo Domingo","La Concordia"],
  "Sucumbíos":       ["Nueva Loja","Cascales","Cuyabeno","Gonzalo Pizarro","Lago Agrio","Putumayo","Shushufindi","Sucumbíos"],
  "Tungurahua":      ["Ambato","Baños de Agua Santa","Cevallos","Mocha","Patate","Quero","San Pedro de Pelileo","Santiago de Píllaro","Tisaleo"],
  "Zamora Chinchipe":["Zamora","Centinela del Cóndor","Chinchipe","El Pangui","Nangaritza","Palanda","Paquisha","Yacuambi","Yantzaza"]
};

const INSUMOS = [
  "Fertilizante NPK","Fertilizante Urea","Fertilizante Fosfato","Fertilizante Potásico",
  "Abono orgánico","Compost","Humus de lombriz",
  "Fungicida Mancozeb","Fungicida Cobre","Fungicida Propiconazol",
  "Herbicida Glifosato","Herbicida 2,4-D","Herbicida Paraquat",
  "Pesticida Clorpirifós","Pesticida Imidacloprid","Pesticida Abamectina",
  "Otro insumo"
];

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

function limpiarErrores(contenedorId) {
  const contenedor = document.getElementById(contenedorId);
  contenedor.querySelectorAll('.field-error').forEach(e => e.remove());
  contenedor.querySelectorAll('.input-error').forEach(e => e.classList.remove('input-error'));
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

// ── PROVINCIA / CANTÓN ───────────────────────────────
function poblarProvincias() {
  const sel = document.getElementById('pProvincia');
  sel.innerHTML = '<option value="">Selecciona provincia...</option>' +
    Object.keys(ECUADOR).sort().map(p => `<option value="${p}">${p}</option>`).join('');
  document.getElementById('pCanton').innerHTML = '<option value="">Primero selecciona provincia</option>';
}

function onProvinciaChange() {
  const prov = document.getElementById('pProvincia').value;
  const sel  = document.getElementById('pCanton');
  if (!prov) {
    sel.innerHTML = '<option value="">Primero selecciona provincia</option>';
    return;
  }
  sel.innerHTML = '<option value="">Selecciona cantón...</option>' +
    (ECUADOR[prov] || []).map(c => `<option value="${c}">${c}</option>`).join('');
}

// ── INSUMOS SELECT ───────────────────────────────────
function poblarInsumos() {
  const sel = document.getElementById('aInsumos');
  sel.innerHTML = '<option value="">Selecciona insumo usado...</option>' +
    INSUMOS.map(i => `<option value="${i}">${i}</option>`).join('') +
    '<option value="Ninguno">Ninguno</option>';
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

// ── EMPLEADOS / PAGOS / SUELDOS (integración) ───────
async function cargarEmpleados() {
  try {
    const res = await fetch(`${API_PERSONAL}`);
    if (!res.ok) return;
    const lista = await res.json();
    const activos = (lista || []).filter(p => p.activo !== false);
    const sel = document.getElementById('aEmpleado');
    sel.innerHTML = '<option value="">Selecciona un empleado...</option>' +
      activos.map(e =>
        `<option value="${e.id}">${e.nombres} ${e.apellidos}</option>`).join('');
  } catch {}
}

async function cargarPagos() {
  pagosPorActividad = {};
  try {
    const res = await fetch(`${API_PERSONAL}/pagos`);
    if (!res.ok) return;
    const pagos = await res.json();
    (pagos || []).forEach(p => {
      pagosPorActividad[p.actividad?.id] = {
        personalId: p.personal?.id,
        nombres:    [p.personal?.nombres, p.personal?.apellidos].filter(Boolean).join(' ') || '—',
        monto:      p.monto,
        estadoPago: p.estadoPago
      };
    });
  } catch {}
}

function pagoBadge(pg) {
  if (!pg) return '<span class="badge badge-otro">Sin asignar</span>';
  return pg.estadoPago === 'PAGADO'
    ? '<span class="badge badge-pagado">✓ Pagado</span>'
    : '<span class="badge badge-pago-pendiente">⏳ Pendiente</span>';
}

function actualizarMontoInfo() {
  const tipo   = document.getElementById('aTipo').value;
  const empId  = document.getElementById('aEmpleado').value;
  const el     = document.getElementById('aMontoInfo');
  if (!empId || !tipo) {
    el.textContent = 'Selecciona un empleado para ver el sueldo por tipo de actividad.';
    return;
  }
  const valor = sueldosEmpleadoSel[tipo];
  el.textContent = valor != null
    ? `Sueldo del empleado para ${tipo}: $${Number(valor).toFixed(2)}`
    : `⚠ No hay sueldo configurado para ${tipo}. Configúralo en Gestión de Personal.`;
}

async function onEmpleadoActividadChange() {
  const empId = document.getElementById('aEmpleado').value;
  sueldosEmpleadoSel = {};
  if (!empId) { actualizarMontoInfo(); return; }
  try {
    const res = await fetch(`${API_PERSONAL}/${empId}/sueldos`);
    const data = res.ok ? await res.json() : { sueldos: [] };
    (data.sueldos || []).forEach(s => { sueldosEmpleadoSel[s.tipo] = s.sueldoDiario; });
    actualizarMontoInfo();
  } catch { actualizarMontoInfo(); }
}

function ontipoActividadChange() { actualizarMontoInfo(); }

// ── PARCELAS ────────────────────────────────────────
async function cargarParcelas(conToast) {
  try {
    const res = await fetch(`${API}/parcelas`);
    if (!res.ok) throw new Error();
    parcelas  = await res.json();
    renderParcelas(parcelas);
    poblarSelectParcelas();
    cargarVencidas();
    cargarEmpleados();
    cargarPagos();
    if (conToast) showToast('Datos actualizados correctamente ✓');
  } catch {
    if (conToast) showToast('No se pudieron actualizar los datos', 'error');
    if (!parcelas.length) {
      document.getElementById('parcelasGrid').innerHTML =
        '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--border-color)">⚠ No se pudo conectar</div>';
    }
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
      <div class="parcela-meta">📍 ${p.ubicacion}${p.direccion ? ' — ' + p.direccion : ''}</div>
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
    const firstOpt = id === 'filtroParcelaAct' ? '<option value="">Todas las parcelas</option>' : '<option value="">Selecciona parcela...</option>';
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
    const res      = await fetch(`${API}/actividades/vencidas`);
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
    tbody.innerHTML = '<tr><td colspan="10" class="empty-state">No hay actividades registradas</td></tr>';
    return;
  }
  tbody.innerHTML = lista.map(a => {
    const pg = pagosPorActividad[a.id];
    return `
    <tr>
      <td class="name">${a.parcela?.nombre || '—'}</td>
      <td>${tipoBadge(a.tipo)}</td>
      <td>${pg?.nombres || '—'}</td>
      <td class="mono">${pg ? '$' + Number(pg.monto).toFixed(2) : '—'}</td>
      <td>${pagoBadge(pg)}</td>
      <td class="mono">${formatFecha(a.fechaProgramada)}</td>
      <td class="mono">${formatFecha(a.fechaRealizada)}</td>
      <td style="max-width:150px;font-size:11px;color:var(--text-main)">${a.insumosUsados || '—'}</td>
      <td>${estadoBadge(a.estado)}</td>
      <td>
        <button class="action-btn" onclick="abrirEditarActividad(${a.id})">✎</button>
        <button class="action-btn danger" onclick="eliminarActividad(${a.id})">✕</button>
      </td>
    </tr>`;
  }).join('');
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
  ['pNombre','pDireccion','pVariedad','pResponsable','pObservaciones'].forEach(id =>
    document.getElementById(id).value = '');
  document.getElementById('pHectareas').value = '';
  poblarProvincias();
  limpiarErrores('modalParcela');
  document.getElementById('modalParcela').classList.add('open');
}

function abrirEditarParcela(id) {
  const p = parcelas.find(x => x.id === id);
  if (!p) return;
  document.getElementById('modalParcelaTitulo').textContent = 'Editar parcela';
  document.getElementById('parcelaId').value      = p.id;
  document.getElementById('pNombre').value        = p.nombre;
  document.getElementById('pDireccion').value     = p.direccion    || '';
  document.getElementById('pHectareas').value     = p.hectareas || '';
  document.getElementById('pVariedad').value      = p.variedadCacao  || '';
  document.getElementById('pResponsable').value   = p.responsable    || '';
  document.getElementById('pObservaciones').value = p.observaciones  || '';

  // Parsear ubicacion "Provincia, Cantón"
  poblarProvincias();
  if (p.ubicacion && p.ubicacion.includes(',')) {
    const [prov, cant] = p.ubicacion.split(',').map(s => s.trim());
    document.getElementById('pProvincia').value = prov;
    onProvinciaChange();
    setTimeout(() => { document.getElementById('pCanton').value = cant; }, 50);
  }
  limpiarErrores('modalParcela');
  document.getElementById('modalParcela').classList.add('open');
}

async function guardarParcela() {
  limpiarErrores('modalParcela');
  const nombre    = document.getElementById('pNombre').value.trim();
  const provincia = document.getElementById('pProvincia').value;
  const canton    = document.getElementById('pCanton').value;
  const direccion = document.getElementById('pDireccion').value.trim();
  const hectareas = document.getElementById('pHectareas').value;
  const responsable = document.getElementById('pResponsable').value.trim();
  let valido = true;

  if (!nombre || nombre.length < 3) {
    marcarError('pNombre', 'Mínimo 3 caracteres'); valido = false;
  }
  if (!provincia) {
    marcarError('pProvincia', 'Selecciona una provincia'); valido = false;
  }
  if (!canton) {
    marcarError('pCanton', 'Selecciona un cantón'); valido = false;
  }
  if (hectareas && (isNaN(parseFloat(hectareas)) || parseFloat(hectareas) <= 0)) {
    marcarError('pHectareas', 'Debe ser un número positivo'); valido = false;
  }
  if (responsable && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(responsable)) {
    marcarError('pResponsable', 'Solo letras y espacios'); valido = false;
  }
  if (!valido) return;

  const id   = document.getElementById('parcelaId').value;
  const body = {
    nombre,
    ubicacion:     `${provincia}, ${canton}`,
    direccion:     direccion || null,
    hectareas:     hectareas ? parseFloat(hectareas) : null,
    variedadCacao: document.getElementById('pVariedad').value.trim()      || null,
    responsable:   responsable || null,
    observaciones: document.getElementById('pObservaciones').value.trim() || null
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
  document.getElementById('aEmpleado').value    = '';
  document.getElementById('aObservaciones').value = '';
  sueldosEmpleadoSel = {};
  document.getElementById('aMontoInfo').textContent = 'Selecciona un empleado para ver el sueldo por tipo de actividad.';
  poblarInsumos();
  limpiarErrores('modalActividad');
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
  document.getElementById('aObservaciones').value  = a.observaciones   || '';
  const pg = pagosPorActividad[a.id];
  sueldosEmpleadoSel = {};
  document.getElementById('aEmpleado').value = pg?.personalId != null ? String(pg.personalId) : '';
  document.getElementById('aMontoInfo').textContent = 'Selecciona un empleado para ver el sueldo por tipo de actividad.';
  if (pg?.personalId != null) {
    fetch(`${API_PERSONAL}/${pg.personalId}/sueldos`)
      .then(r => r.ok ? r.json() : { sueldos: [] })
      .then(data => {
        (data.sueldos || []).forEach(s => sueldosEmpleadoSel[s.tipo] = s.sueldoDiario);
        actualizarMontoInfo();
      })
      .catch(() => {});
  }
  poblarInsumos();
  if (a.insumosUsados) document.getElementById('aInsumos').value = a.insumosUsados;
  limpiarErrores('modalActividad');
  document.getElementById('modalActividad').classList.add('open');
}

async function guardarActividad() {
  limpiarErrores('modalActividad');
  const parcelaId   = document.getElementById('aParcelaId').value;
  const fechaProg   = document.getElementById('aFechaProg').value;
  const fechaReal   = document.getElementById('aFechaReal').value;
  const empleadoId  = document.getElementById('aEmpleado').value;
  const tipo        = document.getElementById('aTipo').value;
  const hoy         = new Date().toISOString().split('T')[0];
  let valido = true;

  if (!parcelaId) {
    marcarError('aParcelaId', 'Selecciona una parcela'); valido = false;
  }
  if (!fechaProg) {
    marcarError('aFechaProg', 'La fecha programada es obligatoria'); valido = false;
  }
  if (fechaReal && fechaReal > hoy) {
    marcarError('aFechaReal', 'La fecha realizada no puede ser futura'); valido = false;
  }
  if (empleadoId && sueldosEmpleadoSel[tipo] == null) {
    marcarError('aEmpleado', `Configura el sueldo del empleado para ${tipo} en Gestión de Personal.`);
    valido = false;
  }
  if (!valido) return;

  const id   = document.getElementById('actividadId').value;
  const body = {
    tipo:            tipo,
    estado:          document.getElementById('aEstado').value,
    fechaProgramada: fechaProg,
    fechaRealizada:  fechaReal || null,
    insumosUsados:   document.getElementById('aInsumos').value || null,
    observaciones:   document.getElementById('aObservaciones').value.trim() || null
  };
  const url    = id ? `${API}/actividades/${id}` : `${API}/actividades/parcela/${parcelaId}`;
  const method = id ? 'PUT' : 'POST';
  try {
    const res  = await fetch(url, { method, headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) { showToast('Error: ' + (data.error || 'Verifica los datos'), 'error'); return; }
    if (!id && empleadoId && data.id) {
      const asg = await fetch(`${API_PERSONAL}/pagos`, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ personalId: +empleadoId, actividadId: data.id })
      });
      if (!asg.ok) {
        const e = await asg.json();
        showToast('Actividad creada, pero no se pudo asignar el empleado: ' + (e.error || ''), 'error');
      }
    }
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
//document.querySelectorAll('.modal-overlay').forEach(m => {
//m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); });
//});

cargarParcelas();
