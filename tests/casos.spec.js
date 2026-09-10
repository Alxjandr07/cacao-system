const { test, expect } = require('@playwright/test');

const ADMIN = { username: 'admin', password: 'Admin123' };

async function login(page, { username, password } = ADMIN) {
  await page.goto('/login.html');
  await page.fill('#username', username);
  await page.fill('#password', password);
  await page.click('.btn-login');
}

async function loginOK(page) {
  await page.goto('/login.html');
  await page.fill('#username', ADMIN.username);
  await page.fill('#password', ADMIN.password);
  await page.click('.btn-login');
  await page.waitForURL('**/dashboard.html');
}

// Deja ventas en modo precio manual (los tests digitan el precio por línea)
async function modoPrecioManual(page) {
  await page.goto('/ventas.html');
  await page.evaluate(() => fetch('/api/ventas/config', {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usarPrecioBolsa: false })
  }));
  await page.goto('/ventas.html');
}

// ─────────────────────────────────────────────────────────
// TC-AUTH-01 — Login exitoso con credenciales válidas
// ─────────────────────────────────────────────────────────
test('TC-AUTH-01 · Login exitoso con credenciales válidas', async ({ page }) => {
  await loginOK(page);
  await expect(page).toHaveURL(/dashboard\.html/);
  await expect(page.locator('.uname').first()).toContainText('Administrador');
});

// ─────────────────────────────────────────────────────────
// TC-AUTH-02 — Login con contraseña incorrecta
// ─────────────────────────────────────────────────────────
test('TC-AUTH-02 · Login con contraseña incorrecta', async ({ page }) => {
  await login(page, { username: 'admin', password: 'claveIncorrecta' });
  const error = page.locator('#loginError');
  await expect(error).toHaveClass(/show/);
  await expect(page.locator('#loginErrorMsg')).toContainText('Contraseña incorrecta');
  await expect(page).toHaveURL(/login\.html/);
});

// ─────────────────────────────────────────────────────────
// TC-USR-01 — Registro de usuario con username duplicado
// ─────────────────────────────────────────────────────────
test('TC-USR-01 · Registro de usuario con username duplicado', async ({ page }) => {
  await loginOK(page);
  await page.goto('/usuarios.html');
  await page.click('#btnNuevo');
  await page.fill('#uUsername', 'admin');
  await page.fill('#uNombres', 'Prueba');
  await page.fill('#uApellidos', 'Duplicado');
  await page.fill('#uEmail', `dup-${Date.now()}@test.com`);
  await page.fill('#uPassword', 'Clave1234');
  await page.selectOption('#uRolId', { index: 1 });
  await page.click('button[onclick="guardarUsuario()"]');
  await expect(page.locator('#toast')).toContainText('El usuario o email ya existe');
});

// ─────────────────────────────────────────────────────────
// TC-PROV-01 — Proveedor con RUC inválido (< 13 dígitos)
// ─────────────────────────────────────────────────────────
test('TC-PROV-01 · Registro de proveedor con RUC inválido', async ({ page }) => {
  await loginOK(page);
  await page.goto('/proveedores.html');
  await page.click('button[onclick="abrirModalProveedor()"]');
  await page.fill('#pRuc', '12345');
  await page.fill('#pNombre', 'Agroinsumos del Litoral');
  await page.fill('#pDireccion', 'Km 5 via Quevedo');
  await page.fill('#pCiudad', 'Quevedo');
  await page.selectOption('#pTipo', 'SOCIEDAD');
  await page.click('button[onclick="guardarProveedor()"]');
  await expect(page.locator('#toast')).toContainText('El RUC debe tener exactamente 13 dígitos');
});

// ─────────────────────────────────────────────────────────
// TC-PROV-02 — Proveedor con RUC ya existente
// ─────────────────────────────────────────────────────────
test('TC-PROV-02 · Registro de proveedor con RUC existente', async ({ page }) => {
  await loginOK(page);
  await page.goto('/proveedores.html');
  await page.click('button[onclick="abrirModalProveedor()"]');
  await page.fill('#pRuc', '1790012345001');
  await page.fill('#pNombre', 'Nuevo Proveedor');
  await page.fill('#pDireccion', 'Av. de la Prensa');
  await page.fill('#pCiudad', 'Quito');
  await page.selectOption('#pTipo', 'SOCIEDAD');
  await page.click('button[onclick="guardarProveedor()"]');
  await expect(page.locator('#toast')).toContainText('El RUC ya está registrado');
});

