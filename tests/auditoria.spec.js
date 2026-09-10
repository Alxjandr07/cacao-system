const { test, expect } = require('@playwright/test');

test('AUD-e2e · respaldos cargan y auditoria muestra IP + Ver detalles', async ({ page }) => {
  const consoleErrors = [];
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', e => consoleErrors.push('PAGEERROR: ' + e.message));

  await page.goto('/login.html');
  await page.fill('#username', 'admin');
  await page.fill('#password', 'Admin123');
  await page.click('.btn-login');
  await page.waitForURL('**/dashboard.html');

  await page.goto('/auditoria.html');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);

  // Pestaña Respaldos
  await page.click('#tabRespaldos');
  await page.waitForTimeout(1000);
  const respaldoState = await page.locator('#tablaRespaldosBody').textContent();
  console.log(`[respaldos] ${respaldoState.trim().slice(0, 120)}`);
  expect(respaldoState).toContain('cacao_backup');
  expect(respaldoState).not.toContain('Error al cargar los respaldos');

  // Pestaña Auditoría: IP en detalle y "Ver detalles"
  await page.click('#tabAuditoria');
  await page.waitForTimeout(800);
  const primerRegistro = page.locator('#tablaAuditoriaBody tr').first();
  const celdas = primerRegistro.locator('td');
  const ipCelda = await celdas.nth(5).textContent();
  const detalleText = await celdas.nth(6).textContent();
  console.log(`[auditoria] ip="${ipCelda.trim()}" detalle="${detalleText.trim()}"`);
  expect(ipCelda.trim()).toBe('127.0.0.1');
  expect(detalleText.trim()).toContain('Ver detalles');

  // Abrir modal de detalle
  await celdas.nth(6).locator('button').click();
  await expect(page.locator('#modalDetalle')).toHaveClass(/open/);
  const contenido = await page.locator('#detalleTexto').textContent();
  console.log(`[modal] largo=${contenido.length} inicio="${contenido.slice(0, 80)}"`);
  expect(contenido.trim().length).toBeGreaterThan(0);
  await page.click('#modalDetalle .btn-outline');

  // Sin errores de JS reales
  const real = consoleErrors.filter(e => !/Failed to load resource/.test(e) && !/favicon/.test(e));
  expect(real).toEqual([]);
});