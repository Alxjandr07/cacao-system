/* =====================================================
   CacaoGest — app.js (compartido: autorización de menú + fetch)
   ===================================================== */

const MODULO_PERMISO = {
  'dashboard':   null,
  'usuarios':    'GESTIONAR_USUARIOS',
  'personal':    'GESTIONAR_PERSONAL',
  'clientes':    'GESTIONAR_VENTAS',
  'proveedores': 'GESTIONAR_PROVEEDORES',
  'inventario':  'VER_INVENTARIO',
  'cultivo':     'GESTIONAR_CULTIVO',
  'cosecha':     'GESTIONAR_COSECHA',
  'ventas':      'GESTIONAR_VENTAS',
  'facturacion': 'GESTIONAR_VENTAS',
  'trazabilidad':'GESTIONAR_COSECHA'
};

function getUsuarioActual() {
  try { return JSON.parse(localStorage.getItem('usuario') || '{}'); }
  catch { return {}; }
}

function tienePermiso(permiso) {
  const u = getUsuarioActual();
  if (!u.username) return false;
  if (u.rol === 'ADMIN') return true;
  return (u.permisos || []).includes(permiso);
}

// 1) Inyectar header X-Username en todas las peticiones a /api/
(function () {
  const origFetch = window.fetch;
  window.fetch = function (url, opts) {
    opts = opts || {};
    const u = getUsuarioActual();
    const esApi = (typeof url === 'string' && url.indexOf('/api/') !== -1);
    if (esApi && u.username) {
      opts.headers = new Headers(opts.headers || {});
      opts.headers.set('X-Username', u.username);
    }
    return origFetch(url, opts);
  };
})();

// 2) Ocultar del menú los apartados que el rol no puede ver
function aplicarPermisosMenu() {
  document.querySelectorAll('.nav-body').forEach(body => {
    body.querySelectorAll('.nav-item').forEach(item => {
      const href = (item.getAttribute('href') || '').replace(/^\.?\//, '');
      const key = href.toLowerCase().replace('.html', '');
      const requerido = MODULO_PERMISO[key];
      if (requerido && !tienePermiso(requerido)) {
        item.style.display = 'none';
      }
    });
    body.querySelectorAll('.nav-section-label').forEach(lbl => {
      let sib = lbl.nextElementSibling;
      let hayVisible = false;
      while (sib && sib.classList && !sib.classList.contains('nav-section-label')) {
        if (sib.classList.contains('nav-item') && sib.style.display !== 'none') {
          hayVisible = true;
        }
        sib = sib.nextElementSibling;
      }
      if (!hayVisible) lbl.style.display = 'none';
    });
  });
}

// 3) Redirigir si el usuario no puede ver la página actual
function primerModuloPermitido() {
  const u = getUsuarioActual();
  const orden = ['dashboard','inventario','cultivo','cosecha','trazabilidad','clientes','ventas','facturacion','personal','usuarios','proveedores'];
  for (const key of orden) {
    const req = MODULO_PERMISO[key];
    if (!req || tienePermiso(req)) return key + '.html';
  }
  return null;
}

function verificarAccesoPagina() {
  const u = getUsuarioActual();
  if (!u.username) { window.location.href = 'login.html'; return; }
  const pag = (location.pathname.split('/').pop() || '').toLowerCase().replace('.html', '');
  const requerido = MODULO_PERMISO[pag];
  if (requerido && !tienePermiso(requerido)) {
    const destino = primerModuloPermitido();
    window.location.href = destino || 'login.html';
  }
}

function cerrarSesionApp() {
  localStorage.removeItem('usuario');
  window.location.href = 'login.html';
}

// 4) Poblar el perfil del usuario en el sidebar (todos los módulos)
function poblarSidebarUsuario() {
  const su = document.querySelector('.sidebar-user');
  if (!su) return;
  const u = getUsuarioActual();
  const nombreText = u.nombres ? (u.nombres + ' ' + (u.apellidos || '')).trim() : (u.username || 'Usuario');
  const rolText = u.rol || '';

  const uname = su.querySelector('.uname');
  const urole = su.querySelector('.urole');
  if (uname) uname.textContent = nombreText;
  if (urole) urole.textContent = rolText;

  if (su.querySelector('.logout-btn')) { su.classList.add('ready'); return; }

  const avatar = su.querySelector('.user-avatar');
  const info = su.querySelector('.user-info');
  if (avatar && info) {
    const row = document.createElement('div');
    row.className = 'user-row';
    avatar.parentNode.insertBefore(row, avatar);
    row.appendChild(avatar);
    row.appendChild(info);
  }
  const chev = su.querySelector('.user-chevron');
  if (chev) chev.remove();

  const btn = document.createElement('button');
  btn.className = 'logout-btn';
  btn.textContent = '→ Cerrar sesión';
  btn.onclick = cerrarSesionApp;
  su.appendChild(btn);
  su.classList.add('logout');
  su.classList.add('ready');
}

function inicializarApp() {
  aplicarPermisosMenu();
  document.querySelectorAll('.nav-body').forEach(b => b.classList.add('ready'));
  verificarAccesoPagina();
}

// Ejecuta lo antes posible: el HTML del sidebar ya fue parseado porque
// app.js se carga al final del body, así ocultamos el menú sin destello.
poblarSidebarUsuario();
inicializarApp();

document.addEventListener('DOMContentLoaded', () => {
  poblarSidebarUsuario();
  inicializarApp();
});
