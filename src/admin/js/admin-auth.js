import { supabase } from './admin-supabase.js'

const LOGIN_PAGE    = '/admin/login.html'
const DASHBOARD_PAGE = '/admin/dashboard.html'

// ── Guard — call at top of every protected page ──────────────
export async function requireAuth () {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    window.location.replace(LOGIN_PAGE)
    return null
  }
  return session
}

// ── Login ─────────────────────────────────────────────────────
export async function loginWithEmail (email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

// ── Logout ────────────────────────────────────────────────────
export async function logout () {
  await supabase.auth.signOut()
  window.location.replace(LOGIN_PAGE)
}

// ── Redirect if already logged in (use on login page) ────────
export async function redirectIfAuthenticated () {
  const { data: { session } } = await supabase.auth.getSession()
  if (session) window.location.replace(DASHBOARD_PAGE)
}

// ── Get current user display info ────────────────────────────
export async function getCurrentUser () {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user ?? null
}