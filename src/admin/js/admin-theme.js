const STORAGE_KEY = 'rce_admin_theme'
const THEME_ATTR = 'data-theme'
const TOGGLE_ID = 'adminThemeToggle'

function getStoredTheme () {
  try {
    const savedTheme = localStorage.getItem(STORAGE_KEY)
    if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme
  } catch (error) {
    console.warn('Unable to read admin theme preference:', error)
  }

  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

function applyTheme (theme) {
  document.documentElement.setAttribute(THEME_ATTR, theme)
  document.body?.setAttribute(THEME_ATTR, theme)
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch (error) {
    console.warn('Unable to persist admin theme preference:', error)
  }
  updateToggleLabel(theme)
}

function updateToggleLabel (theme) {
  const button = document.getElementById(TOGGLE_ID)
  if (!button) return

  const isLight = theme === 'light'
  button.innerHTML = isLight
    ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"/></svg><span>Dark Mode</span>'
    : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2"/><path d="M12 21v2"/><path d="M4.22 4.22l1.42 1.42"/><path d="M18.36 18.36l1.42 1.42"/><path d="M1 12h2"/><path d="M21 12h2"/><path d="M4.22 19.78l1.42-1.42"/><path d="M18.36 5.64l1.42-1.42"/></svg><span>Light Mode</span>'
  button.setAttribute('aria-pressed', String(isLight))
}

function createToggleButton () {
  if (document.getElementById(TOGGLE_ID)) return

  const target = document.querySelector('.admin-header__right') || document.querySelector('.admin-login__actions') || document.querySelector('.admin-login__card') || document.body
  if (!target) return

  const button = document.createElement('button')
  button.id = TOGGLE_ID
  button.type = 'button'
  button.className = 'admin-theme-toggle'
  button.addEventListener('click', () => {
    const nextTheme = document.documentElement.getAttribute(THEME_ATTR) === 'light' ? 'dark' : 'light'
    applyTheme(nextTheme)
  })

  if (target.classList?.contains('admin-header__right')) {
    target.prepend(button)
  } else {
    target.appendChild(button)
  }
}

function initializeTheme () {
  const theme = getStoredTheme()
  applyTheme(theme)
  createToggleButton()
  updateToggleLabel(theme)
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeTheme, { once: true })
} else {
  initializeTheme()
}
