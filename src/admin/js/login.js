import { loginWithEmail, redirectIfAuthenticated } from './admin-auth.js'
import '../css/admin-base.css'
import '../css/admin-login.css'

// Redirect if already logged in
await redirectIfAuthenticated()

const form          = document.getElementById('loginForm')
const emailInput    = document.getElementById('email')
const passwordInput = document.getElementById('password')
const emailError    = document.getElementById('emailError')
const passwordError = document.getElementById('passwordError')
const loginError    = document.getElementById('loginError')
const loginBtn      = document.getElementById('loginBtn')
const loginLabel    = document.getElementById('loginLabel')
const loginSpinner  = document.getElementById('loginSpinner')
const togglePass    = document.getElementById('togglePassword')

// ── Toggle password visibility ────────────────────────────────
togglePass.addEventListener('click', () => {
  const isPassword = passwordInput.type === 'password'
  passwordInput.type = isPassword ? 'text' : 'password'
  document.getElementById('eyeIcon').style.opacity = isPassword ? '0.4' : '1'
})

// ── Validate ──────────────────────────────────────────────────
function validate () {
  let valid = true
  emailError.textContent = ''
  passwordError.textContent = ''
  loginError.textContent = ''

  const email = emailInput.value.trim()
  const pass  = passwordInput.value

  if (!email) {
    emailError.textContent = 'Email wajib diisi.'
    valid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    emailError.textContent = 'Format email tidak valid.'
    valid = false
  }

  if (!pass) {
    passwordError.textContent = 'Password wajib diisi.'
    valid = false
  } else if (pass.length < 6) {
    passwordError.textContent = 'Password minimal 6 karakter.'
    valid = false
  }

  return valid
}

// ── Submit ────────────────────────────────────────────────────
form.addEventListener('submit', async (e) => {
  e.preventDefault()
  if (!validate()) return

  loginLabel.textContent = 'Memproses...'
  loginSpinner.hidden = false
  loginBtn.disabled = true

  try {
    await loginWithEmail(emailInput.value.trim(), passwordInput.value)
    window.location.replace('/admin/dashboard.html')
  } catch (err) {
    loginError.textContent = 'Email atau password salah. Silakan coba lagi.'
    loginLabel.textContent = 'Masuk'
    loginSpinner.hidden = true
    loginBtn.disabled = false
  }
})