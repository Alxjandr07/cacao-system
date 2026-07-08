/* =====================================================
   CacaoGest — login.js
   ===================================================== */
const API = 'http://localhost:8080/api/auth';

async function login() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const errorBox = document.getElementById('loginError');
  const errorMsg = document.getElementById('loginErrorMsg');

  if (!username || !password) {
    errorMsg.textContent = 'Por favor ingresa usuario y contraseña.';
    errorBox.classList.add('show');
    return;
  }

  try {
    const res = await fetch(`${API}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (!res.ok) {
      errorMsg.textContent = data.error || 'Credenciales incorrectas. Intenta de nuevo.';
      errorBox.classList.add('show');
      return;
    }

    errorBox.classList.remove('show');
    localStorage.setItem('usuario', JSON.stringify(data));
    window.location.href = 'dashboard.html';

  } catch {
    errorMsg.textContent = 'No se pudo conectar con el servidor.';
    errorBox.classList.add('show');
  }
}

document.addEventListener('keydown', e => {
  if (e.key === 'Enter') login();
});