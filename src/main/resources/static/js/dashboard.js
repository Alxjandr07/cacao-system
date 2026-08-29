/* =====================================================
   CacaoGest — dashboard.js (personalizado por rol/permiso)
   ===================================================== */

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
  if (f.includes('T')) return formatFecha(f.split('T')[0]);
  const [y, m, d] = f.split('-');
  return `${d}/${m}/${y}`;
}

function fmtNum(n) {
  const v = parseFloat(n || 0);
  return isNaN(v) ? '0' : Math.round(v).toLocaleString('es-EC');
}

// Fetch seguro con header X-Username (app.js lo inyecta automáticamente)
async function safeFetch(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

// tienePermiso() viene de app.js (global). En dashboard.js usamos la función global directamente.

// Modo 'solo lectura' para roles que ven recursos sin gestionarlos.
// Los endpoints fueron mapeados al mismo permiso de gestión; quien lo ve, puede leerlo.

/* ============================================================
   WIDGETS: cada uno define qué muestra y qué datos necesita.
   Solo se cargan/renderizan los que el rol tiene permiso de ver.
   ============================================================ */
const WIDGETS = [
  {
    id: 'cultivo',
    permiso: 'GESTIONAR_CULTIVO',
    kpis: [
      { label: 'Total parcelas', sub: 'registradas en el sistema', val: d => d.parcelas.length },
      { label: 'Act. pendientes', sub: 'por completar', val: d => d.actividades.filter(a => a.estado === 'PENDIENTE' || a.estado === 'EN_PROCESO').length }
    ],
    card: { titulo: '📋 Últimas actividades' },
    load: async () => ({
      parcelas: (await safeFetch('http://localhost:8081/api/cultivo/parcelas')) || [],
      actividades: (await safeFetch('http://localhost:8081/api/cultivo/actividades')) || []
    }),
    renderCard: (d) => {
      const act = d.actividades || [];
      if (act.length === 0) return '<div class="empty-dash">No hay actividades registradas</div>';
      let html = '<div style="display:flex;flex-direction:column">';
      act.slice(-5).reverse().forEach(a => {
        const parcela = (d.parcelas || []).find(p => p.id === a.parcelaId);
        html += `<div class="dash-row">
          <span class="dash-main">${parcela ? parcela.nombre : 'Parcela #' + a.parcelaId}
            <span class="dash-sub">${formatFecha(a.fechaProgramada)}</span></span>
          <span>${tipoBadge(a.tipo)}</span>${estadoBadge(a.estado)}
        </div>`;
      });
      html += '</div>';
      return html;
    }
  },
  {
    id: 'cosecha',
    permiso: 'GESTIONAR_COSECHA',
    kpis: [
      { label: 'Total cosechado', sub: 'kilogramos acumulados', val: d => fmtNum(d.list.reduce((s, c) => s + parseFloat(c.cantidadKg || 0), 0)) + ' kg' }
    ],
    card: { titulo: '🫘 Últimas cosechas' },
    load: async () => ({ list: (await safeFetch('http://localhost:8081/api/cosecha')) || [] }),
    renderCard: (d) => {
      const list = d.list || [];
      if (list.length === 0) return '<div class="empty-dash">No hay cosechas registradas</div>';
      let html = '<div style="display:flex;flex-direction:column">';
      list.slice(-5).reverse().forEach(c => {
        const parcela = c.parcela && c.parcela.nombre;
        html += `<div class="dash-row">
          <span class="dash-main">${c.numeroLote || ('Lote #' + c.id)}
            <span class="dash-sub">${parcela || 'Parcela'} · ${formatFecha(c.fechaCosecha)}</span></span>
          <span style="font-family:\'IBM Plex Mono\',monospace;font-weight:700;color:var(--text-dark)">${fmtNum(c.cantidadKg)} kg</span>
        </div>`;
      });
      html += '</div>';
      return html;
    }
  },
  {
    id: 'inventario',
    permiso: 'VER_INVENTARIO',
    kpis: [
      { label: 'Alertas de stock', sub: 'productos con stock bajo', val: d => d.alertas.length }
    ],
    card: { titulo: '⚠️ Alertas de inventario' },
    load: async () => {
      const productos = (await safeFetch('http://localhost:8081/api/inventario/productos')) || [];
      const alertas = productos.filter(p => parseFloat(p.stockActual) <= parseFloat(p.stockMinimo));
      return { productos, alertas };
    },
    renderCard: (d) => {
      const alertas = d.alertas || [];
      if (alertas.length === 0) return '<div class="empty-dash">✅ Todos los productos tienen stock suficiente</div>';
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
      return html;
    }
  },
  {
    id: 'personal',
    permiso: 'GESTIONAR_PERSONAL',
    kpis: [
      { label: 'Colaboradores', sub: 'personal registrado', val: d => d.list.length },
      { label: 'Activos', sub: 'actualmente activos', val: d => d.list.filter(p => p.activo).length }
    ],
    card: { titulo: '👤 Últimos colaboradores' },
    load: async () => ({ list: (await safeFetch('http://localhost:8081/api/personal')) || [] }),
    renderCard: (d) => {
      const list = d.list || [];
      if (list.length === 0) return '<div class="empty-dash">No hay personal registrado</div>';
      let html = '<div style="display:flex;flex-direction:column">';
      list.slice(-5).reverse().forEach(p => {
        html += `<div class="dash-row">
          <span class="dash-main">${p.nombres} ${p.apellidos}
            <span class="dash-sub">${p.cargo} · ${p.fechaIngreso ? formatFecha(p.fechaIngreso) : '—'}</span></span>
          <span class="badge ${p.activo ? 'badge-completada' : 'badge-cancelada'}">${p.activo ? 'Activo' : 'Inactivo'}</span>
        </div>`;
      });
      html += '</div>';
      return html;
    }
  },
  {
    id: 'proveedores',
    permiso: 'GESTIONAR_PROVEEDORES',
    kpis: [
      { label: 'Proveedores', sub: 'registrados', val: d => d.list.length },
      { label: 'Activos', sub: 'habilitados', val: d => d.list.filter(p => p.activo).length }
    ],
    card: { titulo: '🚚 Proveedores' },
    load: async () => ({ list: (await safeFetch('http://localhost:8081/api/proveedores')) || [] }),
    renderCard: (d) => {
      const list = d.list || [];
      if (list.length === 0) return '<div class="empty-dash">No hay proveedores registrados</div>';
      let html = '<div style="display:flex;flex-direction:column">';
      list.slice(-5).reverse().forEach(p => {
        html += `<div class="dash-row">
          <span class="dash-main">${p.nombre}
            <span class="dash-sub">${p.ciudad} · ${p.tipo}</span></span>
          <span class="badge ${p.activo ? 'badge-completada' : 'badge-cancelada'}">${p.activo ? 'Activo' : 'Inactivo'}</span>
        </div>`;
      });
      html += '</div>';
      return html;
    }
  },
  {
    id: 'comercial',
    permiso: 'GESTIONAR_VENTAS',
    kpis: [
      { label: 'Facturas emitidas', sub: 'documentos registrados', val: d => d.list.length },
      { label: 'Pendientes de cobro', sub: 'facturas sin pagar', val: d => d.list.filter(f => f.estado !== 'PAGADA' && f.estado !== 'ANULADA').length }
    ],
    card: { titulo: '🧾 Facturación reciente' },
    load: async () => ({ list: (await safeFetch('http://localhost:8081/api/facturacion')) || [] }),
    renderCard: (d) => {
      const list = d.list || [];
      if (list.length === 0) return '<div class="empty-dash">No hay facturas registradas</div>';
      let html = '<div style="display:flex;flex-direction:column">';
      list.slice(-5).reverse().forEach(f => {
        const badge = f.estado === 'PAGADA' ? '<span class="badge badge-completada">✓ Pagada</span>'
          : f.estado === 'ANULADA' ? '<span class="badge badge-cancelada">✕ Anulada</span>'
          : '<span class="badge badge-pendiente">⏳ Emitida</span>';
        html += `<div class="dash-row">
          <span class="dash-main">#${f.numeroFactura}
            <span class="dash-sub">${f.nombreCliente} · ${formatFecha(f.fechaEmision)}</span></span>
          <span style="font-family:\'IBM Plex Mono\',monospace;font-weight:700;color:var(--text-dark)">$${fmtNum(f.total)}</span>
          ${badge}
        </div>`;
      });
      html += '</div>';
      return html;
    }
  }
];

async function cargarDashboard() {
  const kpiGrid = document.getElementById('kpiGrid');
  const cardsGrid = document.getElementById('cardsGrid');
  const sub = document.getElementById('dashSub');

  const permitidos = WIDGETS.filter(w => tienePermiso(w.permiso));
  const titulos = {
    GESTIONAR_CULTIVO: 'Producción agrícola',
    GESTIONAR_COSECHA: 'Producción agrícola',
    GESTIONAR_PERSONAL: 'Gestión de personal',
    GESTIONAR_PROVEEDORES: 'Compras y proveedores',
    GESTIONAR_VENTAS: 'Área comercial',
    VER_INVENTARIO: 'Inventario'
  };
  const primero = permitidos[0];
  if (sub && primero) sub.textContent = titulos[primero.permiso];
  if (sub && !primero) sub.textContent = 'Resumen general del sistema';

  try {
    const datos = {};
    await Promise.all(permitidos.map(async w => {
      datos[w.id] = await w.load();
    }));

    // KPIs
    const kpiHTML = [];
    permitidos.forEach(w => {
      (w.kpis || []).forEach(k => {
        let val;
        try { val = k.val(datos[w.id] || {}); } catch { val = '—'; }
        kpiHTML.push(`
          <div class="kpi-card">
            <div class="kpi-label">${k.label}</div>
            <div class="kpi-value">${val}</div>
            <div class="kpi-sub">${k.sub}</div>
          </div>
        `);
      });
    });
    kpiGrid.innerHTML = kpiHTML.join('');

    // Cards
    const cardHTML = permitidos.map(w => `
      <div class="dash-card">
        <div class="dash-card-title">${w.card.titulo} <span class="count"></span></div>
        <div>${w.renderCard(datos[w.id] || {})}</div>
      </div>
    `);
    cardsGrid.innerHTML = cardHTML.join('');
  } catch (e) {
    console.error('Error al cargar dashboard:', e);
    showToast('Error al cargar el dashboard', 'error');
    kpiGrid.innerHTML = '';
    cardsGrid.innerHTML = '';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const userData = JSON.parse(localStorage.getItem('usuario') || '{}');
  if (userData && userData.username) {
    document.getElementById('dashUser').textContent = userData.nombres
      ? `${userData.nombres} ${userData.apellidos || ''}`.trim()
      : userData.username;
    document.getElementById('dashRol').textContent = userData.rol || '';
  }
  cargarDashboard();
});