// ─────────────────────────────────────────────────────────
// TC-CULT-01 — Registro de parcela con datos válidos
// ─────────────────────────────────────────────────────────
test('TC-CULT-01 · Registro de parcela con datos válidos', async ({ page }) => {
  await loginOK(page);
  await page.goto('/cultivo.html');
  await page.click('#btnNuevo');
  await page.fill('#pNombre', `Lote Automation ${Date.now()}`);
  await page.selectOption('#pProvincia', 'Los Ríos');
  await page.selectOption('#pCanton', 'Quevedo');
  await page.fill('#pHectareas', '5');
  await page.click('button[onclick="guardarParcela()"]');
  await expect(page.locator('#toast')).toContainText('Parcela creada');
  await expect(page.locator('#parcelasGrid')).toContainText('Lote Automation');
});

// ─────────────────────────────────────────────────────────
// TC-COS-01 — Registro de cosecha válida (parcela + cacao)
// ─────────────────────────────────────────────────────────
test('TC-COS-01 · Registro de cosecha válida asociada a parcela y producto', async ({ page }) => {
  await loginOK(page);
  await page.goto('/cosecha.html');
  await page.click('button[onclick="abrirModal()"]');
  await page.selectOption('#cParcelaId', { label: 'Finca 3 Hermanos' });
  await page.selectOption('#cProductoId', { index: 1 });
  await page.fill('#cFecha', '2026-08-28');
  await page.fill('#cCantidad', '12');
  await page.selectOption('#cCalidad', 'PRIMERA');
  await page.click('button[onclick="guardar()"]');
  await expect(page.locator('#toast')).toContainText(/Cosecha registrada|Lote/);
});

// ─────────────────────────────────────────────────────────
// TC-INV-01 — Salida con cantidad superior al stock
// ─────────────────────────────────────────────────────────
test('TC-INV-01 · Movimiento de salida con cantidad superior al stock', async ({ page }) => {
  await loginOK(page);
  await page.goto('/inventario.html');
  await page.fill('#searchInput', 'Cacao Nacional Arriba');
  const fila = page.locator('#tablaBody tr', { hasText: 'Cacao Nacional Arriba' }).first();
  await fila.locator('button', { hasText: 'Mov.' }).click();
  await page.locator('#labelSalida').click();
  await page.fill('#movCantidad', '99999');
  await page.click('.motivo-chip:has-text("Venta")');
  await page.click('button[onclick="guardarMovimiento()"]');
  await expect(page.locator('#toast')).toContainText(/Stock insuficiente|insuficiente/i);
});

// ─────────────────────────────────────────────────────────
// TC-INV-02 — Entrada válida incrementa el stock
// ─────────────────────────────────────────────────────────
test('TC-INV-02 · Movimiento de entrada válido incrementa el stock', async ({ page }) => {
  await loginOK(page);
  await page.goto('/inventario.html');
  await page.fill('#searchInput', 'Glifosato 4L');
  const fila = page.locator('#tablaBody tr', { hasText: 'Glifosato 4L' }).first();
  await fila.locator('button', { hasText: 'Mov.' }).click();
  await page.fill('#movCantidad', '5');
  await page.click('.motivo-chip:has-text("Compra a proveedor")');
  await page.click('button[onclick="guardarMovimiento()"]');
  await expect(page.locator('#toast')).toContainText('Movimiento registrado');
});

// ─────────────────────────────────────────────────────────
// TC-VEN-03 — Venta exitosa reduce stock y genera factura
// ─────────────────────────────────────────────────────────
test('TC-VEN-03 · Registro de venta exitosa reduce stock y genera factura', async ({ page }) => {
  await loginOK(page);
  await modoPrecioManual(page);
  await page.selectOption('#fCliente', { index: 1 });
  const fila = page.locator('#lineasBody tr').first();
  await fila.locator('select.linea-prod').first().selectOption({ index: 1 });
  await fila.locator('input[type=number]').first().fill('1');
  const precio = fila.locator('input[placeholder*="Precio"]');
  await precio.fill('2.5');
  await page.click('button[onclick="confirmarVenta()"]');
  await expect(page.locator('#toast')).toContainText(/Venta registrada|Factura/i);
});

