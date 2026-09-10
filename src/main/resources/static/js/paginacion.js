/* =====================================================
   CacaoGest — paginacion.js (paginación cliente compartida)
   Uso:
     Pag.registrar(clave, tbodyId, contId, porPagina);
     Pag.pintar(clave, filasHtml[], vacioHtml);
   ===================================================== */
window.Pag = {
  _tablas: {},

  registrar(clave, tbodyId, contId, porPagina) {
    Pag._tablas[clave] = {
      tbody: document.getElementById(tbodyId),
      cont: document.getElementById(contId),
      porPagina: porPagina || 8,
      filas: [],
      pagina: 1,
      vacio: ''
    };
    return Pag._tablas[clave];
  },

  pintar(clave, filas, vacioHtml) {
    const t = Pag._tablas[clave];
    if (!t) return;
    t.filas = filas || [];
    t.vacio = vacioHtml || '<tr><td class="empty-state">Sin registros</td></tr>';
    t.pagina = 1;
    Pag._dibujar(clave);
  },

  ir(clave, pagina) {
    const t = Pag._tablas[clave];
    if (!t) return;
    t.pagina = pagina;
    Pag._dibujar(clave);
  },

  _dibujar(clave) {
    const t = Pag._tablas[clave];
    if (!t || !t.tbody) return;
    const total    = t.filas.length;
    const totalPag = Math.max(1, Math.ceil(total / t.porPagina));
    if (t.pagina > totalPag) t.pagina = totalPag;

    if (total === 0) {
      t.tbody.innerHTML = t.vacio;
      if (t.cont) t.cont.innerHTML = '';
      return;
    }
    const ini = (t.pagina - 1) * t.porPagina;
    const fin = Math.min(ini + t.porPagina, total);
    t.tbody.innerHTML = t.filas.slice(ini, fin).join('');

    if (t.cont) {
      if (total <= t.porPagina) {
        t.cont.innerHTML = `<div class="pag-info">${total} registro(s)</div>`;
      } else {
        t.cont.innerHTML =
          `<div class="pag-info">Mostrando ${ini + 1}–${fin} de ${total}</div>` +
          '<div class="pag-botones">' +
            `<button class="pag-btn" onclick="Pag.ir('${clave}', ${t.pagina - 1})" ${t.pagina === 1 ? 'disabled' : ''}>← Anterior</button>` +
            `<span class="pag-pagina">Página ${t.pagina} / ${totalPag}</span>` +
            `<button class="pag-btn" onclick="Pag.ir('${clave}', ${t.pagina + 1})" ${t.pagina === totalPag ? 'disabled' : ''}>Siguiente →</button>` +
          '</div>';
      }
    }
  }
};