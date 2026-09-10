const { test, expect } = require('@playwright/test');

const ADMIN = { username: 'admin', password: 'Admin123' };

async function loginOK(page) {
  await page.goto('/login.html');
  await page.fill('#username', ADMIN.username);
  await page.fill('#password', ADMIN.password);
  await page.click('.btn-login');
  await page.waitForURL('**/dashboard.html');
}

const PAGES = [
  { name: 'clientes', url: '/clientes.html', tbody: '#tablaBody', cont: '#pag-tablaBody' },
  { name: 'personal', url: '/personal.html', tbody: '#tablaBody', cont: '#pag-tablaBody' },
  { name: 'proveedores', url: '/proveedores.html', tbody: '#tablaBody', cont: '#pag-tablaBody' },
  { name: 'inventario', url: '/inventario.html', tbody: '#tablaBody', cont: '#pag-tablaBody' },
  { name: 'cosecha', url: '/cosecha.html', tbody: '#tablaBody', cont: '#pag-tablaBody' },
  { name: 'facturacion', url: '/facturacion.html', tbody: '#tablaBody', cont: '#pag-tablaBody' },
  { name: 'trazabilidad', url: '/trazabilidad.html', tbody: '#tablaBody', cont: '#pag-tablaBody' },
  { name: 'usuarios', url: '/usuarios.html', tbody: '#tablaUsuariosBody', cont: '#pag-tablaUsuariosBody' },
  { name: 'auditoria', url: '/auditoria.html', tbody: '#tablaAuditoriaBody', cont: '#pag-tablaAuditoriaBody' },
];

test('PAG-e2e · navegacion con datos sinteticos', async ({ page }) => {
  await loginOK(page);
  await page.goto('/clientes.html');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  const filas = Array.from({ length: 40 }, (_, i) =>
    `<tr><td class="name">Cliente ${i + 1}</td><td>0999</td><td>a${i + 1}@x.com</td><td>—</td><td>Quito</td><td>CI</td><td><span class="badge">A</span></td><td></td></tr>`);
  await page.evaluate((filas) => {
    Pag.pintar('clientes', filas, '<tr><td colspan="8" class="empty-state">vacío</td></tr>');
  }, filas);

  const filasPag1 = await page.locator('#tablaBody tr').count();
  const info1 = await page.locator('#pag-tablaBody').textContent();
  expect(filasPag1).toBe(8);
  expect(info1).toContain('Página 1 / 5');

  await page.click('#pag-tablaBody button.pag-btn:has-text("Siguiente")');
  const filasPag2 = await page.locator('#tablaBody tr').count();
  const info2 = await page.locator('#pag-tablaBody').textContent();
  expect(filasPag2).toBe(8);
  expect(info2).toContain('Página 2 / 5');
  expect(await page.locator('#tablaBody tr').first().textContent()).toContain('Cliente 9');

  await page.click('#pag-tablaBody button.pag-btn:has-text("Anterior")');
  expect(await page.locator('#pag-tablaBody')).toContainText('Página 1 / 5');
});

test('PAG-e2e · sin errores de consola y paginacion operativa', async ({ page }) => {
  const consoleErrors = [];
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', e => consoleErrors.push('PAGEERROR: ' + e.message));

  await loginOK(page);

  for (const p of PAGES) {
    await page.goto(p.url);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);

    const info = await page.evaluate(({ cont, tbody }) => {
      const rows = document.querySelectorAll(`${tbody} tr`).length;
      const c = document.querySelector(cont);
      const hasBotones = c ? !!c.querySelector('.pag-botones') : false;
      const topbar = document.querySelector('.topbar');
      return { rows, hasBotones, topbarPos: topbar ? getComputedStyle(topbar).position : 'NO_TOPBAR' };
    }, p);
    console.log(`[${p.name}] filas=${info.rows} paginado=${info.hasBotones} topbar=${info.topbarPos}`);

    if (info.rows > 8) {
      expect(info.hasBotones).toBe(true);
      const before = await page.locator(p.cont).textContent();
      await page.click(`${p.cont} button.pag-btn:has-text("Siguiente")`);
      await page.waitForTimeout(300);
      const after = await page.locator(p.cont).textContent();
      console.log(`       "${before.trim()}" -> "${after.trim()}"`);
      expect(before).not.toBe(after);
    }

    const realErrors = consoleErrors.filter(e => !/Failed to load resource/.test(e) && !/favicon/.test(e));
    expect(realErrors).toEqual([]);
  }
});