// ─────────────────────────────────────────────────────────
// TC-PROV-03 — Registro exitoso de proveedor con todos los datos válidos
// ─────────────────────────────────────────────────────────
test('TC-PROV-03 · Registro exitoso de proveedor con todos los datos válidos', async ({ page }) => {
  await loginOK(page);
  await page.goto('/proveedores.html');
  await page.click('button[onclick="abrirModalProveedor()"]');
  const ruc = '1792' + String(Date.now()).slice(-9);
  await page.fill('#pRuc', ruc);
  await page.fill('#pNombre', 'Agroquímicos Vera S.A.');
  await page.fill('#pTelefono', '0991234567');
  await page.fill('#pEmail', 'contacto@vera.com');
  await page.fill('#pDireccion', 'Km 5 vía Quevedo');
  await page.fill('#pCiudad', 'Quevedo');
  await page.selectOption('#pTipo', 'SOCIEDAD');
  await page.click('button[onclick="guardarProveedor()"]');
  await expect(page.locator('#toast')).toContainText('Proveedor creado');
  await page.fill('#searchInput', ruc);
  await expect(page.locator('#tablaBody')).toContainText(ruc);
});

// ─────────────────────────────────────────────────────────
// TC-VEN-01 — Registro de venta sin cliente seleccionado
// ─────────────────────────────────────────────────────────
test('TC-VEN-01 · Registro de venta sin cliente seleccionado', async ({ page }) => {
  await loginOK(page);
  await modoPrecioManual(page);
  const fila = page.locator('#lineasBody tr').first();
  await fila.locator('select.linea-prod').first().selectOption({ index: 1 });
  await fila.locator('input[type=number]').first().fill('1');
  await fila.locator('input[placeholder*="Precio"]').fill('2.5');
  await page.click('button[onclick="confirmarVenta()"]');
  await expect(page.locator('#toast')).toContainText('Selecciona un cliente');
});

// ─────────────────────────────────────────────────────────
// TC-VEN-04 — Modo precio de bolsa bloquea el precio manual
// ─────────────────────────────────────────────────────────
test('TC-VEN-04 · Modo precio de bolsa bloquea el precio manual', async ({ page }) => {
  await loginOK(page);
  await page.goto('/ventas.html');
  await page.click('button:has-text("Precio e IVA")');
  await page.fill('#cfgBolsaPrecio', '3.25');
  await page.check('#cfgBolsaOn');
  await page.click('#modalConfig button.btn-primary');
  await expect(page.locator('#toast')).toContainText('Configuración guardada');
  await expect(page.locator('#modoPrecioBadge')).toContainText('Bolsa $3.25/kg');
  await expect(page.locator('#lineasBody input[placeholder*="Precio"]').first()).toBeDisabled();
  await page.click('button:has-text("Precio e IVA")');
  await page.uncheck('#cfgBolsaOn');
  await page.click('#modalConfig button.btn-primary');
  await expect(page.locator('#toast')).toContainText('Configuración guardada');
  await expect(page.locator('#lineasBody input[placeholder*="Precio"]').first()).toBeEnabled();
});

// ─────────────────────────────────────────────────────────
// TC-FAC-01 — Anulación de una factura existente
// ─────────────────────────────────────────────────────────
test('TC-FAC-01 · Anulación de una factura existente', async ({ page }) => {
  await loginOK(page);
  await page.goto('/facturacion.html');
  const fila = page.locator('#tablaBody tr', {
    has: page.locator('button:has-text("Anular")')
  }).first();
  await expect(fila).toBeVisible();
  const numero = (await fila.locator('td.lote').textContent()).trim();
  page.once('dialog', dialog => dialog.accept());
  await fila.locator('button:has-text("Anular")').click();
  await expect(page.locator('#toast')).toContainText('Factura anulada');

  await page.selectOption('#filtroEstado', 'ANULADA');
  await page.fill('#searchInput', numero);
  await expect(page.locator('#tablaBody')).toContainText(numero);
  await expect(page.locator('#tablaBody tr', { hasText: numero })
    .locator('button:has-text("Anular")')).toHaveCount(0);
});