/* =====================================================
   CacaoGest — dashboard.js
   ===================================================== */
const API_CULTIVO   = 'http://localhost:8080/api/cultivo';
const API_COSECHA   = 'http://localhost:8080/api/cosecha';
const API_INVENTARIO = 'http://localhost:8080/api/inventario';

function showToast(msg, type) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => t.className = 'toast', 3000);
}

function estadoBadge(estado) {
  const map = {
    PENDIENTE:   ['badge-pendiente',   '⏳ Pendiente'],
    EN_PROCESO:  ['badge-en-proceso',  '🔄 En proceso'],
    COMPLETADA:  ['badge-completada',  '✓ Completada'],
    CANCELADA:   ['badge-cancelada',   '✕ Cancelada']
  };
  const [cls, label] = map[estado] || ['', estado];
  return `<span class="badge ${cls}">${label}</span>`;
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

function formatFecha(f) {
  if (!f) return '—';
  const [y, m, d] = f.split('-');
  return `${d}/${m}/${y}`;
}

async function cargarDashboard() {
  try {
    const [parcelasRes, actividadesRes, cosechaRes, productosRes] = await Promise.all([
      fetch(`${API_CULTIVO}/parcelas`),
      fetch(`${API_CULTIVO}/actividades`),
      fetch(`${API_COSECHA}`),
      fetch(`${API_INVENTARIO}/productos`)
    ]);

    const parcelas = parcelasRes.ok ? await parcelasRes.json() : [];
    const actividades = actividadesRes.ok ? await actividadesRes.json() : [];
    const cosechas = cosechaRes.ok ? await cosechaRes.json() : [];
    const productos = productosRes.ok ? await productosRes.json() : [];

    document.getElementById('kpiParcelas').textContent = parcelas.length;

    const pendientes = actividades.filter(a => a.estado === 'PENDIENTE' || a.estado === 'EN_PROCESO');
    document.getElementById('kpiPendientes').textContent = pendientes.length;

    const totalKg = cosechas.reduce((sum, c) => sum + parseFloat(c.cantidadKg || 0), 0);
    document.getElementById('kpiKg').textContent = totalKg.toLocaleString('es-EC', { minimumFractionDigits: 0, maximumFractionDigits: 1 }) + ' kg';

    const alertas = productos.filter(p => parseFloat(p.stockActual) <= parseFloat(p.stockMinimo));
    document.getElementById('kpiAlertas').textContent = alertas.length;

    const actividadesBody = document.getElementById('actividadesBody');
    const actCount = document.getElementById('actCount');
    if (actividades.length === 0) {
      actividadesBody.innerHTML = '<div style="padding:20px;text-align:center;color:var(--border-color);font-size:13px">No hay actividades registradas</div>';
    } else {
      actCount.textContent = `mostrando ${Math.min(5, actividades.length)} de ${actividades.length}`;
      const ultimas = actividades.slice(-5).reverse();
      let html = '<div style="display:flex;flex-direction:column">';
      ultimas.forEach(a => {
        const parcela = parcelas.find(p => p.id === a.parcelaId);
        html += `<div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:0.8px solid #f0f0f0;font-size:13px">
          <span style="flex:1;font-weight:500;color:var(--text-dark)">${parcela ? parcela.nombre : 'Parcela #' + a.parcelaId}</span>
          <span>${tipoBadge(a.tipo)}</span>
          <span>${estadoBadge(a.estado)}</span>
          <span style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--border-color)">${formatFecha(a.fechaProgramada)}</span>
        </div>`;
      });
      html += '</div>';
      actividadesBody.innerHTML = html;
    }

    const alertasBody = document.getElementById('alertasBody');
    if (alertas.length === 0) {
      alertasBody.innerHTML = '<div style="padding:20px;text-align:center;color:var(--border-color);font-size:13px">✅ Todos los productos tienen stock suficiente</div>';
    } else {
      let html = '';
      alertas.forEach(p => {
        const ratio = parseFloat(p.stockActual) / parseFloat(p.stockMinimo);
        const nivel = ratio <= 0.25 ? 'crítico' : 'bajo';
        html += `<div class="alerta-item">
          <span class="alerta-icon">${nivel === 'crítico' ? '🔴' : '🟡'}</span>
          <div class="alerta-text">
            <div class="producto">${p.nombre}</div>
            <div class="detalle">Stock: ${p.stockActual} ${p.unidadMedida} | Mínimo: ${p.stockMinimo} ${p.unidadMedida}</div>
          </div>
          <span class="alerta-stock">${nivel === 'crítico' ? 'CRÍTICO' : 'BAJO'}</span>
        </div>`;
      });
      alertasBody.innerHTML = html;
    }

  } catch (e) {
    console.error('Error al cargar dashboard:', e);
    showToast('Error al cargar el dashboard', 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const userData = JSON.parse(localStorage.getItem('usuario'));
  if (userData) {
    document.getElementById('dashUser').textContent = userData.nombres
      ? `${userData.nombres} ${userData.apellidos || ''}`
      : userData.username;
    document.getElementById('dashRol').textContent = userData.rol || '';
  }
  cargarDashboard();
});
