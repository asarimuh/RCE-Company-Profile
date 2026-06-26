import { requireAuth, logout, getCurrentUser } from './admin-auth.js'
import { supabase } from './admin-supabase.js'
import { formatDate, platformBadge, getInitials, getPrimaryHandle, setHeaderDate, setSidebarUser } from './admin-utils.js'
import '../css/admin-base.css'
import '../css/admin-layout.css'

// ── Auth guard ────────────────────────────────────────────────
const session = await requireAuth()
if (!session) throw new Error('Unauthenticated')

// ── Init UI ───────────────────────────────────────────────────
setHeaderDate()
const user = await getCurrentUser()
setSidebarUser(user)

document.getElementById('logoutBtn').addEventListener('click', logout)

// ── Load stats ────────────────────────────────────────────────
async function loadStats () {
  const now      = new Date()
  const todayStr = now.toISOString().slice(0, 10)
  const monthStr = now.toISOString().slice(0, 7)

  const [
    { count: total, error: e1 },
    { count: today, error: e2 },
    { count: month, error: e3 },
  ] = await Promise.all([
    supabase
      .from('talent_registrations')
      .select('*', { count: 'exact', head: true }),

    supabase
      .from('talent_registrations')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${todayStr}T00:00:00`),

    supabase
      .from('talent_registrations')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${monthStr}-01T00:00:00`),
  ])

  if (e1 || e2 || e3) {
    console.error('Stats error:', e1 || e2 || e3)
  }

  document.getElementById('statTotal').textContent = total ?? 0
  document.getElementById('statToday').textContent = today ?? 0
  document.getElementById('statMonth').textContent = month ?? 0

  document.getElementById('statTotalSub').textContent = 'total semua waktu'
  document.getElementById('statTodaySub').textContent = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })
  document.getElementById('statMonthSub').textContent = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
}

// ── Load recent registrations ─────────────────────────────────
async function loadRecent () {
  const { data, error } = await supabase
    .from('talent_registrations')
    .select('id, full_name, primary_platform, tiktok_handle, instagram_handle, youtube_handle, city, created_at')
    .order('created_at', { ascending: false })
    .limit(10)

  const container = document.getElementById('recentList')

  if (error || !data?.length) {
    container.innerHTML = `
      <div class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
        <h3>Belum ada pendaftar</h3>
        <p>Pendaftaran baru akan muncul di sini.</p>
      </div>`
    return
  }

  container.innerHTML = data.map(row => `
    <div class="recent-item" data-id="${row.id}">
      <div class="recent-item__avatar">${getInitials(row.full_name)}</div>
      <div class="recent-item__info">
        <div class="recent-item__name">${row.full_name}</div>
        <div class="recent-item__meta">${platformBadge(row.primary_platform).replace(/<[^>]+>/g, '')} · @${getPrimaryHandle(row)} · ${row.city ?? '—'}</div>
      </div>
      <div class="recent-item__date">${formatDate(row.created_at)}</div>
    </div>
  `).join('')

  // Click → go to KOL database with id param
  container.querySelectorAll('.recent-item').forEach(el => {
    el.addEventListener('click', () => {
      window.location.href = `kol-database.html?open=${el.dataset.id}`
    })
  })
}

// ── Run ───────────────────────────────────────────────────────
await Promise.all([loadStats(), loadRecent()])